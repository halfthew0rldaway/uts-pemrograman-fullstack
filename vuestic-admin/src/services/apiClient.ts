import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // kirim cookie (refresh token)
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — sisipkan access token ke setiap request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor — auto-refresh token jika 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(error)
  },
)
