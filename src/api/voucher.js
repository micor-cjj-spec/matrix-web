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

export function deleteVoucher(fid) {
  return request.delete(`/voucher/${fid}`)
}

export function submitVoucher(fid) {
  return request.post(`/voucher/submit/${fid}`)
}

export function auditVoucher(fid) {
  return request.post(`/voucher/audit/${fid}`)
}

export function postVoucher(fid) {
  return request.post(`/voucher/post/${fid}`)
}

export function rejectVoucher(fid) {
  return request.post(`/voucher/reject/${fid}`)
}

export function reverseVoucher(fid) {
  return request.post(`/voucher/reverse/${fid}`)
}

export function getVoucherLines(fid) {
  return request.get(`/voucher/${fid}/lines`)
}

export function saveVoucherLines(fid, lines = []) {
  return request.put(`/voucher/${fid}/lines`, lines)
}

export default {
  fetchList: getVoucherList,
  createItem: createVoucher,
  editItem: editVoucher,
  deleteItem: deleteVoucher,
  submitItem: submitVoucher,
  auditItem: auditVoucher,
  postItem: postVoucher,
  rejectItem: rejectVoucher,
  reverseItem: reverseVoucher,
  fetchLines: getVoucherLines,
  saveLines: saveVoucherLines,
}
