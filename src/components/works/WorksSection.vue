<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorks } from '../../composables/useContent'
import { useMotionPreset } from '../../composables/useMotionPreset'
import type { Work } from '../../types/content'
import WorkModal from './WorkModal.vue'

const { t } = useI18n()
const { works } = useWorks()
const { fadeUp, reduced } = useMotionPreset()

// Доминанта = первая избранная работа, иначе первая по порядку
const featured = computed<Work | null>(
  () => works.value.find((w) => w.featured) ?? works.value[0] ?? null,
)
// Остальные — в галерею (до 9, чтобы масонри заполнялось ровно 3×3)
const rest = computed<Work[]>(() => works.value.filter((w) => w !== featured.value).slice(0, 9))

// Превью: постер (для видео) или само изображение
function thumb(w: Work) {
  return w.poster || w.media
}
// Вариант пропорции плитки — ломает ровную сетку (масонри)
const ratios = ['is-a', 'is-b', 'is-c', 'is-b']
function ratioFor(j: number) {
  return ratios[j % ratios.length]
}

const active = ref<Work | null>(null)
// Морф карточка ↔ модалка через View Transitions: общее имя носит медиа
// той работы, что сейчас «перетекает» (в остальное время — undefined)
const morph = ref<string | null>(null)

function supportsVT() {
  return typeof document !== 'undefined' && 'startViewTransition' in document && !reduced.value
}

function open(w: Work) {
  if (!supportsVT()) {
    active.value = w
    return
  }
  morph.value = w.slug // помечаем медиа кликнутой карточки
  nextTick(() => {
    ;(document as unknown as { startViewTransition: (cb: () => unknown) => void }).startViewTransition(
      () => {
        active.value = w
        morph.value = null // в новом кадре общее имя несёт только модалка
        return nextTick()
      },
    )
  })
}

function closeModal() {
  const slug = active.value?.slug
  if (!supportsVT() || !slug) {
    active.value = null
    return
  }
  const t = (
    document as unknown as { startViewTransition: (cb: () => unknown) => { finished: Promise<void> } }
  ).startViewTransition(() => {
    active.value = null
    morph.value = slug // имя возвращается карточке → обратный морф
    return nextTick()
  })
  t.finished.finally(() => (morph.value = null))
}

// ── Denoise-проявление: плитки «резко проявляются из шума» при входе в кадр ──
const root = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  const tiles = root.value?.querySelectorAll<HTMLElement>('.tile')
  if (!tiles?.length) return
  if (reduced.value || !('IntersectionObserver' in window)) {
    tiles.forEach((el) => el.classList.add('is-in'))
    return
  }
  io = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          obs.unobserve(e.target)
        }
      }
    },
    { threshold: 0.18 },
  )
  tiles.forEach((el) => io!.observe(el))
})

onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <section id="works" ref="root" class="works" aria-labelledby="works-title">
    <div class="works__stage">
      <header class="works__head">
        <p class="works__eyebrow text-gradient" v-motion="fadeUp(0)">
          {{ t('portfolio.eyebrow') }}
        </p>
        <h2 id="works-title" class="works__title" v-motion="fadeUp(80)">
          {{ t('portfolio.title') }}
        </h2>
      </header>

      <p v-if="!works.length" class="works__empty">{{ t('portfolio.empty') }}</p>

      <!-- Доминанта: кинематографичная ведущая работа -->
      <button
        v-if="featured"
        class="tile lead"
        type="button"
        :style="{ '--i': 0 }"
        :aria-label="featured.title"
        @click="open(featured)"
      >
        <span
          class="tile__media"
          :style="morph === featured.slug ? { viewTransitionName: 'work-media' } : undefined"
        >
          <img :src="thumb(featured)" :alt="featured.alt" loading="lazy" />
        </span>
        <span v-if="featured.type === 'video'" class="badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
        </span>
        <span class="lead__cap">
          <span class="lead__name">{{ featured.title }}</span>
          <span v-if="featured.tags.length" class="tags">
            <span v-for="(tag, i) in featured.tags" :key="i" class="tags__item">{{ tag }}</span>
          </span>
        </span>
      </button>

      <!-- Denoise-галерея: смещённая масонри-сетка -->
      <div class="masonry">
        <button
          v-for="(w, j) in rest"
          :key="w.slug"
          class="tile"
          :class="ratioFor(j)"
          type="button"
          :style="{ '--i': j + 1 }"
          :aria-label="w.title"
          @click="open(w)"
        >
          <span
            class="tile__media"
            :style="morph === w.slug ? { viewTransitionName: 'work-media' } : undefined"
          >
            <img :src="thumb(w)" :alt="w.alt" loading="lazy" />
          </span>
          <span v-if="w.type === 'video'" class="badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
          <span class="tile__cap">
            <span class="tile__name">{{ w.title }}</span>
            <span v-if="w.tags.length" class="tile__tag">{{ w.tags[0] }}</span>
          </span>
        </button>
      </div>
    </div>

    <WorkModal v-if="active" :work="active" @close="closeModal" />
  </section>
</template>

<style scoped lang="scss">
/* ── Брейкпоинты (mobile-first, min-width) ── */
$bp-sm: 480px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;

@mixin up($bp) {
  @media (min-width: $bp) {
    @content;
  }
}

.works {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 3.5rem 1.25rem;
  background: transparent; /* mesh-фон просвечивает и подсвечивает стекло */

  @include up($bp-md) {
    padding: 5rem 2rem;
  }
  @include up($bp-lg) {
    padding: 6rem 3rem;
  }
  @include up($bp-xl) {
    padding: clamp(6rem, 9vh, 8rem) 4rem;
  }

  &__stage {
    max-width: var(--maxw);
    margin-inline: auto;
  }

  &__head {
    margin-bottom: clamp(1.75rem, 4vw, 3rem);
  }

  &__eyebrow {
    margin: 0 0 0.6rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(0.78rem, 3vw, 1rem);
    letter-spacing: 0.42em;
    text-transform: uppercase;
    text-indent: 0.42em;
    display: inline-block;
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(2rem, 6vw, 3.5rem);
    line-height: 1;
    color: var(--text-100);
  }

  &__empty {
    margin: 0;
    color: var(--text-300);
    font-size: 1rem;
  }
}

/* ── Плитка (общий приём: денойз + неон-кромка на ховере) ── */
.tile {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  isolation: isolate;
  cursor: pointer;
  background: #0a0c1c;
  text-align: left;
  color: inherit;
  font: inherit;
  transition: box-shadow 0.4s var(--ease-out);

  &__media {
    position: absolute;
    inset: 0;
    z-index: 0;
    /* стартовое «зашумлённое» состояние — уходит при проявлении.
       Стаггер-задержка живёт ЗДЕСЬ, на контейнере, и касается только денойза */
    filter: blur(14px) saturate(0.45) brightness(0.68);
    transform: scale(1.12);
    transition:
      filter 0.9s var(--ease-out),
      transform 0.9s var(--ease-out);
    transition-delay: calc(var(--i, 0) * 55ms);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      /* ховер-зум — быстрый и без стаггер-задержки, одинаково на всех карточках */
      transition:
        transform 0.4s var(--ease-out),
        filter 0.4s var(--ease-out);
    }
  }

  /* денойз при попадании в кадр */
  &.is-in &__media {
    filter: none;
    transform: scale(1);
  }

  /* неон-кромка (маска показывает только рамку) */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    border-radius: inherit;
    padding: 1.5px;
    background: var(--grad-primary);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.4s var(--ease-out);
    pointer-events: none;
  }

  &:hover,
  &:focus-visible {
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    &::after {
      opacity: 1;
    }
  }
  &.is-in:hover &__media img,
  &.is-in:focus-visible &__media img {
    transform: scale(1.05);
    filter: saturate(1.05);
  }
}

/* Значок видео */
.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(6, 8, 20, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-100);
  padding-left: 2px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Чипы-теги */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  &__item {
    padding: 0.3rem 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(6, 8, 20, 0.4);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-100);
    white-space: nowrap;
  }
}

/* ── Доминанта ── */
.lead {
  aspect-ratio: 16 / 12;
  margin-bottom: clamp(0.85rem, 1.6vw, 1.5rem);

  @include up($bp-md) {
    aspect-ratio: 16 / 8;
  }

  /* нижний скрим, чтобы подпись читалась поверх медиа */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(0deg, rgba(3, 4, 12, 0.85) 0%, rgba(3, 4, 12, 0) 48%);
    pointer-events: none;
  }

  &__cap {
    position: absolute;
    z-index: 2;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: clamp(1.25rem, 3vw, 2.25rem);
  }

  &__name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.5rem, 3.4vw, 2.6rem);
    line-height: 1.05;
    color: var(--text-100);
  }
}

/* ── Масонри-галерея ── */
.masonry {
  columns: 2;
  column-gap: clamp(0.85rem, 1.6vw, 1.5rem);

  @include up($bp-md) {
    columns: 3;
  }

  .tile {
    width: 100%;
    margin-bottom: clamp(0.85rem, 1.6vw, 1.5rem);
    break-inside: avoid;
  }
}

/* пропорции плиток — ломаный ритм */
.tile.is-a {
  aspect-ratio: 4 / 5;
}
.tile.is-b {
  aspect-ratio: 3 / 4;
}
.tile.is-c {
  aspect-ratio: 1 / 1;
}

/* подпись плитки — проявляется на ховере/фокусе */
.tile__cap {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: linear-gradient(0deg, rgba(3, 4, 12, 0.82) 0%, rgba(3, 4, 12, 0) 100%);
  transform: translateY(101%);
  transition: transform 0.4s var(--ease-out);
}
.tile:hover .tile__cap,
.tile:focus-visible .tile__cap {
  transform: translateY(0);
}
.tile__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-100);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tile__tag {
  flex: none;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-200);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .tile__media,
  .tile__media img {
    filter: none !important;
    transform: none !important;
    transition: none;
  }
  .tile__cap {
    transition: none;
  }
}
</style>
