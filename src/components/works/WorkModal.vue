<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScrollLock } from '@vueuse/core'
import { useCategories } from '../../composables/useContent'
import type { Work } from '../../types/content'

const props = defineProps<{ work: Work }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const categories = useCategories()

const closeBtn = ref<HTMLButtonElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const mediaEl = ref<HTMLElement | null>(null)
let prevFocus: HTMLElement | null = null

const panelH = ref<string | undefined>(undefined)
function measure() {
  const h = mediaEl.value?.getBoundingClientRect().height ?? 0
  if (h > 0) panelH.value = `${Math.round(h)}px`
}

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const vtSupported = typeof document !== 'undefined' && 'startViewTransition' in document
const animateIn = !reduce && !vtSupported

const videoSrc = computed(() => {
  if (props.work.type !== 'video') return ''
  if (props.work.externalUrl) return props.work.externalUrl
  return /\.(mp4|webm|ogg|mov)$/i.test(props.work.media) ? props.work.media : ''
})
const imageSrc = computed(() => props.work.poster || props.work.media)

const categoryLabel = computed(() => categories.value[props.work.category] ?? '')

const bodyLock = useScrollLock(typeof document !== 'undefined' ? document.body : null)
let playTimer = 0

function close() {
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    return
  }
  if (e.key === 'Tab' && panel.value) {
    const focusables = Array.from(
      panel.value.querySelectorAll<HTMLElement>(
        'button, [href], video, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'))
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const activeEl = document.activeElement
    if (!panel.value.contains(activeEl)) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && activeEl === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && activeEl === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => {
  prevFocus = document.activeElement as HTMLElement | null
  bodyLock.value = true
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', measure)
  requestAnimationFrame(measure)
  closeBtn.value?.focus()

  if (videoSrc.value) {
    playTimer = window.setTimeout(
      () => videoEl.value?.play?.().catch(() => {}),
      vtSupported && !reduce ? 500 : 180,
    )
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measure)
  window.clearTimeout(playTimer)
  bodyLock.value = false
  videoEl.value?.pause()
  prevFocus?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <div class="wm" :class="{ 'wm--in': animateIn }">
      <div class="wm__overlay" @click="close"></div>

      <div
        ref="panel"
        class="wm__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="work.title"
        :style="{ '--panel-h': panelH }"
      >
        <button
          ref="closeBtn"
          class="wm__close"
          type="button"
          :aria-label="t('a11y.closeLightbox')"
          @click="close"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <div ref="mediaEl" class="wm__media">
          <video
            v-if="videoSrc"
            ref="videoEl"
            class="wm__video"
            :src="videoSrc"
            :poster="work.poster || undefined"
            muted
            loop
            controls
            playsinline
            @loadedmetadata="measure"
            @loadeddata="measure"
          ></video>
          <img v-else class="wm__img" :src="imageSrc" :alt="work.alt" @load="measure" />
        </div>

        <div class="wm__info">
          <p v-if="categoryLabel" class="wm__eyebrow text-gradient">{{ categoryLabel }}</p>
          <h3 class="wm__title">{{ work.title }}</h3>
          <span class="wm__rule" aria-hidden="true"></span>
          <ul v-if="work.tags.length" class="wm__tags">
            <li v-for="(tag, i) in work.tags" :key="i" class="wm__tag">{{ tag }}</li>
          </ul>
          <p v-if="work.description" class="wm__desc">{{ work.description }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
$bp-md: 768px;
$bp-lg: 1024px;

@mixin up($bp) {
  @media (min-width: $bp) {
    @content;
  }
}

.wm {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 2.5rem);

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(3, 4, 12, 0.72);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  &__panel {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1100px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    background: rgba(12, 14, 28, 0.92);
    backdrop-filter: blur(24px) saturate(120%);
    -webkit-backdrop-filter: blur(24px) saturate(120%);
    box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6);

    @include up($bp-lg) {
      flex-direction: row;
      width: auto;
      max-width: min(1280px, 95vw);
      height: var(--panel-h, auto);
      max-height: 88vh;
    }
  }

  &--in {
    .wm__overlay {
      animation: wmOverlay 0.3s var(--ease-out) both;
    }
    .wm__panel {
      animation: wmPanel 0.34s var(--ease-out) both;
    }
  }

  &__close {
    position: absolute;
    z-index: 3;
    top: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 50%;
    background: rgba(6, 8, 20, 0.55);
    color: var(--text-100);
    cursor: pointer;
    transition:
      background 0.25s var(--ease-out),
      transform 0.25s var(--ease-out);

    &:hover {
      background: rgba(6, 8, 20, 0.85);
      transform: rotate(90deg);
    }
  }

  &__media {
    position: relative;
    flex: none;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    view-transition-name: work-media;

    @include up($bp-lg) {
      flex: 0 1 auto;
      width: auto;
      align-self: center;
    }
  }

  &__img,
  &__video {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    margin-inline: auto;

    @include up($bp-lg) {
      max-width: min(64vw, 860px);
      max-height: 86vh;
    }
  }

  &__info {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: clamp(1.75rem, 3vw, 2.75rem);

    @include up($bp-lg) {
      width: clamp(300px, 30vw, 380px);
      flex: 0 0 auto;
    }
  }

  &__eyebrow {
    margin: 0 0 0.85rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    text-indent: 0.34em;
    display: inline-block;
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(1.8rem, 3vw, 2.75rem);
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: var(--text-100);
    text-wrap: balance;
  }

  &__rule {
    display: block;
    height: 1px;
    margin: clamp(1.1rem, 2vw, 1.6rem) 0;
    background: linear-gradient(
      90deg,
      var(--neon-cyan),
      var(--neon-violet) 22%,
      rgba(255, 255, 255, 0.09) 55%,
      rgba(255, 255, 255, 0.09)
    );
  }

  &__tags {
    list-style: none;
    margin: 0 0 1.6rem;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.5rem;
  }

  &__tag {
    padding: 0.28rem 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    background: transparent;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--text-300);
    white-space: nowrap;
  }

  &__desc {
    margin: 0;
    max-width: 46ch;
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    line-height: 1.75;
    color: var(--text-200);
  }
}

@keyframes wmOverlay {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes wmPanel {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wm__close {
    transition: none;
  }
  .wm--in .wm__overlay,
  .wm--in .wm__panel {
    animation: none;
  }
}
</style>

<style>
::view-transition-group(work-media) {
  animation-duration: 0.45s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
::view-transition-image-pair(work-media) {
  border-radius: 18px;
  overflow: hidden;
}
</style>
