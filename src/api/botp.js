import request from '@/utils/request'

export function getBotpRules() {
  return request.get('/botp/rules')
}

export function getBotpRule(ruleCode) {
  return request.get(`/botp/rules/${encodeURIComponent(ruleCode)}`)
}

export function getBotpRuleVersions(ruleCode) {
  return request.get(`/botp/rules/${encodeURIComponent(ruleCode)}/versions`)
}

export function createBotpRule(payload) {
  return request.post('/botp/rules', payload)
}

export function updateBotpRule(ruleCode, payload) {
  return request.put(`/botp/rules/${encodeURIComponent(ruleCode)}`, payload)
}

export function publishBotpRule(ruleCode) {
  return request.post(`/botp/rules/${encodeURIComponent(ruleCode)}/publish`)
}

export function previewBotpExecution(payload) {
  return request.post('/botp/executions/preview', payload)
}

export function executeBotp(payload) {
  return request.post('/botp/executions', payload)
}

export function getBotpExecution(executionId) {
  return request.get(`/botp/executions/${encodeURIComponent(executionId)}`)
}
