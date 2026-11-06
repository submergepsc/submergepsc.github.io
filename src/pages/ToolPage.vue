<script setup>
import { computed } from 'vue'
import { tools } from '../data.js'
import { usePageHead } from '../composables/usePageHead.js'
import JsonTool from '../tools/JsonTool.vue'
import GitHubImageTool from '../tools/GitHubImageTool.vue'
import Base64Tool from '../tools/Base64Tool.vue'
import UrlTool from '../tools/UrlTool.vue'
import TimestampTool from '../tools/TimestampTool.vue'
import TextStatsTool from '../tools/TextStatsTool.vue'
import LineCleanerTool from '../tools/LineCleanerTool.vue'
const props = defineProps({ slug: String })
const components = {
  json: JsonTool,
  'github-image': GitHubImageTool,
  base64: Base64Tool,
  url: UrlTool,
  timestamp: TimestampTool,
  'text-stats': TextStatsTool,
  'line-cleaner': LineCleanerTool,
}
const tool = computed(() => tools.find((t) => t.slug === props.slug))
usePageHead(
  () => tool.value.title,
  () => tool.value.description,
)
</script>
<template>
  <section class="tool-page-heading shell">
    <RouterLink class="back-link" to="/tools/">← 全部工具</RouterLink
    ><span class="section-overline">{{ tool.category }} · TOOLBOX</span>
    <h1>{{ tool.title }}</h1>
    <p>{{ tool.description }}</p>
  </section>
  <section class="tool-workspace shell" :data-tool="slug" :aria-label="tool.title">
    <component :is="components[slug]" :key="slug" />
  </section>
  <aside class="other-tools shell" aria-label="其他工具">
    <h2>还可以用这些</h2>
    <div>
      <RouterLink
        v-for="other in tools.filter((t) => t.slug !== slug)"
        :key="other.slug"
        :to="`/tools/${other.slug}/`"
        >{{ other.title }} ↗</RouterLink
      >
    </div>
  </aside>
</template>
