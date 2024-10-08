// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-09-02',
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
  css: ['~/assets/tailwind.css'],
  i18n: {
    vueI18n: './i18n.config.ts'
  },
  modules: [
    '@nuxtjs/i18n'
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
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
    googleSecret: ''
  },
  spaLoadingTemplate: false,
  ssr: false
})
