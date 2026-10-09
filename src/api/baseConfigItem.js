import request from '@/utils/request'

export function listBaseConfigItems(params = {}) {
  return request.get('/base-config-item/list', { params })
}

export function getBaseConfigItem(fid) {
  return request.get(`/base-config-item/${fid}`)
}

export function createBaseConfigItem(data) {
  return request.post('/base-config-item', data)
}

export function updateBaseConfigItem(data) {
  return request.put('/base-config-item', data)
}

export function deleteBaseConfigItem(fid) {
  return request.delete(`/base-config-item/${fid}`)
}

export default {
  fetchList: listBaseConfigItems,
  getItem: getBaseConfigItem,
  createItem: createBaseConfigItem,
  editItem: updateBaseConfigItem,
  deleteItem: deleteBaseConfigItem,
}
