import request from '@/utils/request'

export function listImApplications() {
  return request.get('/im/applications')
}

export function saveImApplication(data) {
  return request.post('/im/applications', data)
}

export function rotateImApplicationSecret(appCode) {
  return request.post(`/im/applications/${encodeURIComponent(appCode)}/rotate-secret`)
}

export function listImTemplates() {
  return request.get('/im/templates')
}

export function saveImTemplate(data) {
  return request.post('/im/templates', data)
}
