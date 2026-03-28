<template>
  <div class="report-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">现金流量表</h2>
          <div class="subtitle">优先按现金流项目归集，没有标记时再按对方科目类型做兜底分类。</div>
        </div>
        <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
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
          <v-text-field v-model.trim="query.period" label="期间" density="comfortable" placeholder="2026-03" clearable />
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
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'

const loading = ref(false)
const rows = ref([])
const warnings = ref([])
const checks = ref([])
const snackbar = ref({ show: false, text: '', color: 'info' })
const orgOptions = ref([])

const query = reactive({
  orgId: 1,
  period: '2026-03',
  currency: 'CNY',
  templateId: '',
  showZero: true,
})

const headers = [
  { title: '行次', key: 'rowNo', value: 'rowNo', width: 90 },
  { title: '项目编码', key: 'itemCode', value: 'itemCode', width: 160 },
  { title: '项目名称', key: 'itemName', value: 'itemName' },
  { title: '层级', key: 'level', value: 'level', width: 80, align: 'center' },
  { title: '行类型', key: 'lineType', value: 'lineType', width: 120 },
  { title: '本期净额', key: 'amount', value: 'amount', align: 'end', width: 160 },
]

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname}`,
      value: item.fid,
    }))
    if (!records.find((item) => item.fid === query.orgId)) {
      query.orgId = records[0]?.fid ?? query.orgId
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

onMounted(async () => {
  await loadOrgOptions()
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

.switch-col {
  display: flex;
  align-items: center;
}

.alert-list {
  margin-bottom: 12px;
}
</style>
