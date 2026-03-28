<template>
  <div class="report-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">现金流量项目</h2>
          <div class="subtitle">维护现金流项目主数据，供凭证分录标记和现金流量表归集使用。</div>
        </div>
        <div class="toolbar">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新增项目</v-btn>
          <v-btn color="primary" variant="tonal" @click="handleEditSelected" :disabled="!selectedItem">编辑</v-btn>
          <v-btn color="error" variant="tonal" @click="handleDeleteSelected" :disabled="!selectedItem">删除</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="filters.fcode" label="项目编码" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="filters.fname" label="项目名称" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.fcategory"
            :items="categoryOptions"
            item-title="title"
            item-value="value"
            label="分类"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.fstatus"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="状态"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2" class="filter-actions">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
          <v-btn variant="text" @click="resetFilters">重置</v-btn>
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
        <template #item.fcategory="{ item }">
          {{ categoryLabel(item.fcategory) }}
        </template>
        <template #item.fdirection="{ item }">
          {{ directionLabel(item.fdirection) }}
        </template>
        <template #item.fparentId="{ item }">
          {{ parentName(item.fparentId) }}
        </template>
        <template #item.fstatus="{ item }">
          {{ statusLabel(item.fstatus) }}
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

    <v-dialog v-model="dialog.visible" max-width="720" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '新增现金流量项目' : '编辑现金流量项目' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fcode" label="项目编码" :rules="[requiredRule]" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fname" label="项目名称" :rules="[requiredRule]" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.fcategory"
                  :items="categoryOptions"
                  item-title="title"
                  item-value="value"
                  label="分类"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.fdirection"
                  :items="directionOptions"
                  item-title="title"
                  item-value="value"
                  label="方向"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="dialog.form.fparentId"
                  :items="parentOptions"
                  item-title="label"
                  item-value="value"
                  label="上级项目"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model.number="dialog.form.fsort" label="排序" type="number" />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="dialog.form.fstatus"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="状态"
                  :rules="[requiredRule]"
                  required
                />
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
        <v-card-text>确认删除现金流量项目 <b>{{ deleteDialog.item?.fname }}</b>？</v-card-text>
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
import { computed, onMounted, reactive, ref } from 'vue'
import cashflowItemApi from '@/api/cashflowItem'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const selectedItem = ref(null)
const formRef = ref()
const allItems = ref([])

const categoryOptions = [
  { title: '经营活动', value: 'OPERATING' },
  { title: '投资活动', value: 'INVESTING' },
  { title: '筹资活动', value: 'FINANCING' },
]

const directionOptions = [
  { title: '双向', value: 'BOTH' },
  { title: '流入', value: 'IN' },
  { title: '流出', value: 'OUT' },
]

const statusOptions = [
  { title: '启用', value: 'ENABLED' },
  { title: '停用', value: 'DISABLED' },
]

const headers = [
  { title: '项目编码', value: 'fcode' },
  { title: '项目名称', value: 'fname' },
  { title: '分类', value: 'fcategory' },
  { title: '方向', value: 'fdirection' },
  { title: '上级项目', value: 'fparentId' },
  { title: '排序', value: 'fsort' },
  { title: '状态', value: 'fstatus' },
]

const filters = reactive({
  page: 1,
  size: 10,
  fcode: '',
  fname: '',
  fcategory: '',
  fstatus: '',
})

const dialog = reactive({
  visible: false,
  mode: 'create',
  valid: false,
  form: defaultDialogForm(),
})

const deleteDialog = reactive({ visible: false, item: null })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const parentOptions = computed(() =>
  allItems.value
    .filter((item) => item.fid !== dialog.form.fid)
    .map((item) => ({
      label: `${item.fname} (${item.fcode})`,
      value: item.fid,
    })),
)

const requiredRule = (value) => value !== null && value !== undefined && value !== '' || '必填'

async function fetchLookupItems() {
  const res = await cashflowItemApi.fetchList({ page: 1, size: 500 })
  allItems.value = res.data?.records || []
}

async function fetchData() {
  loading.value = true
  try {
    const res = await cashflowItemApi.fetchList({
      page: filters.page,
      size: filters.size,
      fcode: filters.fcode || undefined,
      fname: filters.fname || undefined,
      fcategory: filters.fcategory || undefined,
      fstatus: filters.fstatus || undefined,
    })
    const pageData = res.data || {}
    list.value = pageData.records || []
    total.value = pageData.total || 0
    pages.value = pageData.pages || 1
  } catch (error) {
    showMsg('现金流量项目加载失败', 'error')
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
  filters.fcode = ''
  filters.fname = ''
  filters.fcategory = ''
  filters.fstatus = ''
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
  Object.assign(dialog.form, defaultDialogForm())
}

function handleEditSelected() {
  if (!selectedItem.value) return
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, {
    ...defaultDialogForm(),
    ...selectedItem.value,
    fparentId: normalizeNumber(selectedItem.value.fparentId),
    fsort: Number(selectedItem.value.fsort || 10),
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
    fparentId: normalizeNumber(dialog.form.fparentId),
    fsort: Number(dialog.form.fsort || 0),
  }

  try {
    if (dialog.mode === 'create') {
      delete payload.fid
      await cashflowItemApi.createItem(payload)
      showMsg('现金流量项目创建成功')
    } else {
      await cashflowItemApi.editItem(payload)
      showMsg('现金流量项目保存成功')
    }
    closeDialog()
    await Promise.all([fetchLookupItems(), fetchData()])
  } catch (error) {
    showMsg('现金流量项目保存失败', 'error')
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
    await cashflowItemApi.deleteItem(deleteDialog.item.fid)
    deleteDialog.visible = false
    selectedItem.value = null
    showMsg('现金流量项目删除成功')
    await Promise.all([fetchLookupItems(), fetchData()])
  } catch (error) {
    showMsg('现金流量项目删除失败', 'error')
  }
}

function parentName(fid) {
  const match = allItems.value.find((item) => item.fid === fid)
  return match ? `${match.fname} (${match.fcode})` : '-'
}

function categoryLabel(value) {
  return categoryOptions.find((item) => item.value === value)?.title || value || '-'
}

function directionLabel(value) {
  return directionOptions.find((item) => item.value === value)?.title || value || '-'
}

function statusLabel(value) {
  return statusOptions.find((item) => item.value === value)?.title || value || '-'
}

function defaultDialogForm() {
  return {
    fid: null,
    fcode: '',
    fname: '',
    fparentId: null,
    fcategory: 'OPERATING',
    fdirection: 'BOTH',
    fsort: 10,
    fstatus: 'ENABLED',
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
  await Promise.all([fetchLookupItems(), fetchData()])
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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tip {
  margin-bottom: 12px;
  color: #5f6b84;
  font-size: 13px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
