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

    <!-- CAPTCHA notice (dev bypass aktif) -->
    <div class="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning-dark">
      <span v-if="isDev"> 🛠️ <strong>Dev Mode:</strong> CAPTCHA dilewati otomatis. </span>
      <span v-else> 🔒 Verifikasi CAPTCHA diperlukan untuk login. </span>
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
  <DevCredentials />
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vuestic-ui'
import { validators } from '../../services/utils'
import { useAuthStore } from '../../stores/auth'
import DevCredentials from '../../components/DevCredentials.vue'

const { validate } = useForm('form')
const { replace } = useRouter()
const authStore = useAuthStore()

const isDev = import.meta.env.DEV

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const errorMessage = ref('')

const submit = async () => {
  if (!validate()) return

  errorMessage.value = ''

  // Gunakan "dev" sebagai captchaToken di development
  const captchaToken = isDev ? 'dev' : ''

  const result = await authStore.login(formData.email, formData.password, captchaToken, formData.rememberMe)

  if (result.success) {
    // Gunakan replace agar tidak bisa back ke halaman login
    await replace({ name: 'dashboard' })
  } else {
    errorMessage.value = result.message || 'Login gagal'
  }
}
</script>
