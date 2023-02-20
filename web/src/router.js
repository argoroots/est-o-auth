import { createRouter, createWebHistory } from 'vue-router'
import { post } from '@/api.js'

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/docs',
    name: 'DocsPage',
    component: () => import('@/views/DocsPage.vue')
  },
  {
    path: '/auth',
    name: 'AuthPage',
    component: () => import('@/views/AuthPage.vue'),
    children: [
      {
        path: '',
        name: 'AuthNav',
        component: () => import('@/views/auth/AuthNav.vue')
      },
      {
        path: 'mobile-id',
        name: 'AuthMobileID',
        component: () => import('@/views/auth/AuthMobileID.vue')
      },
      {
        path: 'smart-id',
        name: 'AuthSmartID',
        component: () => import('@/views/auth/AuthSmartID.vue')
      },
      {
        path: 'id-card',
        name: 'AuthIDCard',
        component: () => import('@/views/auth/AuthIDCard.vue')
      },
      {
        path: 'e-mail',
        name: 'AuthEmail',
        component: () => import('@/views/auth/AuthEmail.vue')
      },
      {
        path: 'phone',
        name: 'AuthPhone',
        component: () => import('@/views/auth/AuthPhone.vue')
      },
      {
        path: 'error',
        name: 'AuthError',
        component: () => import('@/views/auth/AuthError.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { path, query } = to

  if (['/', '/docs', '/auth/error'].includes(path)) {
    next()
    return
  }

  if (path === '/auth/e-mail' && query.code && query.email) {
    next()
    return
  }

  if (query.response_type !== 'code') {
    next({ path: '/auth/error', query: { ...query, error: 'response_type' } })
    return
  }

  if (query.scope !== 'openid') {
    next({ path: '/auth/error', query: { ...query, error: 'scope' } })
    return
  }

  if (!query.client_id || !query.redirect_uri || !query.state) {
    next({ path: '/auth/error', query: { ...query, error: 'missing_parameter' } })
    return
  }

  const response = await post('client', {
    client_id: query.client_id,
    redirect_uri: query.redirect_uri
  })

  console.log(response)

  next()
})

export default router
