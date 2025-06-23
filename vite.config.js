import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 1. 读取 .env 文件变量
  const env = loadEnv(mode, process.cwd())
  // 2. 读取前缀，自动生成 proxy 配置
  const prefixes = (env.VITE_PROXY_PREFIXES || '').split(',').map(i => i.trim()).filter(Boolean)

  const proxy = {}
  prefixes.forEach(prefix => {
    proxy[prefix] = {
      target: env.VITE_PROXY_TARGET,
      changeOrigin: true,
      rewrite: path => path.replace(new RegExp('^' + prefix), prefix),
    }
  })

  return {
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
      proxy,
    }
  }
})
