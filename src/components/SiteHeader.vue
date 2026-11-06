<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const open = ref(false),
  dark = ref(false)
const links = [
  ['/', '首页'],
  ['/garden/', '花园'],
  ['/projects/', '项目'],
  ['/tools/', '工具箱'],
  ['/journal/', '随记'],
  ['/about/', '关于'],
]
const active = (href) =>
  href === '/'
    ? route.path === '/'
    : route.path.startsWith(href) || (href === '/garden/' && route.path.startsWith('/articles/'))
function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
  try {
    localStorage.setItem('sp-theme', document.documentElement.dataset.theme)
  } catch {}
}
function close(event) {
  if (event.type === 'keydown' && event.key === 'Escape') open.value = false
  if (event.type === 'click' && !event.target.closest('.topbar')) open.value = false
}
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
onMounted(() => {
  dark.value = document.documentElement.dataset.theme === 'dark'
  document.addEventListener('keydown', close)
  document.addEventListener('click', close)
})
onUnmounted(() => {
  document.removeEventListener('keydown', close)
  document.removeEventListener('click', close)
})
</script>

<template>
  <header class="topbar">
    <div class="nav-wrap">
      <RouterLink class="brand" to="/"
        ><span class="brand-mark">s<span /></span
        ><span class="brand-word">SubmergePSC<small>digital garden</small></span></RouterLink
      >
      <nav class="main-nav" :class="{ 'nav-open': open }" aria-label="主导航">
        <RouterLink
          v-for="[href, label] in links"
          :key="href"
          :to="href"
          class="nav-link"
          :class="{ 'is-active': active(href) }"
          :aria-current="active(href) ? 'page' : undefined"
          >{{ label }}</RouterLink
        >
      </nav>
      <div class="nav-actions">
        <RouterLink class="search-link" to="/search/" aria-label="搜索">/</RouterLink>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="dark ? '切换到浅色主题' : '切换到深色主题'"
          @click="toggleTheme"
        >
          {{ dark ? '☾' : '☼' }}
        </button>
        <button
          class="menu-toggle"
          type="button"
          :aria-label="open ? '关闭导航' : '打开导航'"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span /><span /><span />
        </button>
      </div>
    </div>
  </header>
</template>
