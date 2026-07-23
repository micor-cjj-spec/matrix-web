function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return decodeURIComponent(
    atob(normalized + padding)
      .split('')
      .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  )
}

export function getCurrentUserId() {
  const stored = localStorage.getItem('userId') || localStorage.getItem('username')
  if (stored) return stored

  const token = localStorage.getItem('token')
  if (!token || token.split('.').length < 2) return ''

  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1]))
    return payload.userId
      || payload.user_id
      || payload.sub
      || payload.username
      || payload.preferred_username
      || ''
  } catch (error) {
    console.warn('Unable to resolve current user from JWT', error)
    return ''
  }
}

export function newRequestId(prefix = 'web') {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}
