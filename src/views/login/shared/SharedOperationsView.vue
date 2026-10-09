<template>
  <main class="shared-page">
    <section class="hero">
      <div>
        <span>SHARED OPERATIONS</span>
        <h1>共享运营任务池</h1>
        <p>真实连接共享服务 API，统一管理任务创建、认领、执行、验收、评论和 SLA。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="refreshAll">刷新</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">创建任务</v-btn>
      </div>
    </section>

    <section class="summary-grid">
      <article><span>任务总数</span><strong>{{ summary.totalCreated || 0 }}</strong><small>当前统计周期创建量</small></article>
      <article><span>已完成</span><strong>{{ summary.completed || 0 }}</strong><small>完成率 {{ completionRate }}%</small></article>
      <article><span>已逾期</span><strong>{{ summary.overdue || 0 }}</strong><small>需要优先处理</small></article>
      <article><span>平均任务年龄</span><strong>{{ summary.avgAgeDays || 0 }} 天</strong><small>从创建至当前</small></article>
    </section>

    <v-card class="filter-card" elevation="0">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="3"><v-text-field v-model.trim="filters.search" label="搜索标题或描述" prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" hide-details clearable @keydown.enter="applyFilters" /></v-col>
          <v-col cols="12" md="2"><v-select v-model="filters.status" label="状态" :items="statusOptions" variant="outlined" density="comfortable" hide-details clearable /></v-col>
          <v-col cols="12" md="2"><v-select v-model="filters.priority" label="优先级" :items="priorityOptions" variant="outlined" density="comfortable" hide-details clearable /></v-col>
          <v-col cols="12" md="3"><v-text-field v-model.trim="filters.module" label="模块" variant="outlined" density="comfortable" hide-details clearable /></v-col>
          <v-col cols="12" md="2"><v-btn color="primary" block height="44" @click="applyFilters">查询</v-btn></v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="table-card" elevation="0">
      <div class="table-heading">
        <div><span>TASK POOL</span><strong>共享任务</strong></div>
        <small>共 {{ total }} 条 · 第 {{ page }} / {{ pageCount }} 页</small>
      </div>
      <v-data-table :headers="headers" :items="tasks" :loading="loading" item-value="id" :items-per-page="pageSize" hide-default-footer @click:row="openRow">
        <template #item.title="{ item }"><button type="button" class="task-link" @click.stop="openDetail(item)"><strong>{{ item.title }}</strong><small>{{ item.id }}</small></button></template>
        <template #item.priority="{ item }"><v-chip size="small" :color="priorityColor(item.priority)" variant="tonal">{{ item.priority || '-' }}</v-chip></template>
        <template #item.status="{ item }"><v-chip size="small" :color="statusColor(item.status)" variant="tonal">{{ item.status || '-' }}</v-chip></template>
        <template #item.assignee="{ item }">{{ item.assignee?.name || item.assignee?.id || '未认领' }}</template>
        <template #item.dueDate="{ item }">{{ item.dueDate || '-' }}</template>
        <template #item.actions="{ item }"><div class="row-actions">
          <v-btn v-if="!item.assignee" size="small" variant="tonal" color="primary" @click.stop="claimTask(item)">认领</v-btn>
          <v-btn size="small" variant="text" @click.stop="openTransition(item)">流转</v-btn>
          <v-btn size="small" variant="text" @click.stop="openEdit(item)">编辑</v-btn>
          <v-btn size="small" variant="text" color="error" @click.stop="removeTask(item)">删除</v-btn>
        </div></template>
        <template #no-data><div class="empty-state"><v-icon size="44">mdi-clipboard-text-outline</v-icon><strong>暂无共享任务</strong><span>调整筛选条件或创建一个新任务。</span></div></template>
      </v-data-table>
      <div class="pagination-bar"><v-pagination v-model="page" :length="pageCount" :total-visible="7" @update:model-value="loadTasks" /></div>
    </v-card>

    <v-dialog v-model="formDialog.visible" max-width="820" persistent>
      <v-card>
        <v-card-title>{{ formDialog.mode === 'create' ? '创建共享任务' : '编辑共享任务' }}</v-card-title>
        <v-card-text>
          <v-form ref="taskFormRef">
            <v-row dense>
              <v-col cols="12" md="8"><v-text-field v-model.trim="formDialog.form.title" label="标题" maxlength="120" counter variant="outlined" :rules="requiredRules" /></v-col>
              <v-col cols="12" md="4"><v-select v-model="formDialog.form.priority" label="优先级" :items="priorityOptions" variant="outlined" /></v-col>
              <v-col cols="12"><v-textarea v-model.trim="formDialog.form.description" label="描述" rows="4" auto-grow counter variant="outlined" hint="至少 20 个字符" persistent-hint :rules="descriptionRules" /></v-col>
              <v-col cols="12" md="4"><v-select v-model="formDialog.form.taskType" label="任务类型" :items="taskTypeOptions" variant="outlined" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model.trim="formDialog.form.module" label="模块" variant="outlined" :rules="requiredRules" /></v-col>
              <v-col cols="12" md="4"><v-select v-model="formDialog.form.riskLevel" label="风险等级" :items="riskOptions" variant="outlined" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="formDialog.form.dueDate" type="date" label="截止日期" variant="outlined" /></v-col>
              <v-col cols="12" md="6"><v-combobox v-model="formDialog.form.labels" label="标签" multiple chips clearable variant="outlined" /></v-col>
              <v-col cols="12"><v-textarea v-model="formDialog.form.acceptanceText" label="验收标准" rows="3" variant="outlined" hint="每行一条，至少一条" persistent-hint :rules="requiredRules" /></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="formDialog.visible = false">取消</v-btn><v-btn color="primary" :loading="formDialog.loading" @click="saveTask">保存</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="transitionDialog.visible" max-width="560" persistent>
      <v-card><v-card-title>任务状态流转</v-card-title><v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">{{ transitionDialog.task?.title }} · 当前状态 {{ transitionDialog.task?.status }}</v-alert>
        <v-select v-model="transitionDialog.targetStatus" label="目标状态" :items="statusOptions" variant="outlined" />
        <v-textarea v-model.trim="transitionDialog.note" label="流转备注" variant="outlined" rows="4" :rules="requiredRules" />
      </v-card-text><v-card-actions><v-spacer /><v-btn variant="text" @click="transitionDialog.visible = false">取消</v-btn><v-btn color="primary" :loading="transitionDialog.loading" @click="submitTransition">确认流转</v-btn></v-card-actions></v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog.visible" max-width="900" scrollable>
      <v-card><v-card-title class="detail-title"><div><small>{{ detailDialog.task?.id }}</small><strong>{{ detailDialog.task?.title }}</strong></div><v-btn icon="mdi-close" variant="text" @click="detailDialog.visible = false" /></v-card-title>
        <v-card-text v-if="detailDialog.task">
          <div class="detail-metrics">
            <article><span>状态</span><strong>{{ detailDialog.task.status }}</strong></article>
            <article><span>优先级</span><strong>{{ detailDialog.task.priority }}</strong></article>
            <article><span>负责人</span><strong>{{ detailDialog.task.assignee?.name || '未认领' }}</strong></article>
            <article><span>SLA</span><strong>{{ detailDialog.sla?.targetHours ?? '-' }} h</strong></article>
          </div>
          <v-alert type="info" variant="tonal" class="my-4">{{ detailDialog.task.description }}</v-alert>
          <v-list lines="two" density="comfortable">
            <v-list-item title="模块" :subtitle="detailDialog.task.module || '-'" />
            <v-list-item title="验收标准" :subtitle="(detailDialog.task.acceptanceCriteria || []).join('；') || '-'" />
            <v-list-item title="创建人" :subtitle="detailDialog.task.requester?.name || detailDialog.task.requester?.id || '-'" />
            <v-list-item title="创建时间" :subtitle="formatTime(detailDialog.task.createdAt)" />
          </v-list>
          <v-divider class="my-4" />
          <div class="comment-heading"><strong>评论记录</strong><v-chip size="small" variant="tonal">{{ detailDialog.comments.length }} 条</v-chip></div>
          <div v-if="detailDialog.comments.length" class="comment-list"><article v-for="comment in detailDialog.comments" :key="comment.id"><header><strong>{{ comment.author?.name || comment.author?.id || '用户' }}</strong><small>{{ formatTime(comment.createdAt) }}</small></header><p>{{ comment.body }}</p></article></div>
          <div v-else class="comment-empty">暂无评论</div>
          <div class="comment-form"><v-textarea v-model.trim="detailDialog.newComment" label="添加评论" rows="2" auto-grow variant="outlined" hide-details /><v-btn color="primary" :loading="detailDialog.commentLoading" @click="submitComment">发送</v-btn></div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2800">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { addSharedTaskComment, createSharedTask, deleteSharedTask, getSharedOperationsSummary, getSharedTask, getSharedTaskSla, listSharedTaskComments, listSharedTasks, transitionSharedTask, updateSharedTask } from '@/api/sharedOperations'
import { getCurrentUserId } from '@/utils/currentUser'

const currentUserId = getCurrentUserId() || 'current-user'
const loading = ref(false)
const tasks = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const taskFormRef = ref(null)
const summary = reactive({ totalCreated: 0, completed: 0, overdue: 0, avgAgeDays: 0 })
const filters = reactive({ search: '', status: null, priority: null, module: '' })
const snackbar = reactive({ show: false, text: '', color: 'success' })
const statusOptions = ['待分诊', '待办', '进行中', '待验收', '已完成', '搁置', '阻塞']
const priorityOptions = ['P0', 'P1', 'P2', 'P3']
const taskTypeOptions = ['缺陷', '需求', '运营', '支持', '数据', '自动化']
const riskOptions = ['高', '中', '低']
const requiredRules = [value => Boolean(Array.isArray(value) ? value.length : String(value || '').trim()) || '此项不能为空']
const descriptionRules = [value => String(value || '').trim().length >= 20 || '描述至少 20 个字符']
const headers = [
  { title: '任务', key: 'title', minWidth: 260 },
  { title: '优先级', key: 'priority', width: 100 },
  { title: '状态', key: 'status', width: 120 },
  { title: '模块', key: 'module', width: 140 },
  { title: '负责人', key: 'assignee', width: 140 },
  { title: '截止日期', key: 'dueDate', width: 130 },
  { title: '操作', key: 'actions', width: 260, sortable: false },
]
const formDialog = reactive({ visible: false, loading: false, mode: 'create', taskId: null, form: emptyForm() })
const transitionDialog = reactive({ visible: false, loading: false, task: null, targetStatus: '进行中', note: '' })
const detailDialog = reactive({ visible: false, task: null, sla: null, comments: [], newComment: '', commentLoading: false })
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const completionRate = computed(() => summary.totalCreated ? Math.round((summary.completed / summary.totalCreated) * 100) : 0)

onMounted(refreshAll)

function emptyForm() { return { title: '', description: '', priority: 'P2', taskType: '运营', module: '共享运营', riskLevel: '中', dueDate: '', labels: [], acceptanceText: '输入、处理和输出均可验证' } }
async function refreshAll() { await Promise.all([loadTasks(), loadSummary()]) }
async function loadTasks() {
  loading.value = true
  try {
    const response = await listSharedTasks({ status: filters.status || undefined, module: filters.module || undefined, priority: filters.priority || undefined, search: filters.search || undefined, page: page.value, pageSize: pageSize.value, sort: '-createdAt' })
    tasks.value = Array.isArray(response?.data) ? response.data : []
    total.value = Number(response?.pagination?.total || response?.pagination?.totalCount || tasks.value.length)
  } catch (error) { tasks.value = []; total.value = 0; showMessage(apiMessage(error, '共享任务加载失败'), 'error') } finally { loading.value = false }
}
async function loadSummary() {
  try { const response = await getSharedOperationsSummary(); Object.assign(summary, response?.data || {}) }
  catch { Object.assign(summary, { totalCreated: 0, completed: 0, overdue: 0, avgAgeDays: 0 }) }
}
function applyFilters() { page.value = 1; loadTasks() }
function openCreate() { formDialog.mode = 'create'; formDialog.taskId = null; formDialog.form = emptyForm(); formDialog.visible = true }
function openEdit(task) { formDialog.mode = 'edit'; formDialog.taskId = task.id; formDialog.form = { title: task.title || '', description: task.description || '', priority: task.priority || 'P2', taskType: task.taskType || '运营', module: task.module || '共享运营', riskLevel: task.riskLevel || '中', dueDate: task.dueDate || '', labels: [...(task.labels || [])], acceptanceText: (task.acceptanceCriteria || []).join('\n') }; formDialog.visible = true }
async function saveTask() {
  const validation = await taskFormRef.value?.validate()
  if (validation && !validation.valid) return
  const form = formDialog.form
  const acceptanceCriteria = String(form.acceptanceText || '').split('\n').map(value => value.trim()).filter(Boolean)
  if (!acceptanceCriteria.length) return showMessage('至少填写一条验收标准', 'warning')
  formDialog.loading = true
  try {
    if (formDialog.mode === 'create') {
      await createSharedTask({ title: form.title, description: form.description, priority: form.priority, taskType: form.taskType, module: form.module, status: '待分诊', riskLevel: form.riskLevel, dueDate: form.dueDate || undefined, labels: form.labels || [], acceptanceCriteria, securityLevel: '内部' })
      showMessage('共享任务已创建并写入任务池')
    } else {
      await updateSharedTask(formDialog.taskId, { title: form.title, description: form.description, priority: form.priority, dueDate: form.dueDate || null, labels: form.labels || [], acceptanceCriteria })
      showMessage('共享任务已更新')
    }
    formDialog.visible = false
    await refreshAll()
  } catch (error) { showMessage(apiMessage(error, '任务保存失败'), 'error') } finally { formDialog.loading = false }
}
async function claimTask(task) {
  try { await updateSharedTask(task.id, { assignee: { id: currentUserId, name: currentUserId, email: '' } }); showMessage('任务已认领'); await loadTasks() }
  catch (error) { showMessage(apiMessage(error, '任务认领失败'), 'error') }
}
function openTransition(task) { transitionDialog.task = task; transitionDialog.targetStatus = nextStatus(task.status); transitionDialog.note = ''; transitionDialog.visible = true }
async function submitTransition() {
  if (!transitionDialog.note) return showMessage('流转备注不能为空', 'warning')
  transitionDialog.loading = true
  try { await transitionSharedTask(transitionDialog.task.id, { targetStatus: transitionDialog.targetStatus, note: transitionDialog.note }); transitionDialog.visible = false; showMessage('任务状态已更新'); await refreshAll() }
  catch (error) { showMessage(apiMessage(error, '状态流转失败'), 'error') } finally { transitionDialog.loading = false }
}
async function removeTask(task) {
  if (!window.confirm(`确认删除任务“${task.title}”吗？`)) return
  try { await deleteSharedTask(task.id); showMessage('任务已删除'); await refreshAll() }
  catch (error) { showMessage(apiMessage(error, '任务删除失败'), 'error') }
}
function openRow(_, row) { if (row?.item) openDetail(row.item) }
async function openDetail(task) {
  detailDialog.visible = true; detailDialog.task = task; detailDialog.sla = null; detailDialog.comments = []; detailDialog.newComment = ''
  try {
    const [taskResponse, slaResponse, commentResponse] = await Promise.all([getSharedTask(task.id), getSharedTaskSla(task.id), listSharedTaskComments(task.id, { page: 1, pageSize: 50, sort: '-createdAt' })])
    detailDialog.task = taskResponse?.data || task
    detailDialog.sla = slaResponse?.data || null
    detailDialog.comments = Array.isArray(commentResponse?.data) ? commentResponse.data : []
  } catch (error) { showMessage(apiMessage(error, '任务详情加载失败'), 'error') }
}
async function submitComment() {
  if (!detailDialog.newComment) return showMessage('评论内容不能为空', 'warning')
  detailDialog.commentLoading = true
  try { await addSharedTaskComment(detailDialog.task.id, { body: detailDialog.newComment, mentions: [], attachments: [] }); detailDialog.newComment = ''; const response = await listSharedTaskComments(detailDialog.task.id, { page: 1, pageSize: 50, sort: '-createdAt' }); detailDialog.comments = Array.isArray(response?.data) ? response.data : []; showMessage('评论已添加') }
  catch (error) { showMessage(apiMessage(error, '评论发送失败'), 'error') } finally { detailDialog.commentLoading = false }
}
function nextStatus(status) { const index = statusOptions.indexOf(status); return statusOptions[Math.min(index + 1, statusOptions.length - 1)] || '进行中' }
function priorityColor(value) { return ({ P0: 'error', P1: 'warning', P2: 'primary', P3: 'default' }[value] || 'default') }
function statusColor(value) { if (value === '已完成') return 'success'; if (value === '阻塞') return 'error'; if (value === '搁置') return 'warning'; if (['进行中', '待验收'].includes(value)) return 'primary'; return 'default' }
function formatTime(value) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false }) }
function showMessage(text, color = 'success') { snackbar.text = text; snackbar.color = color; snackbar.show = true }
function apiMessage(error, fallback) { return error?.response?.data?.message || error?.response?.data?.msg || fallback }
</script>

<style scoped>
.shared-page { min-height: 100vh; padding: 30px; color: #20322f; background: #f4f7f6; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 30px 34px; border-radius: 24px; color: white; background: linear-gradient(135deg, #674b24, #a37b3e); }.hero span, .table-heading span { font-size: 11px; font-weight: 800; letter-spacing: .15em; opacity: .75; }.hero h1 { margin: 8px 0 0; font-size: 36px; }.hero p { margin: 12px 0 0; opacity: .8; }.hero-actions, .row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 18px 0; }.summary-grid article { padding: 20px; border: 1px solid #dfe8e5; border-radius: 16px; background: white; }.summary-grid span, .summary-grid strong, .summary-grid small { display: block; }.summary-grid span, .summary-grid small { color: #778a83; }.summary-grid strong { margin: 8px 0 4px; font-size: 25px; }
.filter-card, .table-card { border: 1px solid #dfe8e5; border-radius: 18px; background: white; }.filter-card { margin-bottom: 18px; }.table-heading { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 12px; }.table-heading strong { display: block; margin-top: 5px; font-size: 19px; }.table-heading small { color: #7b8d87; }
.task-link { display: grid; gap: 4px; padding: 0; border: 0; color: #275e51; background: transparent; text-align: left; cursor: pointer; }.task-link small { color: #83928e; }.pagination-bar { display: flex; justify-content: center; padding: 14px 20px 22px; }.empty-state { display: grid; justify-items: center; gap: 8px; padding: 50px; color: #81918d; }.empty-state strong { color: #435b55; }
.detail-title { display: flex; justify-content: space-between; }.detail-title small, .detail-title strong { display: block; }.detail-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }.detail-metrics article { padding: 14px; border-radius: 12px; background: #f4f7f6; }.detail-metrics span, .detail-metrics strong { display: block; }.detail-metrics span { color: #7b8d87; font-size: 12px; }.detail-metrics strong { margin-top: 6px; }.comment-heading { display: flex; align-items: center; justify-content: space-between; }.comment-list { display: grid; gap: 10px; margin-top: 12px; }.comment-list article { padding: 14px; border-radius: 12px; background: #f4f7f6; }.comment-list header { display: flex; justify-content: space-between; }.comment-list small, .comment-empty { color: #81918d; }.comment-list p { margin: 8px 0 0; }.comment-form { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; margin-top: 14px; }.comment-empty { padding: 20px 0; }
@media (max-width: 960px) { .shared-page { padding: 16px; }.hero { align-items: flex-start; flex-direction: column; padding: 24px; }.hero h1 { font-size: 28px; }.summary-grid { grid-template-columns: repeat(2, 1fr); }.detail-metrics { grid-template-columns: repeat(2, 1fr); }.comment-form { grid-template-columns: 1fr; } }
</style>
