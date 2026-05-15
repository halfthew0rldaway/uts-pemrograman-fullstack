<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="isDev && isVisible" class="dev-creds-wrapper">
        <!-- Header -->
        <div class="dev-creds-header">
          <div class="flex items-center gap-2">
            <span class="dev-badge">DEV</span>
            <span class="dev-creds-title">Test Credentials</span>
          </div>
          <button class="dev-close-btn" aria-label="Tutup" @click="isVisible = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="dev-creds-body">
          <div
            v-for="item in credentials"
            :key="item.label"
            class="dev-cred-item"
            :title="`Klik untuk menyalin ${item.label}`"
            @click="copy(item.value, item.label)"
          >
            <span class="dev-cred-label">{{ item.label }}</span>
            <div class="dev-cred-value-wrap">
              <code class="dev-cred-value">{{ item.value }}</code>
              <span class="dev-copy-icon">
                <svg
                  v-if="copiedLabel !== item.label"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg
                  v-else
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ade80"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
          </div>

          <div class="dev-cred-item dev-cred-item--muted">
            <span class="dev-cred-label">CAPTCHA</span>
            <div class="dev-cred-value-wrap">
              <code class="dev-cred-value dev-cred-value--muted">auto-bypass</code>
            </div>
          </div>
        </div>

        <!-- Footer hint -->
        <div class="dev-creds-footer">Klik baris untuk menyalin</div>

        <!-- Copied toast -->
        <Transition name="fade">
          <div v-if="copiedLabel" class="dev-copied-toast">✓ {{ copiedLabel }} disalin</div>
        </Transition>
      </div>
    </Transition>

    <!-- Collapsed toggle -->
    <Transition name="fade">
      <button
        v-if="isDev && !isVisible"
        class="dev-toggle-btn"
        title="Tampilkan dev credentials"
        @click="isVisible = true"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </button>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const isDev = import.meta.env.DEV
const isVisible = ref(true)
const copiedLabel = ref('')

const credentials = [
  { label: 'Email', value: 'admin@ptdigitalnusantara.com' },
  { label: 'Password', value: 'Admin@123' },
]

const copy = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value)
    copiedLabel.value = label
    setTimeout(() => {
      copiedLabel.value = ''
    }, 2000)
  } catch {
    // fallback: select text
  }
}
</script>

<style scoped>
.dev-creds-wrapper {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  width: 288px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.2);
  background: var(--va-background-secondary, #1e293b);
  border: 1px solid rgba(255, 255, 255, 0.07);
  font-family: inherit;
}

.dev-creds-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(var(--va-primary-rgb, 59, 130, 246), 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dev-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--va-primary, #3b82f6);
  background: rgba(var(--va-primary-rgb, 59, 130, 246), 0.15);
  border: 1px solid rgba(var(--va-primary-rgb, 59, 130, 246), 0.3);
  border-radius: 4px;
  padding: 1px 6px;
}

.dev-creds-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--va-text-primary, #f1f5f9);
}

.dev-close-btn {
  background: none;
  border: none;
  color: var(--va-secondary, #94a3b8);
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    background 0.15s;
}
.dev-close-btn:hover {
  color: var(--va-text-primary, #f1f5f9);
  background: rgba(255, 255, 255, 0.08);
}

.dev-creds-body {
  padding: 10px 0;
}

.dev-cred-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  cursor: pointer;
  transition: background 0.12s;
  gap: 8px;
}
.dev-cred-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.dev-cred-item--muted {
  cursor: default;
  opacity: 0.6;
}
.dev-cred-item--muted:hover {
  background: none;
}

.dev-cred-label {
  font-size: 11px;
  color: var(--va-secondary, #94a3b8);
  min-width: 60px;
  flex-shrink: 0;
}

.dev-cred-value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dev-cred-value {
  font-size: 11.5px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--va-primary, #60a5fa);
  background: rgba(var(--va-primary-rgb, 59, 130, 246), 0.1);
  border: 1px solid rgba(var(--va-primary-rgb, 59, 130, 246), 0.2);
  border-radius: 5px;
  padding: 2px 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}
.dev-cred-value--muted {
  color: var(--va-secondary, #94a3b8);
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.dev-copy-icon {
  color: var(--va-secondary, #94a3b8);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.dev-creds-footer {
  padding: 6px 14px 8px;
  font-size: 10.5px;
  color: var(--va-secondary, #64748b);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.dev-copied-toast {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(74, 222, 128, 0.15);
  border-top: 1px solid rgba(74, 222, 128, 0.25);
  color: #4ade80;
  font-size: 11px;
  text-align: center;
  padding: 5px;
}

.dev-toggle-btn {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--va-background-secondary, #1e293b);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--va-primary, #60a5fa);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition:
    background 0.15s,
    transform 0.15s;
}
.dev-toggle-btn:hover {
  background: rgba(var(--va-primary-rgb, 59, 130, 246), 0.15);
  transform: scale(1.05);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
