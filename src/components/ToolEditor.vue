<script setup>
const input = defineModel('input', { type: String, default: '' })
const output = defineModel('output', { type: String, default: '' })
defineProps({
  hint: String,
  status: String,
  error: Boolean,
  placeholder: String,
  actionLabel: { type: String, default: '转换' },
})
const emit = defineEmits(['run', 'copy', 'example', 'clear'])
function shortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    emit('run')
  }
}
</script>
<template>
  <div @keydown="shortcut">
    <p class="tool-hint">{{ hint }}</p>
    <slot name="options" />
    <div class="tool-editors">
      <div class="tool-editor">
        <label for="tool-input">输入内容</label
        ><textarea
          id="tool-input"
          v-model="input"
          autocomplete="off"
          spellcheck="false"
          :placeholder="placeholder || '在这里粘贴要处理的内容…'"
        />
      </div>
      <div class="tool-editor">
        <label for="tool-output">处理结果</label
        ><textarea
          id="tool-output"
          :value="output"
          readonly
          spellcheck="false"
          placeholder="结果会显示在这里"
        />
      </div>
    </div>
    <div class="tool-actions">
      <slot name="actions"
        ><button
          class="tool-button tool-button-primary"
          type="button"
          data-action="convert"
          @click="emit('run')"
        >
          {{ actionLabel }}
        </button></slot
      ><button class="tool-button" type="button" data-action="copy" @click="emit('copy')">
        复制结果</button
      ><button class="tool-button" type="button" data-action="example" @click="emit('example')">
        填入示例</button
      ><button
        class="tool-button tool-button-quiet"
        type="button"
        data-action="clear"
        @click="emit('clear')"
      >
        清空
      </button>
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
  </div>
</template>
