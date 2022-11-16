import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        /* bg */
        'primary-bg': 'var(--primary-bg)',
        'secondary-bg': 'var(--secondary-bg)',
        'tertiary-bg': 'var(--tertiary-bg)',
        'variant-bg': 'var(--variant-bg)',
        /* text */
        base: 'var(--base)',
        dark: 'var(--dark)',
        /* status */
        disable: 'var(--disable)',
        error: 'var(--error)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      height: {
        statusbar: '30px',
      },
    },
  },
})

// '#2dd4bf'
