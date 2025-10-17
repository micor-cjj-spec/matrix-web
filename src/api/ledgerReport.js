import request from '@/utils/request'

export function fetchSubjectBalance(params = {}) {
  return request.get('/ledger/subject-balance', { params })
}

export function fetchGeneralLedger(params = {}) {
  return request.get('/ledger/general-ledger', { params })
}

export function fetchDetailLedger(params = {}) {
  return request.get('/ledger/detail-ledger', { params })
}

export function fetchDailyReport(params = {}) {
  return request.get('/ledger/daily-report', { params })
}

export function fetchDimensionBalance(params = {}) {
  return request.get('/ledger/dimension-balance', { params })
}

export function fetchAuxDimensionBalance(params = {}) {
  return request.get('/ledger/aux-dimension-balance', { params })
}

export function fetchAuxGeneralLedger(params = {}) {
  return request.get('/ledger/aux-general-ledger', { params })
}

export function fetchAuxDetailLedger(params = {}) {
  return request.get('/ledger/aux-detail-ledger', { params })
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
