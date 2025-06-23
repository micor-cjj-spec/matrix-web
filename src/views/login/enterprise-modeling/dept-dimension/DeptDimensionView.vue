<template>
  <div class="dept-dim-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">部门维度管理</h2>
        <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">
          创建部门维度
        </v-btn>
      </div>

      <v-data-table
          :headers="headers"
          :items="deptList"
          :loading="loading"
          loading-text="加载中..."
          class="elevation-0"
          item-key="fid"
          hide-default-footer
          dense
      >
        <template #item.actions="{ item }">
          <v-btn size="small" color="primary" @click="openEditDialog(item)" variant="tonal">编辑</v-btn>
          <v-btn size="small" color="error" @click="openDeleteDialog(item)" variant="tonal" class="ml-1">删除</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建部门维度' : '编辑部门维度' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fname" label="名称" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model="dialog.form.fcode" label="编码" />
            <v-text-field v-model="dialog.form.fparentid" label="上级ID" />
            <v-select v-model="dialog.form.fstatus" :items="['启用','停用','草稿']" label="状态" clearable />
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
        <v-card-text>确认删除部门维度 <b>{{ deleteDialog.dept?.fname }}</b>？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="handleDeleteDept">确定</v-btn>
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
import { useDeptDimension } from '@/composables/login/enterprise-modeling/dept-dimension/useDeptDimension.js'

const {
  deptList,
  loading,
  fetchDepartmentList,
  createDepartment,
  editDepartment,
  deleteDepartment,
} = useDeptDimension()

const headers = ref([
  { title: '名称', value: 'fname', align: 'start' },
  { title: '编码', value: 'fcode' },
  { title: '上级ID', value: 'fparentid' },
  { title: '状态', value: 'fstatus' },
  { title: '操作', value: 'actions', sortable: false, align: 'center', width: 150 },
])

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
})

const dialog = reactive({
  visible: false,
  mode: 'create',
  form: {
    fid: null,
    fname: '',
    fcode: '',
    fparentid: '',
    fstatus: '',
  },
  valid: false,
  deptRef: null,
})
const formRef = ref()

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, { fid: null, fname: '', fcode: '', fparentid: '', fstatus: '' })
  dialog.deptRef = null
}
function openEditDialog(dept) {
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, { ...dept })
  dialog.deptRef = dept
}
function closeDialog() {
  dialog.visible = false
  dialog.deptRef = null
}
async function handleConfirm() {
  const validForm = await formRef.value?.validate?.()
  if (!validForm) return
  if (dialog.mode === 'create') {
    await createDepartment({ ...dialog.form })
    showMsg('创建成功', 'success')
  } else {
    await editDepartment({ ...dialog.form })
    showMsg('部门维度已更新', 'success')
  }
  closeDialog()
}

const deleteDialog = reactive({
  visible: false,
  dept: null,
})
function openDeleteDialog(dept) {
  deleteDialog.visible = true
  deleteDialog.dept = dept
}
async function handleDeleteDept() {
  await deleteDepartment(deleteDialog.dept)
  showMsg('删除成功', 'success')
  deleteDialog.visible = false
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(() => {
  fetchDepartmentList()
})
</script>

<style scoped>
.dept-dim-page {
  padding: 24px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.title {
  font-size: 22px;
  font-weight: bold;
  color: #27324c;
  letter-spacing: 2px;
}
</style>
