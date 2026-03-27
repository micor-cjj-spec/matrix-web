<template>
  <div class="account-subject-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">会计科目</h2>
        <div class="toolbar">
          <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建科目</v-btn>
          <v-btn color="primary" variant="tonal" class="ml-2" @click="openEditDialog(selectedItem)" :disabled="!selectedItem">编辑</v-btn>
          <v-btn color="error" variant="tonal" class="ml-2" @click="openDeleteDialog(selectedItem)" :disabled="!selectedItem">删除</v-btn>
          <v-btn color="info" variant="tonal" class="ml-2" @click="fetchList">刷新</v-btn>
        </div>
      </div>
      <div class="selected-tip">当前选中：{{ selectedItem ? `${selectedItem.fcode} - ${selectedItem.fname}` : '未选择，请点击表格行' }}</div>
      <v-data-table :headers="headers" :items="list" :loading="loading" class="elevation-0" item-key="fid" hide-default-footer dense @click:row="handleRowClick" :row-props="getRowProps">
        <template #item.fcode="{ item }">
          <v-btn size="small" variant="text" color="primary" @click.stop="openEditDialog(item)">{{ item.fcode }}</v-btn>
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

const { list, loading, fetchList, deleteItem } = useSimpleData(accountSubjectApi, fields)

const headers = ref([
  { title: '编码', value: 'fcode', align: 'start' },
  { title: '名称', value: 'fname' },
  { title: '科目类型', value: 'ftype' },
  { title: '余额方向', value: 'fdirection' }
])

const selectedItem = ref(null)
const router = useRouter()
const snackbar = reactive({ show: false, text: '', color: 'success' })

function openCreateDialog() {
  router.push('/finance/base-data/account-subject/form')
}
function openEditDialog(item) {
  if (!item?.fid) return
  router.push(`/finance/base-data/account-subject/form/${item.fid}`)
}
const deleteDialog = reactive({ visible: false, item: null })
function openDeleteDialog(item) {
  if (!item?.fid) return
  deleteDialog.visible = true
  deleteDialog.item = item
}
async function handleDelete() {
  if (!deleteDialog.item?.fid) return
  await deleteItem(deleteDialog.item)
  showMsg('删除成功')
  deleteDialog.visible = false
  selectedItem.value = null
}
function handleRowClick(_, row) { selectedItem.value = row?.item || null }
function getRowProps({ item }) {
  return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {}
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
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; }
.selected-tip { font-size: 13px; color: #5f6b84; margin-bottom: 10px; }
:deep(.selected-row) { background: #e8f1ff !important; }
</style>
