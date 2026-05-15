import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AppNotification {
  id: string
  message: string
  time: Date
  read: boolean
  icon: string
  color: string
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])

  const unreadCount = () => notifications.value.filter((n) => !n.read).length

  /**
   * @description Tambah notifikasi baru ke bell navbar.
   * Maksimal 20 notifikasi tersimpan.
   */
  const push = (message: string, icon = 'mso-info', color = 'primary') => {
    notifications.value.unshift({
      id: `${Date.now()}-${Math.random()}`,
      message,
      time: new Date(),
      read: false,
      icon,
      color,
    })
    // Batasi maksimal 20 notifikasi
    if (notifications.value.length > 20) {
      notifications.value = notifications.value.slice(0, 20)
    }
  }

  const markAllRead = () => {
    notifications.value.forEach((n) => (n.read = true))
  }

  const markRead = (id: string) => {
    const n = notifications.value.find((n) => n.id === id)
    if (n) n.read = true
  }

  const clear = () => {
    notifications.value = []
  }

  // Shorthand helpers dengan pesan natural
  const notifyCreate = (entity: string, name: string) =>
    push(`${entity} "${name}" berhasil ditambahkan`, 'mso-add_circle', 'success')

  const notifyUpdate = (entity: string, name: string) =>
    push(`${entity} "${name}" berhasil diperbarui`, 'mso-edit', 'warning')

  const notifyDelete = (entity: string, name: string) =>
    push(`${entity} "${name}" berhasil dihapus`, 'mso-delete', 'danger')

  const notifyLogin = (username: string) => push(`Selamat datang kembali, ${username}!`, 'mso-login', 'primary')

  const notifyExport = (format: string) =>
    push(`Data berhasil diekspor ke format ${format.toUpperCase()}`, 'mso-download', 'info')

  return {
    notifications,
    unreadCount,
    push,
    markAllRead,
    markRead,
    clear,
    notifyCreate,
    notifyUpdate,
    notifyDelete,
    notifyLogin,
    notifyExport,
  }
})
