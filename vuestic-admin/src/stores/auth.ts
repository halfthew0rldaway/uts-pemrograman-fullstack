import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../services/apiClient'
import { useNotificationStore } from './notificationStore'

export interface AuthUser {
  id: number
  employee_id: number | null
  username: string
  email: string
  role: 'Admin' | 'Employee'
  status: 'Active' | 'Inactive'
  full_name: string | null
  profile_photo: string | null
  division: string | null
  position: string | null
  last_login: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'Admin')

  /**
   * @description Login user — menyimpan token dan data user ke store & localStorage.
   */
  const login = async (email: string, password: string, captchaToken: string, rememberMe = false) => {
    isLoading.value = true
    try {
      const { data } = await apiClient.post('/auth/login', {
        email,
        password,
        captchaToken,
        rememberMe,
      })
      accessToken.value = data.data.accessToken
      user.value = data.data.user
      localStorage.setItem('accessToken', data.data.accessToken)

      // Notifikasi selamat datang
      const notifStore = useNotificationStore()
      notifStore.notifyLogin(data.data.user.username)

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login gagal',
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * @description Logout — hapus token, user, dan panggil endpoint logout.
   */
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // tetap lanjutkan logout meski request gagal
    } finally {
      accessToken.value = null
      user.value = null
      localStorage.removeItem('accessToken')
    }
  }

  /**
   * @description Ambil profil user yang sedang login dari API.
   */
  const fetchMe = async () => {
    try {
      const { data } = await apiClient.get('/auth/me')
      user.value = data.data
    } catch {
      accessToken.value = null
      user.value = null
      localStorage.removeItem('accessToken')
    }
  }

  return { user, accessToken, isLoading, isAuthenticated, isAdmin, login, logout, fetchMe }
})
