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
import { useRouter } from 'vue-router'
import { useSimpleData } from '@/composables/base-data/useSimpleData'
import accountSubjectApi from '@/api/accountSubject'

const fields = [
  'fid','fcode','fname','forg','flongName','ftype','fparent','fpltype','fdirection','fisDetail',
  'freportItem','flevel1','fentryControl','fcontrolLevel','fallowChild','fmanualEntry',
  'fcash','fbank','fequivalent','fisEntry','fnotice','fexchange','fqtyAccounting'
]

const { list, loading, fetchList, createItem, editItem, deleteItem } = useSimpleData(accountSubjectApi, fields)

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

onMounted(() => { fetchList() })
</script>

<style scoped>
.account-subject-page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
