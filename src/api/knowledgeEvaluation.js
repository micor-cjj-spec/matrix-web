import request from '@/utils/request'

const EVALUATION_TIMEOUT = 60000

export function getRagEvaluationConfig() {
  return request.get('/ai/knowledge/evaluation/config', {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function listRagEvaluationSets(kbId) {
  return request.get('/ai/knowledge/evaluation/sets', {
    params: { kbId },
    timeout: EVALUATION_TIMEOUT,
  })
}

export function createRagEvaluationSet(kbId, data) {
  return request.post('/ai/knowledge/evaluation/sets', data, {
    params: { kbId },
    timeout: EVALUATION_TIMEOUT,
  })
}

export function updateRagEvaluationSet(setId, data) {
  return request.put(`/ai/knowledge/evaluation/sets/${setId}`, data, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function deleteRagEvaluationSet(setId) {
  return request.delete(`/ai/knowledge/evaluation/sets/${setId}`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function listRagEvaluationCases(setId) {
  return request.get(`/ai/knowledge/evaluation/sets/${setId}/cases`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function createRagEvaluationCase(setId, data) {
  return request.post(`/ai/knowledge/evaluation/sets/${setId}/cases`, data, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function updateRagEvaluationCase(setId, caseId, data) {
  return request.put(`/ai/knowledge/evaluation/sets/${setId}/cases/${caseId}`, data, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function deleteRagEvaluationCase(setId, caseId) {
  return request.delete(`/ai/knowledge/evaluation/sets/${setId}/cases/${caseId}`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function listRagEvaluationRuns(setId, limit = 30) {
  return request.get(`/ai/knowledge/evaluation/sets/${setId}/runs`, {
    params: { limit },
    timeout: EVALUATION_TIMEOUT,
  })
}

export function createRagEvaluationRun(setId) {
  return request.post(`/ai/knowledge/evaluation/sets/${setId}/runs`, {}, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function getRagEvaluationRun(runId) {
  return request.get(`/ai/knowledge/evaluation/runs/${runId}`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function listRagEvaluationResults(runId) {
  return request.get(`/ai/knowledge/evaluation/runs/${runId}/results`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function retryRagEvaluationRun(runId) {
  return request.post(`/ai/knowledge/evaluation/runs/${runId}/retry`, {}, {
    timeout: EVALUATION_TIMEOUT,
  })
}
