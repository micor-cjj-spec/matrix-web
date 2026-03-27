import request from '@/utils/request'

export function getSupplierList(params = {}) {
  return request.get('/supplier/list', { params })
}

export function createSupplier(data) {
  return request.post('/supplier', data)
}

export function editSupplier(data) {
  return request.put('/supplier', data)
}

export function deleteSupplier(fid) {
  return request.delete(`/supplier/${fid}`)
}

export function getSupplierDetail(fid) {
  return request.get(`/supplier/${fid}`)
}

export function submitSupplier(fid) {
  return request.post(`/supplier/${fid}/submit`)
}

export function auditSupplier(fid) {
  return request.post(`/supplier/${fid}/audit`)
}

export function rejectSupplier(fid) {
  return request.post(`/supplier/${fid}/reject`)
}

export default {
  fetchList: getSupplierList,
  createItem: createSupplier,
  editItem: editSupplier,
  submitItem: submitSupplier,
  auditItem: auditSupplier,
  rejectItem: rejectSupplier,
  deleteItem: deleteSupplier,
}
