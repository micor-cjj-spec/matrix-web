import request from '@/utils/request'

export function getExchangeRateList(params = {}) {
  return request.get('/exchange-rate/list', { params })
}

export function createExchangeRate(data) {
  return request.post('/exchange-rate', data)
}

export function editExchangeRate(data) {
  return request.put('/exchange-rate', data)
}

export function deleteExchangeRate(fid) {
  return request.delete(`/exchange-rate/${fid}`)
}

export function getExchangeRateDetail(fid) {
  return request.get(`/exchange-rate/${fid}`)
}

export default {
  fetchList: getExchangeRateList,
  createItem: createExchangeRate,
  editItem: editExchangeRate,
  deleteItem: deleteExchangeRate,
}
