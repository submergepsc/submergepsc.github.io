<script setup>
import { computed } from 'vue'
import { projects, entries } from '../data.js'
import ArticleToc from '../components/ArticleToc.vue'
import MarkdownBody from '../components/MarkdownBody.vue'
import { usePageHead } from '../composables/usePageHead.js'
const props = defineProps({ slug: String })
const project = computed(() => projects.find((p) => p.slug === props.slug))
const notes = computed(() => entries.filter((e) => e.project === props.slug))
usePageHead(
  () => project.value.title,
  () => project.value.summary,
)
</script>
<template>
  <section class="project-hero shell">
    <RouterLink class="back-link" to="/projects/">← 回到项目</RouterLink>
    <div class="project-hero-copy">
      <span class="section-overline">{{ project.label }}</span>
      <h1>{{ project.title }}</h1>
      <p>{{ project.summary }}</p>
      <a class="button button-dark" :href="project.repository">查看公开仓库 ↗</a>
    </div>
  </section>
  <section class="project-facts shell">
    <div v-for="[label, value] in project.facts" :key="label">
      <span>{{ label }}</span
      ><b>{{ value }}</b>
    </div>
  </section>
  <figure class="project-screenshot shell">
    <img :src="project.image" :alt="project.image_alt" width="900" height="510" />
    <figcaption>{{ project.image_alt }}</figcaption>
  </figure>
  <section class="project-detail-layout shell">
    <ArticleToc :headings="project.headings" label="项目地图" />
    <article class="prose">
      <MarkdownBody :html="project.html" />
      <div class="related">
        <div class="section-overline">相关笔记 <span>GARDEN PATH</span></div>
        <RouterLink
          v-for="entry in notes"
          :key="entry.slug"
          class="project-note-link"
          :to="entry.href"
          >{{ entry.title }} ↗</RouterLink
        >
      </div>
    </article>
  </section>
</template>
