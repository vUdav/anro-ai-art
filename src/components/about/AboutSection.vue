<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAbout } from '../../composables/usePages'
import { useMotionPreset } from '../../composables/useMotionPreset'
import DiffusionPortrait from './DiffusionPortrait.vue'

const { t } = useI18n()
const about = useAbout()
const { fadeUp, diffuse } = useMotionPreset()

// Полное имя в две строки: первое слово / остаток
const nameLines = computed(() => {
  const full = (about.value.fullName || '').trim()
  const i = full.indexOf(' ')
  return i === -1 ? [full, ''] : [full.slice(0, i), full.slice(i + 1)]
})
</script>

<template>
  <section id="about" class="about">
    <div class="about__stage">
      <p class="about__eyebrow text-gradient" v-motion="fadeUp(0)">{{ t('about.eyebrow') }}</p>

      <div class="about__name" aria-hidden="true" v-motion="diffuse(100)">
        <span>{{ nameLines[0] }}</span>
        <span>{{ nameLines[1] }}</span>
      </div>

      <div class="about__glow" aria-hidden="true"></div>

      <DiffusionPortrait class="about__portrait" :src="about.photo" :alt="about.fullName" />

      <div class="about__card" v-motion="fadeUp(120)">
        <h2 class="about__title">{{ about.title }}</h2>
        <p class="about__bio">{{ about.bio }}</p>
        <ul class="about__creds">
          <li v-for="(c, i) in about.credentials" :key="i" class="about__chip">
            <span class="about__dot" aria-hidden="true"></span>
            <span>{{ c }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ── Брейкпоинты (mobile-first, min-width) ── */
$bp-sm: 480px; // крупные телефоны
$bp-md: 768px; // планшеты (портрет)
$bp-lg: 1024px; // планшеты (ландшафт) / малые ноутбуки → слоевая раскладка
$bp-xl: 1280px; // десктопы
$bp-2xl: 1600px; // большие экраны

@mixin up($bp) {
  @media (min-width: $bp) {
    @content;
  }
}

/* ── Наследуемые поверхности (BEM-инвариант через @extend) ── */
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

/* ── Блок ── */
.about {
  position: relative;
  width: 100%;
  overflow: hidden;
  /* верхний паддинг учитывает фиксированную шапку, чтобы eyebrow не уходил под неё */
  padding: 5rem 1.25rem 3.5rem;
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

  /* ── Сцена: mobile = стек, desktop = слои ── */
  &__stage {
    position: relative;
    max-width: var(--maxw);
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;

    @include up($bp-lg) {
      display: block;
      min-height: clamp(660px, 90vh, 860px);
    }
    @include up($bp-xl) {
      min-height: clamp(680px, 88vh, 900px);
    }
  }

  /* ── Eyebrow ── */
  &__eyebrow {
    order: 0;
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(0.78rem, 3vw, 1rem);
    letter-spacing: 0.42em;
    text-transform: uppercase;
    text-indent: 0.42em;
    display: inline-block;
  }

  /* ── Гигантское имя ── */
  &__name {
    order: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(2rem, 10vw, 3.25rem);
    line-height: 0.92;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: var(--text-100);
    pointer-events: none;

    span:last-child {
      color: transparent;
      -webkit-text-stroke: 1.2px rgba(244, 246, 255, 0.5);
    }

    @include up($bp-sm) {
      font-size: clamp(2.5rem, 11vw, 4rem);
    }
    @include up($bp-md) {
      font-size: clamp(3rem, 10vw, 5.25rem);
    }
    @include up($bp-lg) {
      position: static;
      z-index: 1;
      top: 5%;
      left: 0;
      white-space: nowrap;
      font-size: clamp(3.25rem, 10.5vw, 10rem);

      span:last-child {
        -webkit-text-stroke-width: 1.5px;
      }
    }
    @include up($bp-xl) {
      font-size: clamp(3.25rem, 7vw, 8rem);
    }
  }

  /* ── Свечение за портретом ── */
  &__glow {
    position: absolute;
    z-index: 0;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: min(85%, 340px);
    aspect-ratio: 1;
    background: radial-gradient(
      circle at 50% 40%,
      rgba(139, 92, 246, 0.5),
      rgba(34, 211, 238, 0.28) 45%,
      transparent 70%
    );
    filter: blur(38px);
    pointer-events: none;

    @include up($bp-lg) {
      top: 6%;
      left: auto;
      right: 2%;
      transform: none;
      width: min(58%, 620px);
      filter: blur(55px);
    }
  }

  /* ── Портрет ── */
  &__portrait {
    order: 2;
    position: relative;
    z-index: 2;
    align-self: center;
    width: min(88%, 360px);
    height: auto;
    aspect-ratio: 1 / 1;
    margin-top: -4.5rem;
    -webkit-mask-image: linear-gradient(180deg, #000 84%, transparent 100%);
    mask-image: linear-gradient(180deg, #000 84%, transparent 100%);

    @include up($bp-sm) {
      width: min(78%, 400px);
      margin-top: -5.5rem;
    }
    @include up($bp-md) {
      width: min(64%, 460px);
      margin-top: -6.5rem;
    }
    @include up($bp-lg) {
      position: absolute;
      z-index: 2;
      right: -6%;
      bottom: 0;
      top: auto;
      align-self: auto;
      width: auto;
      height: clamp(460px, 78vh, 800px);
      margin-top: 0;
    }
    @include up($bp-xl) {
      height: clamp(560px, 82vh, 880px);
    }
  }

  /* ── Стеклянная карточка ── */
  &__card {
    @extend %glass;
    order: 3;
    position: relative;
    z-index: 3;
    width: 100%;
    padding: 1.5rem;
    border-radius: 24px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);

    @include up($bp-md) {
      align-self: center;
      padding: 2rem;
    }
    @include up($bp-lg) {
      position: absolute;
      z-index: 3;
      left: 0;
      bottom: 4%;
      align-self: auto;
      width: clamp(340px, 52%, 600px);
      padding: clamp(1.75rem, 2.4vw, 2.5rem);
    }
    @include up($bp-xl) {
      width: clamp(360px, 54%, 680px);
    }
  }

  /* ── Элементы карточки ── */
  &__title {
    margin: 0 0 1rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    color: var(--text-100);
  }

  &__bio {
    margin: 0 0 1.75rem;
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    color: var(--text-200);
    line-height: 1.7;
  }

  &__creds {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  &__chip {
    @extend %surface;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: clamp(0.85rem, 1.15vw, 0.95rem);
    color: var(--text-200);
    line-height: 1.4;
  }

  &__dot {
    flex: none;
    width: 8px;
    height: 8px;
    margin-top: 0.45em;
    border-radius: 50%;
    background: var(--grad-primary);
    box-shadow: var(--glow-cyan);
  }
}
</style>
