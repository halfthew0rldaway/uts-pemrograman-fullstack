<template>
  <VaModal
    v-model="isOpen"
    title="Detail User"
    hide-default-actions
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-4 py-2">
      <!-- Avatar + name -->
      <div class="flex items-center gap-4">
        <VaAvatar
          :fallback-text="user.username.charAt(0).toUpperCase()"
          size="52px"
          color="primary"
        />
        <div>
          <div class="font-bold text-base">{{ user.username }}</div>
          <div class="text-secondary text-sm">{{ user.email }}</div>
          <div class="flex gap-2 mt-1">
            <VaBadge :text="user.role" :color="user.role === 'Admin' ? 'primary' : 'secondary'" />
            <VaBadge :text="user.status" :color="user.status === 'Active' ? 'success' : 'warning'" />
          </div>
        </div>
      </div>

      <VaDivider />

      <div class="detail-rows">
        <div class="detail-row"><span class="detail-key">ID</span><span class="detail-val">#{{ user.id }}</span></div>
        <div class="detail-row"><span class="detail-key">Karyawan Terhubung</span><span class="detail-val">{{ user.full_name || '—' }}</span></div>
        <div class="detail-row"><span class="detail-key">Divisi</span><span class="detail-val">{{ user.division || '—' }}</span></div>
        <div class="detail-row"><span class="detail-key">Jabatan</span><span class="detail-val">{{ user.position || '—' }}</span></div>
        <div class="detail-row"><span class="detail-key">Login Terakhir</span><span class="detail-val">{{ formatDate(user.last_login) }}</span></div>
        <div class="detail-row"><span class="detail-key">Dibuat</span><span class="detail-val">{{ formatDate(user.created_at) }}</span></div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <VaButton preset="secondary" @click="$emit('close')">Tutup</VaButton>
        <VaButton icon="mso-edit" @click="$emit('edit', user)">Edit</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { User } from '../../../stores/userManagement'

const props = defineProps<{ user: User }>()
const emit = defineEmits<{ close: []; edit: [user: User] }>()

const isOpen = ref(true)

const formatDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.detail-rows { display: flex; flex-direction: column; gap: 4px; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.detail-row:last-child { border-bottom: none; }
.detail-key { opacity: 0.5; font-weight: 500; }
.detail-val { font-weight: 500; }
</style>
