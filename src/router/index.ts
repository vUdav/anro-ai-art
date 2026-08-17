import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home-ru',
    component: HomeView,
  },
  ...SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({
    path: `/${locale}`,
    name: `home-${locale}`,
    component: HomeView,
  })),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]
