<template>
  <div class="period-process-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">监控中心</h2>
          <div class="page-subtitle">
            从期末处理全流程视角，统一查看当前期间的阻塞项、待处理模块和总体准备度。
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
        <v-chip size="small" variant="tonal">本位币 {{ meta.baseCurrency || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">当前期间: {{ meta.currentPeriod || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">期间来源: {{ periodSourceLabel(meta.periodSource) }}</v-chip>
        <v-chip size="small" variant="tonal">期间状态: {{ meta.periodStatus || '-' }}</v-chip>
        <v-chip size="small" variant="tonal" :color="meta.foundationHealthy ? 'success' : 'warning'">
          基础资料: {{ meta.foundationHealthy ? '健康' : '待检查' }}
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

      <div class="section-title">期末模块监控</div>
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        item-key="moduleCode"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="moduleStatusColor(item.status)">
            {{ moduleStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openModule(item)">
            进入模块
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import periodProcessApi from '@/api/periodProcess'
import {
  currentPeriod,
  loadOrgOptions,
  moduleStatusColor,
  moduleStatusLabel,
  periodSourceLabel,
} from './periodProcessShared'

const router = useRouter()
const loading = ref(false)
const orgOptions = ref([])
const rows = ref([])
const warnings = ref([])

const query = reactive({
  forg: null,
  period: currentPeriod(),
})

const meta = reactive({
  baseCurrency: '',
  currentPeriod: '',
  periodSource: '',
  periodStatus: '',
  foundationHealthy: false,
  totalModules: 0,
  readyModules: 0,
  warningModules: 0,
  pendingModules: 0,
  periodVoucherCount: 0,
  pendingVoucherCount: 0,
})

const headers = [
  { title: '模块', key: 'moduleName', value: 'moduleName', width: 140 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '摘要', key: 'summary', value: 'summary' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
  { title: '相关凭证', key: 'matchedVoucherCount', value: 'matchedVoucherCount', width: 110, align: 'center' },
  { title: '待处理', key: 'pendingVoucherCount', value: 'pendingVoucherCount', width: 100, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const moduleRouteMap = {
  PL: '/ledger/period-profit-loss',
  AT: '/ledger/period-auto-transfer',
  FX: '/ledger/period-fx-revalue',
  AM: '/ledger/period-voucher-amortization',
  CL: '/ledger/period-close-books',
}

const summaryCards = computed(() => ([
  {
    label: '期末模块数',
    value: String(meta.totalModules || 0),
    tip: '当前纳入监控的全部期末模块',
    tone: 'tone-primary',
  },
  {
    label: '已就绪模块',
    value: String(meta.readyModules || 0),
    tip: 'READY 与 DONE 视为已就绪',
    tone: 'tone-success',
  },
  {
    label: '阻塞模块',
    value: String(meta.warningModules || 0),
    tip: 'WARNING 代表存在阻塞项',
    tone: meta.warningModules > 0 ? 'tone-warning' : 'tone-success',
  },
  {
    label: '待处理凭证',
    value: String(meta.pendingVoucherCount || 0),
    tip: '来自结账视角的未过账凭证数',
    tone: meta.pendingVoucherCount > 0 ? 'tone-warning' : 'tone-success',
  },
]))

async function fetchData() {
  loading.value = true
  try {
    const res = await periodProcessApi.fetchMonitorCenter({
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    const data = res.data || {}
    rows.value = data.modules || []
    warnings.value = data.warnings || []
    meta.baseCurrency = data.baseCurrency || ''
    meta.currentPeriod = data.currentPeriod || ''
    meta.periodSource = data.periodSource || ''
    meta.periodStatus = data.periodStatus || ''
    meta.foundationHealthy = Boolean(data.foundationHealthy)
    meta.totalModules = Number(data.totalModules || 0)
    meta.readyModules = Number(data.readyModules || 0)
    meta.warningModules = Number(data.warningModules || 0)
    meta.pendingModules = Number(data.pendingModules || 0)
    meta.periodVoucherCount = Number(data.periodVoucherCount || 0)
    meta.pendingVoucherCount = Number(data.pendingVoucherCount || 0)
  } catch {
    rows.value = []
    warnings.value = ['监控中心加载失败。']
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
  meta.foundationHealthy = false
  meta.totalModules = 0
  meta.readyModules = 0
  meta.warningModules = 0
  meta.pendingModules = 0
  meta.periodVoucherCount = 0
  meta.pendingVoucherCount = 0
}

function openModule(item) {
  const path = moduleRouteMap[item.moduleCode]
  if (!path) return
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
