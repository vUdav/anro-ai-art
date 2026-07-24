import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

// Кастомный apex-домен anroai.art → сайт в корне → base '/'
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VueI18nPlugin({
      // локали грузятся через import.meta.glob в src/i18n, поэтому compositionOnly
      runtimeOnly: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Опции vite-ssg: пре-рендер маршрутов для SEO/OG
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    crittersOptions: false,
  },
})
