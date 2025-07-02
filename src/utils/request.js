import axios from 'axios'

// 判断环境，自动切换 baseURL
const baseURL = '/';     // 生产环境改成正式接口地址

// 后端统一前缀
const API_PREFIX = '/api'


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

// 响应拦截器
service.interceptors.response.use(
    (response) => {
        // 可以统一处理 response
        return response.data
    },
    (error) => {
        // 可以统一处理错误，比如 401、403、500
        if (error.response) {
            const status = error.response.status
            if (status === 401) {
                console.warn('Unauthorized, redirect to login')
                // 可以跳转登录页
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
