<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title font-bold">Manajemen User</h1>
        <p class="text-secondary text-sm mt-1">Kelola akun login sistem</p>
      </div>
      <VaButton icon="mso-add" size="small" @click="openModal()">Tambah User</VaButton>
    </div>

    <!-- Filter -->
    <VaCard class="mb-4">
      <VaCardContent>
        <div class="flex flex-col sm:flex-row gap-3">
          <VaInput
            v-model="filters.search"
            placeholder="Cari username, email, nama..."
            class="flex-1"
            clearable
            @update:modelValue="debouncedFetch"
          >
            <template #prependInner><VaIcon name="mso-search" color="secondary" /></template>
          </VaInput>
          <VaSelect
            v-model="filters.role"
            :options="['Admin', 'Employee']"
            placeholder="Semua Role"
            class="w-full sm:w-40"
            clearable
            @update:modelValue="fetchData"
          />
          <VaSelect
            v-model="filters.status"
            :options="['Active', 'Inactive']"
            placeholder="Semua Status"
            class="w-full sm:w-40"
            clearable
            @update:modelValue="fetchData"
          />
        </div>
      </VaCardContent>
    </VaCard>

    <!-- Table -->
    <VaCard>
      <VaCardContent>
        <div class="overflow-x-auto">
          <table class="va-table va-table--hoverable w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Karyawan</th>
                <th>Login Terakhir</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.isLoading">
                <td colspan="6" class="text-center py-8"><VaProgressCircle indeterminate /></td>
              </tr>
              <tr v-else-if="!store.users.length">
                <td colspan="6" class="text-center py-8 text-secondary">Tidak ada data user</td>
              </tr>
              <tr v-for="user in store.users" :key="user.id">
                <td>
                  <div class="flex items-center gap-3">
                    <VaAvatar
                      :fallback-text="user.username.charAt(0).toUpperCase()"
                      size="small"
                      color="primary"
                    />
                    <div>
                      <div class="font-medium">{{ user.username }}</div>
                      <div class="text-xs text-secondary">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <VaBadge :text="user.role" :color="user.role === 'Admin' ? 'primary' : 'secondary'" />
                </td>
                <td>
                  <VaBadge :text="user.status" :color="user.status === 'Active' ? 'success' : 'warning'" />
                </td>
                <td>{{ user.full_name || '—' }}</td>
                <td>{{ user.last_login ? formatDate(user.last_login) : '—' }}</td>
                <td>
                  <div class="flex gap-1 justify-center">
                    <VaButton
                      preset="plain" icon="mso-visibility" size="small" color="secondary"
                      title="Lihat Detail"
                      @click="openDetail(user)"
                    />
                    <VaButton preset="plain" icon="mso-edit" size="small" @click="openModal(user)" />
                    <VaButton
                      preset="plain" icon="mso-delete" size="small" color="danger"
                      @click="confirmDelete(user)"
                    />
                  </div>
                </td>
              </tr>
              <!-- Filler rows untuk menjaga tinggi tabel konsisten -->
              <template v-if="!store.isLoading && store.users.length > 0">
                <tr
                  v-for="i in Math.max(0, 10 - store.users.length)"
                  :key="'filler-' + i"
                >
                  <td colspan="6" style="height: 58px; border-bottom: 1px solid rgba(0,0,0,0.04);"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-if="store.pagination" class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <span class="text-sm text-secondary">
            Menampilkan {{ store.users.length }} dari {{ store.pagination.totalItems }} user
          </span>
          <VaPagination
            v-model="currentPage"
            :pages="store.pagination.totalPages"
            :visible-pages="5"
            @update:modelValue="fetchData"
          />
        </div>
      </VaCardContent>
    </VaCard>

    <!-- Detail Modal -->
    <UserDetailModal
      v-if="showDetail"
      :user="selectedDetailUser!"
      @close="showDetail = false"
      @edit="(u) => { showDetail = false; openModal(u) }"
    />

    <!-- Form Modal -->
    <UserFormModal
      v-if="showModal"
      :user="selectedUser"
      @close="showModal = false"
      @saved="onSaved"
    />

    <!-- Delete Confirm -->
    <VaModal
      v-model="showDeleteModal"
      title="Konfirmasi Hapus"
      ok-text="Ya, Hapus"
      cancel-text="Batal"
      :ok-loading="isDeleting"
      @ok="doDelete"
    >
      <p>Hapus user <strong>{{ userToDelete?.username }}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
    </VaModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vuestic-ui'
import { useUserManagementStore, type User } from '../../stores/userManagement'
import { useNotificationStore } from '../../stores/notificationStore'
import UserFormModal from './components/UserFormModal.vue'
import UserDetailModal from './components/UserDetailModal.vue'

const store = useUserManagementStore()
const notifStore = useNotificationStore()
const { init: toast } = useToast()

const currentPage = ref(1)
const showModal = ref(false)
const showDetail = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const selectedUser = ref<User | null>(null)
const selectedDetailUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)

const filters = reactive({ search: '', role: '', status: '' })

let debounceTimer: ReturnType<typeof setTimeout>
const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchData(), 400)
}

const fetchData = () => store.fetchUsers({
  page: currentPage.value, pageSize: 10,
  search: filters.search || undefined,
  role: filters.role || undefined,
  status: filters.status || undefined,
})

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const openModal = (user: User | null = null) => {
  selectedUser.value = user
  showModal.value = true
}

const openDetail = (user: User) => {
  selectedDetailUser.value = user
  showDetail.value = true
}

const confirmDelete = (user: User) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!userToDelete.value) return
  isDeleting.value = true
  try {
    await store.deleteUser(userToDelete.value.id)
    const name = userToDelete.value.username
    toast({ message: `User ${name} berhasil dihapus`, color: 'success' })
    notifStore.notifyDelete('User', name)
    showDeleteModal.value = false
    fetchData()
  } catch (e: any) {
    toast({ message: e.response?.data?.message || 'Gagal menghapus', color: 'danger' })
  } finally {
    isDeleting.value = false
  }
}

const onSaved = () => {
  showModal.value = false
  fetchData()
  const isEdit = !!selectedUser.value
  const name = selectedUser.value?.username || 'User'
  toast({ message: `Data ${name} berhasil disimpan`, color: 'success' })
  if (isEdit) notifStore.notifyUpdate('User', name)
  else notifStore.notifyCreate('User', name)
}

onMounted(fetchData)
</script>
