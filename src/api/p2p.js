import request from '@/utils/request'

function operatorHeaders(operatorId, purchaseOrder = false) {
  if (!operatorId) return {}
  return {
    headers: {
      [purchaseOrder ? 'X-User-Id' : 'X-Operator-Id']: operatorId,
    },
  }
}

export function listPurchaseOrders(params) {
  return request.get('/procurement/purchase-orders', { params })
}

export function getPurchaseOrder(fid, tenantId) {
  return request.get(`/procurement/purchase-orders/${fid}`, { params: { tenantId } })
}

export function createPurchaseOrder(payload, operatorId) {
  return request.post('/procurement/purchase-orders', payload, operatorHeaders(operatorId, true))
}

export function actionPurchaseOrder(fid, action, tenantId, operatorId) {
  return request.post(
    `/procurement/purchase-orders/${fid}/${action}`,
    null,
    { params: { tenantId }, ...operatorHeaders(operatorId, true) },
  )
}

export function listPurchaseReceipts(params) {
  return request.get('/procurement/purchase-receipts', { params })
}

export function getPurchaseReceipt(fid, tenantId) {
  return request.get(`/procurement/purchase-receipts/${fid}`, { params: { tenantId } })
}

export function createPurchaseReceipt(payload, operatorId) {
  return request.post('/procurement/purchase-receipts', payload, operatorHeaders(operatorId))
}

export function actionPurchaseReceipt(fid, action, tenantId, operatorId) {
  return request.post(
    `/procurement/purchase-receipts/${fid}/${action}`,
    null,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function listPurchaseAcceptances(params) {
  return request.get('/procurement/purchase-acceptances', { params })
}

export function getPurchaseAcceptance(fid, tenantId) {
  return request.get(`/procurement/purchase-acceptances/${fid}`, { params: { tenantId } })
}

export function createPurchaseAcceptance(payload, operatorId) {
  return request.post('/procurement/purchase-acceptances', payload, operatorHeaders(operatorId))
}

export function actionPurchaseAcceptance(fid, action, tenantId, operatorId) {
  return request.post(
    `/procurement/purchase-acceptances/${fid}/${action}`,
    null,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function listPurchaseInbounds(params) {
  return request.get('/procurement/purchase-inbounds', { params })
}

export function getPurchaseInbound(fid, tenantId) {
  return request.get(`/procurement/purchase-inbounds/${fid}`, { params: { tenantId } })
}

export function createPurchaseInbound(payload, operatorId) {
  return request.post('/procurement/purchase-inbounds', payload, operatorHeaders(operatorId))
}

export function actionPurchaseInbound(fid, action, tenantId, operatorId) {
  return request.post(
    `/procurement/purchase-inbounds/${fid}/${action}`,
    null,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function listSupplierInvoices(params) {
  return request.get('/procurement/supplier-invoices', { params })
}

export function getSupplierInvoice(fid, tenantId) {
  return request.get(`/procurement/supplier-invoices/${fid}`, { params: { tenantId } })
}

export function createSupplierInvoice(payload, operatorId) {
  return request.post('/procurement/supplier-invoices', payload, operatorHeaders(operatorId))
}

export function actionSupplierInvoice(fid, action, tenantId, operatorId) {
  return request.post(
    `/procurement/supplier-invoices/${fid}/${action}`,
    null,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function listFormalPayables(params) {
  return request.get('/ap/payment-applications/payables', { params })
}

export function getFormalPayable(fid, tenantId) {
  return request.get(`/ap/payment-applications/payables/${fid}`, { params: { tenantId } })
}

export function listPaymentApplications(params) {
  return request.get('/ap/payment-applications', { params })
}

export function getPaymentApplication(fid, tenantId) {
  return request.get(`/ap/payment-applications/${fid}`, { params: { tenantId } })
}

export function actionPaymentApplication(fid, action, tenantId, operatorId, reason = null) {
  return request.post(
    `/ap/payment-applications/${fid}/${action}`,
    { operatorId, reason },
    { params: { tenantId } },
  )
}

export function addPaymentApplicationEvidence(fid, tenantId, payload, operatorId) {
  return request.post(
    `/ap/payment-applications/${fid}/evidence`,
    payload,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function verifyPaymentApplicationEvidence(fid, evidenceId, tenantId, payload, operatorId) {
  return request.post(
    `/ap/payment-applications/${fid}/evidence/${evidenceId}/verify`,
    payload,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function checkPaymentApplicationBudget(fid, tenantId, payload, operatorId) {
  return request.post(
    `/ap/payment-applications/${fid}/budget-check`,
    payload,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function listPaymentOrders(params) {
  return request.get('/fund/payment-orders', { params })
}

export function getPaymentOrder(fid, tenantId) {
  return request.get(`/fund/payment-orders/${fid}`, { params: { tenantId } })
}

export function actionPaymentOrder(fid, action, tenantId, operatorId, reason = null) {
  return request.post(
    `/fund/payment-orders/${fid}/${action}`,
    { operatorId, reason },
    { params: { tenantId } },
  )
}

export function checkPaymentOrderLiquidity(fid, tenantId, payload, operatorId) {
  return request.post(
    `/fund/payment-orders/${fid}/liquidity-check`,
    payload,
    { params: { tenantId }, ...operatorHeaders(operatorId) },
  )
}

export function submitPaymentOrderToBank(fid, tenantId, payload) {
  return request.post(
    `/fund/payment-orders/${fid}/submit-to-bank`,
    payload,
    { params: { tenantId } },
  )
}

export function listBankTransactions(params) {
  return request.get('/fund/bank-transactions', { params })
}

export function getBankTransaction(fid, tenantId) {
  return request.get(`/fund/bank-transactions/${fid}`, { params: { tenantId } })
}

export function createBankTransaction(payload, operatorId) {
  return request.post('/fund/bank-transactions', payload, operatorHeaders(operatorId))
}

export function matchBankTransaction(fid, tenantId, paymentOrderId, operatorId) {
  return request.post(
    `/fund/bank-transactions/${fid}/match-payment-order`,
    { paymentOrderId, operatorId },
    { params: { tenantId } },
  )
}

export function listPaymentSettlements(params) {
  return request.get('/fund/payment-settlements', { params })
}

export function getPaymentSettlement(fid, tenantId) {
  return request.get(`/fund/payment-settlements/${fid}`, { params: { tenantId } })
}

export function finalizePaymentSettlement(paymentOrderId, tenantId, operatorId) {
  return request.post(
    `/fund/payment-settlements/payment-orders/${paymentOrderId}/finalize`,
    { operatorId },
    { params: { tenantId } },
  )
}

export function executeP2pBotp(payload) {
  return request.post('/botp/executions', payload)
}

export function listP2pRelations(params) {
  return request.get('/botp/relations', { params })
}
