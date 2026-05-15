<template>
  <div class="notification-dropdown-wrapper">
    <VaDropdown v-model="isOpen" :offset="[9, 0]" stick-to-edges>
      <template #anchor>
        <VaButton preset="secondary" color="textPrimary" class="notification-btn">
          <div class="relative">
            <VaIcon name="mso-notifications" size="20px" />
            <span v-if="unread > 0" class="notif-badge">{{ unread > 9 ? '9+' : unread }}</span>
          </div>
        </VaButton>
      </template>

      <VaDropdownContent class="notif-dropdown">
        <!-- Header -->
        <div class="notif-header">
          <span class="notif-title">Notifikasi</span>
          <VaButton
            v-if="notifStore.notifications.length"
            preset="plain"
            size="small"
            color="secondary"
            @click="notifStore.markAllRead()"
          >
            Tandai semua dibaca
          </VaButton>
        </div>

        <!-- Empty state -->
        <div v-if="!notifStore.notifications.length" class="notif-empty">
          <VaIcon name="mso-notifications_none" size="32px" color="secondary" />
          <p>Belum ada notifikasi</p>
        </div>

        <!-- List -->
        <div v-else class="notif-list">
          <div
            v-for="n in notifStore.notifications.slice(0, 10)"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.read }"
            @click="notifStore.markRead(n.id)"
          >
            <div class="notif-icon-wrap" :style="{ color: `var(--va-${n.color}, #6366F1)` }">
              <VaIcon :name="n.icon" size="16px" />
            </div>
            <div class="notif-content">
              <div class="notif-message">{{ n.message }}</div>
              <div class="notif-time">{{ formatTime(n.time) }}</div>
            </div>
            <div v-if="!n.read" class="notif-dot" />
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifStore.notifications.length" class="notif-footer">
          <VaButton preset="plain" size="small" color="secondary" @click="notifStore.clear()"> Hapus semua </VaButton>
        </div>
      </VaDropdownContent>
    </VaDropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useNotificationStore } from '../../../../stores/notificationStore'

const notifStore = useNotificationStore()
const isOpen = ref(false)

const unread = computed(() => notifStore.unreadCount())

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}
</script>

<style scoped>
.notification-btn {
  position: relative;
}

.notif-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
}

.notif-dropdown {
  width: 320px;
  max-height: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.notif-title {
  font-size: 0.875rem;
  font-weight: 600;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 8px;
  color: var(--va-secondary);
  font-size: 0.8125rem;
}

.notif-list {
  overflow-y: auto;
  max-height: 360px;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
}
.notif-item:last-child {
  border-bottom: none;
}
.notif-item:hover {
  background: rgba(0, 0, 0, 0.03);
}
.notif-item--unread {
  background: rgba(99, 102, 241, 0.04);
}

.notif-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: currentColor;
  opacity: 0.12;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.notif-icon-wrap .va-icon {
  position: absolute;
  opacity: 1;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-message {
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
}

.notif-time {
  font-size: 0.7rem;
  opacity: 0.45;
  margin-top: 2px;
}

.notif-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
}
</style>
