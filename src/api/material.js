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

export default {
  fetchList: getMaterialList,
  createItem: createMaterial,
  editItem: editMaterial,
  deleteItem: deleteMaterial,
}
