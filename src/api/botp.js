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

export function getBotpExecutions(limit = 50) {
  return request.get('/botp/executions', { params: { limit } })
}

export function getBotpExecution(executionId) {
  return request.get(`/botp/executions/${encodeURIComponent(executionId)}`)
}

export function getBotpExecutionLogs(executionId) {
  return request.get(`/botp/executions/${encodeURIComponent(executionId)}/logs`)
}

export function resumeBotpExecution(executionId) {
  return request.post(`/botp/executions/${encodeURIComponent(executionId)}/resume`)
}

export function retryBotpExecutionWriteback(executionId) {
  return request.post(`/botp/executions/${encodeURIComponent(executionId)}/retry-writeback`)
}

export function getBotpRelations(params = {}) {
  return request.get('/botp/relations', { params })
}

export function postBotpTargetStatusEvent(payload) {
  return request.post('/botp/relations/target-events', payload)
}

export function invalidateBotpRelation(relationId, payload) {
  return request.post(`/botp/relations/${relationId}/invalidate`, payload)
}

export function recomputeBotpRelation(relationId) {
  return request.post(`/botp/relations/${relationId}/recompute`)
}

export function getBotpWritebackTasks(limit = 100) {
  return request.get('/botp/operations/writeback-tasks', { params: { limit } })
}

export function retryBotpWritebackTask(taskId) {
  return request.post(`/botp/operations/writeback-tasks/${taskId}/retry`)
}

export function getBotpReconciliationIssues(limit = 100) {
  return request.get('/botp/operations/reconciliation-issues', { params: { limit } })
}

export function runBotpReconciliation(limit = 500, autoFix = true) {
  return request.post('/botp/operations/reconciliation/run', null, { params: { limit, autoFix } })
}

export function fixBotpReconciliationIssue(issueId, payload = {}) {
  return request.post(`/botp/operations/reconciliation-issues/${issueId}/fix`, payload)
}

export function ignoreBotpReconciliationIssue(issueId, payload = {}) {
  return request.post(`/botp/operations/reconciliation-issues/${issueId}/ignore`, payload)
}
