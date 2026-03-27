<template>
  <div class="currency-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">币种管理</h2>
        <div class="toolbar">
          <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建币种</v-btn>
          <v-btn color="primary" variant="tonal" class="ml-2" @click="handleEditSelected" :disabled="!canEdit">编辑</v-btn>
          <v-btn color="warning" variant="tonal" class="ml-2" @click="handleSubmitSelected" :disabled="!canSubmit">提交审核</v-btn>
          <v-btn color="success" variant="tonal" class="ml-2" @click="handleAuditSelected" :disabled="!canAudit">审核通过</v-btn>
          <v-btn color="secondary" variant="tonal" class="ml-2" @click="handleRejectSelected" :disabled="!canAudit">驳回</v-btn>
          <v-btn color="error" variant="tonal" class="ml-2" @click="handleDeleteSelected" :disabled="!canDelete">删除</v-btn>
        </div>
        <div class="selected-tip">
          当前选中：{{ selectedItem ? `${selectedItem.fname || '-'}（${statusLabel(selectedItem.fstatus)}）` : '未选择，请点击表格行' }}
        </div>
      </div>
      <v-data-table :headers="headers" :items="list" :loading="loading" class="elevation-0" item-key="fid" hide-default-footer dense @click:row="handleRowClick" :row-props="getRowProps">
        <template #item.fstatus="{ item }">
          {{ statusLabel(item.fstatus) }}
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建币种' : '编辑币种' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fname" label="名称" :rules="[v=>!!v||'必填']" required />
            <v-text-field v-model="dialog.form.fcode" label="编码" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">取消</v-btn>
          <v-btn variant="text" color="primary" @click="handleConfirm">{{ dialog.mode === 'create' ? '创建' : '保存' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="350">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除币种 <b>{{ deleteDialog.item?.fname }}</b>？</v-card-text>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useSimpleData } from '@/composables/base-data/useSimpleData'
import currencyApi from '@/api/currency'

const { list, loading, fetchList, createItem, editItem, deleteItem, submitItem, auditItem, rejectItem } = useSimpleData(currencyApi)

const headers = ref([
  { title: '名称', value: 'fname', align: 'start' },
  { title: '编码', value: 'fcode' },
  { title: '状态', value: 'fstatus', align: 'center', width: 120 },
])

const selectedItem = ref(null)
const canEdit = computed(() => selectedItem.value && selectedItem.value.fstatus !== 'AUDITED')
const canSubmit = computed(() => selectedItem.value && selectedItem.value.fstatus === 'DRAFT')
const canAudit = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canDelete = computed(() => selectedItem.value && selectedItem.value.fstatus !== 'AUDITED')

const snackbar = reactive({ show: false, text: '', color: 'success' })
const dialog = reactive({
  visible: false,
  mode: 'create',
  form: { fid: null, fname: '', fcode: '' },
  valid: false,
})
const formRef = ref()

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, { fid: null, fname: '', fcode: '' })
}

function handleRowClick(_, row) {
  selectedItem.value = row?.item || null
}

function getRowProps({ item }) {
  return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {}
}

function handleEditSelected() {
  if (!selectedItem.value) return
  openEditDialog(selectedItem.value)
}

async function handleSubmitSelected() {
  if (!selectedItem.value) return
  await handleSubmit(selectedItem.value)
}

async function handleAuditSelected() {
  if (!selectedItem.value) return
  await handleAudit(selectedItem.value)
}

async function handleRejectSelected() {
  if (!selectedItem.value) return
  await handleReject(selectedItem.value)
}

function handleDeleteSelected() {
  if (!selectedItem.value) return
  openDeleteDialog(selectedItem.value)
}
function openEditDialog(item) {
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, { ...item })
}
function closeDialog() {
  dialog.visible = false
}
async function handleConfirm() {
  const valid = await formRef.value?.validate?.()
  if (!valid) return
  if (dialog.mode === 'create') {
    await createItem({ ...dialog.form })
    showMsg('创建成功')
  } else {
    await editItem({ ...dialog.form })
    showMsg('保存成功')
  }
  closeDialog()
}
const deleteDialog = reactive({ visible: false, item: null })
function openDeleteDialog(item) {
  deleteDialog.visible = true
  deleteDialog.item = item
}
async function handleDelete() {
  await deleteItem(deleteDialog.item)
  showMsg('删除成功')
  deleteDialog.visible = false
}
function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function statusLabel(status) {
  const map = { DRAFT: '草稿', SUBMITTED: '已提交', AUDITED: '已审核', REJECTED: '已驳回' }
  return map[status] || status || '草稿'
}

async function handleSubmit(item) {
  await submitItem(item)
  showMsg('提交审核成功')
}

async function handleAudit(item) {
  await auditItem(item)
  showMsg('审核通过')
}

async function handleReject(item) {
  await rejectItem(item)
  showMsg('已驳回', 'warning')
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.currency-page { padding: 24px; }
.header { margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; margin-bottom: 12px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0; margin-bottom: 8px; }
.selected-tip { font-size: 13px; color: #5f6b84; }
:deep(.selected-row) { background: #e8f1ff !important; }
</style>
