import { ref } from 'vue'
import { checkSize } from '../tools/transforms.js'
import { useClipboard } from './useClipboard.js'
export function useToolState() {
  const input = ref(''),
    output = ref(''),
    status = ref('在当前浏览器处理，不上传输入内容。'),
    error = ref(false)
  const { copy } = useClipboard()
  function run(transform) {
    try {
      checkSize(input.value)
      output.value = transform(input.value)
      status.value = '处理完成。'
      error.value = false
    } catch (e) {
      output.value = ''
      status.value = e.message
      error.value = true
    }
  }
  function example(text) {
    input.value = text
    output.value = ''
    error.value = false
    status.value = '已填入示例。'
  }
  function clear() {
    input.value = ''
    output.value = ''
    error.value = false
    status.value = '已清空。'
  }
  async function copyResult() {
    if (!output.value) {
      status.value = '还没有可复制的结果。'
      return
    }
    error.value = !(await copy(output.value))
    status.value = error.value ? '无法自动复制，请在结果框中选中并复制。' : '已复制到剪贴板。'
  }
  return { input, output, status, error, run, example, clear, copyResult }
}
