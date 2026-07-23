import request from '@/utils/request'
import { newRequestId } from '@/utils/currentUser'

export function listWorkflowTaskCenter(params) {
  return request.get('/workflow/task-center', { params })
}

export function getWorkflowTask(taskId) {
  return request.get(`/workflow/tasks/${encodeURIComponent(taskId)}`)
}

export function actOnWorkflowTask(taskId, data) {
  return request.post(
    `/workflow/tasks/${encodeURIComponent(taskId)}/actions`,
    data,
    { headers: { 'X-Request-Id': newRequestId('workflow-action') } }
  )
}
