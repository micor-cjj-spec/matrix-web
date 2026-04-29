<template>
  <div class="report-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">报表科目映射</h2>
          <div class="subtitle">维护报表项目与会计科目的显式映射，优先级高于系统兜底规则。</div>
        </div>
        <div class="toolbar">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新增映射</v-btn>
          <v-btn color="primary" variant="tonal" @click="handleEditSelected" :disabled="!selectedItem">编辑</v-btn>
          <v-btn color="error" variant="tonal" @click="handleDeleteSelected" :disabled="!selectedItem">删除</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.ftemplateId"
            :items="templateOptions"
            item-title="label"
            item-value="value"
            label="报表模板"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.fitemId"
            :items="filterItemOptions"
            item-title="label"
            item-value="value"
            label="报表项目"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.faccountId"
            :items="accountOptions"
            item-title="label"
            item-value="value"
            label="会计科目"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3" class="filter-actions">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
          <v-btn variant="text" @click="resetFilters">重置</v-btn>
        </v-col>
      </v-row>

      <div v-if="hasResolveContext" class="resolve-panel" :class="{ 'is-saved': resolveSaved }">
        <div class="resolve-main">
          <div class="resolve-eyebrow">缺口治理上下文</div>
          <div class="resolve-title">{{ resolveContextTitle }}</div>
          <div class="resolve-subtitle">
            {{ reportTypeLabel(normalizeQueryValue(route.query.reportType)) }} / {{ templateName(filters.ftemplateId) }} / 来源：{{ sourceReportLabel }}
          </div>
          <div v-if="recommendedReportItem" class="resolve-hint">
            已推荐报表项目：{{ reportItemName(recommendedReportItem.fid) }}
          </div>
          <div v-else class="resolve-hint">
            暂无可靠推荐项目，请在弹窗中选择报表项目后保存。
          </div>
        </div>
        <div class="resolve-actions">
          <v-btn color="primary" variant="flat" @click="openCreateDialog">打开新增映射</v-btn>
          <v-btn variant="tonal" @click="returnToSourceReport">返回来源报表复核</v-btn>
        </div>
      </div>

      <div class="selected-tip">
        当前选中：{{ selectedItem ? selectedSummary(selectedItem) : '未选择，请点击表格行' }}
      </div>

      <v-data-table
        :headers="headers"
        :items="list"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
        @click:row="handleRowClick"
        :row-props="getRowProps"
      >
        <template #item.ftemplateId="{ item }">
          {{ templateName(item.ftemplateId) }}
        </template>
        <template #item.fitemId="{ item }">
          {{ reportItemName(item.fitemId) }}
        </template>
        <template #item.faccountId="{ item }">
          {{ accountName(item.faccountId) }}
        </template>
        <template #item.fmappingType="{ item }">
          {{ mappingTypeLabel(item.fmappingType) }}
        </template>
      </v-data-table>

      <div class="footer">
        <div class="summary">共 {{ total }} 条</div>
        <v-pagination
          v-model="filters.page"
          :length="Math.max(1, pages)"
          :total-visible="7"
          @update:model-value="fetchData"
        />
      </div>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="780" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '新增报表科目映射' : '编辑报表科目映射' }}</v-card-title>
        <v-card-text>
          <div v-if="hasResolveContext && dialog.mode === 'create'" class="dialog-resolve-note">
            <div class="dialog-resolve-title">正在处理：{{ resolveContextTitle }}</div>
            <div class="dialog-resolve-text">
              模板、科目和映射类型已根据缺口带入；请确认报表项目后创建映射。
            </div>
          </div>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.ftemplateId"
                  :items="templateOptions"
                  item-title="label"
                  item-value="value"
                  label="报表模板"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.fitemId"
                  :items="dialogItemOptions"
                  item-title="label"
                  item-value="value"
                  label="报表项目"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.faccountId"
                  :items="accountOptions"
                  item-title="label"
                  item-value="value"
                  label="会计科目"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.fmappingType"
                  :items="mappingTypeOptions"
                  item-title="title"
                  item-value="value"
                  label="映射类型"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.feffectiveFrom" label="生效开始期间" placeholder="2026-01" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.feffectiveTo" label="生效结束期间" placeholder="2026-12" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model.trim="dialog.form.fremark" label="备注" rows="3" auto-grow />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="primary" variant="text" @click="handleConfirm">{{ dialog.mode === 'create' ? '创建' : '保存' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="360">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除当前报表科目映射？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn color="error" variant="text" @click="handleDelete">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import reportAccountMapApi from '@/api/reportAccountMap'
import reportTemplateApi from '@/api/reportTemplate'
import reportItemApi from '@/api/reportItem'
import accountSubjectApi from '@/api/accountSubject'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const selectedItem = ref(null)
const formRef = ref()
const resolveAutoOpened = ref(false)
const resolveSaved = ref(false)

const templates = ref([])
const reportItems = ref([])
const accounts = ref([])

const headers = [
  { title: '报表模板', value: 'ftemplateId' },
  { title: '报表项目', value: 'fitemId' },
  { title: '会计科目', value: 'faccountId' },
  { title: '映射类型', value: 'fmappingType' },
  { title: '生效开始', value: 'feffectiveFrom' },
  { title: '生效结束', value: 'feffectiveTo' },
]

const mappingTypeOptions = [
  { title: '直接映射', value: 'DIRECT' },
  { title: '损益映射', value: 'PL' },
  { title: '现金流映射', value: 'CASHFLOW' },
]

const filters = reactive({
  page: 1,
  size: 10,
  ftemplateId: null,
  fitemId: null,
  faccountId: null,
})

const dialog = reactive({
  visible: false,
  mode: 'create',
  valid: false,
  form: defaultDialogForm(),
})

const deleteDialog = reactive({ visible: false, item: null })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const requiredRule = (value) => value !== null && value !== undefined && value !== '' || '必填'

const templateOptions = computed(() =>
  templates.value.map((item) => ({
    label: `${item.fname} (${item.fcode})`,
    value: item.fid,
  })),
)

const accountOptions = computed(() =>
  accounts.value.map((item) => ({
    label: `${item.fcode} - ${item.fname}`,
    value: item.fid,
  })),
)

const hasResolveContext = computed(() =>
  normalizeQueryValue(route.query.mode) === 'resolve'
  && Boolean(normalizeQueryValue(route.query.accountCode) || normalizeQueryValue(route.query.templateId)),
)

const contextAccount = computed(() =>
  accounts.value.find((item) => item.fid === filters.faccountId) || null,
)

const recommendedReportItem = computed(() => {
  const itemId = inferRecommendedReportItemId()
  return itemId ? reportItems.value.find((item) => item.fid === itemId) || null : null
})

const resolveContextTitle = computed(() => {
  const account = contextAccount.value
  if (account) {
    return `${account.fcode || '-'} - ${account.fname || '-'}`
  }
  const accountCode = normalizeQueryValue(route.query.accountCode)
  return accountCode ? `${accountCode} - 待定位科目` : '待治理映射缺口'
})

const sourceReportLabel = computed(() => {
  const sourcePath = normalizeQueryValue(route.query.sourcePath)
  if (sourcePath === '/ledger/enterprise-tax') {
    return '企业纳税表'
  }
  if (sourcePath === '/ledger/financial-indicators') {
    return '财务指标'
  }
  return '来源报表'
})

const filterItemOptions = computed(() =>
  reportItems.value
    .filter((item) => !filters.ftemplateId || item.ftemplateId === filters.ftemplateId)
    .map((item) => ({
      label: `${item.fname} (${item.fcode})`,
      value: item.fid,
    })),
)

const dialogItemOptions = computed(() =>
  reportItems.value
    .filter((item) => !dialog.form.ftemplateId || item.ftemplateId === dialog.form.ftemplateId)
    .map((item) => ({
      label: `${item.fname} (${item.fcode})`,
      value: item.fid,
    })),
)

watch(
  () => filters.ftemplateId,
  () => {
    filters.fitemId = null
  },
)

watch(
  () => dialog.form.ftemplateId,
  () => {
    dialog.form.fitemId = null
  },
)

async function fetchLookups() {
  const [templateRes, itemRes, accountRes] = await Promise.all([
    reportTemplateApi.fetchList({ page: 1, size: 200 }),
    reportItemApi.listReportItems({ page: 1, size: 500 }),
    accountSubjectApi.fetchList({ page: 1, size: 500 }),
  ])

  templates.value = templateRes.data?.records || []
  reportItems.value = itemRes.data?.records || []
  accounts.value = accountRes.data?.records || []
}

function applyRouteQueryFilters() {
  const templateId = normalizeNumber(normalizeQueryValue(route.query.templateId))
  if (templateId) {
    filters.ftemplateId = templateId
  }

  const accountCode = normalizeQueryValue(route.query.accountCode)
  if (!accountCode) {
    return
  }

  const matchedAccount = accounts.value.find((item) => String(item.fcode || '').trim() === accountCode)
  if (!matchedAccount) {
    showMsg(`未找到会计科目 ${accountCode}`, 'warning')
    return
  }

  filters.faccountId = matchedAccount.fid
  showMsg(`已定位会计科目 ${matchedAccount.fcode} - ${matchedAccount.fname}`, 'info')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await reportAccountMapApi.fetchList({
      page: filters.page,
      size: filters.size,
      ftemplateId: filters.ftemplateId || undefined,
      fitemId: filters.fitemId || undefined,
      faccountId: filters.faccountId || undefined,
    })
    const pageData = res.data || {}
    list.value = pageData.records || []
    total.value = pageData.total || 0
    pages.value = pageData.pages || 1
  } catch (error) {
    showMsg('报表科目映射加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  fetchData()
}

function resetFilters() {
  filters.page = 1
  filters.ftemplateId = null
  filters.fitemId = null
  filters.faccountId = null
  fetchData()
}

function handleRowClick(_, row) {
  selectedItem.value = row?.item || null
}

function getRowProps({ item }) {
  return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {}
}

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  const recommendedItemId = inferRecommendedReportItemId()
  Object.assign(dialog.form, defaultDialogForm(), {
    ftemplateId: filters.ftemplateId || templates.value[0]?.fid || null,
    faccountId: filters.faccountId || null,
    fitemId: filters.fitemId || recommendedItemId || null,
    fmappingType: defaultMappingTypeFromRoute(),
  })
  nextTick(() => {
    dialog.form.fitemId = filters.fitemId || recommendedItemId || null
  })
}

function handleEditSelected() {
  if (!selectedItem.value) return
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, defaultDialogForm(), {
    ...selectedItem.value,
    ftemplateId: normalizeNumber(selectedItem.value.ftemplateId),
    fitemId: normalizeNumber(selectedItem.value.fitemId),
    faccountId: normalizeNumber(selectedItem.value.faccountId),
  })
  const selectedItemId = normalizeNumber(selectedItem.value.fitemId)
  nextTick(() => {
    dialog.form.fitemId = selectedItemId
  })
}

function closeDialog() {
  dialog.visible = false
}

async function handleConfirm() {
  const validation = await formRef.value?.validate?.()
  if (!validationPassed(validation)) {
    return
  }

  const payload = {
    ...dialog.form,
    ftemplateId: normalizeNumber(dialog.form.ftemplateId),
    fitemId: normalizeNumber(dialog.form.fitemId),
    faccountId: normalizeNumber(dialog.form.faccountId),
  }

  try {
    if (dialog.mode === 'create') {
      delete payload.fid
      await reportAccountMapApi.createItem(payload)
      showMsg('报表科目映射创建成功')
    } else {
      await reportAccountMapApi.editItem(payload)
      showMsg('报表科目映射保存成功')
    }
    closeDialog()
    await fetchData()
    if (hasResolveContext.value) {
      resolveSaved.value = true
    }
  } catch (error) {
    showMsg('报表科目映射保存失败', 'error')
  }
}

function handleDeleteSelected() {
  if (!selectedItem.value) return
  deleteDialog.visible = true
  deleteDialog.item = selectedItem.value
}

async function handleDelete() {
  if (!deleteDialog.item?.fid) return
  try {
    await reportAccountMapApi.deleteItem(deleteDialog.item.fid)
    deleteDialog.visible = false
    selectedItem.value = null
    showMsg('报表科目映射删除成功')
    await fetchData()
  } catch (error) {
    showMsg('报表科目映射删除失败', 'error')
  }
}

function templateName(fid) {
  const match = templates.value.find((item) => item.fid === fid)
  return match ? `${match.fname} (${match.fcode})` : fid ?? '-'
}

function reportItemName(fid) {
  const match = reportItems.value.find((item) => item.fid === fid)
  return match ? `${match.fname} (${match.fcode})` : fid ?? '-'
}

function accountName(fid) {
  const match = accounts.value.find((item) => item.fid === fid)
  return match ? `${match.fcode} - ${match.fname}` : fid ?? '-'
}

function mappingTypeLabel(value) {
  return mappingTypeOptions.find((item) => item.value === value)?.title || value || '-'
}

function selectedSummary(item) {
  return `${templateName(item.ftemplateId)} / ${reportItemName(item.fitemId)} / ${accountName(item.faccountId)}`
}

function defaultDialogForm() {
  return {
    fid: null,
    ftemplateId: null,
    fitemId: null,
    faccountId: null,
    fmappingType: 'DIRECT',
    feffectiveFrom: '',
    feffectiveTo: '',
    fremark: '',
  }
}

function normalizeNumber(value) {
  if (value === '' || value === undefined || value === null) {
    return null
  }
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function normalizeQueryValue(value) {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim()
  }
  return String(value || '').trim()
}

function defaultMappingTypeFromRoute() {
  const reportType = normalizeQueryValue(route.query.reportType)
  if (reportType === 'PROFIT_STATEMENT') {
    return 'PL'
  }
  if (reportType === 'CASH_FLOW') {
    return 'CASHFLOW'
  }
  return 'DIRECT'
}

function reportTypeLabel(value) {
  const labels = {
    PROFIT_STATEMENT: '利润表',
    BALANCE_SHEET: '资产负债表',
    CASH_FLOW: '现金流量表',
  }
  return labels[value] || value || '报表'
}

function returnToSourceReport() {
  const sourcePath = normalizeQueryValue(route.query.sourcePath) || '/ledger/enterprise-tax'
  router.push({
    path: sourcePath,
    query: compactQuery({
      period: normalizeQueryValue(route.query.sourcePeriod),
      currency: normalizeQueryValue(route.query.sourceCurrency),
      orgId: normalizeQueryValue(route.query.sourceOrgId),
    }),
  })
}

function openResolveDialogOnce() {
  if (!hasResolveContext.value || resolveAutoOpened.value || !filters.faccountId) {
    return
  }
  resolveAutoOpened.value = true
  openCreateDialog()
}

function inferRecommendedReportItemId() {
  const templateId = filters.ftemplateId || normalizeNumber(normalizeQueryValue(route.query.templateId))
  const account = contextAccount.value
  if (!templateId || !account) {
    return null
  }

  const accountReportItem = normalizeNumber(account.freportItem)
  if (accountReportItem && itemBelongsToTemplate(accountReportItem, templateId)) {
    return accountReportItem
  }

  const reportType = normalizeQueryValue(route.query.reportType)
  const accountText = [
    account.fpltype,
    account.ftype,
    account.fname,
    account.fcode,
  ].join(' ').toLowerCase()

  if (reportType === 'PROFIT_STATEMENT') {
    if (containsAny(accountText, ['收入', 'revenue', 'income'])) {
      return findItemIdByCode('PL_REVENUE', templateId)
    }
    if (containsAny(accountText, ['成本', '费用', 'cost', 'expense'])) {
      return findItemIdByCode('PL_COST', templateId)
    }
    return null
  }

  if (reportType === 'BALANCE_SHEET') {
    if (Number(account.fcash || 0) === 1 || Number(account.fbank || 0) === 1 || Number(account.fequivalent || 0) === 1) {
      return findItemIdByCode('BS_CASH', templateId)
    }
    if (containsAny(accountText, ['资产', 'asset'])) {
      return findItemIdByCode('BS_ASSET', templateId)
    }
    if (containsAny(accountText, ['负债', '权益', 'liability', 'equity'])) {
      return findItemIdByCode('BS_LIAB_EQ', templateId)
    }
  }

  return null
}

function itemBelongsToTemplate(itemId, templateId) {
  return reportItems.value.some((item) => item.fid === itemId && item.ftemplateId === templateId)
}

function findItemIdByCode(code, templateId) {
  const match = reportItems.value.find(
    (item) => item.ftemplateId === templateId && String(item.fcode || '').toUpperCase() === code,
  )
  return match?.fid || null
}

function containsAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()))
}

function compactQuery(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
  )
}

function validationPassed(result) {
  if (result === undefined) return true
  if (typeof result === 'boolean') return result
  return result.valid !== false
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(async () => {
  await fetchLookups()
  applyRouteQueryFilters()
  await fetchData()
  openResolveDialogOnce()
})

watch(
  () => [route.query.accountCode, route.query.templateId, route.query.mode],
  async () => {
    if (!accounts.value.length) return
    resolveAutoOpened.value = false
    resolveSaved.value = false
    applyRouteQueryFilters()
    filters.page = 1
    await fetchData()
    openResolveDialogOnce()
  },
)
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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resolve-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 14px;
  border: 1px solid #bfd8ff;
  border-radius: 8px;
  padding: 14px 16px;
  background: #f4f8ff;
}

.resolve-panel.is-saved {
  border-color: #a9dbc2;
  background: #f2fbf6;
}

.resolve-main {
  min-width: 0;
}

.resolve-eyebrow {
  color: #315f9f;
  font-size: 12px;
  font-weight: 700;
}

.resolve-title {
  margin-top: 4px;
  color: #25324a;
  font-size: 16px;
  font-weight: 700;
}

.resolve-subtitle,
.resolve-hint {
  margin-top: 4px;
  color: #627084;
  font-size: 13px;
}

.resolve-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-resolve-note {
  margin-bottom: 14px;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  padding: 12px;
  background: #f7faff;
}

.dialog-resolve-title {
  color: #25324a;
  font-size: 14px;
  font-weight: 700;
}

.dialog-resolve-text {
  margin-top: 4px;
  color: #637083;
  font-size: 13px;
}

.selected-tip {
  margin-bottom: 12px;
  color: #5f6b84;
  font-size: 13px;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.summary {
  color: #667085;
  font-size: 14px;
}

:deep(.selected-row) {
  background: #e8f1ff !important;
}

@media (max-width: 960px) {
  .resolve-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
