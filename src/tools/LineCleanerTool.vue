<script setup>
import { reactive } from 'vue'
import ToolEditor from '../components/ToolEditor.vue'
import { useToolState } from '../composables/useToolState.js'
import { cleanLines } from './transforms.js'
const { input, output, status, error, run, copyResult, example, clear } = useToolState()
const options = reactive({ trim: true, drop: true, ignoreCase: false, order: 'original' })
const clean = () => run((text) => cleanLines(text, options).text)
</script>
<template>
  <ToolEditor
    v-model:input="input"
    v-model:output="output"
    :status="status"
    :error="error"
    action-label="整理文本"
    hint="按行去重并保留第一次出现的内容；可选择去空白、去空行和自然排序。"
    @run="clean"
    @copy="copyResult"
    @clear="clear"
    @example="example(' apple \nbanana\napple\n\nBANANA\nitem10\nitem2')"
    ><template #options
      ><div class="tool-options tool-checkboxes">
        <label><input id="trim-lines" v-model="options.trim" type="checkbox" />去除首尾空白</label
        ><label><input id="drop-empty" v-model="options.drop" type="checkbox" />去除空行</label
        ><label
          ><input id="ignore-case" v-model="options.ignoreCase" type="checkbox" />忽略大小写</label
        ><label for="line-order"
          >顺序
          <select id="line-order" v-model="options.order">
            <option value="original">保留原顺序</option>
            <option value="asc">自然升序</option>
            <option value="desc">自然降序</option>
          </select></label
        >
      </div></template
    ></ToolEditor
  >
</template>
