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
  },
  {
    path: '/auth/error',
    name: 'Error',
    component: () => import('@/views/Error.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const { path, query } = to

  if (['/', '/auth/error'].includes(path)) {
    next()
    return
  }

  if (!query.response_type || !query.client_id || !query.redirect_uri || !query.scope || !query.state) {
    next({ path: '/auth/error', query: { ...query, error: 'missing_parameter' } })
    return
  }

  if (query.response_type !== 'code') {
    next({ path: '/auth/error', query: { ...query, error: 'response_type' } })
    return
  }

  if (query.client_id !== 'test') {
    next({ path: '/auth/error', query: { ...query, error: 'client_id' } })
    return
  }

  if (query.redirect_uri !== 'localhost') {
    next({ path: '/auth/error', query: { ...query, error: 'redirect_uri' } })
    return
  }

  if (query.scope !== 'openid') {
    next({ path: '/auth/error', query: { ...query, error: 'scope' } })
    return
  }

  next()
})

export default router
