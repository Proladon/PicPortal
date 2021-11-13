import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        border: '#CCC0B8',
        darkBlue: '#333A46',
        'primary-bg': 'var(--primary-bg)',
        'secondary-bg': 'var(--secondary-bg)',
      },
      height: {
        statusbar: '30px',
      },
    },
  },
})
