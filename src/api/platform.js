import request from '@/utils/request'

export function getWorkbench() {
  return request.get('/platform/workbench')
}

export function getApps() {
  return request.get('/platform/apps')
}

export function getMenuTree(appCode) {
  return request.get('/platform/menu-tree', {
    params: { appCode },
  })
}

export function getModuleHub(appCode, moduleCode) {
  return request.get('/platform/module-hub', {
    params: { appCode, moduleCode },
  })
}
