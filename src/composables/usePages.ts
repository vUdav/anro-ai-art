import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'
import heroRaw from '../content/pages/hero.json'
import aboutRaw from '../content/pages/about.json'
import contactsRaw from '../content/pages/contacts.json'

export function useHero() {
  const { locale } = useI18n()
  return computed(() => {
    const l = heroRaw[locale.value as AppLocale] ?? heroRaw.ru
    return { portrait: heroRaw.portrait, halos: heroRaw.halos ?? [], ...l }
  })
}

export function useAbout() {
  const { locale } = useI18n()
  return computed(() => {
    const l = aboutRaw[locale.value as AppLocale] ?? aboutRaw.ru
    return { photo: aboutRaw.photo, ...l }
  })
}

export function useContacts() {
  const { locale } = useI18n()
  return computed(() => {
    const l = contactsRaw[locale.value as AppLocale] ?? contactsRaw.ru
    return {
      telegram: contactsRaw.telegram,
      channel: contactsRaw.channel,
      instagram: contactsRaw.instagram,
      email: contactsRaw.email,
      orderLink: contactsRaw.orderLink,
      ...l,
    }
  })
}
