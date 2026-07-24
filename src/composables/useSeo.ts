import { computed, unref, type MaybeRef } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type AppLocale } from '../i18n'

const SITE_URL = 'https://anroai.art'
// Для лучшего превью в соцсетях замените на реальный 1200×630 .jpg (см. CONTENT_GUIDE.md)
const OG_IMAGE = `${SITE_URL}/og-default.svg`

function pathForLocale(locale: AppLocale): string {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}`
}

export function useSeo(options: { title: MaybeRef<string>; description: MaybeRef<string> }) {
  const { locale } = useI18n()

  const title = computed(() => unref(options.title))
  const description = computed(() => unref(options.description))
  const canonical = computed(() => `${SITE_URL}${pathForLocale(locale.value as AppLocale)}`)

  useHead({
    title,
    htmlAttrs: { lang: computed(() => locale.value) },
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Anro — AI Creator' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:locale', content: computed(() => locale.value) },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    link: [
      { rel: 'canonical', href: canonical },
      ...SUPPORTED_LOCALES.map((l) => ({
        rel: 'alternate',
        hreflang: l,
        href: `${SITE_URL}${pathForLocale(l)}`,
      })),
      { rel: 'alternate', hreflang: 'x-default', href: SITE_URL },
    ],
  })
}
