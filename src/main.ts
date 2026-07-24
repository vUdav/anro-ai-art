import { ViteSSG } from 'vite-ssg'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import { routes } from './router'
import { createI18nInstance, SUPPORTED_LOCALES, type AppLocale } from './i18n'

import './styles/tokens.css'
import './styles/base.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to, _from, savedPosition) {
      if (to.hash) {
        return { el: to.hash, behavior: 'smooth', top: 80 }
      }
      if (savedPosition) return savedPosition
      // Смена языка (/, /en, /be) не должна прокручивать к началу
      if (to.path !== _from.path && to.hash === '' && _from.name) {
        return false
      }
      return { top: 0 }
    },
  },
  ({ app, router, initialState }) => {
    const i18n = createI18nInstance()
    app.use(i18n)
    app.use(MotionPlugin)

    // Синхронизируем локаль с префиксом маршрута (/en, /be) и <html lang>
    router.beforeEach((to) => {
      const seg = String(to.path).split('/')[1]
      const locale: AppLocale = (SUPPORTED_LOCALES as readonly string[]).includes(seg)
        ? (seg as AppLocale)
        : 'ru'
      if (i18n.global.locale.value !== locale) {
        i18n.global.locale.value = locale
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale
      }
    })

    void initialState
  },
)
