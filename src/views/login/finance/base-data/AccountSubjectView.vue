<template>
  <div class="account-subject-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">会计科目</h2>
          <div class="subtitle">组织字段已联动业务单元主数据，报表项目和现金类标记也可以在这里集中审计。</div>
        </div>
        <div class="toolbar">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新建科目</v-btn>
          <v-btn color="primary" variant="tonal" @click="openEditDialog(selectedItem)" :disabled="!selectedItem">编辑</v-btn>
          <v-btn color="error" variant="tonal" @click="openDeleteDialog(selectedItem)" :disabled="!selectedItem">删除</v-btn>
          <v-btn color="info" variant="tonal" @click="fetchList">刷新</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="2">
          <v-text-field v-model.trim="query.fcode" label="科目编码" clearable density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.trim="query.fname" label="科目名称" clearable density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="query.forg"
            :items="orgOptions"
            item-title="label"
            item-value="value"
            label="业务单元"
            clearable
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.ftype" :items="accountTypeOptions" label="科目类型" clearable density="comfortable" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="query.fpltype" :items="profitLossTypeOptions" label="损益类型" clearable density="comfortable" />
        </v-col>
        <v-col cols="12" md="1" class="filter-actions">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
        </v-col>
      </v-row>

      <div class="selected-tip">
        当前选中：{{ selectedItem ? `${selectedItem.fcode} - ${selectedItem.fname}` : '未选择，请点击表格行' }}
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
        <template #item.fcode="{ item }">
          <v-btn size="small" variant="text" color="primary" @click.stop="openEditDialog(item)">{{ item.fcode }}</v-btn>
        </template>
        <template #item.forg="{ item }">
          {{ orgName(item.forg) }}
        </template>
        <template #item.fparent="{ item }">
          {{ accountName(item.fparent) }}
        </template>
        <template #item.freportItem="{ item }">
          {{ reportItemName(item.freportItem) }}
        </template>
        <template #item.fcashFlags="{ item }">
          <div class="flag-list">
            <v-chip v-if="item.fcash === 1" size="small" color="teal" variant="tonal">现金</v-chip>
            <v-chip v-if="item.fbank === 1" size="small" color="primary" variant="tonal">银行</v-chip>
            <v-chip v-if="item.fequivalent === 1" size="small" color="indigo" variant="tonal">等价物</v-chip>
            <span v-if="item.fcash !== 1 && item.fbank !== 1 && item.fequivalent !== 1">-</span>
          </div>
        </template>
        <template #item.fisDetail="{ item }">
          {{ item.fisDetail === 1 ? '是' : '否' }}
        </template>
      </v-data-table>

      <div class="footer">
        <div class="summary">共 {{ total }} 条</div>
        <v-pagination
          v-model="query.page"
          :length="Math.max(1, pages)"
          :total-visible="7"
          @update:model-value="fetchList"
        />
      </div>
    </v-card>

    <v-dialog v-model="deleteDialog.visible" max-width="360">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除会计科目 <b>{{ deleteDialog.item?.fname }}</b>？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="handleDelete">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteAccountSubject, getAccountSubjectList } from '@/api/accountSubject'
import { getBusinessUnitList } from '@/api/bizUnit'
import reportItemApi from '@/api/reportItem'
import reportTemplateApi from '@/api/reportTemplate'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const selectedItem = ref(null)
const allAccounts = ref([])
const reportItems = ref([])
const templates = ref([])
const businessUnits = ref([])
const snackbar = reactive({ show: false, text: '', color: 'success' })
const deleteDialog = reactive({ visible: false, item: null })

const accountTypeOptions = ['资产', '负债', '权益', '成本', '损益']
const profitLossTypeOptions = ['收入', '成本', '费用', '其他']

const query = reactive({
  page: 1,
  size: 10,
  fcode: '',
  fname: '',
  forg: null,
  ftype: '',
  fpltype: '',
})

const headers = [
  { title: '科目编码', value: 'fcode', align: 'start' },
  { title: '科目名称', value: 'fname' },
  { title: '业务单元', value: 'forg' },
  { title: '科目类型', value: 'ftype' },
  { title: '余额方向', value: 'fdirection' },
  { title: '上级科目', value: 'fparent' },
  { title: '损益类型', value: 'fpltype' },
  { title: '关联报表项目', value: 'freportItem' },
  { title: '现金类标记', value: 'fcashFlags' },
  { title: '末级', value: 'fisDetail', align: 'center' },
]

const orgOptions = computed(() =>
  businessUnits.value.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname}`,
    value: item.fid,
  })),
)

const templateNameMap = computed(() =>
  templates.value.reduce((acc, item) => {
    acc[item.fid] = item.fname || item.fcode || `模板${item.fid}`
    return acc
  }, {}),
)

async function fetchLookups() {
  const [accountRes, reportItemRes, templateRes, businessUnitRes] = await Promise.all([
    getAccountSubjectList({ page: 1, size: 1000 }),
    reportItemApi.listReportItems({ page: 1, size: 1000 }),
    reportTemplateApi.fetchList({ page: 1, size: 200 }),
    getBusinessUnitList({ page: 1, size: 500 }),
  ])

  allAccounts.value = accountRes.data?.records || []
  reportItems.value = reportItemRes.data?.records || []
  templates.value = templateRes.data?.records || []
  businessUnits.value = businessUnitRes.data?.records || []
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAccountSubjectList({
      page: query.page,
      size: query.size,
      fcode: query.fcode || undefined,
      fname: query.fname || undefined,
      forg: normalizeNumber(query.forg) ?? undefined,
      ftype: query.ftype || undefined,
      fpltype: query.fpltype || undefined,
    })
    const pageData = res.data || {}
    list.value = pageData.records || []
    total.value = pageData.total || 0
    pages.value = pageData.pages || 1
  } catch (error) {
    showMsg('会计科目加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function openCreateDialog() {
  router.push('/finance/base-data/account-subject/form')
}

function openEditDialog(item) {
  if (!item?.fid) return
  router.push(`/finance/base-data/account-subject/form/${item.fid}`)
}

function openDeleteDialog(item) {
  if (!item?.fid) return
  deleteDialog.visible = true
  deleteDialog.item = item
}

async function handleDelete() {
  if (!deleteDialog.item?.fid) return
  try {
    await deleteAccountSubject(deleteDialog.item.fid)
    deleteDialog.visible = false
    selectedItem.value = null
    showMsg('会计科目删除成功')
    await Promise.all([fetchLookups(), fetchList()])
  } catch (error) {
    showMsg('会计科目删除失败', 'error')
  }
}

function handleRowClick(_, row) {
  selectedItem.value = row?.item || null
}

function getRowProps({ item }) {
  return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {}
}

function orgName(fid) {
  const match = businessUnits.value.find((item) => item.fid === fid)
  return match ? `${match.fcode || '-'} - ${match.fname}` : '-'
}

function accountName(fid) {
  const match = allAccounts.value.find((item) => item.fid === fid)
  return match ? `${match.fcode} - ${match.fname}` : '-'
}

function reportItemName(fid) {
  const match = reportItems.value.find((item) => item.fid === fid)
  if (!match) return '-'
  const templateName = templateNameMap.value[match.ftemplateId] || '未命名模板'
  return `${templateName} / ${match.fname}`
}

function normalizeNumber(value) {
  if (value === '' || value === undefined || value === null) return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(async () => {
  await Promise.all([fetchLookups(), fetchList()])
})
</script>

<style scoped>
.account-subject-page {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
}

.selected-tip {
  margin-bottom: 12px;
  color: #5f6b84;
  font-size: 13px;
}

.flag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 24px;
  align-items: center;
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
