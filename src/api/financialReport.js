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

export default {
  fetchBalanceSheet,
  fetchBalanceSheetDrill,
  fetchProfitStatement,
  fetchCashFlow,
}
