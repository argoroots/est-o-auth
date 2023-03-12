/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      animation: {
        blob: 'blob 9s infinite',
        spin: 'spin 2s linear infinite'
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)'
          },
          '33%': {
            transform: 'translate(60px, -60px) scale(1.2)'
          },
          '66%': {
            transform: 'translate(-40px, 40px) scale(0.9)'
          },
          '100%': {
            transform: 'tranlate(0px, 0px) scale(1)'
          }
        }
      }
    }
  },
  plugins: []
}
