<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来通知单</h2>
          <div class="page-subtitle">
            根据往来账龄与风险扫描结果，生成面向应收或应付团队的内部通知单。第一期聚焦超额度、超期和长期未清三类异常。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn color="warning" variant="tonal" :loading="generating" @click="generateNotice">生成通知单</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="2">
          <v-select v-model="query.docTypeRoot" :items="docTypeRootOptions" label="往来类型" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.status" :items="statusOptions" label="通知状态" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.severity" :items="severityOptions" label="紧急程度" density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="query.asOfDate" type="date" label="统计日期" density="comfortable" />
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
          {{ counterpartySourceLabel(item.sourceCode) }}
        </template>
        <template #item.openAmount="{ item }">
          {{ formatAmount(item.openAmount) }}
        </template>
        <template #item.actions="{ item }">
          <div class="action-group">
            <v-btn size="small" variant="text" color="primary" @click="openStatement(item)">对账单</v-btn>
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
import internalNoticeApi from '@/api/internalNotice'
import {
  counterpartySourceLabel,
  currentDate,
  docTypeRootOptions,
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
const resultMessage = ref('')
const summary = reactive({
  noticeCount: 0,
  openCount: 0,
  resolvedCount: 0,
  highCount: 0,
  amount: 0,
  openAmount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  status: 'OPEN',
  severity: '',
  asOfDate: currentDate(),
})

const headers = [
  { title: '紧急程度', key: 'severity', value: 'severity', width: 100, align: 'center' },
  { title: '通知状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '异常类型', key: 'sourceCode', value: 'sourceCode', width: 110, align: 'center' },
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 160 },
  { title: '标题', key: 'title', value: 'title', minWidth: 180 },
  { title: '未清金额', key: 'openAmount', value: 'openAmount', width: 120, align: 'end' },
  { title: '通知日期', key: 'noticeTime', value: 'noticeTime', width: 180 },
  { title: '处理建议', key: 'suggestion', value: 'suggestion', minWidth: 220 },
  { title: '操作', key: 'actions', value: 'actions', width: 130, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '通知数', value: String(summary.noticeCount), tip: `处理中 ${summary.openCount} 张`, tone: 'tone-primary' },
  { label: '高优先级', value: String(summary.highCount), tip: `已解决 ${summary.resolvedCount} 张`, tone: 'tone-warning' },
  { label: '通知金额', value: formatAmount(summary.amount), tip: '全部通知的金额汇总', tone: 'tone-success' },
  { label: '未清金额', value: formatAmount(summary.openAmount), tip: '按通知快照记录的未清金额', tone: 'tone-danger' },
])

async function fetchData() {
  loading.value = true
  resultMessage.value = ''
  try {
    const res = await internalNoticeApi.fetchCounterpartyNotices({
      docTypeRoot: query.docTypeRoot,
      status: query.status,
      severity: query.severity || undefined,
      asOfDate: query.asOfDate || undefined,
    })
    applyData(res.data || {})
  } catch (error) {
    rows.value = []
    warnings.value = ['往来通知单加载失败。']
    resetSummary()
  } finally {
    loading.value = false
  }
}

async function generateNotice() {
  generating.value = true
  try {
    const res = await internalNoticeApi.generateCounterpartyNotices({
      docTypeRoot: query.docTypeRoot,
      asOfDate: query.asOfDate || undefined,
    })
    const data = res.data || {}
    resultMessage.value = data.message || '往来通知单已生成。'
    applyData(data)
  } catch (error) {
    warnings.value = [error?.response?.data?.message || '往来通知单生成失败。']
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
  summary.openAmount = Number(data.openAmount || 0)
}

function resetSummary() {
  summary.noticeCount = 0
  summary.openCount = 0
  summary.resolvedCount = 0
  summary.highCount = 0
  summary.amount = 0
  summary.openAmount = 0
}

function openStatement(item) {
  router.push({
    path: '/ledger/counterparty-statement',
    query: {
      docTypeRoot: query.docTypeRoot,
      counterparty: item.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
    },
  })
}

function openReconcile() {
  router.push({
    path: '/ledger/counterparty-notice-check',
    query: {
      docTypeRoot: query.docTypeRoot,
      asOfDate: query.asOfDate || undefined,
    },
  })
}

function initFromRoute() {
  if (route.query.docTypeRoot) {
    query.docTypeRoot = String(route.query.docTypeRoot).toUpperCase()
  }
  if (route.query.status) {
    query.status = String(route.query.status).toUpperCase()
  }
  if (typeof route.query.severity === 'string') {
    query.severity = route.query.severity
  }
  if (typeof route.query.asOfDate === 'string' && route.query.asOfDate) {
    query.asOfDate = route.query.asOfDate
  }
}

onMounted(() => {
  initFromRoute()
  fetchData()
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
