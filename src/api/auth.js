import request from '@/utils/request'

export function loginByAccount({ username, password, captcha, captchaKey }) {
    return request.post('/auth/login/account', {
        username,
        password,
        captcha,
        captchaKey,
    })
}

export function loginByPhone({ mobile, code }) {
    return request.post('/auth/login/phone', {
        mobile,
        code,
    })
}

export function getCaptcha() {
    return request.get(`/auth/captcha`, {
        params: { _t: Date.now() },
    })
}

export function sendSmsCode(mobile) {
    return request.post('/auth/sms/send', { mobile })
}

export function generateQrCode() {
    return request.get('/auth/login/qrcode/generate')
}

export function checkQrStatus(token) {
    return request.get(`/auth/login/qrcode/status`, {
        params: { qrcodeToken: token },
    })
}
/**
 * 发送邮箱验证码（注册用）
 * @param {string} email
 * @returns {Promise}
 */
export function sendEmailCode(email) {
    // scene: 'register' 可扩展场景
    return request.post('/auth/email/send', { email, scene: 'register' })
}

/**
 * 邮箱+验证码注册
 * @param {{email: string, password: string, code: string}}
 * @returns {Promise}
 */
export function registerByEmail({ email, password, code }) {
    return request.post('/auth/register', { email, password, code })
}

/**
 * 邮箱+密码登录
 * @param {{email: string, password: string}}
 * @returns {Promise}
 */
export function loginByEmail({ email, password }) {
    return request.post('/auth/login/email', { email, password })
}