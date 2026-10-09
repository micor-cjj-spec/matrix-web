import request from '@/utils/request'

export function listOpeningSubjects(params = {}) {
  return request.get('/period-process/opening-subject/list', { params })
}

export function createOpeningSubject(data) {
  return request.post('/period-process/opening-subject', data)
}

export function updateOpeningSubject(data) {
  return request.put('/period-process/opening-subject', data)
}

export function deleteOpeningSubject(fid) {
  return request.delete(`/period-process/opening-subject/${fid}`)
}

export function listOpeningCashflows(params = {}) {
  return request.get('/period-process/opening-cashflow/list', { params })
}

export function createOpeningCashflow(data) {
  return request.post('/period-process/opening-cashflow', data)
}

export function updateOpeningCashflow(data) {
  return request.put('/period-process/opening-cashflow', data)
}

export function deleteOpeningCashflow(fid) {
  return request.delete(`/period-process/opening-cashflow/${fid}`)
}

export function listOpeningCounterparties(params = {}) {
  return request.get('/period-process/opening-counterparty/list', { params })
}

export function createOpeningCounterparty(data) {
  return request.post('/period-process/opening-counterparty', data)
}

export function updateOpeningCounterparty(data) {
  return request.put('/period-process/opening-counterparty', data)
}

export function deleteOpeningCounterparty(fid) {
  return request.delete(`/period-process/opening-counterparty/${fid}`)
}

export default {
  listOpeningSubjects,
  createOpeningSubject,
  updateOpeningSubject,
  deleteOpeningSubject,
  listOpeningCashflows,
  createOpeningCashflow,
  updateOpeningCashflow,
  deleteOpeningCashflow,
  listOpeningCounterparties,
  createOpeningCounterparty,
  updateOpeningCounterparty,
  deleteOpeningCounterparty,
}
