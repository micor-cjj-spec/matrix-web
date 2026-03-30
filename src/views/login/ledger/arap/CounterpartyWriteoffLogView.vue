<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来核销日志</h2>
          <div class="page-subtitle">
            记录自动核销批次和落库的单据配对明细，用于追溯本期清账动作、批次金额和操作人员。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="2">
          <v-select
            v-model="query.docTypeRoot"
            :items="docTypeRootOptions"
            label="往来类型"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.counterparty"
            label="往来方"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.planCode"
            label="方案号"
            density="comfortable"
            placeholder="可直接输入精确方案号"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="query.startDate"
            type="date"
            label="开始日期"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="query.endDate"
            type="date"
            label="结束日期"
            density="comfortable"
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

      <div class="section-title">核销批次</div>
      <v-data-table
        :headers="logHeaders"
        :items="rows"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.totalAmount="{ item }">{{ formatAmount(item.totalAmount) }}</template>
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" color="success">
            {{ logStatusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="viewPlanDetail(item.planCode)">
            查看明细
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">
        核销明细
        <span v-if="query.planCode" class="section-tip">当前方案号：{{ query.planCode }}</span>
      </div>
      <v-data-table
        :headers="detailHeaders"
        :items="linkDetails"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.amount="{ item }">{{ formatAmount(item.amount) }}</template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import arapManageApi from '@/api/arapManage'
import { docTypeRootOptions, formatAmount, logStatusLabel } from './arapManageShared'

const route = useRoute()
const loading = ref(false)
const rows = ref([])
const linkDetails = ref([])
const warnings = ref([])
const summary = reactive({
  logCount: 0,
  linkCount: 0,
  totalAmount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  counterparty: '',
  planCode: '',
  startDate: '',
  endDate: '',
})

const logHeaders = [
  { title: '方案号', key: 'planCode', value: 'planCode', minWidth: 220 },
  { title: '往来类型', key: 'docTypeRoot', value: 'docTypeRoot', width: 96, align: 'center' },
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 140 },
  { title: '模式', key: 'mode', value: 'mode', width: 96, align: 'center' },
  { title: '链接数', key: 'linkCount', value: 'linkCount', width: 88, align: 'center' },
  { title: '金额', key: 'totalAmount', value: 'totalAmount', width: 120, align: 'end' },
  { title: '状态', key: 'status', value: 'status', width: 96, align: 'center' },
  { title: '操作人', key: 'operator', value: 'operator', width: 110 },
  { title: '操作时间', key: 'operateTime', value: 'operateTime', width: 180 },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const detailHeaders = [
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 140 },
  { title: '源单据', key: 'sourceNumber', value: 'sourceNumber', width: 160 },
  { title: '源类型', key: 'sourceType', value: 'sourceType', width: 140 },
  { title: '结算单据', key: 'targetNumber', value: 'targetNumber', width: 160 },
  { title: '结算类型', key: 'targetType', value: 'targetType', width: 150 },
  { title: '核销金额', key: 'amount', value: 'amount', width: 120, align: 'end' },
  { title: '操作人', key: 'operator', value: 'operator', width: 110 },
  { title: '操作时间', key: 'operateTime', value: 'operateTime', width: 180 },
  { title: '备注', key: 'remark', value: 'remark', minWidth: 140 },
]

const summaryCards = computed(() => [
  {
    label: '批次数',
    value: String(summary.logCount),
    tip: '满足当前条件的自动核销批次',
    tone: 'tone-primary',
  },
  {
    label: '链接数',
    value: String(summary.linkCount),
    tip: '所有批次累计落库明细数',
    tone: 'tone-success',
  },
  {
    label: '核销金额',
    value: formatAmount(summary.totalAmount),
    tip: '所有批次累计金额',
    tone: 'tone-warning',
  },
  {
    label: '明细查看',
    value: query.planCode ? '已锁定方案' : '未锁定方案',
    tip: query.planCode ? '下方仅显示当前方案明细' : '点击批次查看明细',
    tone: 'tone-danger',
  },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await arapManageApi.fetchWriteoffLog({
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      planCode: query.planCode || undefined,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
    })
    const data = res.data || {}
    rows.value = data.records || []
    linkDetails.value = data.linkDetails || []
    warnings.value = data.warnings || []
    summary.logCount = Number(data.logCount || 0)
    summary.linkCount = Number(data.linkCount || 0)
    summary.totalAmount = Number(data.totalAmount || 0)
  } catch (error) {
    rows.value = []
    linkDetails.value = []
    warnings.value = ['往来核销日志加载失败。']
    summary.logCount = 0
    summary.linkCount = 0
    summary.totalAmount = 0
  } finally {
    loading.value = false
  }
}

function viewPlanDetail(planCode) {
  query.planCode = planCode || ''
  fetchData()
}

function initFromRoute() {
  if (typeof route.query.docTypeRoot === 'string' && route.query.docTypeRoot) {
    query.docTypeRoot = route.query.docTypeRoot
  }
  if (typeof route.query.counterparty === 'string') {
    query.counterparty = route.query.counterparty
  }
  if (typeof route.query.planCode === 'string') {
    query.planCode = route.query.planCode
  }
}

onMounted(() => {
  initFromRoute()
  fetchData()
})
</script>

<style scoped>
.page { padding: 24px; }
.page-card { padding: 24px; border-radius: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 0; color: #1d3f8f; font-size: 24px; font-weight: 700; }
.page-subtitle { margin-top: 8px; color: #5d6b85; font-size: 14px; line-height: 1.7; }
.page-actions { display: flex; gap: 8px; }
.summary-row { margin-bottom: 18px; }
.summary-card { height: 100%; border: 1px solid #e8eef7; border-radius: 14px; background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%); padding: 18px; }
.summary-label { color: #6d7891; font-size: 13px; }
.summary-value { margin-top: 8px; font-size: 28px; font-weight: 700; }
.summary-tip { margin-top: 6px; color: #8793ac; font-size: 12px; }
.alert-list { margin-bottom: 16px; }
.section-title { margin-bottom: 12px; color: #284780; font-size: 16px; font-weight: 700; }
.section-tip { margin-left: 8px; color: #76839f; font-size: 13px; font-weight: 400; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
