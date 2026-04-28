<template>
  <div class="report-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">利润表</h2>
          <div class="subtitle">
            基于已过账总账分录和损益类科目聚合，支持查看本期金额与本年累计金额。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row class="mb-4" dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="query.orgId"
            :items="orgOptions"
            item-title="label"
            item-value="value"
            label="业务单元"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.startPeriod"
            label="开始期间"
            density="comfortable"
            placeholder="2026-01"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.endPeriod"
            label="结束期间"
            density="comfortable"
            placeholder="2026-03"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.currency"
            label="币种"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3" class="switch-col">
          <v-switch
            v-model="query.showZero"
            color="primary"
            inset
            hide-details
            label="显示零值行"
          />
        </v-col>
      </v-row>

      <div class="meta-strip">
        <v-chip size="small" variant="tonal">业务单元: {{ currentOrgLabel }}</v-chip>
        <v-chip size="small" variant="tonal">期间范围: {{ `${query.startPeriod || '-'} ~ ${query.endPeriod || '-'}` }}</v-chip>
        <v-chip size="small" variant="tonal">币种: {{ query.currency || 'CNY' }}</v-chip>
      </div>

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

      <div v-if="checks.length" class="alert-list">
        <v-alert
          v-for="check in checks"
          :key="check.code"
          :type="check.passed ? 'success' : 'error'"
          variant="tonal"
          density="comfortable"
          class="mb-2"
        >
          {{ check.message }}
        </v-alert>
      </div>

      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        item-key="itemId"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.itemName="{ item }">
          <div :style="{ paddingLeft: `${Math.max((item.level || 1) - 1, 0) * 16}px` }">
            {{ item.itemName }}
          </div>
        </template>
        <template #item.currentAmount="{ item }">
          {{ formatAmount(item.currentAmount) }}
        </template>
        <template #item.ytdAmount="{ item }">
          {{ formatAmount(item.ytdAmount) }}
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'

const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const checks = ref([])
const orgOptions = ref([])

const query = reactive({
  orgId: null,
  startPeriod: startPeriodOfYear(),
  endPeriod: currentPeriod(),
  currency: 'CNY',
  showZero: true,
})

const headers = [
  { title: '行次', key: 'rowNo', value: 'rowNo', width: 90 },
  { title: '项目编码', key: 'itemCode', value: 'itemCode', width: 160 },
  { title: '项目名称', key: 'itemName', value: 'itemName' },
  { title: '层级', key: 'level', value: 'level', width: 80, align: 'center' },
  { title: '本期金额', key: 'currentAmount', value: 'currentAmount', align: 'end', width: 160 },
  { title: '本年累计', key: 'ytdAmount', value: 'ytdAmount', align: 'end', width: 160 },
]

const currentOrgLabel = computed(() => {
  const hit = orgOptions.value.find((item) => item.value === query.orgId)
  return hit?.label || '全部业务单元'
})

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function startPeriodOfYear() {
  const now = new Date()
  return `${now.getFullYear()}-01`
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

async function loadOrgOptions() {
  const res = await getBusinessUnitList({ page: 1, size: 500 })
  const records = res.data?.records || []
  orgOptions.value = records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
  }))
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchProfitStatement({
      orgId: query.orgId || undefined,
      startPeriod: query.startPeriod || undefined,
      endPeriod: query.endPeriod || undefined,
      currency: query.currency || undefined,
      showZero: query.showZero,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    checks.value = data.checks || []
  } catch {
    rows.value = []
    warnings.value = ['利润表加载失败。']
    checks.value = []
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.startPeriod = startPeriodOfYear()
  query.endPeriod = currentPeriod()
  query.currency = 'CNY'
  query.showZero = true
  fetchData()
}

onMounted(async () => {
  await loadOrgOptions().catch(() => {
    warnings.value = ['业务单元加载失败。']
  })
  await fetchData()
})
</script>

<style scoped>
.report-page {
  padding: 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  color: #24344d;
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.switch-col {
  display: flex;
  align-items: center;
}

.meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.alert-list {
  margin-bottom: 12px;
}
</style>
