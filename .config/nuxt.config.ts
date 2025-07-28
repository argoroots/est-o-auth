// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss'
  ],
  ssr: false,
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Use Estonian ID-card, Mobile-ID, Smart-ID or E-mail as OAuth authentication provider' },
        { name: 'keywords', content: 'oauth, authenticate, id-card, mobile-id, smart-id' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/oauth-256.png' }
      ],
      script: [
        { src: 'https://plausible.io/js/script.js', 'data-domain': 'oauth.ee', defer: true }
      ]
    }
  },
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
    stripeKey: ''
  },
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-08-05',
  eslint: {
    config: {
      autoInit: false,
      stylistic: true
    }
  },
  i18n: {
    vueI18n: '~~/.config/i18n.config.ts'
  },
  tailwindcss: {
    cssPath: '~/assets/tailwind.css',
    configPath: '~~/.config/tailwind.config.ts'
  }
})
