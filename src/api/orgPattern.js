import request from '@/utils/request'

export function getOrgPatternList(params = {}) {
  return request.get('/org-pattern/list', { params })
}

export function createOrgPattern(data) {
  return request.post('/org-pattern', data)
}

export function editOrgPattern(data) {
  return request.put('/org-pattern', data)
}

export function deleteOrgPattern(fid) {
  return request.delete(`/org-pattern/${fid}`)
}

export function getOrgPatternDetail(fid) {
  return request.get(`/org-pattern/${fid}`)
}

export default {
  fetchList: getOrgPatternList,
  createItem: createOrgPattern,
  editItem: editOrgPattern,
  deleteItem: deleteOrgPattern,
}
