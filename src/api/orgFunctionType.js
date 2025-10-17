import request from '@/utils/request'

export function getOrgFunctionTypeList(params = {}) {
  return request.get('/org-function-type/list', { params })
}

export function createOrgFunctionType(data) {
  return request.post('/org-function-type', data)
}

export function editOrgFunctionType(data) {
  return request.put('/org-function-type', data)
}

export function deleteOrgFunctionType(fid) {
  return request.delete(`/org-function-type/${fid}`)
}

export function getOrgFunctionTypeDetail(fid) {
  return request.get(`/org-function-type/${fid}`)
}

export default {
  fetchList: getOrgFunctionTypeList,
  createItem: createOrgFunctionType,
  editItem: editOrgFunctionType,
  deleteItem: deleteOrgFunctionType,
}
