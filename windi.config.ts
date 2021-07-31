import { defineConfig } from 'windicss/helpers'
import colors from 'windicss/colors'

export default defineConfig({
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        border: '#CCC0B8'
      },
    },
  }
})