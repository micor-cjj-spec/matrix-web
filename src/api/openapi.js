import request from '@/utils/request'

export function listOpenApiApps() {
  return request.get('/openapi/admin/apps')
}

export function createOpenApiApp(data) {
  return request.post('/openapi/admin/apps', data)
}

export function updateOpenApiAppStatus(id, status) {
  return request.put(`/openapi/admin/apps/${id}/status`, null, {
    params: { status },
  })
}

export function listOpenApiDefinitions() {
  return request.get('/openapi/admin/definitions')
}

export function listOpenApiGrants(appId) {
  return request.get('/openapi/admin/grants', {
    params: { appId },
  })
}

export function saveOpenApiGrant(data) {
  return request.post('/openapi/admin/grants', data)
}
