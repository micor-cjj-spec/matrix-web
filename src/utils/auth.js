export function saveToken(token) {
    if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('lastActivityTime', Date.now().toString())
    }
}

export function clearToken() {
    localStorage.removeItem('token')
    localStorage.removeItem('lastActivityTime')
}

export function updateActivity() {
    localStorage.setItem('lastActivityTime', Date.now().toString())
}

export function initAuth(router) {
    const events = ['mousemove', 'keydown', 'click', 'scroll']
    const reset = () => updateActivity()
    events.forEach(ev => window.addEventListener(ev, reset))
    setInterval(() => {
        const token = localStorage.getItem('token')
        const last = parseInt(localStorage.getItem('lastActivityTime'))
        if (token && last && Date.now() - last > 3600000) {
            clearToken()
            router.push('/login')
        }
    }, 60000)
    updateActivity()
}
