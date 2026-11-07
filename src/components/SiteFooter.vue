<script setup>
import { site } from '../data.js'
const links = [
  ['/garden/', '技术笔记'],
  ['/projects/', '项目'],
  ['/tools/', '工具箱'],
  ['/series/', '专题'],
  ['/archive/', '归档'],
]
</script>
<template>
  <footer class="footer">
    <div class="footer-inner">
      <RouterLink class="footer-brand" to="/">{{ site.brand }}</RouterLink>
      <p>{{ site.tagline }}</p>
      <div class="footer-links">
        <RouterLink v-for="[to, label] in links" :key="to" :to="to">{{ label }}</RouterLink
        ><a href="/rss.xml">RSS</a><a :href="site.github">GitHub ↗</a>
      </div>
      <small>由真实记录慢慢生长 · © {{ new Date().getFullYear() }} {{ site.brand }}</small>
    </div>
  </footer>
</template>
