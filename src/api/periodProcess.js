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

export function getMonthEndWorkbench(params = {}) {
  return request.get('/period-process/month-end-workbench', { params })
}

export function createMonthEndBatch(data = {}) {
  return request.post('/month-end-check-batch', data)
}

export function listMonthEndBatches(params = {}) {
  return request.get('/month-end-check-batch/list', { params })
}

export function submitMonthEndBatch(fid, data = {}) {
  return request.post(`/month-end-check-batch/${fid}/submit`, data)
}

export function approveMonthEndBatch(fid, data = {}) {
  return request.post(`/month-end-check-batch/${fid}/approve`, data)
}

export default {
  fetchProfitLoss: getProfitLoss,
  fetchAutoTransfer: getAutoTransfer,
  fetchFxRevalue: getFxRevalue,
  fetchVoucherAmortization: getVoucherAmortization,
  fetchCloseBooks: getCloseBooks,
  fetchMonitorCenter: getMonitorCenter,
  fetchMonthEndWorkbench: getMonthEndWorkbench,
  createMonthEndBatch,
  listMonthEndBatches,
  submitMonthEndBatch,
  approveMonthEndBatch,
}
