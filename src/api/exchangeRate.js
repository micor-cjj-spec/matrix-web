import request from '@/utils/request'

export function getExchangeRateList(params = {}) {
  return request.get('/exchange-rate/list', { params })
}

export function createExchangeRate(data) {
  return request.post('/exchange-rate', data)
}

export function editExchangeRate(data) {
  return request.put('/exchange-rate', data)
}

export function deleteExchangeRate(fid) {
  return request.delete(`/exchange-rate/${fid}`)
}

export function getExchangeRateDetail(fid) {
  return request.get(`/exchange-rate/${fid}`)
}

export function submitExchangeRate(fid) {
  return request.post(`/exchange-rate/${fid}/submit`)
}

export function auditExchangeRate(fid) {
  return request.post(`/exchange-rate/${fid}/audit`)
}

export function rejectExchangeRate(fid) {
  return request.post(`/exchange-rate/${fid}/reject`)
}

export default {
  fetchList: getExchangeRateList,
  createItem: createExchangeRate,
  editItem: editExchangeRate,
  submitItem: submitExchangeRate,
  auditItem: auditExchangeRate,
  rejectItem: rejectExchangeRate,
  deleteItem: deleteExchangeRate,
}
