// @ts-check
import { fileURLToPath } from 'node:url'
import tailwind from 'eslint-plugin-tailwindcss'
import withNuxt from '../.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    '@stylistic/arrow-parens': ['error', 'always'],
    '@stylistic/comma-dangle': ['error', 'never'],
    '@stylistic/quote-props': ['error', 'as-needed'],
    '@stylistic/space-before-function-paren': ['error', 'always'],
    // Nuxt namespaces components by directory (form-button, icon-apple), so single-word files are fine
    'vue/multi-word-component-names': 'off',
    // Hooks for scoped @apply rules, not Tailwind utilities
    'tailwindcss/no-custom-classname': ['warn', { whitelist: ['th', 'tr', 'consent', 'blob', 'yellow', 'red', 'orange', 'form-input'] }]
  }
}).prepend([
  tailwind.configs.recommended,
  {
    settings: {
      tailwindcss: { cssConfigPath: fileURLToPath(new URL('../app/assets/tailwind.css', import.meta.url)) }
    }
  }
])
