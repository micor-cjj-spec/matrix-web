<template>
  <div class="business-unit-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">业务单元</h2>
          <div class="subtitle">维护企业建模中的组织主数据，财务会计科目等页面会直接引用这里的业务单元。</div>
        </div>
        <div class="toolbar">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新增业务单元</v-btn>
          <v-btn color="primary" variant="tonal" @click="openEditDialog(selectedItem)" :disabled="!selectedItem">编辑</v-btn>
          <v-btn color="error" variant="tonal" @click="openDeleteDialog(selectedItem)" :disabled="!selectedItem">删除</v-btn>
          <v-btn color="info" variant="tonal" @click="handleSearch">刷新</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="filters.fname" label="业务单元名称" clearable density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="filters.fcode" label="业务单元编码" clearable density="comfortable" />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.fusagestatus"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="使用状态"
            clearable
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="3" class="filter-actions">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
          <v-btn variant="text" @click="resetFilters">重置</v-btn>
        </v-col>
      </v-row>

      <div class="selected-tip">
        当前选中：{{ selectedItem ? `${selectedItem.fcode || '-'} - ${selectedItem.fname}` : '未选择，请点击表格行' }}
      </div>

      <v-data-table
        :headers="headers"
        :items="unitList"
        :loading="loading"
        loading-text="加载中..."
        class="elevation-0"
        item-key="fid"
        hide-default-footer
        @click:row="handleRowClick"
        :row-props="getRowProps"
      >
        <template #item.fcode="{ item }">
          <v-btn size="small" color="primary" variant="text" @click.stop="openEditDialog(item)">{{ item.fcode || '-' }}</v-btn>
        </template>
        <template #item.fparentOrgId="{ item }">
          {{ parentUnitLabel(item.fparentOrgId) }}
        </template>
        <template #item.fusagestatus="{ item }">
          {{ usageStatusLabel(item.fusagestatus) }}
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="720" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '新增业务单元' : '编辑业务单元' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fname" label="名称" :rules="[requiredRule]" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fcode" label="编码" :rules="[requiredRule]" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fshortName" label="简称" />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="dialog.form.fparentOrgId"
                  :items="parentOptions"
                  item-title="label"
                  item-value="value"
                  label="上级业务单元"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fmanageOrgCode" label="管理组织编码" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="dialog.form.fmanageOrgName" label="管理组织名称" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="dialog.form.fusagestatus"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  label="使用状态"
                  :rules="[requiredRule]"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model.trim="dialog.form.fdescription" label="描述" rows="3" auto-grow />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">取消</v-btn>
          <v-btn variant="text" color="primary" @click="handleConfirm">{{ dialog.mode === 'create' ? '创建' : '保存' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="360">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除业务单元 <b>{{ deleteDialog.unit?.fname }}</b>？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="handleDeleteUnit">确定</v-btn>
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
import { useBusinessUnit } from '@/composables/login/enterprise-modeling/business-unit/useBusinessUnit.js'

const {
  unitList,
  loading,
  fetchBusinessUnitList,
  createBusinessUnit,
  editBusinessUnit,
  deleteBusinessUnit,
} = useBusinessUnit()

const statusOptions = [
  { title: '启用', value: '启用' },
  { title: '停用', value: '停用' },
  { title: '草稿', value: '草稿' },
]

const headers = [
  { title: '名称', value: 'fname', align: 'start' },
  { title: '编码', value: 'fcode' },
  { title: '简称', value: 'fshortName' },
  { title: '上级业务单元', value: 'fparentOrgId' },
  { title: '管理组织', value: 'fmanageOrgName' },
  { title: '使用状态', value: 'fusagestatus' },
]

const filters = reactive({
  fname: '',
  fcode: '',
  fusagestatus: '',
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
})

const selectedItem = ref(null)
const formRef = ref()

const dialog = reactive({
  visible: false,
  mode: 'create',
  valid: false,
  form: defaultUnit(),
})

const deleteDialog = reactive({
  visible: false,
  unit: null,
})

const parentOptions = computed(() =>
  unitList.value
    .filter((item) => item.fid !== dialog.form.fid)
    .map((item) => ({
      label: `${item.fcode || '-'} - ${item.fname}`,
      value: item.fid,
    })),
)

function defaultUnit() {
  return {
    fid: null,
    fname: '',
    fcode: '',
    fshortName: '',
    fparentOrgId: null,
    fmanageOrgCode: '',
    fmanageOrgName: '',
    fusagestatus: '启用',
    fdescription: '',
  }
}

function usageStatusLabel(value) {
  return statusOptions.find((item) => item.value === value)?.title || value || '-'
}

function parentUnitLabel(parentId) {
  if (!parentId) return '-'
  const match = unitList.value.find((item) => item.fid === parentId)
  return match ? `${match.fcode || '-'} - ${match.fname}` : parentId
}

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, defaultUnit())
}

function openEditDialog(unit) {
  if (!unit?.fid) return
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, defaultUnit(), {
    ...unit,
    fparentOrgId: normalizeNumber(unit.fparentOrgId),
  })
}

function closeDialog() {
  dialog.visible = false
}

async function handleConfirm() {
  const validation = await formRef.value?.validate?.()
  if (!validationPassed(validation)) return

  const payload = {
    ...dialog.form,
    fparentOrgId: normalizeNumber(dialog.form.fparentOrgId),
  }

  if (dialog.mode === 'create') {
    await createBusinessUnit(payload)
    showMsg('业务单元创建成功', 'success')
  } else {
    await editBusinessUnit(payload)
    showMsg('业务单元更新成功', 'success')
  }
  closeDialog()
}

function openDeleteDialog(unit) {
  if (!unit?.fid) return
  deleteDialog.visible = true
  deleteDialog.unit = unit
}

async function handleDeleteUnit() {
  if (!deleteDialog.unit?.fid) return
  await deleteBusinessUnit(deleteDialog.unit)
  selectedItem.value = null
  showMsg('业务单元删除成功', 'success')
  deleteDialog.visible = false
}

function handleRowClick(_, row) {
  selectedItem.value = row?.item || null
}

function getRowProps({ item }) {
  return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {}
}

function handleSearch() {
  fetchBusinessUnitList({
    fname: filters.fname || undefined,
    fcode: filters.fcode || undefined,
    fusagestatus: filters.fusagestatus || undefined,
    page: 1,
    size: 500,
  })
}

function resetFilters() {
  filters.fname = ''
  filters.fcode = ''
  filters.fusagestatus = ''
  handleSearch()
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
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

const requiredRule = (value) => value !== null && value !== undefined && value !== '' || '必填'

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.business-unit-page {
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
  gap: 8px;
}

.selected-tip {
  margin-bottom: 12px;
  color: #5f6b84;
  font-size: 13px;
}

:deep(.selected-row) {
  background: #e8f1ff !important;
}
</style>
