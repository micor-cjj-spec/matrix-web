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

export default {
  fetchList: getSupplierList,
  createItem: createSupplier,
  editItem: editSupplier,
  deleteItem: deleteSupplier,
}
