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

// Абсолютный URL для og:image: путь из CMS ('/media/og-ru.jpg') → полный адрес
function absoluteUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src
  return `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`
}

export interface SeoOptions {
  title: MaybeRef<string>
  description: MaybeRef<string>
  keywords?: MaybeRef<string | string[] | undefined>
  ogImage?: MaybeRef<string | undefined>
  imageAlt?: MaybeRef<string | undefined>
}

export function useSeo(options: SeoOptions) {
  const { locale } = useI18n()

  const title = computed(() => unref(options.title))
  const description = computed(() => unref(options.description))
  const canonical = computed(() => `${SITE_URL}${pathForLocale(locale.value as AppLocale)}`)
  // Превью на языке ссылки: путь из CMS, иначе дефолт /media/og-<locale>.jpg (1200×630)
  const ogImage = computed(() => {
    const custom = unref(options.ogImage)
    return absoluteUrl(custom && custom.trim() ? custom : `/media/og-${locale.value}.jpg`)
  })
  const ogLocale = computed(() => OG_TERRITORY[locale.value as AppLocale] ?? OG_TERRITORY.ru)
  const keywords = computed(() => {
    const k = unref(options.keywords)
    const str = Array.isArray(k) ? k.filter(Boolean).join(', ') : (k ?? '')
    return str.trim()
  })
  const imageAlt = computed(() => unref(options.imageAlt)?.trim() || unref(title))

  useHead({
    title,
    htmlAttrs: { lang: computed(() => locale.value) },
    meta: [
      { name: 'description', content: description },
      // Ключевые слова редактируются в разделе SEO (пусто → тег не выводим)
      ...(keywords.value ? [{ name: 'keywords', content: keywords }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Anro — AI Creator' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: imageAlt },
      { property: 'og:locale', content: ogLocale },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
      { name: 'twitter:image:alt', content: imageAlt },
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
