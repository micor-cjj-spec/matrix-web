<template>
  <div class="account-subject-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">会计科目</h2>
        <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建科目</v-btn>
      </div>
      <v-data-table :headers="headers" :items="list" :loading="loading" class="elevation-0" item-key="fid" hide-default-footer dense>
        <template #item.actions="{ item }">
          <v-btn size="small" color="primary" variant="tonal" @click="openEditDialog(item)">编辑</v-btn>
          <v-btn size="small" color="error" variant="tonal" class="ml-1" @click="openDeleteDialog(item)">删除</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建科目' : '编辑科目' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fcode" label="编码" :rules="[v=>!!v||'必填']" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fname" label="名称" :rules="[v=>!!v||'必填']" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.forg" :items="orgOptions" label="核算组织" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.flongName" label="长名称" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.ftype" :items="acctTypeOptions" label="科目类型" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete v-model="dialog.form.fparent" :items="subjectOptions" label="上级" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fpltype" :items="profitLossOptions" label="损益类型" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fdirection" :items="['借','贷']" label="余额方向" required />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fisDetail" label="明细科目" />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete v-model="dialog.form.freportItem" :items="reportItemOptions" label="报表项目" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete v-model="dialog.form.flevel1" :items="level1Options" label="一级科目" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fentryControl" :items="entryControlOptions" label="科目录入方向控制" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fcontrolLevel" :items="controlLevelOptions" label="控制级次" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fallowChild" label="允许公司增加下级科目" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fmanualEntry" label="手工录入" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fcash" label="现金科目" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fbank" label="银行科目" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fequivalent" label="现金等价物" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fisEntry" label="登记记账" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fnotice" label="往来通知" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fexchange" label="期末调汇" />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-checkbox v-model="dialog.form.fqtyAccounting" label="数量核算" />
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

    <v-dialog v-model="deleteDialog.visible" max-width="350">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除科目 <b>{{ deleteDialog.item?.fname }}</b>？</v-card-text>
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
import { useSimpleData } from '@/composables/base-data/useSimpleData'

const fields = [
  'fid','fcode','fname','forg','flongName','ftype','fparent','fpltype','fdirection','fisDetail',
  'freportItem','flevel1','fentryControl','fcontrolLevel','fallowChild','fmanualEntry',
  'fcash','fbank','fequivalent','fisEntry','fnotice','fexchange','fqtyAccounting'
]

const { list, loading, fetchList, createItem, editItem, deleteItem } = useSimpleData('/account-subject', fields)

const headers = ref([
  { title: '编码', value: 'fcode', align: 'start' },
  { title: '名称', value: 'fname' },
  { title: '科目类型', value: 'ftype' },
  { title: '余额方向', value: 'fdirection' },
  { title: '操作', value: 'actions', sortable: false, align: 'center', width: 150 }
])

const orgOptions = ref([])
const acctTypeOptions = ref(['资产','负债','权益','成本','损益'])
const subjectOptions = ref([])
const profitLossOptions = ref([])
const entryControlOptions = ref(['借','贷','借或贷'])
const controlLevelOptions = ref([])
const reportItemOptions = ref([])
const level1Options = ref([])

const snackbar = reactive({ show: false, text: '', color: 'success' })
const dialog = reactive({
  visible: false,
  mode: 'create',
  form: Object.fromEntries(fields.map(k => [k, ''])),
  valid: false,
})
const formRef = ref()

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.keys(dialog.form).forEach(k => dialog.form[k] = '')
}
function openEditDialog(item) {
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, item)
}
function closeDialog() { dialog.visible = false }
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
function openDeleteDialog(item) { deleteDialog.visible = true; deleteDialog.item = item }
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

onMounted(() => { fetchList() })
</script>

<style scoped>
.account-subject-page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
