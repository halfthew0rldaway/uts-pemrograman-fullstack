<template>
  <div class="app-navbar-actions">
    <!-- Dark mode toggle -->
    <VaButton
      preset="secondary"
      color="textPrimary"
      class="app-navbar-actions__item"
      :icon="isDark ? 'mso-light_mode' : 'mso-dark_mode'"
      :title="isDark ? 'Mode Terang' : 'Mode Gelap'"
      @click="toggleColorMode"
    />

    <!-- Notifikasi -->
    <NotificationDropdown class="app-navbar-actions__item" />

    <!-- Profil & Logout -->
    <ProfileDropdown class="app-navbar-actions__item app-navbar-actions__item--profile mr-1" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useColors } from 'vuestic-ui'
import ProfileDropdown from './dropdowns/ProfileDropdown.vue'
import NotificationDropdown from './dropdowns/NotificationDropdown.vue'

defineProps({
  isMobile: { type: Boolean, default: false },
})

const { currentPresetName, applyPreset } = useColors()
const isDark = computed(() => currentPresetName.value === 'dark')

const toggleColorMode = () => {
  applyPreset(isDark.value ? 'default' : 'dark')
}
</script>

<style lang="scss">
.app-navbar-actions {
  display: flex;
  align-items: center;

  .va-dropdown__anchor {
    color: var(--va-primary);
    fill: var(--va-primary);
  }

  &__item {
    padding: 0;
    margin-left: 0.25rem;
    margin-right: 0.25rem;

    svg {
      height: 20px;
    }

    &--profile {
      display: flex;
      justify-content: center;
    }

    .va-dropdown-content {
      background-color: var(--va-white);
    }

    @media screen and (max-width: 640px) {
      margin-left: 0;
      margin-right: 0;

      &:first-of-type {
        margin-left: 0;
      }
    }
  }
}
</style>
