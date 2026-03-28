import request from '@/utils/request'

export function listReportItems(params = {}) {
  return request.get('/report-item/list', { params })
}

export function getReportItemDetail(fid) {
  return request.get(`/report-item/${fid}`)
}

export function createReportItem(data) {
  return request.post('/report-item', data)
}

export function editReportItem(data) {
  return request.put('/report-item', data)
}

export function deleteReportItem(fid) {
  return request.delete(`/report-item/${fid}`)
}

export default {
  listReportItems,
  getReportItemDetail,
  createReportItem,
  editReportItem,
  deleteReportItem,
}
