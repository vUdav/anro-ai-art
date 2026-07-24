import type { AppLocale } from '../i18n'

export type WorkCategory =
  | 'covers'
  | 'mockups'
  | 'photoshoots'
  | 'sketches'
  | 'ads'
  | 'illustrations'

export type MediaType = 'image' | 'video'

/** Переводимые поля одной локали */
export interface LocalizedText {
  title: string
  alt?: string
  description?: string
}

/** Работа в том виде, в каком она лежит в JSON (пишет CMS) */
export interface WorkRaw {
  slug: string
  type: MediaType
  category: WorkCategory
  media: string
  poster?: string
  /** внешний URL видео (если не хранится в репозитории) */
  externalUrl?: string
  featured?: boolean
  order?: number
  ru: LocalizedText
  en: LocalizedText
  be: LocalizedText
}

/** Работа, нормализованная под текущую локаль */
export interface Work {
  slug: string
  type: MediaType
  category: WorkCategory
  media: string
  poster: string
  externalUrl: string
  featured: boolean
  order: number
  title: string
  alt: string
  description: string
}

export interface TestimonialRaw {
  slug: string
  author: string
  avatar?: string
  order?: number
  ru: { role?: string; text: string }
  en: { role?: string; text: string }
  be: { role?: string; text: string }
}

export interface Testimonial {
  slug: string
  author: string
  avatar: string
  order: number
  role: string
  text: string
}

export interface ServiceRaw {
  slug: string
  icon?: string
  order?: number
  ru: { title: string; description: string; items?: string[] }
  en: { title: string; description: string; items?: string[] }
  be: { title: string; description: string; items?: string[] }
}

export interface Service {
  slug: string
  icon: string
  order: number
  title: string
  description: string
  items: string[]
}

export type Locale = AppLocale
