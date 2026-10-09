<template>
  <v-container fluid class="scheduler-page">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-6">
      <div>
        <div class="text-h5 font-weight-bold">定时任务调度</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          动态配置 Cron、在线执行器、并发策略和失败重试
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">新建任务</v-btn>
    </div>

    <v-card class="mb-5" elevation="1">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.keyword"
              label="任务编码或名称"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              @keyup.enter="loadJobs"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="任务状态"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex ga-2">
            <v-btn color="primary" variant="tonal" @click="loadJobs">查询</v-btn>
            <v-btn variant="text" @click="resetFilters">重置</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="1">
      <v-data-table-server
        v-model:page="filters.page"
        v-model:items-per-page="filters.size"
        :headers="headers"
        :items="jobs"
        :items-length="total"
        :loading="loading"
        @update:options="loadJobs"
      >
        <template #item.fstatus="{ item }">
          <v-chip :color="statusColor(item.fstatus)" size="small" variant="tonal">
            {{ item.fstatus }}
          </v-chip>
        </template>
        <template #item.schedule="{ item }">
          <div class="text-body-2">{{ item.fcronExpression }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.ftimezone }}</div>
        </template>
        <template #item.executor="{ item }">
          <div class="text-body-2">{{ item.fexecutorCode }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.fhandlerCode }}</div>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-btn size="small" variant="text" @click="openEdit(item)">编辑</v-btn>
            <v-btn
              v-if="item.fstatus === 'ENABLED'"
              size="small"
              variant="text"
              color="warning"
              @click="pauseJob(item)"
            >暂停</v-btn>
            <v-btn
              v-else-if="item.fstatus === 'PAUSED'"
              size="small"
              variant="text"
              color="success"
              @click="resumeJob(item)"
            >恢复</v-btn>
            <v-btn size="small" variant="text" color="primary" @click="runNow(item)">立即执行</v-btn>
            <v-btn size="small" variant="text" @click="openExecutions(item)">记录</v-btn>
            <v-btn size="small" variant="text" color="error" @click="removeJob(item)">删除</v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="editorVisible" max-width="900" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ editingId ? '编辑任务' : '新建任务' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="editorVisible = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.jobCode" label="任务编码（为空自动生成）" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.jobName" label="任务名称" :rules="requiredRules" />
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="form.cronExpression"
                  label="Quartz Cron"
                  :rules="requiredRules"
                  placeholder="0 0 2 * * ?"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.timezone" label="时区" />
              </v-col>
              <v-col cols="12">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-btn size="small" variant="tonal" @click="previewCron">预览未来执行时间</v-btn>
                  <span class="text-caption text-medium-emphasis">{{ cronPreview.join('、') }}</span>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.executeType" :items="executeTypes" label="执行类型" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.executorCode"
                  :items="executorOptions"
                  item-title="title"
                  item-value="value"
                  label="执行器"
                  :rules="requiredRules"
                  @update:model-value="loadHandlers"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.handlerCode"
                  :items="handlerOptions"
                  item-title="title"
                  item-value="value"
                  label="处理器"
                  :rules="requiredRules"
                  :disabled="!form.executorCode"
                />
              </v-col>
              <v-col cols="12">
                <v-alert
                  v-if="form.executorCode && selectedExecutorStatus !== 'ONLINE'"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  当前执行器状态为 {{ selectedExecutorStatus || 'UNKNOWN' }}，任务可以保存，但到点可能无法执行。
                </v-alert>
                <v-textarea
                  v-model="form.executeParameters"
                  label="执行参数 JSON"
                  rows="4"
                  auto-grow
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.concurrencyPolicy" :items="concurrencyPolicies" label="并发策略" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.misfirePolicy" :items="misfirePolicies" label="Misfire 策略" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.timeoutSeconds" type="number" label="超时秒数" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.retryCount" type="number" label="重试次数" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.retryIntervalSeconds" type="number" label="基础重试间隔秒数" />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch v-model="form.enabled" color="primary" label="创建后立即启用" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="editorVisible = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveJob">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="executionVisible" max-width="1200">
      <v-card>
        <v-card-title>{{ selectedJob?.fjobName }} · 执行记录</v-card-title>
        <v-divider />
        <v-data-table :headers="executionHeaders" :items="executions" :loading="executionLoading">
          <template #item.fstatus="{ item }">
            <v-chip :color="statusColor(item.fstatus)" size="small" variant="tonal">{{ item.fstatus }}</v-chip>
          </template>
        </v-data-table>
        <v-card-actions class="justify-end">
          <v-btn @click="executionVisible = false">关闭</v-btn>
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
  createSchedulerJob,
  deleteSchedulerJob,
  listSchedulerExecutions,
  listSchedulerExecutorHandlers,
  listSchedulerExecutors,
  listSchedulerJobs,
  pauseSchedulerJob,
  previewSchedulerCron,
  resumeSchedulerJob,
  runSchedulerJobNow,
  updateSchedulerJob,
} from '@/api/scheduler'

const loading = ref(false)
const saving = ref(false)
const jobs = ref([])
const total = ref(0)
const executors = ref([])
const handlerOptions = ref([])
const editorVisible = ref(false)
const executionVisible = ref(false)
const executionLoading = ref(false)
const executions = ref([])
const selectedJob = ref(null)
const editingId = ref(null)
const formRef = ref(null)
const cronPreview = ref([])
const snackbar = reactive({ visible: false, message: '', color: 'success' })

const filters = reactive({ page: 1, size: 20, keyword: '', status: '' })
const statusOptions = ['ENABLED', 'PAUSED']
const executeTypes = ['MQ']
const concurrencyPolicies = ['SKIP', 'SERIAL', 'PARALLEL']
const misfirePolicies = ['FIRE_ONCE_NOW', 'DO_NOTHING', 'FIRE_ALL']
const requiredRules = [(value) => Boolean(value) || '不能为空']

const executorOptions = computed(() => executors.value.map((item) => ({
  title: `${item.fexecutorName} · ${item.fexecutorCode} · ${item.fstatus}`,
  value: item.fexecutorCode,
})))
const selectedExecutorStatus = computed(() =>
  executors.value.find((item) => item.fexecutorCode === form.executorCode)?.fstatus,
)

const defaultForm = () => ({
  jobCode: '',
  jobName: '',
  cronExpression: '0 0 2 * * ?',
  timezone: 'Asia/Shanghai',
  tenantId: 'default',
  executeType: 'MQ',
  executorCode: '',
  handlerCode: '',
  executeParameters: '{}',
  concurrencyPolicy: 'SKIP',
  misfirePolicy: 'FIRE_ONCE_NOW',
  timeoutSeconds: 300,
  retryCount: 0,
  retryIntervalSeconds: 60,
  enabled: true,
})
const form = reactive(defaultForm())

const headers = [
  { title: '任务编码', key: 'fjobCode' },
  { title: '任务名称', key: 'fjobName' },
  { title: '来源系统', key: 'fsourceService' },
  { title: '调度规则', key: 'schedule', sortable: false },
  { title: '执行器', key: 'executor', sortable: false },
  { title: '状态', key: 'fstatus' },
  { title: '下次执行', key: 'fnextFireTime' },
  { title: '操作', key: 'actions', sortable: false, width: 330 },
]
const executionHeaders = [
  { title: '执行编号', key: 'fexecutionNo' },
  { title: '计划时间', key: 'fscheduledTime' },
  { title: '触发方式', key: 'ftriggerType' },
  { title: '尝试次数', key: 'fattemptNo' },
  { title: '执行实例', key: 'fexecutorInstance' },
  { title: '状态', key: 'fstatus' },
  { title: '下次重试', key: 'fnextRetryTime' },
  { title: '错误信息', key: 'ferrorMessage' },
]

async function loadJobs() {
  loading.value = true
  try {
    const response = await listSchedulerJobs(filters)
    jobs.value = response.data?.records || []
    total.value = response.data?.total || 0
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '任务加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadExecutors() {
  try {
    const response = await listSchedulerExecutors()
    executors.value = response.data || []
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '执行器加载失败', 'error')
  }
}

async function loadHandlers(executorCode) {
  handlerOptions.value = []
  if (!executorCode) return
  if (!editingId.value || form.executorCode !== executorCode) form.handlerCode = ''
  try {
    const response = await listSchedulerExecutorHandlers(executorCode)
    handlerOptions.value = (response.data || []).map((item) => ({
      title: `${item.fhandlerName} · ${item.fhandlerCode}`,
      value: item.fhandlerCode,
    }))
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '处理器加载失败', 'error')
  }
}

function resetFilters() {
  Object.assign(filters, { page: 1, size: 20, keyword: '', status: '' })
  loadJobs()
}

function openCreate() {
  editingId.value = null
  Object.assign(form, defaultForm())
  cronPreview.value = []
  handlerOptions.value = []
  editorVisible.value = true
}

async function openEdit(item) {
  editingId.value = item.fid
  Object.assign(form, {
    jobCode: item.fjobCode,
    jobName: item.fjobName,
    cronExpression: item.fcronExpression,
    timezone: item.ftimezone,
    tenantId: item.ftenantId,
    executeType: item.fexecuteType,
    executorCode: item.fexecutorCode,
    handlerCode: item.fhandlerCode,
    executeParameters: item.fexecuteParameters || '{}',
    concurrencyPolicy: item.fconcurrencyPolicy,
    misfirePolicy: item.fmisfirePolicy,
    timeoutSeconds: item.ftimeoutSeconds,
    retryCount: item.fretryCount,
    retryIntervalSeconds: item.fretryIntervalSeconds,
    enabled: item.fstatus === 'ENABLED',
  })
  await loadHandlers(item.fexecutorCode)
  form.handlerCode = item.fhandlerCode
  editorVisible.value = true
}

async function saveJob() {
  const validation = await formRef.value?.validate()
  if (validation && !validation.valid) return
  try {
    JSON.parse(form.executeParameters || '{}')
  } catch {
    return notify('执行参数必须是合法 JSON', 'error')
  }
  saving.value = true
  try {
    if (editingId.value) await updateSchedulerJob(editingId.value, form)
    else await createSchedulerJob(form)
    editorVisible.value = false
    notify('保存成功')
    loadJobs()
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

async function previewCron() {
  try {
    const response = await previewSchedulerCron({ cron: form.cronExpression, timezone: form.timezone, count: 5 })
    cronPreview.value = response.data || []
  } catch (error) {
    notify(error?.response?.data?.message || error.message || 'Cron 校验失败', 'error')
  }
}

async function pauseJob(item) { await action(() => pauseSchedulerJob(item.fid), '任务已暂停') }
async function resumeJob(item) { await action(() => resumeSchedulerJob(item.fid), '任务已恢复') }
async function runNow(item) { await action(() => runSchedulerJobNow(item.fid), '已提交立即执行') }
async function removeJob(item) { await action(() => deleteSchedulerJob(item.fid), '任务已删除') }

async function action(fn, message) {
  try {
    await fn()
    notify(message)
    loadJobs()
  } catch (error) {
    notify(error?.response?.data?.message || error.message || '操作失败', 'error')
  }
}

async function openExecutions(item) {
  selectedJob.value = item
  executionVisible.value = true
  executionLoading.value = true
  try {
    const response = await listSchedulerExecutions({ page: 1, size: 100, jobId: item.fid })
    executions.value = response.data?.records || []
  } finally {
    executionLoading.value = false
  }
}

function statusColor(status) {
  if (['ENABLED', 'SUCCESS', 'SENT', 'ONLINE'].includes(status)) return 'success'
  if (['FAILED', 'TIMEOUT', 'DEAD', 'OFFLINE'].includes(status)) return 'error'
  if (['PAUSED', 'SKIPPED', 'WAITING', 'RETRY_WAIT'].includes(status)) return 'warning'
  return 'primary'
}

function notify(message, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.visible = true
}

onMounted(() => {
  loadJobs()
  loadExecutors()
})
</script>

<style scoped>
.scheduler-page { padding: 24px; }
</style>
