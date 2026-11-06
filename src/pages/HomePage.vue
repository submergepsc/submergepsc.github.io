<script setup>
import { site, entries, projects } from '../data.js'
import { usePageHead } from '../composables/usePageHead.js'
import EntryCard from '../components/EntryCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
usePageHead('数字花园')
const featured = entries
  .filter((e) => e.featured)
  .sort((a, b) => a.featured - b.featured)
  .slice(0, 3)
const recent = entries.filter((e) => !featured.includes(e)).slice(0, 4)
const topics = [
  {
    name: '技术实践',
    mark: '⌘',
    index: '01 / MAKING',
    cls: 'map-tech',
    href: '/garden/?topic=tech',
    description: '项目、代码、测试，以及解决问题的过程。',
    note: '从真实的尝试开始 ↗',
  },
  {
    name: '阅读与思考',
    mark: '⌁',
    index: '02 / THINKING',
    cls: 'map-reading',
    href: '/garden/?topic=thinking',
    description: '在读的内容、还没想完的问题和新的联系。',
    note: '收集正在长大的想法 ↗',
  },
  {
    name: '日常生活',
    mark: '✳',
    index: '03 / LIVING',
    cls: 'map-life',
    href: '/journal/',
    description: '值得记住的片刻，一点自己的观察。',
    note: '留个位置给下一则随记 ↗',
  },
]
</script>
<template>
  <section class="hero shell">
    <div class="hero-copy">
      <div class="hero-eyebrow"><span class="live-dot" />一座正在生长的个人花园</div>
      <h1>
        <span class="hero-line">把学到的、</span><span class="hero-line">想到的、经历的，</span
        ><span class="hero-line">慢慢留下来。</span>
      </h1>
      <p class="hero-subtitle">{{ site.subtitle }} 有些记录是完整文章，有些只是一个起点。</p>
      <div class="hero-actions">
        <RouterLink class="button button-dark" to="/garden/">逛逛花园 <span>↗</span></RouterLink
        ><RouterLink class="text-link" to="/about/">认识园丁 →</RouterLink>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="orbit orbit-one" />
      <div class="orbit orbit-two" />
      <div class="garden-stem stem-one"><i /><b /><em /></div>
      <div class="garden-stem stem-two"><i /><b /></div>
      <div class="garden-stem stem-three"><i /><b /><em /></div>
      <span class="art-label">notes in progress</span
      ><span class="art-coordinate">always growing</span>
    </div>
    <div class="hero-bottom"><span>一切从一次记录开始</span><span>SCROLL TO EXPLORE ↓</span></div>
  </section>
  <section class="garden-map shell">
    <div class="section-heading">
      <div>
        <span class="section-overline">THE GARDEN <span>01—03</span></span>
        <h2>从你此刻的好奇心出发。</h2>
      </div>
      <RouterLink class="quiet-link" to="/garden/">查看所有主题 ↗</RouterLink>
    </div>
    <div class="map-grid">
      <RouterLink
        v-for="topic in topics"
        :key="topic.cls"
        :to="topic.href"
        class="map-card"
        :class="topic.cls"
        ><span class="map-index">{{ topic.index }}</span
        ><span class="map-icon">{{ topic.mark }}</span>
        <h3>{{ topic.name }}</h3>
        <p>{{ topic.description }}</p>
        <span class="map-count">{{ topic.note }}</span></RouterLink
      >
    </div>
  </section>
  <section class="latest-band">
    <div class="latest-layout shell">
      <div class="latest-intro">
        <span class="section-overline">RECENTLY PLANTED <span>最近种下</span></span>
        <h2>一些还在<br />生长的记录。</h2>
        <p>想法会更新，笔记也会变。这里留下它们此刻的样子。</p>
        <RouterLink class="quiet-link" to="/garden/">漫步所有笔记 ↗</RouterLink>
      </div>
      <div class="featured-grid">
        <EntryCard v-for="entry in featured" :key="entry.slug" :entry="entry" featured />
      </div>
    </div>
  </section>
  <section class="recent-section shell">
    <div class="section-heading">
      <div>
        <span class="section-overline">A WALK THROUGH NOTES <span>最近更新</span></span>
        <h2>最近留下的脚印。</h2>
      </div>
      <RouterLink class="quiet-link" to="/garden/">全部记录 ↗</RouterLink>
    </div>
    <div class="recent-list">
      <RouterLink v-for="entry in recent" :key="entry.slug" class="recent-row" :to="entry.href"
        ><span class="recent-date">{{ entry.date.slice(-5) }}</span
        ><span class="recent-type">{{ entry.category }}</span
        ><span class="recent-title">{{ entry.title }}</span
        ><span class="recent-arrow">↗</span></RouterLink
      >
    </div>
  </section>
  <section class="home-projects shell">
    <div class="section-heading">
      <div>
        <span class="section-overline">FROM THE WORKBENCH <span>项目笔记</span></span>
        <h2>想法，也长成了一些小东西。</h2>
      </div>
      <RouterLink class="quiet-link" to="/projects/">全部项目 ↗</RouterLink>
    </div>
    <div class="projects-grid">
      <ProjectCard
        v-for="(project, index) in projects.slice(0, 2)"
        :key="project.slug"
        :project="project"
        :number="index + 1"
      />
    </div>
  </section>
  <section class="now-card shell">
    <div class="now-mark">✳</div>
    <div>
      <span class="section-overline">A SMALL NOTE TO SELF</span>
      <h2>慢一点也没关系，<br />花园本来就是慢慢长的。</h2>
      <p>你可以从一则短记开始，再沿着它找到相关的文章与项目。</p>
    </div>
    <RouterLink class="button button-outline" to="/now/">此刻在做什么 ↗</RouterLink>
  </section>
</template>
