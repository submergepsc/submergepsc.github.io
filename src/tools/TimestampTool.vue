<script setup>
import { onMounted, ref } from 'vue'
import { epochMilliseconds } from './transforms.js'
import { useClipboard } from '../composables/useClipboard.js'
const epoch = ref(''),
  unit = ref('seconds'),
  date = ref(''),
  zone = ref('local'),
  dateOutput = ref(''),
  epochOutput = ref(''),
  localZone = ref(''),
  status = ref('在当前浏览器中转换。'),
  error = ref(false)
const { copy } = useClipboard()
onMounted(() => {
  localZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
})
function attempt(fn) {
  try {
    fn()
    error.value = false
    status.value = '转换完成。'
  } catch (e) {
    error.value = true
    status.value = e.message
  }
}
function toDate() {
  dateOutput.value = ''
  attempt(() => {
    const value = new Date(epochMilliseconds(epoch.value, unit.value))
    dateOutput.value = `UTC：${value.toISOString()}\n本地：${new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'long' }).format(value)}`
  })
}
function toEpoch() {
  epochOutput.value = ''
  attempt(() => {
    const parts = date.value.match(/^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (!parts) throw new Error('请输入完整日期，精度最多到秒。')
    const value = new Date(date.value + (zone.value === 'utc' ? 'Z' : ''))
    if (!Number.isFinite(value.getTime())) throw new Error('日期无效或超出范围。')
    const prefix = zone.value === 'utc' ? 'getUTC' : 'get'
    const actual = [
      value[`${prefix}FullYear`](),
      value[`${prefix}Month`]() + 1,
      value[`${prefix}Date`](),
      value[`${prefix}Hours`](),
      value[`${prefix}Minutes`](),
      value[`${prefix}Seconds`](),
    ]
    if (actual.some((n, i) => n !== Number(parts[i + 1] || 0)))
      throw new Error('日期不存在，或该本地时间处于夏令时跳过的区间。')
    epochOutput.value = `秒：${value.getTime() / 1000}\n毫秒：${value.getTime()}`
  })
}
async function copyValue(value) {
  if (!value) {
    status.value = '还没有可复制的结果。'
    return
  }
  error.value = !(await copy(value))
  status.value = error.value ? '请在结果框中选中并复制。' : '已复制到剪贴板。'
}
function now() {
  epoch.value = String(unit.value === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now())
  toDate()
}
function clear() {
  epoch.value = ''
  date.value = ''
  dateOutput.value = ''
  epochOutput.value = ''
  error.value = false
  status.value = '已清空。'
}
function fillExample() {
  epoch.value = '1700000000'
  date.value = '2023-11-14T22:13:20'
  zone.value = 'utc'
}
</script>
<template>
  <p class="tool-hint">
    明确选择秒或毫秒。秒支持最多三位小数，毫秒使用整数；支持 1970 年以前的负时间戳。
  </p>
  <div class="time-tool-grid">
    <section class="time-tool-panel" aria-labelledby="epoch-heading">
      <h2 id="epoch-heading">时间戳 → 日期</h2>
      <label for="epoch-input">Unix 时间戳</label>
      <div class="tool-input-row">
        <input
          id="epoch-input"
          v-model="epoch"
          type="text"
          inputmode="decimal"
          placeholder="1700000000"
          @keydown.enter="toDate"
        /><label class="sr-only" for="epoch-unit">时间戳单位</label
        ><select id="epoch-unit" v-model="unit">
          <option value="seconds">秒</option>
          <option value="milliseconds">毫秒</option>
        </select>
      </div>
      <div class="tool-actions">
        <button class="tool-button tool-button-primary" data-action="to-date" @click="toDate">
          转为日期</button
        ><button class="tool-button" data-action="now" @click="now">当前时间</button>
      </div>
      <div class="tool-editor">
        <label for="date-output">日期结果</label
        ><textarea id="date-output" :value="dateOutput" readonly rows="4" />
      </div>
      <button class="tool-button" data-action="copy-date" @click="copyValue(dateOutput)">
        复制日期
      </button>
    </section>
    <section class="time-tool-panel" aria-labelledby="date-heading">
      <h2 id="date-heading">日期 → 时间戳</h2>
      <label for="date-input">日期与时间</label
      ><input id="date-input" v-model="date" type="datetime-local" step="1" /><label for="date-zone"
        >以哪个时区解释输入</label
      ><select id="date-zone" v-model="zone">
        <option value="local">浏览器本地时区</option>
        <option value="utc">UTC</option>
      </select>
      <p id="local-zone" class="tool-zone">{{ localZone }}</p>
      <div class="tool-actions">
        <button class="tool-button tool-button-primary" data-action="to-epoch" @click="toEpoch">
          转为时间戳
        </button>
      </div>
      <div class="tool-editor">
        <label for="epoch-output">时间戳结果</label
        ><textarea id="epoch-output" :value="epochOutput" readonly rows="4" />
      </div>
      <button class="tool-button" data-action="copy-epoch" @click="copyValue(epochOutput)">
        复制时间戳
      </button>
    </section>
  </div>
  <div class="tool-actions">
    <button
      class="tool-button"
      data-action="example"
      @click="fillExample"
    >
      填入示例</button
    ><button class="tool-button tool-button-quiet" data-action="clear" @click="clear">清空</button>
  </div>
  <p
    id="tool-status"
    class="tool-status"
    :class="{ 'is-error': error }"
    role="status"
    aria-live="polite"
  >
    {{ status }}
  </p>
</template>
