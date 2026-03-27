<template>
  <div class="supplier-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">供应商管理</h2>
        <div class="actions">
          <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建供应商</v-btn>
          <v-btn class="ml-3" color="secondary" variant="tonal" :disabled="selected.length===0" @click="handleBatchSubmit">提交审核（批量）</v-btn>
        </div>
      </div>
      <v-data-table
        :headers="headers"
        :items="list"
        :loading="loading"
        class="elevation-0"
        item-key="fid"
        hide-default-footer
        dense
        show-select
        v-model:selected="selected"
      >
        <template #item.fcode="{ item }">
          <a href="javascript:;" @click="openActionDialog(item)">{{ item.fcode }}</a>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" color="primary" variant="tonal" @click="handleSubmitOne(item)">提交审核</v-btn>
          <v-btn size="small" color="error" variant="tonal" class="ml-1" @click="openDeleteDialog(item)">删除</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建供应商' : '编辑供应商' }}</v-card-title>
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
        <v-card-text>确认删除供应商 <b>{{ deleteDialog.item?.fname }}</b>？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="handleDelete">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="actionDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">供应商操作</v-card-title>
        <v-card-text>
          <div>名称：{{ actionDialog.item?.fname }}</div>
          <div>编码：{{ actionDialog.item?.fcode }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="actionDialog.visible=false">关闭</v-btn>
          <v-btn variant="text" color="primary" @click="handleSubmitFromDialog">提交审核</v-btn>
          <v-btn variant="text" color="error" @click="handleDeleteFromDialog">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSimpleData } from '@/composables/base-data/useSimpleData'
import supplierApi from '@/api/supplier'
import { useReviewActions } from '@/composables/useReview'

const { list, loading, fetchList, createItem, editItem, deleteItem } = useSimpleData(supplierApi)
const { submitting, submitOne, submitBatch } = useReviewActions()

const headers = ref([
  { title: '名称', value: 'fname', align: 'start' },
  { title: '编码', value: 'fcode' },
  { title: '操作', value: 'actions', sortable: false, align: 'center', width: 150 },
])

const snackbar = reactive({ show: false, text: '', color: 'success' })
const selected = ref([])
const actionDialog = reactive({ visible: false, item: null })
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

async function handleSubmitOne(item) {
  await submitOne(item)
  showMsg('已提交审核')
}

async function handleBatchSubmit() {
  if (!selected.value.length) return
  await submitBatch(selected.value)
  selected.value = []
  showMsg('批量提交审核成功')
}

function openActionDialog(item) {
  actionDialog.item = item
  actionDialog.visible = true
}

async function handleSubmitFromDialog() {
  if (!actionDialog.item) return
  await handleSubmitOne(actionDialog.item)
  actionDialog.visible = false
}

async function handleDeleteFromDialog() {
  if (!actionDialog.item) return
  await deleteItem(actionDialog.item)
  showMsg('删除成功')
  actionDialog.visible = false
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.supplier-page { padding: 24px; }
.header .actions { display: flex; align-items: center; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
