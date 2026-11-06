<script setup>
import { computed } from 'vue'
import { entries, series } from '../data.js'
import PageIntro from '../components/PageIntro.vue'
import EntryCard from '../components/EntryCard.vue'
import { usePageHead } from '../composables/usePageHead.js'
const props = defineProps({ kind: String, slug: String })
const collection = computed(() => series.find((s) => s.slug === props.slug))
const title = computed(() =>
  props.kind === 'archive' ? '归档' : props.kind === 'series' ? '专题' : collection.value.title,
)
usePageHead(title)
const months = [...new Set(entries.map((e) => e.date.slice(0, 7)))]
  .sort()
  .reverse()
  .map((month) => ({ month, entries: entries.filter((e) => e.date.startsWith(month)) }))
</script>
<template>
  <template v-if="kind === 'series'"
    ><PageIntro
      eyebrow="FOLLOW A THREAD"
      title="顺着一条线索，"
      accent="继续探索。"
      description="把相关笔记放在一起，从一个问题走向下一个问题。"
    />
    <section class="series-list shell">
      <RouterLink v-for="item in series" :key="item.slug" class="series-card" :to="item.href"
        ><span class="section-overline"
          >{{ String(item.entries.length).padStart(2, '0') }} NOTES</span
        >
        <h2>{{ item.title }}</h2>
        <p>{{ item.summary }}</p>
        <b>沿这条小路走走 ↗</b></RouterLink
      >
    </section></template
  >
  <template v-else-if="kind === 'archive'"
    ><PageIntro
      eyebrow="THROUGH THE SEASONS"
      title="时间留下的，"
      accent="一页一页。"
      description="按首次整理发布的月份回看。文中提及的历史事件另有日期。"
    />
    <div class="archive shell">
      <section v-for="group in months" :key="group.month">
        <h2>{{ group.month }}</h2>
        <ul class="archive-list">
          <li v-for="entry in group.entries" :key="entry.slug">
            <time :datetime="entry.date">{{ entry.date.slice(5) }}</time
            ><RouterLink :to="entry.href">{{ entry.title }}</RouterLink
            ><span>{{ entry.category }}</span>
          </li>
        </ul>
      </section>
    </div></template
  >
  <template v-else
    ><PageIntro :title="collection.title" :description="collection.summary"
      ><RouterLink class="back-link" to="/series/">← 全部专题</RouterLink
      ><span class="section-overline"
        >{{ collection.entries.length }} 则笔记 · 持续整理</span
      ></PageIntro
    >
    <section class="garden-grid shell series-grid">
      <EntryCard v-for="entry in collection.entries" :key="entry.slug" :entry="entry" /></section
  ></template>
</template>
