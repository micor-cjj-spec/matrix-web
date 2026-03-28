import request from '@/utils/request'

export function listReportTemplates(params = {}) {
  return request.get('/report-template/list', { params })
}

export default {
  fetchList: listReportTemplates,
}
