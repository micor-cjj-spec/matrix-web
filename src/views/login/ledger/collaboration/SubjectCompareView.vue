<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">科目余额对照</h2>
          <div class="page-subtitle">
            对照凭证分录汇总与总账分录汇总在同一期间内的期初、发生和期末差异，快速定位过账或冲销链路中的异常科目。
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
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="query.accountCode"
            :items="accountOptions"
            item-title="label"
            item-value="value"
            label="科目编码"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-switch v-model="query.diffOnly" color="primary" inset hide-details label="仅看差异" />
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

      <v-data-table :headers="headers" :items="rows" :loading="loading" item-key="accountCode" hide-default-footer class="elevation-0">
        <template #item.matchStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="matchStatusColor(item.matchStatus)">
            {{ matchStatusLabel(item.matchStatus) }}
          </v-chip>
        </template>
        <template #item.voucherOpeningBalance="{ item }">{{ formatAmount(item.voucherOpeningBalance) }}</template>
        <template #item.glOpeningBalance="{ item }">{{ formatAmount(item.glOpeningBalance) }}</template>
        <template #item.openingDiff="{ item }">{{ formatAmount(item.openingDiff) }}</template>
        <template #item.voucherPeriodDebit="{ item }">{{ formatAmount(item.voucherPeriodDebit) }}</template>
        <template #item.glPeriodDebit="{ item }">{{ formatAmount(item.glPeriodDebit) }}</template>
        <template #item.periodDebitDiff="{ item }">{{ formatAmount(item.periodDebitDiff) }}</template>
        <template #item.voucherPeriodCredit="{ item }">{{ formatAmount(item.voucherPeriodCredit) }}</template>
        <template #item.glPeriodCredit="{ item }">{{ formatAmount(item.glPeriodCredit) }}</template>
        <template #item.periodCreditDiff="{ item }">{{ formatAmount(item.periodCreditDiff) }}</template>
        <template #item.voucherClosingBalance="{ item }">{{ formatAmount(item.voucherClosingBalance) }}</template>
        <template #item.glClosingBalance="{ item }">{{ formatAmount(item.glClosingBalance) }}</template>
        <template #item.closingDiff="{ item }">{{ formatAmount(item.closingDiff) }}</template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openSubjectBalance(item)">余额表</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ledgerCollaborationApi from '@/api/ledgerCollaboration'
import { loadAccountOptions } from '../query/ledgerQueryShared'
import {
  createDefaultDateRange,
  formatAmount,
  matchStatusColor,
  matchStatusLabel,
} from './ledgerCollaborationShared'

const router = useRouter()
const dateRange = createDefaultDateRange()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const accountOptions = ref([])
const summary = reactive({
  accountCount: 0,
  diffAccountCount: 0,
  voucherDebitTotal: 0,
  glDebitTotal: 0,
  voucherCreditTotal: 0,
  glCreditTotal: 0,
})

const query = reactive({
  startDate: dateRange.startDate,
  endDate: dateRange.endDate,
  accountCode: '',
  diffOnly: true,
})

const headers = [
  { title: '状态', key: 'matchStatus', value: 'matchStatus', width: 90, align: 'center' },
  { title: '科目编码', key: 'accountCode', value: 'accountCode', width: 120 },
  { title: '科目名称', key: 'accountName', value: 'accountName', width: 180 },
  { title: '凭证期初', key: 'voucherOpeningBalance', value: 'voucherOpeningBalance', width: 110, align: 'end' },
  { title: '总账期初', key: 'glOpeningBalance', value: 'glOpeningBalance', width: 110, align: 'end' },
  { title: '期初差异', key: 'openingDiff', value: 'openingDiff', width: 110, align: 'end' },
  { title: '凭证借方', key: 'voucherPeriodDebit', value: 'voucherPeriodDebit', width: 110, align: 'end' },
  { title: '总账借方', key: 'glPeriodDebit', value: 'glPeriodDebit', width: 110, align: 'end' },
  { title: '借方差异', key: 'periodDebitDiff', value: 'periodDebitDiff', width: 110, align: 'end' },
  { title: '凭证贷方', key: 'voucherPeriodCredit', value: 'voucherPeriodCredit', width: 110, align: 'end' },
  { title: '总账贷方', key: 'glPeriodCredit', value: 'glPeriodCredit', width: 110, align: 'end' },
  { title: '贷方差异', key: 'periodCreditDiff', value: 'periodCreditDiff', width: 110, align: 'end' },
  { title: '期末差异', key: 'closingDiff', value: 'closingDiff', width: 110, align: 'end' },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '科目数', value: String(summary.accountCount), tip: `差异科目 ${summary.diffAccountCount} 个`, tone: 'tone-primary' },
  { label: '凭证借方合计', value: formatAmount(summary.voucherDebitTotal), tip: '按凭证分录口径汇总', tone: 'tone-primary' },
  { label: '总账借方合计', value: formatAmount(summary.glDebitTotal), tip: '按总账分录口径汇总', tone: 'tone-success' },
  { label: '借方差额', value: formatAmount(Number(summary.voucherDebitTotal || 0) - Number(summary.glDebitTotal || 0)), tip: '凭证借方减总账借方', tone: 'tone-danger' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerCollaborationApi.fetchSubjectBalanceCompare({
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      accountCode: query.accountCode || undefined,
      diffOnly: query.diffOnly,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.accountCount = Number(data.accountCount || 0)
    summary.diffAccountCount = Number(data.diffAccountCount || 0)
    summary.voucherDebitTotal = Number(data.voucherDebitTotal || 0)
    summary.glDebitTotal = Number(data.glDebitTotal || 0)
    summary.voucherCreditTotal = Number(data.voucherCreditTotal || 0)
    summary.glCreditTotal = Number(data.glCreditTotal || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['科目余额对照加载失败。']
    summary.accountCount = 0
    summary.diffAccountCount = 0
    summary.voucherDebitTotal = 0
    summary.glDebitTotal = 0
    summary.voucherCreditTotal = 0
    summary.glCreditTotal = 0
  } finally {
    loading.value = false
  }
}

function openSubjectBalance(item) {
  router.push({
    path: '/ledger/subject-balance',
    query: {
      startDate: query.startDate,
      endDate: query.endDate,
      accountCode: item.accountCode || undefined,
    },
  })
}

onMounted(async () => {
  try {
    accountOptions.value = await loadAccountOptions()
  } catch (error) {
    accountOptions.value = []
  }
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
