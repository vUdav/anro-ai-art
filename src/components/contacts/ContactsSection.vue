<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContacts, useHero, useAbout } from '../../composables/usePages'
import { useMotionPreset } from '../../composables/useMotionPreset'

const { t } = useI18n()
const contacts = useContacts()
const hero = useHero()
const about = useAbout()
const { fadeUp } = useMotionPreset()

const year = new Date().getFullYear()

// Ссылки-контакты: личный Telegram, Telegram-канал, Instagram (пустые пропускаем)
const links = computed(() =>
  [
    {
      icon: 'telegram',
      href: contacts.value.telegram,
      label: t('contacts.telegram'),
      aria: t('a11y.telegram'),
    },
    {
      icon: 'channel',
      href: contacts.value.channel,
      label: t('contacts.channel'),
      aria: t('a11y.channel'),
    },
    {
      icon: 'instagram',
      href: contacts.value.instagram,
      label: t('contacts.instagram'),
      aria: t('a11y.instagram'),
    },
  ].filter((l) => !!l.href),
)
</script>

<template>
  <footer id="contacts" class="contacts" :aria-label="t('nav.contacts')">
    <div class="contacts__stage" v-motion="fadeUp(0)">
      <div class="contacts__top">
        <div class="contacts__brand">
          <p class="contacts__name">
            {{ hero.name }} <span class="contacts__role">— {{ hero.role }}</span>
          </p>
          <p class="contacts__tagline">{{ t('footer.madeWith') }}</p>
        </div>

        <nav class="contacts__links" :aria-label="t('nav.contacts')">
          <a
            v-for="l in links"
            :key="l.icon"
            class="contacts__link"
            :href="l.href"
            :aria-label="l.aria"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="contacts__ico" aria-hidden="true">
              <svg
                v-if="l.icon === 'telegram'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <svg
                v-else-if="l.icon === 'channel'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m3 11 18-5v12L3 13" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </span>
            <span class="contacts__label">{{ l.label }}</span>
          </a>
        </nav>
      </div>

      <div class="contacts__bottom">
        <p class="contacts__copy">© {{ year }} {{ about.fullName }} · {{ t('footer.rights') }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;

@mixin up($bp) {
  @media (min-width: $bp) {
    @content;
  }
}

.contacts {
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  background: var(--bg-800);
  padding: clamp(2.25rem, 4vw, 3.25rem) 1.25rem clamp(1.75rem, 3vw, 2.25rem);

  @include up($bp-md) {
    padding: 3rem 2rem 2rem;
  }
  @include up($bp-lg) {
    padding: 3.5rem 3rem 2.25rem;
  }
  @include up($bp-xl) {
    padding: 3.5rem 4rem 2.25rem;
  }

  &__stage {
    max-width: var(--maxw);
    margin-inline: auto;
  }

  /* Верхний ряд: бренд слева, ссылки справа (desktop); стек (mobile) */
  &__top {
    display: flex;
    flex-direction: column;
    gap: 2rem;

    @include up($bp-md) {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2.5rem;
    }
  }

  &__name {
    margin: 0 0 0.5rem;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.1rem, 2vw, 1.35rem);
    color: var(--text-100);
  }

  &__role {
    color: var(--text-300);
    font-weight: 400;
  }

  &__tagline {
    margin: 0;
    max-width: 34ch;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text-300);
  }

  /* Подписанные ссылки — колонкой */
  &__links {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    @include up($bp-md) {
      align-items: flex-end;
    }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0;
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-300);
    text-decoration: none;
    transition: color 0.25s var(--ease-out);

    // Комфортный тач-таргет на сенсорных устройствах
    @media (pointer: coarse) {
      min-height: 44px;
    }
  }

  &__ico {
    display: inline-flex;
    color: var(--text-300);
    transition: color 0.25s var(--ease-out);
  }

  &__link:hover,
  &__link:focus-visible {
    color: var(--text-100);
    outline: none;

    .contacts__ico {
      color: var(--neon-cyan);
    }
  }

  &__link:focus-visible {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Нижняя строка — копирайт */
  &__bottom {
    margin-top: clamp(1.75rem, 3vw, 2.5rem);
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__copy {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-300);
  }
}

@media (prefers-reduced-motion: reduce) {
  .contacts__link,
  .contacts__ico {
    transition: none;
  }
}
</style>
