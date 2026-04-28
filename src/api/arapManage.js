import request from '@/utils/request'

export function fetchWriteoffPlan(params = {}) {
  return request.get('/period-process/arap-manage/plan', { params })
}

export function executeAutoWriteoff(params = {}) {
  return request.post('/period-process/arap-manage/auto-writeoff', null, { params })
}

export function fetchCounterpartyStatement(params = {}) {
  return request.get('/period-process/arap-manage/statement', { params })
}

export function fetchCounterpartyAccountQuery(params = {}) {
  return request.get('/period-process/arap-manage/account-query', { params })
}

export function fetchWriteoffLog(params = {}) {
  return request.get('/period-process/arap-manage/writeoff-log', { params })
}

export function fetchAgingAnalysis(params = {}) {
  return request.get('/period-process/arap-manage/aging-analysis', { params })
}

export function fetchMultiAnalysis(params = {}) {
  return request.get('/period-process/arap-manage/multi-analysis', { params })
}

export default {
  fetchWriteoffPlan,
  executeAutoWriteoff,
  fetchCounterpartyStatement,
  fetchCounterpartyAccountQuery,
  fetchWriteoffLog,
  fetchAgingAnalysis,
  fetchMultiAnalysis,
}
