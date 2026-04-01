<template>
  <div class="analysis-page">
    <v-card elevation="4" class="pa-6">
      <div class="page-header">
        <div>
          <h2 class="page-title">财务指标</h2>
          <div class="page-subtitle">
            基于资产负债表和利润表结果自动计算偿债能力、资本结构和盈利能力指标。
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

      <div class="meta-strip">
        <v-chip size="small" variant="tonal">业务单元: {{ currentOrgLabel }}</v-chip>
        <v-chip size="small" variant="tonal">期间: {{ query.period || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">币种: {{ query.currency || 'CNY' }}</v-chip>
      </div>

      <v-row dense class="summary-row">
        <v-col v-for="card in summaryCards" :key="card.label" cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value" :class="card.tone">{{ card.value }}</div>
            <div class="summary-tip">{{ card.tip }}</div>
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
        item-key="code"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.value="{ item }">
          <span>{{ formatValue(item.value, item.unit) }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
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

const headers = [
  { title: '指标编码', key: 'code', value: 'code', width: 160 },
  { title: '指标名称', key: 'name', value: 'name', width: 180 },
  { title: '分类', key: 'category', value: 'category', width: 140 },
  { title: '指标值', key: 'value', value: 'value', width: 160, align: 'end' },
  { title: '公式', key: 'formula', value: 'formula' },
  { title: '说明', key: 'interpretation', value: 'interpretation' },
]

const summaryCards = computed(() => [
  metricCard('偿债能力指标', findRow('CURRENT_RATIO')?.value, findRow('CURRENT_RATIO')?.unit, '流动比率越高，短期偿债弹性越强。'),
  metricCard('资本结构指标', findRow('ASSET_LIABILITY_RATIO')?.value, findRow('ASSET_LIABILITY_RATIO')?.unit, '资产负债率反映负债对资产的占用程度。'),
  metricCard('盈利能力指标', findRow('NET_MARGIN')?.value, findRow('NET_MARGIN')?.unit, '净利率衡量收入转化为净利润的能力。'),
])

const currentOrgLabel = computed(() => {
  const hit = orgOptions.value.find((item) => item.value === query.orgId)
  return hit?.label || '全部业务单元'
})

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function metricCard(label, value, unit, tip) {
  return {
    label,
    value: formatValue(value, unit),
    tip,
    tone: 'tone-primary',
  }
}

function findRow(code) {
  return rows.value.find((item) => item.code === code)
}

function formatValue(value, unit) {
  const number = Number(value || 0)
  const text = number.toLocaleString('zh-CN', {
    minimumFractionDigits: unit === '%' ? 2 : 2,
    maximumFractionDigits: unit === '%' ? 2 : 4,
  })
  return unit ? `${text}${unit}` : text
}

async function loadOrgOptions() {
  const res = await getBusinessUnitList({ page: 1, size: 500 })
  const records = res.data?.records || []
  orgOptions.value = records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
  }))
  if (!query.orgId && orgOptions.value.length) {
    query.orgId = orgOptions.value[0].value
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchFinancialIndicators({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    checks.value = data.checks || []
  } catch {
    rows.value = []
    warnings.value = ['财务指标加载失败。']
    checks.value = []
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

.meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
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
  color: #2450b2;
  font-size: 28px;
  font-weight: 700;
}

.summary-tip {
  margin-top: 8px;
  color: #7488ad;
  font-size: 12px;
}

.alert-list {
  margin-bottom: 12px;
}
</style>
