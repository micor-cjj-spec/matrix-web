<template>
  <v-container fluid class="scheduler-operations-page">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-6">
      <div>
        <div class="text-h5 font-weight-bold">调度运行中心</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          查看任务进度、执行异常、人工补偿和执行器告警
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-calendar-clock" to="/scheduler/jobs">任务配置</v-btn>
        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="loadAll">刷新</v-btn>
      </div>
    </div>

    <v-row class="mb-2">
      <v-col v-for="card in summaryCards" :key="card.key" cols="12" sm="6" md="3">
        <v-card elevation="1">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
            <div class="text-h5 font-weight-bold mt-2">{{ card.value }}</div>
            <div class="text-caption mt-1" :class="card.tone">{{ card.subtitle }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mb-6" elevation="1">
      <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-3">
        <span>执行实例</span>
        <div class="d-flex ga-2 align-center">
          <v-select
            v-model="executionFilters.status"
            :items="executionStatuses"
            label="状态"
            density="compact"
            clearable
            hide-details
            style="min-width: 180px"
            @update:model-value="loadExecutions"
          />
          <v-btn size="small" variant="tonal" @click="loadExecutions">查询</v-btn>
        </div>
      </v-card-title>
      <v-divider />
      <v-data-table-server
        :headers="executionHeaders"
        :items="executions"
        :items-length="executionTotal"
        :loading="executionLoading"
        v-model:page="executionFilters.page"
        v-model:items-per-page="executionFilters.size"
        @update:options="loadExecutions"
      >
        <template #item.fstatus="{ item }">
          <v-chip :color="statusColor(item.fstatus)" size="small" variant="tonal">
            {{ item.fstatus }}
          </v-chip>
        </template>
        <template #item.progress="{ item }">
          <div style="min-width: 170px">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span>{{ item.fcurrentStage || '-' }}</span>
              <span>{{ item.fprogress ?? 0 }}%</span>
            </div>
            <v-progress-linear
              :model-value="item.fprogress || 0"
              :color="statusColor(item.fstatus)"
              height="7"
              rounded
            />
            <div class="text-caption text-medium-emphasis text-truncate mt-1">
              {{ item.fprogressMessage || '暂无进度信息' }}
            </div>
          </div>
        </template>
        <template #item.executor="{ item }">
          <div>{{ item.fexecutorCode }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.fhandlerCode }}</div>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-btn
              v-if="canRetry(item)"
              size="small"
              variant="text"
              color="primary"
              @click="openOperation(item, 'retry-now')"
            >立即重试</v-btn>
            <v-btn
              v-if="item.fstatus === 'RETRY_WAIT'"
              size="small"
              variant="text"
              color="warning"
              @click="openOperation(item, 'stop-retry')"
            >终止重试</v-btn>
            <v-btn
              v-if="canCancel(item)"
              size="small"
              variant="text"
              color="error"
              @click="openOperation(item, 'cancel')"
            >取消</v-btn>
            <v-btn
              v-if="canSkip(item)"
              size="small"
              variant="text"
              @click="openOperation(item, 'skip')"
            >跳过</v-btn>
            <v-btn
              v-if="canMarkSuccess(item)"
              size="small"
              variant="text"
              @click="openOperation(item, 'mark-success')"
            >标记成功</v-btn>
            <v-btn size="small" variant="text" @click="openLogs(item)">操作记录</v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-card elevation="1">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>待处理告警</span>
        <v-btn size="small" variant="tonal" @click="loadAlerts">刷新告警</v-btn>
      </v-card-title>
      <v-divider />
      <v-data-table
        :headers="alertHeaders"
        :items="alerts"
        :loading="alertLoading"
        density="comfortable"
      >
        <template #item.flevel="{ item }">
          <v-chip :color="alertColor(item.flevel)" size="small" variant="tonal">{{ item.flevel }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.fstatus !== 'ACKED'"
            size="small"
            variant="text"
            color="primary"
            @click="ackAlert(item)"
          >确认</v-btn>
          <span v-else class="text-caption text-medium-emphasis">{{ item.fackBy || '已确认' }}</span>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="operationVisible" max-width="560" persistent>
      <v-card>
        <v-card-title>{{ operationTitle }}</v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-4">
            执行编号：{{ selectedExecution?.fexecutionNo }}<br>
            当前状态：{{ selectedExecution?.fstatus }}
          </div>
          <v-textarea
            v-model="operationReason"
            label="操作原因"
            rows="3"
            auto-grow
            :rules="[(value) => Boolean(value?.trim()) || '操作原因不能为空']"
          />
          <v-alert
            v-if="selectedOperation === 'cancel' && ['QUEUED', 'RUNNING'].includes(selectedExecution?.fstatus)"
            type="warning"
            variant="tonal"
            density="compact"
          >
            消息可能已经投递。取消只会更新平台状态，不能撤回已发送消息或强制终止远程 Java 线程。
          </v-alert>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="operationVisible = false">关闭</v-btn>
          <v-btn color="primary" :loading="operationSaving" @click="submitOperation">确认操作</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="logVisible" max-width="850">
      <v-card>
        <v-card-title>人工操作记录</v-card-title>
        <v-divider />
        <v-data-table :headers="logHeaders" :items="operationLogs" :loading="logLoading" />
        <v-card-actions class="justify-end">
          <v-btn @click="logVisible = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  acknowledgeSchedulerAlert,
  cancelSchedulerExecution,
  getSchedulerDashboardSummary,
  listSchedulerAlerts,
  listSchedulerExecutions,
  listSchedulerOperationLogs,
  markSchedulerExecutionSuccess,
  retrySchedulerExecutionNow,
  skipSchedulerExecution,
  stopSchedulerExecutionRetry,
} from '@/api/scheduler'

const loading = ref(false)
const dashboard = ref({})
const executions = ref([])
const executionTotal = ref(0)
const executionLoading = ref(false)
const alerts = ref([])
const alertLoading = ref(false)
const operationVisible = ref(false)
const operationSaving = ref(false)
const selectedExecution = ref(null)
const selectedOperation = ref('')
const operationReason = ref('')
const logVisible = ref(false)
const logLoading = ref(false)
const operationLogs = ref([])
const snackbar = reactive({ visible: false, message: '', color: 'success' })

const executionFilters = reactive({ page: 1, size: 20, status: '' })
const executionStatuses = [
  'CREATED', 'QUEUED', 'RUNNING', 'WAITING', 'RETRY_WAIT',
  'SUCCESS', 'FAILED', 'TIMEOUT', 'DEAD', 'CANCELLED', 'SKIPPED',
]

const executionHeaders = [
  { title: '执行编号', key: 'fexecutionNo', width: 220 },
  { title: '任务', key: 'fjobCode' },
  { title: '执行器', key: 'executor', sortable: false },
  { title: '进度', key: 'progress', sortable: false, width: 210 },
  { title: '尝试', key: 'fattemptNo', width: 70 },
  { title: '状态', key: 'fstatus', width: 110 },
  { title: '计划时间', key: 'fscheduledTime', width: 170 },
  { title: '错误信息', key: 'ferrorMessage', width: 220 },
  { title: '操作', key: 'actions', sortable: false, width: 370 },
]
const alertHeaders = [
  { title: '级别', key: 'flevel', width: 100 },
  { title: '类型', key: 'falertType', width: 170 },
  { title: '标题', key: 'ftitle' },
  { title: '执行编号', key: 'fexecutionNo', width: 210 },
  { title: '时间', key: 'fcreateTime', width: 170 },
  { title: '操作', key: 'actions', sortable: false, width: 100 },
]
const logHeaders = [
  { title: '时间', key: 'fcreateTime', width: 180 },
  { title: '动作', key: 'faction', width: 130 },
  { title: '操作人', key: 'foperatorId', width: 120 },
  { title: '原状态', key: 'ffromStatus', width: 110 },
  { title: '新状态', key: 'ftoStatus', width: 120 },
  { title: '原因', key: 'freason' },
]

const summaryCards = computed(() => [
  {
    key: 'today',
    title: '今日执行',
    value: dashboard.value.todayExecutionTotal || 0,
    subtitle: `成功率 ${dashboard.value.todaySuccessRate || 0}%`,
    tone: 'text-success',
  },
  {
    key: 'failed',
    title: '今日异常',
    value: (dashboard.value.todayFailed || 0) + (dashboard.value.todayTimeout || 0),
    subtitle: `失败 ${dashboard.value.todayFailed || 0} · 超时 ${dashboard.value.todayTimeout || 0}`,
    tone: 'text-error',
  },
  {
    key: 'queue',
    title: '等待处理',
    value: (dashboard.value.waitingExecutions || 0) + (dashboard.value.retryWaitExecutions || 0),
    subtitle: `等待 ${dashboard.value.waitingExecutions || 0} · 重试 ${dashboard.value.retryWaitExecutions || 0}`,
    tone: 'text-warning',
  },
  {
    key: 'executor',
    title: '执行器',
    value: dashboard.value.onlineExecutors || 0,
    subtitle: `离线 ${dashboard.value.offlineExecutors || 0} · 告警 ${dashboard.value.pendingAlerts || 0}`,
    tone: dashboard.value.offlineExecutors ? 'text-error' : 'text-success',
  },
])

const operationTitle = computed(() => ({
  'retry-now': '立即重试',
  'stop-retry': '终止自动重试',
  cancel: '取消执行',
  skip: '跳过本次执行',
  'mark-success': '人工标记成功',
}[selectedOperation.value] || '人工操作'))

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([loadDashboard(), loadExecutions(), loadAlerts()])
  } finally {
    loading.value = false
  }
}

async function loadDashboard() {
  try {
    const response = await getSchedulerDashboardSummary()
    dashboard.value = response.data || {}
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '看板加载失败', 'error')
  }
}

async function loadExecutions() {
  executionLoading.value = true
  try {
    const response = await listSchedulerExecutions(executionFilters)
    executions.value = response.data?.records || []
    executionTotal.value = response.data?.total || 0
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '执行记录加载失败', 'error')
  } finally {
    executionLoading.value = false
  }
}

async function loadAlerts() {
  alertLoading.value = true
  try {
    const response = await listSchedulerAlerts({ page: 1, size: 100, status: 'PENDING' })
    alerts.value = response.data?.records || []
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '告警加载失败', 'error')
  } finally {
    alertLoading.value = false
  }
}

function openOperation(item, operation) {
  selectedExecution.value = item
  selectedOperation.value = operation
  operationReason.value = ''
  operationVisible.value = true
}

async function submitOperation() {
  const reason = operationReason.value?.trim()
  if (!reason) return notify('请输入操作原因', 'warning')
  operationSaving.value = true
  try {
    const executionNo = selectedExecution.value.fexecutionNo
    const actions = {
      'retry-now': () => retrySchedulerExecutionNow(executionNo, reason),
      'stop-retry': () => stopSchedulerExecutionRetry(executionNo, reason),
      cancel: () => cancelSchedulerExecution(executionNo, reason),
      skip: () => skipSchedulerExecution(executionNo, reason),
      'mark-success': () => markSchedulerExecutionSuccess(executionNo, reason),
    }
    await actions[selectedOperation.value]()
    operationVisible.value = false
    notify('操作成功')
    await loadAll()
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '操作失败', 'error')
  } finally {
    operationSaving.value = false
  }
}

async function openLogs(item) {
  logVisible.value = true
  logLoading.value = true
  try {
    const response = await listSchedulerOperationLogs(item.fexecutionNo, { page: 1, size: 100 })
    operationLogs.value = response.data?.records || []
  } finally {
    logLoading.value = false
  }
}

async function ackAlert(item) {
  try {
    await acknowledgeSchedulerAlert(item.fid)
    notify('告警已确认')
    await Promise.all([loadDashboard(), loadAlerts()])
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '告警确认失败', 'error')
  }
}

function canRetry(item) {
  return ['RETRY_WAIT', 'FAILED', 'TIMEOUT', 'DEAD', 'CANCELLED', 'SKIPPED'].includes(item.fstatus)
}

function canCancel(item) {
  return ['WAITING', 'CREATED', 'QUEUED', 'RUNNING', 'RETRY_WAIT'].includes(item.fstatus)
}

function canSkip(item) {
  return ['WAITING', 'CREATED', 'RETRY_WAIT'].includes(item.fstatus)
}

function canMarkSuccess(item) {
  return ['RETRY_WAIT', 'FAILED', 'TIMEOUT', 'DEAD', 'CANCELLED', 'SKIPPED'].includes(item.fstatus)
}

function statusColor(status) {
  if (['SUCCESS', 'ENABLED'].includes(status)) return 'success'
  if (['FAILED', 'TIMEOUT', 'DEAD'].includes(status)) return 'error'
  if (['WAITING', 'RETRY_WAIT', 'SKIPPED', 'PAUSED'].includes(status)) return 'warning'
  if (status === 'CANCELLED') return 'grey'
  return 'primary'
}

function alertColor(level) {
  if (level === 'CRITICAL' || level === 'ERROR') return 'error'
  if (level === 'WARN') return 'warning'
  return 'primary'
}

function notify(message, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.visible = true
}

onMounted(loadAll)
</script>

<style scoped>
.scheduler-operations-page { padding: 24px; }
</style>
