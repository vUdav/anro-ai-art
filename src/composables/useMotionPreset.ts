import { useMediaQuery } from '@vueuse/core'

// Пресеты для v-motion (reveal при появлении в вьюпорте).
// При prefers-reduced-motion анимации фактически отключаются (см. tokens.css),
// но мы также отдаём «плоский» пресет, чтобы контент был сразу видим.
export function useMotionPreset() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  const fadeUp = (delay = 0) =>
    reduced.value
      ? { initial: { opacity: 1 }, visibleOnce: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 40 },
          visibleOnce: {
            opacity: 1,
            y: 0,
            transition: { duration: 650, delay, ease: 'easeOut' },
          },
        }

  const scaleIn = (delay = 0) =>
    reduced.value
      ? { initial: { opacity: 1 }, visibleOnce: { opacity: 1 } }
      : {
          initial: { opacity: 0, scale: 0.94 },
          visibleOnce: {
            opacity: 1,
            scale: 1,
            transition: { duration: 600, delay, ease: 'easeOut' },
          },
        }

  return { fadeUp, scaleIn, reduced }
}
