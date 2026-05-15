<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="page-title font-bold">Profil Saya</h1>

    <!-- Info Card -->
    <VaCard class="mb-4">
      <VaCardContent>
        <div class="flex items-center gap-4 mb-4">
          <VaAvatar
            :fallback-text="authStore.user?.username?.charAt(0)?.toUpperCase() || 'U'"
            size="large"
            color="primary"
          />
          <div>
            <div class="text-xl font-bold">{{ authStore.user?.full_name || authStore.user?.username }}</div>
            <div class="text-secondary text-sm">{{ authStore.user?.email }}</div>
            <div class="flex gap-2 mt-1">
              <VaBadge
                :text="authStore.user?.role || ''"
                :color="authStore.user?.role === 'Admin' ? 'primary' : 'secondary'"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm p-3 rounded-lg bg-gray-50" style="background: rgba(0, 0, 0, 0.03)">
          <div>
            <div class="text-secondary text-xs mb-1">Divisi</div>
            <div class="font-medium">{{ authStore.user?.division || '—' }}</div>
          </div>
          <div>
            <div class="text-secondary text-xs mb-1">Jabatan</div>
            <div class="font-medium">{{ authStore.user?.position || '—' }}</div>
          </div>
          <div>
            <div class="text-secondary text-xs mb-1">Login Terakhir</div>
            <div class="font-medium">{{ formatDate(authStore.user?.last_login) }}</div>
          </div>
          <div>
            <div class="text-secondary text-xs mb-1">Status Akun</div>
            <div class="font-medium">{{ authStore.user?.status || '—' }}</div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>

    <!-- Update Info -->
    <VaCard class="mb-4">
      <VaCardTitle>Perbarui Informasi Akun</VaCardTitle>
      <VaCardContent>
        <div class="flex flex-col gap-4">
          <VaInput v-model="profileForm.username" label="Username" placeholder="Username login" />
          <VaInput v-model="profileForm.email" label="Email" type="email" placeholder="Email akun" />

          <VaAlert v-if="profileSuccess" color="success" class="mt-1">{{ profileSuccess }}</VaAlert>
          <VaAlert v-if="profileError" color="danger" class="mt-1">{{ profileError }}</VaAlert>

          <div class="flex justify-end">
            <VaButton :loading="isSavingProfile" @click="saveProfile"> Simpan Perubahan </VaButton>
          </div>
        </div>
      </VaCardContent>
    </VaCard>

    <!-- Change Password -->
    <VaCard>
      <VaCardTitle>Ganti Password</VaCardTitle>
      <VaCardContent>
        <div class="flex flex-col gap-4">
          <VaInput
            v-model="passwordForm.currentPassword"
            label="Password Lama"
            type="password"
            placeholder="Masukkan password lama"
          />
          <VaInput
            v-model="passwordForm.newPassword"
            label="Password Baru"
            type="password"
            placeholder="Minimal 8 karakter"
          />
          <VaInput
            v-model="passwordForm.confirmPassword"
            label="Konfirmasi Password Baru"
            type="password"
            placeholder="Ulangi password baru"
          />

          <VaAlert v-if="passwordSuccess" color="success" class="mt-1">{{ passwordSuccess }}</VaAlert>
          <VaAlert v-if="passwordError" color="danger" class="mt-1">{{ passwordError }}</VaAlert>

          <div class="flex justify-end">
            <VaButton :loading="isSavingPassword" @click="savePassword"> Ganti Password </VaButton>
          </div>
        </div>
      </VaCardContent>
    </VaCard>
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
