<script setup>
import { repositories } from '../data.js'
import PageIntro from '../components/PageIntro.vue'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('精选代码仓库')
const groups = [...new Set(repositories.repositories.map((r) => r.group))].map((name) => ({
  name,
  repos: repositories.repositories.filter((r) => r.group === name),
}))
</script>
<template>
  <PageIntro
    title="精选项目，"
    accent="从代码开始。"
    description="这里列出主页相关的公开项目。团队项目与上游 fork 会在说明中标注。"
    ><span class="section-overline"
      >{{ repositories.repositories.length }} 个精选仓库</span
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
