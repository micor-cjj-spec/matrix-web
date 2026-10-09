import request from '@/utils/request'
import { newRequestId } from '@/utils/currentUser'

export function createExpense(data) {
  return request.post('/fi/expense-reimbursements', data)
}

export function updateExpense(expenseId, data) {
  return request.put(`/fi/expense-reimbursements/${encodeURIComponent(expenseId)}`, data)
}

export function getExpense(expenseId) {
  return request.get(`/fi/expense-reimbursements/${encodeURIComponent(expenseId)}`)
}

export function getExpenseApprovalDetail(expenseId) {
  return request.get(`/fi/expense-reimbursements/${encodeURIComponent(expenseId)}/approval-detail`)
}

export function submitExpense(expenseId, data) {
  return request.post(
    `/fi/expense-reimbursements/${encodeURIComponent(expenseId)}/submit`,
    data,
    { headers: { 'X-Request-Id': newRequestId('expense-submit') } }
  )
}

export function cancelExpense(expenseId, data) {
  return request.post(
    `/fi/expense-reimbursements/${encodeURIComponent(expenseId)}/cancel`,
    data,
    { headers: { 'X-Request-Id': newRequestId('expense-cancel') } }
  )
}
