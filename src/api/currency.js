import request from '@/utils/request'

export function getCurrencyList(params = {}) {
  return request.get('/currency/list', { params })
}

export function createCurrency(data) {
  return request.post('/currency', data)
}

export function editCurrency(data) {
  return request.put('/currency', data)
}

export function deleteCurrency(fid) {
  return request.delete(`/currency/${fid}`)
}

export function getCurrencyDetail(fid) {
  return request.get(`/currency/${fid}`)
}

export default {
  fetchList: getCurrencyList,
  createItem: createCurrency,
  editItem: editCurrency,
  deleteItem: deleteCurrency,
}
