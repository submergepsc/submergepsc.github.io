<script setup>
defineProps({
  headings: { type: Array, default: () => [] },
  label: { type: String, default: '这篇笔记' },
})
</script>
<template>
  <aside v-if="headings.length" class="article-toc" aria-label="文章目录">
    <span>{{ label }}</span>
    <div class="toc">
      <ul>
        <li
          v-for="heading in headings"
          :key="heading.id"
          :class="{ 'toc-child': heading.level > 2 }"
        >
          <a :href="`#${heading.id}`">{{ heading.title }}</a>
        </li>
      </ul>
    </div>
  </aside>
  <aside v-else />
</template>
