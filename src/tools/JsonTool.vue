<script setup>
import { ref } from 'vue'
import ToolEditor from '../components/ToolEditor.vue'
import { useToolState } from '../composables/useToolState.js'
import { jsonFormat } from './transforms.js'
const { input, output, status, error, run, copyResult, example, clear } = useToolState()
const indent = ref(2)
const sample = '{"site":"SubmergePSC","hello":"世界","large":9007199254740993}'
const format = (compact = false) => run((text) => jsonFormat(text, compact, indent.value))
</script>
<template>
  <ToolEditor
    v-model:input="input"
    v-model:output="output"
    :status="status"
    :error="error"
    hint="校验、格式化与压缩 JSON，保留大整数、重复键和数字原始表示。支持最多 256 层嵌套。"
    @run="format()"
    @copy="copyResult"
    @clear="clear"
    @example="example(sample)"
    ><template #options
      ><div class="tool-options">
        <label for="json-indent"
          >缩进
          <select id="json-indent" v-model.number="indent">
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
          </select></label
        >
      </div></template
    ><template #actions
      ><button class="tool-button tool-button-primary" data-action="format" @click="format()">
        格式化</button
      ><button class="tool-button" data-action="minify" @click="format(true)">
        压缩
      </button></template
    ></ToolEditor
  >
</template>
