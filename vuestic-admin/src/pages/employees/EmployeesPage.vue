<template>
  <div>
    <div class="flex justify-end gap-2 mb-4">
      <VaButton
        v-if="authStore.isAdmin"
        preset="secondary"
        icon="mso-download"
        size="small"
        @click="handleExport('excel')"
      >
        Export Excel
      </VaButton>
      <VaButton
        v-if="authStore.isAdmin"
        preset="secondary"
        icon="mso-picture_as_pdf"
        size="small"
        @click="handleExport('pdf')"
      >
        Export PDF
      </VaButton>
      <VaButton
        v-if="authStore.isAdmin"
        preset="secondary"
        icon="mso-upload_file"
        size="small"
        @click="showImport = true"
      >
        Import Excel/CSV
      </VaButton>
      <VaButton v-if="authStore.isAdmin" icon="mso-add" size="small" @click="openModal()">Tambah Karyawan</VaButton>
    </div>

    <!-- Filter Bar -->
    <VaCard class="mb-4">
      <VaCardContent>
        <div class="flex flex-col sm:flex-row gap-3">
          <VaInput
            v-model="filters.search"
            placeholder="Cari nama, email, kode..."
            class="flex-1"
            clearable
            @update:modelValue="debouncedFetch"
          >
            <template #prependInner>
              <VaIcon name="mso-search" color="secondary" />
            </template>
          </VaInput>
          <VaSelect
            v-model="filters.division"
            :options="divisionOptions"
            placeholder="Semua Divisi"
            class="w-full sm:w-48"
            clearable
            @update:modelValue="fetchData"
          />
          <VaSelect
            v-model="filters.employment_status"
            :options="statusOptions"
            placeholder="Semua Status"
            class="w-full sm:w-44"
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
                <th class="sortable-th" @click="setSort('employee_code')">
                  Kode
                  <VaIcon :name="sortIcon('employee_code')" size="14px" class="sort-icon" />
                </th>
                <th class="sortable-th" @click="setSort('full_name')">
                  Nama Karyawan
                  <VaIcon :name="sortIcon('full_name')" size="14px" class="sort-icon" />
                </th>
                <th class="sortable-th" @click="setSort('division')">
                  Divisi
                  <VaIcon :name="sortIcon('division')" size="14px" class="sort-icon" />
                </th>
                <th class="sortable-th" @click="setSort('position')">
                  Jabatan
                  <VaIcon :name="sortIcon('position')" size="14px" class="sort-icon" />
                </th>
                <th class="sortable-th" @click="setSort('employment_status')">
                  Status
                  <VaIcon :name="sortIcon('employment_status')" size="14px" class="sort-icon" />
                </th>
                <th class="sortable-th" @click="setSort('join_date')">
                  Bergabung
                  <VaIcon :name="sortIcon('join_date')" size="14px" class="sort-icon" />
                </th>
                <th v-if="authStore.isAdmin" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="employeeStore.isLoading">
                <td colspan="7" class="text-center py-8">
                  <VaProgressCircle indeterminate />
                </td>
              </tr>
              <tr v-else-if="!employeeStore.employees.length">
                <td colspan="7" class="text-center py-8 text-secondary">Tidak ada data karyawan ditemukan</td>
              </tr>
              <tr v-for="emp in employeeStore.employees" :key="emp.id">
                <td>
                  <span class="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {{ emp.employee_code }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-3">
                    <VaAvatar
                      :src="emp.profile_photo ? `${apiBase}/uploads/photos/${emp.profile_photo}` : undefined"
                      :fallback-text="emp.full_name.charAt(0)"
                      size="small"
                      color="primary"
                    />
                    <div>
                      <div class="font-medium">{{ emp.full_name }}</div>
                      <div class="text-xs text-secondary">{{ emp.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ emp.division }}</td>
                <td>{{ emp.position }}</td>
                <td>
                  <VaBadge :text="emp.employment_status" :color="statusColor(emp.employment_status)" />
                </td>
                <td>{{ formatDate(emp.join_date) }}</td>
                <td v-if="authStore.isAdmin">
                  <div class="flex gap-1 justify-center">
                    <VaButton
                      preset="plain"
                      icon="mso-visibility"
                      size="small"
                      color="secondary"
                      title="Lihat Detail"
                      @click="openDetail(emp)"
                    />
                    <VaButton preset="plain" icon="mso-edit" size="small" @click="openModal(emp)" />
                    <VaButton
                      preset="plain"
                      icon="mso-delete"
                      size="small"
                      color="danger"
                      @click="confirmDelete(emp)"
                    />
                  </div>
                </td>
              </tr>
              <!-- Filler rows untuk menjaga tinggi tabel konsisten di semua halaman -->
              <template v-if="!employeeStore.isLoading && employeeStore.employees.length > 0">
                <tr
                  v-for="i in Math.max(0, 10 - employeeStore.employees.length)"
                  :key="'filler-' + i"
                  class="filler-row"
                >
                  <td colspan="7" style="height: 58px; border-bottom: 1px solid rgba(0, 0, 0, 0.04)"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="employeeStore.pagination" class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <span class="text-sm text-secondary">
            Menampilkan {{ employeeStore.employees.length }} dari {{ employeeStore.pagination.totalItems }} karyawan
          </span>
          <VaPagination
            v-model="currentPage"
            :pages="employeeStore.pagination.totalPages"
            :visible-pages="5"
            @update:modelValue="fetchData"
          />
        </div>
      </VaCardContent>
    </VaCard>

    <!-- Detail Modal -->
    <EmployeeDetailModal
      v-if="showDetail"
      :employee-id="selectedDetailId!"
      @close="showDetail = false"
      @edit="
        (emp) => {
          showDetail = false
          openModal(emp)
        }
      "
    />

    <!-- Modal Form -->
    <EmployeeFormModal v-if="showModal" :employee="selectedEmployee" @close="showModal = false" @saved="onSaved" />

    <!-- Import Modal -->
    <EmployeeImportModal v-if="showImport" @close="showImport = false" @imported="onImported" />

    <!-- Confirm Delete Modal -->
    <VaModal
      v-model="showDeleteModal"
      title="Konfirmasi Hapus"
      ok-text="Ya, Hapus"
      ok-color="danger"
      cancel-text="Batal"
      :ok-loading="isDeleting"
      @ok="doDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus karyawan
        <strong>{{ employeeToDelete?.full_name }}</strong
        >? Tindakan ini tidak dapat dibatalkan.
      </p>
    </VaModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from 'vuestic-ui'
import { useEmployeeStore, type Employee } from '../../stores/employee'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notificationStore'
import EmployeeFormModal from './components/EmployeeFormModal.vue'
import EmployeeDetailModal from './components/EmployeeDetailModal.vue'
import EmployeeImportModal from './components/EmployeeImportModal.vue'

const employeeStore = useEmployeeStore()
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const { init: toast } = useToast()

const apiBase = 'http://localhost:5000'

const currentPage = ref(1)
const showModal = ref(false)
const showDetail = ref(false)
const showDeleteModal = ref(false)
const showImport = ref(false)
const isDeleting = ref(false)
const selectedEmployee = ref<Employee | null>(null)
const selectedDetailId = ref<number | null>(null)
const employeeToDelete = ref<Employee | null>(null)

// Sort state
const sortField = ref('created_at')
const sortDir = ref<'asc' | 'desc'>('desc')

const sortIcon = (field: string) => {
  if (sortField.value !== field) return 'mso-unfold_more'
  return sortDir.value === 'asc' ? 'mso-keyboard_arrow_up' : 'mso-keyboard_arrow_down'
}

const setSort = (field: string) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
  currentPage.value = 1
  fetchData()
}

const filters = reactive({
  search: '',
  division: '',
  employment_status: '',
})

const statusOptions = ['Active', 'Inactive', 'Resigned']

const divisionOptions = computed(() => employeeStore.divisions)

let debounceTimer: ReturnType<typeof setTimeout>
const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchData(), 400)
}

const fetchData = async () => {
  await employeeStore.fetchEmployees({
    page: currentPage.value,
    pageSize: 10,
    search: filters.search || undefined,
    division: filters.division || undefined,
    employment_status: filters.employment_status || undefined,
    orderBy: sortField.value,
    orderDir: sortDir.value,
  })
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    Active: 'success',
    Inactive: 'warning',
    Resigned: 'danger',
  }
  return map[status] || 'secondary'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const openModal = (emp: Employee | null = null) => {
  selectedEmployee.value = emp
  showModal.value = true
}

const openDetail = (emp: Employee) => {
  selectedDetailId.value = emp.id
  showDetail.value = true
}

const confirmDelete = (emp: Employee) => {
  employeeToDelete.value = emp
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!employeeToDelete.value) return
  isDeleting.value = true
  try {
    await employeeStore.deleteEmployee(employeeToDelete.value.id)
    const name = employeeToDelete.value.full_name
    toast({ message: `Karyawan ${name} berhasil dihapus`, color: 'success' })
    notifStore.notifyDelete('Karyawan', name)
    showDeleteModal.value = false
    fetchData()
  } catch (e: any) {
    toast({ message: e.response?.data?.message || 'Gagal menghapus', color: 'danger' })
  } finally {
    isDeleting.value = false
  }
}

const onSaved = async (empName?: string) => {
  showModal.value = false
  const isEdit = !!selectedEmployee.value
  const name = empName || 'Karyawan'

  if (!isEdit) {
    // Setelah tambah baru: hitung page terakhir berdasarkan total + 1
    const currentTotal = employeeStore.pagination?.totalItems ?? 0
    const pageSize = 10
    const newTotal = currentTotal + 1
    const lastPage = Math.ceil(newTotal / pageSize)
    currentPage.value = lastPage
  }

  await fetchData()

  toast({ message: `Data ${name} berhasil disimpan`, color: 'success' })
  if (isEdit) notifStore.notifyUpdate('Karyawan', name)
  else notifStore.notifyCreate('Karyawan', name)
}

const onImported = () => {
  fetchData()
  toast({ message: 'Data karyawan berhasil diimport dan diperbarui', color: 'success' })
}

const handleExport = async (format: 'excel' | 'pdf') => {
  try {
    await employeeStore.exportEmployees(format, {
      search: filters.search || undefined,
      division: filters.division || undefined,
      employment_status: filters.employment_status || undefined,
    })
  } catch {
    toast({ message: 'Gagal mengekspor data', color: 'danger' })
  }
}

onMounted(async () => {
  await Promise.all([fetchData(), employeeStore.fetchDivisions()])
})
</script>

<style scoped>
.sortable-th {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.sortable-th:hover {
  opacity: 0.75;
}
.sort-icon {
  opacity: 0.4;
  vertical-align: middle;
  margin-left: 2px;
  transition: opacity 0.15s;
}
.sortable-th:hover .sort-icon {
  opacity: 0.8;
}
</style>
