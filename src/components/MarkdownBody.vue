<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClipboard } from '../composables/useClipboard.js'
defineProps({ html: { type: String, required: true } })
const router = useRouter(),
  { copy } = useClipboard(),
  message = ref('')
async function onClick(event) {
  const button = event.target.closest('[data-copy-code]')
  if (button) {
    message.value = (await copy(button.parentElement.querySelector('code').textContent))
      ? '代码已复制'
      : '无法自动复制，请选中代码复制'
    return
  }
  const a = event.target.closest('a[href]')
  if (
    !a ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0 ||
    a.target ||
    a.hasAttribute('download')
  )
    return
  const href = a.getAttribute('href')
  if (href.startsWith('/') && !href.startsWith('//')) {
    event.preventDefault()
    router.push(href)
  }
}
</script>
<template>
  <div class="markdown-content" @click="onClick" v-html="html" />
  <span class="sr-only" role="status">{{ message }}</span>
</template>
