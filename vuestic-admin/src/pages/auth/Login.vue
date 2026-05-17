<template>
  <VaForm ref="form" @submit.prevent="submit">
    <h1 class="font-semibold text-4xl mb-2">Masuk</h1>
    <p class="text-base mb-6 leading-5 text-secondary">
      Sistem Manajemen Karyawan<br />
      <span class="font-semibold text-primary">PT Digital Nusantara</span>
    </p>

    <VaInput
      v-model="formData.email"
      :rules="[validators.required, validators.email]"
      class="mb-4"
      label="Email"
      type="email"
      placeholder="admin@ptdigitalnusantara.com"
    />

    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="formData.password"
        :rules="[validators.required]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Password"
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
    </VaValue>

    <!-- reCAPTCHA Widget (shown when NOT in dev mode) -->
    <div v-if="!devMode" class="mb-4">
      <div ref="recaptchaContainer" class="recaptcha-wrapper"></div>
      <p v-if="captchaError" class="text-xs mt-1" style="color: var(--va-danger)">
        {{ captchaError }}
      </p>
    </div>

    <!-- Dev mode notice (shown when dev mode is active) -->
    <div v-else class="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning-dark">
      <span> 🛠️ <strong>Dev Mode:</strong> CAPTCHA dilewati otomatis. </span>
    </div>

    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
      <VaCheckbox v-model="formData.rememberMe" class="mb-2 sm:mb-0" label="Ingat saya" />
    </div>

    <VaAlert v-if="errorMessage" color="danger" class="mb-4" closeable @close="errorMessage = ''">
      {{ errorMessage }}
    </VaAlert>

    <VaButton class="w-full" type="submit" :loading="authStore.isLoading" :disabled="authStore.isLoading">
      Login
    </VaButton>

    <div class="text-center mt-3">
      <RouterLink to="/auth/forgot-password" class="text-sm" style="color: var(--va-primary); text-decoration: none">
        Lupa password?
      </RouterLink>
    </div>
  </VaForm>

  <!-- Dev credentials helper (visible in both modes for lecturer) -->
  <DevCredentials />

  <!-- Dev mode toggle button (fixed bottom-left) -->
  <Teleport to="body">
    <button
      class="dev-mode-toggle"
      :class="{ 'dev-mode-toggle--active': devMode }"
      :title="devMode ? 'Matikan Dev Mode (aktifkan CAPTCHA)' : 'Aktifkan Dev Mode (bypass CAPTCHA)'"
      @click="toggleDevMode"
    >
      <svg v-if="!devMode" class="dev-mode-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <svg v-else class="dev-mode-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
      <span class="dev-mode-toggle-label">{{ devMode ? 'DEV' : 'LIVE' }}</span>
    </button>
  </Teleport>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vuestic-ui'
import { validators } from '../../services/utils'
import { useAuthStore } from '../../stores/auth'
import DevCredentials from '../../components/DevCredentials.vue'

declare global {
  interface Window {
    grecaptcha: any
    onRecaptchaLoad: () => void
  }
}

const { validate } = useForm('form')
const { replace } = useRouter()
const authStore = useAuthStore()

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

// Dev mode toggle — starts OFF so CAPTCHA is active for demo
const devMode = ref(false)

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const errorMessage = ref('')
const captchaError = ref('')
const captchaToken = ref('')
const recaptchaContainer = ref<HTMLElement | null>(null)
let recaptchaWidgetId: number | null = null

// reCAPTCHA callback functions
const onCaptchaSuccess = (token: string) => {
  captchaToken.value = token
  captchaError.value = ''
}

const onCaptchaExpired = () => {
  captchaToken.value = ''
}

const renderRecaptcha = () => {
  if (!recaptchaContainer.value || !window.grecaptcha || !RECAPTCHA_SITE_KEY) return

  // Reset if already rendered
  if (recaptchaWidgetId !== null) {
    try {
      window.grecaptcha.reset(recaptchaWidgetId)
    } catch {
      // ignore
    }
  }

  // Clear container
  recaptchaContainer.value.innerHTML = ''

  recaptchaWidgetId = window.grecaptcha.render(recaptchaContainer.value, {
    sitekey: RECAPTCHA_SITE_KEY,
    callback: onCaptchaSuccess,
    'expired-callback': onCaptchaExpired,
    theme: 'dark',
  })
}

// Watch for dev mode toggle — re-render captcha when switching to live mode
watch(devMode, async (newVal) => {
  if (!newVal) {
    // Switching to live mode — render captcha after DOM updates
    captchaToken.value = ''
    await nextTick()
    // Wait a tick for the container to be in DOM
    setTimeout(() => {
      if (window.grecaptcha && window.grecaptcha.render) {
        renderRecaptcha()
      }
    }, 100)
  }
})

onMounted(() => {
  // If reCAPTCHA script already loaded
  if (window.grecaptcha && window.grecaptcha.render && !devMode.value) {
    renderRecaptcha()
  }

  // Callback when reCAPTCHA script finishes loading
  window.onRecaptchaLoad = () => {
    if (!devMode.value) {
      renderRecaptcha()
    }
  }
})

const toggleDevMode = () => {
  devMode.value = !devMode.value
}

const submit = async () => {
  if (!validate()) return

  errorMessage.value = ''
  captchaError.value = ''

  // Determine captcha token based on mode
  let token = ''
  if (devMode.value) {
    token = 'dev'
  } else {
    if (!captchaToken.value) {
      captchaError.value = 'Silakan selesaikan verifikasi CAPTCHA terlebih dahulu'
      return
    }
    token = captchaToken.value
  }

  const result = await authStore.login(formData.email, formData.password, token, formData.rememberMe)

  if (result.success) {
    // Gunakan replace agar tidak bisa back ke halaman login
    await replace({ name: 'dashboard' })
  } else {
    errorMessage.value = result.message || 'Login gagal'
    // Reset captcha on failed login
    if (!devMode.value && window.grecaptcha && recaptchaWidgetId !== null) {
      window.grecaptcha.reset(recaptchaWidgetId)
      captchaToken.value = ''
    }
  }
}
</script>

<style scoped>
.recaptcha-wrapper {
  display: flex;
  justify-content: center;
}

.dev-mode-toggle {
  position: fixed;
  bottom: 1.25rem;
  left: 1.25rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.dev-mode-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.dev-mode-toggle--active {
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.dev-mode-toggle-icon {
  font-size: 14px;
}

.dev-mode-toggle-label {
  letter-spacing: 0.05em;
}
</style>
