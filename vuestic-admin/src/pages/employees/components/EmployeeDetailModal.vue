<template>
  <VaModal v-model="isOpen" title="Detail Karyawan" size="large" hide-default-actions @close="$emit('close')">
    <div v-if="isLoading" class="flex justify-center py-12">
      <VaProgressCircle indeterminate />
    </div>

    <div v-else-if="emp" class="employee-detail">
      <!-- Header -->
      <div class="detail-header">
        <VaAvatar
          :src="emp.profile_photo ? `${apiBase}/uploads/photos/${emp.profile_photo}` : undefined"
          :fallback-text="emp.full_name.charAt(0)"
          size="64px"
          color="primary"
        />
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
      <div class="flex justify-end gap-2">
        <VaButton preset="secondary" @click="$emit('close')">Tutup</VaButton>
        <VaButton v-if="authStore.isAdmin" icon="mso-edit" @click="$emit('edit', emp)">Edit</VaButton>
      </div>
    </template>
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
</script>

<style scoped>
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
