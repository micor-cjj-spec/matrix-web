import request from '@/utils/request'
export const listQuotes = (params) => request.get('/sales/quotes', { params })
export const createQuote = (payload) => request.post('/sales/quotes', payload)
export const getQuote = (id, tenantId) => request.get(`/sales/quotes/${id}`, { params: { tenantId } })
export const updateQuote = (id, payload) => request.put(`/sales/quotes/${id}`, payload)
export const actQuote = (id, action, tenantId) => request.post(`/sales/quotes/${id}/${action}`, null, { params: { tenantId } })
export const listContracts = (params) => request.get('/sales/contracts', { params })
export const createContract = (payload) => request.post('/sales/contracts', payload)
export const actContract = (id, action, tenantId) => request.post(`/sales/contracts/${id}/${action}`, null, { params: { tenantId } })

