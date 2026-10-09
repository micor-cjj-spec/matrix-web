import request from '@/utils/request'

const BASE = '/shared-cloud'

export function listSharedTasks(params = {}) {
  return request.get(`${BASE}/tasks`, { params })
}

export function createSharedTask(data) {
  return request.post(`${BASE}/tasks`, data)
}

export function getSharedTask(id) {
  return request.get(`${BASE}/tasks/${encodeURIComponent(id)}`)
}

export function updateSharedTask(id, data) {
  return request.patch(`${BASE}/tasks/${encodeURIComponent(id)}`, data)
}

export function deleteSharedTask(id) {
  return request.delete(`${BASE}/tasks/${encodeURIComponent(id)}`)
}

export function transitionSharedTask(id, data) {
  return request.post(`${BASE}/tasks/${encodeURIComponent(id)}/transitions`, data)
}

export function listSharedTaskComments(id, params = {}) {
  return request.get(`${BASE}/tasks/${encodeURIComponent(id)}/comments`, { params })
}

export function addSharedTaskComment(id, data) {
  return request.post(`${BASE}/tasks/${encodeURIComponent(id)}/comments`, data)
}

export function getSharedTaskSla(id) {
  return request.get(`${BASE}/tasks/${encodeURIComponent(id)}/sla`)
}

export function getSharedOperationsSummary(params = {}) {
  return request.get(`${BASE}/report/summary`, { params })
}
