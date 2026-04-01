import request from '@/utils/request'

export function listVoucherTypes(params = {}) {
  return request.get('/voucher-type/list', { params })
}

export function getVoucherType(fid) {
  return request.get(`/voucher-type/${fid}`)
}

export function createVoucherType(data) {
  return request.post('/voucher-type', data)
}

export function updateVoucherType(data) {
  return request.put('/voucher-type', data)
}

export function deleteVoucherType(fid) {
  return request.delete(`/voucher-type/${fid}`)
}

export function enableVoucherType(fid) {
  return request.post(`/voucher-type/${fid}/enable`)
}

export function disableVoucherType(fid) {
  return request.post(`/voucher-type/${fid}/disable`)
}

export default {
  fetchList: listVoucherTypes,
  getItem: getVoucherType,
  createItem: createVoucherType,
  editItem: updateVoucherType,
  deleteItem: deleteVoucherType,
  enableItem: enableVoucherType,
  disableItem: disableVoucherType,
}
