<template>
  <RouterView />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  if (localStorage.getItem('accessToken')) {
    await authStore.fetchMe()
  }
})
</script>

<style lang="scss">
#app {
  font-family: 'Inter', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 20rem;
}
</style>
