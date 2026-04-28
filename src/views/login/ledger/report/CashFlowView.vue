<template>
  <div class="report-page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">现金流量表</h2>
          <div class="page-subtitle">
            优先按现金流项目归集；未标记时按对方科目类型推断；现金类科目之间的内部划转会单独提示并从主表中剔除。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="goToQuery">现金流量查询</v-btn>
          <v-btn variant="text" @click="goToSupplement">补充资料</v-btn>
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
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.period"
            label="期间"
            density="comfortable"
            placeholder="2026-03"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.trim="query.currency" label="币种" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.trim="query.templateId" label="模板 ID" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="2" class="switch-col">
          <v-switch v-model="query.showZero" color="primary" inset label="显示零值行" hide-details />
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

      <div v-if="checks.length" class="alert-list">
        <v-alert
          v-for="check in checks"
          :key="check.code"
          :type="check.passed ? 'success' : 'info'"
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
        hide-default-footer
        class="elevation-0"
      >
        <template #item.itemName="{ item }">
          <div :style="{ paddingLeft: `${Math.max((item.level || 1) - 1, 0) * 16}px` }">
            {{ item.itemName }}
          </div>
        </template>
        <template #item.lineType="{ item }">
          {{ lineTypeLabel(item.lineType) }}
        </template>
        <template #item.amount="{ item }">
          {{ formatAmount(item.amount) }}
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const checks = ref([])
const snackbar = ref({ show: false, text: '', color: 'info' })
const orgOptions = ref([])

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  currency: 'CNY',
  templateId: '',
  showZero: true,
})

const headers = [
  { title: '行次', key: 'rowNo', value: 'rowNo', width: 90 },
  { title: '项目编码', key: 'itemCode', value: 'itemCode', width: 150 },
  { title: '项目名称', key: 'itemName', value: 'itemName', minWidth: 220 },
  { title: '层级', key: 'level', value: 'level', width: 80, align: 'center' },
  { title: '行类型', key: 'lineType', value: 'lineType', width: 110, align: 'center' },
  { title: '本期净额', key: 'amount', value: 'amount', width: 160, align: 'end' },
]

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname || '-'}`,
      value: item.fid,
    }))
    if (!records.find((item) => item.fid === query.orgId)) {
    }
  } catch (error) {
    showMsg('业务单元加载失败', 'warning')
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchCashFlow({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
      templateId: query.templateId || undefined,
      showZero: query.showZero,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    warnings.value = data.warnings || []
    checks.value = data.checks || []
  } catch (error) {
    rows.value = []
    warnings.value = []
    checks.value = []
    showMsg('现金流量表加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function goToQuery() {
  router.push('/ledger/cash-flow-query')
}

function goToSupplement() {
  router.push('/ledger/cash-flow-supplement')
}

function lineTypeLabel(value) {
  return {
    DETAIL: '明细行',
    FORMULA: '公式行',
    GROUP: '汇总行',
  }[value] || value || '-'
}

function formatAmount(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function showMsg(text, color = 'info') {
  snackbar.value = { show: true, text, color }
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
.report-page {
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

.switch-col {
  display: flex;
  align-items: center;
}

.alert-list {
  margin-bottom: 12px;
}
</style>
