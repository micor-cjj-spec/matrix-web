<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来核销方案</h2>
          <div class="page-subtitle">
            基于未核销往来单据生成建议匹配方案。第一期采用同往来方、最早源单据优先匹配最早结算单据的自动规划口径。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询方案</v-btn>
          <v-btn variant="text" @click="goAutoWriteoff">去自动核销</v-btn>
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
            placeholder="不填则覆盖全部往来方"
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
        <v-col cols="12" md="2" class="switch-col">
          <v-switch
            v-model="query.auditedOnly"
            color="primary"
            inset
            label="仅已审核"
            hide-details
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

      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
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
        <template #item.sourceAgeDays="{ item }">
          {{ item.sourceAgeDays }} 天
        </template>
        <template #item.targetAgeDays="{ item }">
          {{ item.targetAgeDays }} 天
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
import { useRouter } from 'vue-router'
import arapManageApi from '@/api/arapManage'
import { currentDate, docTypeRootOptions, formatAmount } from './arapManageShared'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  sourceOpenAmount: 0,
  targetOpenAmount: 0,
  suggestedAmount: 0,
  remainingSourceAmount: 0,
  remainingTargetAmount: 0,
  planCount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  counterparty: '',
  asOfDate: currentDate(),
  auditedOnly: true,
})

const headers = [
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 180 },
  { title: '源单据', key: 'source', value: 'source', minWidth: 220 },
  { title: '源账龄', key: 'sourceAgeDays', value: 'sourceAgeDays', width: 96, align: 'center' },
  { title: '结算单据', key: 'target', value: 'target', minWidth: 220 },
  { title: '结算账龄', key: 'targetAgeDays', value: 'targetAgeDays', width: 96, align: 'center' },
  { title: '建议核销金额', key: 'suggestedAmount', value: 'suggestedAmount', width: 140, align: 'end' },
]

const summaryCards = computed(() => [
  {
    label: '源单据待核销',
    value: formatAmount(summary.sourceOpenAmount),
    tip: '可被结算的往来余额',
    tone: 'tone-primary',
  },
  {
    label: '结算单据待分配',
    value: formatAmount(summary.targetOpenAmount),
    tip: '可用于核销的结算余额',
    tone: 'tone-success',
  },
  {
    label: '建议核销金额',
    value: formatAmount(summary.suggestedAmount),
    tip: `本次共生成 ${summary.planCount} 条建议`,
    tone: 'tone-warning',
  },
  {
    label: '方案后剩余',
    value: formatAmount(summary.remainingSourceAmount),
    tip: `结算侧剩余 ${formatAmount(summary.remainingTargetAmount)}`,
    tone: 'tone-danger',
  },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await arapManageApi.fetchWriteoffPlan({
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
      auditedOnly: query.auditedOnly,
    })
    const data = res.data || {}
    rows.value = data.records || []
    warnings.value = data.warnings || []
    summary.sourceOpenAmount = Number(data.sourceOpenAmount || 0)
    summary.targetOpenAmount = Number(data.targetOpenAmount || 0)
    summary.suggestedAmount = Number(data.suggestedAmount || 0)
    summary.remainingSourceAmount = Number(data.remainingSourceAmount || 0)
    summary.remainingTargetAmount = Number(data.remainingTargetAmount || 0)
    summary.planCount = Number(data.planCount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['往来核销方案加载失败。']
    resetSummary()
  } finally {
    loading.value = false
  }
}

function resetSummary() {
  summary.sourceOpenAmount = 0
  summary.targetOpenAmount = 0
  summary.suggestedAmount = 0
  summary.remainingSourceAmount = 0
  summary.remainingTargetAmount = 0
  summary.planCount = 0
}

function goAutoWriteoff() {
  router.push({
    path: '/ledger/counterparty-auto-writeoff',
    query: {
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
    },
  })
}

onMounted(fetchData)
</script>

<style scoped>
.page { padding: 24px; }
.page-card { padding: 24px; border-radius: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 0; color: #1d3f8f; font-size: 24px; font-weight: 700; }
.page-subtitle { margin-top: 8px; color: #5d6b85; font-size: 14px; line-height: 1.7; }
.page-actions { display: flex; gap: 8px; }
.switch-col { display: flex; align-items: center; }
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
