import { ref } from 'vue'

// 通用“提交审核”能力，可后续替换为真实后端接口
export function useReviewActions() {
  const submitting = ref(false)

  const submitOne = async (item) => {
    submitting.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      return { ok: true, item }
    } finally {
      submitting.value = false
    }
  }

  const submitBatch = async (items = []) => {
    submitting.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      return { ok: true, count: items.length }
    } finally {
      submitting.value = false
    }
  }

  return { submitting, submitOne, submitBatch }
}
