import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        border: '#CCC0B8'
      },
      height: {
        statusbar: '30px'
      }
    }
  }
})
