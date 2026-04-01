<template>
  <div class="balance-sheet-page">
    <v-card elevation="4" class="pa-6">
      <div class="page-header">
        <div>
          <h2 class="page-title">资产负债表</h2>
          <div class="page-subtitle">
            按业务单元、期间和模板查看期末与年初余额，并支持按报表项目下钻到会计科目。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
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
            v-model.trim="query.period"
            label="期间"
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
        <v-col cols="12" md="3">
          <v-select
            v-model="query.templateId"
            :items="templateOptions"
            :loading="templateLoading"
            item-title="label"
            item-value="value"
            label="报表模板"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2" class="switch-col">
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
        <v-chip size="small" variant="tonal" color="primary">模板: {{ currentTemplateLabel }}</v-chip>
        <v-chip size="small" variant="tonal">业务单元: {{ currentOrgLabel }}</v-chip>
        <v-chip size="small" variant="tonal">期间: {{ meta.period || query.period || '-' }}</v-chip>
        <v-chip size="small" variant="tonal">币种: {{ meta.currency || query.currency || 'CNY' }}</v-chip>
      </div>

      <v-row dense class="summary-row">
        <v-col v-for="card in summaryCards" :key="card.label" cols="12" md="3">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value" :class="card.tone">{{ card.value }}</div>
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
          <div class="item-name-cell" :style="{ paddingLeft: `${indentLevel(item.level)}px` }">
            <v-btn
              v-if="item.drillable && item.itemCode"
              class="item-link"
              color="primary"
              variant="text"
              @click.stop="openDrill(item)"
            >
              {{ item.itemName }}
            </v-btn>
            <span v-else>{{ item.itemName }}</span>
          </div>
        </template>
        <template #item.lineType="{ item }">
          <v-chip size="small" variant="tonal" :color="lineTypeColor(item.lineType)">
            {{ lineTypeLabel(item.lineType) }}
          </v-chip>
        </template>
        <template #item.amount="{ item }">
          {{ formatAmount(item.amount) }}
        </template>
        <template #item.beginAmount="{ item }">
          {{ formatAmount(item.beginAmount) }}
        </template>
      </v-data-table>

      <v-alert v-if="!loading && !rows.length" type="info" variant="tonal" class="mt-4">
        当前期间没有可展示的资产负债表数据。
      </v-alert>
    </v-card>

    <v-dialog v-model="drillDialog.visible" max-width="1080">
      <v-card>
        <v-card-title>{{ drillDialog.title }}</v-card-title>
        <v-card-text>
          <div class="drill-meta">
            <v-chip size="small" variant="tonal">科目数: {{ drillDialog.rows.length }}</v-chip>
            <v-chip size="small" variant="tonal">年初合计: {{ formatAmount(drillSummary.beginAmount) }}</v-chip>
            <v-chip size="small" variant="tonal">期末合计: {{ formatAmount(drillSummary.endAmount) }}</v-chip>
          </div>

          <div v-if="drillDialog.warnings.length" class="mb-4">
            <v-alert
              v-for="warning in drillDialog.warnings"
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
            :headers="drillHeaders"
            :items="drillDialog.rows"
            :loading="drillDialog.loading"
            item-key="accountId"
            hide-default-footer
            class="elevation-0"
          >
            <template #item.beginAmount="{ item }">
              {{ formatAmount(item.beginAmount) }}
            </template>
            <template #item.endAmount="{ item }">
              {{ formatAmount(item.endAmount) }}
            </template>
            <template #item.mappingSource="{ item }">
              {{ mappingSourceLabel(item.mappingSource) }}
            </template>
          </v-data-table>

          <v-alert v-if="!drillDialog.loading && !drillDialog.rows.length" type="info" variant="tonal" class="mt-4">
            当前报表项目没有匹配到下钻科目。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="drillDialog.visible = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getBusinessUnitList } from '@/api/bizUnit'
import financialReportApi from '@/api/financialReport'
import reportTemplateApi from '@/api/reportTemplate'

const loading = ref(false)
const templateLoading = ref(false)
const rows = ref([])
const warnings = ref([])
const checks = ref([])
const orgOptions = ref([])
const templateOptions = ref([])

const snackbar = reactive({
  show: false,
  text: '',
  color: 'info',
})

const meta = reactive({
  templateId: null,
  templateName: '',
  period: '',
  currency: 'CNY',
})

const query = reactive({
  orgId: null,
  period: currentPeriod(),
  currency: 'CNY',
  templateId: null,
  showZero: true,
})

const drillDialog = reactive({
  visible: false,
  loading: false,
  title: '报表项目下钻',
  rows: [],
  warnings: [],
})

const headers = [
  { title: '行次', key: 'rowNo', value: 'rowNo', width: 90 },
  { title: '项目编码', key: 'itemCode', value: 'itemCode', width: 160 },
  { title: '项目名称', key: 'itemName', value: 'itemName' },
  { title: '行类型', key: 'lineType', value: 'lineType', width: 120, align: 'center' },
  { title: '级次', key: 'level', value: 'level', width: 80, align: 'center' },
  { title: '期末余额', key: 'amount', value: 'amount', align: 'end', width: 160 },
  { title: '年初余额', key: 'beginAmount', value: 'beginAmount', align: 'end', width: 160 },
]

const drillHeaders = [
  { title: '科目编码', key: 'accountCode', value: 'accountCode', width: 150 },
  { title: '科目名称', key: 'accountName', value: 'accountName' },
  { title: '科目类型', key: 'accountType', value: 'accountType', width: 120 },
  { title: '余额方向', key: 'direction', value: 'direction', width: 100 },
  { title: '年初余额', key: 'beginAmount', value: 'beginAmount', align: 'end', width: 150 },
  { title: '期末余额', key: 'endAmount', value: 'endAmount', align: 'end', width: 150 },
  { title: '映射来源', key: 'mappingSource', value: 'mappingSource', width: 160 },
]

const currentOrgLabel = computed(() => {
  const matched = orgOptions.value.find((item) => item.value === query.orgId)
  return matched?.label || '全部业务单元'
})

const currentTemplateLabel = computed(() => {
  if (meta.templateName) {
    return meta.templateName
  }
  const matched = templateOptions.value.find((item) => item.value === query.templateId)
  return matched?.label || '自动匹配'
})

const balanceSummary = computed(() => {
  const assetTotal = amountByCode('BS_ASSET')
  const liabilityEquityTotal = amountByCode('BS_LIAB_EQ')
  const difference = assetTotal - liabilityEquityTotal
  const balanced = Math.abs(difference) < 0.000001
  return {
    assetTotal,
    liabilityEquityTotal,
    difference,
    balanced,
  }
})

const summaryCards = computed(() => [
  {
    label: '资产总计',
    value: formatAmount(balanceSummary.value.assetTotal),
    tone: 'tone-primary',
  },
  {
    label: '负债和所有者权益',
    value: formatAmount(balanceSummary.value.liabilityEquityTotal),
    tone: 'tone-primary',
  },
  {
    label: '差额',
    value: formatAmount(balanceSummary.value.difference),
    tone: balanceSummary.value.balanced ? 'tone-success' : 'tone-danger',
  },
  {
    label: '平衡状态',
    value: balanceSummary.value.balanced ? '已平衡' : '未平衡',
    tone: balanceSummary.value.balanced ? 'tone-success' : 'tone-danger',
  },
])

const drillSummary = computed(() =>
  drillDialog.rows.reduce(
    (acc, item) => {
      acc.beginAmount += Number(item.beginAmount || 0)
      acc.endAmount += Number(item.endAmount || 0)
      return acc
    },
    { beginAmount: 0, endAmount: 0 },
  ),
)

watch(
  () => query.orgId,
  async () => {
    await loadTemplateOptions()
  },
)

async function loadOrgOptions() {
  try {
    const res = await getBusinessUnitList({ page: 1, size: 500 })
    const records = res.data?.records || []
    orgOptions.value = records.map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname}`,
      value: item.fid,
    }))

    if (!query.orgId && records.length) {
      query.orgId = records[0].fid
    }
  } catch (error) {
    showMsg('业务单元加载失败', 'warning')
  }
}

async function loadTemplateOptions() {
  templateLoading.value = true
  try {
    let options = await fetchTemplatePage(query.orgId)
    if (!options.length && query.orgId) {
      options = await fetchTemplatePage()
    }
    templateOptions.value = options.map((item) => ({
      label: templateLabel(item),
      value: item.fid,
    }))
    if (query.templateId && !templateOptions.value.some((item) => item.value === query.templateId)) {
      query.templateId = null
    }
  } catch (error) {
    templateOptions.value = []
    showMsg('报表模板加载失败', 'warning')
  } finally {
    templateLoading.value = false
  }
}

async function fetchTemplatePage(forg) {
  const res = await reportTemplateApi.fetchList({
    page: 1,
    size: 200,
    ftype: 'BALANCE_SHEET',
    fstatus: 'ENABLED',
    forg: forg || undefined,
  })
  return res.data?.records || []
}

async function fetchData() {
  loading.value = true
  try {
    const res = await financialReportApi.fetchBalanceSheet({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
      templateId: query.templateId || undefined,
      showZero: query.showZero,
    })
    const payload = res.data || {}
    rows.value = payload.rows || []
    warnings.value = payload.warnings || []
    checks.value = payload.checks || []
    meta.templateId = payload.templateId || null
    meta.templateName = payload.templateName || ''
    meta.period = payload.period || query.period || ''
    meta.currency = payload.currency || query.currency || 'CNY'
  } catch (error) {
    rows.value = []
    warnings.value = []
    checks.value = []
    meta.templateId = null
    meta.templateName = ''
    meta.period = query.period || ''
    meta.currency = query.currency || 'CNY'
    showMsg('资产负债表加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.period = currentPeriod()
  query.currency = 'CNY'
  query.templateId = null
  query.showZero = true
  fetchData()
}

async function openDrill(item) {
  if (!item?.itemCode) {
    return
  }

  drillDialog.visible = true
  drillDialog.loading = true
  drillDialog.title = `${item.itemName} 下钻`
  drillDialog.rows = []
  drillDialog.warnings = []

  try {
    const res = await financialReportApi.fetchBalanceSheetDrill({
      orgId: query.orgId || undefined,
      period: query.period || undefined,
      currency: query.currency || undefined,
      templateId: query.templateId || meta.templateId || undefined,
      itemId: item.itemId || undefined,
      itemCode: item.itemCode || undefined,
    })
    const payload = res.data || {}
    drillDialog.title = `${payload.itemName || item.itemName} 下钻`
    drillDialog.rows = payload.rows || []
    drillDialog.warnings = payload.warnings || []
  } catch (error) {
    drillDialog.rows = []
    drillDialog.warnings = ['下钻明细加载失败。']
  } finally {
    drillDialog.loading = false
  }
}

function amountByCode(code) {
  const row = rows.value.find((item) => item.itemCode === code)
  return Number(row?.amount || 0)
}

function templateLabel(item) {
  const orgSegment = item.forg ? ` / 组织${item.forg}` : ' / 全局'
  return `${item.fname} (${item.fcode})${orgSegment}`
}

function lineTypeLabel(value) {
  const mapping = {
    TOTAL: '汇总',
    DETAIL: '明细',
    FORMULA: '公式',
  }
  return mapping[value] || value || '-'
}

function lineTypeColor(value) {
  const mapping = {
    TOTAL: 'primary',
    DETAIL: 'teal',
    FORMULA: 'indigo',
  }
  return mapping[value] || 'default'
}

function mappingSourceLabel(value) {
  const mapping = {
    EXPLICIT: '显式映射',
    ACCOUNT_REPORT_ITEM: '科目报表项目',
    AUTO_CASH: '自动识别-现金类',
    AUTO_ASSET: '自动识别-资产类',
    AUTO_LIAB_EQ: '自动识别-负债权益类',
  }
  return mapping[value] || value || '-'
}

function indentLevel(level) {
  return Math.max((Number(level) || 1) - 1, 0) * 16
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
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function showMsg(text, color = 'info') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(async () => {
  await loadOrgOptions()
  await loadTemplateOptions()
  await fetchData()
})
</script>

<style scoped>
.balance-sheet-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.page-title {
  margin: 0;
  color: #24344d;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
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

.summary-row {
  margin-bottom: 12px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e5eaf3;
  border-radius: 14px;
  padding: 16px;
}

.summary-label {
  color: #667085;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
}

.tone-primary {
  color: #24457a;
}

.tone-success {
  color: #15803d;
}

.tone-danger {
  color: #b42318;
}

.alert-list {
  margin-bottom: 12px;
}

.item-name-cell {
  display: flex;
  align-items: center;
  min-height: 36px;
}

.item-link {
  min-width: 0;
  padding: 0;
  justify-content: flex-start;
  text-transform: none;
}

.drill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
