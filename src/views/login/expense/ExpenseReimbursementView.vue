<template>
  <main class="expense-page">
    <section class="hero">
      <div>
        <span>EXPENSE REIMBURSEMENT</span>
        <h1>费用报销</h1>
        <p>创建报销草稿、上传发票影像、提交或重新提交审批，并追踪完整流程。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-format-list-checks" @click="router.push('/workflow/tasks')">流程任务</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="resetCreateForm">新建报销</v-btn>
      </div>
    </section>

    <v-alert v-if="isReturned" type="warning" variant="tonal" class="mb-4">
      该报销单已被退回。请修改单据信息或发票附件后重新提交审批。
    </v-alert>

    <section class="workspace-grid">
      <v-card class="panel-card" elevation="0">
        <v-card-title>新建报销单</v-card-title>
        <v-card-subtitle>保存草稿后上传至少一份发票影像，才能提交审批。</v-card-subtitle>
        <v-card-text>
          <v-form ref="createFormRef">
            <v-row dense>
              <v-col cols="12" md="6"><v-text-field v-model.trim="createForm.tenantId" label="租户" variant="outlined" :rules="requiredRules" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model.trim="createForm.applicantId" label="申请人编号" variant="outlined" :rules="requiredRules" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model.trim="createForm.departmentCode" label="部门编码" variant="outlined" :rules="requiredRules" /></v-col>
              <v-col cols="12" md="3"><v-text-field v-model.number="createForm.amount" label="金额" type="number" min="0.01" step="0.01" variant="outlined" :rules="amountRules" /></v-col>
              <v-col cols="12" md="3"><v-select v-model="createForm.currency" label="币种" :items="currencyOptions" variant="outlined" /></v-col>
              <v-col cols="12"><v-textarea v-model.trim="createForm.description" label="报销事由" variant="outlined" rows="4" auto-grow :rules="requiredRules" /></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="resetCreateForm">重置</v-btn><v-btn color="primary" :loading="creating" @click="createDocument">保存草稿</v-btn></v-card-actions>
      </v-card>

      <div class="detail-column">
        <v-card class="lookup-card" elevation="0">
          <v-card-text class="lookup-row">
            <v-text-field v-model.trim="lookupId" label="报销单 ID" prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details @keydown.enter="loadDocument" />
            <v-btn color="primary" :loading="loading" @click="loadDocument">查询</v-btn>
          </v-card-text>
        </v-card>

        <v-card v-if="document" class="panel-card" elevation="0">
          <div class="detail-heading">
            <div><span>{{ document.documentNumber || document.id }}</span><h2>{{ document.description }}</h2></div>
            <v-chip :color="statusColor(document.status)" variant="tonal">{{ statusText(document.status) }}</v-chip>
          </div>
          <v-card-text>
            <div class="metric-grid">
              <article><span>金额</span><strong>{{ formatMoney(document.amount, document.currency) }}</strong></article>
              <article><span>申请人</span><strong>{{ document.applicantId }}</strong></article>
              <article><span>部门</span><strong>{{ document.departmentCode }}</strong></article>
              <article><span>版本</span><strong>v{{ document.version }}</strong></article>
            </div>
            <v-list lines="two" density="comfortable" class="detail-list">
              <v-list-item title="报销单 ID" :subtitle="document.id" />
              <v-list-item title="工作流实例" :subtitle="document.workflowInstanceId || '尚未提交审批'" />
              <v-list-item title="创建时间" :subtitle="formatTime(document.createdAt)" />
              <v-list-item title="提交时间" :subtitle="formatTime(document.submittedAt)" />
            </v-list>
          </v-card-text>
          <v-card-actions class="detail-actions">
            <v-btn v-if="canEdit" variant="tonal" prepend-icon="mdi-pencil" @click="openEdit">编辑</v-btn>
            <v-btn v-if="canEdit" color="primary" prepend-icon="mdi-send" :disabled="!hasQualifiedInvoice" @click="openSubmit">
              {{ isReturned ? '重新提交审批' : '提交审批' }}
            </v-btn>
            <v-btn v-if="canCancel" color="error" variant="tonal" prepend-icon="mdi-cancel" @click="openCancel">取消单据</v-btn>
            <v-btn variant="text" prepend-icon="mdi-timeline-text" :loading="approvalLoading" @click="loadApprovalDetail">审批详情</v-btn>
          </v-card-actions>
          <v-alert v-if="canEdit && !hasQualifiedInvoice" type="warning" variant="tonal" density="compact" class="action-alert">
            提交前必须上传至少一份状态为“已确认、安全”的发票影像。
          </v-alert>
        </v-card>

        <v-card v-else class="empty-card" elevation="0">
          <v-icon size="48">mdi-receipt-text-outline</v-icon><strong>尚未选择报销单</strong><span>创建新草稿，或输入报销单 ID 查询。</span>
        </v-card>
      </div>
    </section>

    <v-card v-if="document" class="attachment-card" elevation="0">
      <div class="section-heading">
        <div><span>INVOICE ATTACHMENTS</span><h2>发票影像</h2><p>仅已上传并通过安全检查的 INVOICE 附件满足提交条件。</p></div>
        <v-chip :color="hasQualifiedInvoice ? 'success' : 'warning'" variant="tonal">合格附件 {{ qualifiedInvoiceCount }} 份</v-chip>
      </div>
      <v-card-text>
        <div v-if="canEdit" class="upload-row">
          <v-file-input v-model="selectedFiles" label="选择发票文件" accept="application/pdf,image/*" prepend-icon="mdi-paperclip" variant="outlined" density="comfortable" show-size hide-details />
          <v-btn color="primary" prepend-icon="mdi-cloud-upload" :loading="uploading" :disabled="!selectedFile" @click="uploadInvoice">上传并确认</v-btn>
        </div>
        <v-progress-linear v-if="uploading" indeterminate color="primary" class="mb-4" />
        <v-data-table :headers="attachmentHeaders" :items="attachments" :loading="attachmentsLoading" item-value="relationId" hide-default-footer>
          <template #item.originalName="{ item }"><div class="file-cell"><v-icon>mdi-file-document-outline</v-icon><div><strong>{{ item.originalName }}</strong><small>{{ formatFileSize(item.fileSize) }}</small></div></div></template>
          <template #item.categoryCode="{ item }"><v-chip size="small" variant="tonal">{{ item.categoryCode }}</v-chip></template>
          <template #item.uploadStatus="{ item }"><v-chip size="small" :color="attachmentStatusColor(item)" variant="tonal">{{ attachmentStatusText(item) }}</v-chip></template>
          <template #item.actions="{ item }"><div class="row-actions"><v-btn size="small" variant="text" @click="downloadAttachment(item)">查看</v-btn><v-btn v-if="canEdit" size="small" variant="text" color="error" @click="removeAttachment(item)">删除</v-btn></div></template>
          <template #no-data><div class="table-empty">尚未上传发票影像</div></template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-card v-if="approvalDetail" class="approval-card" elevation="0">
      <div class="section-heading"><div><span>APPROVAL DETAIL</span><h2>审批与关联数据</h2></div><v-btn variant="text" icon="mdi-close" @click="approvalDetail = null" /></div>
      <v-row><v-col v-for="section in approvalSections" :key="section.key" cols="12" md="6"><article class="json-panel"><strong>{{ section.title }}</strong><pre>{{ prettyJson(section.value) }}</pre></article></v-col></v-row>
    </v-card>

    <v-dialog v-model="editDialog.visible" max-width="720" persistent>
      <v-card><v-card-title>{{ isReturned ? '修改退回报销单' : '编辑报销草稿' }}</v-card-title><v-card-text><v-row dense>
        <v-col cols="12" md="6"><v-text-field v-model="editDialog.form.operatorId" label="操作人" variant="outlined" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="editDialog.form.departmentCode" label="部门编码" variant="outlined" /></v-col>
        <v-col cols="12" md="8"><v-text-field v-model.number="editDialog.form.amount" label="金额" type="number" min="0.01" step="0.01" variant="outlined" /></v-col>
        <v-col cols="12" md="4"><v-select v-model="editDialog.form.currency" label="币种" :items="currencyOptions" variant="outlined" /></v-col>
        <v-col cols="12"><v-textarea v-model="editDialog.form.description" label="报销事由" variant="outlined" rows="4" auto-grow /></v-col>
      </v-row></v-card-text><v-card-actions><v-spacer /><v-btn variant="text" @click="editDialog.visible = false">取消</v-btn><v-btn color="primary" :loading="editDialog.loading" @click="saveEdit">保存</v-btn></v-card-actions></v-card>
    </v-dialog>

    <v-dialog v-model="submitDialog.visible" max-width="560" persistent>
      <v-card><v-card-title>{{ isReturned ? '重新提交费用报销' : '提交费用报销' }}</v-card-title><v-card-text>
        <v-alert type="success" variant="tonal" density="compact" class="mb-4">已检测到 {{ qualifiedInvoiceCount }} 份合格发票附件。</v-alert>
        <v-text-field v-model="submitDialog.operatorId" label="操作人" variant="outlined" />
        <v-text-field v-model="submitDialog.definitionKey" label="流程定义" variant="outlined" hint="默认 expense-reimbursement" persistent-hint />
        <v-textarea v-model="submitDialog.comment" label="提交说明" variant="outlined" rows="3" class="mt-3" />
      </v-card-text><v-card-actions><v-spacer /><v-btn variant="text" @click="submitDialog.visible = false">取消</v-btn><v-btn color="primary" :loading="submitDialog.loading" @click="submitDocument">确认{{ isReturned ? '重新' : '' }}提交</v-btn></v-card-actions></v-card>
    </v-dialog>

    <v-dialog v-model="cancelDialog.visible" max-width="520" persistent>
      <v-card><v-card-title>取消费用报销</v-card-title><v-card-text><v-text-field v-model="cancelDialog.operatorId" label="操作人" variant="outlined" /><v-textarea v-model="cancelDialog.reason" label="取消原因" variant="outlined" rows="3" /></v-card-text><v-card-actions><v-spacer /><v-btn variant="text" @click="cancelDialog.visible = false">返回</v-btn><v-btn color="error" :loading="cancelDialog.loading" @click="cancelDocument">确认取消</v-btn></v-card-actions></v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cancelExpense, createExpense, getExpense, getExpenseApprovalDetail, submitExpense, updateExpense } from '@/api/expense'
import { confirmWorkflowUpload, deleteWorkflowAttachment, listWorkflowBusinessAttachments, requestWorkflowUpload, uploadWorkflowContent } from '@/api/workflowAttachment'
import { getCurrentUserId } from '@/utils/currentUser'

const SOURCE_SYSTEM = 'fi-service'
const BUSINESS_TYPE = 'EXPENSE_REIMBURSEMENT'
const route = useRoute()
const router = useRouter()
const currentUserId = getCurrentUserId()
const createFormRef = ref(null)
const creating = ref(false)
const loading = ref(false)
const approvalLoading = ref(false)
const lookupId = ref('')
const document = ref(null)
const approvalDetail = ref(null)
const attachments = ref([])
const attachmentsLoading = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

const createForm = reactive({ tenantId: 'default', applicantId: currentUserId, departmentCode: '', amount: null, currency: 'CNY', description: '' })
const editDialog = reactive({ visible: false, loading: false, form: {} })
const submitDialog = reactive({ visible: false, loading: false, operatorId: currentUserId, definitionKey: 'expense-reimbursement', comment: '' })
const cancelDialog = reactive({ visible: false, loading: false, operatorId: currentUserId, reason: '' })
const requiredRules = [value => Boolean(String(value || '').trim()) || '此项不能为空']
const amountRules = [value => Number(value) > 0 || '金额必须大于 0']
const currencyOptions = ['CNY', 'USD', 'HKD', 'EUR', 'JPY']
const attachmentHeaders = [
  { title: '文件', key: 'originalName', minWidth: 260 },
  { title: '类别', key: 'categoryCode', width: 120 },
  { title: '状态', key: 'uploadStatus', width: 150 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 140, sortable: false },
]

const status = computed(() => String(document.value?.status || '').toUpperCase())
const canEdit = computed(() => ['DRAFT', 'RETURNED'].includes(status.value))
const isReturned = computed(() => status.value === 'RETURNED')
const canCancel = computed(() => ['APPROVING', 'RETURNED'].includes(status.value))
const selectedFile = computed(() => Array.isArray(selectedFiles.value) ? selectedFiles.value[0] : selectedFiles.value)
const qualifiedInvoiceCount = computed(() => attachments.value.filter(isQualifiedInvoice).length)
const hasQualifiedInvoice = computed(() => qualifiedInvoiceCount.value > 0)
const approvalSections = computed(() => approvalDetail.value ? [
  { key: 'binding', title: '流程绑定', value: approvalDetail.value.binding },
  { key: 'workflow', title: '流程实例', value: approvalDetail.value.workflow },
  { key: 'tasks', title: '审批任务', value: approvalDetail.value.tasks },
  { key: 'timeline', title: '审批时间线', value: approvalDetail.value.timeline },
  { key: 'attachments', title: '附件', value: approvalDetail.value.attachments },
] : [])

watch(() => route.query.expenseId, value => {
  if (typeof value === 'string' && value && value !== document.value?.id) { lookupId.value = value; loadDocument() }
})
onMounted(() => { if (typeof route.query.expenseId === 'string' && route.query.expenseId) { lookupId.value = route.query.expenseId; loadDocument() } })

async function createDocument() {
  const validation = await createFormRef.value?.validate()
  if (validation && !validation.valid) return
  creating.value = true
  try {
    const response = await createExpense({ ...createForm, amount: Number(createForm.amount) })
    document.value = response?.data || null
    lookupId.value = document.value?.id || ''
    approvalDetail.value = null
    attachments.value = []
    syncQuery()
    showMessage('报销草稿已创建，请继续上传发票影像')
  } catch (error) { showMessage(apiMessage(error, '报销单创建失败'), 'error') } finally { creating.value = false }
}

async function loadDocument() {
  if (!lookupId.value) return showMessage('请输入报销单 ID', 'warning')
  loading.value = true
  try {
    const response = await getExpense(lookupId.value)
    document.value = response?.data || null
    approvalDetail.value = null
    syncQuery()
    await loadAttachments()
  } catch (error) { document.value = null; attachments.value = []; showMessage(apiMessage(error, '报销单查询失败'), 'error') } finally { loading.value = false }
}

async function loadAttachments() {
  if (!document.value?.id) return
  attachmentsLoading.value = true
  try {
    const response = await listWorkflowBusinessAttachments({ tenantId: document.value.tenantId, sourceSystem: SOURCE_SYSTEM, businessType: BUSINESS_TYPE, businessId: document.value.id })
    attachments.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) { attachments.value = []; showMessage(apiMessage(error, '附件加载失败'), 'error') } finally { attachmentsLoading.value = false }
}

async function uploadInvoice() {
  const file = selectedFile.value
  if (!file || !document.value?.id) return
  if (file.size > 50 * 1024 * 1024) return showMessage('单个附件不能超过 50MB', 'warning')
  uploading.value = true
  try {
    const sha256 = await digestFile(file)
    const requested = await requestWorkflowUpload({
      tenantId: document.value.tenantId,
      sourceSystem: SOURCE_SYSTEM,
      businessType: BUSINESS_TYPE,
      businessId: document.value.id,
      instanceId: document.value.workflowInstanceId || undefined,
      categoryCode: 'INVOICE',
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      sha256,
      operatorId: currentUserId || document.value.applicantId,
    })
    const upload = requested?.data
    if (!upload?.fileId || !upload?.uploadUrl) throw new Error('上传地址响应不完整')
    await uploadWorkflowContent(sameOriginSignedUrl(upload.uploadUrl), file)
    await confirmWorkflowUpload(upload.fileId, { operatorId: currentUserId || document.value.applicantId, sha256 })
    selectedFiles.value = []
    await loadAttachments()
    showMessage('发票影像已上传并确认')
  } catch (error) { showMessage(apiMessage(error, error?.message || '附件上传失败'), 'error') } finally { uploading.value = false }
}

async function removeAttachment(item) {
  if (!window.confirm(`确认删除附件“${item.originalName}”吗？`)) return
  try {
    await deleteWorkflowAttachment(item.relationId, currentUserId || document.value.applicantId)
    await loadAttachments()
    showMessage('附件已删除')
  } catch (error) { showMessage(apiMessage(error, '附件删除失败'), 'error') }
}

function downloadAttachment(item) {
  if (!item.downloadUrl) return showMessage('当前附件没有可用的预览地址，请刷新附件列表', 'warning')
  window.open(sameOriginSignedUrl(item.downloadUrl), '_blank', 'noopener,noreferrer')
}

function openEdit() {
  editDialog.form = { operatorId: currentUserId || document.value.applicantId, departmentCode: document.value.departmentCode, amount: Number(document.value.amount), currency: document.value.currency || 'CNY', description: document.value.description, version: document.value.version }
  editDialog.visible = true
}

async function saveEdit() {
  const form = editDialog.form
  if (!form.operatorId || !form.departmentCode || !form.description || Number(form.amount) <= 0) return showMessage('请完整填写编辑信息', 'warning')
  editDialog.loading = true
  try { const response = await updateExpense(document.value.id, { ...form, amount: Number(form.amount) }); document.value = response?.data || document.value; editDialog.visible = false; showMessage(isReturned.value ? '退回报销单已修改' : '报销草稿已更新') }
  catch (error) { showMessage(apiMessage(error, '报销单更新失败'), 'error') } finally { editDialog.loading = false }
}

function openSubmit() {
  if (!hasQualifiedInvoice.value) return showMessage('请先上传至少一份合格发票影像', 'warning')
  submitDialog.operatorId = currentUserId || document.value.applicantId
  submitDialog.definitionKey = 'expense-reimbursement'
  submitDialog.comment = ''
  submitDialog.visible = true
}

async function submitDocument() {
  if (!submitDialog.operatorId) return showMessage('操作人不能为空', 'warning')
  if (!hasQualifiedInvoice.value) { submitDialog.visible = false; return showMessage('发票附件状态已变化，请重新上传或刷新', 'warning') }
  submitDialog.loading = true
  try {
    const response = await submitExpense(document.value.id, { operatorId: submitDialog.operatorId, definitionKey: submitDialog.definitionKey || undefined, comment: submitDialog.comment || undefined })
    document.value = response?.data || document.value
    submitDialog.visible = false
    showMessage(isReturned.value ? '报销单已重新提交审批' : '报销单已提交审批')
    await loadApprovalDetail()
  } catch (error) { showMessage(apiMessage(error, '提交审批失败'), 'error') } finally { submitDialog.loading = false }
}

function openCancel() { cancelDialog.operatorId = currentUserId || document.value.applicantId; cancelDialog.reason = ''; cancelDialog.visible = true }
async function cancelDocument() {
  if (!cancelDialog.operatorId) return showMessage('操作人不能为空', 'warning')
  cancelDialog.loading = true
  try { const response = await cancelExpense(document.value.id, { operatorId: cancelDialog.operatorId, reason: cancelDialog.reason || undefined }); document.value = response?.data || document.value; cancelDialog.visible = false; showMessage('报销单取消请求已提交') }
  catch (error) { showMessage(apiMessage(error, '取消报销单失败'), 'error') } finally { cancelDialog.loading = false }
}

async function loadApprovalDetail() {
  if (!document.value?.id) return
  approvalLoading.value = true
  try { const response = await getExpenseApprovalDetail(document.value.id); approvalDetail.value = response?.data || null; if (Array.isArray(approvalDetail.value?.attachments)) attachments.value = approvalDetail.value.attachments }
  catch (error) { showMessage(apiMessage(error, '审批详情加载失败'), 'error') } finally { approvalLoading.value = false }
}

function resetCreateForm() { Object.assign(createForm, { tenantId: 'default', applicantId: currentUserId, departmentCode: '', amount: null, currency: 'CNY', description: '' }) }
function syncQuery() { if (document.value?.id) router.replace({ path: route.path, query: { ...route.query, expenseId: document.value.id } }) }
function isQualifiedInvoice(item) { return String(item?.categoryCode || '').toUpperCase() === 'INVOICE' && String(item?.uploadStatus || '').toUpperCase() === 'UPLOADED' && String(item?.scanStatus || '').toUpperCase() === 'CLEAN' }
function attachmentStatusColor(item) { return isQualifiedInvoice(item) ? 'success' : String(item?.uploadStatus || '').toUpperCase() === 'PENDING' ? 'warning' : 'default' }
function attachmentStatusText(item) { if (isQualifiedInvoice(item)) return '已确认、安全'; return `${item.uploadStatus || '未知'} / ${item.scanStatus || '未扫描'}` }
function statusText(value) { return ({ DRAFT: '草稿', APPROVING: '审批中', RETURNED: '已退回', APPROVED: '已批准', REJECTED: '已驳回', CANCELLED: '已取消' }[String(value || '').toUpperCase()] || value || '-') }
function statusColor(value) { const v = String(value || '').toUpperCase(); if (v === 'APPROVED') return 'success'; if (['REJECTED', 'CANCELLED'].includes(v)) return 'error'; if (v === 'RETURNED') return 'warning'; if (v === 'APPROVING') return 'primary'; return 'default' }
function formatMoney(value, currency = 'CNY') { return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: currency || 'CNY' }).format(Number(value || 0)) }
function formatTime(value) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false }) }
function formatFileSize(bytes) { const value = Number(bytes || 0); if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB` }
function prettyJson(value) { return JSON.stringify(value ?? {}, null, 2) }
function showMessage(text, color = 'success') { snackbar.text = text; snackbar.color = color; snackbar.show = true }
function apiMessage(error, fallback) { return error?.response?.data?.message || error?.response?.data?.msg || fallback }
function sameOriginSignedUrl(value) { try { const url = new URL(value, window.location.origin); return `${url.pathname}${url.search}${url.hash}` } catch { return value } }
async function digestFile(file) { const bytes = await file.arrayBuffer(); const hash = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(hash)).map(value => value.toString(16).padStart(2, '0')).join('') }
</script>

<style scoped>
.expense-page { min-height: 100vh; padding: 30px; color: #20322f; background: #f4f7f6; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; padding: 30px 34px; border-radius: 24px; color: white; background: linear-gradient(135deg, #81531f, #c18a3d); }
.hero span, .section-heading span, .detail-heading span { font-size: 11px; font-weight: 800; letter-spacing: .14em; opacity: .72; }
.hero h1, .section-heading h2, .detail-heading h2 { margin: 7px 0 0; }.hero h1 { font-size: 36px; }.hero p { margin: 12px 0 0; opacity: .8; }.hero-actions, .row-actions { display: flex; gap: 8px; }
.workspace-grid { display: grid; grid-template-columns: minmax(340px, .85fr) minmax(420px, 1.15fr); gap: 20px; }.detail-column { display: grid; align-content: start; gap: 16px; }
.panel-card, .lookup-card, .attachment-card, .approval-card, .empty-card { border: 1px solid #dfe8e5; border-radius: 18px; background: white; }.lookup-row { display: flex; align-items: center; gap: 10px; }
.detail-heading, .section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px 8px; }.detail-heading h2 { font-size: 20px; }.section-heading p { margin: 8px 0 0; color: #758680; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }.metric-grid article { padding: 14px; border-radius: 12px; background: #f4f7f6; }.metric-grid span, .file-cell small { display: block; color: #788a84; font-size: 12px; }.metric-grid strong { display: block; margin-top: 6px; }.detail-actions { flex-wrap: wrap; padding: 8px 20px 18px; }.action-alert { margin: 0 20px 20px; }
.empty-card { display: grid; justify-items: center; gap: 8px; padding: 60px 20px; color: #87958f; }.empty-card strong { color: #405852; }.attachment-card, .approval-card { margin-top: 20px; padding-bottom: 8px; }.upload-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; margin-bottom: 18px; }
.file-cell { display: flex; align-items: center; gap: 10px; }.file-cell strong { display: block; }.table-empty { padding: 32px; color: #85948f; }.json-panel { min-height: 180px; padding: 16px; border-radius: 12px; background: #f4f7f6; }.json-panel pre { overflow: auto; max-height: 300px; white-space: pre-wrap; font-size: 12px; }
@media (max-width: 960px) { .expense-page { padding: 16px; }.hero { align-items: flex-start; flex-direction: column; padding: 24px; }.hero h1 { font-size: 28px; }.workspace-grid { grid-template-columns: 1fr; }.metric-grid { grid-template-columns: repeat(2, 1fr); }.upload-row { grid-template-columns: 1fr; } }
</style>
