<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServices } from '../../composables/useContent'
import { useMotionPreset } from '../../composables/useMotionPreset'
import DiffusionGlyph from './DiffusionGlyph.vue'

const { t } = useI18n()
const { services } = useServices()
const { fadeUp } = useMotionPreset()

// Ховер карточки запускает неон-скан-линию в диффузионном поле
interface FieldApi {
  onEnter: () => void
  onLeave: () => void
}
const fields = ref<(FieldApi | null)[]>([])
function setField(el: unknown, i: number) {
  fields.value[i] = (el as FieldApi) || null
}
function onEnter(i: number) {
  fields.value[i]?.onEnter()
}
function onLeave(i: number) {
  fields.value[i]?.onLeave()
}
</script>

<template>
  <section id="services" class="services" aria-labelledby="services-title">
    <div class="services__stage">
      <header class="services__head">
        <p class="services__eyebrow text-gradient" v-motion="fadeUp(0)">
          {{ t('services.eyebrow') }}
        </p>
        <h2 id="services-title" class="services__title" v-motion="fadeUp(80)">
          {{ t('services.title') }}
        </h2>
      </header>

      <div class="services__grid">
        <article
          v-for="(s, i) in services"
          :key="s.slug"
          class="services__card"
          v-motion="fadeUp(120 + i * 90)"
          @pointerenter="onEnter(i)"
          @pointerleave="onLeave(i)"
        >
          <DiffusionGlyph
            :ref="(el) => setField(el, i)"
            :kind="s.icon === 'video' ? 'video' : 'image'"
          />

          <div class="services__content">
            <div class="services__glyphspace" aria-hidden="true"></div>
            <h3 class="services__name">{{ s.title }}</h3>
            <p class="services__desc">{{ s.description }}</p>
            <ul v-if="s.items.length" class="services__items">
              <li
                v-for="(item, k) in s.items"
                :key="k"
                class="services__item"
                :style="{ '--k': k }"
              >
                <span class="services__dot" aria-hidden="true"></span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </div>
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

.services {
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

  /* ── Шапка блока ── */
  &__head {
    margin-bottom: clamp(2rem, 5vw, 3.25rem);
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

  /* ── Сетка карточек ── */
  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;

    @include up($bp-lg) {
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
    }
  }

  &__card {
    @extend %glass;
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
    transition:
      transform 0.4s var(--ease-out),
      border-color 0.4s var(--ease-out),
      box-shadow 0.4s var(--ease-out);

    /* Неон-бордер по ховеру (Hairline → Neon) */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 2;
      border-radius: inherit;
      padding: 1px;
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

    &:hover {
      transform: translateY(-6px);
      border-color: rgba(255, 255, 255, 0.16);
      box-shadow: 0 34px 90px rgba(0, 0, 0, 0.55);

      &::before {
        opacity: 1;
      }
    }
  }

  /* Контент поверх диффузионного поля */
  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: clamp(1.5rem, 3vw, 2.25rem);
  }

  /* Резерв верхней зоны, где поле собирает глиф */
  &__glyphspace {
    height: clamp(140px, 40vw, 180px);
  }

  &__name {
    margin: 0 0 0.75rem;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.35rem, 2.4vw, 1.75rem);
    line-height: 1.1;
    color: var(--text-100);
  }

  &__desc {
    margin: 0 0 1.5rem;
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    line-height: 1.6;
    color: var(--text-200);
  }

  &__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-top: auto;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: clamp(0.9rem, 1.15vw, 1rem);
    color: var(--text-200);
    line-height: 1.4;
    transition: color 0.4s var(--ease-out);
  }

  /* Пульс пунктов в такт скан-фронту — каскад сверху вниз по --k */
  &__card:hover &__item {
    animation: svc-pulse 0.62s var(--ease-out) both;
    animation-delay: calc(var(--k) * 90ms);
  }

  &__dot {
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 0.4em;
    border-radius: 50%;
    background: var(--grad-primary);
    box-shadow: none;
    transition: box-shadow 0.4s var(--ease-out);
  }

  &__card:hover &__dot {
    animation: svc-dot 0.62s var(--ease-out) both;
    animation-delay: calc(var(--k) * 90ms);
  }
}

@keyframes svc-pulse {
  40% {
    color: var(--text-100);
  }
  100% {
    color: var(--text-200);
  }
}

@keyframes svc-dot {
  40% {
    box-shadow: var(--glow-cyan);
    transform: scale(1.35);
  }
  100% {
    box-shadow: none;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .services__card {
    transition: none;
  }
  .services__card:hover .services__item,
  .services__card:hover .services__dot {
    animation: none;
  }
}
</style>
