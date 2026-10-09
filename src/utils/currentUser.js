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

function getJwtPayload() {
  const token = localStorage.getItem('token')
  if (!token || token.split('.').length < 2) return null

  try {
    return JSON.parse(decodeBase64Url(token.split('.')[1]))
  } catch (error) {
    console.warn('Unable to decode current JWT payload', error)
    return null
  }
}

export function getCurrentUserId() {
  const stored = localStorage.getItem('userId') || localStorage.getItem('username')
  if (stored) return stored

  const payload = getJwtPayload()
  return payload?.userId
    || payload?.user_id
    || payload?.id
    || payload?.sub
    || payload?.username
    || payload?.preferred_username
    || ''
}

export function getCurrentTenantId(fallback = 'default') {
  const stored = localStorage.getItem('tenantId')
  if (stored) return stored

  const payload = getJwtPayload()
  return payload?.tenantId
    || payload?.tenant_id
    || payload?.tenant
    || fallback
}

export function newRequestId(prefix = 'web') {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}
