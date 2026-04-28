<template>
  <div class="period-process-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ pageMeta.title }}</h2>
          <div class="page-subtitle">{{ pageMeta.subtitle }}</div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="4">
          <v-select
            v-model="query.forg"
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

      <div class="meta-strip">
        <v-chip size="small" variant="tonal">本位币 {{ meta.baseCurrency || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">当前期间: {{ meta.currentPeriod || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">期间来源: {{ periodSourceLabel(meta.periodSource) }}</v-chip>
        <v-chip size="small" variant="tonal">期间状态: {{ meta.periodStatus || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">默认凭证字: {{ meta.defaultVoucherType || '-' }}</v-chip>
        <v-chip size="small" variant="tonal" :color="meta.foundationHealthy ? 'success' : 'warning'">
          基础资料: {{ meta.foundationHealthy ? '健康' : '待检查' }}
        </v-chip>
        <v-chip size="small" variant="tonal" :color="moduleStatusColor(meta.moduleStatus)">
          模块状态: {{ moduleStatusLabel(meta.moduleStatus) }}
        </v-chip>
      </div>

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

      <div class="section-title">期末任务清单</div>
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
      </v-data-table>

      <div class="section-title">相关凭证</div>
      <v-data-table
        :headers="voucherHeaders"
        :items="relatedVouchers"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.famount="{ item }">
          {{ formatAmount(item.famount) }}
        </template>
        <template #item.fstatus="{ item }">
          {{ voucherStatusLabel(item.fstatus) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucher(item)">
            查看凭证
          </v-btn>
        </template>
      </v-data-table>

      <v-alert v-if="!loading && !relatedVouchers.length" type="info" variant="tonal" class="mt-4">
        当前条件下没有识别到相关凭证。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import periodProcessApi from '@/api/periodProcess'
import {
  currentPeriod,
  formatAmount,
  loadOrgOptions,
  moduleStatusColor,
  moduleStatusLabel,
  periodSourceLabel,
  taskStatusColor,
  taskStatusLabel,
  voucherStatusLabel,
} from './periodProcessShared'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orgOptions = ref([])
const tasks = ref([])
const relatedVouchers = ref([])
const warnings = ref([])

const pageConfig = {
  profitLoss: {
    title: '结转损益',
    subtitle: '检查本期损益类结转准备度，识别已生成的结转凭证以及未过账阻塞项。',
    fetcher: periodProcessApi.fetchProfitLoss,
  },
  autoTransfer: {
    title: '自动转账',
    subtitle: '聚焦月末转账、重分类和内部结转凭证，先完成检查再推进自动处理。',
    fetcher: periodProcessApi.fetchAutoTransfer,
  },
  fxRevalue: {
    title: '期末调汇',
    subtitle: '围绕本位币、当前期间和调汇类凭证进行月末调汇准备检查。',
    fetcher: periodProcessApi.fetchFxRevalue,
  },
  voucherAmortization: {
    title: '凭证摊销',
    subtitle: '识别摊销、折旧、预提类凭证，确认本期摊销类处理是否到位。',
    fetcher: periodProcessApi.fetchVoucherAmortization,
  },
  closeBooks: {
    title: '期末结账',
    subtitle: '从会计期间、凭证过账、基础资料和阻塞项四个维度判断本期是否满足结账条件。',
    fetcher: periodProcessApi.fetchCloseBooks,
  },
}

const pageMeta = computed(() => pageConfig[route.meta?.periodModule] || pageConfig.profitLoss)

const query = reactive({
  forg: null,
  period: currentPeriod(),
})

const meta = reactive({
  baseCurrency: '',
  currentPeriod: '',
  periodSource: '',
  periodStatus: '',
  defaultVoucherType: '',
  foundationHealthy: false,
  periodVoucherCount: 0,
  matchedVoucherCount: 0,
  postedVoucherCount: 0,
  pendingVoucherCount: 0,
  exceptionVoucherCount: 0,
  matchedAmount: 0,
  moduleStatus: '',
})

const taskHeaders = [
  { title: '任务项', key: 'name', value: 'name', width: 180 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '说明', key: 'message', value: 'message' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
]

const voucherHeaders = [
  { title: '凭证号', key: 'fnumber', value: 'fnumber', width: 180 },
  { title: '日期', key: 'fdate', value: 'fdate', width: 120 },
  { title: '摘要', key: 'fsummary', value: 'fsummary' },
  { title: '金额', key: 'famount', value: 'famount', width: 140, align: 'end' },
  { title: '状态', key: 'fstatus', value: 'fstatus', width: 110, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const summaryCards = computed(() => ([
  {
    label: '期间凭证数',
    value: String(meta.periodVoucherCount || 0),
    tip: '当前期间识别到的全部凭证',
    tone: 'tone-primary',
  },
  {
    label: '模块相关凭证',
    value: String(meta.matchedVoucherCount || 0),
    tip: '按摘要和备注关键词识别',
    tone: 'tone-primary',
  },
  {
    label: '待处理凭证',
    value: String(meta.pendingVoucherCount || 0),
    tip: '草稿、已提交、已审核视为待处理',
    tone: meta.pendingVoucherCount > 0 ? 'tone-warning' : 'tone-success',
  },
  {
    label: '相关金额',
    value: formatAmount(meta.matchedAmount),
    tip: '当前模块相关凭证金额汇总',
    tone: 'tone-success',
  },
]))

async function fetchData() {
  loading.value = true
  try {
    const res = await pageMeta.value.fetcher({
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    const data = res.data || {}
    tasks.value = data.tasks || []
    relatedVouchers.value = data.relatedVouchers || []
    warnings.value = data.warnings || []

    meta.baseCurrency = data.baseCurrency || ''
    meta.currentPeriod = data.currentPeriod || ''
    meta.periodSource = data.periodSource || ''
    meta.periodStatus = data.periodStatus || ''
    meta.defaultVoucherType = data.defaultVoucherType || ''
    meta.foundationHealthy = Boolean(data.foundationHealthy)
    meta.periodVoucherCount = Number(data.periodVoucherCount || 0)
    meta.matchedVoucherCount = Number(data.matchedVoucherCount || 0)
    meta.postedVoucherCount = Number(data.postedVoucherCount || 0)
    meta.pendingVoucherCount = Number(data.pendingVoucherCount || 0)
    meta.exceptionVoucherCount = Number(data.exceptionVoucherCount || 0)
    meta.matchedAmount = Number(data.matchedAmount || 0)
    meta.moduleStatus = data.moduleStatus || ''
  } catch {
    tasks.value = []
    relatedVouchers.value = []
    warnings.value = ['期末处理数据加载失败。']
    resetMeta()
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.period = currentPeriod()
  fetchData()
}

function resetMeta() {
  meta.baseCurrency = ''
  meta.currentPeriod = ''
  meta.periodSource = ''
  meta.periodStatus = ''
  meta.defaultVoucherType = ''
  meta.foundationHealthy = false
  meta.periodVoucherCount = 0
  meta.matchedVoucherCount = 0
  meta.postedVoucherCount = 0
  meta.pendingVoucherCount = 0
  meta.exceptionVoucherCount = 0
  meta.matchedAmount = 0
  meta.moduleStatus = ''
}

function openVoucher(item) {
  router.push({
    path: '/ledger/voucher',
    query: {
      number: item.fnumber || undefined,
    },
  })
}

onMounted(async () => {
  orgOptions.value = await loadOrgOptions().catch(() => [])
  if (typeof route.query?.forg === 'string' && route.query.forg) {
    query.forg = Number(route.query.forg) || query.forg
  }
  if (typeof route.query?.period === 'string' && route.query.period) {
    query.period = route.query.period
  }
  await fetchData()
})
</script>

<style scoped>
.period-process-page {
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
  margin-bottom: 18px;
}

.page-title {
  margin: 0 0 6px;
  color: #23447a;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  max-width: 820px;
  color: #59709c;
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
  margin-bottom: 14px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e6edf8;
  border-radius: 14px;
  padding: 18px;
  background: linear-gradient(180deg, #f9fbff 0%, #ffffff 100%);
}

.summary-label {
  color: #5f7399;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.summary-tip {
  margin-top: 8px;
  color: #7488ad;
  font-size: 12px;
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

.section-title {
  margin: 22px 0 12px;
  color: #274982;
  font-size: 16px;
  font-weight: 700;
}
</style>
