<template>
  <VaSidebar
    v-model="writableVisible"
    :width="sidebarWidth"
    :color="color"
    :minimized="minimized"
    minimized-width="4.5rem"
  >
    <VaAccordion v-model="value" multiple>
      <VaCollapse v-for="(route, index) in filteredRoutes" :key="index">
        <template #header="{ value: isCollapsed }">
          <VaSidebarItem
            :to="route.children ? undefined : { name: route.name }"
            :active="routeHasActiveChild(route)"
            :active-color="activeColor"
            :text-color="textColor(route)"
            :title="minimized ? t(route.displayName) : undefined"
            :aria-label="`${route.children ? 'Open category ' : 'Visit'} ${t(route.displayName)}`"
            role="button"
            hover-opacity="0.10"
          >
            <!-- Custom content: icon always at fixed left, text fades -->
            <div class="sidebar-row py-3">
              <VaIcon
                v-if="route.meta.icon"
                aria-hidden="true"
                :name="route.meta.icon"
                size="20px"
                :color="iconColor(route)"
                class="sidebar-row__icon"
              />
              <span
                class="sidebar-row__label"
                :class="{ 'sidebar-row__label--hidden': minimized }"
              >
                {{ t(route.displayName) }}
                <VaIcon v-if="route.children" :name="arrowDirection(isCollapsed)" size="16px" class="ml-1" />
              </span>
            </div>
          </VaSidebarItem>
        </template>
        <template #body>
          <div
            class="sidebar-children"
            :class="{ 'sidebar-children--hidden': minimized }"
          >
            <div v-for="(childRoute, index2) in route.children" :key="index2">
              <VaSidebarItem
                :to="{ name: childRoute.name }"
                :active="isActiveChildRoute(childRoute)"
                :active-color="activeColor"
                :text-color="textColor(childRoute)"
                :aria-label="`Visit ${t(childRoute.displayName)}`"
                hover-opacity="0.10"
              >
                <div class="sidebar-row py-3 pl-8">
                  <span class="sidebar-row__label" :class="{ 'sidebar-row__label--hidden': minimized }">
                    {{ t(childRoute.displayName) }}
                  </span>
                </div>
              </VaSidebarItem>
            </div>
          </div>
        </template>
      </VaCollapse>
    </VaAccordion>
  </VaSidebar>
</template>

<script lang="ts">
import { defineComponent, watch, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useColors } from 'vuestic-ui'
import navigationRoutes, { type INavigationRoute } from './NavigationRoutes'
import { useAuthStore } from '../../stores/auth'

export default defineComponent({
  name: 'Sidebar',
  props: {
    visible: { type: Boolean, default: true },
    minimized: { type: Boolean, default: false },
    mobile: { type: Boolean, default: false },
  },
  emits: ['update:visible'],

  setup: (props, { emit }) => {
    const { getColor, colorToRgba } = useColors()
    const route = useRoute()
    const { t } = useI18n()
    const value = ref<boolean[]>([])
    const authStore = useAuthStore()

    // Filter routes based on role
    const filteredRoutes = computed(() =>
      navigationRoutes.routes.filter((r: INavigationRoute) =>
        r.meta.adminOnly ? authStore.isAdmin : true
      )
    )

    const writableVisible = computed({
      get: () => props.visible,
      set: (v: boolean) => emit('update:visible', v),
    })

    const isActiveChildRoute = (child: INavigationRoute) => route.name === child.name

    const routeHasActiveChild = (section: INavigationRoute) => {
      if (!section.children) return route.path.endsWith(`${section.name}`)
      return section.children.some(({ name }) => route.path.endsWith(`${name}`))
    }

    const setActiveExpand = () =>
      (value.value = filteredRoutes.value.map((r: INavigationRoute) => routeHasActiveChild(r)))

    const sidebarWidth = computed(() => (props.mobile ? '100vw' : '280px'))
    const color = computed(() => getColor('background-secondary'))
    const activeColor = computed(() => colorToRgba(getColor('focus'), 0.1))
    const iconColor = (r: INavigationRoute) => (routeHasActiveChild(r) ? 'primary' : 'secondary')
    const textColor = (r: INavigationRoute) => (routeHasActiveChild(r) ? 'primary' : 'textPrimary')
    const arrowDirection = (state: boolean) => (state ? 'va-arrow-up' : 'va-arrow-down')

    watch(() => route.fullPath, setActiveExpand, { immediate: true })

    return {
      writableVisible, sidebarWidth, value, color, activeColor,
      filteredRoutes, routeHasActiveChild, isActiveChildRoute,
      minimized: computed(() => props.minimized),
      t, iconColor, textColor, arrowDirection,
    }
  },
})
</script>

<style scoped>
/*
  Core idea:
  - Icon is ALWAYS at a fixed left position (pl-4 = 1rem from left)
  - Label fades + clips to the right of the icon
  - No justify-center ever — icon never moves
*/

.sidebar-row {
  display: flex;
  align-items: center;
  padding-left: 1rem;
  padding-right: 0.5rem;
  width: 100%;
  overflow: hidden;
}

.sidebar-row__icon {
  flex-shrink: 0;
  /* Icon stays at exact same position always */
  width: 20px;
  height: 20px;
}

.sidebar-row__label {
  display: flex;
  align-items: center;
  margin-left: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  /* Symmetric fade — same duration for show and hide */
  opacity: 1;
  max-width: 180px;
  transition:
    opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    margin-left 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-row__label--hidden {
  opacity: 0;
  max-width: 0;
  margin-left: 0;
  pointer-events: none;
}

/* Children section fades symmetrically */
.sidebar-children {
  overflow: hidden;
  max-height: 500px;
  opacity: 1;
  transition:
    max-height 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-children--hidden {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
