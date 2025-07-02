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

export default {
  fetchList: getUnitList,
  createItem: createUnit,
  editItem: editUnit,
  deleteItem: deleteUnit,
}
