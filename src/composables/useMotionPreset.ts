import { useMediaQuery } from '@vueuse/core'

// Пресеты для v-motion (reveal при появлении в вьюпорте).
// При prefers-reduced-motion анимации фактически отключаются (см. tokens.css),
// но мы также отдаём «плоский» пресет, чтобы контент был сразу видим.
//
// Единый голос движения — уверенное замедление (denoise «наводится на резкость»),
// без bounce/elastic. Все пресеты делят одну кривую EASE.
const EASE = [0.16, 1, 0.3, 1]

export function useMotionPreset() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  const flat = { initial: { opacity: 1 }, visibleOnce: { opacity: 1 } }

  const fadeUp = (delay = 0) =>
    reduced.value
      ? flat
      : {
          initial: { opacity: 0, y: 32 },
          visibleOnce: {
            opacity: 1,
            y: 0,
            transition: { duration: 640, delay, ease: EASE },
          },
        }

  const scaleIn = (delay = 0) =>
    reduced.value
      ? flat
      : {
          initial: { opacity: 0, scale: 0.94 },
          visibleOnce: {
            opacity: 1,
            scale: 1,
            transition: { duration: 620, delay, ease: EASE },
          },
        }

  // Фокусный, on-brand reveal: контент «проявляется из диффузии» —
  // входит размытым, чуть переувеличенным и смещённым вниз, затем наводится
  // на резкость. Держим blur только на небольших областях (заголовки секций).
  const diffuse = (delay = 0) =>
    reduced.value
      ? flat
      : {
          initial: { opacity: 0, y: 24, scale: 1.03, filter: 'blur(12px)' },
          visibleOnce: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            transition: { duration: 760, delay, ease: EASE },
          },
        }

  return { fadeUp, scaleIn, diffuse, reduced }
}
