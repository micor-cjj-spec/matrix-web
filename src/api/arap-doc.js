import request from '@/utils/request'

export function getArapDocList(params = {}) {
  return request.get('/arap-doc/list', { params })
}
export function createArapDoc(data) { return request.post('/arap-doc', data) }
export function editArapDoc(data) { return request.put('/arap-doc', data) }
export function deleteArapDoc(fid) { return request.delete(`/arap-doc/${fid}`) }
export function submitArapDoc(fid) { return request.post(`/arap-doc/submit/${fid}`) }
export function auditArapDoc(fid) { return request.post(`/arap-doc/audit/${fid}`) }
export function rejectArapDoc(fid) { return request.post(`/arap-doc/reject/${fid}`) }
export function generateVoucher(fid) { return request.post(`/arap-doc/voucher/${fid}`) }

export default {
  fetchList: getArapDocList,
  createItem: createArapDoc,
  editItem: editArapDoc,
  deleteItem: deleteArapDoc,
  submitItem: submitArapDoc,
  auditItem: auditArapDoc,
  rejectItem: rejectArapDoc,
  generateVoucher,
}
