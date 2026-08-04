<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorks } from '../../composables/useContent'
import { useMotionPreset } from '../../composables/useMotionPreset'
import type { Work } from '../../types/content'
import WorkModal from './WorkModal.vue'

const { t } = useI18n()
const { works } = useWorks()
const { fadeUp, scaleIn } = useMotionPreset()

// Главная (полноширинная) работа = первая избранная, иначе первая по порядку
const featured = computed<Work | null>(
  () => works.value.find((w) => w.featured) ?? works.value[0] ?? null,
)
// Сетка = остальные работы (до 8)
const grid = computed<Work[]>(() =>
  works.value.filter((w) => w !== featured.value).slice(0, 8),
)

// Превью: постер (для видео) или само изображение
function thumb(w: Work) {
  return w.poster || w.media
}

const active = ref<Work | null>(null)
function open(w: Work) {
  active.value = w
}
</script>

<template>
  <section id="works" class="works" aria-labelledby="works-title">
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

      <!-- Главная работа на всю ширину -->
      <button
        v-if="featured"
        class="feature"
        type="button"
        v-motion="fadeUp(120)"
        @click="open(featured)"
      >
        <span class="feature__media">
          <img class="feature__img" :src="thumb(featured)" :alt="featured.alt" loading="lazy" />
          <span v-if="featured.type === 'video'" class="badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
        </span>
        <span class="feature__info">
          <span class="feature__name">{{ featured.title }}</span>
          <span v-if="featured.tags.length" class="tags">
            <span v-for="(tag, i) in featured.tags" :key="i" class="tags__item">{{ tag }}</span>
          </span>
          <span v-if="featured.description" class="feature__desc">{{ featured.description }}</span>
        </span>
      </button>

      <!-- Сетка других работ -->
      <ul class="grid">
        <li v-for="(w, i) in grid" :key="w.slug" v-motion="scaleIn(60 + i * 40)">
          <button class="card" type="button" @click="open(w)">
            <span class="card__media">
              <img class="card__img" :src="thumb(w)" :alt="w.alt" loading="lazy" />
              <span v-if="w.type === 'video'" class="badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              </span>
            </span>
            <span class="card__caption">
              <span class="card__name">{{ w.title }}</span>
              <span v-if="w.tags.length" class="card__tag">{{ w.tags[0] }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <WorkModal v-if="active" :work="active" @close="active = null" />
  </section>
</template>

<style scoped lang="scss">
/* ── Брейкпоинты (mobile-first, min-width) ── */
$bp-sm: 480px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;
$bp-2xl: 1600px;

@mixin up($bp) {
  @media (min-width: $bp) {
    @content;
  }
}

/* ── Наследуемые поверхности ── */
%surface {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 18px;
}

%glass {
  @extend %surface;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
}

/* Значок видео */
.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(6, 8, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--text-100);
  padding-left: 2px; /* оптическая центровка треугольника */
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
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-200);
    white-space: nowrap;
  }
}

.works {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 3.5rem 1.25rem;
  background: linear-gradient(180deg, #05060f 0%, #080a18 50%, #05060f 100%);

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

/* ── Общий приём: неон-бордер + свечение за курсором ── */
%interactive {
  position: relative;
  isolation: isolate;
  cursor: pointer;
  padding: 0;
  text-align: left;
  overflow: hidden;
  color: inherit;
  font: inherit;
  transition: box-shadow 0.35s var(--ease-out);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 4;
    border-radius: inherit;
    padding: 1px;
    background: var(--grad-primary);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.35s var(--ease-out);
    pointer-events: none;
  }

  &:hover,
  &:focus-visible {
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    &::before {
      opacity: 1;
    }
  }
}

/* ── Главная работа ── */
.feature {
  @extend %interactive;
  @extend %glass;
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 24px;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);

  @include up($bp-lg) {
    flex-direction: row;
    align-items: stretch;
  }

  &__media {
    position: relative;
    flex: none;
    width: 100%;
    aspect-ratio: 16 / 11;
    overflow: hidden;

    @include up($bp-lg) {
      width: 56%;
      aspect-ratio: auto;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s var(--ease-out);
  }
  &:hover &__img {
    transform: scale(1.03);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: clamp(1.5rem, 3vw, 2.75rem);

    @include up($bp-lg) {
      width: 44%;
      justify-content: center;
    }
  }

  &__name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.4rem, 2.6vw, 2.2rem);
    line-height: 1.1;
    color: var(--text-100);
  }

  &__desc {
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    line-height: 1.7;
    color: var(--text-200);
  }
}

/* ── Сетка ── */
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: 1fr;
  gap: clamp(0.85rem, 1.6vw, 1.25rem);

  @include up($bp-sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @include up($bp-lg) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @include up($bp-xl) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.card {
  @extend %interactive;
  @extend %surface;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 18px;

  &__media {
    position: relative;
    width: 100%;
    height: 0;
    padding-top: 125%; /* 4:5 — жёстко фиксируем высоту превью от ширины (кроп) */
    overflow: hidden;
    flex: none;
  }

  &__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s var(--ease-out);
  }
  &:hover &__img {
    transform: scale(1.05);
  }

  &__caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
  }

  &__name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.98rem;
    color: var(--text-100);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tag {
    flex: none;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-300);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature,
  .feature__img,
  .card,
  .card__img {
    transition: none;
  }
}
</style>
