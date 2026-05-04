import request from '@/utils/request'

export function fetchFinanceFoundationHealth(params = {}) {
  return request.get('/data-health-check/finance-foundation', { params })
}

export default {
  fetchFinanceFoundationHealth,
}
