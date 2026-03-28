import request from '@/utils/request'

export function fetchList(params = {}) {
  return request.get('/report-template/list', { params })
}

export function fetchDetail(fid) {
  return request.get(`/report-template/${fid}`)
}

export function createItem(data) {
  return request.post('/report-template', data)
}

export function editItem(data) {
  return request.put('/report-template', data)
}

export function deleteItem(fid) {
  return request.delete(`/report-template/${fid}`)
}

export default {
  fetchList,
  fetchDetail,
  createItem,
  editItem,
  deleteItem,
}
