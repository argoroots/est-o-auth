import { createRouter, createWebHistory } from 'vue-router'
import { get } from '@/api.js'

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/docs',
    name: 'DocsPage',
    meta: { title: 'Documentation' },
    component: () => import('@/views/DocsPage.vue')
  },
  {
    path: '/terms',
    name: 'TermsPage',
    meta: { title: 'Terms & Conditions' },
    component: () => import('@/views/TermsPage.vue')
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
        path: 'apple',
        name: 'AuthApple',
        meta: { title: 'Apple' },
        component: () => import('@/views/auth/AuthApple.vue')
      },
      {
        path: 'google',
        name: 'AuthGoogle',
        meta: { title: 'Google' },
        component: () => import('@/views/auth/AuthGoogle.vue')
      },
      {
        path: 'smart-id',
        name: 'AuthSmartID',
        meta: { title: 'Smart-ID' },
        component: () => import('@/views/auth/AuthSmartID.vue')
      },
      {
        path: 'mobile-id',
        name: 'AuthMobileID',
        meta: { title: 'Mobile-ID' },
        component: () => import('@/views/auth/AuthMobileID.vue')
      },
      {
        path: 'id-card',
        name: 'AuthIDCard',
        meta: { title: 'ID-Card' },
        component: () => import('@/views/auth/AuthIDCard.vue')
      },
      {
        path: 'e-mail',
        name: 'AuthEmail',
        meta: { title: 'E-mail' },
        component: () => import('@/views/auth/AuthEmail.vue')
      },
      {
        path: 'phone',
        name: 'AuthPhone',
        meta: { title: 'Phone' },
        component: () => import('@/views/auth/AuthPhone.vue')
      },
      {
        path: 'error',
        name: 'AuthError',
        meta: { title: 'Error' },
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
  const { meta, path, query } = to

  document.title = meta.title ? `OAuth.ee · ${meta.title}` : 'OAuth.ee'

  if (['/', '/auth/error', '/docs', '/terms'].includes(path)) {
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

  const client = await get('client', {
    client_id: query.client_id,
    redirect_uri: query.redirect_uri
  })

  if (!client.client) {
    next({ path: '/auth/error', query: { ...query, error: 'client_id' } })
    return
  }

  // if (!client.redirect_uri) {
  //   next({ path: '/auth/error', query: { ...query, error: 'redirect_uri' } })
  //   return
  // }

  if (path.startsWith('/auth/') && !client.providers.some(x => path === `/auth/${x}`)) {
    next({ path: '/auth/error', query: { ...query, error: 'provider' } })
    return
  }

  to.meta.description = client.description
  to.meta.providers = client.providers

  next()
})

export default router
