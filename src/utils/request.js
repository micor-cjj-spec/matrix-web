import axios from 'axios'
import { normalizeTextData } from './textEncoding.js'
import { clearToken } from '@/utils/auth'

// 判断环境，自动切换 baseURL
const baseURL = '/';     // 生产环境改成正式接口地址

// 后端统一前缀
const API_PREFIX = '/api'
let redirectingToLogin = false

function redirectToLogin() {
    if (redirectingToLogin || window.location.pathname === '/login') return
    redirectingToLogin = true
    clearToken()
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.replace(`/login?redirect=${encodeURIComponent(current)}`)
}


const service = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器
service.interceptors.request.use(
    (config) => {
        // 👉 这里可以自动加 Token
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        // 统一为所有接口加上 /api 前缀
        const url = config.url || ''
        if (!url.startsWith(API_PREFIX) && !/^https?:/.test(url)) {
            if (url.startsWith('/')) {
                config.url = API_PREFIX + url
            } else {
                config.url = `${API_PREFIX}/${url}`
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
service.interceptors.response.use(
    (response) => {
        const data = normalizeTextData(response.data)
        if (data?.code === 401) {
            redirectToLogin()
            return Promise.reject(new Error(data.message || 'Login expired'))
        }
        return data
    },
    (error) => {
        if (error.response) {
            const status = error.response.status
            if (status === 401) {
                redirectToLogin()
            } else if (status === 403) {
                console.warn('Forbidden, no permission')
            } else if (status >= 500) {
                console.error('Server error:', status)
            }
        }
        return Promise.reject(error)
    }
)


export default service
