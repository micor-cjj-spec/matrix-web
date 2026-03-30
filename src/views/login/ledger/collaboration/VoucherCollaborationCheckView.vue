<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">凭证协同检查</h2>
          <div class="page-subtitle">
            校验凭证表头、分录和总账分录之间的一致性，优先识别分录缺失、借贷不平、总账分录缺失或金额不符等问题。
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
          <v-select v-model="query.status" :items="voucherStatusOptions" label="凭证状态" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.issueCode" :items="issueOptions" label="问题类型" density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.severity" :items="severityOptions" label="问题等级" density="comfortable" />
        </v-col>
      </v-row>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-switch v-model="query.onlyIssue" color="primary" inset hide-details label="仅看异常" />
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

      <v-data-table :headers="headers" :items="rows" :loading="loading" item-key="voucherId" hide-default-footer class="elevation-0">
        <template #item.severity="{ item }">
          <v-chip size="small" variant="tonal" :color="severityColor(item.severity)">
            {{ severityLabel(item.severity) }}
          </v-chip>
        </template>
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="voucherStatusColor(item.status)">
            {{ voucherStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.headerAmount="{ item }">{{ formatAmount(item.headerAmount) }}</template>
        <template #item.lineDebit="{ item }">{{ formatAmount(item.lineDebit) }}</template>
        <template #item.lineCredit="{ item }">{{ formatAmount(item.lineCredit) }}</template>
        <template #item.glDebit="{ item }">{{ formatAmount(item.glDebit) }}</template>
        <template #item.glCredit="{ item }">{{ formatAmount(item.glCredit) }}</template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucher(item.voucherNumber)">查看凭证</v-btn>
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
  issueOptions,
  severityColor,
  severityLabel,
  severityOptions,
  voucherStatusColor,
  voucherStatusLabel,
  voucherStatusOptions,
} from './ledgerCollaborationShared'

const router = useRouter()
const dateRange = createDefaultDateRange()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  voucherCount: 0,
  issueCount: 0,
  issueVoucherCount: 0,
  highCount: 0,
  healthyCount: 0,
})

const query = reactive({
  startDate: dateRange.startDate,
  endDate: dateRange.endDate,
  status: 'ALL',
  issueCode: 'ALL',
  severity: 'ALL',
  onlyIssue: true,
})

const headers = [
  { title: '等级', key: 'severity', value: 'severity', width: 90, align: 'center' },
  { title: '问题类型', key: 'issueCode', value: 'issueCode', width: 160 },
  { title: '凭证号', key: 'voucherNumber', value: 'voucherNumber', width: 160 },
  { title: '日期', key: 'voucherDate', value: 'voucherDate', width: 120 },
  { title: '状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '表头金额', key: 'headerAmount', value: 'headerAmount', width: 110, align: 'end' },
  { title: '借方合计', key: 'lineDebit', value: 'lineDebit', width: 110, align: 'end' },
  { title: '贷方合计', key: 'lineCredit', value: 'lineCredit', width: 110, align: 'end' },
  { title: '总账借方', key: 'glDebit', value: 'glDebit', width: 110, align: 'end' },
  { title: '总账贷方', key: 'glCredit', value: 'glCredit', width: 110, align: 'end' },
  { title: '说明', key: 'message', value: 'message', minWidth: 220 },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '扫描凭证数', value: String(summary.voucherCount), tip: '本次参与协同检查的凭证数', tone: 'tone-primary' },
  { label: '异常条数', value: String(summary.issueCount), tip: `涉及凭证 ${summary.issueVoucherCount} 张`, tone: 'tone-warning' },
  { label: '高风险问题', value: String(summary.highCount), tip: '建议优先处理的协同问题', tone: 'tone-danger' },
  { label: '健康凭证', value: String(summary.healthyCount), tip: '当前条件下未发现异常的凭证', tone: 'tone-success' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerCollaborationApi.fetchVoucherCheck({
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      status: query.status,
      issueCode: query.issueCode,
      severity: query.severity,
      onlyIssue: query.onlyIssue,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.voucherCount = Number(data.voucherCount || 0)
    summary.issueCount = Number(data.issueCount || 0)
    summary.issueVoucherCount = Number(data.issueVoucherCount || 0)
    summary.highCount = Number(data.highCount || 0)
    summary.healthyCount = Number(data.healthyCount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['凭证协同检查加载失败。']
    summary.voucherCount = 0
    summary.issueCount = 0
    summary.issueVoucherCount = 0
    summary.highCount = 0
    summary.healthyCount = 0
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
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
