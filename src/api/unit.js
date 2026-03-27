import request from '@/utils/request'

export function getUnitList(params = {}) {
  return request.get('/unit/list', { params })
}

export function createUnit(data) {
  return request.post('/unit', data)
}

export function editUnit(data) {
  return request.put('/unit', data)
}

export function deleteUnit(fid) {
  return request.delete(`/unit/${fid}`)
}

export function getUnitDetail(fid) {
  return request.get(`/unit/${fid}`)
}

export function submitUnit(fid) {
  return request.post(`/unit/${fid}/submit`)
}

export function auditUnit(fid) {
  return request.post(`/unit/${fid}/audit`)
}

export function rejectUnit(fid) {
  return request.post(`/unit/${fid}/reject`)
}

export default {
  fetchList: getUnitList,
  createItem: createUnit,
  editItem: editUnit,
  submitItem: submitUnit,
  auditItem: auditUnit,
  rejectItem: rejectUnit,
  deleteItem: deleteUnit,
}
