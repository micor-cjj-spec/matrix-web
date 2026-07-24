import request from '@/utils/request'

export function getFinanceDashboardOverview(params = {}) {
  return request.get('/finance-dashboard/overview', { params })
}

export function getCurrentUserProfile() {
  return request.get('/user/me')
}
