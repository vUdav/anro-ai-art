export type MediaType = 'image' | 'video'

export interface LocalizedText {
  title: string
  alt?: string
  description?: string
  tags?: string[]
}

export interface WorkRaw {
  slug?: string
  type: MediaType
  category: string
  media: string
  poster?: string
  externalUrl?: string
  featured?: boolean
  order?: number
  ru: LocalizedText
  en: LocalizedText
  be: LocalizedText
}

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

export interface Service {
  icon: MediaType
  slug: string
  title: string
  description: string
  items: string[]
}

export interface CategoryRaw {
  order?: number
  ru: { name: string }
  en: { name: string }
  be: { name: string }
}
