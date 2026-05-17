<template>
  <VaModal v-model="isOpen" title="Detail Karyawan" size="large" hide-default-actions @close="$emit('close')">
    <div v-if="isLoading" class="flex justify-center py-12">
      <VaProgressCircle indeterminate />
    </div>

    <div v-else-if="emp" class="employee-detail">
      <!-- Header -->
      <div class="detail-header">
        <div class="relative">
          <VaAvatar
            :src="emp.profile_photo ? `${apiBase}/uploads/photos/${emp.profile_photo}` : undefined"
            :fallback-text="emp.full_name.charAt(0)"
            size="64px"
            color="primary"
          />
          <!-- Tombol hapus foto profil dari server -->
          <VaButton
            v-if="authStore.isAdmin && emp.profile_photo"
            preset="plain"
            icon="mso-delete"
            size="small"
            color="danger"
            class="delete-photo-btn"
            title="Hapus foto profil dari server"
            :loading="isDeletingPhoto"
            @click.stop="confirmDeletePhoto"
          />
        </div>
        <div class="detail-header-info">
          <div class="detail-name">{{ emp.full_name }}</div>
          <div class="detail-position">{{ emp.position }} · {{ emp.division }}</div>
          <div class="flex gap-2 mt-2">
            <VaBadge :text="emp.employment_status" :color="statusColor(emp.employment_status)" />
            <VaBadge :text="emp.employee_code" color="secondary" />
          </div>
        </div>
      </div>

      <VaDivider class="my-4" />

      <!-- Grid Info -->
      <div class="detail-grid">
        <div class="detail-section">
          <div class="detail-section-title">Informasi Pribadi</div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-key">Jenis Kelamin</span><span class="detail-val">{{ emp.gender }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Tanggal Lahir</span
              ><span class="detail-val">{{ formatDate(emp.birth_date) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Status Nikah</span><span class="detail-val">{{ emp.marital_status }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Pendidikan</span><span class="detail-val">{{ emp.education }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Kontak</div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-key">Email</span><span class="detail-val">{{ emp.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Telepon</span><span class="detail-val">{{ emp.phone_number }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Kontak Darurat</span><span class="detail-val">{{ emp.emergency_contact }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">No. Darurat</span><span class="detail-val">{{ emp.emergency_phone }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Alamat</div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-key">Alamat</span><span class="detail-val">{{ emp.address }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Kota</span><span class="detail-val">{{ emp.city }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Provinsi</span><span class="detail-val">{{ emp.province }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Kode Pos</span><span class="detail-val">{{ emp.postal_code }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Pekerjaan</div>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="detail-key">Divisi</span><span class="detail-val">{{ emp.division }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Jabatan</span><span class="detail-val">{{ emp.position }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Gaji</span><span class="detail-val">{{ formatSalary(emp.salary) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Bergabung</span><span class="detail-val">{{ formatDate(emp.join_date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div v-if="emp" class="flex justify-between items-center">
        <div class="text-xs text-secondary">
          <span v-if="emp.profile_photo" class="flex items-center gap-1">
            <VaIcon name="mso-image" size="14px" />
            {{ emp.profile_photo }}
          </span>
          <span v-else class="opacity-50">Tidak ada foto profil</span>
        </div>
        <div class="flex gap-2">
          <VaButton preset="secondary" @click="$emit('close')">Tutup</VaButton>
          <VaButton v-if="authStore.isAdmin" icon="mso-edit" @click="$emit('edit', emp)">Edit</VaButton>
        </div>
      </div>
      <div v-else class="flex justify-end">
        <VaButton preset="secondary" @click="$emit('close')">Tutup</VaButton>
      </div>
    </template>

    <!-- Confirm Delete Photo Modal -->
    <VaModal
      v-model="showDeletePhotoModal"
      title="Hapus Foto Profil"
      ok-text="Ya, Hapus"
      ok-color="danger"
      cancel-text="Batal"
      :ok-loading="isDeletingPhoto"
      @ok="doDeletePhoto"
    >
      <p>Hapus foto profil <strong>{{ emp?.full_name }}</strong> dari server? File akan dihapus permanen.</p>
    </VaModal>
  </VaModal>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '../../../services/apiClient'
import { useAuthStore } from '../../../stores/auth'
import type { Employee } from '../../../stores/employee'

const props = defineProps<{ employeeId: number }>()
const emit = defineEmits<{ close: []; edit: [emp: any] }>()

const authStore = useAuthStore()
const apiBase = 'http://localhost:5000'
const isLoading = ref(true)
const emp = ref<any>(null)
const isDeletingPhoto = ref(false)
const showDeletePhotoModal = ref(false)

const statusColor = (s: string) => ({ Active: 'success', Inactive: 'warning', Resigned: 'danger' })[s] || 'secondary'
const isOpen = ref(true)

const formatDate = (d: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

const formatSalary = (s: number) => {
  if (!s) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(s)
}

onMounted(async () => {
  try {
    const { data } = await apiClient.get(`/employees/${props.employeeId}`)
    emp.value = data.data
  } finally {
    isLoading.value = false
  }
})

const confirmDeletePhoto = () => {
  showDeletePhotoModal.value = true
}

const doDeletePhoto = async () => {
  if (!emp.value) return
  isDeletingPhoto.value = true
  try {
    await apiClient.delete(`/employees/${emp.value.id}/photo`)
    emp.value.profile_photo = null
    showDeletePhotoModal.value = false
  } catch (e: any) {
    console.error('Gagal menghapus foto:', e.message)
  } finally {
    isDeletingPhoto.value = false
  }
}
</script>

<style scoped>
.delete-photo-btn {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: var(--va-background-element) !important;
  border-radius: 50% !important;
  width: 22px !important;
  height: 22px !important;
  min-width: unset !important;
  padding: 0 !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.detail-name {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.detail-position {
  font-size: 0.8125rem;
  opacity: 0.6;
  margin-top: 2px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
.detail-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.45;
  margin-bottom: 8px;
}
.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8125rem;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-key {
  opacity: 0.5;
  font-weight: 500;
  flex-shrink: 0;
}
.detail-val {
  font-weight: 500;
  text-align: right;
}
</style>
