<template>
  <div class="voucher-summary-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">凭证汇总表</h2>
          <div class="page-subtitle">
            以日期为主线统计凭证数量、金额和状态分布，用来快速发现待审核、待过账和异常积压。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="2">
          <v-text-field
            v-model="query.startDate"
            type="date"
            label="开始日期"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="query.endDate"
            type="date"
            label="结束日期"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="query.status"
            :items="statusOptions"
            label="状态"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model.trim="query.summaryKeyword"
            label="摘要关键字"
            density="comfortable"
            clearable
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
        item-key="bizDate"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.totalAmount="{ item }">
          {{ formatAmount(item.totalAmount) }}
        </template>
        <template #item.postedAmount="{ item }">
          {{ formatAmount(item.postedAmount) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucherList(item)">
            查看凭证
          </v-btn>
        </template>
      </v-data-table>

      <v-alert v-if="!loading && !rows.length" type="info" variant="tonal" class="mt-4">
        当前条件下没有汇总数据。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import voucherApi from '@/api/voucher'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const summary = reactive(createEmptySummary())

const query = reactive({
  startDate: firstDayOfMonth(),
  endDate: today(),
  status: '',
  summaryKeyword: '',
})

const statusOptions = [
  { title: '全部', value: '' },
  { title: '草稿', value: 'DRAFT' },
  { title: '已提交', value: 'SUBMITTED' },
  { title: '已审核', value: 'AUDITED' },
  { title: '已过账', value: 'POSTED' },
  { title: '已驳回', value: 'REJECTED' },
  { title: '已冲销', value: 'REVERSED' },
]

const headers = [
  { title: '日期', key: 'bizDate', value: 'bizDate', width: 120 },
  { title: '凭证数', key: 'voucherCount', value: 'voucherCount', width: 90, align: 'center' },
  { title: '合计金额', key: 'totalAmount', value: 'totalAmount', width: 140, align: 'end' },
  { title: '草稿', key: 'draftCount', value: 'draftCount', width: 80, align: 'center' },
  { title: '已提交', key: 'submittedCount', value: 'submittedCount', width: 90, align: 'center' },
  { title: '已审核', key: 'auditedCount', value: 'auditedCount', width: 90, align: 'center' },
  { title: '已过账', key: 'postedCount', value: 'postedCount', width: 90, align: 'center' },
  { title: '已驳回', key: 'rejectedCount', value: 'rejectedCount', width: 90, align: 'center' },
  { title: '已冲销', key: 'reversedCount', value: 'reversedCount', width: 90, align: 'center' },
  { title: '已过账金额', key: 'postedAmount', value: 'postedAmount', width: 150, align: 'end' },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const summaryCards = computed(() => {
  const pendingCount = Number(summary.submittedCount || 0) + Number(summary.auditedCount || 0)
  const exceptionCount = Number(summary.rejectedCount || 0) + Number(summary.reversedCount || 0)

  return [
    {
      label: '凭证总数',
      value: String(summary.totalCount || 0),
      tip: '当前筛选范围内的所有凭证',
      tone: 'tone-primary',
    },
    {
      label: '合计金额',
      value: formatAmount(summary.totalAmount),
      tip: '按凭证头金额汇总',
      tone: 'tone-primary',
    },
    {
      label: '待处理凭证',
      value: String(pendingCount),
      tip: '已提交 + 已审核',
      tone: pendingCount > 0 ? 'tone-warning' : 'tone-success',
    },
    {
      label: '异常凭证',
      value: String(exceptionCount),
      tip: '已驳回 + 已冲销',
      tone: exceptionCount > 0 ? 'tone-danger' : 'tone-success',
    },
  ]
})

async function fetchData() {
  if (query.startDate && query.endDate && query.startDate > query.endDate) {
    warnings.value = ['开始日期不能晚于结束日期。']
    rows.value = []
    resetSummary()
    return
  }

  loading.value = true
  try {
    const res = await voucherApi.fetchSummary({
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      status: query.status || undefined,
      summaryKeyword: query.summaryKeyword || undefined,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    Object.assign(summary, createEmptySummary(), {
      totalCount: Number(data.totalCount || 0),
      totalAmount: Number(data.totalAmount || 0),
      postedCount: Number(data.postedCount || 0),
      postedAmount: Number(data.postedAmount || 0),
      draftCount: Number(data.draftCount || 0),
      submittedCount: Number(data.submittedCount || 0),
      auditedCount: Number(data.auditedCount || 0),
      rejectedCount: Number(data.rejectedCount || 0),
      reversedCount: Number(data.reversedCount || 0),
    })
  } catch (error) {
    rows.value = []
    warnings.value = ['凭证汇总表加载失败。']
    resetSummary()
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.startDate = firstDayOfMonth()
  query.endDate = today()
  query.status = ''
  query.summaryKeyword = ''
  fetchData()
}

function resetSummary() {
  Object.assign(summary, createEmptySummary())
}

function createEmptySummary() {
  return {
    totalCount: 0,
    totalAmount: 0,
    postedCount: 0,
    postedAmount: 0,
    draftCount: 0,
    submittedCount: 0,
    auditedCount: 0,
    rejectedCount: 0,
    reversedCount: 0,
  }
}

function openVoucherList(row) {
  const routeData = router.resolve({
    path: '/ledger/voucher',
    query: {
      startDate: row.bizDate,
      endDate: row.bizDate,
      status: query.status || undefined,
      summary: query.summaryKeyword || undefined,
    },
  })
  window.open(routeData.href, '_blank')
}

function formatAmount(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function today() {
  return formatDateInput(new Date())
}

function firstDayOfMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(fetchData)
</script>

<style scoped>
.voucher-summary-page {
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
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  color: #1d3f8f;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 8px;
  color: #5d6b85;
  font-size: 14px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.summary-row {
  margin-bottom: 18px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e8eef7;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%);
  padding: 18px;
}

.summary-label {
  color: #6d7891;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
}

.summary-tip {
  margin-top: 6px;
  color: #8793ac;
  font-size: 12px;
}

.tone-primary {
  color: #2453b3;
}

.tone-success {
  color: #21875e;
}

.tone-warning {
  color: #d08a08;
}

.tone-danger {
  color: #c44f37;
}

.alert-list {
  margin-bottom: 16px;
}
</style>
