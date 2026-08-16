export type MediaType = 'image' | 'video'

/** Переводимые поля одной локали работы */
export interface LocalizedText {
  title: string
  alt?: string
  description?: string
  tags?: string[]
}

/** Работа в том виде, в каком она лежит в JSON (пишет CMS) */
export interface WorkRaw {
  /** slug выводится из имени файла — в JSON может отсутствовать */
  slug?: string
  type: MediaType
  /** ключ категории из коллекции «Категории» */
  category: string
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
  category: string
  media: string
  poster: string
  externalUrl: string
  featured: boolean
  order: number
  title: string
  alt: string
  description: string
  tags: string[]
}

/** Услуга, нормализованная под текущую локаль (страница из двух блоков) */
export interface Service {
  icon: MediaType
  slug: string
  title: string
  description: string
  items: string[]
}

/** Категория работ (справочник); ключ = имя файла */
export interface CategoryRaw {
  order?: number
  ru: { name: string }
  en: { name: string }
  be: { name: string }
}
