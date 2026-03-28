import request from '@/utils/request'

export function listReportItems(params = {}) {
  return request.get('/report-item/list', { params })
}

export default {
  listReportItems,
}

