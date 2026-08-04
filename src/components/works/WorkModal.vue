<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScrollLock } from '@vueuse/core'
import type { Work } from '../../types/content'

const props = defineProps<{ work: Work }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const show = ref(false)
const closeBtn = ref<HTMLButtonElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const panel = ref<HTMLElement | null>(null)
let prevFocus: HTMLElement | null = null

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Источник видео: реальный файл в репозитории или внешняя ссылка
const videoSrc = computed(() => {
  if (props.work.type !== 'video') return ''
  if (props.work.externalUrl) return props.work.externalUrl
  return /\.(mp4|webm|ogg|mov)$/i.test(props.work.media) ? props.work.media : ''
})
// Изображение для показа (для image — media, для video без файла — постер)
const imageSrc = computed(() => props.work.poster || props.work.media)

// Блокировка прокрутки body, пока открыта модалка
const bodyLock = useScrollLock(typeof document !== 'undefined' ? document.body : null)

function close() {
  show.value = false
  if (reduce) {
    emit('close')
    return
  }
  window.setTimeout(() => emit('close'), 220)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    return
  }
  // Ловушка фокуса: Tab не выходит за пределы модалки
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

onMounted(async () => {
  prevFocus = document.activeElement as HTMLElement | null
  bodyLock.value = true
  window.addEventListener('keydown', onKey)
  await nextTick()
  show.value = true
  closeBtn.value?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  bodyLock.value = false
  videoEl.value?.pause()
  prevFocus?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <div class="wm" :class="{ 'is-visible': show }">
      <div class="wm__overlay" @click="close"></div>

      <div
        ref="panel"
        class="wm__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="work.title"
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

        <!-- Медиа -->
        <div class="wm__media">
          <video
            v-if="videoSrc"
            ref="videoEl"
            class="wm__video"
            :src="videoSrc"
            :poster="work.poster || undefined"
            autoplay
            muted
            loop
            controls
            playsinline
          ></video>
          <img v-else class="wm__img" :src="imageSrc" :alt="work.alt" />
        </div>

        <!-- Текст -->
        <div class="wm__info">
          <h3 class="wm__title">{{ work.title }}</h3>
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
    opacity: 0;
    transition: opacity 0.25s var(--ease-out);
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
    opacity: 0;
    transform: translateY(16px) scale(0.98);
    transition:
      opacity 0.28s var(--ease-out),
      transform 0.28s var(--ease-out);

    @include up($bp-lg) {
      flex-direction: row;
      max-height: 82vh;
    }
  }

  &.is-visible {
    .wm__overlay {
      opacity: 1;
    }
    .wm__panel {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Кнопка закрытия */
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

  /* Медиа — работу показываем целиком (contain), а не кропаем */
  &__media {
    position: relative;
    flex: none;
    width: 100%;
    max-height: 56vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;

    @include up($bp-lg) {
      width: 58%;
      max-height: none;
      align-self: stretch;
    }
  }

  &__img,
  &__video {
    width: 100%;
    height: auto;
    max-height: 56vh;
    object-fit: contain;
    display: block;

    @include up($bp-lg) {
      height: 100%;
      max-height: none;
    }
  }

  /* Текст */
  &__info {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: clamp(1.5rem, 3vw, 2.5rem);

    @include up($bp-lg) {
      width: 42%;
    }
  }

  &__title {
    margin: 0 0 1rem;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.4rem, 2.6vw, 2rem);
    color: var(--text-100);
  }

  &__tags {
    list-style: none;
    margin: 0 0 1.5rem;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__tag {
    padding: 0.35rem 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-200);
    white-space: nowrap;
  }

  &__desc {
    margin: 0;
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    line-height: 1.7;
    color: var(--text-200);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wm__overlay,
  .wm__panel,
  .wm__close {
    transition: none;
  }
}
</style>
