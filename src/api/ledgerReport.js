import request from '@/utils/request'

export function fetchSubjectBalance(params = {}) {
  return request.get('/period-process/ledger/subject-balance', { params })
}

export function fetchGeneralLedger(params = {}) {
  return request.get('/period-process/ledger/general-ledger', { params })
}

export function fetchDetailLedger(params = {}) {
  return request.get('/period-process/ledger/detail-ledger', { params })
}

export function fetchDailyReport(params = {}) {
  return request.get('/period-process/ledger/daily-report', { params })
}

export function fetchDimensionBalance(params = {}) {
  return request.get('/period-process/ledger/dimension-balance', { params })
}

export function fetchAuxDimensionBalance(params = {}) {
  return request.get('/period-process/ledger/aux-dimension-balance', { params })
}

export function fetchAuxGeneralLedger(params = {}) {
  return request.get('/period-process/ledger/aux-general-ledger', { params })
}

export function fetchAuxDetailLedger(params = {}) {
  return request.get('/period-process/ledger/aux-detail-ledger', { params })
}

export default {
  fetchSubjectBalance,
  fetchGeneralLedger,
  fetchDetailLedger,
  fetchDailyReport,
  fetchDimensionBalance,
  fetchAuxDimensionBalance,
  fetchAuxGeneralLedger,
  fetchAuxDetailLedger,
}
