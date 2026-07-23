<template>
  <main class="expense-page">
    <section class="hero">
      <div>
        <span>EXPENSE REIMBURSEMENT</span>
        <h1>费用报销</h1>
        <p>创建报销单、提交审批，并追踪财务单据与工作流状态。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-format-list-checks" @click="router.push('/workflow/tasks')">流程任务</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="resetCreateForm">新建报销</v-btn>
      </div>
    </section>

    <section class="workspace-grid">
      <v-card class="create-card" elevation="0">
        <v-card-title>新建报销单</v-card-title>
        <v-card-subtitle>当前后端暂未提供报销单列表，请通过单据 ID 或流程中心追踪已发起记录。</v-card-subtitle>
        <v-card-text>
          <v-form ref="createFormRef">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="createForm.tenantId" label="租户" variant="outlined" :rules="requiredRules" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="createForm.applicantId" label="申请人编号" variant="outlined" :rules="requiredRules" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="createForm.departmentCode" label="部门编码" variant="outlined" :rules="requiredRules" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model.number="createForm.amount" label="金额" type="number" min="0.01" step="0.01" variant="outlined" :rules="amountRules" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="createForm.currency" label="币种" :items="currencyOptions" variant="outlined" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model.trim="createForm.description" label="报销事由" variant="outlined" rows="4" auto-grow :rules="requiredRules" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resetCreateForm">重置</v-btn>
          <v-btn color="primary" :loading="creating" @click="createDocument">保存草稿</v-btn>
        </v-card-actions>
      </v-card>

      <div class="detail-column">
        <v-card class="lookup-card" elevation="0">
          <v-card-text>
            <div class="lookup-row">
              <v-text-field
                v-model.trim="lookupId"
                label="报销单 ID"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                @keydown.enter="loadDocument"
              />
              <v-btn color="primary" :loading="loading" @click="loadDocument">查询</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-if="document" class="detail-card" elevation="0">
          <div class="detail-heading">
            <div>
              <span>{{ document.documentNumber || document.id }}</span>
              <h2>{{ document.description }}</h2>
            </div>
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
              <v-list-item title="完成时间" :subtitle="formatTime(document.completedAt)" />
            </v-list>
          </v-card-text>

          <v-card-actions class="detail-actions">
            <v-btn v-if="isDraft" variant="tonal" prepend-icon="mdi-pencil" @click="openEdit">编辑</v-btn>
            <v-btn v-if="isDraft" color="primary" prepend-icon="mdi-send" @click="openSubmit">提交审批</v-btn>
            <v-btn v-if="canCancel" color="error" variant="tonal" prepend-icon="mdi-cancel" @click="openCancel">取消单据</v-btn>
            <v-btn variant="text" prepend-icon="mdi-timeline-text" :loading="approvalLoading" @click="loadApprovalDetail">审批详情</v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-else class="empty-card" elevation="0">
          <v-icon size="48">mdi-receipt-text-outline</v-icon>
          <strong>尚未选择报销单</strong>
          <span>创建新草稿，或输入报销单 ID 查询。</span>
        </v-card>
      </div>
    </section>

    <v-card v-if="approvalDetail" class="approval-card" elevation="0">
      <div class="approval-heading">
        <div>
          <span>APPROVAL DETAIL</span>
          <h2>审批与关联数据</h2>
        </div>
        <v-btn variant="text" icon="mdi-close" @click="approvalDetail = null" />
      </div>
      <v-row>
        <v-col v-for="section in approvalSections" :key="section.key" cols="12" md="6">
          <article class="json-panel">
            <strong>{{ section.title }}</strong>
            <pre>{{ prettyJson(section.value) }}</pre>
          </article>
        </v-col>
      </v-row>
    </v-card>

    <v-dialog v-model="editDialog.visible" max-width="720" persistent>
      <v-card>
        <v-card-title>编辑报销草稿</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="editDialog.form.operatorId" label="操作人" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="editDialog.form.departmentCode" label="部门编码" variant="outlined" /></v-col>
            <v-col cols="12" md="8"><v-text-field v-model.number="editDialog.form.amount" label="金额" type="number" min="0.01" step="0.01" variant="outlined" /></v-col>
            <v-col cols="12" md="4"><v-select v-model="editDialog.form.currency" label="币种" :items="currencyOptions" variant="outlined" /></v-col>
            <v-col cols="12"><v-textarea v-model="editDialog.form.description" label="报销事由" variant="outlined" rows="4" auto-grow /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog.visible = false">取消</v-btn>
          <v-btn color="primary" :loading="editDialog.loading" @click="saveEdit">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="submitDialog.visible" max-width="560" persistent>
      <v-card>
        <v-card-title>提交费用报销</v-card-title>
        <v-card-text>
          <v-text-field v-model="submitDialog.operatorId" label="操作人" variant="outlined" />
          <v-text-field v-model="submitDialog.definitionKey" label="流程定义" variant="outlined" hint="默认 expense-reimbursement" persistent-hint />
          <v-textarea v-model="submitDialog.comment" label="提交说明" variant="outlined" rows="3" class="mt-3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="submitDialog.visible = false">取消</v-btn>
          <v-btn color="primary" :loading="submitDialog.loading" @click="submitDocument">确认提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cancelDialog.visible" max-width="520" persistent>
      <v-card>
        <v-card-title>取消费用报销</v-card-title>
        <v-card-text>
          <v-text-field v-model="cancelDialog.operatorId" label="操作人" variant="outlined" />
          <v-textarea v-model="cancelDialog.reason" label="取消原因" variant="outlined" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog.visible = false">返回</v-btn>
          <v-btn color="error" :loading="cancelDialog.loading" @click="cancelDocument">确认取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2400">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelExpense,
  createExpense,
  getExpense,
  getExpenseApprovalDetail,
  submitExpense,
  updateExpense,
} from '@/api/expense'
import { getCurrentUserId } from '@/utils/currentUser'

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
const snackbar = reactive({ show: false, text: '', color: 'success' })

const createForm = reactive({
  tenantId: 'default',
  applicantId: currentUserId,
  departmentCode: '',
  amount: null,
  currency: 'CNY',
  description: '',
})
const editDialog = reactive({ visible: false, loading: false, form: {} })
const submitDialog = reactive({
  visible: false,
  loading: false,
  operatorId: currentUserId,
  definitionKey: 'expense-reimbursement',
  comment: '',
})
const cancelDialog = reactive({ visible: false, loading: false, operatorId: currentUserId, reason: '' })

const requiredRules = [value => Boolean(String(value || '').trim()) || '此项不能为空']
const amountRules = [value => Number(value) > 0 || '金额必须大于 0']
const currencyOptions = ['CNY', 'USD', 'HKD', 'EUR', 'JPY']

const isDraft = computed(() => (document.value?.status || '').toUpperCase() === 'DRAFT')
const canCancel = computed(() => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes((document.value?.status || '').toUpperCase()))
const approvalSections = computed(() => {
  if (!approvalDetail.value) return []
  return [
    { key: 'binding', title: '流程绑定', value: approvalDetail.value.binding },
    { key: 'workflow', title: '流程实例', value: approvalDetail.value.workflow },
    { key: 'tasks', title: '审批任务', value: approvalDetail.value.tasks },
    { key: 'timeline', title: '审批时间线', value: approvalDetail.value.timeline },
    { key: 'attachments', title: '附件', value: approvalDetail.value.attachments },
  ]
})

watch(() => route.query.expenseId, value => {
  if (typeof value === 'string' && value && value !== document.value?.id) {
    lookupId.value = value
    loadDocument()
  }
})

onMounted(() => {
  if (typeof route.query.expenseId === 'string' && route.query.expenseId) {
    lookupId.value = route.query.expenseId
    loadDocument()
  }
})

async function createDocument() {
  const validation = await createFormRef.value?.validate()
  if (validation && !validation.valid) return
  creating.value = true
  try {
    const response = await createExpense({ ...createForm, amount: Number(createForm.amount) })
    document.value = response?.data || null
    lookupId.value = document.value?.id || ''
    approvalDetail.value = null
    syncQuery()
    showMessage('报销草稿已创建')
  } catch (error) {
    showMessage(error?.response?.data?.message || '报销单创建失败', 'error')
  } finally {
    creating.value = false
  }
}

async function loadDocument() {
  if (!lookupId.value) {
    showMessage('请输入报销单 ID', 'warning')
    return
  }
  loading.value = true
  try {
    const response = await getExpense(lookupId.value)
    document.value = response?.data || null
    approvalDetail.value = null
    syncQuery()
  } catch (error) {
    document.value = null
    showMessage(error?.response?.data?.message || '报销单查询失败', 'error')
  } finally {
    loading.value = false
  }
}

function openEdit() {
  editDialog.form = {
    operatorId: currentUserId || document.value.applicantId,
    departmentCode: document.value.departmentCode,
    amount: Number(document.value.amount),
    currency: document.value.currency || 'CNY',
    description: document.value.description,
    version: document.value.version,
  }
  editDialog.visible = true
}

async function saveEdit() {
  const form = editDialog.form
  if (!form.operatorId || !form.departmentCode || !form.description || Number(form.amount) <= 0) {
    showMessage('请完整填写编辑信息', 'warning')
    return
  }
  editDialog.loading = true
  try {
    const response = await updateExpense(document.value.id, { ...form, amount: Number(form.amount) })
    document.value = response?.data || document.value
    editDialog.visible = false
    showMessage('报销草稿已更新')
  } catch (error) {
    showMessage(error?.response?.data?.message || '报销单更新失败', 'error')
  } finally {
    editDialog.loading = false
  }
}

function openSubmit() {
  submitDialog.operatorId = currentUserId || document.value.applicantId
  submitDialog.definitionKey = 'expense-reimbursement'
  submitDialog.comment = ''
  submitDialog.visible = true
}

async function submitDocument() {
  if (!submitDialog.operatorId) {
    showMessage('操作人不能为空', 'warning')
    return
  }
  submitDialog.loading = true
  try {
    const response = await submitExpense(document.value.id, {
      operatorId: submitDialog.operatorId,
      definitionKey: submitDialog.definitionKey || undefined,
      comment: submitDialog.comment || undefined,
    })
    document.value = response?.data || document.value
    submitDialog.visible = false
    showMessage('报销单已提交审批')
    await loadApprovalDetail()
  } catch (error) {
    showMessage(error?.response?.data?.message || '提交审批失败', 'error')
  } finally {
    submitDialog.loading = false
  }
}

function openCancel() {
  cancelDialog.operatorId = currentUserId || document.value.applicantId
  cancelDialog.reason = ''
  cancelDialog.visible = true
}

async function cancelDocument() {
  if (!cancelDialog.operatorId) {
    showMessage('操作人不能为空', 'warning')
    return
  }
  cancelDialog.loading = true
  try {
    const response = await cancelExpense(document.value.id, {
      operatorId: cancelDialog.operatorId,
      reason: cancelDialog.reason || undefined,
    })
    document.value = response?.data || document.value
    cancelDialog.visible = false
    showMessage('报销单已取消')
  } catch (error) {
    showMessage(error?.response?.data?.message || '取消报销单失败', 'error')
  } finally {
    cancelDialog.loading = false
  }
}

async function loadApprovalDetail() {
  if (!document.value?.id) return
  approvalLoading.value = true
  try {
    const response = await getExpenseApprovalDetail(document.value.id)
    approvalDetail.value = response?.data || null
  } catch (error) {
    showMessage(error?.response?.data?.message || '审批详情加载失败', 'error')
  } finally {
    approvalLoading.value = false
  }
}

function resetCreateForm() {
  Object.assign(createForm, {
    tenantId: 'default',
    applicantId: currentUserId,
    departmentCode: '',
    amount: null,
    currency: 'CNY',
    description: '',
  })
  createFormRef.value?.resetValidation()
}

function syncQuery() {
  if (!document.value?.id) return
  router.replace({ path: '/expenses', query: { expenseId: document.value.id } })
}

function statusText(value) {
  const map = {
    DRAFT: '草稿', SUBMITTED: '审批中', APPROVING: '审批中', APPROVED: '已审批',
    COMPLETED: '已完成', REJECTED: '已驳回', CANCELLED: '已取消', RETURNED: '已退回',
  }
  return map[(value || '').toUpperCase()] || value || '-'
}

function statusColor(value) {
  const status = (value || '').toUpperCase()
  if (['APPROVED', 'COMPLETED'].includes(status)) return 'success'
  if (['REJECTED', 'CANCELLED'].includes(status)) return 'error'
  if (['SUBMITTED', 'APPROVING'].includes(status)) return 'primary'
  if (status === 'RETURNED') return 'warning'
  return 'default'
}

function formatMoney(amount, currency) {
  const value = Number(amount || 0)
  try {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: currency || 'CNY' }).format(value)
  } catch (error) {
    return `${currency || 'CNY'} ${value.toFixed(2)}`
  }
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function prettyJson(value) {
  if (value == null) return '暂无数据'
  try { return JSON.stringify(value, null, 2) } catch (error) { return String(value) }
}

function showMessage(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
.expense-page { min-height: 100vh; padding: 30px; color: #233632; background: #f5f7f6; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; padding: 30px 34px; border-radius: 24px; color: #fff; background: linear-gradient(135deg, #6f5320, #b3832e); }
.hero span { font-size: 11px; font-weight: 800; letter-spacing: .16em; opacity: .72; }
.hero h1 { margin: 8px 0 0; font-size: 36px; }
.hero p { margin: 12px 0 0; opacity: .78; }
.hero-actions { display: flex; gap: 10px; }
.workspace-grid { display: grid; grid-template-columns: minmax(360px, .9fr) minmax(460px, 1.1fr); gap: 20px; align-items: start; }
.detail-column { display: grid; gap: 16px; }
.create-card, .lookup-card, .detail-card, .empty-card, .approval-card { border: 1px solid #e0e7e4; border-radius: 18px; background: #fff; }
.lookup-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.detail-heading, .approval-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 22px 24px 8px; }
.detail-heading span, .approval-heading span { color: #8a7a5d; font-size: 11px; font-weight: 800; letter-spacing: .12em; }
.detail-heading h2, .approval-heading h2 { margin: 5px 0 0; font-size: 22px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.metric-grid article { padding: 14px; border-radius: 13px; background: #f7f4ec; }
.metric-grid span, .metric-grid strong { display: block; }
.metric-grid span { color: #8d8069; font-size: 11px; }
.metric-grid strong { margin-top: 6px; font-size: 15px; }
.detail-list { margin-top: 14px; border-radius: 12px; background: #fafbfa; }
.detail-actions { flex-wrap: wrap; padding: 8px 20px 20px; }
.empty-card { display: grid; min-height: 310px; place-items: center; align-content: center; gap: 10px; color: #87948f; }
.empty-card strong { color: #425a54; }
.approval-card { margin-top: 20px; padding: 0 22px 22px; }
.json-panel { height: 100%; padding: 16px; border: 1px solid #e6ece9; border-radius: 14px; background: #f8faf9; }
.json-panel pre { max-height: 320px; overflow: auto; margin: 12px 0 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; }
@media (max-width: 1050px) { .workspace-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) {
  .expense-page { padding: 16px; }
  .hero { align-items: flex-start; flex-direction: column; padding: 24px; }
  .hero h1 { font-size: 28px; }
  .hero-actions { width: 100%; flex-wrap: wrap; }
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
