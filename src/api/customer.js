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

export default {
  fetchList: getCustomerList,
  createItem: createCustomer,
  editItem: editCustomer,
  deleteItem: deleteCustomer,
}
