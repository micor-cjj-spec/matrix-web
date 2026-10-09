<template>
  <main class="workflow-page">
    <section class="hero">
      <div>
        <span>WORKFLOW TASK CENTER</span>
        <h1>工作流任务中心</h1>
        <p>统一处理审批待办、查看已办，并完成发起人退回修正任务。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-cash-refund" @click="router.push('/expenses')">费用报销</v-btn>
        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="fetchTasks">刷新</v-btn>
      </div>
    </section>

    <v-card class="filter-card" elevation="0">
      <v-tabs v-model="filters.view" color="primary" grow>
        <v-tab value="TODO">我的待办</v-tab>
        <v-tab value="DONE">我的已办</v-tab>
        <v-tab value="INITIATED">我发起的</v-tab>
      </v-tabs>
      <v-divider />
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="3"><v-text-field v-model.trim="filters.tenantId" label="租户" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" md="3"><v-text-field v-model.trim="filters.businessType" label="业务类型" variant="outlined" density="comfortable" hide-details clearable /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model.trim="filters.keyword" label="任务、单据或发起人" prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details clearable @keydown.enter="applyFilters" /></v-col>
          <v-col cols="12" md="2" class="filter-actions"><v-btn color="primary" block @click="applyFilters">查询</v-btn></v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert v-if="!operatorId" type="warning" variant="tonal" class="mb-4">当前登录令牌中无法解析用户编号。任务查询仍可使用，但执行审批前需要重新登录。</v-alert>

    <v-card class="table-card" elevation="0">
      <div class="table-heading"><div><span>{{ viewTitle }}</span><strong>共 {{ total }} 条流程任务</strong></div><small>第 {{ page }} / {{ pageCount }} 页</small></div>
      <v-data-table :headers="headers" :items="items" :loading="loading" :items-per-page="size" item-value="taskId" hide-default-footer>
        <template #item.task="{ item }"><div class="primary-cell"><strong>{{ item.taskName || item.currentNodeKey || '流程任务' }}</strong><small>{{ item.taskId }}</small><v-chip v-if="isResubmitTask(item)" size="x-small" color="warning" variant="tonal">发起人修正</v-chip></div></template>
        <template #item.business="{ item }"><button class="business-link" type="button" @click="openBusiness(item)"><strong>{{ businessTypeText(item.businessType) }}</strong><small>{{ item.businessId }}</small></button></template>
        <template #item.initiatorId="{ item }">{{ item.initiatorId || '-' }}</template>
        <template #item.status="{ item }"><div class="status-stack"><v-chip size="small" variant="tonal" :color="statusColor(item.taskStatus)">{{ item.taskStatus || '-' }}</v-chip><small>流程：{{ item.instanceStatus || '-' }}</small></div></template>
        <template #item.createdAt="{ item }">{{ formatTime(item.createdAt || item.completedAt) }}</template>
        <template #item.actions="{ item }">
          <div v-if="filters.view === 'TODO'" class="row-actions">
            <v-btn v-if="isResubmitTask(item)" size="small" color="warning" variant="tonal" prepend-icon="mdi-file-edit-outline" @click="openBusiness(item)">修改并重新提交</v-btn>
            <template v-else>
              <v-btn size="small" color="success" variant="tonal" @click="openAction(item, 'APPROVE')">通过</v-btn>
              <v-btn size="small" color="error" variant="tonal" @click="openAction(item, 'REJECT')">驳回</v-btn>
              <v-btn size="small" variant="tonal" @click="openAction(item, 'RETURN_TO_INITIATOR')">退回</v-btn>
            </template>
          </div>
          <v-btn v-else size="small" variant="text" @click="openBusiness(item)">查看业务</v-btn>
        </template>
        <template #no-data><div class="empty-state"><v-icon size="42">mdi-clipboard-check-outline</v-icon><strong>当前视图暂无任务</strong><span>调整筛选条件或刷新后重试。</span></div></template>
      </v-data-table>
      <div class="pagination-bar"><v-pagination v-model="page" :length="pageCount" :total-visible="7" @update:model-value="fetchTasks" /></div>
    </v-card>

    <v-dialog v-model="actionDialog.visible" max-width="560" persistent>
      <v-card><v-card-title>{{ actionText(actionDialog.action) }}任务</v-card-title><v-card-text>
        <v-alert variant="tonal" type="info" class="mb-4">{{ actionDialog.task?.taskName }} · {{ actionDialog.task?.businessId }}</v-alert>
        <v-text-field v-model="operatorId" label="操作人" variant="outlined" :disabled="Boolean(resolvedUserId)" />
        <v-textarea v-model="actionDialog.comment" label="处理意见" variant="outlined" rows="4" auto-grow />
      </v-card-text><v-card-actions><v-spacer /><v-btn variant="text" :disabled="actionDialog.loading" @click="closeAction">取消</v-btn><v-btn :color="actionColor(actionDialog.action)" :loading="actionDialog.loading" @click="submitAction">确认{{ actionText(actionDialog.action) }}</v-btn></v-card-actions></v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2600">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { actOnWorkflowTask, listWorkflowTaskCenter } from '@/api/workflow'
import { getCurrentUserId } from '@/utils/currentUser'

const router = useRouter()
const resolvedUserId = getCurrentUserId()
const operatorId = ref(resolvedUserId)
const loading = ref(false)
const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const filters = reactive({ tenantId: 'default', view: 'TODO', businessType: '', keyword: '' })
const snackbar = reactive({ show: false, text: '', color: 'success' })
const actionDialog = reactive({ visible: false, loading: false, task: null, action: 'APPROVE', comment: '' })
const headers = [
  { title: '任务', key: 'task', minWidth: 220 },
  { title: '业务单据', key: 'business', minWidth: 190 },
  { title: '发起人', key: 'initiatorId', width: 130 },
  { title: '状态', key: 'status', width: 170 },
  { title: '创建/完成时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'actions', sortable: false, minWidth: 240 },
]
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const viewTitle = computed(() => ({ TODO: '我的待办', DONE: '我的已办', INITIATED: '我发起的' }[filters.view] || '流程任务'))

watch(() => filters.view, () => { page.value = 1; fetchTasks() })
onMounted(fetchTasks)

async function fetchTasks() {
  if (!filters.tenantId) return showMessage('租户不能为空', 'warning')
  loading.value = true
  try {
    const response = await listWorkflowTaskCenter({ tenantId: filters.tenantId, view: filters.view, businessType: filters.businessType || undefined, keyword: filters.keyword || undefined, page: page.value, size: size.value })
    const data = response?.data || {}
    items.value = Array.isArray(data.items) ? data.items : []
    total.value = Number(data.total || 0)
  } catch (error) { items.value = []; total.value = 0; showMessage(apiMessage(error, '工作流任务加载失败'), 'error') } finally { loading.value = false }
}

function applyFilters() { page.value = 1; fetchTasks() }
function openAction(task, action) {
  if (isResubmitTask(task)) { openBusiness(task); return }
  actionDialog.task = task; actionDialog.action = action; actionDialog.comment = ''; actionDialog.visible = true
}
function closeAction() { actionDialog.visible = false; actionDialog.task = null; actionDialog.comment = '' }
async function submitAction() {
  if (!operatorId.value) return showMessage('无法识别当前操作人，请重新登录', 'warning')
  actionDialog.loading = true
  try {
    await actOnWorkflowTask(actionDialog.task.taskId, { action: actionDialog.action, operatorId: operatorId.value, comment: actionDialog.comment || undefined, variables: {} })
    showMessage(`任务已${actionText(actionDialog.action)}`)
    closeAction()
    await fetchTasks()
  } catch (error) { showMessage(apiMessage(error, '任务处理失败'), 'error') } finally { actionDialog.loading = false }
}

function isResubmitTask(item) {
  const node = String(item?.currentNodeKey || '').toUpperCase()
  const name = String(item?.taskName || '')
  const instance = String(item?.instanceStatus || '').toUpperCase()
  return node === '__RESUBMIT__' || instance === 'WAITING_RESUBMIT' || name.includes('修正') || name.includes('重新提交')
}
function openBusiness(item) {
  if (String(item?.businessType || '').toUpperCase().includes('EXPENSE') && item.businessId) return router.push({ path: '/expenses', query: { expenseId: item.businessId } })
  showMessage('该业务详情页尚未接入', 'info')
}
function businessTypeText(value) { if (!value) return '业务流程'; return String(value).toUpperCase().includes('EXPENSE') ? '费用报销' : value }
function statusColor(value) { const v = String(value || '').toUpperCase(); if (['COMPLETED', 'APPROVED', 'DONE'].includes(v)) return 'success'; if (['REJECTED', 'CANCELLED', 'FAILED'].includes(v)) return 'error'; if (['WAITING_RESUBMIT', 'RETURNED'].includes(v)) return 'warning'; if (['PENDING', 'TODO', 'ACTIVE', 'PROCESSING'].includes(v)) return 'primary'; return 'default' }
function actionText(action) { return ({ APPROVE: '通过', REJECT: '驳回', RETURN_TO_INITIATOR: '退回发起人' }[action] || action) }
function actionColor(action) { return action === 'APPROVE' ? 'success' : action === 'REJECT' ? 'error' : 'warning' }
function formatTime(value) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false }) }
function showMessage(text, color = 'success') { snackbar.text = text; snackbar.color = color; snackbar.show = true }
function apiMessage(error, fallback) { return error?.response?.data?.message || error?.response?.data?.msg || fallback }
</script>

<style scoped>
.workflow-page { min-height: 100vh; padding: 30px; color: #20322f; background: #f4f7f6; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; padding: 30px 34px; border-radius: 24px; color: white; background: linear-gradient(135deg, #1d6455, #378d73); }
.hero span { font-size: 11px; font-weight: 800; letter-spacing: .16em; opacity: .75; }.hero h1 { margin: 8px 0 0; font-size: 36px; }.hero p { margin: 12px 0 0; opacity: .78; }.hero-actions { display: flex; gap: 10px; }
.filter-card, .table-card { border: 1px solid #dfe8e5; border-radius: 18px; background: white; }.filter-card { margin-bottom: 18px; }.filter-actions { display: flex; align-items: center; }
.table-heading { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 12px; }.table-heading span, .table-heading strong { display: block; }.table-heading span { color: #71837e; font-size: 11px; letter-spacing: .12em; }.table-heading strong { margin-top: 5px; font-size: 18px; }.table-heading small { color: #82928e; }
.primary-cell, .business-link, .status-stack { display: grid; gap: 4px; }.primary-cell small, .business-link small, .status-stack small { color: #83928e; font-size: 11px; }.business-link { padding: 0; border: 0; color: #236d5a; background: transparent; cursor: pointer; text-align: left; }.row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.pagination-bar { display: flex; justify-content: center; padding: 14px 20px 22px; }.empty-state { display: grid; justify-items: center; gap: 8px; padding: 48px; color: #81918d; }.empty-state strong { color: #435b55; }
@media (max-width: 800px) { .workflow-page { padding: 16px; }.hero { align-items: flex-start; flex-direction: column; padding: 24px; }.hero h1 { font-size: 28px; }.hero-actions { width: 100%; flex-wrap: wrap; } }
</style>
