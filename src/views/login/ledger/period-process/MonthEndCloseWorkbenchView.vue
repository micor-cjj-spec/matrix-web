<template>
  <div class="month-end-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">月结工作台</h2>
          <div class="page-subtitle">
            汇总基础资料、凭证、总账、期末处理和报表生成结果，形成关账前检查视图。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn color="success" variant="flat" :loading="batchSaving" @click="createBatch">生成检查批次</v-btn>
          <v-btn variant="text" :loading="batchLoading || executionLoading || rolloverLoading" @click="refreshAll">刷新</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="4">
          <v-select
            v-model="query.forg"
            :items="orgOptions"
            item-title="label"
            item-value="value"
            label="业务单元"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.period"
            label="期间"
            density="comfortable"
            placeholder="2026-03"
            clearable
          />
        </v-col>
      </v-row>

      <div class="meta-strip">
        <v-chip size="small" variant="tonal" :color="closeStatusColor(meta.closeStatus)">
          关账状态: {{ closeStatusLabel(meta.closeStatus) }}
        </v-chip>
        <v-chip size="small" variant="tonal">本位币 {{ meta.baseCurrency || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">当前期间: {{ meta.currentPeriod || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">期间来源: {{ periodSourceLabel(meta.periodSource) }}</v-chip>
        <v-chip size="small" variant="tonal">期间状态: {{ meta.periodStatus || '-' }}</v-chip>
      </div>

      <v-row dense class="summary-row">
        <v-col v-for="card in summaryCards" :key="card.label" cols="12" md="3">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value" :class="card.tone">{{ card.value }}</div>
            <div v-if="card.tip" class="summary-tip">{{ card.tip }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-progress-linear
        :model-value="meta.readinessScore"
        :color="closeStatusColor(meta.closeStatus)"
        height="10"
        rounded
        class="readiness-bar"
      />

      <div v-if="warnings.length" class="alert-list">
        <v-alert
          v-for="warning in warnings"
          :key="warning"
          type="warning"
          variant="tonal"
          density="comfortable"
          class="mb-2"
        >
          {{ warning }}
        </v-alert>
      </div>

      <div class="section-title">关账前检查项</div>
      <v-data-table
        :headers="checkHeaders"
        :items="checkItems"
        :loading="loading"
        item-key="code"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.category="{ item }">
          {{ checkCategoryLabel(item.category) }}
        </template>
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="checkStatusColor(item.status)">
            {{ checkStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.severity="{ item }">
          <v-chip size="small" variant="tonal" :color="severityColor(item.severity)">
            {{ severityLabel(item.severity) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.routePath"
            size="small"
            variant="text"
            color="primary"
            @click="openRoute(item.routePath)"
          >
            下钻
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">月结步骤</div>
      <v-data-table
        :headers="stepHeaders"
        :items="steps"
        :loading="loading"
        item-key="stepCode"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="moduleStatusColor(item.status)">
            {{ moduleStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.routePath"
            size="small"
            variant="text"
            color="primary"
            @click="openRoute(item.routePath)"
          >
            进入
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">检查批次留痕</div>
      <v-data-table
        :headers="batchHeaders"
        :items="batchRows"
        :loading="batchLoading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.fcloseStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="closeStatusColor(item.fcloseStatus)">
            {{ closeStatusLabel(item.fcloseStatus) }}
          </v-chip>
        </template>
        <template #item.fapplicationStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="applicationStatusColor(item.fapplicationStatus)">
            {{ applicationStatusLabel(item.fapplicationStatus) }}
          </v-chip>
        </template>
        <template #item.fcreatedTime="{ item }">
          {{ formatDateTime(item.fcreatedTime) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="canSubmitBatch(item)"
            size="small"
            variant="text"
            color="primary"
            @click="submitBatch(item)"
          >
            提交
          </v-btn>
          <v-btn
            v-if="canApproveBatch(item)"
            size="small"
            variant="text"
            color="success"
            @click="approveBatch(item)"
          >
            批准
          </v-btn>
          <v-btn
            v-if="canExecuteClose(item)"
            size="small"
            variant="text"
            color="error"
            :loading="executingBatchId === item.fid"
            @click="executeClose(item)"
          >
            执行关账
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">关账执行记录</div>
      <v-data-table
        :headers="executionHeaders"
        :items="executionRows"
        :loading="executionLoading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.fexecutionStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="executionStatusColor(item.fexecutionStatus)">
            {{ executionStatusLabel(item.fexecutionStatus) }}
          </v-chip>
        </template>
        <template #item.fexecutedTime="{ item }">
          {{ formatDateTime(item.fexecutedTime) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="canRolloverExecution(item)"
            size="small"
            variant="text"
            color="primary"
            :loading="rollingExecutionId === item.fid"
            @click="rolloverPeriod(item)"
          >
            启用下一期间
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">期间滚动记录</div>
      <v-data-table
        :headers="rolloverHeaders"
        :items="rolloverRows"
        :loading="rolloverLoading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.frolloverStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="rolloverStatusColor(item.frolloverStatus)">
            {{ rolloverStatusLabel(item.frolloverStatus) }}
          </v-chip>
        </template>
        <template #item.fcreatedNextPeriod="{ item }">
          {{ item.fcreatedNextPeriod ? '自动创建' : '复用已有' }}
        </template>
        <template #item.frolledTime="{ item }">
          {{ formatDateTime(item.frolledTime) }}
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import periodProcessApi from '@/api/periodProcess'
import {
  applicationStatusColor,
  applicationStatusLabel,
  checkCategoryLabel,
  checkStatusColor,
  checkStatusLabel,
  closeStatusColor,
  closeStatusLabel,
  currentPeriod,
  executionStatusColor,
  executionStatusLabel,
  loadOrgOptions,
  moduleStatusColor,
  moduleStatusLabel,
  periodSourceLabel,
  rolloverStatusColor,
  rolloverStatusLabel,
  severityColor,
  severityLabel,
} from './periodProcessShared'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orgOptions = ref([])
const checkItems = ref([])
const steps = ref([])
const warnings = ref([])
const batchRows = ref([])
const executionRows = ref([])
const rolloverRows = ref([])
const batchLoading = ref(false)
const batchSaving = ref(false)
const executionLoading = ref(false)
const executingBatchId = ref(null)
const rolloverLoading = ref(false)
const rollingExecutionId = ref(null)
const snackbar = ref({ show: false, text: '', color: 'info' })

const query = reactive({
  forg: null,
  period: currentPeriod(),
})

const meta = reactive({
  closeStatus: '',
  readinessScore: 0,
  canClose: false,
  baseCurrency: '',
  currentPeriod: '',
  periodSource: '',
  periodStatus: '',
  blockingCount: 0,
  warningCount: 0,
  pendingCount: 0,
  passedCount: 0,
  totalCheckCount: 0,
  periodVoucherCount: 0,
  postedVoucherCount: 0,
  pendingVoucherCount: 0,
  exceptionVoucherCount: 0,
})

const checkHeaders = [
  { title: '类别', key: 'category', value: 'category', width: 110 },
  { title: '检查项', key: 'name', value: 'name', width: 180 },
  { title: '状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '级别', key: 'severity', value: 'severity', width: 90, align: 'center' },
  { title: '说明', key: 'message', value: 'message' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
  { title: '关联数', key: 'relatedCount', value: 'relatedCount', width: 90, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 90, align: 'center' },
]

const stepHeaders = [
  { title: '序号', key: 'orderNo', value: 'orderNo', width: 80, align: 'center' },
  { title: '步骤', key: 'stepName', value: 'stepName', width: 150 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '摘要', key: 'summary', value: 'summary' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
  { title: '阻塞', key: 'blockingCount', value: 'blockingCount', width: 80, align: 'center' },
  { title: '预警', key: 'warningCount', value: 'warningCount', width: 80, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 90, align: 'center' },
]

const batchHeaders = [
  { title: '批次号', key: 'fbatchNo', value: 'fbatchNo', minWidth: 210 },
  { title: '期间', key: 'fperiod', value: 'fperiod', width: 100 },
  { title: '关账状态', key: 'fcloseStatus', value: 'fcloseStatus', width: 110, align: 'center' },
  { title: '准备度', key: 'freadinessScore', value: 'freadinessScore', width: 90, align: 'center' },
  { title: '阻塞', key: 'fblockingCount', value: 'fblockingCount', width: 80, align: 'center' },
  { title: '预警', key: 'fwarningCount', value: 'fwarningCount', width: 80, align: 'center' },
  { title: '申请状态', key: 'fapplicationStatus', value: 'fapplicationStatus', width: 110, align: 'center' },
  { title: '生成时间', key: 'fcreatedTime', value: 'fcreatedTime', width: 170 },
  { title: '操作', key: 'actions', value: 'actions', width: 130, align: 'center' },
]

const executionHeaders = [
  { title: '执行号', key: 'fexecutionNo', value: 'fexecutionNo', minWidth: 220 },
  { title: '批次号', key: 'fbatchNo', value: 'fbatchNo', minWidth: 210 },
  { title: '期间', key: 'fperiod', value: 'fperiod', width: 100 },
  { title: '执行状态', key: 'fexecutionStatus', value: 'fexecutionStatus', width: 110, align: 'center' },
  { title: '执行前', key: 'fbeforeStatus', value: 'fbeforeStatus', width: 90, align: 'center' },
  { title: '执行后', key: 'fafterStatus', value: 'fafterStatus', width: 90, align: 'center' },
  { title: '执行人', key: 'foperator', value: 'foperator', width: 100 },
  { title: '执行时间', key: 'fexecutedTime', value: 'fexecutedTime', width: 170 },
  { title: '操作', key: 'actions', value: 'actions', width: 150, align: 'center' },
]

const rolloverHeaders = [
  { title: '滚动编号', key: 'frolloverNo', value: 'frolloverNo', minWidth: 220 },
  { title: '关账执行号', key: 'fcloseExecutionNo', value: 'fcloseExecutionNo', minWidth: 220 },
  { title: '原期间', key: 'ffromPeriod', value: 'ffromPeriod', width: 100 },
  { title: '下一期间', key: 'ftoPeriod', value: 'ftoPeriod', width: 100 },
  { title: '状态', key: 'frolloverStatus', value: 'frolloverStatus', width: 100, align: 'center' },
  { title: '下一期间档案', key: 'fcreatedNextPeriod', value: 'fcreatedNextPeriod', width: 130, align: 'center' },
  { title: '操作人', key: 'foperator', value: 'foperator', width: 100 },
  { title: '滚动时间', key: 'frolledTime', value: 'frolledTime', width: 170 },
]

const summaryCards = computed(() => ([
  {
    label: '准备度',
    value: `${meta.readinessScore || 0}%`,
    tip: '按检查项通过情况计算',
    tone: meta.closeStatus === 'BLOCKED' ? 'tone-warning' : 'tone-success',
  },
  {
    label: '阻塞项',
    value: String(meta.blockingCount || 0),
    tip: '阻塞项为 0 才可能进入关账建议',
    tone: meta.blockingCount > 0 ? 'tone-danger' : 'tone-success',
  },
  {
    label: '待处理凭证',
    value: String(meta.pendingVoucherCount || 0),
    tip: '草稿、已提交、已审核视为待处理',
    tone: meta.pendingVoucherCount > 0 ? 'tone-warning' : 'tone-success',
  },
  {
    label: '检查项',
    value: `${meta.passedCount || 0}/${meta.totalCheckCount || 0}`,
    tip: '已通过 / 全部检查项',
    tone: 'tone-primary',
  },
]))

async function fetchData() {
  loading.value = true
  try {
    const res = await periodProcessApi.fetchMonthEndWorkbench({
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    const data = res.data || {}
    checkItems.value = data.checkItems || []
    steps.value = data.steps || []
    warnings.value = data.warnings || []
    assignMeta(data)
  } catch {
    checkItems.value = []
    steps.value = []
    warnings.value = ['月结工作台加载失败。']
    resetMeta()
  } finally {
    loading.value = false
  }
}

async function loadBatchList() {
  batchLoading.value = true
  try {
    const res = await periodProcessApi.listMonthEndBatches({
      page: 1,
      size: 10,
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    batchRows.value = res.data?.records || []
  } catch {
    batchRows.value = []
    showMsg('检查批次加载失败', 'warning')
  } finally {
    batchLoading.value = false
  }
}

async function loadExecutionList() {
  executionLoading.value = true
  try {
    const res = await periodProcessApi.listMonthEndCloseExecutions({
      page: 1,
      size: 10,
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    executionRows.value = res.data?.records || []
  } catch {
    executionRows.value = []
    showMsg('关账执行记录加载失败', 'warning')
  } finally {
    executionLoading.value = false
  }
}

async function loadRolloverList() {
  rolloverLoading.value = true
  try {
    const res = await periodProcessApi.listPeriodRollovers({
      page: 1,
      size: 10,
      forg: query.forg || undefined,
      fromPeriod: query.period || undefined,
    })
    rolloverRows.value = res.data?.records || []
  } catch {
    rolloverRows.value = []
    showMsg('期间滚动记录加载失败', 'warning')
  } finally {
    rolloverLoading.value = false
  }
}

async function createBatch() {
  batchSaving.value = true
  try {
    const res = await periodProcessApi.createMonthEndBatch({
      forg: query.forg || undefined,
      period: query.period || undefined,
      createdBy: 'WEB',
      remark: '月结工作台生成检查批次',
    })
    showMsg(`已生成检查批次 ${res.data?.fbatchNo || ''}`, 'success')
    await refreshAll()
  } catch {
    showMsg('生成检查批次失败', 'error')
  } finally {
    batchSaving.value = false
  }
}

async function submitBatch(item) {
  try {
    await periodProcessApi.submitMonthEndBatch(item.fid, {
      operator: 'WEB',
      remark: '月结工作台提交关账申请',
    })
    showMsg('关账申请已提交', 'success')
    await refreshAll()
  } catch {
    showMsg('提交关账申请失败', 'error')
  }
}

async function approveBatch(item) {
  try {
    await periodProcessApi.approveMonthEndBatch(item.fid, {
      operator: 'WEB',
      remark: '月结工作台批准关账申请',
    })
    showMsg('关账申请已批准', 'success')
    await refreshAll()
  } catch {
    showMsg('批准关账申请失败', 'error')
  }
}

async function executeClose(item) {
  const confirmed = window.confirm(`确认执行 ${item.fperiod || ''} 期间关账？执行后会计期间将关闭。`)
  if (!confirmed) return
  executingBatchId.value = item.fid
  try {
    await periodProcessApi.executeMonthEndClose(item.fid, {
      operator: 'WEB',
      remark: '月结工作台执行关账',
    })
    showMsg('关账执行成功', 'success')
    await refreshAll()
  } catch {
    showMsg('关账执行失败', 'error')
  } finally {
    executingBatchId.value = null
  }
}

async function rolloverPeriod(item) {
  const confirmed = window.confirm(`确认启用 ${nextPeriodLabel(item.fperiod)} 作为下一期间？`)
  if (!confirmed) return
  rollingExecutionId.value = item.fid
  try {
    const res = await periodProcessApi.rolloverPeriodFromExecution(item.fid, {
      operator: 'WEB',
      remark: '月结工作台启用下一期间',
    })
    showMsg(`已启用下一期间 ${res.data?.rollover?.ftoPeriod || ''}`, 'success')
    await refreshAll()
  } catch {
    showMsg('启用下一期间失败', 'error')
  } finally {
    rollingExecutionId.value = null
  }
}

function resetQuery() {
  query.period = currentPeriod()
  refreshAll()
}

async function refreshAll() {
  await Promise.all([fetchData(), loadBatchList(), loadExecutionList(), loadRolloverList()])
}

function assignMeta(data) {
  meta.closeStatus = data.closeStatus || ''
  meta.readinessScore = Number(data.readinessScore || 0)
  meta.canClose = Boolean(data.canClose)
  meta.baseCurrency = data.baseCurrency || ''
  meta.currentPeriod = data.currentPeriod || ''
  meta.periodSource = data.periodSource || ''
  meta.periodStatus = data.periodStatus || ''
  meta.blockingCount = Number(data.blockingCount || 0)
  meta.warningCount = Number(data.warningCount || 0)
  meta.pendingCount = Number(data.pendingCount || 0)
  meta.passedCount = Number(data.passedCount || 0)
  meta.totalCheckCount = Number(data.totalCheckCount || 0)
  meta.periodVoucherCount = Number(data.periodVoucherCount || 0)
  meta.postedVoucherCount = Number(data.postedVoucherCount || 0)
  meta.pendingVoucherCount = Number(data.pendingVoucherCount || 0)
  meta.exceptionVoucherCount = Number(data.exceptionVoucherCount || 0)
}

function resetMeta() {
  assignMeta({})
}

function openRoute(path) {
  router.push({
    path,
    query: {
      forg: query.forg || undefined,
      period: query.period || undefined,
    },
  })
}

function canSubmitBatch(item) {
  return item?.fapplicationStatus === 'DRAFT' && Number(item?.fblockingCount || 0) === 0
}

function canApproveBatch(item) {
  return item?.fapplicationStatus === 'SUBMITTED'
}

function canExecuteClose(item) {
  return item?.fapplicationStatus === 'APPROVED'
    && item?.fcloseStatus !== 'CLOSED'
    && Number(item?.fblockingCount || 0) === 0
}

function canRolloverExecution(item) {
  return item?.fexecutionStatus === 'SUCCESS'
    && item?.fafterStatus === 'CLOSED'
    && !rolloverRows.value.some((row) => Number(row.fcloseExecutionId) === Number(item.fid))
}

function nextPeriodLabel(period) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period || ''))
  if (!match) return '下一期间'
  const date = new Date(Number(match[1]), Number(match[2]), 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

function showMsg(text, color = 'info') {
  snackbar.value = { show: true, text, color }
}

onMounted(async () => {
  orgOptions.value = await loadOrgOptions().catch(() => [])
  if (!query.forg && orgOptions.value.length) {
    query.forg = orgOptions.value[0].value
  }
  if (typeof route.query?.forg === 'string' && route.query.forg) {
    query.forg = Number(route.query.forg) || query.forg
  }
  if (typeof route.query?.period === 'string' && route.query.period) {
    query.period = route.query.period
  }
  await fetchData()
  await loadBatchList()
  await loadExecutionList()
  await loadRolloverList()
})
</script>

<style scoped>
.month-end-page {
  padding: 24px;
}

.page-card {
  padding: 24px;
  border-radius: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-title {
  margin: 0 0 6px;
  color: #23447a;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  max-width: 820px;
  color: #59709c;
  font-size: 14px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.summary-row {
  margin-bottom: 12px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e6edf8;
  border-radius: 14px;
  padding: 18px;
  background: #fff;
}

.summary-label {
  color: #5f7399;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.summary-tip {
  margin-top: 8px;
  color: #7488ad;
  font-size: 12px;
}

.readiness-bar {
  margin: 6px 0 18px;
}

.section-title {
  margin: 22px 0 12px;
  color: #274982;
  font-size: 16px;
  font-weight: 700;
}

.tone-primary {
  color: #2450b2;
}

.tone-success {
  color: #1f8b57;
}

.tone-warning {
  color: #c68218;
}

.tone-danger {
  color: #c94343;
}
</style>
