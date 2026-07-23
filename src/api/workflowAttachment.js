import request from '@/utils/request'

export function requestWorkflowUpload(data) {
  return request.post('/workflow/files/upload-url', data)
}

export function uploadWorkflowContent(uploadUrl, file) {
  return request.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })
}

export function confirmWorkflowUpload(fileId, data) {
  return request.post(`/workflow/files/${encodeURIComponent(fileId)}/confirm`, data)
}

export function listWorkflowBusinessAttachments({ tenantId, sourceSystem, businessType, businessId }) {
  return request.get(
    `/workflow/files/business/${encodeURIComponent(sourceSystem)}/${encodeURIComponent(businessType)}/${encodeURIComponent(businessId)}`,
    { params: { tenantId } },
  )
}

export function deleteWorkflowAttachment(relationId, operatorId) {
  return request.delete(`/workflow/files/relations/${encodeURIComponent(relationId)}`, {
    params: { operatorId },
  })
}
