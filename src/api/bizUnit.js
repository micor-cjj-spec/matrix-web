import request from '@/utils/request'

export function getBusinessUnitList(params = {}) {
    return request.get('/biz-unit/list', { params })
}

export function createBusinessUnit(data) {
    return request.post('/biz-unit', data)
}

export function editBusinessUnit(data) {
    return request.put('/biz-unit', data)
}

export function deleteBusinessUnit(fid) {
    return request.delete(`/biz-unit/${fid}`)
}

export function getBusinessUnitDetail(fid) {
    return request.get(`/biz-unit/${fid}`)
}
