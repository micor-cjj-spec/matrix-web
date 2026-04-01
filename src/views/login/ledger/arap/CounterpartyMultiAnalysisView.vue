<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来多维分析表</h2>
          <div class="page-subtitle">
            可按往来方、单据类型、状态、角色等维度汇总往来金额，帮助快速识别异常集中点和清账优先级。
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
          <v-select
            v-model="query.groupDimension"
            :items="groupDimensionOptions"
            label="汇总维度"
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
        item-key="groupKey"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.amount="{ item }">{{ formatAmount(item.amount) }}</template>
        <template #item.writtenOffAmount="{ item }">{{ formatAmount(item.writtenOffAmount) }}</template>
        <template #item.openAmount="{ item }">{{ formatAmount(item.openAmount) }}</template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import arapManageApi from '@/api/arapManage'
import {
  currentDate,
  docTypeRootOptions,
  formatAmount,
  groupDimensionLabel,
  groupDimensionOptions,
} from './arapManageShared'

const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  groupCount: 0,
  totalAmount: 0,
  writtenOffAmount: 0,
  openAmount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  groupDimension: 'COUNTERPARTY',
  asOfDate: currentDate(),
})

const headers = [
  { title: '分组键', key: 'groupKey', value: 'groupKey', minWidth: 150 },
  { title: '分组名称', key: 'groupName', value: 'groupName', minWidth: 180 },
  { title: '单据数', key: 'docCount', value: 'docCount', width: 90, align: 'center' },
  { title: '原额', key: 'amount', value: 'amount', width: 120, align: 'end' },
  { title: '已核销', key: 'writtenOffAmount', value: 'writtenOffAmount', width: 120, align: 'end' },
  { title: '未核销', key: 'openAmount', value: 'openAmount', width: 120, align: 'end' },
  { title: '平均账龄', key: 'avgAgeDays', value: 'avgAgeDays', width: 100, align: 'center' },
  { title: '最近日期', key: 'latestDate', value: 'latestDate', width: 120, align: 'center' },
]

const summaryCards = computed(() => [
  {
    label: '分组数',
    value: String(summary.groupCount),
    tip: `当前按${groupDimensionLabel(query.groupDimension)}汇总`,
    tone: 'tone-primary',
  },
  {
    label: '原额',
    value: formatAmount(summary.totalAmount),
    tip: '汇总维度下所有往来原额',
    tone: 'tone-success',
  },
  {
    label: '已核销',
    value: formatAmount(summary.writtenOffAmount),
    tip: '汇总维度下累计已核销金额',
    tone: 'tone-warning',
  },
  {
    label: '未核销',
    value: formatAmount(summary.openAmount),
    tip: '汇总维度下剩余未核销金额',
    tone: 'tone-danger',
  },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await arapManageApi.fetchMultiAnalysis({
      docTypeRoot: query.docTypeRoot,
      groupDimension: query.groupDimension,
      asOfDate: query.asOfDate || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.groupCount = Number(data.groupCount || 0)
    summary.totalAmount = Number(data.totalAmount || 0)
    summary.writtenOffAmount = Number(data.writtenOffAmount || 0)
    summary.openAmount = Number(data.openAmount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['往来多维分析表加载失败。']
    summary.groupCount = 0
    summary.totalAmount = 0
    summary.writtenOffAmount = 0
    summary.openAmount = 0
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
