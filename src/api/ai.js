import request from '@/utils/request'

const AI_STREAM_TIMEOUT = 60000

export function createConversation(data = {}) {
  return request.post('/ai/conversations', data)
}

export function getConversationMessages(conversationId) {
  return request.get(`/ai/conversations/${conversationId}/messages`)
}

export function chatWithAi(data) {
  return request.post('/ai/chat', data)
}

export function getAiConfigStatus() {
  return request.get('/ai/config/status')
}

export function submitAiFeedback(data) {
  return request.post('/ai/feedback', data)
}

export async function chatWithAiStream(data, handlers = {}) {
  const token = localStorage.getItem('token')
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), AI_STREAM_TIMEOUT)

  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal: controller.signal,
  })

  if (!response.ok || !response.body) {
    let message = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      message = errorData?.message || errorData?.error?.message || message
    } catch (e) {
      // ignore
    }
    const error = new Error(message)
    error.code = response.status
    throw error
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let currentEvent = 'message'

  const emitEvent = (eventName, rawData) => {
    if (!rawData) return
    let payload = rawData
    try {
      payload = JSON.parse(rawData)
    } catch (e) {
      payload = { message: rawData }
    }

    if (eventName === 'start') return handlers.onStart?.(payload)
    if (eventName === 'delta') return handlers.onDelta?.(payload)
    if (eventName === 'done') return handlers.onDone?.(payload)
    if (eventName === 'error') {
      handlers.onError?.(payload)
      const error = new Error(payload?.message || 'AI 服务暂不可用，请稍后重试。')
      error.code = payload?.code
      throw error
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        const lines = block.split('\n')
        let eventName = currentEvent
        let dataText = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim()
            currentEvent = eventName
          } else if (line.startsWith('data:')) {
            dataText += line.slice(5).trim()
          }
        }

        emitEvent(eventName, dataText)
      }
    }
  } finally {
    window.clearTimeout(timeoutId)
    reader.releaseLock()
  }
}
