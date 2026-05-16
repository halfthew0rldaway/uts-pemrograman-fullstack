<template>
  <div class="flex flex-col gap-4">

    <!-- Info Card -->
    <VaCard class="mb-2">
      <VaCardContent>
        <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
          <VaAvatar
            :fallback-text="authStore.user?.username?.charAt(0)?.toUpperCase() || 'U'"
            size="72px"
            color="primary"
            font-size="32px"
          />
          <div class="flex-1">
            <div class="text-2xl font-bold mb-1">{{ authStore.user?.full_name || authStore.user?.username }}</div>
            <div class="text-secondary flex items-center gap-2 mb-2">
              <VaIcon name="mso-mail" size="16px" />
              {{ authStore.user?.email }}
            </div>
            <div class="flex gap-2">
              <VaBadge
                :text="authStore.user?.role || ''"
                :color="authStore.user?.role === 'Admin' ? 'primary' : 'secondary'"
              />
              <VaBadge
                :text="authStore.user?.status || ''"
                :color="authStore.user?.status === 'Active' ? 'success' : 'warning'"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto p-4 rounded-xl bg-backgroundElement border border-backgroundBorder">
            <div>
              <div class="text-secondary text-[10px] uppercase font-bold tracking-wider mb-1 opacity-60">Divisi</div>
              <div class="font-semibold text-sm">{{ authStore.user?.division || '—' }}</div>
            </div>
            <div>
              <div class="text-secondary text-[10px] uppercase font-bold tracking-wider mb-1 opacity-60">Jabatan</div>
              <div class="font-semibold text-sm">{{ authStore.user?.position || '—' }}</div>
            </div>
            <div>
              <div class="text-secondary text-[10px] uppercase font-bold tracking-wider mb-1 opacity-60">Login Terakhir</div>
              <div class="font-semibold text-sm">{{ formatDate(authStore.user?.last_login) }}</div>
            </div>
            <div>
              <div class="text-secondary text-[10px] uppercase font-bold tracking-wider mb-1 opacity-60">ID Karyawan</div>
              <div class="font-semibold text-sm text-primary">#{{ authStore.user?.employee_id || '—' }}</div>
            </div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Update Info -->
      <VaCard>
        <VaCardTitle class="flex items-center gap-2">
          <VaIcon name="mso-manage_accounts" color="primary" />
          Perbarui Informasi Akun
        </VaCardTitle>
        <VaCardContent>
          <div class="flex flex-col gap-4">
            <VaInput v-model="profileForm.username" label="Username" placeholder="Username login" class="w-full" />
            <VaInput v-model="profileForm.email" label="Email" type="email" placeholder="Email akun" class="w-full" />

            <VaAlert v-if="profileSuccess" color="success" class="mt-1" dense>{{ profileSuccess }}</VaAlert>
            <VaAlert v-if="profileError" color="danger" class="mt-1" dense>{{ profileError }}</VaAlert>

            <div class="flex justify-end mt-2">
              <VaButton :loading="isSavingProfile" @click="saveProfile"> Simpan Perubahan </VaButton>
            </div>
          </div>
        </VaCardContent>
      </VaCard>

      <!-- Change Password -->
      <VaCard>
        <VaCardTitle class="flex items-center gap-2">
          <VaIcon name="mso-lock" color="primary" />
          Ganti Password
        </VaCardTitle>
        <VaCardContent>
          <div class="flex flex-col gap-4">
            <VaInput
              v-model="passwordForm.currentPassword"
              label="Password Lama"
              type="password"
              placeholder="Masukkan password lama"
            />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VaInput
                v-model="passwordForm.newPassword"
                label="Password Baru"
                type="password"
                placeholder="Minimal 8 karakter"
              />
              <VaInput
                v-model="passwordForm.confirmPassword"
                label="Konfirmasi Password"
                type="password"
                placeholder="Ulangi password"
              />
            </div>

            <VaAlert v-if="passwordSuccess" color="success" class="mt-1" dense>{{ passwordSuccess }}</VaAlert>
            <VaAlert v-if="passwordError" color="danger" class="mt-1" dense>{{ passwordError }}</VaAlert>

            <div class="flex justify-end mt-2">
              <VaButton :loading="isSavingPassword" @click="savePassword"> Ganti Password </VaButton>
            </div>
          </div>
        </VaCardContent>
      </VaCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { apiClient } from '../../services/apiClient'

const authStore = useAuthStore()

// Profile form
const profileForm = reactive({ username: '', email: '' })
const isSavingProfile = ref(false)
const profileSuccess = ref('')
const profileError = ref('')

// Password form
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const isSavingPassword = ref(false)
const passwordSuccess = ref('')
const passwordError = ref('')

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const saveProfile = async () => {
  profileSuccess.value = ''
  profileError.value = ''

  if (!profileForm.username || !profileForm.email) {
    profileError.value = 'Username dan email wajib diisi'
    return
  }

  isSavingProfile.value = true
  try {
    await apiClient.put('/users/profile', {
      username: profileForm.username,
      email: profileForm.email,
    })
    await authStore.fetchMe()
    profileSuccess.value = 'Informasi akun berhasil diperbarui'
  } catch (e: any) {
    profileError.value = e.response?.data?.message || 'Gagal memperbarui profil'
  } finally {
    isSavingProfile.value = false
  }
}

const savePassword = async () => {
  passwordSuccess.value = ''
  passwordError.value = ''

  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    passwordError.value = 'Semua field password wajib diisi'
    return
  }
  if (passwordForm.newPassword.length < 8) {
    passwordError.value = 'Password baru minimal 8 karakter'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Konfirmasi password tidak cocok'
    return
  }

  isSavingPassword.value = true
  try {
    await apiClient.put('/users/profile', {
      username: profileForm.username,
      email: profileForm.email,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordSuccess.value = 'Password berhasil diubah'
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e: any) {
    passwordError.value = e.response?.data?.message || 'Gagal mengganti password'
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(async () => {
  await authStore.fetchMe()
  profileForm.username = authStore.user?.username || ''
  profileForm.email = authStore.user?.email || ''
})
</script>
