import request from '@/utils/request'

const EVALUATION_TIMEOUT = 120000
const EVALUATION_RUN_TIMEOUT = 300000

export function listEvaluationDatasets() {
  return request.get('/ai/admin/knowledge/evaluations/datasets', {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function createEvaluationDataset(data) {
  return request.post('/ai/admin/knowledge/evaluations/datasets', data, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function listEvaluationQuestions(datasetId) {
  return request.get(`/ai/admin/knowledge/evaluations/datasets/${datasetId}/questions`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function createEvaluationQuestion(datasetId, data) {
  return request.post(`/ai/admin/knowledge/evaluations/datasets/${datasetId}/questions`, data, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function runKnowledgeEvaluation(datasetId, topK = 5) {
  return request.post(
    `/ai/admin/knowledge/evaluations/datasets/${datasetId}/runs`,
    {},
    {
      params: { topK },
      timeout: EVALUATION_RUN_TIMEOUT,
    },
  )
}

export function getKnowledgeEvaluationRun(runId) {
  return request.get(`/ai/admin/knowledge/evaluations/runs/${runId}`, {
    timeout: EVALUATION_TIMEOUT,
  })
}

export function listKnowledgeEvaluationResults(runId) {
  return request.get(`/ai/admin/knowledge/evaluations/runs/${runId}/results`, {
    timeout: EVALUATION_TIMEOUT,
  })
}
