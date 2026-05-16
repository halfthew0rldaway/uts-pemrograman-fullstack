import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../services/apiClient'

export interface ActivityLog {
  id: number
  action: string
  target: string
  details: any
  ip_address: string
  created_at: string
  username: string
  email: string
  role: string
}

export interface PaginationMeta {
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const useLogStore = defineStore('log', () => {
  const logs = ref<ActivityLog[]>([])
  const actions = ref<string[]>([])
  const pagination = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)

  /**
   * @description Mengambil daftar activity logs dengan filter dan pagination.
   */
  const fetchLogs = async (
    params: {
      page?: number
      pageSize?: number
      action?: string
      user_id?: number
      search?: string
    } = {},
  ) => {
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/logs', { params })
      logs.value = data.data
      pagination.value = data.pagination
    } finally {
      isLoading.value = false
    }
  }

  /**
   * @description Mengambil daftar jenis aksi unik untuk filter dropdown.
   */
  const fetchActions = async () => {
    const { data } = await apiClient.get('/logs/actions')
    actions.value = data.data
  }

  return {
    logs,
    actions,
    pagination,
    isLoading,
    fetchLogs,
    fetchActions,
  }
})
