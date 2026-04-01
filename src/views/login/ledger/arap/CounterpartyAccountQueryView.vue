<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来账查询</h2>
          <div class="page-subtitle">
            从单据维度查看往来余额、核销状态、账龄和关联凭证，适合做日常追踪、问题排查和单据级核对。
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
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.docType"
            label="单据类型"
            density="comfortable"
            placeholder="如 AR / AP_PAYMENT_PROCESS"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.status"
            label="单据状态"
            density="comfortable"
            placeholder="如 AUDITED"
            clearable
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
            v-model.trim="query.keyword"
            label="关键字"
            density="comfortable"
            placeholder="单据号、凭证号、备注"
            clearable
          />
        </v-col>
      </v-row>

      <v-row dense class="mb-4">
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
            v-model="query.openOnly"
            color="primary"
            inset
            label="仅看未核销"
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
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.role="{ item }">
          <v-chip size="small" variant="tonal" :color="roleTone(item.role)">
            {{ roleLabel(item.role) }}
          </v-chip>
        </template>
        <template #item.amount="{ item }">{{ formatAmount(item.amount) }}</template>
        <template #item.writtenOffAmount="{ item }">{{ formatAmount(item.writtenOffAmount) }}</template>
        <template #item.openAmount="{ item }">{{ formatAmount(item.openAmount) }}</template>
        <template #item.writeoffStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="writeoffStatusColor(item.writeoffStatus)">
            {{ writeoffStatusLabel(item.writeoffStatus) }}
          </v-chip>
        </template>
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
  roleLabel,
  roleTone,
  writeoffStatusColor,
  writeoffStatusLabel,
} from './arapManageShared'

const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  totalAmount: 0,
  writtenOffAmount: 0,
  openAmount: 0,
  docCount: 0,
  openDocCount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  docType: '',
  status: '',
  counterparty: '',
  keyword: '',
  asOfDate: currentDate(),
  openOnly: false,
})

const headers = [
  { title: '往来方', key: 'counterparty', value: 'counterparty', minWidth: 160 },
  { title: '单据类型', key: 'docType', value: 'docType', width: 150 },
  { title: '单据号', key: 'number', value: 'number', width: 160 },
  { title: '单据日期', key: 'docDate', value: 'docDate', width: 110 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '角色', key: 'role', value: 'role', width: 110, align: 'center' },
  { title: '原额', key: 'amount', value: 'amount', width: 120, align: 'end' },
  { title: '已核销', key: 'writtenOffAmount', value: 'writtenOffAmount', width: 120, align: 'end' },
  { title: '未核销', key: 'openAmount', value: 'openAmount', width: 120, align: 'end' },
  { title: '核销状态', key: 'writeoffStatus', value: 'writeoffStatus', width: 120, align: 'center' },
  { title: '账龄', key: 'ageDays', value: 'ageDays', width: 88, align: 'center' },
  { title: '关联凭证', key: 'voucherNumber', value: 'voucherNumber', minWidth: 140 },
]

const summaryCards = computed(() => [
  {
    label: '单据数',
    value: String(summary.docCount),
    tip: `未核销 ${summary.openDocCount} 张`,
    tone: 'tone-primary',
  },
  {
    label: '原额',
    value: formatAmount(summary.totalAmount),
    tip: '当前筛选范围内原始金额',
    tone: 'tone-success',
  },
  {
    label: '已核销',
    value: formatAmount(summary.writtenOffAmount),
    tip: '累计已核销金额',
    tone: 'tone-warning',
  },
  {
    label: '未核销',
    value: formatAmount(summary.openAmount),
    tip: '仍可继续核销的余额',
    tone: 'tone-danger',
  },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await arapManageApi.fetchCounterpartyAccountQuery({
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      docType: query.docType || undefined,
      status: query.status || undefined,
      openOnly: query.openOnly,
      keyword: query.keyword || undefined,
      asOfDate: query.asOfDate || undefined,
    })
    const data = res.data || {}
    rows.value = data.records || []
    warnings.value = data.warnings || []
    summary.totalAmount = Number(data.totalAmount || 0)
    summary.writtenOffAmount = Number(data.writtenOffAmount || 0)
    summary.openAmount = Number(data.openAmount || 0)
    summary.docCount = Number(data.docCount || 0)
    summary.openDocCount = Number(data.openDocCount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['往来账查询加载失败。']
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
.switch-col { display: flex; align-items: center; }
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
