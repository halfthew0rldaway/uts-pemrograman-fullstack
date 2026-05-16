<template>
  <VaLayout
    :top="{ fixed: true, order: 2 }"
    :left="{ fixed: true, absolute: breakpoints.mdDown, order: 1, overlay: breakpoints.mdDown && !isSidebarMinimized }"
    @leftOverlayClick="isSidebarMinimized = true"
  >
    <template #top>
      <AppNavbar :is-mobile="isMobile" />
    </template>

    <template #left>
      <div
        class="sidebar-hover-zone"
        @mouseenter="onSidebarMouseEnter"
        @mouseleave="onSidebarMouseLeave"
      >
        <AppSidebar
          :minimized="isSidebarMinimized"
          :visible="!isMobile || !isSidebarMinimized"
          :mobile="isMobile"
          @update:visible="
            (v) => {
              if (!v) isSidebarMinimized = true
            }
          "
        />
      </div>
    </template>

    <template #content>
      <div :class="{ minimized: isSidebarMinimized }" class="app-layout__sidebar-wrapper">
        <div v-if="isFullScreenSidebar" class="flex justify-end">
          <VaButton class="px-4 py-4" icon="md_close" preset="plain" @click="onCloseSidebarButtonClick" />
        </div>
      </div>
      <AppLayoutNavigation v-if="!isMobile" class="px-4 pt-3 pb-0" />
      <main class="px-4 pt-0 pb-3">
        <article>
          <RouterView v-slot="{ Component }">
            <Transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </article>
      </main>
    </template>
  </VaLayout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteUpdate } from 'vue-router'
import { useBreakpoint } from 'vuestic-ui'

import { useGlobalStore } from '../stores/global-store'

import AppLayoutNavigation from '../components/app-layout-navigation/AppLayoutNavigation.vue'
import AppNavbar from '../components/navbar/AppNavbar.vue'
import AppSidebar from '../components/sidebar/AppSidebar.vue'

const GlobalStore = useGlobalStore()
const breakpoints = useBreakpoint()

const sidebarWidth = ref('16rem')
const sidebarMinimizedWidth = ref(undefined)

const isMobile = ref(false)
const isTablet = ref(false)
const { isSidebarMinimized } = storeToRefs(GlobalStore)

// Default: sidebar minimized (icon-only mode)
isSidebarMinimized.value = true

// Hover-to-expand — use longer delay to feel deliberate, not twitchy
const hoverTimer = ref(null)
const collapseTimer = ref(null)

const onSidebarMouseEnter = () => {
  if (isMobile.value) return
  // Cancel any pending collapse
  if (collapseTimer.value) {
    clearTimeout(collapseTimer.value)
    collapseTimer.value = null
  }
  // Small delay before expanding to avoid accidental triggers
  hoverTimer.value = setTimeout(() => {
    isSidebarMinimized.value = false
  }, 80)
}

const onSidebarMouseLeave = () => {
  if (isMobile.value) return
  // Cancel any pending expand
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }
  // Longer delay before collapsing — feels more stable
  collapseTimer.value = setTimeout(() => {
    isSidebarMinimized.value = true
  }, 300)
}

const onResize = () => {
  isMobile.value = breakpoints.smDown
  isTablet.value = breakpoints.mdDown
  sidebarMinimizedWidth.value = '4.5rem'
  sidebarWidth.value = isTablet.value ? '100%' : '16rem'
  if (isMobile.value) isSidebarMinimized.value = true
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  onResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (hoverTimer.value) clearTimeout(hoverTimer.value)
  if (collapseTimer.value) clearTimeout(collapseTimer.value)
})

onBeforeRouteUpdate(() => {
  if (breakpoints.mdDown) {
    isSidebarMinimized.value = true
  }
})

const isFullScreenSidebar = computed(() => isTablet.value && !isSidebarMinimized.value)

const onCloseSidebarButtonClick = () => {
  isSidebarMinimized.value = true
}
</script>

<style lang="scss" scoped>
.sidebar-hover-zone {
  height: 100%;
  display: flex;
  // Extend hover area slightly to prevent accidental collapse
  // when moving mouse from sidebar to content
}

// Override VaSidebar's internal transition for smoothness
:deep(.va-sidebar) {
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: width;
  overflow: hidden !important;
}

// Prevent VaSidebar content from jumping during transition
:deep(.va-sidebar__content) {
  transition: none !important;
  overflow: hidden !important;
}

// Prevent sidebar items from wrapping during transition
:deep(.va-sidebar-item-content) {
  white-space: nowrap;
  overflow: hidden;
}

// Prevent title text from causing layout shift
:deep(.va-sidebar-item__title) {
  overflow: hidden;
  white-space: nowrap;
}
</style>
