<template>
  <div class="business-unit-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">业务单元管理</h2>
        <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">
          创建业务单元
        </v-btn>
      </div>

      <v-data-table
          :headers="headers"
          :items="unitList"
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
        <v-card-title>{{ dialog.mode === 'create' ? '创建业务单元' : '编辑业务单元' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fname" label="名称" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model="dialog.form.fcode" label="编码" />
            <v-text-field v-model="dialog.form.fshort_name" label="简称" />
            <v-text-field v-model="dialog.form.fmanage_org_code" label="管理组织编码" />
            <v-select v-model="dialog.form.fusagestatus" :items="['启用','停用','草稿']" label="使用状态" clearable />
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
import { ref, reactive, onMounted } from 'vue'
import { useBusinessUnit } from '@/composables/login/enterprise-modeling/business-unit/useBusinessUnit.js'

const {
  unitList,
  loading,
  fetchBusinessUnitList,
  createBusinessUnit,
  editBusinessUnit,
  deleteBusinessUnit,
} = useBusinessUnit()

const headers = ref([
  { title: '名称', value: 'fname', align: 'start' },
  { title: '编码', value: 'fcode' },
  { title: '简称', value: 'fshort_name' },
  { title: '管理组织编码', value: 'fmanage_org_code' },
  { title: '使用状态', value: 'fusagestatus' },
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
    fshort_name: '',
    fmanage_org_code: '',
    fusagestatus: '',
  },
  valid: false,
  unitRef: null,
})
const formRef = ref()

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, { fid: null, fname: '', fcode: '', fshort_name: '', fmanage_org_code: '', fusagestatus: '' })
  dialog.unitRef = null
}
function openEditDialog(unit) {
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, { ...unit })
  dialog.unitRef = unit
}
function closeDialog() {
  dialog.visible = false
  dialog.unitRef = null
}
async function handleConfirm() {
  const validForm = await formRef.value?.validate?.()
  if (!validForm) return
  if (dialog.mode === 'create') {
    await createBusinessUnit({ ...dialog.form })
    showMsg('创建成功', 'success')
  } else {
    await editBusinessUnit({ ...dialog.form })
    showMsg('业务单元已更新', 'success')
  }
  closeDialog()
}

const deleteDialog = reactive({
  visible: false,
  unit: null,
})
function openDeleteDialog(unit) {
  deleteDialog.visible = true
  deleteDialog.unit = unit
}
async function handleDeleteUnit() {
  await deleteBusinessUnit(deleteDialog.unit)
  showMsg('删除成功', 'success')
  deleteDialog.visible = false
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(() => {
  fetchBusinessUnitList()
})
</script>

<style scoped>
.business-unit-page {
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
