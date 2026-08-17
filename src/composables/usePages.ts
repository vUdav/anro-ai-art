import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'
import type { Service } from '../types/content'
import heroRaw from '../content/pages/hero.json'
import aboutRaw from '../content/pages/about.json'
import contactsRaw from '../content/pages/contacts.json'
import servicesRaw from '../content/pages/services.json'
import seoRaw from '../content/singletons/settings.json'

export function useHero() {
  const { locale } = useI18n()
  return computed(() => {
    const l = heroRaw[locale.value as AppLocale] ?? heroRaw.ru
    return { ...l }
  })
}

export function useAbout() {
  const { locale } = useI18n()
  return computed(() => {
    const l = aboutRaw[locale.value as AppLocale] ?? aboutRaw.ru
    return { ...l, photo: l.photo ?? aboutRaw.ru.photo }
  })
}

export function useServices() {
  const { locale } = useI18n()
  const services = computed<Service[]>(() => {
    const l = servicesRaw[locale.value as AppLocale] ?? servicesRaw.ru
    return [
      { icon: 'image', slug: 'image', title: l.image.title, description: l.image.description, items: l.image.items ?? [] },
      { icon: 'video', slug: 'video', title: l.video.title, description: l.video.description, items: l.video.items ?? [] },
    ]
  })
  return { services }
}

export function useSeoContent() {
  const { locale } = useI18n()
  return computed(() => {
    const l = seoRaw[locale.value as AppLocale] ?? seoRaw.ru
    return { ...l }
  })
}

export function useContacts() {
  const { locale } = useI18n()
  return computed(() => {
    const l = contactsRaw[locale.value as AppLocale] ?? contactsRaw.ru
    const fb = contactsRaw.ru as unknown as Record<string, string | undefined>
    const root = contactsRaw as unknown as Record<string, string | undefined>
    const pick = (k: string) => root[k] ?? fb[k]
    return {
      telegram: pick('telegram'),
      channel: pick('channel'),
      instagram: pick('instagram'),
      orderLink: pick('orderLink'),
      ...l,
    }
  })
}
