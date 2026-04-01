<template>
  <div class="cashflow-query-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">现金流量查询</h2>
          <div class="page-subtitle">
            追踪本期现金相关凭证的归类来源，区分直接标记、规则推断、待修正编码和现金类科目互转。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row dense class="mb-2">
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
        <v-col cols="12" md="3">
          <v-select
            v-model="query.cashflowItemCode"
            :items="cashflowItemOptions"
            item-title="label"
            item-value="value"
            label="现金流项目"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="query.categoryCode"
            :items="categoryOptions"
            label="活动分类"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="query.sourceType"
            :items="sourceOptions"
            label="识别方式"
            density="comfortable"
            clearable
          />
        </v-col>
      </v-row>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.accountCode"
            label="科目编码"
            density="comfortable"
            placeholder="支持现金科目或对方科目模糊匹配"
            clearable
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            v-model.trim="query.keyword"
            label="关键字"
            density="comfortable"
            placeholder="凭证号、摘要、现金流项目"
            clearable
          />
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

      <div class="meta-strip">
        <v-chip size="small" variant="tonal">直接标记 {{ summary.directCount }}</v-chip>
        <v-chip size="small" variant="tonal">规则推断 {{ summary.heuristicCount }}</v-chip>
        <v-chip size="small" variant="tonal" color="warning">未知编码 {{ summary.unknownCount }}</v-chip>
        <v-chip size="small" variant="tonal" color="warning">多编码复核 {{ summary.mixedCount }}</v-chip>
        <v-chip size="small" variant="tonal">现金划转 {{ summary.transferCount }}</v-chip>
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

      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        item-key="voucherId"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.cashflowItemName="{ item }">
          <div class="two-line">
            <div>{{ item.cashflowItemName || '-' }}</div>
            <div class="muted">{{ item.cashflowItemCode || '未录入' }}</div>
          </div>
        </template>
        <template #item.categoryName="{ item }">
          {{ categoryLabel(item.categoryCode, item.categoryName) }}
        </template>
        <template #item.sourceType="{ item }">
          <v-chip size="small" variant="tonal" :color="sourceColor(item.sourceType)">
            {{ sourceLabel(item.sourceType) }}
          </v-chip>
        </template>
        <template #item.cashInAmount="{ item }">
          {{ formatAmount(item.cashInAmount) }}
        </template>
        <template #item.cashOutAmount="{ item }">
          {{ formatAmount(item.cashOutAmount) }}
        </template>
        <template #item.netAmount="{ item }">
          {{ formatAmount(item.netAmount) }}
        </template>
        <template #item.accounts="{ item }">
          <div class="two-line">
            <div>{{ item.cashAccountCodes || '-' }}</div>
            <div class="muted">对方: {{ item.counterpartyAccountCodes || '-' }}</div>
          </div>
        </template>
        <template #item.reason="{ item }">
          <div class="reason-text">{{ item.reason || '-' }}</div>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucher(item)">
            查看凭证
          </v-btn>
        </template>
      </v-data-table>

      <v-alert v-if="!loading && !rows.length" type="info" variant="tonal" class="mt-4">
        当前条件下没有现金流量查询结果。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import cashflowItemApi from '@/api/cashflowItem'
import financialReportApi from '@/api/financialReport'

const router = useRouter()
const loading = ref(false)
const warnings = ref([])
const rows = ref([])
const orgOptions = ref([])
const cashflowItemOptions = ref([])

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  cashflowItemCode: '',
  categoryCode: '',
  sourceType: '',
  accountCode: '',
  keyword: '',
  currency: 'CNY',
})

const summary = reactive({
  postedVoucherCount: 0,
  cashVoucherCount: 0,
  directCount: 0,
  heuristicCount: 0,
  unknownCount: 0,
  mixedCount: 0,
  transferCount: 0,
  cashInAmount: 0,
  cashOutAmount: 0,
  netAmount: 0,
})

const categoryOptions = [
  { title: '经营活动', value: 'CF_OPERATING' },
  { title: '投资活动', value: 'CF_INVESTING' },
  { title: '筹资活动', value: 'CF_FINANCING' },
]

const sourceOptions = [
  { title: '直接标记', value: 'DIRECT' },
  { title: '规则推断', value: 'HEURISTIC' },
  { title: '未知编码', value: 'UNKNOWN_ITEM' },
  { title: '多编码复核', value: 'MIXED_ITEM' },
  { title: '现金划转', value: 'CASH_TRANSFER' },
]

const headers = [
  { title: '日期', key: 'voucherDate', value: 'voucherDate', width: 110 },
  { title: '凭证号', key: 'voucherNumber', value: 'voucherNumber', width: 160 },
  { title: '摘要', key: 'summary', value: 'summary', minWidth: 220 },
  { title: '账户关系', key: 'accounts', value: 'accounts', minWidth: 220 },
  { title: '现金流项目', key: 'cashflowItemName', value: 'cashflowItemName', minWidth: 180 },
  { title: '活动分类', key: 'categoryName', value: 'categoryName', width: 110 },
  { title: '识别方式', key: 'sourceType', value: 'sourceType', width: 120, align: 'center' },
  { title: '流入', key: 'cashInAmount', value: 'cashInAmount', width: 120, align: 'end' },
  { title: '流出', key: 'cashOutAmount', value: 'cashOutAmount', width: 120, align: 'end' },
  { title: '净额', key: 'netAmount', value: 'netAmount', width: 120, align: 'end' },
  { title: '说明', key: 'reason', value: 'reason', minWidth: 260 },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const summaryCards = computed(() => [
  {
    label: '现金相关凭证',
    value: String(summary.cashVoucherCount),
    tip: `已过账凭证 ${summary.postedVoucherCount} 张`,
    tone: 'tone-primary',
  },
  {
    label: '现金流入',
    value: formatAmount(summary.cashInAmount),
    tip: '按现金类科目借方汇总',
    tone: 'tone-success',
  },
  {
    label: '现金流出',
    value: formatAmount(summary.cashOutAmount),
    tip: '按现金类科目贷方汇总',
    tone: 'tone-warning',
  },
  {
    label: '净额',
    value: formatAmount(summary.netAmount),
    tip: '流入减流出',
    tone: Number(summary.netAmount || 0) >= 0 ? 'tone-primary' : 'tone-danger',
  },
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

async function loadCashflowItems() {
  try {
    const res = await cashflowItemApi.fetchList({ page: 1, size: 500 })
    const records = res.data?.records || []
    cashflowItemOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname || '-'}`,
      value: item.fcode,
    }))
  } catch (error) {
    cashflowItemOptions.value = []
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchCashFlowQuery({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
      cashflowItemCode: query.cashflowItemCode || undefined,
      categoryCode: query.categoryCode || undefined,
      sourceType: query.sourceType || undefined,
      accountCode: query.accountCode || undefined,
      keyword: query.keyword || undefined,
    })
    const data = res.data || {}
    rows.value = data.records || []
    warnings.value = data.warnings || []
    summary.postedVoucherCount = Number(data.postedVoucherCount || 0)
    summary.cashVoucherCount = Number(data.cashVoucherCount || 0)
    summary.directCount = Number(data.directCount || 0)
    summary.heuristicCount = Number(data.heuristicCount || 0)
    summary.unknownCount = Number(data.unknownCount || 0)
    summary.mixedCount = Number(data.mixedCount || 0)
    summary.transferCount = Number(data.transferCount || 0)
    summary.cashInAmount = Number(data.cashInAmount || 0)
    summary.cashOutAmount = Number(data.cashOutAmount || 0)
    summary.netAmount = Number(data.netAmount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['现金流量查询加载失败。']
    resetSummary()
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.period = currentPeriod()
  query.cashflowItemCode = ''
  query.categoryCode = ''
  query.sourceType = ''
  query.accountCode = ''
  query.keyword = ''
  fetchData()
}

function resetSummary() {
  summary.postedVoucherCount = 0
  summary.cashVoucherCount = 0
  summary.directCount = 0
  summary.heuristicCount = 0
  summary.unknownCount = 0
  summary.mixedCount = 0
  summary.transferCount = 0
  summary.cashInAmount = 0
  summary.cashOutAmount = 0
  summary.netAmount = 0
}

function openVoucher(item) {
  const routeData = router.resolve({
    path: '/ledger/voucher',
    query: { number: item.voucherNumber || undefined },
  })
  window.open(routeData.href, '_blank')
}

function sourceLabel(value) {
  return {
    DIRECT: '直接标记',
    HEURISTIC: '规则推断',
    UNKNOWN_ITEM: '未知编码',
    MIXED_ITEM: '多编码复核',
    CASH_TRANSFER: '现金划转',
  }[value] || value || '-'
}

function sourceColor(value) {
  return {
    DIRECT: 'success',
    HEURISTIC: 'info',
    UNKNOWN_ITEM: 'warning',
    MIXED_ITEM: 'warning',
    CASH_TRANSFER: 'default',
  }[value] || 'default'
}

function categoryLabel(code, fallback) {
  return {
    CF_OPERATING: '经营活动',
    CF_INVESTING: '投资活动',
    CF_FINANCING: '筹资活动',
    CASH_TRANSFER: '现金划转',
    UNKNOWN_ITEM: '未知编码',
    MIXED_ITEM: '多编码复核',
    PENDING: '待补资料',
  }[code] || fallback || '-'
}

function formatAmount(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([loadOrgOptions(), loadCashflowItems()])
  await fetchData()
})
</script>

<style scoped>
.cashflow-query-page {
  padding: 24px;
}

.page-card {
  padding: 24px;
  border-radius: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  color: #1d3f8f;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 8px;
  color: #5d6b85;
  font-size: 14px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.summary-row {
  margin-bottom: 18px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e8eef7;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%);
  padding: 18px;
}

.summary-label {
  color: #6d7891;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
}

.summary-tip {
  margin-top: 6px;
  color: #8793ac;
  font-size: 12px;
}

.meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.alert-list {
  margin-bottom: 16px;
}

.two-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.muted {
  color: #7f8aa3;
  font-size: 12px;
}

.reason-text {
  color: #56647f;
  line-height: 1.5;
}

.tone-primary {
  color: #2453b3;
}

.tone-success {
  color: #21875e;
}

.tone-warning {
  color: #d08a08;
}

.tone-danger {
  color: #c44f37;
}
</style>
