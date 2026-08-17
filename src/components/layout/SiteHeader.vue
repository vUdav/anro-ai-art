<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { SUPPORTED_LOCALES, LOCALE_NAMES, type AppLocale } from '../../i18n'
import { HEADER_H } from '../../constants/layout'
import OrderButton from '../ui/OrderButton.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const items: { key: string; id: string; enabled: boolean }[] = [
  { key: 'about', id: 'about', enabled: true },
  { key: 'portfolio', id: 'works', enabled: true },
  { key: 'services', id: 'services', enabled: true },
  { key: 'contacts', id: 'contacts', enabled: true },
]

const locales = SUPPORTED_LOCALES
const names = LOCALE_NAMES

const progress = ref(0)
const open = ref(false)

const navStyle = computed(() => {
  const blur = (1 - progress.value) * 10
  return {
    opacity: progress.value,
    filter: blur < 0.1 ? 'none' : `blur(${blur}px)`,
    pointerEvents: progress.value > 0.5 ? 'auto' : ('none' as 'auto' | 'none'),
  }
})

let raf = 0
function measure() {
  const about = document.getElementById('about')
  if (!about) {
    progress.value = 1
    return
  }
  const top = about.getBoundingClientRect().top
  const end = HEADER_H
  const start = HEADER_H + 160
  const p = (start - top) / (start - end)
  progress.value = Math.min(1, Math.max(0, p))
}
function onScroll() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(measure)
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_H
  window.scrollTo({ top: y, behavior: 'smooth' })
  window.history.replaceState(null, '', `#${id}`)
  open.value = false
}

function switchLocale(loc: AppLocale) {
  const base = loc === 'ru' ? '/' : `/${loc}`
  router.push({ path: base, hash: route.hash || '' })
  open.value = false
}

function onOrder() {
  scrollToId('order')
}

const PANEL_MS = 420
const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function animatePanel(el: HTMLElement, opening: boolean, done: () => void) {
  if (prefersReduced) {
    done()
    return
  }
  const inner = el.querySelector('.nav__panel-inner') as HTMLElement | null
  el.style.overflow = 'hidden'
  el.style.height = '0px'
  const full = el.scrollHeight
  const from = opening ? 0 : full
  const to = opening ? full : 0
  const anim = el.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: PANEL_MS,
    easing: PANEL_EASE,
  })
  if (inner) {
    inner.animate([{ opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0 }], {
      duration: opening ? PANEL_MS : Math.round(PANEL_MS * 0.7),
      easing: PANEL_EASE,
      fill: 'both',
    })
  }
  const finish = () => {
    el.style.overflow = ''
    el.style.height = ''
    if (inner) inner.style.opacity = ''
    done()
  }
  anim.onfinish = finish
  anim.oncancel = finish
}

function onPanelEnter(el: Element, done: () => void) {
  animatePanel(el as HTMLElement, true, done)
}
function onPanelLeave(el: Element, done: () => void) {
  animatePanel(el as HTMLElement, false, done)
}
</script>

<template>
  <header class="nav" :style="navStyle">
    <div class="nav__inner" :style="{ height: HEADER_H + 'px' }">
      <button
        class="nav__burger"
        :class="{ 'is-open': open }"
        type="button"
        :aria-label="t('a11y.toggleMenu')"
        :aria-expanded="open"
        @click="open = !open"
      >
        <span></span><span></span><span></span>
      </button>

      <nav class="nav__links">
        <template v-for="it in items" :key="it.key">
          <a
            v-if="it.enabled"
            class="nav__link"
            :href="`#${it.id}`"
            @click.prevent="scrollToId(it.id)"
            >{{ t(`nav.${it.key}`) }}</a
          >
          <span v-else class="nav__link nav__link--disabled" aria-disabled="true">{{
            t(`nav.${it.key}`)
          }}</span>
        </template>
      </nav>

      <div class="nav__right">
        <div class="nav__lang" role="group" :aria-label="t('a11y.switchLanguage')">
          <button
            v-for="loc in locales"
            :key="loc"
            type="button"
            class="nav__lang-btn"
            :class="{ 'is-active': loc === locale }"
            @click="switchLocale(loc)"
          >
            {{ names[loc] }}
          </button>
        </div>

        <OrderButton @click="onOrder">{{ t('actions.order') }}</OrderButton>
      </div>
    </div>

    <transition :css="false" @enter="onPanelEnter" @leave="onPanelLeave">
      <div v-show="open" class="nav__panel">
        <div class="nav__panel-inner">
          <nav class="nav__panel-links">
            <template v-for="it in items" :key="it.key">
              <a
                v-if="it.enabled"
                class="nav__link"
                :href="`#${it.id}`"
                @click.prevent="scrollToId(it.id)"
                >{{ t(`nav.${it.key}`) }}</a
              >
              <span v-else class="nav__link nav__link--disabled" aria-disabled="true">{{
                t(`nav.${it.key}`)
              }}</span>
            </template>
          </nav>
          <div
            class="nav__lang nav__lang--panel"
            role="group"
            :aria-label="t('a11y.switchLanguage')"
          >
            <button
              v-for="loc in locales"
              :key="loc"
              type="button"
              class="nav__lang-btn"
              :class="{ 'is-active': loc === locale }"
              @click="switchLocale(loc)"
            >
              {{ names[loc] }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped lang="scss">
$bp-nav: 860px;

@mixin up($bp) {
  @media (min-width: $bp) {
    @content;
  }
}

.nav {
  position: fixed;
  z-index: 50;
  top: 0;
  left: 0;
  right: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);

  &__inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    max-width: var(--maxw);
    margin-inline: auto;
    padding-inline: clamp(1.25rem, 5vw, 4rem);
  }

  &__links {
    display: none;
    align-items: center;
    gap: clamp(1rem, 2.2vw, 2rem);

    @include up($bp-nav) {
      display: flex;
    }
  }

  &__link {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-200);
    letter-spacing: 0.01em;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.25s var(--ease-out);
    white-space: nowrap;

    &:hover {
      color: var(--text-100);
    }

    &--disabled {
      color: var(--text-500);
      cursor: default;
      pointer-events: none;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    @include up($bp-nav) {
      gap: 1.25rem;
    }
  }

  &__lang {
    display: none;
    align-items: center;
    gap: 0.15rem;

    @include up($bp-nav) {
      display: flex;
    }

    &--panel {
      display: flex;
    }
  }

  &__lang-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.5rem;
    border: 0;
    background: transparent;
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--text-300);
    cursor: pointer;
    border-radius: 8px;
    transition: color 0.25s var(--ease-out);

    @media (pointer: coarse) {
      min-height: 44px;
    }

    &:hover {
      color: var(--text-100);
    }
    &.is-active {
      color: var(--text-100);
      background: rgba(255, 255, 255, 0.06);
    }
  }

  &__burger {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 0 9px;
    border: 0;
    background: transparent;
    cursor: pointer;

    span {
      display: block;
      height: 2px;
      width: 100%;
      border-radius: 2px;
      background: var(--text-100);
      transition:
        transform 0.3s var(--ease-out),
        opacity 0.2s var(--ease-out);
    }
    &.is-open span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    &.is-open span:nth-child(2) {
      opacity: 0;
    }
    &.is-open span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    @include up($bp-nav) {
      display: none;
    }
  }

  &__panel {
    overflow: hidden;

    @include up($bp-nav) {
      display: none;
    }
  }

  &__panel-inner {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem clamp(1.25rem, 5vw, 4rem) 2rem;
  }

  &__panel-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .nav__link {
      font-family: var(--font-display);
      font-size: 1.15rem;
      min-height: 44px;
      display: flex;
      align-items: center;
    }
  }
}


@media (prefers-reduced-motion: reduce) {
  .nav {
    filter: none !important;
  }
}
</style>
