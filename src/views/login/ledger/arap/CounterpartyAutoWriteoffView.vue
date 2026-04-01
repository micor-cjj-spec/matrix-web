<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来自动核销</h2>
          <div class="page-subtitle">
            自动核销会基于已审核单据生成匹配并落库，适合作为第一期的批量清账能力。建议先预览方案，再执行自动核销。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="loadPreview">预览方案</v-btn>
          <v-btn
            color="success"
            variant="tonal"
            :disabled="executing || !rows.length"
            @click="executeWriteoff"
          >
            执行自动核销
          </v-btn>
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
            placeholder="不填则按全部往来方执行"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="query.asOfDate"
            type="date"
            label="统计日期"
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

      <v-alert v-if="lastResult.message" type="success" variant="tonal" class="mb-4">
        {{ lastResult.message }}
        <span v-if="lastResult.planCode">，方案号 {{ lastResult.planCode }}</span>
      </v-alert>

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
        :loading="loading || executing"
        item-key="sourceDocId"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.source="{ item }">
          <div class="two-line">
            <div>{{ item.sourceNumber }}</div>
            <div class="muted">{{ item.sourceType }} / {{ item.sourceDate || '-' }}</div>
          </div>
        </template>
        <template #item.target="{ item }">
          <div class="two-line">
            <div>{{ item.targetNumber }}</div>
            <div class="muted">{{ item.targetType }} / {{ item.targetDate || '-' }}</div>
          </div>
        </template>
        <template #item.suggestedAmount="{ item }">
          {{ formatAmount(item.suggestedAmount) }}
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import arapManageApi from '@/api/arapManage'
import { currentDate, docTypeRootOptions, formatAmount } from './arapManageShared'

const route = useRoute()
const loading = ref(false)
const executing = ref(false)
const rows = ref([])
const warnings = ref([])
const lastResult = reactive({ message: '', planCode: '' })
const summary = reactive({ suggestedAmount: 0, planCount: 0, sourceDocCount: 0, targetDocCount: 0 })

const query = reactive({
  docTypeRoot: 'AR',
  counterparty: '',
  asOfDate: currentDate(),
})

const headers = [
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 180 },
  { title: '源单据', key: 'source', value: 'source', minWidth: 220 },
  { title: '结算单据', key: 'target', value: 'target', minWidth: 220 },
  { title: '建议核销金额', key: 'suggestedAmount', value: 'suggestedAmount', width: 140, align: 'end' },
]

const summaryCards = computed(() => [
  {
    label: '方案条数',
    value: String(summary.planCount),
    tip: '本次预览到的匹配条数',
    tone: 'tone-primary',
  },
  {
    label: '建议核销金额',
    value: formatAmount(summary.suggestedAmount),
    tip: '当前方案可执行的金额',
    tone: 'tone-success',
  },
  {
    label: '源单据数',
    value: String(summary.sourceDocCount),
    tip: '参与匹配的源单据',
    tone: 'tone-warning',
  },
  {
    label: '结算单据数',
    value: String(summary.targetDocCount),
    tip: '参与匹配的结算单据',
    tone: 'tone-danger',
  },
])

async function loadPreview() {
  loading.value = true
  lastResult.message = ''
  lastResult.planCode = ''
  try {
    const res = await arapManageApi.fetchWriteoffPlan({
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
      auditedOnly: true,
    })
    applyPreviewResult(res.data || {})
  } catch (error) {
    rows.value = []
    warnings.value = ['自动核销预览加载失败。']
    resetSummary()
  } finally {
    loading.value = false
  }
}

async function executeWriteoff() {
  executing.value = true
  try {
    const res = await arapManageApi.executeAutoWriteoff({
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
    })
    const data = res.data || {}
    rows.value = data.records || []
    warnings.value = data.warnings || []
    summary.suggestedAmount = Number(data.totalAmount || 0)
    summary.planCount = Number(data.linkCount || 0)
    summary.sourceDocCount = Number(data.sourceDocCount || 0)
    summary.targetDocCount = Number(data.targetDocCount || 0)
    lastResult.message = data.message || '自动核销已执行。'
    lastResult.planCode = data.planCode || ''
  } catch (error) {
    warnings.value = [error?.response?.data?.message || '自动核销执行失败。']
  } finally {
    executing.value = false
  }
}

function applyPreviewResult(data) {
  rows.value = data.records || []
  warnings.value = data.warnings || []
  summary.suggestedAmount = Number(data.suggestedAmount || 0)
  summary.planCount = Number(data.planCount || 0)
  summary.sourceDocCount = Number(data.sourceDocCount || 0)
  summary.targetDocCount = Number(data.targetDocCount || 0)
}

function resetSummary() {
  summary.suggestedAmount = 0
  summary.planCount = 0
  summary.sourceDocCount = 0
  summary.targetDocCount = 0
}

function initFromRoute() {
  if (typeof route.query.docTypeRoot === 'string' && route.query.docTypeRoot) {
    query.docTypeRoot = route.query.docTypeRoot
  }
  if (typeof route.query.counterparty === 'string') {
    query.counterparty = route.query.counterparty
  }
  if (typeof route.query.asOfDate === 'string' && route.query.asOfDate) {
    query.asOfDate = route.query.asOfDate
  }
}

onMounted(() => {
  initFromRoute()
  loadPreview()
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
.two-line { display: flex; flex-direction: column; gap: 2px; }
.muted { color: #7f8aa3; font-size: 12px; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
