<script setup>
import { site, entries } from '../data.js'
import PageIntro from '../components/PageIntro.vue'
import EntryCard from '../components/EntryCard.vue'
import { usePageHead } from '../composables/usePageHead.js'
const props = defineProps({ kind: String })
const titles = { journal: '随记', about: '关于', now: '近况' }
usePageHead(() => titles[props.kind])
const journals = entries.filter((e) => e.type === 'journal')
</script>
<template>
  <template v-if="kind === 'about'"
    ><PageIntro
      eyebrow="ABOUT THE GARDENER"
      title="你好，我是"
      :accent="`${site.author}。`"
      :description="`${site.subtitle} 我会记录技术实践、阅读、日常和还在生长的想法。`"
    />
    <section class="about-body shell">
      <article class="prose">
        <h2>这座花园</h2>
        <p>
          有些记录已经整理成文章，有些还只是一个起点。技术实践会从 MoonBit、Agent、Linux
          工具与实验项目展开；阅读和日常则等真实片段慢慢加入。
        </p>
        <h2>如何阅读</h2>
        <p>可以沿主题探索，也可以从最近的记录开始。知识笔记会继续修订，随记保留发生时的视角。</p>
        <div class="about-links">
          <RouterLink to="/garden/">逛逛花园 ↗</RouterLink><a :href="site.github">GitHub ↗</a>
        </div>
      </article>
      <aside class="about-aside">
        <span>GARDEN RULE NO. 01</span>
        <p>先把真实的东西种下来。</p>
        <i>✳</i>
      </aside>
    </section></template
  >
  <template v-else-if="kind === 'now'"
    ><PageIntro
      eyebrow="NOW · 2026-11"
      title="此刻，"
      accent="还在路上。"
      description="我在搭建这座数字花园，也从真实的技术实践里挑选值得留下的记录。"
    />
    <section class="now-content shell">
      <article>
        <span class="section-overline">正在整理</span>
        <h2>把分散的笔记，慢慢变成可以散步的花园。</h2>
        <p>
          第一批内容来自 Markdown 渲染器、Agent 实验、Linux
          工具排查和数据绘图工作流。阅读与日常随记会等合适的真实片段出现后再加入。
        </p>
      </article>
      <aside>这页由园丁手动维护<br /><span>上次更新 · 2026-11-05</span></aside>
    </section></template
  >
  <template v-else
    ><PageIntro
      eyebrow="THE FIELD NOTES · 随手记下的日常"
      title="留下一点，"
      accent="日常的温度。"
      description="值得记住的片刻与自己的观察。"
    />
    <section v-if="journals.length" class="garden-grid shell series-grid">
      <EntryCard v-for="entry in journals" :key="entry.slug" :entry="entry" />
    </section>
    <section v-else class="journal-empty shell">
      <div class="empty-art" aria-hidden="true"><span>✳</span><i /><b /></div>
      <div class="empty-copy">
        <span class="section-overline">A SPACE TO GROW</span>
        <h2>这里先留一块空地。</h2>
        <p>
          等第一则愿意分享的日常来到，随记会从这里开始。花园的其他角落已经有一些技术实践与正在生长的想法。
        </p>
        <RouterLink class="button button-dark" to="/garden/">先去逛逛花园 ↗</RouterLink>
      </div>
    </section></template
  >
</template>
