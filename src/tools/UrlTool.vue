<script setup>
import ToolEditor from '../components/ToolEditor.vue'
import { useToolState } from '../composables/useToolState.js'
const { input, output, status, error, run, copyResult, example, clear } = useToolState()
</script>
<template>
  <ToolEditor
    v-model:input="input"
    v-model:output="output"
    :status="status"
    :error="error"
    hint="针对单个 URL 参数值编码或解码；解码时加号 + 保持原样。"
    @run="run(encodeURIComponent)"
    @copy="copyResult"
    @clear="clear"
    @example="example('学习笔记 / hello + world?&=')"
    ><template #actions
      ><button
        class="tool-button tool-button-primary"
        data-action="encode"
        @click="run(encodeURIComponent)"
      >
        编码 →</button
      ><button class="tool-button" data-action="decode" @click="run(decodeURIComponent)">
        ← 解码
      </button></template
    ></ToolEditor
  >
</template>
