import request from '@/utils/request'

export function getDepartmentList(params = {}) {
    return request.get('/dept-dim/list', { params })
}

export function createDepartment(data) {
    return request.post('/dept-dim', data)
}

export function editDepartment(data) {
    return request.put('/dept-dim', data)
}

export function deleteDepartment(fid) {
    return request.delete(`/dept-dim/${fid}`)
}

export function getDepartmentDetail(fid) {
    return request.get(`/dept-dim/${fid}`)
}
