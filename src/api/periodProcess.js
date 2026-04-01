import request from '@/utils/request'

export function getProfitLoss(params = {}) {
  return request.get('/period-process/profit-loss', { params })
}

export function getAutoTransfer(params = {}) {
  return request.get('/period-process/auto-transfer', { params })
}

export function getFxRevalue(params = {}) {
  return request.get('/period-process/fx-revalue', { params })
}

export function getVoucherAmortization(params = {}) {
  return request.get('/period-process/voucher-amortization', { params })
}

export function getCloseBooks(params = {}) {
  return request.get('/period-process/close-books', { params })
}

export function getMonitorCenter(params = {}) {
  return request.get('/period-process/monitor-center', { params })
}

export default {
  fetchProfitLoss: getProfitLoss,
  fetchAutoTransfer: getAutoTransfer,
  fetchFxRevalue: getFxRevalue,
  fetchVoucherAmortization: getVoucherAmortization,
  fetchCloseBooks: getCloseBooks,
  fetchMonitorCenter: getMonitorCenter,
}
