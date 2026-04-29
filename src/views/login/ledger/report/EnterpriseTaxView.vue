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
        <v-col cols="12" sm="6" lg="3">
          <div class="summary-card">
            <div class="summary-label">营业收入</div>
            <div class="summary-value tone-primary">{{ formatAmount(summary.revenueAmount) }}</div>
          </div>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <div class="summary-card">
            <div class="summary-label">净利润</div>
            <div class="summary-value" :class="summary.netProfitAmount >= 0 ? 'tone-success' : 'tone-warning'">
              {{ formatAmount(summary.netProfitAmount) }}
            </div>
          </div>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <div class="summary-card">
            <div class="summary-label">税费预估合计</div>
            <div class="summary-value tone-warning">{{ formatAmount(summary.totalTaxAmount) }}</div>
          </div>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <div class="summary-card">
            <div class="summary-label">综合税负率</div>
            <div class="summary-value tone-tax">{{ formatRate(summary.taxBurdenRate) }}</div>
          </div>
        </v-col>
      </v-row>

      <div v-if="resolutionReview.show" class="alert-list">
        <v-alert
          :type="resolutionReview.type"
          variant="tonal"
          density="comfortable"
          class="mb-2"
        >
          {{ resolutionReview.message }}
        </v-alert>
      </div>

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

      <div v-if="mappingGaps.length" class="mapping-gap-panel">
        <div class="mapping-gap-header">
          <div>
            <div class="mapping-gap-title">报表科目映射待处理</div>
            <div class="mapping-gap-subtitle">以下科目已有发生额，但还没有落到报表项目。</div>
          </div>
          <div class="mapping-gap-header-actions">
            <div class="mapping-gap-count">{{ mappingGaps.length }} 项</div>
            <v-btn size="small" color="primary" variant="flat" @click="openFirstMappingGap">
              开始治理
            </v-btn>
          </div>
        </div>
        <div class="mapping-gap-list">
          <div v-for="gap in mappingGaps" :key="mappingGapKey(gap)" class="mapping-gap-row">
            <div class="mapping-gap-main">
              <div class="mapping-gap-account">{{ gap.accountCode || '-' }} - {{ gap.accountName || '-' }}</div>
              <div class="mapping-gap-meta">
                {{ reportTypeLabel(gap.reportType) }} / {{ gap.templateName || '默认模板' }} / 建议类型 {{ gap.mappingType || '-' }}
              </div>
              <div class="mapping-gap-recommendation">
                {{ mappingGapSuggestion(gap).message }}
              </div>
            </div>
            <v-btn size="small" variant="tonal" color="primary" @click="openMappingGap(gap)">
              {{ mappingGapSuggestion(gap).itemCode ? '按建议维护' : (gap.actionLabel || '维护映射') }}
            </v-btn>
          </div>
        </div>
      </div>

      <div class="tax-table-wrap">
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
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const checks = ref([])
const mappingGaps = ref([])
const orgOptions = ref([])
const resolutionReview = reactive({ show: false, type: 'info', message: '' })

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  currency: 'CNY',
})

const summary = reactive({
  revenueAmount: 0,
  netProfitAmount: 0,
  totalTaxAmount: 0,
  taxBurdenRate: 0,
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
    mappingGaps.value = data.mappingGaps || []
    applyResolutionReview(mappingGaps.value)
    summary.revenueAmount = Number(data.revenueAmount || 0)
    summary.netProfitAmount = Number(data.netProfitAmount || 0)
    summary.totalTaxAmount = Number(data.totalTaxAmount || 0)
    summary.taxBurdenRate = Number(data.taxBurdenRate || 0)
  } catch {
    rows.value = []
    warnings.value = ['企业纳税表加载失败。']
    checks.value = []
    mappingGaps.value = []
    clearResolutionReview()
    summary.revenueAmount = 0
    summary.netProfitAmount = 0
    summary.totalTaxAmount = 0
    summary.taxBurdenRate = 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.orgId = null
  query.period = currentPeriod()
  query.currency = 'CNY'
  fetchData()
}

function applyResolutionReview(gaps) {
  if (normalizeQueryValue(route.query.review) !== 'reportMappingResolution') {
    clearResolutionReview()
    return
  }

  const accountCode = normalizeQueryValue(route.query.resolvedAccountCode)
  const accountName = normalizeQueryValue(route.query.resolvedAccountName)
  const templateId = normalizeNumber(normalizeQueryValue(route.query.resolvedTemplateId))
  const label = accountCode ? `${accountCode}${accountName ? ` - ${accountName}` : ''}` : '本次映射缺口'
  const stillOpen = (gaps || []).some((gap) => {
    const sameAccount = !accountCode || String(gap.accountCode || '').trim() === accountCode
    const sameTemplate = !templateId || Number(gap.templateId || 0) === templateId
    return sameAccount && sameTemplate
  })

  resolutionReview.show = true
  resolutionReview.type = stillOpen ? 'warning' : 'success'
  resolutionReview.message = stillOpen
    ? `已返回企业纳税表自动复核：${label} 仍在映射缺口中，请确认报表项目是否选择正确后重新保存。`
    : `已返回企业纳税表自动复核：${label} 的映射缺口已消失。`
}

function clearResolutionReview() {
  resolutionReview.show = false
  resolutionReview.message = ''
}

function applyRouteQuery() {
  const period = normalizeQueryValue(route.query.period)
  if (period) {
    query.period = period
  }
  const currency = normalizeQueryValue(route.query.currency)
  if (currency) {
    query.currency = currency
  }
  const orgId = normalizeNumber(normalizeQueryValue(route.query.orgId))
  if (orgId) {
    query.orgId = orgId
  }
}

function mappingGapKey(gap) {
  return `${gap.reportType || '-'}-${gap.templateId || '-'}-${gap.accountCode || '-'}`
}

function reportTypeLabel(value) {
  const labels = {
    PROFIT_STATEMENT: '利润表',
    BALANCE_SHEET: '资产负债表',
    CASH_FLOW: '现金流量表',
  }
  return labels[value] || value || '报表'
}

function openMappingGap(gap) {
  router.push(buildMappingGapTarget(gap))
}

function openFirstMappingGap() {
  if (mappingGaps.value.length) {
    openMappingGap(mappingGaps.value[0])
  }
}

function buildMappingGapTarget(gap) {
  const sourceQuery = sourceContextQuery()
  const suggestionQuery = suggestionContextQuery(gap)
  if (gap?.targetRoute) {
    const parsed = new URL(gap.targetRoute, window.location.origin)
    return {
      path: parsed.pathname,
      query: {
        ...Object.fromEntries(parsed.searchParams.entries()),
        ...sourceQuery,
        ...suggestionQuery,
      },
    }
  }
  return {
    path: '/ledger/report-account-map',
    query: {
      accountCode: gap?.accountCode || undefined,
      reportType: gap?.reportType || undefined,
      templateId: gap?.templateId || undefined,
      ...sourceQuery,
      ...suggestionQuery,
    },
  }
}

function sourceContextQuery() {
  return compactQuery({
    mode: 'resolve',
    sourcePath: '/ledger/enterprise-tax',
    sourcePeriod: query.period,
    sourceCurrency: query.currency,
    sourceOrgId: query.orgId,
  })
}

function suggestionContextQuery(gap) {
  const suggestion = mappingGapSuggestion(gap)
  return compactQuery({
    recommendedItemCode: suggestion.itemCode,
    recommendationReason: suggestion.message,
  })
}

function mappingGapSuggestion(gap) {
  const reportType = normalizeQueryValue(gap?.reportType)
  const accountCode = normalizeQueryValue(gap?.accountCode)
  const accountName = normalizeQueryValue(gap?.accountName)
  const accountText = `${accountCode} ${accountName}`.toLowerCase()

  if (reportType === 'PROFIT_STATEMENT') {
    if (accountCode.startsWith('5') || accountText.includes('收入') || accountText.includes('revenue')) {
      return {
        itemCode: 'PL_REVENUE',
        message: '治理建议：收入类科目，建议优先映射到 PL_REVENUE，并复核收入正负方向。',
      }
    }
    if (
      startsWithAny(accountCode, ['6', '7'])
      || containsAny(accountText, ['成本', '费用', 'cost', 'expense'])
    ) {
      return {
        itemCode: 'PL_COST',
        message: '治理建议：成本费用类科目，建议优先映射到 PL_COST，并复核是否需要细分报表项目。',
      }
    }
    if (startsWithAny(accountCode, ['1', '2', '3', '4'])) {
      return {
        itemCode: '',
        message: '治理建议：该科目更像资产负债表科目，建议先核实凭证科目或利润表取数口径，再决定是否手工映射。',
      }
    }
  }

  if (reportType === 'BALANCE_SHEET') {
    if (accountCode.startsWith('100') || containsAny(accountText, ['现金', '银行', 'cash', 'bank'])) {
      return {
        itemCode: 'BS_CASH',
        message: '治理建议：现金或银行类科目，建议优先映射到 BS_CASH。',
      }
    }
    if (accountCode.startsWith('1')) {
      return {
        itemCode: 'BS_ASSET',
        message: '治理建议：资产类科目，建议优先映射到 BS_ASSET，必要时再细分资产项目。',
      }
    }
    if (startsWithAny(accountCode, ['2', '3', '4'])) {
      return {
        itemCode: 'BS_LIAB_EQ',
        message: '治理建议：负债或权益类科目，建议优先映射到 BS_LIAB_EQ。',
      }
    }
  }

  return {
    itemCode: '',
    message: '治理建议：暂无可靠自动推荐，请结合报表模板口径人工选择报表项目。',
  }
}

function startsWithAny(value, prefixes) {
  return prefixes.some((prefix) => value.startsWith(prefix))
}

function containsAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()))
}

function compactQuery(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
  )
}

function normalizeQueryValue(value) {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim()
  }
  return String(value || '').trim()
}

function normalizeNumber(value) {
  if (value === '' || value === undefined || value === null) {
    return null
  }
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

onMounted(async () => {
  await loadOrgOptions().catch(() => {
    warnings.value = ['业务单元加载失败。']
  })
  applyRouteQuery()
  await fetchData()
})

watch(
  () => [
    route.query.period,
    route.query.currency,
    route.query.orgId,
    route.query.review,
    route.query.resolvedAccountCode,
    route.query.resolvedTemplateId,
  ],
  async () => {
    applyRouteQuery()
    await fetchData()
  },
)
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
  border-radius: 8px;
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

.tone-tax {
  color: #7d4cdb;
}

.alert-list {
  margin-bottom: 12px;
}

.mapping-gap-panel {
  margin: 0 0 16px;
  border: 1px solid #ffdba8;
  border-radius: 8px;
  background: #fff8ed;
  overflow: hidden;
}

.mapping-gap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid #ffe7c6;
}

.mapping-gap-title {
  color: #8a520d;
  font-size: 15px;
  font-weight: 700;
}

.mapping-gap-subtitle {
  margin-top: 4px;
  color: #9b6b2a;
  font-size: 13px;
}

.mapping-gap-count {
  min-width: 48px;
  color: #a45f00;
  font-size: 14px;
  font-weight: 700;
  text-align: right;
}

.mapping-gap-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mapping-gap-list {
  display: flex;
  flex-direction: column;
}

.mapping-gap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
}

.mapping-gap-row + .mapping-gap-row {
  border-top: 1px solid #ffe7c6;
}

.mapping-gap-main {
  min-width: 0;
}

.mapping-gap-account {
  color: #25324a;
  font-size: 14px;
  font-weight: 700;
}

.mapping-gap-meta {
  margin-top: 4px;
  color: #6f7a8d;
  font-size: 12px;
}

.mapping-gap-recommendation {
  margin-top: 6px;
  color: #8a520d;
  font-size: 12px;
  line-height: 1.5;
}

.tax-table-wrap {
  padding-right: 92px;
}

@media (max-width: 960px) {
  .tax-table-wrap {
    padding-right: 0;
  }

  .mapping-gap-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .mapping-gap-header-actions {
    align-items: flex-end;
    flex-direction: column;
  }
}
</style>
