<template>
  <VaModal
    v-model="isOpen"
    :title="isEdit ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'"
    size="large"
    hide-default-actions
    @close="$emit('close')"
  >
    <VaForm ref="form" class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      <!-- Foto Profil -->
      <div class="sm:col-span-2 flex items-center gap-4">
        <VaAvatar
          :src="photoPreview || (employee?.profile_photo ? `${apiBase}/uploads/photos/${employee.profile_photo}` : undefined)"
          :fallback-text="formData.full_name?.charAt(0) || 'K'"
          size="large"
          color="primary"
        />
        <div>
          <label class="va-input-label block mb-1">Foto Profil</label>
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png"
            class="hidden"
            @change="onPhotoChange"
          />
          <VaButton preset="secondary" size="small" @click="triggerPhotoUpload">
            Pilih Foto
          </VaButton>
          <p class="text-xs text-secondary mt-1">JPEG atau PNG — maks 2MB</p>
        </div>
      </div>

      <!-- Data Pribadi -->
      <VaInput
        v-model="formData.full_name"
        label="Nama Lengkap *"
        :rules="[validators.required, (v) => v.length <= 100 || 'Maksimal 100 karakter']"
        placeholder="Contoh: Budi Santoso"
        maxlength="100"
      />
      <VaSelect
        v-model="formData.gender"
        label="Jenis Kelamin *"
        :options="['Male', 'Female']"
        :rules="[validators.required]"
      />
      <VaDateInput
        v-model="formData.birth_date"
        label="Tanggal Lahir *"
        :rules="[validators.required]"
        manual-input
      />
      <VaSelect
        v-model="formData.marital_status"
        label="Status Pernikahan *"
        :options="['Single', 'Married']"
        :rules="[validators.required]"
      />
      <VaInput
        v-model="formData.email"
        label="Email *"
        type="email"
        :rules="[validators.required, validators.email]"
        placeholder="email@perusahaan.com"
        maxlength="100"
      />
      <VaInput
        v-model="formData.phone_number"
        label="No. Telepon *"
        :rules="[validators.required, phoneRule]"
        placeholder="08xxxxxxxxxx"
        maxlength="20"
      />
      <VaInput
        v-model="formData.education"
        label="Pendidikan Terakhir *"
        :rules="[validators.required, (v) => v.length <= 100 || 'Maksimal 100 karakter']"
        placeholder="S1 Teknik Informatika"
        maxlength="100"
      />

      <!-- Alamat -->
      <div class="sm:col-span-2">
        <VaTextarea
          v-model="formData.address"
          label="Alamat Lengkap *"
          :rules="[validators.required]"
          placeholder="Jl. Contoh No. 1, RT/RW..."
          :max-rows="3"
          auto-grow
        />
      </div>
      <VaInput v-model="formData.city" label="Kota *" :rules="[validators.required, (v) => v.length <= 100 || 'Maks 100 karakter']" maxlength="100" />
      <VaInput v-model="formData.province" label="Provinsi *" :rules="[validators.required, (v) => v.length <= 100 || 'Maks 100 karakter']" maxlength="100" />
      <VaInput
        v-model="formData.postal_code"
        label="Kode Pos *"
        :rules="[validators.required, postalCodeRule]"
        placeholder="12345"
        maxlength="10"
      />

      <!-- Data Pekerjaan -->
      <VaInput
        v-model="formData.division"
        label="Divisi *"
        :rules="[validators.required, (v) => v.length <= 100 || 'Maks 100 karakter']"
        placeholder="Teknologi Informasi"
        maxlength="100"
      />
      <VaInput
        v-model="formData.position"
        label="Jabatan *"
        :rules="[validators.required, (v) => v.length <= 100 || 'Maks 100 karakter']"
        placeholder="Software Engineer"
        maxlength="100"
      />
      <VaInput
        v-model="formData.salary"
        label="Gaji (Rp) *"
        type="number"
        min="0"
        :rules="[validators.required, salaryRule]"
        placeholder="5000000"
      />
      <VaDateInput
        v-model="formData.join_date"
        label="Tanggal Bergabung *"
        :rules="[validators.required]"
        manual-input
      />
      <VaSelect
        v-model="formData.employment_status"
        label="Status Kerja *"
        :options="['Active', 'Inactive', 'Resigned']"
        :rules="[validators.required]"
      />

      <!-- Kontak Darurat -->
      <VaInput
        v-model="formData.emergency_contact"
        label="Nama Kontak Darurat *"
        :rules="[validators.required, (v) => v.length <= 100 || 'Maks 100 karakter']"
        maxlength="100"
      />
      <VaInput
        v-model="formData.emergency_phone"
        label="No. Telepon Darurat *"
        :rules="[validators.required, phoneRule]"
        maxlength="20"
      />
    </VaForm>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <VaButton preset="secondary" @click="$emit('close')">Batal</VaButton>
        <VaButton :loading="isSaving" @click="submit">
          {{ isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan' }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import { useForm, useToast } from 'vuestic-ui'
import { validators } from '../../../services/utils'
import { useEmployeeStore, type Employee } from '../../../stores/employee'

const props = defineProps<{ employee: Employee | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const employeeStore = useEmployeeStore()
const { validate } = useForm('form')
const { init: toast } = useToast()

const apiBase = 'http://localhost:5000'
const isOpen = ref(true)
const isSaving = ref(false)
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const isEdit = computed(() => !!props.employee)

// Custom validation rules
const phoneRule = (v: string) => /^[0-9+\-\s]{7,20}$/.test(v) || 'Format nomor telepon tidak valid'
const postalCodeRule = (v: string) => /^[0-9]{5}$/.test(v) || 'Kode pos harus 5 digit angka'
const salaryRule = (v: string | number) => {
  const num = parseFloat(String(v))
  if (isNaN(num)) return 'Gaji harus berupa angka'
  if (num < 0) return 'Gaji tidak boleh negatif'
  return true
}

const formData = reactive({
  full_name: '',
  gender: 'Male' as 'Male' | 'Female',
  birth_date: '',
  email: '',
  phone_number: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  division: '',
  position: '',
  salary: '',
  join_date: '',
  employment_status: 'Active' as 'Active' | 'Inactive' | 'Resigned',
  emergency_contact: '',
  emergency_phone: '',
  education: '',
  marital_status: 'Single' as 'Single' | 'Married',
})

watch(
  () => props.employee,
  (emp) => {
    if (emp) {
      Object.assign(formData, {
        ...emp,
        salary: String(emp.salary),
        birth_date: emp.birth_date ? emp.birth_date.split('T')[0] : '',
        join_date: emp.join_date ? emp.join_date.split('T')[0] : '',
      })
    }
  },
  { immediate: true },
)

const triggerPhotoUpload = () => {
  document.getElementById('photo-upload')?.click()
}

const onPhotoChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Client-side MIME type check
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    toast({ message: 'Hanya file JPEG atau PNG yang diizinkan', color: 'warning' })
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast({ message: 'Ukuran foto maksimal 2MB', color: 'warning' })
    return
  }
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const submit = async () => {
  if (!validate()) return
  isSaving.value = true

  try {
    const fd = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) fd.append(key, String(value))
    })
    if (photoFile.value) fd.append('profile_photo', photoFile.value)

    if (isEdit.value && props.employee) {
      await employeeStore.updateEmployee(props.employee.id, fd)
    } else {
      await employeeStore.createEmployee(fd)
    }
    emit('saved')
  } catch (e: any) {
    toast({
      message: e.response?.data?.message || 'Gagal menyimpan data',
      color: 'danger',
    })
  } finally {
    isSaving.value = false
  }
}
</script>
