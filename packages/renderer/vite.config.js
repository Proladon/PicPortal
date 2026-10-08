/* eslint-env node */

import { join } from 'path'
import { defineConfig } from 'vite'
import { loadAndSetEnv } from '../../scripts/loadAndSetEnv.mjs'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const PACKAGE_ROOT = __dirname

/**
 * Vite looks for `.env.[mode]` files only in `PACKAGE_ROOT` directory.
 * Therefore, you must manually load and set the environment variables from the root directory above
 */
loadAndSetEnv(process.env.MODE, process.cwd())

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      // shadcn-vue components use the `@/` alias (see components.json).
      '@': join(PACKAGE_ROOT, 'src')
    }
  },
  plugins: [vue(), tailwindcss()],
  define: {
    // Compile i18n messages without `new Function` (blocked by the CSP).
    __INTLIFY_JIT_COMPILATION__: true,
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false
  },
  clearScreen: false,

  base: '',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
    fs: { allow: [join(PACKAGE_ROOT, '../../')] }
  },
  build: {
    sourcemap: true,
    target: ['chrome105', 'safari13'],
    outDir: 'dist',
    assetsDir: '.',
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
      compress: {
        passes: 2
      },
      safari10: false
    },
    emptyOutDir: true
  }
})
