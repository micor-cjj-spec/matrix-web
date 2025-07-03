<template>
  <div class="org-pattern-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">组织形态管理</h2>
        <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建组织形态</v-btn>
      </div>
      <v-data-table :headers="headers" :items="list" :loading="loading" class="elevation-0" item-key="fid" hide-default-footer dense>
        <template #item.fenable="{ item }">
          <v-chip size="small" :color="item.fenable ? 'primary' : ''" variant="tonal">
            {{ item.fenable ? '是' : '否' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" color="primary" variant="tonal" @click="openEditDialog(item)">编辑</v-btn>
          <v-btn size="small" color="error" variant="tonal" class="ml-1" @click="openDeleteDialog(item)">删除</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建组织形态' : '编辑组织形态' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fbillno" label="单据编号" />
            <v-text-field v-model="dialog.form.fname" label="名称" :rules="[v=>!!v||'必填']" required />
            <v-text-field v-model="dialog.form.fpattern" label="组织形态" />
            <v-switch v-model="dialog.form.fenable" label="是否可用" true-value="1" false-value="0" />
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
        <v-card-text>确认删除组织形态 <b>{{ deleteDialog.item?.fname }}</b>？</v-card-text>
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
import { ref, reactive, onMounted } from 'vue'
import { useOrgPattern } from '@/composables/login/enterprise-modeling/org-pattern/useOrgPattern'

const { list, loading, fetchList, createItem, editItem, deleteItem } = useOrgPattern()

const headers = ref([
  { title: '单据编号', value: 'fbillno', align: 'start' },
  { title: '名称', value: 'fname' },
  { title: '组织形态', value: 'fpattern' },
  { title: '是否可用', value: 'fenable', sortable: false },
  { title: '操作', value: 'actions', sortable: false, align: 'center', width: 150 },
])

const snackbar = reactive({ show: false, text: '', color: 'success' })
const dialog = reactive({
  visible: false,
  mode: 'create',
  form: { fid: null, fbillno: '', fname: '', fpattern: '', fenable: 1 },
  valid: false,
})
const formRef = ref()

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, { fid: null, fbillno: '', fname: '', fpattern: '', fenable: 1 })
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

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.org-pattern-page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
