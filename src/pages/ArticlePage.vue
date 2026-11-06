<script setup>
import { computed } from 'vue'
import { entries, site, typeNames } from '../data.js'
import EntryMeta from '../components/EntryMeta.vue'
import ArticleToc from '../components/ArticleToc.vue'
import MarkdownBody from '../components/MarkdownBody.vue'
import { useClipboard } from '../composables/useClipboard.js'
import { usePageHead } from '../composables/usePageHead.js'
const props = defineProps({ slug: String })
const entry = computed(() => entries.find((e) => e.slug === props.slug))
usePageHead(
  () => entry.value.title,
  () => entry.value.summary,
  { article: entry },
)
const related = computed(() =>
  entries
    .filter((e) => e.slug !== props.slug)
    .map((e) => ({
      entry: e,
      score:
        e.tags.filter((t) => entry.value.tags.includes(t)).length +
        (entry.value.project && e.project === entry.value.project ? 3 : 0),
    }))
    .filter((e) => e.score)
    .sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date))
    .slice(0, 3),
)
const backlinks = computed(() =>
  entries.filter((e) => e.slug !== props.slug && e.links.includes(entry.value.href)),
)
const { copy, copied } = useClipboard()
</script>
<template>
  <section class="article-top shell">
    <RouterLink class="back-link" to="/garden/">← 回到花园</RouterLink>
    <div class="article-heading">
      <span class="eyebrow">{{ entry.category }} · {{ typeNames[entry.type] }}</span>
      <h1>{{ entry.title }}</h1>
      <p class="article-deck">{{ entry.summary }}</p>
      <EntryMeta :entry="entry" />
    </div>
  </section>
  <div class="article-layout shell">
    <ArticleToc :headings="entry.headings" />
    <article class="prose" data-article-body>
      <MarkdownBody :html="entry.html" />
      <div class="article-end">
        <span>✳</span>
        <p>记于 {{ entry.date }} · {{ entry.updated || entry.date }} 更新</p>
        <button class="copy-page-link" @click="copy(site.url + entry.href)">
          {{ copied ? '链接已复制' : '复制链接 ↗' }}
        </button>
      </div>
      <RouterLink v-if="entry.project" class="inline-project" :to="`/projects/${entry.project}/`"
        >看看关联项目 ↗</RouterLink
      ><RouterLink v-if="entry.series" class="inline-project" :to="`/series/${entry.series}/`"
        >专题：{{ site.series[entry.series].title }} ↗</RouterLink
      >
      <div v-if="backlinks.length" class="backlinks">
        <div class="section-overline">哪些笔记走到了这里</div>
        <RouterLink v-for="link in backlinks" :key="link.slug" :to="link.href"
          >{{ link.title }} ↗</RouterLink
        >
      </div>
      <div class="related">
        <div class="section-overline">继续散步 <span>RELATED NOTES</span></div>
        <RouterLink
          v-for="item in related"
          :key="item.entry.slug"
          class="related-link"
          :to="item.entry.href"
          ><span>{{ item.entry.category }}</span
          >{{ item.entry.title }} <b>↗</b></RouterLink
        ><RouterLink v-if="!related.length" class="related-link" to="/garden/"
          ><span>花园索引</span>沿着其他主题继续走 <b>↗</b></RouterLink
        >
      </div>
    </article>
  </div>
</template>
