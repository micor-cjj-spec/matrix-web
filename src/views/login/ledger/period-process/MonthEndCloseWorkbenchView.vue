<template>
  <div class="month-end-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">月结工作台</h2>
          <div class="page-subtitle">
            汇总基础资料、凭证、总账、期末处理和报表生成结果，形成关账前检查视图。
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
        <v-chip size="small" variant="tonal" :color="closeStatusColor(meta.closeStatus)">
          关账状态: {{ closeStatusLabel(meta.closeStatus) }}
        </v-chip>
        <v-chip size="small" variant="tonal">本位币 {{ meta.baseCurrency || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">当前期间: {{ meta.currentPeriod || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">期间来源: {{ periodSourceLabel(meta.periodSource) }}</v-chip>
        <v-chip size="small" variant="tonal">期间状态: {{ meta.periodStatus || '-' }}</v-chip>
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

      <v-progress-linear
        :model-value="meta.readinessScore"
        :color="closeStatusColor(meta.closeStatus)"
        height="10"
        rounded
        class="readiness-bar"
      />

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

      <div class="section-title">关账前检查项</div>
      <v-data-table
        :headers="checkHeaders"
        :items="checkItems"
        :loading="loading"
        item-key="code"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.category="{ item }">
          {{ checkCategoryLabel(item.category) }}
        </template>
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="checkStatusColor(item.status)">
            {{ checkStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.severity="{ item }">
          <v-chip size="small" variant="tonal" :color="severityColor(item.severity)">
            {{ severityLabel(item.severity) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.routePath"
            size="small"
            variant="text"
            color="primary"
            @click="openRoute(item.routePath)"
          >
            下钻
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">月结步骤</div>
      <v-data-table
        :headers="stepHeaders"
        :items="steps"
        :loading="loading"
        item-key="stepCode"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="moduleStatusColor(item.status)">
            {{ moduleStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.routePath"
            size="small"
            variant="text"
            color="primary"
            @click="openRoute(item.routePath)"
          >
            进入
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import periodProcessApi from '@/api/periodProcess'
import {
  checkCategoryLabel,
  checkStatusColor,
  checkStatusLabel,
  closeStatusColor,
  closeStatusLabel,
  currentPeriod,
  loadOrgOptions,
  moduleStatusColor,
  moduleStatusLabel,
  periodSourceLabel,
  severityColor,
  severityLabel,
} from './periodProcessShared'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orgOptions = ref([])
const checkItems = ref([])
const steps = ref([])
const warnings = ref([])

const query = reactive({
  forg: null,
  period: currentPeriod(),
})

const meta = reactive({
  closeStatus: '',
  readinessScore: 0,
  canClose: false,
  baseCurrency: '',
  currentPeriod: '',
  periodSource: '',
  periodStatus: '',
  blockingCount: 0,
  warningCount: 0,
  pendingCount: 0,
  passedCount: 0,
  totalCheckCount: 0,
  periodVoucherCount: 0,
  postedVoucherCount: 0,
  pendingVoucherCount: 0,
  exceptionVoucherCount: 0,
})

const checkHeaders = [
  { title: '类别', key: 'category', value: 'category', width: 110 },
  { title: '检查项', key: 'name', value: 'name', width: 180 },
  { title: '状态', key: 'status', value: 'status', width: 100, align: 'center' },
  { title: '级别', key: 'severity', value: 'severity', width: 90, align: 'center' },
  { title: '说明', key: 'message', value: 'message' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
  { title: '关联数', key: 'relatedCount', value: 'relatedCount', width: 90, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 90, align: 'center' },
]

const stepHeaders = [
  { title: '序号', key: 'orderNo', value: 'orderNo', width: 80, align: 'center' },
  { title: '步骤', key: 'stepName', value: 'stepName', width: 150 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '摘要', key: 'summary', value: 'summary' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
  { title: '阻塞', key: 'blockingCount', value: 'blockingCount', width: 80, align: 'center' },
  { title: '预警', key: 'warningCount', value: 'warningCount', width: 80, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 90, align: 'center' },
]

const summaryCards = computed(() => ([
  {
    label: '准备度',
    value: `${meta.readinessScore || 0}%`,
    tip: '按检查项通过情况计算',
    tone: meta.closeStatus === 'BLOCKED' ? 'tone-warning' : 'tone-success',
  },
  {
    label: '阻塞项',
    value: String(meta.blockingCount || 0),
    tip: '阻塞项为 0 才可能进入关账建议',
    tone: meta.blockingCount > 0 ? 'tone-danger' : 'tone-success',
  },
  {
    label: '待处理凭证',
    value: String(meta.pendingVoucherCount || 0),
    tip: '草稿、已提交、已审核视为待处理',
    tone: meta.pendingVoucherCount > 0 ? 'tone-warning' : 'tone-success',
  },
  {
    label: '检查项',
    value: `${meta.passedCount || 0}/${meta.totalCheckCount || 0}`,
    tip: '已通过 / 全部检查项',
    tone: 'tone-primary',
  },
]))

async function fetchData() {
  loading.value = true
  try {
    const res = await periodProcessApi.fetchMonthEndWorkbench({
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    const data = res.data || {}
    checkItems.value = data.checkItems || []
    steps.value = data.steps || []
    warnings.value = data.warnings || []
    assignMeta(data)
  } catch {
    checkItems.value = []
    steps.value = []
    warnings.value = ['月结工作台加载失败。']
    resetMeta()
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.period = currentPeriod()
  fetchData()
}

function assignMeta(data) {
  meta.closeStatus = data.closeStatus || ''
  meta.readinessScore = Number(data.readinessScore || 0)
  meta.canClose = Boolean(data.canClose)
  meta.baseCurrency = data.baseCurrency || ''
  meta.currentPeriod = data.currentPeriod || ''
  meta.periodSource = data.periodSource || ''
  meta.periodStatus = data.periodStatus || ''
  meta.blockingCount = Number(data.blockingCount || 0)
  meta.warningCount = Number(data.warningCount || 0)
  meta.pendingCount = Number(data.pendingCount || 0)
  meta.passedCount = Number(data.passedCount || 0)
  meta.totalCheckCount = Number(data.totalCheckCount || 0)
  meta.periodVoucherCount = Number(data.periodVoucherCount || 0)
  meta.postedVoucherCount = Number(data.postedVoucherCount || 0)
  meta.pendingVoucherCount = Number(data.pendingVoucherCount || 0)
  meta.exceptionVoucherCount = Number(data.exceptionVoucherCount || 0)
}

function resetMeta() {
  assignMeta({})
}

function openRoute(path) {
  router.push({
    path,
    query: {
      forg: query.forg || undefined,
      period: query.period || undefined,
    },
  })
}

onMounted(async () => {
  orgOptions.value = await loadOrgOptions().catch(() => [])
  if (!query.forg && orgOptions.value.length) {
    query.forg = orgOptions.value[0].value
  }
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
.month-end-page {
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
  margin-bottom: 12px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e6edf8;
  border-radius: 14px;
  padding: 18px;
  background: #fff;
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

.readiness-bar {
  margin: 6px 0 18px;
}

.section-title {
  margin: 22px 0 12px;
  color: #274982;
  font-size: 16px;
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

.tone-danger {
  color: #c94343;
}
</style>

