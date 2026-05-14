import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../services/apiClient'

export interface User {
  id: number
  employee_id: number | null
  username: string
  email: string
  role: 'Admin' | 'Employee'
  status: 'Active' | 'Inactive'
  last_login: string | null
  created_at: string
  full_name: string | null
  division: string | null
  position: string | null
  profile_photo: string | null
}

export const useUserManagementStore = defineStore('userManagement', () => {
  const users = ref<User[]>([])
  const pagination = ref<any>(null)
  const isLoading = ref(false)

  const fetchUsers = async (params: Record<string, any> = {}) => {
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/users', { params })
      users.value = data.data
      pagination.value = data.pagination
    } finally {
      isLoading.value = false
    }
  }

  const createUser = async (payload: Record<string, any>) => {
    const { data } = await apiClient.post('/users', payload)
    return data
  }

  const updateUser = async (id: number, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/users/${id}`, payload)
    return data
  }

  const deleteUser = async (id: number) => {
    const { data } = await apiClient.delete(`/users/${id}`)
    return data
  }

  const updateProfile = async (payload: Record<string, any>) => {
    const { data } = await apiClient.put('/users/profile', payload)
    return data
  }

  return { users, pagination, isLoading, fetchUsers, createUser, updateUser, deleteUser, updateProfile }
})
