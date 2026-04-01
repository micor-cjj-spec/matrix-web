<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">凭证折算规则</h2>
          <div class="page-subtitle">
            展示当前系统内置的单据转凭证规则，并结合业务单据实际生成情况检查规则覆盖率和待生成量。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-select v-model="query.docTypeRoot" :items="docTypeRootOptions" label="往来类型" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model.trim="query.keyword" label="关键字" density="comfortable" placeholder="规则名、单据类型、科目" clearable />
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
        <v-alert v-for="warning in warnings" :key="warning" type="warning" variant="tonal" density="comfortable" class="mb-2">
          {{ warning }}
        </v-alert>
      </div>

      <v-data-table :headers="headers" :items="rows" :loading="loading" item-key="docType" hide-default-footer class="elevation-0">
        <template #item.accountPair="{ item }">
          <div class="two-line">
            <div>借：{{ item.debitAccountCode || '-' }} {{ item.debitAccountName || '' }}</div>
            <div class="muted">贷：{{ item.creditAccountCode || '-' }} {{ item.creditAccountName || '' }}</div>
          </div>
        </template>
        <template #item.coverageRate="{ item }">
          <v-chip size="small" variant="tonal" :color="Number(String(item.coverageRate || '0').replace('%', '')) >= 100 ? 'success' : 'warning'">
            {{ item.coverageRate || '0.00%' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openBizDoc(item)">业务单据</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ledgerCollaborationApi from '@/api/ledgerCollaboration'
import { docTypeRootOptions } from './ledgerCollaborationShared'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive({
  ruleCount: 0,
  auditedCount: 0,
  generatedCount: 0,
  pendingCount: 0,
})

const query = reactive({
  docTypeRoot: 'ALL',
  keyword: '',
})

const headers = [
  { title: '规则名称', key: 'ruleName', value: 'ruleName', minWidth: 180 },
  { title: '单据类型', key: 'docType', value: 'docType', width: 150 },
  { title: '会计科目', key: 'accountPair', value: 'accountPair', minWidth: 240 },
  { title: '单据数', key: 'docCount', value: 'docCount', width: 88, align: 'center' },
  { title: '已审核', key: 'auditedCount', value: 'auditedCount', width: 88, align: 'center' },
  { title: '已生成凭证', key: 'generatedCount', value: 'generatedCount', width: 110, align: 'center' },
  { title: '待生成', key: 'pendingCount', value: 'pendingCount', width: 88, align: 'center' },
  { title: '覆盖率', key: 'coverageRate', value: 'coverageRate', width: 100, align: 'center' },
  { title: '最近单据日期', key: 'lastDocDate', value: 'lastDocDate', width: 130 },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const summaryCards = computed(() => [
  { label: '规则数', value: String(summary.ruleCount), tip: '当前条件下的可视化折算规则', tone: 'tone-primary' },
  { label: '已审核单据', value: String(summary.auditedCount), tip: '达到可生成凭证阶段的业务单据', tone: 'tone-success' },
  { label: '已生成凭证', value: String(summary.generatedCount), tip: '已经成功关联凭证的单据数', tone: 'tone-primary' },
  { label: '待生成', value: String(summary.pendingCount), tip: '已审核但仍未生成凭证的单据数', tone: 'tone-warning' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerCollaborationApi.fetchVoucherRules({
      docTypeRoot: query.docTypeRoot || undefined,
      keyword: query.keyword || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    summary.ruleCount = Number(data.ruleCount || 0)
    summary.auditedCount = Number(data.auditedCount || 0)
    summary.generatedCount = Number(data.generatedCount || 0)
    summary.pendingCount = Number(data.pendingCount || 0)
  } catch (error) {
    rows.value = []
    warnings.value = ['凭证折算规则加载失败。']
    summary.ruleCount = 0
    summary.auditedCount = 0
    summary.generatedCount = 0
    summary.pendingCount = 0
  } finally {
    loading.value = false
  }
}

function openBizDoc(item) {
  const path = item.docTypeRoot === 'AP' ? '/payable/manage' : '/receivable/manage'
  router.push(path)
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
.two-line { display: flex; flex-direction: column; gap: 4px; }
.muted { color: #7f8ba3; font-size: 12px; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
</style>
