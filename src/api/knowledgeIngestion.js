import request from '@/utils/request'

const INGESTION_TIMEOUT = 120000

export function getKnowledgeIngestionConfig() {
  return request.get('/ai/knowledge/ingestion/config', {
    timeout: INGESTION_TIMEOUT,
  })
}

export function importKnowledgeFile(formData) {
  return request.post('/ai/knowledge/import', formData, {
    timeout: INGESTION_TIMEOUT,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function listKnowledgeIndexJobs(params = {}) {
  return request.get('/ai/knowledge/index-jobs', {
    params,
    timeout: INGESTION_TIMEOUT,
  })
}

export function retryKnowledgeIndexJob(jobId) {
  return request.post(`/ai/knowledge/index-jobs/${jobId}/retry`, {}, {
    timeout: INGESTION_TIMEOUT,
  })
}

export function enqueueKnowledgeIndexJob(docId) {
  return request.post(`/ai/knowledge/docs/${docId}/index-jobs`, {}, {
    timeout: INGESTION_TIMEOUT,
  })
}
