<script setup>
import { repositories } from '../data.js'
import PageIntro from '../components/PageIntro.vue'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('公开仓库与学习足迹')
const groups = [...new Set(repositories.repositories.map((r) => r.group))].map((name) => ({
  name,
  repos: repositories.repositories.filter((r) => r.group === name),
}))
</script>
<template>
  <PageIntro
    title="公开仓库，"
    accent="学习足迹。"
    description="这里也放练习、资料、fork 与早期尝试。仓库只是一个入口，整理好的内容会慢慢长成项目笔记。"
    ><span class="section-overline"
      >整理于 {{ repositories.updated }} · {{ repositories.repositories.length }} 个公开仓库</span
    ></PageIntro
  >
  <div class="repository-directory shell">
    <section v-for="group in groups" :key="group.name" class="repo-group">
      <h2>
        {{ group.name }} <small>{{ String(group.repos.length).padStart(2, '0') }}</small>
      </h2>
      <ul>
        <li v-for="repo in group.repos" :key="repo.name">
          <a :href="repo.url"
            ><strong>{{ repo.name }}</strong
            ><span>{{ repo.summary }}</span
            ><i>↗</i></a
          >
        </li>
      </ul>
    </section>
  </div>
</template>
