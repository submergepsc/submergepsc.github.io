import { ref } from 'vue'

export function useClipboard() {
  const copied = ref(false)
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      return true
    } catch {
      copied.value = false
      return false
    }
  }
  return { copy, copied }
}
