import request from '@/utils/request'

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
