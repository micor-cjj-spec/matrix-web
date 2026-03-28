import request from '@/utils/request'

export function listCashflowItems(params = {}) {
  return request.get('/cashflow-item/list', { params })
}

export function getCashflowItem(fid) {
  return request.get(`/cashflow-item/${fid}`)
}

export function createCashflowItem(data) {
  return request.post('/cashflow-item', data)
}

export function updateCashflowItem(data) {
  return request.put('/cashflow-item', data)
}

export function deleteCashflowItem(fid) {
  return request.delete(`/cashflow-item/${fid}`)
}

export default {
  fetchList: listCashflowItems,
  getItem: getCashflowItem,
  createItem: createCashflowItem,
  editItem: updateCashflowItem,
  deleteItem: deleteCashflowItem,
}
