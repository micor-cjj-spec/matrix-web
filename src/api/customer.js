import request from '@/utils/request'

export function getCustomerList(params = {}) {
  return request.get('/customer/list', { params })
}

export function createCustomer(data) {
  return request.post('/customer', data)
}

export function editCustomer(data) {
  return request.put('/customer', data)
}

export function deleteCustomer(fid) {
  return request.delete(`/customer/${fid}`)
}

export function getCustomerDetail(fid) {
  return request.get(`/customer/${fid}`)
}

export function submitCustomer(fid) {
  return request.post(`/customer/${fid}/submit`)
}

export function auditCustomer(fid) {
  return request.post(`/customer/${fid}/audit`)
}

export function rejectCustomer(fid) {
  return request.post(`/customer/${fid}/reject`)
}

export default {
  fetchList: getCustomerList,
  createItem: createCustomer,
  editItem: editCustomer,
  submitItem: submitCustomer,
  auditItem: auditCustomer,
  rejectItem: rejectCustomer,
  deleteItem: deleteCustomer,
}
