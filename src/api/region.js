import request from '@/utils/request'

export function getRegionList(params = {}) {
  return request.get('/region/list', { params })
}

export function createRegion(data) {
  return request.post('/region', data)
}

export function editRegion(data) {
  return request.put('/region', data)
}

export function deleteRegion(fid) {
  return request.delete(`/region/${fid}`)
}

export function getRegionDetail(fid) {
  return request.get(`/region/${fid}`)
}

export function submitRegion(fid) {
  return request.post(`/region/${fid}/submit`)
}

export function auditRegion(fid) {
  return request.post(`/region/${fid}/audit`)
}

export function rejectRegion(fid) {
  return request.post(`/region/${fid}/reject`)
}

export default {
  fetchList: getRegionList,
  createItem: createRegion,
  editItem: editRegion,
  submitItem: submitRegion,
  auditItem: auditRegion,
  rejectItem: rejectRegion,
  deleteItem: deleteRegion,
}
