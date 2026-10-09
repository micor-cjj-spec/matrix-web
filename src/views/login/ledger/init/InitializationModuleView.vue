<template>
  <div class="init-page">
    <v-card elevation="4" class="pa-6">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ pageMeta.title }}</h2>
          <div class="page-subtitle">{{ pageMeta.subtitle }}</div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="openCreate">新增</v-btn>
          <v-btn variant="text" @click="fetchData">刷新</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
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
        <v-col cols="12" md="2">
          <v-text-field
            v-model.trim="query.fperiod"
            label="期间"
            density="comfortable"
            placeholder="2026-03"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.keyword"
            :label="pageMeta.keywordLabel"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col v-if="pageMeta.hasTypeFilter" cols="12" md="2">
          <v-select
            v-model="query.type"
            :items="pageMeta.typeOptions"
            item-title="label"
            item-value="value"
            label="类型"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2" class="actions-col">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </v-col>
      </v-row>

      <v-row dense class="summary-row">
        <v-col cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">记录数</div>
            <div class="summary-value tone-primary">{{ total }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">金额合计</div>
            <div class="summary-value tone-success">{{ formatAmount(totalAmount) }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">当前期间</div>
            <div class="summary-value tone-primary">{{ query.fperiod || '-' }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-data-table
        :headers="pageMeta.headers"
        :items="list"
        :loading="loading"
        hide-default-footer
        item-key="fid"
        class="elevation-0"
      >
        <template #item.fdebitAmount="{ item }">
          {{ formatAmount(item.fdebitAmount) }}
        </template>
        <template #item.fcreditAmount="{ item }">
          {{ formatAmount(item.fcreditAmount) }}
        </template>
        <template #item.famount="{ item }">
          {{ formatAmount(item.famount) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openEdit(item)">编辑</v-btn>
          <v-btn size="small" variant="text" color="error" @click="handleDelete(item)">删除</v-btn>
        </template>
      </v-data-table>

      <div class="footer">
        <div class="summary-text">共 {{ total }} 条</div>
        <v-pagination
          v-model="query.page"
          :length="Math.max(1, pages)"
          :total-visible="7"
          @update:model-value="fetchData"
        />
      </div>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="860">
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? `新增${pageMeta.title}` : `编辑${pageMeta.title}` }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.forg"
                :items="orgOptions"
                item-title="label"
                item-value="value"
                label="业务单元"
                density="comfortable"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.fperiod" label="期间" density="comfortable" placeholder="2026-03" />
            </v-col>

            <template v-if="pageMeta.module === 'subject'">
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.faccountId"
                  :items="accountOptions"
                  item-title="label"
                  item-value="value"
                  label="会计科目"
                  density="comfortable"
                  clearable
                  @update:model-value="syncAccount"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.faccountCode" label="科目编码" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.faccountName" label="科目名称" density="comfortable" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model.number="form.fdebitAmount" label="借方期初" density="comfortable" type="number" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model.number="form.fcreditAmount" label="贷方期初" density="comfortable" type="number" />
              </v-col>
            </template>

            <template v-else-if="pageMeta.module === 'cashflow'">
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.fcashflowItemId"
                  :items="cashflowOptions"
                  item-title="label"
                  item-value="value"
                  label="现金流项目"
                  density="comfortable"
                  clearable
                  @update:model-value="syncCashflow"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.fcashflowCode" label="项目编码" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.fcashflowName" label="项目名称" density="comfortable" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="form.fdirection"
                  :items="cashflowDirectionOptions"
                  item-title="label"
                  item-value="value"
                  label="流向"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model.number="form.famount" label="金额" density="comfortable" type="number" />
              </v-col>
            </template>

            <template v-else>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.fcounterpartyType"
                  :items="counterpartyTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="往来类型"
                  density="comfortable"
                  @update:model-value="syncCounterpartyType"
                />
              </v-col>
              <v-col cols="12" md="8">
                <v-select
                  v-model="form.fcounterpartyId"
                  :items="counterpartyOptions"
                  item-title="label"
                  item-value="value"
                  label="往来对象"
                  density="comfortable"
                  clearable
                  @update:model-value="syncCounterparty"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.trim="form.fcounterpartyCode" label="对象编码" density="comfortable" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.trim="form.fcounterpartyName" label="对象名称" density="comfortable" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.fdirection"
                  :items="counterpartyDirectionOptions"
                  item-title="label"
                  item-value="value"
                  label="方向"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.faccountCode" label="科目编码" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="form.faccountName" label="科目名称" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.famount" label="金额" density="comfortable" type="number" />
              </v-col>
            </template>

            <v-col cols="12">
              <v-textarea v-model.trim="form.fremark" label="备注" rows="2" density="comfortable" auto-grow />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.visible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="handleSave">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getBusinessUnitList } from '@/api/bizUnit'
import accountSubjectApi from '@/api/accountSubject'
import cashflowItemApi from '@/api/cashflowItem'
import customerApi from '@/api/customer'
import supplierApi from '@/api/supplier'
import openingInitApi from '@/api/openingInit'

const route = useRoute()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const orgOptions = ref([])
const accountOptions = ref([])
const cashflowOptions = ref([])
const customerOptions = ref([])
const supplierOptions = ref([])

const snackbar = reactive({
  show: false,
  text: '',
  color: 'info',
})

const dialog = reactive({
  visible: false,
  mode: 'create',
})

const pageConfigs = {
  subject: {
    module: 'subject',
    title: '科目余额初始化',
    subtitle: '维护各业务单元在启用期间的科目期初借贷余额，为后续余额表和报表提供期初口径。',
    keywordLabel: '科目编码/名称',
    hasTypeFilter: false,
    headers: [
      { title: '期间', key: 'fperiod', value: 'fperiod', width: 120 },
      { title: '业务单元', key: 'forg', value: 'forg', width: 120 },
      { title: '科目编码', key: 'faccountCode', value: 'faccountCode', width: 160 },
      { title: '科目名称', key: 'faccountName', value: 'faccountName' },
      { title: '借方期初', key: 'fdebitAmount', value: 'fdebitAmount', align: 'end', width: 140 },
      { title: '贷方期初', key: 'fcreditAmount', value: 'fcreditAmount', align: 'end', width: 140 },
      { title: '备注', key: 'fremark', value: 'fremark' },
      { title: '操作', key: 'actions', value: 'actions', width: 120, align: 'center' },
    ],
    listApi: openingInitApi.listOpeningSubjects,
    createApi: openingInitApi.createOpeningSubject,
    updateApi: openingInitApi.updateOpeningSubject,
    deleteApi: openingInitApi.deleteOpeningSubject,
  },
  cashflow: {
    module: 'cashflow',
    title: '现金流初始化',
    subtitle: '维护现金流项目的期初金额和流向，便于现金流量表在启用期之后平滑承接。',
    keywordLabel: '项目编码/名称',
    hasTypeFilter: false,
    headers: [
      { title: '期间', key: 'fperiod', value: 'fperiod', width: 120 },
      { title: '业务单元', key: 'forg', value: 'forg', width: 120 },
      { title: '项目编码', key: 'fcashflowCode', value: 'fcashflowCode', width: 160 },
      { title: '项目名称', key: 'fcashflowName', value: 'fcashflowName' },
      { title: '流向', key: 'fdirection', value: 'fdirection', width: 100, align: 'center' },
      { title: '金额', key: 'famount', value: 'famount', align: 'end', width: 140 },
      { title: '备注', key: 'fremark', value: 'fremark' },
      { title: '操作', key: 'actions', value: 'actions', width: 120, align: 'center' },
    ],
    listApi: openingInitApi.listOpeningCashflows,
    createApi: openingInitApi.createOpeningCashflow,
    updateApi: openingInitApi.updateOpeningCashflow,
    deleteApi: openingInitApi.deleteOpeningCashflow,
  },
  counterparty: {
    module: 'counterparty',
    title: '往来余额初始化',
    subtitle: '维护客户、供应商等往来对象的期初余额，为后续往来核销、对账和账龄分析提供基线。',
    keywordLabel: '往来对象名称',
    hasTypeFilter: true,
    typeOptions: [
      { label: '客户', value: 'CUSTOMER' },
      { label: '供应商', value: 'SUPPLIER' },
      { label: '其他', value: 'OTHER' },
    ],
    headers: [
      { title: '期间', key: 'fperiod', value: 'fperiod', width: 120 },
      { title: '业务单元', key: 'forg', value: 'forg', width: 120 },
      { title: '往来类型', key: 'fcounterpartyType', value: 'fcounterpartyType', width: 110, align: 'center' },
      { title: '对象编码', key: 'fcounterpartyCode', value: 'fcounterpartyCode', width: 140 },
      { title: '对象名称', key: 'fcounterpartyName', value: 'fcounterpartyName' },
      { title: '科目名称', key: 'faccountName', value: 'faccountName', width: 140 },
      { title: '方向', key: 'fdirection', value: 'fdirection', width: 90, align: 'center' },
      { title: '金额', key: 'famount', value: 'famount', align: 'end', width: 140 },
      { title: '操作', key: 'actions', value: 'actions', width: 120, align: 'center' },
    ],
    listApi: openingInitApi.listOpeningCounterparties,
    createApi: openingInitApi.createOpeningCounterparty,
    updateApi: openingInitApi.updateOpeningCounterparty,
    deleteApi: openingInitApi.deleteOpeningCounterparty,
  },
}

const pageMeta = computed(() => pageConfigs[route.meta?.initModule] || pageConfigs.subject)

const query = reactive({
  page: 1,
  size: 10,
  forg: null,
  fperiod: currentPeriod(),
  keyword: '',
  type: null,
})

const form = reactive(createEmptyForm())

const cashflowDirectionOptions = [
  { label: '流入', value: 'INFLOW' },
  { label: '流出', value: 'OUTFLOW' },
]

const counterpartyTypeOptions = [
  { label: '客户', value: 'CUSTOMER' },
  { label: '供应商', value: 'SUPPLIER' },
  { label: '其他', value: 'OTHER' },
]

const counterpartyDirectionOptions = [
  { label: '借方', value: 'DEBIT' },
  { label: '贷方', value: 'CREDIT' },
]

const counterpartyOptions = computed(() => {
  if (form.fcounterpartyType === 'CUSTOMER') return customerOptions.value
  if (form.fcounterpartyType === 'SUPPLIER') return supplierOptions.value
  return []
})

const totalAmount = computed(() => list.value.reduce((sum, item) => {
  if (pageMeta.value.module === 'subject') {
    return sum + Number(item.fdebitAmount || 0) + Number(item.fcreditAmount || 0)
  }
  return sum + Number(item.famount || 0)
}, 0))

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function createEmptyForm() {
  return {
    fid: null,
    forg: null,
    fperiod: currentPeriod(),
    faccountId: null,
    faccountCode: '',
    faccountName: '',
    fdebitAmount: 0,
    fcreditAmount: 0,
    fcashflowItemId: null,
    fcashflowCode: '',
    fcashflowName: '',
    famount: 0,
    fdirection: 'INFLOW',
    fcounterpartyType: 'CUSTOMER',
    fcounterpartyId: null,
    fcounterpartyCode: '',
    fcounterpartyName: '',
    fremark: '',
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  form.forg = query.forg
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function showMsg(text, color = 'info') {
  snackbar.show = true
  snackbar.text = text
  snackbar.color = color
}

async function loadBaseOptions() {
  const [orgRes, accountRes, cashflowRes, customerRes, supplierRes] = await Promise.all([
    getBusinessUnitList({ page: 1, size: 500 }),
    accountSubjectApi.fetchList({ page: 1, size: 500 }),
    cashflowItemApi.fetchList({ page: 1, size: 500 }),
    customerApi.fetchList({ page: 1, size: 500 }),
    supplierApi.fetchList({ page: 1, size: 500 }),
  ])
  orgOptions.value = (orgRes.data?.records || []).map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
  }))
  accountOptions.value = (accountRes.data?.records || []).map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
    code: item.fcode,
    name: item.fname,
  }))
  cashflowOptions.value = (cashflowRes.data?.records || []).map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
    code: item.fcode,
    name: item.fname,
  }))
  customerOptions.value = (customerRes.data?.records || []).map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
    code: item.fcode,
    name: item.fname,
  }))
  supplierOptions.value = (supplierRes.data?.records || []).map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
    code: item.fcode,
    name: item.fname,
  }))

  if (!query.forg && orgOptions.value.length) {
    query.forg = orgOptions.value[0].value
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: query.page,
      size: query.size,
      forg: query.forg || undefined,
      fperiod: query.fperiod || undefined,
    }
    if (pageMeta.value.module === 'subject') {
      params.faccountCode = query.keyword || undefined
      params.faccountName = query.keyword || undefined
    } else if (pageMeta.value.module === 'cashflow') {
      params.fcashflowCode = query.keyword || undefined
      params.fcashflowName = query.keyword || undefined
    } else {
      params.fcounterpartyName = query.keyword || undefined
      params.fcounterpartyType = query.type || undefined
    }
    const res = await pageMeta.value.listApi(params)
    const data = res.data || {}
    list.value = data.records || []
    total.value = Number(data.total || 0)
    pages.value = Number(data.pages || 1)
  } catch {
    list.value = []
    total.value = 0
    pages.value = 1
    showMsg(`${pageMeta.value.title}加载失败`, 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchData()
}

function resetQuery() {
  query.page = 1
  query.fperiod = currentPeriod()
  query.keyword = ''
  query.type = null
  fetchData()
}

function openCreate() {
  resetForm()
  dialog.mode = 'create'
  dialog.visible = true
}

function openEdit(item) {
  resetForm()
  Object.assign(form, JSON.parse(JSON.stringify(item)))
  dialog.mode = 'edit'
  dialog.visible = true
}

async function handleSave() {
  try {
    const payload = JSON.parse(JSON.stringify(form))
    if (dialog.mode === 'create') {
      await pageMeta.value.createApi(payload)
      showMsg(`${pageMeta.value.title}新增成功`, 'success')
    } else {
      await pageMeta.value.updateApi(payload)
      showMsg(`${pageMeta.value.title}更新成功`, 'success')
    }
    dialog.visible = false
    fetchData()
  } catch {
    showMsg(`${pageMeta.value.title}保存失败`, 'error')
  }
}

async function handleDelete(item) {
  try {
    await pageMeta.value.deleteApi(item.fid)
    showMsg(`${pageMeta.value.title}删除成功`, 'success')
    fetchData()
  } catch {
    showMsg(`${pageMeta.value.title}删除失败`, 'error')
  }
}

function syncAccount() {
  const hit = accountOptions.value.find((item) => item.value === form.faccountId)
  if (!hit) return
  form.faccountCode = hit.code || ''
  form.faccountName = hit.name || ''
}

function syncCashflow() {
  const hit = cashflowOptions.value.find((item) => item.value === form.fcashflowItemId)
  if (!hit) return
  form.fcashflowCode = hit.code || ''
  form.fcashflowName = hit.name || ''
}

function syncCounterpartyType() {
  form.fcounterpartyId = null
  form.fcounterpartyCode = ''
  form.fcounterpartyName = ''
}

function syncCounterparty() {
  const hit = counterpartyOptions.value.find((item) => item.value === form.fcounterpartyId)
  if (!hit) return
  form.fcounterpartyCode = hit.code || ''
  form.fcounterpartyName = hit.name || ''
}

onMounted(async () => {
  await loadBaseOptions().catch(() => {
    showMsg('初始化页面基础选项加载失败', 'warning')
  })
  await fetchData()
})
</script>

<style scoped>
.init-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-title {
  margin: 0 0 6px;
  color: #23447a;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  color: #62779b;
  font-size: 14px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.actions-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-row {
  margin-bottom: 12px;
}

.summary-card {
  height: 100%;
  border: 1px solid #e4ebf7;
  border-radius: 14px;
  padding: 18px;
  background: linear-gradient(180deg, #f9fbff 0%, #ffffff 100%);
}

.summary-label {
  color: #5e7297;
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
}

.summary-text {
  color: #667085;
  font-size: 14px;
}

.tone-primary {
  color: #2450b2;
}

.tone-success {
  color: #1f8b57;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}
</style>
