module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js}'
  ],
  theme: {
    extend: {
      animation: {
        blob: 'blob 9s infinite'
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
