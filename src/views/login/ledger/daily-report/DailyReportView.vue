<template>
  <div class="ledger-query-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">日报表</h2>
          <div class="page-subtitle">按日统计凭证发生和滚动余额，适合做期间内日级波动查看。</div>
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
        <template #item.openingBalance="{ item }">{{ formatAmount(item.openingBalance) }}</template>
        <template #item.debitAmount="{ item }">{{ formatAmount(item.debitAmount) }}</template>
        <template #item.creditAmount="{ item }">{{ formatAmount(item.creditAmount) }}</template>
        <template #item.closingBalance="{ item }">{{ formatAmount(item.closingBalance) }}</template>
      </v-data-table>

      <v-alert v-if="!loading && !records.length" type="info" variant="tonal" class="mt-4">
        当前条件下没有日报表数据。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import ledgerApi from '@/api/ledgerReport'
import { createDefaultDateRange, formatAmount, loadAccountOptions } from '../query/ledgerQueryShared'

const dateRange = createDefaultDateRange()
const loading = ref(false)
const records = ref([])
const warnings = ref([])
const summary = ref({})
const accountOptions = ref([])

const query = reactive({
  startDate: dateRange.startDate,
  endDate: dateRange.endDate,
  accountCode: '',
})

const headers = [
  { title: '日期', key: 'bizDate', value: 'bizDate', width: 120 },
  { title: '凭证数', key: 'voucherCount', value: 'voucherCount', width: 90, align: 'center' },
  { title: '期初方向', key: 'openingDirection', value: 'openingDirection', width: 90, align: 'center' },
  { title: '期初余额', key: 'openingBalance', value: 'openingBalance', width: 120, align: 'end' },
  { title: '借方发生', key: 'debitAmount', value: 'debitAmount', width: 120, align: 'end' },
  { title: '贷方发生', key: 'creditAmount', value: 'creditAmount', width: 120, align: 'end' },
  { title: '期末方向', key: 'closingDirection', value: 'closingDirection', width: 90, align: 'center' },
  { title: '期末余额', key: 'closingBalance', value: 'closingBalance', width: 120, align: 'end' },
]

const cards = computed(() => [
  { label: '日记录数', value: String(summary.value.recordCount || 0), tone: 'tone-primary' },
  { label: '期间借方', value: formatAmount(summary.value.totalDebit), tone: 'tone-primary' },
  { label: '期间贷方', value: formatAmount(summary.value.totalCredit), tone: 'tone-success' },
  { label: '凭证数', value: String(summary.value.voucherCount || 0), tone: 'tone-success' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerApi.fetchDailyReport({
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      accountCode: query.accountCode || undefined,
    })
    records.value = res.data?.records || []
    warnings.value = res.data?.warnings || []
    summary.value = res.data?.summary || {}
  } catch (error) {
    records.value = []
    warnings.value = ['日报表加载失败。']
    summary.value = {}
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.startDate = dateRange.startDate
  query.endDate = dateRange.endDate
  query.accountCode = ''
  fetchData()
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
