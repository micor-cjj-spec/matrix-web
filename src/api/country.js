import request from '@/utils/request'

export function getCountryList(params = {}) {
  return request.get('/country/list', { params })
}

export function createCountry(data) {
  return request.post('/country', data)
}

export function editCountry(data) {
  return request.put('/country', data)
}

export function deleteCountry(fid) {
  return request.delete(`/country/${fid}`)
}

export function getCountryDetail(fid) {
  return request.get(`/country/${fid}`)
}

export default {
  fetchList: getCountryList,
  createItem: createCountry,
  editItem: editCountry,
  deleteItem: deleteCountry,
}
