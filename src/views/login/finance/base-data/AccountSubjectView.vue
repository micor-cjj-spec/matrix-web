<template>
  <div class="account-subject-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">会计科目</h2>
        <div class="actions">
          <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建科目</v-btn>
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

    <v-dialog v-model="actionDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">会计科目操作</v-card-title>
        <v-card-text>
          <div>编码：{{ actionDialog.item?.fcode }}</div>
          <div>名称：{{ actionDialog.item?.fname }}</div>
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
import { useRouter } from 'vue-router'
import { useSimpleData } from '@/composables/base-data/useSimpleData'
import accountSubjectApi from '@/api/accountSubject'
import { useReviewActions } from '@/composables/useReview'

const fields = [
  'fid','fcode','fname','forg','flongName','ftype','fparent','fpltype','fdirection','fisDetail',
  'freportItem','flevel1','fentryControl','fcontrolLevel','fallowChild','fmanualEntry',
  'fcash','fbank','fequivalent','fisEntry','fnotice','fexchange','fqtyAccounting'
]

const { list, loading, fetchList, createItem, editItem, deleteItem } = useSimpleData(accountSubjectApi, fields)
const { submitting, submitOne, submitBatch } = useReviewActions()

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

const router = useRouter()
const snackbar = reactive({ show: false, text: '', color: 'success' })
const selected = ref([])
const actionDialog = reactive({ visible: false, item: null })

function openCreateDialog() {
  router.push('/finance/base-data/account-subject/form')
}
function openEditDialog(item) {
  router.push(`/finance/base-data/account-subject/form/${item.fid}`)
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

onMounted(() => { fetchList() })
</script>

<style scoped>
.account-subject-page { padding: 24px; }
.header .actions { display: flex; align-items: center; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
