import request from '@/utils/request'

const ACL_TIMEOUT = 60000

export function getKnowledgeBaseAccess(kbId) {
  return request.get(`/ai/knowledge/bases/${kbId}/access`, {
    timeout: ACL_TIMEOUT,
  })
}

export function listKnowledgeBaseAcl(kbId) {
  return request.get(`/ai/knowledge/bases/${kbId}/acl`, {
    timeout: ACL_TIMEOUT,
  })
}

export function grantKnowledgeBaseAcl(kbId, data) {
  return request.put(`/ai/knowledge/bases/${kbId}/acl`, data, {
    timeout: ACL_TIMEOUT,
  })
}

export function revokeKnowledgeBaseAcl(kbId, aclId) {
  return request.delete(`/ai/knowledge/bases/${kbId}/acl/${aclId}`, {
    timeout: ACL_TIMEOUT,
  })
}
