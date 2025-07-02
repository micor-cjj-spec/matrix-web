import request from '@/utils/request'

export function fetchSimpleList(basePath, params = {}) {
    return request.get(`${basePath}/list`, { params })
}

export function createSimpleData(basePath, data) {
    return request.post(basePath, data)
}

export function editSimpleData(basePath, data) {
    return request.put(basePath, data)
}

export function deleteSimpleData(basePath, fid) {
    return request.delete(`${basePath}/${fid}`)
}

export function getSimpleDetail(basePath, fid) {
    return request.get(`${basePath}/${fid}`)
}
