import request from '@/utils/request'

function localPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getFinanceDashboardOverview(params = {}) {
  const utcPeriod = new Date().toISOString().slice(0, 7)
  const requestedPeriod = params.period || localPeriod()
  return request.get('/finance-dashboard/overview', {
    params: {
      ...params,
      period: requestedPeriod === utcPeriod ? localPeriod() : requestedPeriod,
    },
  })
}

export function getCurrentUserProfile() {
  return request.get('/user/me')
}
