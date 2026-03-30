<template>
  <div class="ledger-query-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">辅助明细账</h2>
          <div class="page-subtitle">按现金流项目与科目组合下钻到分录层级，展示辅助维度明细流水。</div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-text-field v-model="query.startDate" type="date" label="开始日期" density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="query.endDate" type="date" label="结束日期" density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-autocomplete v-model="query.accountCode" :items="accountOptions" item-title="label" item-value="value" label="科目编码" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-autocomplete v-model="query.dimensionCode" :items="dimensionOptions" item-title="label" item-value="value" label="现金流项目" density="comfortable" clearable />
        </v-col>
      </v-row>

      <v-row dense class="summary-row">
        <v-col v-for="card in cards" :key="card.label" cols="12" md="3">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value" :class="card.tone">{{ card.value }}</div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="warnings.length" class="alert-list">
        <v-alert v-for="warning in warnings" :key="warning" type="warning" variant="tonal" density="comfortable" class="mb-2">
          {{ warning }}
        </v-alert>
      </div>

      <v-data-table :headers="headers" :items="records" :loading="loading" hide-default-footer class="elevation-0">
        <template #item.debitAmount="{ item }">{{ formatAmount(item.debitAmount) }}</template>
        <template #item.creditAmount="{ item }">{{ formatAmount(item.creditAmount) }}</template>
        <template #item.balance="{ item }">{{ formatAmount(item.balance) }}</template>
      </v-data-table>

      <v-alert v-if="!loading && !records.length" type="info" variant="tonal" class="mt-4">
        当前条件下没有辅助明细账数据。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ledgerApi from '@/api/ledgerReport'
import { createDefaultDateRange, formatAmount, loadAccountOptions, loadCashflowOptions } from '../query/ledgerQueryShared'

const dateRange = createDefaultDateRange()
const loading = ref(false)
const records = ref([])
const warnings = ref([])
const summary = ref({})
const accountOptions = ref([])
const dimensionOptions = ref([])

const query = reactive({
  startDate: dateRange.startDate,
  endDate: dateRange.endDate,
  accountCode: '',
  dimensionCode: '',
})

const headers = [
  { title: '维度编码', key: 'dimensionCode', value: 'dimensionCode', width: 140 },
  { title: '维度名称', key: 'dimensionName', value: 'dimensionName', minWidth: 160 },
  { title: '科目编码', key: 'accountCode', value: 'accountCode', width: 140 },
  { title: '科目名称', key: 'accountName', value: 'accountName', minWidth: 180 },
  { title: '日期', key: 'voucherDate', value: 'voucherDate', width: 120 },
  { title: '凭证号', key: 'voucherNumber', value: 'voucherNumber', width: 150 },
  { title: '摘要', key: 'summary', value: 'summary', minWidth: 180 },
  { title: '借方', key: 'debitAmount', value: 'debitAmount', width: 120, align: 'end' },
  { title: '贷方', key: 'creditAmount', value: 'creditAmount', width: 120, align: 'end' },
  { title: '余额方向', key: 'balanceDirection', value: 'balanceDirection', width: 90, align: 'center' },
  { title: '余额', key: 'balance', value: 'balance', width: 120, align: 'end' },
]

const cards = computed(() => [
  { label: '明细行数', value: String(summary.value.recordCount || 0), tone: 'tone-primary' },
  { label: '借方合计', value: formatAmount(summary.value.totalDebit), tone: 'tone-primary' },
  { label: '贷方合计', value: formatAmount(summary.value.totalCredit), tone: 'tone-success' },
  { label: '维度数', value: String(new Set(records.value.map((item) => item.dimensionCode)).size), tone: 'tone-success' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerApi.fetchAuxDetailLedger({
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      accountCode: query.accountCode || undefined,
      dimensionCode: query.dimensionCode || undefined,
    })
    records.value = res.data?.records || []
    warnings.value = res.data?.warnings || []
    summary.value = res.data?.summary || {}
  } catch (error) {
    records.value = []
    warnings.value = ['辅助明细账加载失败。']
    summary.value = {}
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.startDate = dateRange.startDate
  query.endDate = dateRange.endDate
  query.accountCode = ''
  query.dimensionCode = ''
  fetchData()
}

onMounted(async () => {
  try {
    accountOptions.value = await loadAccountOptions()
    dimensionOptions.value = await loadCashflowOptions()
  } catch (error) {
    accountOptions.value = []
    dimensionOptions.value = []
  }
  fetchData()
})
</script>

<style scoped>
.ledger-query-page { padding: 24px; }
.page-card { padding: 24px; border-radius: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 0; color: #1d3f8f; font-size: 24px; font-weight: 700; }
.page-subtitle { margin-top: 8px; color: #5d6b85; font-size: 14px; line-height: 1.7; }
.page-actions { display: flex; gap: 8px; }
.summary-row { margin-bottom: 16px; }
.summary-card { padding: 18px; border: 1px solid #e8eef7; border-radius: 14px; background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%); }
.summary-label { color: #6d7891; font-size: 13px; }
.summary-value { margin-top: 8px; font-size: 28px; font-weight: 700; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.alert-list { margin-bottom: 16px; }
</style>
