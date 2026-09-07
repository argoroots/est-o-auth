import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n'
  ],
  ssr: false,
  app: {
    head: {
      meta: [
        { name: 'description', content: 'Use Estonian ID-card, Mobile-ID, Smart-ID or E-mail as OAuth authentication provider' },
        { name: 'keywords', content: 'oauth, authenticate, id-card, mobile-id, smart-id' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/oauth-256.png' }
      ],
      script: [
        { src: 'https://analytics.entu.dev/ea.min.js', 'data-site': 'oauth.ee', crossorigin: 'anonymous', defer: true }
      ]
    }
  },
  css: ['~/assets/tailwind.css'],
  spaLoadingTemplate: false,
  runtimeConfig: {
    url: '',
    jwtSecret: '',
    emailFrom: '',
    awsId: '',
    awsSecret: '',
    awsRegion: '',
    skidName: '',
    skidUuid: '',
    appleId: '',
    appleTeam: '',
    appleSecret: '',
    googleId: '',
    googleSecret: '',
    stripeKey: '',
    testUser: ''
  },
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-08-05',
  vite: {
    plugins: [tailwindcss()]
  },
  eslint: {
    config: {
      autoInit: false,
      stylistic: true
    }
  },
  i18n: {
    vueI18n: '~~/.config/i18n.config.ts',
    locales: [
      { code: 'en', language: 'en', file: 'en.json' },
      { code: 'et', language: 'et', file: 'et.json' },
      { code: 'fi', language: 'fi', file: 'fi.json' }
    ],
    defaultLocale: 'en',
    // Language is chosen by the `lang` query parameter (app/middleware/locale.global.js), not by URL or browser
    strategy: 'no_prefix',
    detectBrowserLanguage: false
  }
})
