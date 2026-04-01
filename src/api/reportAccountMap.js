import request from '@/utils/request'

export function listReportAccountMaps(params = {}) {
  return request.get('/report-account-map/list', { params })
}

export function getReportAccountMap(fid) {
  return request.get(`/report-account-map/${fid}`)
}

export function createReportAccountMap(data) {
  return request.post('/report-account-map', data)
}

export function updateReportAccountMap(data) {
  return request.put('/report-account-map', data)
}

export function deleteReportAccountMap(fid) {
  return request.delete(`/report-account-map/${fid}`)
}

export default {
  fetchList: listReportAccountMaps,
  getItem: getReportAccountMap,
  createItem: createReportAccountMap,
  editItem: updateReportAccountMap,
  deleteItem: deleteReportAccountMap,
}
