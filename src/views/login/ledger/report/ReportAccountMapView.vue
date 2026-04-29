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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import reportAccountMapApi from '@/api/reportAccountMap'
import reportTemplateApi from '@/api/reportTemplate'
import reportItemApi from '@/api/reportItem'
import accountSubjectApi from '@/api/accountSubject'

const route = useRoute()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const selectedItem = ref(null)
const formRef = ref()

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
  Object.assign(dialog.form, defaultDialogForm(), {
    ftemplateId: filters.ftemplateId || templates.value[0]?.fid || null,
    faccountId: filters.faccountId || null,
    fmappingType: defaultMappingTypeFromRoute(),
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
})

watch(
  () => [route.query.accountCode, route.query.templateId],
  async () => {
    if (!accounts.value.length) return
    applyRouteQueryFilters()
    filters.page = 1
    await fetchData()
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
</style>
