import request from '@/utils/request'

export function fetchCounterpartyNotices(params = {}) {
  return request.get('/internal-notice/counterparty', { params })
}

export function generateCounterpartyNotices(params = {}) {
  return request.post('/internal-notice/counterparty/generate', null, { params })
}

export function fetchCounterpartyNoticeReconcile(params = {}) {
  return request.get('/internal-notice/counterparty/reconcile', { params })
}

export function fetchCashflowNotices(params = {}) {
  return request.get('/internal-notice/cashflow', { params })
}

export function generateCashflowNotices(params = {}) {
  return request.post('/internal-notice/cashflow/generate', null, { params })
}

export function fetchCashflowNoticeReconcile(params = {}) {
  return request.get('/internal-notice/cashflow/reconcile', { params })
}

export default {
  fetchCounterpartyNotices,
  generateCounterpartyNotices,
  fetchCounterpartyNoticeReconcile,
  fetchCashflowNotices,
  generateCashflowNotices,
  fetchCashflowNoticeReconcile,
}
