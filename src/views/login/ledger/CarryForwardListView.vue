<template>
  <div class="carry-list-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">结转清单</h2>
          <div class="page-subtitle">
            先检查业务单元财务参数、会计期间和基础资料健康度，再查看本期识别到的结转相关凭证。
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
        <v-chip size="small" variant="tonal">本位币: {{ meta.baseCurrency || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">当前期间: {{ meta.currentPeriod || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">期间来源: {{ periodSourceLabel(meta.periodSource) }}</v-chip>
        <v-chip size="small" variant="tonal">期间状态: {{ meta.periodStatus || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">默认凭证字: {{ meta.defaultVoucherType || '-' }}</v-chip>
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

      <div class="section-title">期末检查清单</div>
      <v-data-table
        :headers="taskHeaders"
        :items="tasks"
        :loading="loading"
        item-key="code"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="taskStatusColor(item.status)">
            {{ taskStatusLabel(item.status) }}
          </v-chip>
        </template>
      </v-data-table>

      <div class="section-title">本期结转相关凭证</div>
      <v-data-table
        :headers="voucherHeaders"
        :items="relatedVouchers"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.famount="{ item }">
          {{ formatAmount(item.famount) }}
        </template>
        <template #item.fstatus="{ item }">
          {{ statusLabel(item.fstatus) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openVoucher(item)">
            查看凭证
          </v-btn>
        </template>
      </v-data-table>

      <v-alert v-if="!loading && !relatedVouchers.length" type="info" variant="tonal" class="mt-4">
        当前期间没有识别到结转相关凭证。
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import voucherApi from '@/api/voucher'

const router = useRouter()
const loading = ref(false)
const tasks = ref([])
const relatedVouchers = ref([])
const warnings = ref([])
const orgOptions = ref([])

const query = reactive({
  forg: null,
  period: currentPeriod(),
})

const meta = reactive({
  baseCurrency: '',
  currentPeriod: '',
  periodSource: '',
  periodStatus: '',
  defaultVoucherType: '',
  foundationHealthy: false,
  periodVoucherCount: 0,
  carryVoucherCount: 0,
  periodVoucherAmount: 0,
})

const taskHeaders = [
  { title: '检查项', key: 'name', value: 'name', width: 180 },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '说明', key: 'message', value: 'message' },
  { title: '建议动作', key: 'actionHint', value: 'actionHint' },
]

const voucherHeaders = [
  { title: '凭证号', key: 'fnumber', value: 'fnumber', width: 180 },
  { title: '日期', key: 'fdate', value: 'fdate', width: 120 },
  { title: '摘要', key: 'fsummary', value: 'fsummary' },
  { title: '金额', key: 'famount', value: 'famount', width: 140, align: 'end' },
  { title: '状态', key: 'fstatus', value: 'fstatus', width: 110, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 110, align: 'center' },
]

const summaryCards = computed(() => {
  const readyTasks = tasks.value.filter((item) => ['READY', 'DONE'].includes(item.status)).length
  return [
    {
      label: '本期凭证数',
      value: String(meta.periodVoucherCount || 0),
      tip: '当前期间识别到的全部凭证',
      tone: 'tone-primary',
    },
    {
      label: '结转相关凭证',
      value: String(meta.carryVoucherCount || 0),
      tip: '根据摘要和备注初步识别',
      tone: 'tone-primary',
    },
    {
      label: '本期凭证金额',
      value: formatAmount(meta.periodVoucherAmount),
      tip: '按凭证头金额汇总',
      tone: 'tone-success',
    },
    {
      label: '检查完成度',
      value: `${readyTasks}/${tasks.value.length || 0}`,
      tip: 'READY 与 DONE 视为已通过',
      tone: readyTasks === tasks.value.length && tasks.value.length ? 'tone-success' : 'tone-warning',
    },
  ]
})

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname || '-'}`,
      value: item.fid,
    }))
    if (!query.forg && records.length) {
      query.forg = records[0].fid
    }
  } catch (error) {
    orgOptions.value = []
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await voucherApi.fetchCarryList({
      forg: query.forg || undefined,
      period: query.period || undefined,
    })
    const data = res.data || {}
    tasks.value = data.tasks || []
    relatedVouchers.value = data.relatedVouchers || []
    warnings.value = data.warnings || []

    meta.baseCurrency = data.baseCurrency || ''
    meta.currentPeriod = data.currentPeriod || ''
    meta.periodSource = data.periodSource || ''
    meta.periodStatus = data.periodStatus || ''
    meta.defaultVoucherType = data.defaultVoucherType || ''
    meta.foundationHealthy = Boolean(data.foundationHealthy)
    meta.periodVoucherCount = Number(data.periodVoucherCount || 0)
    meta.carryVoucherCount = Number(data.carryVoucherCount || 0)
    meta.periodVoucherAmount = Number(data.periodVoucherAmount || 0)
  } catch (error) {
    tasks.value = []
    relatedVouchers.value = []
    warnings.value = ['结转清单加载失败。']
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
  meta.defaultVoucherType = ''
  meta.foundationHealthy = false
  meta.periodVoucherCount = 0
  meta.carryVoucherCount = 0
  meta.periodVoucherAmount = 0
}

function periodSourceLabel(value) {
  const mapping = {
    PARAM: '页面输入',
    ORG_CONFIG: '组织财务参数',
    SYSTEM: '系统当前月份',
  }
  return mapping[value] || value || '-'
}

function taskStatusLabel(value) {
  const mapping = {
    READY: '可执行',
    WARNING: '需处理',
    PENDING: '待准备',
    DONE: '已完成',
  }
  return mapping[value] || value || '-'
}

function taskStatusColor(value) {
  const mapping = {
    READY: 'success',
    WARNING: 'warning',
    PENDING: 'grey',
    DONE: 'primary',
  }
  return mapping[value] || 'default'
}

function statusLabel(value) {
  const mapping = {
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    AUDITED: '已审核',
    POSTED: '已过账',
    REJECTED: '已驳回',
    REVERSED: '已冲销',
  }
  return mapping[value] || value || '-'
}

function openVoucher(item) {
  const routeData = router.resolve({
    path: '/ledger/voucher',
    query: { number: item.fnumber || undefined },
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

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

onMounted(async () => {
  await loadOrgOptions()
  await fetchData()
})
</script>

<style scoped>
.carry-list-page {
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

.meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
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

.section-title {
  margin-bottom: 12px;
  color: #284780;
  font-size: 16px;
  font-weight: 700;
}

.alert-list {
  margin-bottom: 16px;
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
</style>
