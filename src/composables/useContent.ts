import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'
import type {
  Work,
  WorkRaw,
  Testimonial,
  TestimonialRaw,
  Service,
  ServiceRaw,
} from '../types/content'

// Контент импортируется на этапе сборки — коммит из CMS триггерит пересборку.
const workModules = import.meta.glob<WorkRaw>('../content/works/*.json', { eager: true, import: 'default' })
const testimonialModules = import.meta.glob<TestimonialRaw>('../content/testimonials/*.json', { eager: true, import: 'default' })
const serviceModules = import.meta.glob<ServiceRaw>('../content/services/*.json', { eager: true, import: 'default' })

const worksRaw = Object.values(workModules)
const testimonialsRaw = Object.values(testimonialModules)
const servicesRaw = Object.values(serviceModules)

function normalizeWork(w: WorkRaw, locale: AppLocale): Work {
  const l = w[locale] ?? w.ru
  return {
    slug: w.slug,
    type: w.type,
    category: w.category,
    media: w.media,
    poster: w.poster ?? '',
    externalUrl: w.externalUrl ?? '',
    featured: w.featured ?? false,
    order: w.order ?? 0,
    title: l.title,
    alt: l.alt || l.title,
    description: l.description ?? '',
  }
}

function normalizeTestimonial(t: TestimonialRaw, locale: AppLocale): Testimonial {
  const l = t[locale] ?? t.ru
  return {
    slug: t.slug,
    author: t.author,
    avatar: t.avatar ?? '',
    order: t.order ?? 0,
    role: l.role ?? '',
    text: l.text,
  }
}

function normalizeService(s: ServiceRaw, locale: AppLocale): Service {
  const l = s[locale] ?? s.ru
  return {
    slug: s.slug,
    icon: s.icon ?? '',
    order: s.order ?? 0,
    title: l.title,
    description: l.description,
    items: l.items ?? [],
  }
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order

export function useWorks() {
  const { locale } = useI18n()
  const works = computed(() =>
    worksRaw.map((w) => normalizeWork(w, locale.value as AppLocale)).sort(byOrder),
  )
  return { works }
}

export function useTestimonials() {
  const { locale } = useI18n()
  const testimonials = computed(() =>
    testimonialsRaw.map((t) => normalizeTestimonial(t, locale.value as AppLocale)).sort(byOrder),
  )
  return { testimonials }
}

export function useServices() {
  const { locale } = useI18n()
  const services = computed(() =>
    servicesRaw.map((s) => normalizeService(s, locale.value as AppLocale)).sort(byOrder),
  )
  return { services }
}
