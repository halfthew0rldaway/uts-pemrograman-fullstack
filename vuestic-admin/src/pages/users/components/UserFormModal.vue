<template>
  <VaModal
    v-model="isOpen"
    :title="isEdit ? 'Edit User' : 'Tambah User Baru'"
    hide-default-actions
    @close="$emit('close')"
  >
    <VaForm ref="form" class="flex flex-col gap-4 py-2">
      <VaInput v-model="formData.username" label="Username *" :rules="[validators.required]" placeholder="johndoe" />
      <VaInput v-model="formData.email" label="Email *" type="email" :rules="[validators.required, validators.email]" />
      <VaInput
        v-model="formData.password"
        :label="isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'"
        type="password"
        :rules="isEdit ? [] : [validators.required]"
        placeholder="Minimal 8 karakter"
      />
      <VaSelect
        v-model="formData.role"
        label="Role *"
        :options="['Admin', 'Employee']"
        :rules="[validators.required]"
      />
      <VaSelect
        v-model="formData.status"
        label="Status *"
        :options="['Active', 'Inactive']"
        :rules="[validators.required]"
      />
      <VaInput
        v-model="formData.employee_id"
        label="Employee ID (opsional)"
        type="number"
        placeholder="ID karyawan yang terhubung"
      />
    </VaForm>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <VaButton preset="secondary" @click="$emit('close')">Batal</VaButton>
        <VaButton :loading="isSaving" @click="submit">
          {{ isEdit ? 'Simpan Perubahan' : 'Buat User' }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import { useForm, useToast } from 'vuestic-ui'
import { useRouter } from 'vue-router'
import { validators } from '../../../services/utils'
import { useUserManagementStore, type User } from '../../../stores/userManagement'
import { useAuthStore } from '../../../stores/auth'

const props = defineProps<{ user: User | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useUserManagementStore()
const authStore = useAuthStore()
const router = useRouter()
const { validate } = useForm('form')
const { init: toast } = useToast()

const isOpen = ref(true)
const isSaving = ref(false)
const isEdit = computed(() => !!props.user)

const formData = reactive({
  username: '',
  email: '',
  password: '',
  role: 'Employee' as 'Admin' | 'Employee',
  status: 'Active' as 'Active' | 'Inactive',
  employee_id: '',
})

watch(
  () => props.user,
  (u) => {
    if (u) {
      formData.username = u.username
      formData.email = u.email
      formData.password = ''
      formData.role = u.role
      formData.status = u.status
      formData.employee_id = u.employee_id ? String(u.employee_id) : ''
    }
  },
  { immediate: true },
)

const submit = async () => {
  if (!validate()) return
  isSaving.value = true
  try {
    const payload: Record<string, any> = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
    }
    if (formData.password) payload.password = formData.password

    if (isEdit.value && props.user) {
      await store.updateUser(props.user.id, payload)

      // Jika password diubah dan user yang diedit adalah user yang sedang login, force logout
      if (formData.password && props.user.id === authStore.user?.id) {
        toast({ message: 'Password berubah. Silakan login ulang.', color: 'info' })
        await authStore.logout()
        router.replace({ name: 'login' })
        return
      }
    } else {
      await store.createUser(payload)
    }
    emit('saved')
  } catch (e: any) {
    toast({ message: e.response?.data?.message || 'Gagal menyimpan', color: 'danger' })
  } finally {
    isSaving.value = false
  }
}
</script>
