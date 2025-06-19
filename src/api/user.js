// src/api/user.js

import request from '@/utils/request'

/**
 * 获取人员列表
 * @param {Object} params - 可分页/可条件查询
 * @returns {Promise}
 */
export function getUserList(params = {}) {
    // 你可以扩展分页、模糊搜索等参数
    return request.get('/user/list', { params })
}

/**
 * 新增人员
 * @param {Object} data - 人员表单数据（参考实体BizfiBaseUser）
 * @returns {Promise}
 */
export function createUser(data) {
    return request.post('/user', data)
}

/**
 * 编辑/更新人员
 * @param {Object} data - 人员表单数据，需包含主键fid
 * @returns {Promise}
 */
export function editUser(data) {
    return request.put('/user', data)
}

/**
 * 删除人员
 * @param {number|string} fid - 人员主键ID
 * @returns {Promise}
 */
export function deleteUser(fid) {
    return request.delete(`/user/${fid}`)
}

/**
 * 获取人员详情
 * @param {number|string} fid
 * @returns {Promise}
 */
export function getUserDetail(fid) {
    return request.get(`/user/${fid}`)
}
