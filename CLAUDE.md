# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
npm install       # зависимости
npm run dev       # dev-сервер, http://localhost:5173
npm run typecheck # vue-tsc --noEmit
npm run build     # typecheck + vite-ssg build → dist/ (пре-рендер / , /en , /be)
npm run preview   # локальный просмотр собранного dist/
```

Тестов в проекте нет (нет тест-раннера и тест-файлов). **`npm run typecheck` — единственный автоматический гейт**, `npm run build` его включает и падает на ошибках типов. После правок в `src/` прогоняй typecheck.

CMS локально: `npm run dev` → `http://localhost:5173/admin/` → «Work with Local Repository» — Sveltia пишет прямо в файлы `src/content/**` без GitHub.

## Что это

Статичный трёхязычный (RU/EN/BE) сайт-визитка на Vue 3, без бэкенда. Хостинг — GitHub Pages (apex `anroai.art`), деплой автоматом из `main` через `.github/workflows/deploy.yml` (там же `cp dist/index.html dist/404.html` как SPA-fallback). Контент правит не-программист через Sveltia CMS в `/admin`, коммитами в тот же репозиторий.

Продукт, аудитория и «чего нельзя выдумывать» — в [PRODUCT.md](PRODUCT.md). Дизайн-система (цвета, типографика, компоненты, do/don't) — в [DESIGN.md](DESIGN.md), она же продублирована машинно в [.impeccable/design.json](.impeccable/design.json). Инструкция контент-редактору — [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Архитектура

### Одна страница, три локали

Приложение — **один экран** ([HomeView.vue](src/views/HomeView.vue)) из секций Hero → About → Works → Services → Contacts. Навигация — скролл к якорям (`#about`, `#works`, `#services`, `#order`, `#contacts`), а не роутинг.

Роутов ровно столько, сколько локалей: [router/index.ts](src/router/index.ts) генерирует `/` (ru, дефолт) и `/{locale}` для остальных из `SUPPORTED_LOCALES`; всё прочее редиректит на `/`. Локаль **выводится из первого сегмента пути** в `router.beforeEach` в [main.ts](src/main.ts) — она не хранится в state и не персистится. Точка входа — `ViteSSG`, а не `createApp`; любой код инициализации живёт в третьем аргументе `ViteSSG`.

Добавление локали = `SUPPORTED_LOCALES` + `LOCALE_NAMES` + `messages` в [i18n/index.ts](src/i18n/index.ts), новый `src/locales/<loc>.json`, ключ локали во **всех** JSON в `src/content/**`, `locales` в [public/admin/config.yml](public/admin/config.yml), `OG_TERRITORY` в [useSeo.ts](src/composables/useSeo.ts), `public/media/og-<loc>.jpg` и вручную — [public/sitemap.xml](public/sitemap.xml) (он не генерируется).

### Два разных источника текста — не путать

- `src/locales/*.json` — **статичный UI** (подписи кнопок, заголовки секций, aria-тексты). Правит только разработчик, читается через `useI18n()` / `t()`.
- `src/content/**` — **редактируемый контент** (работы, категории, тексты секций, SEO). Правится через CMS, читается только через композаблы `useContent`/`usePages`. Компоненты никогда не импортируют файлы контента напрямую.

### Контент-пайплайн и его главная особенность

Коллекции (`works`, `categories`) собираются `import.meta.glob(..., { eager: true })` в [useContent.ts](src/composables/useContent.ts): slug берётся **из имени файла**, поэтому имя файла = slug (у категорий он к тому же русский, кириллицей — это нормально, `category` в работе ссылается именно на него). Синглтоны-страницы импортируются поимённо в [usePages.ts](src/composables/usePages.ts).

Sveltia настроена как `i18n: structure: single_file`, поэтому **весь JSON контента — это карта `{ ru: {...}, en: {...}, be: {...} }`**, причём нелокализуемые поля (`type`, `category`, `media`, `poster`, `order`, `featured`) помечены `i18n: duplicate` и физически дублируются внутри каждой локали. Отсюда паттерн, повторяющийся во всех композаблах: берём `raw[locale] ?? raw.ru`, а нелокализуемые поля читаем с фолбэком на `ru` (см. `normalizeWork`, `useHero`, `useContacts`). Интерфейс `WorkRaw` в [types/content.ts](src/types/content.ts) описывает эти поля на верхнем уровне — в реальных файлах их там нет, они приходят из ветки локали; менять этот фолбэк-каскад, не сверившись с настоящим JSON, нельзя.

**Любое изменение полей контента — это правка в двух местах**: типы/нормализация в `src/types` + композабл, и описание виджетов в `public/admin/config.yml`. Расхождение молча ломает CMS или рендер.

### SEO / пре-рендер

`vite-ssg` рендерит три HTML. SEO целиком в [useSeo.ts](src/composables/useSeo.ts): canonical, полный набор `hreflang` (включая `x-default`), OG/Twitter, `og:locale`; OG-картинка по умолчанию `/media/og-<locale>.jpg`, но перекрывается из CMS (`settings.json`). `SITE_URL` там захардкожен. Метатеги в [index.html](index.html) — только болванка для дев-режима, на прод-страницах их перебивает `@unhead/vue`.

### Анимации, canvas и SSR

Три «сигнатурных» компонента рисуют на canvas: [DiffusionHero.vue](src/components/hero/DiffusionHero.vue) (частицы схлопываются в слово ANRO и в названия нейросетей из `hero.json → nets`), [DiffusionPortrait.vue](src/components/about/DiffusionPortrait.vue), [DiffusionGlyph.vue](src/components/services/DiffusionGlyph.vue), плюс фон [AmbientBackground.vue](src/components/fx/AmbientBackground.vue). Всё это выполняется в SSG-рантайме, поэтому обращения к `window`/`document`/`matchMedia` обязаны быть внутри `onMounted` либо за проверкой `typeof window !== 'undefined'` — иначе падает `npm run build`, а не dev-сервер.

Скролл-ревилы — `@vueuse/motion` через `v-motion` с пресетами из [useMotionPreset.ts](src/composables/useMotionPreset.ts) (`fadeUp` / `scaleIn` / `diffuse`). Пресеты сами схлопываются в no-op при `prefers-reduced-motion` — новые анимации делай через них, а не голыми transition. Открытие карточки работы использует View Transitions API с ручным фолбэком (см. `open`/`closeModal` в [WorksSection.vue](src/components/works/WorksSection.vue) и `vtSupported` в [WorkModal.vue](src/components/works/WorkModal.vue)); модалка сама держит фокус-трап, Escape и `useScrollLock`.

Смещение скролла под фиксированную шапку — единственная константа `HEADER_H` в [constants/layout.ts](src/constants/layout.ts); она используется и в `scrollBehavior` роутера, и в `scrollToId` в [SiteHeader.vue](src/components/layout/SiteHeader.vue). Пункты навигации в `SiteHeader` — это пары «ключ в `nav.*` локали» + «id секции в DOM»; переименование секции требует обеих правок.

### Стили

Глобально подключены только [styles/tokens.css](src/styles/tokens.css) (CSS-переменные: палитра, `--grad-primary`, шрифты, `--maxw`, easing) и [styles/base.css](src/styles/base.css) (ресет, типографика, `:focus-visible`, утилита `.text-gradient`). Всё остальное — `<style scoped lang="scss">` внутри компонентов (Sass — только за вложенность, препроцессорных импортов и переменных нет). Цвета и радиусы бери из токенов, новые хардкод-значения не вводи — соответствие DESIGN.md проверяемо.

## Прочее

- Шрифты (Sora, Manrope) грузятся ссылкой на Google Fonts из `index.html`.
- `materials/` — исходники медиа, в `.gitignore`; в сборку идёт только `public/media/`.
- Медиа лежит в репозитории: видео надо жать (mp4/H.264, единицы мегабайт), для тяжёлого — поле `externalUrl` вместо загрузки файла.
- `glightbox` числится в зависимостях и имеет декларацию в [env.d.ts](src/env.d.ts), но в коде не используется — просмотр работ реализован своей модалкой.
