import request from '@/utils/request'

export function getCountryList(params = {}) {
  return request.get('/country/list', { params })
}

export function createCountry(data) {
  return request.post('/country', data)
}

export function editCountry(data) {
  return request.put('/country', data)
}

export function deleteCountry(fid) {
  return request.delete(`/country/${fid}`)
}

export function getCountryDetail(fid) {
  return request.get(`/country/${fid}`)
}

export function submitCountry(fid) {
  return request.post(`/country/${fid}/submit`)
}

export function auditCountry(fid) {
  return request.post(`/country/${fid}/audit`)
}

export function rejectCountry(fid) {
  return request.post(`/country/${fid}/reject`)
}

export default {
  fetchList: getCountryList,
  createItem: createCountry,
  editItem: editCountry,
  submitItem: submitCountry,
  auditItem: auditCountry,
  rejectItem: rejectCountry,
  deleteItem: deleteCountry,
}
