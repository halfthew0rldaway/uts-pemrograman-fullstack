import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import AuthLayout from '../layouts/AuthLayout.vue'
import AppLayout from '../layouts/AppLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: '404' },
  },
  {
    name: 'admin',
    path: '/',
    component: AppLayout,
    redirect: { name: 'dashboard' },
    meta: { requiresAuth: true },
    children: [
      {
        name: 'dashboard',
        path: 'dashboard',
        component: () => import('../pages/admin/dashboard/Dashboard.vue'),
      },
      {
        name: 'employees',
        path: 'employees',
        component: () => import('../pages/employees/EmployeesPage.vue'),
      },
      {
        name: 'users',
        path: 'users',
        component: () => import('../pages/users/UsersPage.vue'),
      },
      {
        name: 'profile',
        path: 'profile',
        component: () => import('../pages/profile/ProfilePage.vue'),
      },
      {
        name: 'logs',
        path: 'logs',
        component: () => import('../pages/logs/ActivityLogPage.vue'),
      },
      {
        name: 'settings',
        path: 'settings',
        component: () => import('../pages/settings/Settings.vue'),
      },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        name: 'login',
        path: 'login',
        component: () => import('../pages/auth/Login.vue'),
      },
      {
        name: 'forgot-password',
        path: 'forgot-password',
        component: () => import('../pages/auth/ForgotPassword.vue'),
      },
      {
        path: '',
        redirect: { name: 'login' },
      },
    ],
  },
  {
    name: '404',
    path: '/404',
    component: () => import('../pages/404.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    window.scrollTo(0, 0)
  },
  routes,
})

// Navigation guard — redirect ke login jika belum autentikasi
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const token = localStorage.getItem('accessToken')

  // Sudah login tapi akses halaman auth → redirect ke dashboard
  if (!requiresAuth && to.path.startsWith('/auth') && token) {
    return next({ name: 'dashboard' })
  }

  if (!requiresAuth) return next()
  if (!token) return next({ name: 'login' })
  next()
})

export default router
