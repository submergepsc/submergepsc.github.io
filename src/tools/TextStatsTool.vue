<script setup>
import { computed } from 'vue'
import { useToolState } from '../composables/useToolState.js'
import { textStats, checkSize } from './transforms.js'
const { input, status, error, example, clear, output, copyResult } = useToolState()
const labels = [
  ['codepoints', '字符数（码点）'],
  ['graphemes', '字素（视觉字符）'],
  ['nonspace', '非空白字符'],
  ['lines', '行数（含空行）'],
  ['bytes', 'UTF-8 字节数'],
  ['words', '词段'],
]
const metrics = computed(() => {
  try {
    checkSize(input.value)
    return { values: textStats(input.value), error: '' }
  } catch (e) {
    return { values: {}, error: e.message }
  }
})
function copyStats() {
  output.value = labels
    .map(([key, label]) => `${label}：${metrics.value.values[key] ?? 0}`)
    .join('\n')
  copyResult()
}
</script>
<template>
  <p class="tool-hint">输入后实时统计。字素与词段按浏览器 Unicode 分段计算，末尾换行会增加一行。</p>
  <div class="tool-editor">
    <label for="tool-input">要统计的文本</label
    ><textarea
      id="tool-input"
      v-model="input"
      autocomplete="off"
      spellcheck="false"
      placeholder="粘贴文字，看看它由多少字符组成…"
    />
  </div>
  <dl class="tool-metrics">
    <div v-for="[key, label] in labels" :key="key">
      <dt>{{ label }}</dt>
      <dd :id="`metric-${key}`">{{ (metrics.values[key] ?? 0).toLocaleString('zh-CN') }}</dd>
    </div>
  </dl>
  <div class="tool-actions">
    <button class="tool-button" data-action="example" @click="example('Hello，世界 👩‍💻\n第二行。')">
      填入示例</button
    ><button class="tool-button" data-action="copy" @click="copyStats">复制统计</button
    ><button class="tool-button tool-button-quiet" data-action="clear" @click="clear">清空</button>
  </div>
  <p
    id="tool-status"
    class="tool-status"
    :class="{ 'is-error': metrics.error || error }"
    role="status"
    aria-live="polite"
  >
    {{ metrics.error || status }}
  </p>
</template>
