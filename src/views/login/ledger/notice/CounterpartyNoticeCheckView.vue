<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来通知单勾稽</h2>
          <div class="page-subtitle">
            将已生成的往来通知单与当前账龄风险扫描结果进行勾稽，区分仍需处理的问题和已自然解除的问题，方便团队关闭历史通知。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="2">
          <v-select v-model="query.docTypeRoot" :items="docTypeRootOptions" label="往来类型" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.status" :items="statusOptions" label="通知状态" density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="query.asOfDate" type="date" label="统计日期" density="comfortable" />
        </v-col>
      </v-row>

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
        <template #item.matchStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="matchStatusColor(item.matchStatus)">
            {{ matchStatusLabel(item.matchStatus) }}
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
        <template #item.snapshotOpenAmount="{ item }">
          {{ formatAmount(item.snapshotOpenAmount) }}
        </template>
        <template #item.currentOpenAmount="{ item }">
          {{ formatAmount(item.currentOpenAmount) }}
        </template>
        <template #item.improvementAmount="{ item }">
          {{ formatAmount(item.improvementAmount) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openStatement(item)">
            对账单
          </v-btn>
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
  matchStatusColor,
  matchStatusLabel,
  statusColor,
  statusLabel,
  statusOptions,
} from './internalNoticeShared'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  noticeCount: 0,
  ongoingCount: 0,
  resolvedCount: 0,
  snapshotOpenAmount: 0,
  currentOpenAmount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  status: 'ALL',
  asOfDate: currentDate(),
})

const headers = [
  { title: '勾稽结果', key: 'matchStatus', value: 'matchStatus', width: 110, align: 'center' },
  { title: '通知状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '异常类型', key: 'sourceCode', value: 'sourceCode', width: 110, align: 'center' },
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 150 },
  { title: '标题', key: 'title', value: 'title', minWidth: 180 },
  { title: '通知快照未清', key: 'snapshotOpenAmount', value: 'snapshotOpenAmount', width: 130, align: 'end' },
  { title: '当前未清', key: 'currentOpenAmount', value: 'currentOpenAmount', width: 130, align: 'end' },
  { title: '改善金额', key: 'improvementAmount', value: 'improvementAmount', width: 130, align: 'end' },
  { title: '当前说明', key: 'currentMessage', value: 'currentMessage', minWidth: 260 },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '通知数', value: String(summary.noticeCount), tip: '参与本次勾稽的历史通知单', tone: 'tone-primary' },
  { label: '仍需处理', value: String(summary.ongoingCount), tip: `已解除 ${summary.resolvedCount} 张`, tone: 'tone-warning' },
  { label: '通知快照未清', value: formatAmount(summary.snapshotOpenAmount), tip: '生成通知单时记录的未清金额', tone: 'tone-danger' },
  { label: '当前未清', value: formatAmount(summary.currentOpenAmount), tip: '最新扫描结果中的未清金额', tone: 'tone-success' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await internalNoticeApi.fetchCounterpartyNoticeReconcile({
      docTypeRoot: query.docTypeRoot,
      status: query.status,
      asOfDate: query.asOfDate || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.noticeCount = Number(data.noticeCount || 0)
    summary.ongoingCount = Number(data.ongoingCount || 0)
    summary.resolvedCount = Number(data.resolvedCount || 0)
    summary.snapshotOpenAmount = Number(data.snapshotOpenAmount || 0)
    summary.currentOpenAmount = Number(data.currentOpenAmount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['往来通知单勾稽加载失败。']
    summary.noticeCount = 0
    summary.ongoingCount = 0
    summary.resolvedCount = 0
    summary.snapshotOpenAmount = 0
    summary.currentOpenAmount = 0
  } finally {
    loading.value = false
  }
}

function openStatement(item) {
  router.push({
    path: '/ledger/counterparty-statement',
    query: {
      docTypeRoot: query.docTypeRoot,
      counterparty: item.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
      openOnly: item.matchStatus === 'ONGOING',
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
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
