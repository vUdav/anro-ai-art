import { computed, unref, type MaybeRef } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type AppLocale } from '../i18n'

const SITE_URL = 'https://anroai.art'
// OG-территории для og:locale (OpenGraph ждёт language_TERRITORY, не голый код)
const OG_TERRITORY: Record<AppLocale, string> = { ru: 'ru_RU', en: 'en_US', be: 'be_BY' }

function pathForLocale(locale: AppLocale): string {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}`
}

export function useSeo(options: { title: MaybeRef<string>; description: MaybeRef<string> }) {
  const { locale } = useI18n()

  const title = computed(() => unref(options.title))
  const description = computed(() => unref(options.description))
  const canonical = computed(() => `${SITE_URL}${pathForLocale(locale.value as AppLocale)}`)
  // Превью на языке ссылки: og-ru.jpg / og-en.jpg / og-be.jpg (1200×630)
  const ogImage = computed(() => `${SITE_URL}/og-${locale.value}.jpg`)
  const ogLocale = computed(() => OG_TERRITORY[locale.value as AppLocale] ?? OG_TERRITORY.ru)

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
      { property: 'og:image', content: ogImage },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: ogLocale },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
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
