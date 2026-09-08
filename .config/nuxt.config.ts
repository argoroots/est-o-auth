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
  // Security headers for every response: no framing, no foreign scripts, referrers carry only the origin; 'unsafe-inline' stays because Nuxt injects an inline importmap and config script, hashes would need a render:html plugin
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': [
          `base-uri 'self'`,
          `connect-src 'self' https://analytics.entu.dev`,
          `default-src 'self'`,
          `frame-ancestors 'none'`,
          `object-src 'none'`,
          `script-src 'self' 'unsafe-inline' https://analytics.entu.dev`,
          `style-src 'self' 'unsafe-inline'`
        ].join('; '),
        'Permissions-Policy': [
          'camera=()',
          'geolocation=()',
          'microphone=()',
          'payment=()'
        ].join(', '),
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': [
          'includeSubDomains',
          'max-age=31536000'
        ].join('; '),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  },
  compatibilityDate: '2026-09-07',
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
