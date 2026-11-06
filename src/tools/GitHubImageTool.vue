<script setup>
import { ref } from 'vue'
import ToolEditor from '../components/ToolEditor.vue'
import { useToolState } from '../composables/useToolState.js'
import { convertGithubImages } from './transforms.js'
const { input, output, status, error, run, copyResult, example, clear } = useToolState()
const target = ref('raw'),
  format = ref('url'),
  alt = ref(''),
  override = ref('')
const convert = () =>
  run((text) =>
    convertGithubImages(text, {
      target: target.value,
      format: format.value,
      alt: alt.value,
      override: override.value,
    }),
  )
</script>
<template>
  <ToolEditor
    v-model:input="input"
    v-model:output="output"
    :status="status"
    :error="error"
    action-label="生成图片链接"
    hint="每行一个 GitHub 图片文件链接，可输出 raw 或 jsDelivr 地址。只转换地址，不上传图片或检查图片是否存在；需要公开仓库。"
    @run="convert"
    @copy="copyResult"
    @clear="clear"
    @example="example('https://github.com/submergepsc/moonbit/blob/main/image.png')"
    ><template #options
      ><div class="tool-options github-image-options">
        <label for="image-host"
          >链接类型
          <select id="image-host" v-model="target">
            <option value="raw">GitHub 原图（raw）</option>
            <option value="jsdelivr">jsDelivr CDN</option>
          </select></label
        ><label for="image-format"
          >输出格式
          <select id="image-format" v-model="format">
            <option value="url">图片链接</option>
            <option value="markdown">Markdown 图片</option>
            <option value="html">HTML 图片</option>
          </select></label
        ><label for="image-alt"
          >图片说明
          <input id="image-alt" v-model.trim="alt" type="text" placeholder="留空使用文件名"
        /></label>
      </div>
      <details class="github-image-advanced">
        <summary>分支或标签名包含 /</summary>
        <label for="image-ref">完整分支或标签名（可选）</label
        ><input
          id="image-ref"
          v-model.trim="override"
          type="text"
          placeholder="例如 feature/images"
        />
        <p>只有分支或标签名含 / 时需要填写。批量转换时，所有链接应使用这个分支或标签。</p>
      </details></template
    ></ToolEditor
  >
</template>
