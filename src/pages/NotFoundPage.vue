<script setup>
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('走错了一个岔路', '返回数字花园。', { noindex: true })
</script>
<template>
  <section class="not-found shell">
    <span>404 · A LITTLE DETOUR</span>
    <h1>这条小路<br /><i>还没有长出来。</i></h1>
    <p>也许它还在整理中，或者路标换了位置。</p>
    <RouterLink class="button button-dark" to="/">回到花园 ↗</RouterLink>
  </section>
</template>
