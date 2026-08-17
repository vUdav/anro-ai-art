import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'
import type { Work, WorkRaw, CategoryRaw } from '../types/content'

const workModules = import.meta.glob<WorkRaw>('../content/works/*.json', { eager: true, import: 'default' })
const categoryModules = import.meta.glob<CategoryRaw>('../content/categories/*.json', { eager: true, import: 'default' })

const slugFromPath = (path: string) => path.split('/').pop()!.replace(/\.json$/, '')

const worksRaw: WorkRaw[] = Object.entries(workModules).map(([path, w]) => ({
  ...w,
  slug: slugFromPath(path),
}))

const categoryEntries = Object.entries(categoryModules).map(([path, data]) => ({
  slug: slugFromPath(path),
  data,
}))

function normalizeWork(w: WorkRaw, locale: AppLocale): Work {
  const l = w[locale] ?? w.ru
  const fb = w.ru as unknown as Partial<WorkRaw>
  return {
    slug: w.slug ?? fb.slug ?? '',
    type: w.type ?? fb.type ?? 'image',
    category: w.category ?? fb.category ?? '',
    media: w.media ?? fb.media ?? '',
    poster: w.poster ?? fb.poster ?? '',
    externalUrl: w.externalUrl ?? fb.externalUrl ?? '',
    featured: w.featured ?? fb.featured ?? false,
    order: w.order ?? fb.order ?? 0,
    title: l.title,
    alt: l.alt || l.title,
    description: l.description ?? '',
    tags: l.tags ?? [],
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

export function useCategories() {
  const { locale } = useI18n()
  return computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const { slug, data } of categoryEntries) {
      const l = (data[locale.value as AppLocale] ?? data.ru) as { name?: string } | undefined
      map[slug] = l?.name ?? slug
    }
    return map
  })
}
