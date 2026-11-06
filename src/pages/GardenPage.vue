<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { entries, typeNames, stageNames } from '../data.js'
import EntryCard from '../components/EntryCard.vue'
import PageIntro from '../components/PageIntro.vue'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('漫步花园', '沿着主题与好奇心，浏览公开的技术实践与笔记。')
const route = useRoute(),
  router = useRouter(),
  ready = ref(false),
  expanded = ref(false)
onMounted(() => {
  ready.value = true
})
const keys = ['type', 'category', 'tag', 'topic', 'stage']
const filters = computed(() =>
  Object.fromEntries(
    keys.map((k) => [k, ready.value && typeof route.query[k] === 'string' ? route.query[k] : '']),
  ),
)
const categories = [...new Set(entries.map((e) => e.category))].sort()
const shown = computed(() =>
  entries.filter((e) =>
    keys.every(
      (k) =>
        !filters.value[k] ||
        (k === 'tag' ? e.tags.includes(filters.value[k]) : e[k] === filters.value[k]),
    ),
  ),
)
const hasFilters = computed(() => keys.some((k) => filters.value[k]))
const summary = computed(() =>
  [
    filters.value.tag && `标签「${filters.value.tag}」`,
    { tech: '技术实践', thinking: '阅读与思考', life: '日常生活' }[filters.value.topic],
    filters.value.category,
  ]
    .filter(Boolean)
    .join(' · '),
)
function select(key, value) {
  const query = { ...route.query }
  if (!value || value === 'all') delete query[key]
  else query[key] = value
  router.push({ path: '/garden/', query })
}
</script>
<template>
  <PageIntro
    eyebrow="WANDER AROUND · 花园索引"
    title="沿着好奇心，"
    accent="慢慢逛。"
    description="这里的记录会变化。有的已经整理成文章，有的还在生长。"
    ><div class="garden-stats">
      <span
        ><b>{{ String(entries.length).padStart(2, '0') }}</b> 则公开记录</span
      ><span
        ><b>{{ String(categories.length).padStart(2, '0') }}</b> 个主题角落</span
      ><span>✳ 随时可以回来补充</span>
    </div></PageIntro
  >
  <section class="garden-list shell" aria-label="笔记列表">
    <div class="filter-bar">
      <div class="filter-group" aria-label="内容类型">
        <button
          v-for="[key, label] in [['', '全部'], ...Object.entries(typeNames)]"
          :key="key"
          class="filter-chip"
          :class="{ 'is-selected': filters.type === key }"
          :aria-pressed="filters.type === key"
          :data-type="key || 'all'"
          @click="select('type', key)"
        >
          {{ label }}
        </button>
      </div>
      <button
        class="filter-toggle"
        :aria-expanded="expanded"
        aria-controls="category-filters"
        @click="expanded = !expanded"
      >
        筛选主题 ＋
      </button>
    </div>
    <div id="category-filters" class="category-filters" :hidden="!expanded">
      <button
        v-for="category in categories"
        :key="category"
        class="filter-chip"
        :class="{ 'is-selected': filters.category === category }"
        :aria-pressed="filters.category === category"
        @click="select('category', filters.category === category ? '' : category)"
      >
        {{ category }}
      </button>
    </div>
    <div class="garden-tools">
      <span id="filter-summary" role="status" aria-live="polite"
        >{{ summary ? summary + ' · ' : '' }}显示 {{ shown.length }} /
        {{ entries.length }} 则记录</span
      ><label for="stage-filter"
        >生长状态
        <select
          id="stage-filter"
          :value="filters.stage || 'all'"
          @change="select('stage', $event.target.value)"
        >
          <option value="all">全部</option>
          <option v-for="(label, value) in stageNames" :key="value" :value="value">
            {{ label }}
          </option>
        </select></label
      ><button v-if="hasFilters" class="reset-filters" @click="router.push('/garden/')">
        清除筛选 ×
      </button>
    </div>
    <div id="garden-grid" class="garden-grid">
      <EntryCard v-for="entry in shown" :key="entry.slug" :entry="entry" />
    </div>
    <div v-if="!shown.length" class="empty-filter">
      这个角落还没有公开笔记。试试其他筛选，或者过段时间再来看看。
    </div>
  </section>
</template>
