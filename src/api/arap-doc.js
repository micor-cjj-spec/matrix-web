import request from '@/utils/request'

export function getArapDocList(params = {}) {
  return request.get('/arap-doc/list', { params })
}
export function createArapDoc(data) { return request.post('/arap-doc', data) }
export function editArapDoc(data) { return request.put('/arap-doc', data) }
export function deleteArapDoc(fid) { return request.delete(`/arap-doc/${fid}`) }
export function submitArapDoc(fid) { return request.post(`/arap-doc/submit/${fid}`) }
export function submitArapDocByNumber(number) { return request.post('/arap-doc/submit/by-number', null, { params: { number } }) }
export function auditArapDoc(fid) { return request.post(`/arap-doc/audit/${fid}`) }
export function auditArapDocByNumber(number) { return request.post('/arap-doc/audit/by-number', null, { params: { number } }) }
export function rejectArapDoc(fid) { return request.post(`/arap-doc/reject/${fid}`) }
export function rejectArapDocByNumber(number) { return request.post('/arap-doc/reject/by-number', null, { params: { number } }) }
export function generateVoucher(fid) { return request.post(`/arap-doc/voucher/${fid}`) }
export function generateVoucherByNumber(number) { return request.post('/arap-doc/voucher/by-number', null, { params: { number } }) }

export default {
  fetchList: getArapDocList,
  createItem: createArapDoc,
  editItem: editArapDoc,
  deleteItem: deleteArapDoc,
  submitItem: submitArapDoc,
  submitByNumber: submitArapDocByNumber,
  auditItem: auditArapDoc,
  auditByNumber: auditArapDocByNumber,
  rejectItem: rejectArapDoc,
  rejectByNumber: rejectArapDocByNumber,
  generateVoucher,
  generateVoucherByNumber,
}
