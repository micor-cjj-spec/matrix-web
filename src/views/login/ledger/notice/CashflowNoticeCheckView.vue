<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">现金流通知单勾稽</h2>
          <div class="page-subtitle">
            将历史现金流通知单与当前补充资料扫描结果进行勾稽，定位仍需补录和复核的凭证，同时识别已自然解除的问题。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="4">
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
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="query.period" label="期间" density="comfortable" placeholder="2026-03" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="query.status" :items="statusOptions" label="通知状态" density="comfortable" />
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
          {{ cashflowSourceLabel(item.sourceCode) }}
        </template>
        <template #item.currentSourceCode="{ item }">
          {{ cashflowSourceLabel(item.currentSourceCode) }}
        </template>
        <template #item.snapshotAmount="{ item }">
          {{ formatAmount(item.snapshotAmount) }}
        </template>
        <template #item.currentAmount="{ item }">
          {{ formatAmount(item.currentAmount) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucher(item)">
            查看凭证
          </v-btn>
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
  currentPeriod,
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
const orgOptions = ref([])
const summary = reactive({
  noticeCount: 0,
  ongoingCount: 0,
  resolvedCount: 0,
  snapshotAmount: 0,
  currentAmount: 0,
})

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  status: 'ALL',
  currency: 'CNY',
})

const headers = [
  { title: '勾稽结果', key: 'matchStatus', value: 'matchStatus', width: 110, align: 'center' },
  { title: '通知状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '历史来源', key: 'sourceCode', value: 'sourceCode', width: 120, align: 'center' },
  { title: '当前来源', key: 'currentSourceCode', value: 'currentSourceCode', width: 120, align: 'center' },
  { title: '凭证号', key: 'voucherNumber', value: 'voucherNumber', width: 180 },
  { title: '通知快照金额', key: 'snapshotAmount', value: 'snapshotAmount', width: 130, align: 'end' },
  { title: '当前金额', key: 'currentAmount', value: 'currentAmount', width: 130, align: 'end' },
  { title: '当前活动分类', key: 'currentCategoryCode', value: 'currentCategoryCode', width: 140 },
  { title: '当前说明', key: 'currentMessage', value: 'currentMessage', minWidth: 260 },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '通知数', value: String(summary.noticeCount), tip: '参与本次勾稽的现金流通知单', tone: 'tone-primary' },
  { label: '仍需处理', value: String(summary.ongoingCount), tip: `已解除 ${summary.resolvedCount} 张`, tone: 'tone-warning' },
  { label: '通知快照金额', value: formatAmount(summary.snapshotAmount), tip: '历史通知单中的问题金额', tone: 'tone-danger' },
  { label: '当前金额', value: formatAmount(summary.currentAmount), tip: '最新扫描结果中的问题金额', tone: 'tone-success' },
])

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname || '-'}`,
      value: item.fid,
    }))
    if (!query.orgId && records.length) {
      query.orgId = records[0].fid
    }
  } catch (error) {
    orgOptions.value = []
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await internalNoticeApi.fetchCashflowNoticeReconcile({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      status: query.status,
      currency: query.currency || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.noticeCount = Number(data.noticeCount || 0)
    summary.ongoingCount = Number(data.ongoingCount || 0)
    summary.resolvedCount = Number(data.resolvedCount || 0)
    summary.snapshotAmount = Number(data.snapshotAmount || 0)
    summary.currentAmount = Number(data.currentAmount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['现金流通知单勾稽加载失败。']
    summary.noticeCount = 0
    summary.ongoingCount = 0
    summary.resolvedCount = 0
    summary.snapshotAmount = 0
    summary.currentAmount = 0
  } finally {
    loading.value = false
  }
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
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
