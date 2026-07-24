import { createI18n } from 'vue-i18n'
import ru from '../locales/ru.json'
import en from '../locales/en.json'
import be from '../locales/be.json'

export const SUPPORTED_LOCALES = ['ru', 'en', 'be'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'ru'

export const LOCALE_NAMES: Record<AppLocale, string> = {
  ru: 'RU',
  en: 'EN',
  be: 'BE',
}

export function createI18nInstance() {
  return createI18n({
    legacy: false,
    globalInjection: true,
    locale: DEFAULT_LOCALE,
    fallbackLocale: 'ru',
    messages: { ru, en, be },
  })
}
