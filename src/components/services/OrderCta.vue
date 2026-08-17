<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContacts } from '../../composables/usePages'
import { useMotionPreset } from '../../composables/useMotionPreset'
import OrderButton from '../ui/OrderButton.vue'

const { t } = useI18n()
const contacts = useContacts()
const { fadeUp } = useMotionPreset()

const link = computed(() => contacts.value.orderLink || contacts.value.telegram)
</script>

<template>
  <div id="order" class="order" v-motion="fadeUp(0)">
    <div class="order__panel">
      <p class="order__eyebrow text-gradient">{{ t('order.eyebrow') }}</p>
      <h2 class="order__title">{{ t('order.title') }}</h2>
      <p class="order__subtitle">{{ t('order.subtitle') }}</p>
      <OrderButton class="order__btn" :href="link" size="lg">{{ t('actions.order') }}</OrderButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.order {
  margin-top: clamp(2.5rem, 6vw, 4.5rem);

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
    padding: clamp(2.25rem, 6vw, 4rem) clamp(1.5rem, 5vw, 3.5rem);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(24px) saturate(120%);
    -webkit-backdrop-filter: blur(24px) saturate(120%);
    box-shadow: 0 32px 90px rgba(0, 0, 0, 0.5);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      border-radius: inherit;
      padding: 1.5px;
      background: conic-gradient(
        from var(--order-angle),
        var(--neon-cyan),
        var(--neon-blue),
        var(--neon-violet),
        var(--neon-pink),
        var(--neon-violet),
        var(--neon-blue),
        var(--neon-cyan)
      );
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      animation: order-rotate 8s linear infinite;
      transition: filter 0.5s var(--ease-out);
      pointer-events: none;
    }

    &::after {
      content: '';
      position: absolute;
      z-index: 0;
      top: -40%;
      left: 50%;
      width: 70%;
      height: 80%;
      transform: translateX(-50%);
      background: radial-gradient(
        50% 50% at 50% 50%,
        rgba(139, 92, 246, 0.22),
        rgba(34, 211, 238, 0.1) 45%,
        transparent 72%
      );
      filter: blur(30px);
      opacity: 0.75;
      transition: opacity 0.5s var(--ease-out);
      pointer-events: none;
    }

    &:hover::before {
      filter: brightness(1.3) saturate(1.15);
    }
    &:hover::after {
      opacity: 1;
    }
  }

  &__eyebrow,
  &__title,
  &__subtitle,
  &__btn {
    position: relative;
    z-index: 1;
  }

  &__btn {
    margin-top: 0.75rem;
  }

  &__eyebrow {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(0.75rem, 2.5vw, 0.95rem);
    letter-spacing: 0.42em;
    text-transform: uppercase;
    text-indent: 0.42em;
    display: inline-block;
  }

  &__title {
    margin: 0;
    max-width: 18ch;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(1.9rem, 5vw, 3.25rem);
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: var(--text-100);
    text-wrap: balance;
  }

  &__subtitle {
    margin: 0;
    max-width: 52ch;
    font-size: clamp(0.98rem, 1.4vw, 1.1rem);
    line-height: 1.6;
    color: var(--text-200);
  }
}

@property --order-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes order-rotate {
  to {
    --order-angle: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .order__panel::before {
    animation: none;
  }
}
</style>
