<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageIntro from '../components/PageIntro.vue'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('搜索花园', '全文搜索公开笔记和在线工具。', { noindex: true })
const query = ref(''),
  index = ref(null),
  error = ref(false),
  loading = ref(false)
const route = useRoute(),
  router = useRouter()
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase()
const results = computed(() => {
  const terms = normalize(query.value.trim()).split(/\s+/).filter(Boolean)
  if (!terms.length || !index.value) return []
  return index.value
    .map((item) => {
      const haystack = normalize(
        [item.title, item.summary, item.category, ...item.tags, item.text].join(' '),
      )
      return {
        item,
        match: terms.every((t) => haystack.includes(t)),
        score: terms.reduce(
          (n, t) =>
            n +
            (normalize(item.title).includes(t) ? 3 : 0) +
            (normalize(item.tags.join(' ')).includes(t) ? 1 : 0),
          0,
        ),
      }
    })
    .filter((r) => r.match)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item)
})
let request
async function load() {
  if (index.value || request) return request
  loading.value = true
  error.value = false
  request = fetch('/search-index.json')
    .then((r) => {
      if (!r.ok) throw new Error('搜索索引不可用')
      return r.json()
    })
    .then((data) => {
      index.value = data
    })
    .catch(() => {
      error.value = true
    })
    .finally(() => {
      loading.value = false
      request = null
    })
  return request
}
watch(query, (value) => {
  router.replace({ path: '/search/', query: value.trim() ? { q: value } : {} })
  if (value.trim()) load()
})
watch(
  () => route.query.q,
  (value) => {
    if (typeof value === 'string' && value !== query.value) query.value = value
    else if (!value) query.value = ''
  },
)
onMounted(() => {
  query.value = typeof route.query.q === 'string' ? route.query.q : ''
})
</script>
<template>
  <PageIntro
    eyebrow="FIND A PATH"
    title="在花园里"
    accent="找一找。"
    description="搜索全文、标题与标签。多个关键词用空格分开。"
  >
    <form id="search-form" class="search-form" @submit.prevent="load">
      <label class="sr-only" for="search-input">搜索花园</label
      ><input
        id="search-input"
        v-model="query"
        type="search"
        placeholder="试试 Markdown、Obsidian、Agent…"
      /><button class="button button-dark">搜索 ↗</button>
    </form>
    <p id="search-hint" class="search-hint" role="status" aria-live="polite">
      {{
        !query.trim()
          ? '输入关键词开始搜索。'
          : loading
            ? '正在搜索公开笔记…'
            : error
              ? '搜索暂时不可用，请稍后重试。'
              : results.length
                ? `找到 ${results.length} 则记录。`
                : '还没有找到相关记录，试试其他关键词。'
      }}
    </p>
    <div id="search-results" class="search-results" aria-label="搜索结果">
      <RouterLink v-for="item in results" :key="item.href" class="search-result" :to="item.href"
        ><span>{{ item.category }} · {{ item.date }}</span
        ><strong>{{ item.title }}</strong>
        <p>{{ item.summary }}</p></RouterLink
      >
    </div>
  </PageIntro>
</template>
