import request from '@/utils/request'

export function getMaterialList(params = {}) {
  return request.get('/material/list', { params })
}

export function createMaterial(data) {
  return request.post('/material', data)
}

export function editMaterial(data) {
  return request.put('/material', data)
}

export function deleteMaterial(fid) {
  return request.delete(`/material/${fid}`)
}

export function getMaterialDetail(fid) {
  return request.get(`/material/${fid}`)
}

export function submitMaterial(fid) {
  return request.post(`/material/${fid}/submit`)
}

export function auditMaterial(fid) {
  return request.post(`/material/${fid}/audit`)
}

export function rejectMaterial(fid) {
  return request.post(`/material/${fid}/reject`)
}

export default {
  fetchList: getMaterialList,
  createItem: createMaterial,
  editItem: editMaterial,
  submitItem: submitMaterial,
  auditItem: auditMaterial,
  rejectItem: rejectMaterial,
  deleteItem: deleteMaterial,
}
