<script setup lang="ts">
import SiteHeader from './components/layout/SiteHeader.vue'
import AmbientBackground from './components/fx/AmbientBackground.vue'
</script>

<template>
  <AmbientBackground />
  <SiteHeader />
  <router-view />
</template>
