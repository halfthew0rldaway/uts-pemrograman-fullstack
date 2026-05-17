<template>
  <div class="brand-logo" :style="{ '--logo-height': height + 'px' }">
    <span class="brand-logo-main" :style="{ color: mainColor }">
      PT Digital Nusantara
    </span>
    <span class="brand-logo-sub" :style="{ color: subColor }">
      HR System
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    height?: number
    start?: string
    end?: string
  }>(),
  {
    height: 18,
    start: '',
    end: '',
  },
)

const mainColor = computed(() => props.start || '#0E41C9')
const subColor = computed(() => props.end || props.start || '#0E41C9')

function adjustOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${opacity})`
  }
  return color
}
</script>

<style scoped>
.brand-logo {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  gap: 1px;
  font-family: 'Inter', sans-serif;
  user-select: none;
}

.brand-logo-main {
  font-size: calc(var(--logo-height) * 0.85);
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.brand-logo-sub {
  font-size: calc(var(--logo-height) * 0.55);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
