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

export default {
  fetchList: getRegionList,
  createItem: createRegion,
  editItem: editRegion,
  deleteItem: deleteRegion,
}
