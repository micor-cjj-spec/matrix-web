import request from '@/utils/request'

export function getCurrencyList(params = {}) {
  return request.get('/currency/list', { params })
}

export function createCurrency(data) {
  return request.post('/currency', data)
}

export function editCurrency(data) {
  return request.put('/currency', data)
}

export function deleteCurrency(fid) {
  return request.delete(`/currency/${fid}`)
}

export function getCurrencyDetail(fid) {
  return request.get(`/currency/${fid}`)
}

export function submitCurrency(fid) {
  return request.post(`/currency/${fid}/submit`)
}

export function auditCurrency(fid) {
  return request.post(`/currency/${fid}/audit`)
}

export function rejectCurrency(fid) {
  return request.post(`/currency/${fid}/reject`)
}

export default {
  fetchList: getCurrencyList,
  createItem: createCurrency,
  editItem: editCurrency,
  submitItem: submitCurrency,
  auditItem: auditCurrency,
  rejectItem: rejectCurrency,
  deleteItem: deleteCurrency,
}
