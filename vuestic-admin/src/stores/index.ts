import { createPinia } from 'pinia'

// Pinia instance — digunakan sebagai default export untuk main.ts
const stores = createPinia()

export default stores

// Named exports untuk digunakan langsung di komponen
export { useUserStore } from './user-store'
export { useAuthStore } from './auth'
export { useEmployeeStore } from './employee'
export { useUserManagementStore } from './userManagement'
export { useLogStore } from './log'
