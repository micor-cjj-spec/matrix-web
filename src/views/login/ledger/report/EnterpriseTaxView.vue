<template>
  <div class="analysis-page">
    <v-card elevation="4" class="pa-6">
      <div class="page-header">
        <div>
          <h2 class="page-title">企业纳税表</h2>
          <div class="page-subtitle">
            基于利润表结果给出企业纳税预估口径，帮助快速查看收入、利润与主要税费压力。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
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
          <v-text-field
            v-model.trim="query.period"
            label="期间"
            density="comfortable"
            placeholder="2026-03"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.currency"
            label="币种"
            density="comfortable"
            clearable
          />
        </v-col>
      </v-row>

      <v-row dense class="summary-row">
        <v-col cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">营业收入</div>
            <div class="summary-value tone-primary">{{ formatAmount(summary.revenueAmount) }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">净利润</div>
            <div class="summary-value" :class="summary.netProfitAmount >= 0 ? 'tone-success' : 'tone-warning'">
              {{ formatAmount(summary.netProfitAmount) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">税费预估合计</div>
            <div class="summary-value tone-warning">{{ formatAmount(summary.totalTaxAmount) }}</div>
          </v-card>
        </v-col>
      </v-row>

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

      <div v-if="checks.length" class="alert-list">
        <v-alert
          v-for="check in checks"
          :key="check.code"
          :type="check.passed ? 'success' : 'error'"
          variant="tonal"
          density="comfortable"
          class="mb-2"
        >
          {{ check.message }}
        </v-alert>
      </div>

      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        item-key="taxCode"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.taxBase="{ item }">
          {{ formatAmount(item.taxBase) }}
        </template>
        <template #item.taxRate="{ item }">
          {{ formatRate(item.taxRate) }}
        </template>
        <template #item.taxAmount="{ item }">
          {{ formatAmount(item.taxAmount) }}
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'

const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const checks = ref([])
const orgOptions = ref([])

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  currency: 'CNY',
})

const summary = reactive({
  revenueAmount: 0,
  netProfitAmount: 0,
  totalTaxAmount: 0,
})

const headers = [
  { title: '税种编码', key: 'taxCode', value: 'taxCode', width: 140 },
  { title: '税种名称', key: 'taxName', value: 'taxName', width: 180 },
  { title: '计税基础', key: 'taxBase', value: 'taxBase', align: 'end', width: 160 },
  { title: '税率', key: 'taxRate', value: 'taxRate', align: 'end', width: 100 },
  { title: '税额', key: 'taxAmount', value: 'taxAmount', align: 'end', width: 160 },
  { title: '说明', key: 'note', value: 'note' },
]

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatRate(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`
}

async function loadOrgOptions() {
  const res = await getBusinessUnitList({ page: 1, size: 500 })
  const records = res.data?.records || []
  orgOptions.value = records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
  }))
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchEnterpriseTax({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    checks.value = data.checks || []
    summary.revenueAmount = Number(data.revenueAmount || 0)
    summary.netProfitAmount = Number(data.netProfitAmount || 0)
    summary.totalTaxAmount = Number(data.totalTaxAmount || 0)
  } catch {
    rows.value = []
    warnings.value = ['企业纳税表加载失败。']
    checks.value = []
    summary.revenueAmount = 0
    summary.netProfitAmount = 0
    summary.totalTaxAmount = 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.period = currentPeriod()
  query.currency = 'CNY'
  fetchData()
}

onMounted(async () => {
  await loadOrgOptions().catch(() => {
    warnings.value = ['业务单元加载失败。']
  })
  await fetchData()
})
</script>

<style scoped>
.analysis-page {
  padding: 24px;
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
  color: #62779b;
  font-size: 14px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.summary-row {
  margin-bottom: 12px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e4ebf7;
  border-radius: 14px;
  padding: 18px;
  background: linear-gradient(180deg, #f9fbff 0%, #ffffff 100%);
}

.summary-label {
  color: #5e7297;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 28px;
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

.alert-list {
  margin-bottom: 12px;
}
</style>
