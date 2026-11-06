<script setup>
import { stageNames } from '../data.js'
defineProps({ entry: { type: Object, required: true } })
</script>
<template>
  <div class="entry-meta">
    <time :datetime="entry.date">{{ entry.date }}</time
    ><span v-if="entry.updated && entry.updated !== entry.date">更新于 {{ entry.updated }}</span
    ><span class="stage" :class="`stage-${entry.stage}`"><i />{{ stageNames[entry.stage] }}</span
    ><span>约 {{ entry.minutes }} 分钟</span>
  </div>
  <div class="tag-row">
    <RouterLink
      v-for="tag in entry.tags"
      :key="tag"
      class="tag"
      :to="{ path: '/garden/', query: { tag } }"
      >{{ tag }}</RouterLink
    >
  </div>
</template>
