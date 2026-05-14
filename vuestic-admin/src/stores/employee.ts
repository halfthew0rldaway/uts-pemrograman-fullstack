import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../services/apiClient'

export interface Employee {
  id: number
  employee_code: string
  full_name: string
  gender: 'Male' | 'Female'
  birth_date: string
  email: string
  phone_number: string
  address: string
  city: string
  province: string
  postal_code: string
  division: string
  position: string
  salary: number
  join_date: string
  employment_status: 'Active' | 'Inactive' | 'Resigned'
  profile_photo: string | null
  emergency_contact: string
  emergency_phone: string
  education: string
  marital_status: 'Single' | 'Married'
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref<Employee[]>([])
  const currentEmployee = ref<Employee | null>(null)
  const pagination = ref<PaginationMeta | null>(null)
  const divisions = ref<string[]>([])
  const isLoading = ref(false)

  /**
   * @description Mengambil daftar karyawan dengan filter dan pagination.
   */
  const fetchEmployees = async (params: {
    page?: number
    pageSize?: number
    search?: string
    division?: string
    employment_status?: string
  } = {}) => {
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/employees', { params })
      employees.value = data.data
      pagination.value = data.pagination
    } finally {
      isLoading.value = false
    }
  }

  /**
   * @description Mengambil detail satu karyawan berdasarkan ID.
   */
  const fetchEmployee = async (id: number) => {
    isLoading.value = true
    try {
      const { data } = await apiClient.get(`/employees/${id}`)
      currentEmployee.value = data.data
      return data.data
    } finally {
      isLoading.value = false
    }
  }

  /**
   * @description Membuat karyawan baru. Mendukung upload foto via FormData.
   */
  const createEmployee = async (formData: FormData) => {
    const { data } = await apiClient.post('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  /**
   * @description Memperbarui data karyawan berdasarkan ID.
   */
  const updateEmployee = async (id: number, formData: FormData) => {
    const { data } = await apiClient.put(`/employees/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  /**
   * @description Menghapus karyawan berdasarkan ID.
   */
  const deleteEmployee = async (id: number) => {
    const { data } = await apiClient.delete(`/employees/${id}`)
    return data
  }

  /**
   * @description Mengambil daftar divisi unik untuk dropdown filter.
   */
  const fetchDivisions = async () => {
    const { data } = await apiClient.get('/employees/divisions')
    divisions.value = data.data
  }

  /**
   * @description Trigger download export Excel atau PDF.
   */
  const exportEmployees = async (format: 'excel' | 'pdf', filters = {}) => {
    const response = await apiClient.get('/employees/export', {
      params: { format, ...filters },
      responseType: 'blob',
    })
    const ext = format === 'pdf' ? 'pdf' : 'xlsx'
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `karyawan_${Date.now()}.${ext}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return {
    employees, currentEmployee, pagination, divisions, isLoading,
    fetchEmployees, fetchEmployee, createEmployee, updateEmployee,
    deleteEmployee, fetchDivisions, exportEmployees,
  }
})
