import request from '@/utils/request'

export function listOpenApiApps() {
  return request.get('/openapi/admin/apps')
}

export function createOpenApiApp(data) {
  return request.post('/openapi/admin/apps', data)
}

export function updateOpenApiApp(id, data) {
  return request.put(`/openapi/admin/apps/${id}`, data)
}

export function updateOpenApiAppStatus(id, status) {
  return request.put(`/openapi/admin/apps/${id}/status`, null, { params: { status } })
}

export function updateOpenApiCallbackSettings(id, data) {
  return request.put(`/openapi/admin/apps/${id}/callback`, data)
}

export function rotateOpenApiSecret(id) {
  return request.post(`/openapi/admin/apps/${id}/rotate-secret`)
}

export function listOpenApiDefinitions() {
  return request.get('/openapi/admin/definitions')
}

export function listOpenApiGrants(appId) {
  return request.get('/openapi/admin/grants', { params: { appId } })
}

export function saveOpenApiGrant(data) {
  return request.post('/openapi/admin/grants', data)
}

export function updateOpenApiGrant(id, data) {
  return request.put(`/openapi/admin/grants/${id}`, data)
}

export function revokeOpenApiGrant(id) {
  return request.delete(`/openapi/admin/grants/${id}`)
}

export function getOpenApiDashboard(params) {
  return request.get('/openapi/admin/dashboard', { params })
}

export function listOpenApiLogs(params) {
  return request.get('/openapi/admin/logs', { params })
}

export function getOpenApiLog(requestId) {
  return request.get(`/openapi/admin/logs/${requestId}`)
}

export function listOpenApiWriteRequests(params) {
  return request.get('/openapi/admin/write-requests', { params })
}

export function getOpenApiWriteRequest(requestId) {
  return request.get(`/openapi/admin/write-requests/${requestId}`)
}

export function retryOpenApiWriteRequest(requestId) {
  return request.post(`/openapi/admin/write-requests/${requestId}/retry`)
}

export function listOpenApiCallbacks(params) {
  return request.get('/openapi/admin/callbacks', { params })
}

export function retryOpenApiCallback(eventId) {
  return request.post(`/openapi/admin/callbacks/${eventId}/retry`)
}

export function listOpenApiReconciliation(params) {
  return request.get('/openapi/admin/reconciliation', { params })
}

export function runOpenApiReconciliation(lookbackDays = 7) {
  return request.post('/openapi/admin/reconciliation/run', null, { params: { lookbackDays } })
}

export function repairOpenApiReconciliation(recordId) {
  return request.post(`/openapi/admin/reconciliation/${recordId}/repair`)
}

export function resolveOpenApiReconciliation(recordId, data) {
  return request.post(`/openapi/admin/reconciliation/${recordId}/resolve`, data)
}
