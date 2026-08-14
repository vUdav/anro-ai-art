<script setup lang="ts">
// Глобальный фон лендинга: тёмный mesh-градиент из мягких неон-зон, который
// медленно морфится. Смысл — дать стеклянным панелям (backdrop-blur) цветную
// подложку, чтобы frosted-стекло читалось и светилось. Фикс-слой за контентом.
// Логики нет — только CSS; движение глушится при prefers-reduced-motion.
</script>

<template>
  <div class="ambient" aria-hidden="true"></div>
</template>

<style scoped>
.ambient {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  background: var(--bg-900);
}

/* Два слоя мягких неон-зон, дрейфуют в противоход → морфящийся mesh */
.ambient::before,
.ambient::after {
  content: '';
  position: absolute;
  inset: -25%;
}

.ambient::before {
  background:
    radial-gradient(35% 45% at 22% 28%, rgba(139, 92, 246, 0.18), transparent 70%),
    radial-gradient(40% 40% at 82% 20%, rgba(34, 211, 238, 0.12), transparent 70%),
    radial-gradient(45% 45% at 62% 86%, rgba(77, 124, 255, 0.12), transparent 72%);
  filter: blur(42px);
  /* Дрейф + медленная пульсация яркости — разные периоды → «живой» несинхронный mesh */
  animation:
    ambient-a 42s ease-in-out infinite alternate,
    ambient-pulse-a 17s ease-in-out infinite alternate;
}

.ambient::after {
  background:
    radial-gradient(40% 42% at 76% 70%, rgba(236, 72, 153, 0.14), transparent 72%),
    radial-gradient(36% 40% at 16% 80%, rgba(34, 211, 238, 0.1), transparent 72%);
  filter: blur(52px);
  animation:
    ambient-b 55s ease-in-out infinite alternate,
    ambient-pulse-b 23s ease-in-out infinite alternate;
}

/* Изогнутая траектория (waypoint на 50%) — движение не по прямой, читается живее */
@keyframes ambient-a {
  0% {
    transform: translate3d(-4%, -3%, 0) scale(1.05);
  }
  50% {
    transform: translate3d(2%, -6%, 0) scale(1.12);
  }
  100% {
    transform: translate3d(5%, 4%, 0) scale(1.16);
  }
}

@keyframes ambient-b {
  0% {
    transform: translate3d(4%, 3%, 0) scale(1.12);
  }
  50% {
    transform: translate3d(-3%, 6%, 0) scale(1.06);
  }
  100% {
    transform: translate3d(-5%, -4%, 0) scale(1);
  }
}

/* Пульсация — мягкое «набухание» свечения; период не кратен дрейфу */
@keyframes ambient-pulse-a {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}

@keyframes ambient-pulse-b {
  from {
    opacity: 0.85;
  }
  to {
    opacity: 0.6;
  }
}

/* Мобильные: лёгче размытие ради перфа */
@media (max-width: 768px) {
  .ambient::before {
    filter: blur(30px);
  }
  .ambient::after {
    filter: blur(36px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ambient::before,
  .ambient::after {
    animation: none;
  }
}
</style>
