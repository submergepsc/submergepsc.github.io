<script setup>
import { computed, ref } from 'vue'
import { tools } from '../data.js'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('工具箱', '图片直链、JSON、编码、时间戳与文本工具，在浏览器中直接使用。')
const search = ref(''),
  category = ref('all')
const categories = [...new Set(tools.map((t) => t.category))]
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase()
const shown = computed(() =>
  tools.filter(
    (t) =>
      (category.value === 'all' || t.category === category.value) &&
      normalize(search.value)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) =>
          normalize([t.title, t.description, ...t.keywords].join(' ')).includes(term),
        ),
  ),
)
</script>
<template>
  <section class="page-intro shell toolbox-intro">
    <span class="section-overline">THE WORKBENCH <span>随手可用的小工具</span></span>
    <h1>把小问题，<br /><i>顺手解决。</i></h1>
    <p>整理文本、处理数据和转换格式。输入在当前浏览器中处理，不发送到服务器。</p>
    <div class="toolbox-toolbar">
      <label class="sr-only" for="tool-search">查找工具</label
      ><input
        id="tool-search"
        v-model="search"
        type="search"
        placeholder="查找工具，例如 JSON、时间戳…"
      />
      <div class="tool-category-filters" aria-label="工具分类">
        <button
          v-for="name in ['all', ...categories]"
          :key="name"
          type="button"
          class="filter-chip"
          :class="{ 'is-selected': category === name }"
          :aria-pressed="category === name"
          @click="category = name"
        >
          {{ name === 'all' ? '全部' : name }}
        </button>
      </div>
    </div>
  </section>
  <section id="tool-directory" class="tool-directory shell" aria-label="工具目录">
    <RouterLink
      v-for="tool in shown"
      :key="tool.slug"
      class="tool-card"
      :to="`/tools/${tool.slug}/`"
      ><span class="tool-card-top"
        ><span class="tool-mark" aria-hidden="true">{{ tool.mark }}</span
        ><span class="tool-category">{{ tool.category }}</span></span
      >
      <h2>{{ tool.title }}</h2>
      <p>{{ tool.description }}</p>
      <span class="tool-card-link">打开工具 <b aria-hidden="true">↗</b></span></RouterLink
    >
  </section>
  <p v-if="!shown.length" class="tool-empty shell">没有找到匹配的工具，试试其他关键词或分类。</p>
  <div class="tool-directory-footer shell">
    <span id="tool-count" role="status" aria-live="polite"
      >{{ shown.length }} / {{ tools.length }} 个工具</span
    ><span>输入不会写入网址或本地存储</span>
  </div>
</template>
