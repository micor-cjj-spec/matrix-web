import request from '@/utils/request'

export function getBankInfoList(params = {}) {
  return request.get('/bank-info/list', { params })
}

export function createBankInfo(data) {
  return request.post('/bank-info', data)
}

export function editBankInfo(data) {
  return request.put('/bank-info', data)
}

export function deleteBankInfo(fid) {
  return request.delete(`/bank-info/${fid}`)
}

export function getBankInfoDetail(fid) {
  return request.get(`/bank-info/${fid}`)
}

export default {
  fetchList: getBankInfoList,
  createItem: createBankInfo,
  editItem: editBankInfo,
  deleteItem: deleteBankInfo,
}
