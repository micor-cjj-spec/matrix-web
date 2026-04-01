<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">账龄分析表</h2>
          <div class="page-subtitle">
            账龄分析基于原单据金额减已落库核销链接来计算剩余未核销余额，并按 0-30、31-60、61-90、90+ 天进行分桶。
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
        item-key="counterparty"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.openAmount="{ item }">{{ formatAmount(item.openAmount) }}</template>
        <template #item.writtenOffAmount="{ item }">{{ formatAmount(item.writtenOffAmount) }}</template>
        <template #item.bucket0_30="{ item }">{{ formatAmount(item.bucket0_30) }}</template>
        <template #item.bucket31_60="{ item }">{{ formatAmount(item.bucket31_60) }}</template>
        <template #item.bucket61_90="{ item }">{{ formatAmount(item.bucket61_90) }}</template>
        <template #item.bucket91Plus="{ item }">{{ formatAmount(item.bucket91Plus) }}</template>
        <template #item.creditLimit="{ item }">
          {{ item.creditLimit == null ? '-' : formatAmount(item.creditLimit) }}
        </template>
        <template #item.riskFlag="{ item }">
          <v-chip size="small" variant="tonal" :color="riskColor(item.riskFlag)">
            {{ riskLabel(item.riskFlag) }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import arapManageApi from '@/api/arapManage'
import { currentDate, docTypeRootOptions, formatAmount, riskColor, riskLabel } from './arapManageShared'

const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  counterpartyCount: 0,
  warningCount: 0,
  totalOpenAmount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  asOfDate: currentDate(),
})

const headers = [
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 160 },
  { title: '单据数', key: 'docCount', value: 'docCount', width: 88, align: 'center' },
  { title: '未核销余额', key: 'openAmount', value: 'openAmount', width: 130, align: 'end' },
  { title: '已核销金额', key: 'writtenOffAmount', value: 'writtenOffAmount', width: 130, align: 'end' },
  { title: '0-30 天', key: 'bucket0_30', value: 'bucket0_30', width: 120, align: 'end' },
  { title: '31-60 天', key: 'bucket31_60', value: 'bucket31_60', width: 120, align: 'end' },
  { title: '61-90 天', key: 'bucket61_90', value: 'bucket61_90', width: 120, align: 'end' },
  { title: '90+ 天', key: 'bucket91Plus', value: 'bucket91Plus', width: 120, align: 'end' },
  { title: '最大账龄', key: 'maxAgeDays', value: 'maxAgeDays', width: 96, align: 'center' },
  { title: '信用额度', key: 'creditLimit', value: 'creditLimit', width: 120, align: 'end' },
  { title: '风险状态', key: 'riskFlag', value: 'riskFlag', width: 108, align: 'center' },
  { title: '风险原因', key: 'riskReason', value: 'riskReason', minWidth: 120 },
]

const summaryCards = computed(() => [
  {
    label: '往来方数',
    value: String(summary.counterpartyCount),
    tip: '账龄分析范围内的往来方数量',
    tone: 'tone-primary',
  },
  {
    label: '预警数',
    value: String(summary.warningCount),
    tip: '命中逾期或超额度的往来方',
    tone: 'tone-warning',
  },
  {
    label: '未核销余额',
    value: formatAmount(summary.totalOpenAmount),
    tip: '所有往来方剩余未核销金额',
    tone: 'tone-danger',
  },
  {
    label: '正常数',
    value: String(Math.max(0, summary.counterpartyCount - summary.warningCount)),
    tip: '当前未触发预警的往来方',
    tone: 'tone-success',
  },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await arapManageApi.fetchAgingAnalysis({
      docTypeRoot: query.docTypeRoot,
      asOfDate: query.asOfDate || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.counterpartyCount = Number(data.counterpartyCount || 0)
    summary.warningCount = Number(data.warningCount || 0)
    summary.totalOpenAmount = Number(data.totalOpenAmount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['账龄分析表加载失败。']
    summary.counterpartyCount = 0
    summary.warningCount = 0
    summary.totalOpenAmount = 0
  } finally {
    loading.value = false
  }
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
.summary-row { margin-bottom: 18px; }
.summary-card { height: 100%; border: 1px solid #e8eef7; border-radius: 14px; background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%); padding: 18px; }
.summary-label { color: #6d7891; font-size: 13px; }
.summary-value { margin-top: 8px; font-size: 28px; font-weight: 700; }
.summary-tip { margin-top: 6px; color: #8793ac; font-size: 12px; }
.alert-list { margin-bottom: 16px; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
