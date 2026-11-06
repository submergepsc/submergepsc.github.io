<script setup>
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <SiteHeader />
  <main id="main"><RouterView :key="$route.path" /></main>
  <SiteFooter />
</template>
