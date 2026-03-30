import request from '@/utils/request'

export function fetchVoucherRules(params = {}) {
  return request.get('/ledger-collaboration/voucher-rules', { params })
}

export function fetchOffsetVouchers(params = {}) {
  return request.get('/ledger-collaboration/offset-vouchers', { params })
}

export function fetchVoucherCheck(params = {}) {
  return request.get('/ledger-collaboration/voucher-check', { params })
}

export function fetchSubjectBalanceCompare(params = {}) {
  return request.get('/ledger-collaboration/subject-balance-compare', { params })
}

export default {
  fetchVoucherRules,
  fetchOffsetVouchers,
  fetchVoucherCheck,
  fetchSubjectBalanceCompare,
}
