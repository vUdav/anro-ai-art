<script setup lang="ts">
import { computed } from 'vue'
import { useSeoContent } from '../composables/usePages'
import { useSeo } from '../composables/useSeo'
import DiffusionHero from '../components/hero/DiffusionHero.vue'
import AboutSection from '../components/about/AboutSection.vue'
import WorksSection from '../components/works/WorksSection.vue'
import ServicesSection from '../components/services/ServicesSection.vue'
import ContactsSection from '../components/contacts/ContactsSection.vue'

const seo = useSeoContent()

useSeo({
  title: computed(() => seo.value.title),
  description: computed(() => seo.value.description),
  keywords: computed(() => seo.value.keywords),
  ogImage: computed(() => seo.value.ogImage),
  imageAlt: computed(() => seo.value.imageAlt),
})
</script>

<template>
  <main>
    <DiffusionHero />
    <AboutSection />
    <WorksSection />
    <ServicesSection />
    <ContactsSection />
  </main>
</template>
