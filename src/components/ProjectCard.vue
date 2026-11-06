<script setup>
defineProps({ project: { type: Object, required: true }, number: { type: Number, default: 1 } })
</script>
<template>
  <article class="project-card">
    <RouterLink class="project-visual" :to="project.href"
      ><img
        :src="project.image"
        :alt="project.image_alt"
        loading="lazy"
        width="900"
        height="510"
      /><span class="project-number"
        >{{ String(number).padStart(2, '0') }} / FIELD NOTE</span
      ></RouterLink
    >
    <div class="project-info">
      <div class="project-status">
        <span class="live-dot" />{{ project.status }} · {{ project.label }}
      </div>
      <h2>
        <RouterLink :to="project.href">{{ project.title }}</RouterLink>
      </h2>
      <p>{{ project.summary }}</p>
      <div class="project-links">
        <RouterLink :to="project.href">项目笔记 ↗</RouterLink
        ><a :href="project.repository">GitHub ↗</a>
      </div>
    </div>
  </article>
</template>
