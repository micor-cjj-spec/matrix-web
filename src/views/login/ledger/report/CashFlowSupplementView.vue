<template>
  <div class="cashflow-supplement-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">现金流量补充资料</h2>
          <div class="page-subtitle">
            汇总现金流主表之外需要补录、复核和说明的资料，优先暴露未知编码、多编码、规则推断和现金划转事项。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
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
          <v-text-field
            v-model.trim="query.period"
            label="期间"
            density="comfortable"
            placeholder="2026-03"
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
        <v-chip size="small" variant="tonal">现金类科目 {{ summary.cashAccountCount }}</v-chip>
        <v-chip size="small" variant="tonal">现金流项目 {{ summary.cashflowItemCount }}</v-chip>
        <v-chip size="small" variant="tonal" color="success">直接标记 {{ summary.directCount }}</v-chip>
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

      <div class="section-title">补录检查项</div>
      <v-data-table
        :headers="taskHeaders"
        :items="tasks"
        :loading="loading"
        item-key="code"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="taskStatusColor(item.status)">
            {{ taskStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.name="{ item }">
          {{ taskNameLabel(item.code, item.name) }}
        </template>
      </v-data-table>

      <div class="section-title">分类分布</div>
      <v-data-table
        :headers="categoryHeaders"
        :items="categories"
        :loading="loading"
        item-key="categoryCode"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.categoryName="{ item }">
          {{ categoryLabel(item.categoryCode, item.categoryName) }}
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
      </v-data-table>

      <div class="section-title">待补录或复核凭证</div>
      <v-data-table
        :headers="voucherHeaders"
        :items="pendingVouchers"
        :loading="loading"
        item-key="voucherId"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.sourceType="{ item }">
          <v-chip size="small" variant="tonal" :color="sourceColor(item.sourceType)">
            {{ sourceLabel(item.sourceType) }}
          </v-chip>
        </template>
        <template #item.categoryName="{ item }">
          {{ categoryLabel(item.categoryName, item.categoryName) }}
        </template>
        <template #item.netAmount="{ item }">
          {{ formatAmount(item.netAmount) }}
        </template>
        <template #item.issue="{ item }">
          <div class="two-line">
            <div>{{ issueLabel(item.issue) }}</div>
            <div class="muted">{{ item.cashflowItemCode || '未录入编码' }}</div>
          </div>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucher(item)">
            查看凭证
          </v-btn>
        </template>
      </v-data-table>

      <v-alert v-if="!loading && !pendingVouchers.length" type="success" variant="tonal" class="mt-4">
        当前期间没有需要额外补录或复核的现金流凭证。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'

const router = useRouter()
const loading = ref(false)
const warnings = ref([])
const tasks = ref([])
const categories = ref([])
const pendingVouchers = ref([])
const orgOptions = ref([])

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  currency: 'CNY',
})

const summary = reactive({
  postedVoucherCount: 0,
  cashVoucherCount: 0,
  cashAccountCount: 0,
  cashflowItemCount: 0,
  directCount: 0,
  heuristicCount: 0,
  unknownCount: 0,
  mixedCount: 0,
  transferCount: 0,
  cashInAmount: 0,
  cashOutAmount: 0,
  netAmount: 0,
})

const taskHeaders = [
  { title: '检查项', key: 'name', value: 'name', width: 180 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '说明', key: 'message', value: 'message' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint', minWidth: 260 },
]

const categoryHeaders = [
  { title: '分类', key: 'categoryName', value: 'categoryName', width: 150 },
  { title: '凭证数', key: 'voucherCount', value: 'voucherCount', width: 90, align: 'center' },
  { title: '流入', key: 'cashInAmount', value: 'cashInAmount', width: 120, align: 'end' },
  { title: '流出', key: 'cashOutAmount', value: 'cashOutAmount', width: 120, align: 'end' },
  { title: '净额', key: 'netAmount', value: 'netAmount', width: 120, align: 'end' },
  { title: '直接标记', key: 'directCount', value: 'directCount', width: 90, align: 'center' },
  { title: '规则推断', key: 'heuristicCount', value: 'heuristicCount', width: 90, align: 'center' },
  { title: '待复核', key: 'pendingCount', value: 'pendingCount', width: 90, align: 'center' },
]

const voucherHeaders = [
  { title: '日期', key: 'voucherDate', value: 'voucherDate', width: 110 },
  { title: '凭证号', key: 'voucherNumber', value: 'voucherNumber', width: 160 },
  { title: '摘要', key: 'summary', value: 'summary', minWidth: 220 },
  { title: '识别方式', key: 'sourceType', value: 'sourceType', width: 120, align: 'center' },
  { title: '分类', key: 'categoryName', value: 'categoryName', width: 130 },
  { title: '净额', key: 'netAmount', value: 'netAmount', width: 120, align: 'end' },
  { title: '问题', key: 'issue', value: 'issue', minWidth: 220 },
  { title: '建议', key: 'suggestion', value: 'suggestion', minWidth: 260 },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const summaryCards = computed(() => {
  const pendingCount = Number(summary.heuristicCount) + Number(summary.unknownCount) + Number(summary.mixedCount) + Number(summary.transferCount)
  return [
    {
      label: '现金相关凭证',
      value: String(summary.cashVoucherCount),
      tip: `已过账凭证 ${summary.postedVoucherCount} 张`,
      tone: 'tone-primary',
    },
    {
      label: '直接标记',
      value: String(summary.directCount),
      tip: '凭证分录已明确现金流项目',
      tone: 'tone-success',
    },
    {
      label: '待补资料',
      value: String(pendingCount),
      tip: '规则推断、未知编码、多编码、现金划转',
      tone: pendingCount > 0 ? 'tone-warning' : 'tone-success',
    },
    {
      label: '现金净额',
      value: formatAmount(summary.netAmount),
      tip: `流入 ${formatAmount(summary.cashInAmount)} / 流出 ${formatAmount(summary.cashOutAmount)}`,
      tone: Number(summary.netAmount || 0) >= 0 ? 'tone-primary' : 'tone-danger',
    },
  ]
})

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname || '-'}`,
      value: item.fid,
    }))
  } catch (error) {
    orgOptions.value = []
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchCashFlowSupplement({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
    })
    const data = res.data || {}
    warnings.value = data.warnings || []
    tasks.value = data.tasks || []
    categories.value = data.categories || []
    pendingVouchers.value = data.pendingVouchers || []
    summary.postedVoucherCount = Number(data.postedVoucherCount || 0)
    summary.cashVoucherCount = Number(data.cashVoucherCount || 0)
    summary.cashAccountCount = Number(data.cashAccountCount || 0)
    summary.cashflowItemCount = Number(data.cashflowItemCount || 0)
    summary.directCount = Number(data.directCount || 0)
    summary.heuristicCount = Number(data.heuristicCount || 0)
    summary.unknownCount = Number(data.unknownCount || 0)
    summary.mixedCount = Number(data.mixedCount || 0)
    summary.transferCount = Number(data.transferCount || 0)
    summary.cashInAmount = Number(data.cashInAmount || 0)
    summary.cashOutAmount = Number(data.cashOutAmount || 0)
    summary.netAmount = Number(data.netAmount || 0)
  } catch (error) {
    warnings.value = ['现金流量补充资料加载失败。']
    tasks.value = []
    categories.value = []
    pendingVouchers.value = []
    resetSummary()
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.period = currentPeriod()
  fetchData()
}

function resetSummary() {
  summary.postedVoucherCount = 0
  summary.cashVoucherCount = 0
  summary.cashAccountCount = 0
  summary.cashflowItemCount = 0
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

function taskNameLabel(code, fallback) {
  return {
    CASH_ACCOUNT_READY: '现金类科目设置',
    CASHFLOW_ITEM_READY: '现金流项目主数据',
    DIRECT_COVERAGE: '直接标记覆盖率',
    UNKNOWN_CODE_REVIEW: '未识别编码复核',
    MIXED_CODE_REVIEW: '多编码凭证复核',
    TRANSFER_REVIEW: '现金划转复核',
    ORG_ISOLATION: '组织隔离提示',
  }[code] || fallback || '-'
}

function taskStatusLabel(value) {
  return {
    READY: '已就绪',
    WARNING: '需处理',
    INFO: '提示',
  }[value] || value || '-'
}

function taskStatusColor(value) {
  return {
    READY: 'success',
    WARNING: 'warning',
    INFO: 'info',
  }[value] || 'default'
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
    Operating: '经营活动',
    Investing: '投资活动',
    Financing: '筹资活动',
    'Cash transfer': '现金划转',
    'Unknown code': '未知编码',
    'Mixed-code review': '多编码复核',
    'Pending supplement': '待补资料',
  }[code] || fallback || '-'
}

function issueLabel(value) {
  return {
    'Unknown cashflow item code': '现金流项目编码未识别',
    'Multiple cashflow item codes in one voucher': '同一凭证出现多个现金流项目编码',
    'No explicit tag; classified by account-type heuristic': '未标记现金流项目，系统按科目类型自动推断',
    'Transfer between cash-like accounts; skipped by statement': '现金类科目之间互转，主表已跳过',
  }[value] || value || '-'
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
  await loadOrgOptions()
  await fetchData()
})
</script>

<style scoped>
.cashflow-supplement-page {
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

.section-title {
  margin-bottom: 12px;
  color: #284780;
  font-size: 16px;
  font-weight: 700;
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
