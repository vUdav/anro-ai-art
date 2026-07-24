# anroai.art — сайт-визитка AI-креатора Anro

Статичный трёхязычный (RU / EN / BE) сайт-визитка на Vue 3 в тёмной неоновой эстетике. Хостится на GitHub Pages, контент редактируется без кода через Sveltia CMS.

## Стек

- **Vue 3** + **Vite** + **TypeScript**
- **Vue Router** (history mode, маршруты `/`, `/en`, `/be`)
- **vue-i18n** — статичный UI-текст
- **vite-ssg** + **@unhead/vue** — пре-рендер страниц и SEO (OG, hreflang)
- **@vueuse/motion** — scroll-анимации, собственный canvas — «нейросетевой» фон
- **GLightbox** — просмотр фото и видео
- **Sveltia CMS** — редактирование контента (совместимо с Decap)

## Команды

```bash
npm install       # установка зависимостей
npm run dev       # http://localhost:5173
npm run build     # проверка типов + сборка со статическим пре-рендером в dist/
npm run preview   # локальный просмотр собранного сайта
```

## Структура

- `src/locales/*.json` — статичный интерфейс (меняет разработчик).
- `src/content/**` — редактируемый контент (работы, отзывы, услуги, тексты разделов). Правится через CMS.
- `public/media/` — изображения и видео работ.
- `public/admin/` — панель Sveltia CMS (`config.yml` описывает все поля).
- `.github/workflows/deploy.yml` — автосборка и деплой на GitHub Pages.

Как добавлять контент — см. **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)**.

## Деплой на GitHub Pages (разово)

1. Создать репозиторий на GitHub, запушить проект в ветку `main`.
2. В `public/admin/config.yml` заменить `OWNER` на свой GitHub-логин.
3. Settings → **Pages** → Source: **GitHub Actions**.
4. Settings → Pages → **Custom domain**: `anroai.art`, включить **Enforce HTTPS**.
5. DNS у регистратора домена:
   - `A` (apex `@`) → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `OWNER.github.io`
6. Пуш в `main` запускает workflow → сайт публикуется автоматически.
7. Для входа в `/admin` настроить OAuth-брокер — см. [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

Файл `public/CNAME` уже содержит `anroai.art` и попадает в сборку автоматически.
