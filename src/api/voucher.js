import request from '@/utils/request'

export function getVoucherList(params = {}) {
  return request.get('/voucher/list', { params })
}

export function createVoucher(data) {
  return request.post('/voucher', data)
}

export function editVoucher(data) {
  return request.put('/voucher', data)
}

export default {
  fetchList: getVoucherList,
  createItem: createVoucher,
  editItem: editVoucher,
}
