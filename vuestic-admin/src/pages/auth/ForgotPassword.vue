<template>
  <div class="forgot-wrapper">
    <div class="forgot-card">
      <!-- Logo / Title -->
      <div class="text-center mb-6">
        <div class="forgot-icon">
          <VaIcon name="mso-lock_reset" size="32px" color="primary" />
        </div>
        <h1 class="forgot-title">Lupa Password</h1>
        <p class="forgot-sub">
          {{ step === 'request' ? 'Masukkan email akun Anda untuk menerima instruksi reset password.' : 'Masukkan token dan password baru Anda.' }}
        </p>
      </div>

      <!-- Step 1: Request Reset -->
      <VaForm v-if="step === 'request'" ref="requestForm" @submit.prevent="submitRequest">
        <VaInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="email@perusahaan.com"
          :rules="[v => !!v || 'Email wajib diisi', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Format email tidak valid']"
          class="mb-4"
        >
          <template #prependInner><VaIcon name="mso-email" color="secondary" /></template>
        </VaInput>

        <VaButton class="w-full" :loading="isLoading" @click="submitRequest">
          Kirim Instruksi Reset
        </VaButton>

        <div v-if="devToken" class="dev-token-box mt-4">
          <div class="dev-token-label">🛠 Development Token</div>
          <code class="dev-token-value">{{ devToken }}</code>
          <VaButton preset="plain" size="small" @click="copyToken">Salin & Lanjut</VaButton>
        </div>
      </VaForm>

      <!-- Step 2: Reset Password -->
      <VaForm v-else-if="step === 'reset'" ref="resetForm" @submit.prevent="submitReset">
        <VaInput
          v-model="resetToken"
          label="Token Reset"
          placeholder="Tempel token dari email"
          :rules="[v => !!v || 'Token wajib diisi']"
          class="mb-3"
        />
        <VaInput
          v-model="newPassword"
          label="Password Baru"
          type="password"
          :rules="[v => !!v || 'Password wajib diisi', v => v.length >= 8 || 'Minimal 8 karakter']"
          class="mb-3"
        />
        <VaInput
          v-model="confirmPassword"
          label="Konfirmasi Password"
          type="password"
          :rules="[v => !!v || 'Konfirmasi wajib diisi', v => v === newPassword || 'Password tidak cocok']"
          class="mb-4"
        />

        <VaButton class="w-full" :loading="isLoading" @click="submitReset">
          Reset Password
        </VaButton>
      </VaForm>

      <!-- Step 3: Success -->
      <div v-else-if="step === 'done'" class="text-center">
        <VaIcon name="mso-check_circle" size="48px" color="success" class="mb-3" />
        <p class="font-medium mb-4">Password berhasil direset!</p>
        <VaButton @click="goToLogin">Kembali ke Login</VaButton>
      </div>

      <!-- Back to login -->
      <div v-if="step !== 'done'" class="text-center mt-4">
        <RouterLink to="/auth/login" class="text-sm text-primary">
          ← Kembali ke Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'
import { apiClient } from '../../services/apiClient'

const router = useRouter()
const { init: toast } = useToast()
const { validate: validateRequest } = useForm('requestForm')
const { validate: validateReset } = useForm('resetForm')

const step = ref<'request' | 'reset' | 'done'>('request')
const isLoading = ref(false)
const email = ref('')
const devToken = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const submitRequest = async () => {
  if (!validateRequest()) return
  isLoading.value = true
  try {
    const { data } = await apiClient.post('/auth/forgot-password', { email: email.value })
    toast({ message: data.message, color: 'success' })
    if (data.dev_token) {
      devToken.value = data.dev_token
    } else {
      step.value = 'reset'
    }
  } catch (e: any) {
    toast({ message: e.response?.data?.message || 'Gagal mengirim permintaan', color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

const copyToken = () => {
  resetToken.value = devToken.value
  navigator.clipboard?.writeText(devToken.value)
  step.value = 'reset'
}

const submitReset = async () => {
  if (!validateReset()) return
  isLoading.value = true
  try {
    const { data } = await apiClient.post('/auth/reset-password', {
      token: resetToken.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })
    toast({ message: data.message, color: 'success' })
    step.value = 'done'
  } catch (e: any) {
    toast({ message: e.response?.data?.message || 'Gagal reset password', color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => router.push('/auth/login')
</script>

<style scoped>
.forgot-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--va-background-primary);
}

.forgot-card {
  width: 100%;
  max-width: 420px;
  background: var(--va-background-element);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.forgot-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(99,102,241,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.forgot-title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 6px;
}

.forgot-sub {
  font-size: 0.8125rem;
  opacity: 0.55;
  line-height: 1.5;
}

.dev-token-box {
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.3);
  border-radius: 8px;
  padding: 12px;
}

.dev-token-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #F59E0B;
  margin-bottom: 6px;
}

.dev-token-value {
  display: block;
  font-size: 0.7rem;
  word-break: break-all;
  opacity: 0.8;
  margin-bottom: 8px;
}
</style>
