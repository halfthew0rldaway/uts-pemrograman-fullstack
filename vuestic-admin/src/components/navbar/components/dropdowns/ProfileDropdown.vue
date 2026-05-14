<template>
  <div class="profile-dropdown-wrapper">
    <VaDropdown v-model="isShown" :offset="[9, 0]" class="profile-dropdown" stick-to-edges>
      <template #anchor>
        <VaButton preset="secondary" color="textPrimary">
          <span class="profile-dropdown__anchor min-w-max">
            <slot />
            <VaAvatar
              :src="authStore.user?.profile_photo ? `${apiBase}/uploads/photos/${authStore.user.profile_photo}` : undefined"
              :fallback-text="authStore.user?.username?.charAt(0)?.toUpperCase() || 'U'"
              :size="32"
              color="primary"
            />
          </span>
        </VaButton>
      </template>
      <VaDropdownContent
        class="profile-dropdown__content md:w-60 px-0 py-4 w-full"
        :style="{ '--hover-color': hoverColor }"
      >
        <!-- User info header -->
        <div class="px-4 pb-3 border-b border-gray-100">
          <div class="font-semibold text-sm">{{ authStore.user?.full_name || authStore.user?.username }}</div>
          <div class="text-xs text-secondary">{{ authStore.user?.email }}</div>
          <VaBadge
            :text="authStore.user?.role || ''"
            :color="authStore.user?.role === 'Admin' ? 'primary' : 'secondary'"
            class="mt-1"
            size="small"
          />
        </div>

        <VaList>
          <VaListItem
            class="menu-item px-4 text-base cursor-pointer h-8"
            :to="{ name: 'profile' }"
          >
            <VaIcon name="mso-account_circle" class="pr-1" color="secondary" />
            Profil Saya
          </VaListItem>
          <VaListItem
            class="menu-item px-4 text-base cursor-pointer h-8"
            :to="{ name: 'settings' }"
          >
            <VaIcon name="mso-settings" class="pr-1" color="secondary" />
            Pengaturan
          </VaListItem>
          <VaListSeparator class="mx-3 my-2" />
          <VaListItem
            class="menu-item px-4 text-base cursor-pointer h-8 text-danger"
            @click="handleLogout"
          >
            <VaIcon name="mso-logout" class="pr-1" color="danger" />
            <span class="text-danger">Logout</span>
          </VaListItem>
        </VaList>
      </VaDropdownContent>
    </VaDropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useColors } from 'vuestic-ui'
import { useAuthStore } from '../../../../stores/auth'

const { colors, setHSLAColor } = useColors()
const hoverColor = computed(() => setHSLAColor(colors.focus, { a: 0.1 }))

const authStore = useAuthStore()
const router = useRouter()
const isShown = ref(false)

const apiBase = 'http://localhost:5000'

const handleLogout = async () => {
  isShown.value = false
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style lang="scss">
.profile-dropdown {
  cursor: pointer;

  &__content {
    .menu-item:hover {
      background: var(--hover-color);
    }
  }

  &__anchor {
    display: inline-block;
  }
}
</style>
