import request from '@/utils/request'

export function fetchBalanceSheet(params = {}) {
  return request.get('/balance-sheet', { params })
}

export function fetchBalanceSheetDrill(params = {}) {
  return request.get('/balance-sheet/drill', { params })
}

export function fetchProfitStatement(params = {}) {
  return request.get('/profit-statement', { params })
}

export function fetchCashFlow(params = {}) {
  return request.get('/cash-flow', { params })
}

export function fetchCashFlowQuery(params = {}) {
  return request.get('/cash-flow/query', { params })
}

export function fetchCashFlowSupplement(params = {}) {
  return request.get('/cash-flow/supplement', { params })
}

export default {
  fetchBalanceSheet,
  fetchBalanceSheetDrill,
  fetchProfitStatement,
  fetchCashFlow,
  fetchCashFlowQuery,
  fetchCashFlowSupplement,
}
