import request from '@/utils/request'

export function getAccountSubjectList(params = {}) {
    return request.get('/account-subject/list', { params })
}

export function getAccountSubjectDetail(fid) {
    return request.get(`/account-subject/${fid}`)
}

export function createAccountSubject(data) {
    return request.post('/account-subject', data)
}

export function editAccountSubject(data) {
    return request.put('/account-subject', data)
}

export function deleteAccountSubject(fid) {
    return request.delete(`/account-subject/${fid}`)
}
