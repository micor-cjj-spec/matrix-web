<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">对冲凭证</h2>
          <div class="page-subtitle">
            按冲销链路展示原凭证与对冲凭证的配对情况，重点识别缺少原凭证或缺少对冲凭证的孤儿记录。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-text-field v-model="query.startDate" type="date" label="开始日期" density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="query.endDate" type="date" label="结束日期" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.matchStatus" :items="offsetMatchOptions" label="配对状态" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model.trim="query.keyword" label="关键字" density="comfortable" placeholder="凭证号、摘要、备注" clearable />
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

      <v-data-table :headers="headers" :items="rows" :loading="loading" item-key="reverseNumber" hide-default-footer class="elevation-0">
        <template #item.matchStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="matchStatusColor(item.matchStatus)">
            {{ matchStatusLabel(item.matchStatus) }}
          </v-chip>
        </template>
        <template #item.originalAmount="{ item }">{{ formatAmount(item.originalAmount) }}</template>
        <template #item.reverseAmount="{ item }">{{ formatAmount(item.reverseAmount) }}</template>
        <template #item.amountDiff="{ item }">{{ formatAmount(item.amountDiff) }}</template>
        <template #item.actions="{ item }">
          <div class="action-group">
            <v-btn size="small" variant="text" color="primary" @click="openVoucher(item.originalNumber)">原凭证</v-btn>
            <v-btn size="small" variant="text" color="primary" @click="openVoucher(item.reverseNumber)">对冲凭证</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ledgerCollaborationApi from '@/api/ledgerCollaboration'
import {
  createDefaultDateRange,
  formatAmount,
  matchStatusColor,
  matchStatusLabel,
  offsetMatchOptions,
} from './ledgerCollaborationShared'

const router = useRouter()
const dateRange = createDefaultDateRange()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  pairCount: 0,
  orphanCount: 0,
  originalAmount: 0,
  reverseAmount: 0,
})

const query = reactive({
  startDate: dateRange.startDate,
  endDate: dateRange.endDate,
  matchStatus: 'ALL',
  keyword: '',
})

const headers = [
  { title: '配对状态', key: 'matchStatus', value: 'matchStatus', width: 110, align: 'center' },
  { title: '原凭证号', key: 'originalNumber', value: 'originalNumber', width: 160 },
  { title: '原凭证日期', key: 'originalDate', value: 'originalDate', width: 120 },
  { title: '原凭证金额', key: 'originalAmount', value: 'originalAmount', width: 120, align: 'end' },
  { title: '对冲凭证号', key: 'reverseNumber', value: 'reverseNumber', width: 160 },
  { title: '对冲凭证日期', key: 'reverseDate', value: 'reverseDate', width: 120 },
  { title: '对冲金额', key: 'reverseAmount', value: 'reverseAmount', width: 120, align: 'end' },
  { title: '差额', key: 'amountDiff', value: 'amountDiff', width: 100, align: 'end' },
  { title: '说明', key: 'message', value: 'message', minWidth: 240 },
  { title: '操作', key: 'actions', value: 'actions', width: 150, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '已配对', value: String(summary.pairCount), tip: '原凭证与对冲凭证都已找到', tone: 'tone-success' },
  { label: '孤儿记录', value: String(summary.orphanCount), tip: '仍需补查链路信息', tone: 'tone-warning' },
  { label: '原凭证金额', value: formatAmount(summary.originalAmount), tip: '当前结果中的原凭证金额合计', tone: 'tone-primary' },
  { label: '对冲金额', value: formatAmount(summary.reverseAmount), tip: '当前结果中的对冲金额合计', tone: 'tone-danger' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerCollaborationApi.fetchOffsetVouchers({
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      matchStatus: query.matchStatus,
      keyword: query.keyword || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.pairCount = Number(data.pairCount || 0)
    summary.orphanCount = Number(data.orphanCount || 0)
    summary.originalAmount = Number(data.originalAmount || 0)
    summary.reverseAmount = Number(data.reverseAmount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['对冲凭证加载失败。']
    summary.pairCount = 0
    summary.orphanCount = 0
    summary.originalAmount = 0
    summary.reverseAmount = 0
  } finally {
    loading.value = false
  }
}

function openVoucher(number) {
  if (!number) return
  const routeData = router.resolve({ path: '/ledger/voucher', query: { number } })
  window.open(routeData.href, '_blank')
}

onMounted(fetchData)
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
