<script setup>
import { ref } from 'vue'
import ToolEditor from '../components/ToolEditor.vue'
import { useToolState } from '../composables/useToolState.js'
import { encodeBase64, decodeBase64 } from './transforms.js'
const { input, output, status, error, run, copyResult, example, clear } = useToolState()
const variant = ref('standard')
const encode = () => run((text) => encodeBase64(text, variant.value))
const decode = () => run((text) => decodeBase64(text, variant.value))
</script>
<template>
  <ToolEditor
    v-model:input="input"
    v-model:output="output"
    :status="status"
    :error="error"
    hint="UTF-8 文本与 Base64 互转。支持中文与 emoji；URL 安全格式编码时省略尾部补位。"
    @run="encode"
    @copy="copyResult"
    @clear="clear"
    @example="example('你好，SubmergePSC 👋')"
    ><template #options
      ><div class="tool-options">
        <label for="base64-variant"
          >格式
          <select id="base64-variant" v-model="variant">
            <option value="standard">标准 Base64</option>
            <option value="url">URL 安全格式</option>
          </select></label
        >
      </div></template
    ><template #actions
      ><button class="tool-button tool-button-primary" data-action="encode" @click="encode">
        编码 →</button
      ><button class="tool-button" data-action="decode" @click="decode">← 解码</button></template
    ></ToolEditor
  >
</template>
