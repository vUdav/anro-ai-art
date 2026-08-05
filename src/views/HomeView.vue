<script setup lang="ts">
import { computed } from 'vue'
import { useHero } from '../composables/usePages'
import { useSeo } from '../composables/useSeo'
import DiffusionHero from '../components/hero/DiffusionHero.vue'
import AboutSection from '../components/about/AboutSection.vue'
import WorksSection from '../components/works/WorksSection.vue'
import ServicesSection from '../components/services/ServicesSection.vue'

const hero = useHero()

useSeo({
  title: computed(() => `${hero.value.name} — ${hero.value.role}`),
  description: computed(() => hero.value.subheadline),
})
</script>

<template>
  <main>
    <DiffusionHero />
    <AboutSection />
    <WorksSection />
    <ServicesSection />
  </main>
</template>
