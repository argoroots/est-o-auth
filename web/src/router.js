import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/auth'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue')
  },
  {
    path: '/auth/e-mail',
    name: 'AuthEmail',
    component: () => import('@/views/AuthEmail.vue')
  },
  {
    path: '/auth/mobile-id',
    name: 'AuthMobileID',
    component: () => import('@/views/AuthMobileID.vue')
  },
  {
    path: '/auth/smart-id',
    name: 'AuthSmartID',
    component: () => import('@/views/AuthSmartID.vue')
  },
  {
    path: '/auth/id-card',
    name: 'AuthIDCard',
    component: () => import('@/views/AuthIDCard.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
