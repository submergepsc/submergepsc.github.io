<script setup>
import { site, entries, projects } from '../data.js'
import { usePageHead } from '../composables/usePageHead.js'
import EntryCard from '../components/EntryCard.vue'
import ProjectCard from '../components/ProjectCard.vue'
usePageHead('个人主页')
const featured = entries
  .filter((e) => e.featured)
  .sort((a, b) => a.featured - b.featured)
  .slice(0, 3)
const recent = entries.filter((e) => !featured.includes(e)).slice(0, 4)
const topics = [
  {
    name: '技术笔记',
    mark: '⌘',
    index: '01 / MAKING',
    cls: 'map-tech',
    href: '/garden/',
    description: '代码、测试与实验中的方法和思考。',
    note: '阅读笔记 ↗',
  },
  {
    name: '项目实践',
    mark: '⌁',
    index: '02 / PROJECTS',
    cls: 'map-reading',
    href: '/projects/',
    description: '渲染器、数据绘图和时间序列实验。',
    note: '查看项目 ↗',
  },
  {
    name: '实用工具',
    mark: '✳',
    index: '03 / TOOLS',
    cls: 'map-life',
    href: '/tools/',
    description: '图片链接、编码转换与文本整理。',
    note: '打开工具箱 ↗',
  },
]
</script>
<template>
  <section class="hero shell">
    <div class="hero-copy">
      <div class="hero-eyebrow"><span class="live-dot" />SubmergePSC · 个人主页</div>
      <h1>
        <span class="hero-line">把学到的、</span><span class="hero-line">想到的、经历的，</span
        ><span class="hero-line">慢慢留下来。</span>
      </h1>
      <p class="hero-subtitle">{{ site.subtitle }} 欢迎浏览我的笔记与公开项目。</p>
      <div class="hero-actions">
        <RouterLink class="button button-dark" to="/projects/">查看项目 <span>↗</span></RouterLink
        ><RouterLink class="text-link" to="/about/">关于我 →</RouterLink>
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
        <h2>精选<br />技术笔记。</h2>
        <p>整理项目实践中的方法、设计取舍与学习心得。</p>
        <RouterLink class="quiet-link" to="/garden/">阅读全部笔记 ↗</RouterLink>
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
        <h2>最近更新的笔记。</h2>
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
      <span class="section-overline">THE TOOLBOX</span>
      <h2>随手可用的，<br />几个小工具。</h2>
      <p>转换图片链接、处理 JSON、整理文本，直接在浏览器里完成。</p>
    </div>
    <RouterLink class="button button-outline" to="/tools/">打开工具箱 ↗</RouterLink>
  </section>
</template>
