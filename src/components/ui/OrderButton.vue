<script setup lang="ts">
withDefaults(
  defineProps<{
    href?: string
    size?: 'md' | 'lg'
  }>(),
  { href: undefined, size: 'md' },
)

function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - r.left}px`)
  el.style.setProperty('--my', `${e.clientY - r.top}px`)
}
</script>

<template>
  <a
    v-if="href"
    class="order-btn"
    :class="{ 'order-btn--lg': size === 'lg' }"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    @mousemove="onMove"
  >
    <span class="order-btn__glow" aria-hidden="true"></span>
    <span class="order-btn__label"><slot /></span>
  </a>
  <button
    v-else
    class="order-btn"
    :class="{ 'order-btn--lg': size === 'lg' }"
    type="button"
    @mousemove="onMove"
  >
    <span class="order-btn__glow" aria-hidden="true"></span>
    <span class="order-btn__label"><slot /></span>
  </button>
</template>

<style scoped lang="scss">
.order-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.35rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-100);
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition: box-shadow 0.35s var(--ease-out);

  &--lg {
    padding: 0.9rem 2.1rem;
    font-size: 1.05rem;

    &::after {
      transform: translateX(-101%);
      transition:
        transform 0.5s var(--ease-out),
        opacity 0.35s var(--ease-out);
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    padding: 1.5px;
    background: linear-gradient(
      120deg,
      var(--neon-cyan),
      var(--neon-blue) 35%,
      var(--neon-violet) 65%,
      var(--neon-pink)
    );
    background-size: 200% 100%;
    background-position: 0% 0;
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    transition: background-position 0.6s var(--ease-out);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background: linear-gradient(120deg, var(--neon-cyan), var(--neon-violet) 55%, var(--neon-pink));
    opacity: 0;
    transition: opacity 0.35s var(--ease-out);
  }

  &__glow {
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.12s linear;
    pointer-events: none;
    background: radial-gradient(
      circle 20px at var(--mx, 50%) var(--my, 50%),
      rgba(190, 160, 255, 0.55),
      rgba(139, 92, 246, 0.25) 55%,
      transparent 100%
    );
  }

  &__label {
    position: relative;
    z-index: 3;
  }

  &:hover,
  &:focus-visible {
    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.35);

    &::before {
      background-position: 100% 0;
    }
    &::after {
      opacity: 0.14;
    }
    .order-btn__glow {
      opacity: 1;
    }
  }
}

.order-btn--lg:hover::after,
.order-btn--lg:focus-visible::after {
  opacity: 0.3;
  transform: translateX(0);
}

@media (hover: none), (pointer: coarse) {
  .order-btn__glow {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .order-btn,
  .order-btn::before,
  .order-btn::after,
  .order-btn__glow {
    transition: none;
  }
}
</style>
