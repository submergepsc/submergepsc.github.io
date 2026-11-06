<script setup>
import { projects } from '../data.js'
import PageIntro from '../components/PageIntro.vue'
import ProjectCard from '../components/ProjectCard.vue'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('项目', '从真实代码、公开仓库与工程记录出发的项目笔记。')
</script>
<template>
  <PageIntro
    eyebrow="THINGS I HAVE BEEN MAKING"
    title="一些在做的"
    accent="小东西。"
    description="渲染器、实验脚本、数据工具。把代码背后的问题与过程也记下来。"
  />
  <section class="projects-grid shell">
    <ProjectCard
      v-for="(project, index) in projects"
      :key="project.slug"
      :project="project"
      :number="index + 1"
    />
  </section>
  <section class="project-note shell">
    <RouterLink class="quiet-link" to="/projects/repositories/"
      >查看全部公开仓库与学习足迹 ↗</RouterLink
    >
  </section>
</template>
