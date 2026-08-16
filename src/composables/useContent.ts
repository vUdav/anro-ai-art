import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'
import type { Work, WorkRaw, CategoryRaw } from '../types/content'

// Контент импортируется на этапе сборки — коммит из CMS триггерит пересборку.
const workModules = import.meta.glob<WorkRaw>('../content/works/*.json', { eager: true, import: 'default' })
const categoryModules = import.meta.glob<CategoryRaw>('../content/categories/*.json', { eager: true, import: 'default' })

const slugFromPath = (path: string) => path.split('/').pop()!.replace(/\.json$/, '')

// slug работы = имя файла (CMS генерирует его из названия, отдельного поля нет)
const worksRaw: WorkRaw[] = Object.entries(workModules).map(([path, w]) => ({
  ...w,
  slug: slugFromPath(path),
}))

// ключ категории = имя файла (CMS генерирует его из названия)
const categoryEntries = Object.entries(categoryModules).map(([path, data]) => ({
  slug: slugFromPath(path),
  data,
}))

// Общие (непереводимые) поля сайт читает с корня записи. Но Sveltia при
// i18n:false/duplicate перемещает/дублирует их в языки — читаем с фолбэком
// «корень → ru», чтобы контент не ломался при редактировании через CMS.
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

/** Карта «ключ категории (имя файла) → локализованное название» для языка. */
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
