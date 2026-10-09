<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">现金流通知单</h2>
          <div class="page-subtitle">
            根据现金流补充资料和待复核凭证生成内部通知单，帮助财务团队及时补录现金流项目、处理多编码复核以及确认现金划转事项。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn color="warning" variant="tonal" :loading="generating" @click="generateNotice">生成通知单</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-select
            v-model="query.orgId"
            :items="orgOptions"
            item-title="label"
            item-value="value"
            label="业务单元"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.trim="query.period" label="期间" density="comfortable" placeholder="2026-03" clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.status" :items="statusOptions" label="通知状态" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.severity" :items="severityOptions" label="紧急程度" density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="query.sourceCode" :items="cashflowSourceOptions" label="问题来源" density="comfortable" />
        </v-col>
      </v-row>

      <v-alert v-if="resultMessage" type="success" variant="tonal" class="mb-4">
        {{ resultMessage }}
      </v-alert>

      <v-row dense class="summary-row">
        <v-col v-for="card in summaryCards" :key="card.label" cols="12" md="3">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value" :class="card.tone">{{ card.value }}</div>
            <div v-if="card.tip" class="summary-tip">{{ card.tip }}</div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="warnings.length" class="alert-list">
        <v-alert v-for="warning in warnings" :key="warning" type="warning" variant="tonal" density="comfortable" class="mb-2">
          {{ warning }}
        </v-alert>
      </div>

      <v-data-table :headers="headers" :items="rows" :loading="loading" item-key="fid" hide-default-footer class="elevation-0">
        <template #item.severity="{ item }">
          <v-chip size="small" variant="tonal" :color="severityColor(item.severity)">
            {{ severityLabel(item.severity) }}
          </v-chip>
        </template>
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.sourceCode="{ item }">
          {{ cashflowSourceLabel(item.sourceCode) }}
        </template>
        <template #item.amount="{ item }">
          {{ formatAmount(item.amount) }}
        </template>
        <template #item.actions="{ item }">
          <div class="action-group">
            <v-btn size="small" variant="text" color="primary" @click="openVoucher(item)">查看凭证</v-btn>
            <v-btn size="small" variant="text" color="primary" @click="openReconcile">勾稽</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import internalNoticeApi from '@/api/internalNotice'
import {
  cashflowSourceLabel,
  cashflowSourceOptions,
  currentPeriod,
  formatAmount,
  severityColor,
  severityLabel,
  severityOptions,
  statusColor,
  statusLabel,
  statusOptions,
} from './internalNoticeShared'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const generating = ref(false)
const rows = ref([])
const warnings = ref([])
const orgOptions = ref([])
const resultMessage = ref('')
const summary = reactive({
  noticeCount: 0,
  openCount: 0,
  resolvedCount: 0,
  highCount: 0,
  amount: 0,
})

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  status: 'OPEN',
  severity: '',
  sourceCode: '',
  currency: 'CNY',
})

const headers = [
  { title: '紧急程度', key: 'severity', value: 'severity', width: 100, align: 'center' },
  { title: '通知状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '问题来源', key: 'sourceCode', value: 'sourceCode', width: 120, align: 'center' },
  { title: '凭证号', key: 'voucherNumber', value: 'voucherNumber', width: 180 },
  { title: '标题', key: 'title', value: 'title', minWidth: 180 },
  { title: '分类/活动', key: 'categoryCode', value: 'categoryCode', width: 140 },
  { title: '金额', key: 'amount', value: 'amount', width: 120, align: 'end' },
  { title: '说明', key: 'message', value: 'message', minWidth: 240 },
  { title: '建议', key: 'suggestion', value: 'suggestion', minWidth: 220 },
  { title: '操作', key: 'actions', value: 'actions', width: 140, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '通知数', value: String(summary.noticeCount), tip: `处理中 ${summary.openCount} 张`, tone: 'tone-primary' },
  { label: '高优先级', value: String(summary.highCount), tip: `已解决 ${summary.resolvedCount} 张`, tone: 'tone-warning' },
  { label: '通知金额', value: formatAmount(summary.amount), tip: '按通知快照记录的金额汇总', tone: 'tone-success' },
  { label: '未解决占比', value: summary.noticeCount ? `${((summary.openCount / summary.noticeCount) * 100).toFixed(2)}%` : '0.00%', tip: '处理中通知 / 全部通知', tone: 'tone-danger' },
])

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname || '-'}`,
      value: item.fid,
    }))
  } catch (error) {
    orgOptions.value = []
  }
}

async function fetchData() {
  loading.value = true
  resultMessage.value = ''
  try {
    const res = await internalNoticeApi.fetchCashflowNotices({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      status: query.status,
      severity: query.severity || undefined,
      sourceCode: query.sourceCode || undefined,
      currency: query.currency || undefined,
    })
    applyData(res.data || {})
  } catch (error) {
    rows.value = []
    warnings.value = ['现金流通知单加载失败。']
    resetSummary()
  } finally {
    loading.value = false
  }
}

async function generateNotice() {
  generating.value = true
  try {
    const res = await internalNoticeApi.generateCashflowNotices({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
    })
    const data = res.data || {}
    resultMessage.value = data.message || '现金流通知单已生成。'
    applyData(data)
  } catch (error) {
    warnings.value = [error?.response?.data?.message || '现金流通知单生成失败。']
  } finally {
    generating.value = false
  }
}

function applyData(data) {
  rows.value = data.rows || []
  warnings.value = data.warnings || []
  summary.noticeCount = Number(data.noticeCount || 0)
  summary.openCount = Number(data.openCount || 0)
  summary.resolvedCount = Number(data.resolvedCount || 0)
  summary.highCount = Number(data.highCount || 0)
  summary.amount = Number(data.amount || 0)
}

function resetSummary() {
  summary.noticeCount = 0
  summary.openCount = 0
  summary.resolvedCount = 0
  summary.highCount = 0
  summary.amount = 0
}

function openVoucher(item) {
  const routeData = router.resolve({
    path: '/ledger/voucher',
    query: {
      number: item.voucherNumber || undefined,
    },
  })
  window.open(routeData.href, '_blank')
}

function openReconcile() {
  router.push({
    path: '/ledger/cashflow-notice-check',
    query: {
      orgId: query.orgId || undefined,
      period: query.period || undefined,
    },
  })
}

function initFromRoute() {
  if (route.query.orgId) {
    query.orgId = Number(route.query.orgId)
  }
  if (typeof route.query.period === 'string' && route.query.period) {
    query.period = route.query.period
  }
  if (route.query.status) {
    query.status = String(route.query.status).toUpperCase()
  }
  if (typeof route.query.severity === 'string') {
    query.severity = route.query.severity
  }
  if (typeof route.query.sourceCode === 'string') {
    query.sourceCode = route.query.sourceCode
  }
}

onMounted(async () => {
  initFromRoute()
  await loadOrgOptions()
  await fetchData()
})
</script>

<style scoped>
.page { padding: 24px; }
.page-card { padding: 24px; border-radius: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 0; color: #1d3f8f; font-size: 24px; font-weight: 700; }
.page-subtitle { margin-top: 8px; color: #5d6b85; font-size: 14px; line-height: 1.7; }
.page-actions { display: flex; gap: 8px; }
.summary-row { margin-bottom: 18px; }
.summary-card { height: 100%; border: 1px solid #e8eef7; border-radius: 14px; background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%); padding: 18px; }
.summary-label { color: #6d7891; font-size: 13px; }
.summary-value { margin-top: 8px; font-size: 28px; font-weight: 700; }
.summary-tip { margin-top: 6px; color: #8793ac; font-size: 12px; }
.alert-list { margin-bottom: 16px; }
.action-group { display: flex; gap: 4px; justify-content: center; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
