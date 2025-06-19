import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:10001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/auth/, '/auth'),
      },
      '/user': {
        target: 'http://localhost:10002',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/user/, '/user'),
      }
    }
  }
})
