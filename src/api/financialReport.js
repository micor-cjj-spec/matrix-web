import request from '@/utils/request'

export function fetchBalanceSheet(params = {}) {
  return request.get('/balance-sheet', { params })
}

export function fetchProfitStatement(params = {}) {
  return request.get('/profit-statement', { params })
}

export function fetchCashFlow(params = {}) {
  return request.get('/cash-flow', { params })
}

export default {
  fetchBalanceSheet,
  fetchProfitStatement,
  fetchCashFlow,
}
