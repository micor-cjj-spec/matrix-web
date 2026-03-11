<template>
  <div class="page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">{{ title }}</h2>
        <div class="toolbar">
          <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">创建</v-btn>
          <v-btn color="primary" variant="tonal" class="ml-2" @click="openEditDialog(selectedItem)" :disabled="!canEdit">编辑</v-btn>
          <v-btn color="warning" variant="tonal" class="ml-2" @click="runAction(api.submitItem, '提交成功')" :disabled="!canSubmit">提交</v-btn>
          <v-btn color="success" variant="tonal" class="ml-2" @click="runAction(api.auditItem, '审核成功')" :disabled="!canAudit">审核</v-btn>
          <v-btn color="secondary" variant="tonal" class="ml-2" @click="runAction(api.rejectItem, '驳回成功')" :disabled="!canReject">驳回</v-btn>
          <v-btn color="error" variant="tonal" class="ml-2" @click="openDeleteDialog(selectedItem)" :disabled="!canDelete">删除</v-btn>
        </div>
      </div>
      <v-data-table :headers="headers" :items="list" :loading="loading" item-key="fid" hide-default-footer dense @click:row="handleRowClick" :row-props="getRowProps">
        <template #item.fstatus="{ item }">{{ statusLabel(item.fstatus) }}</template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="560" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建单据' : '编辑单据' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fnumber" label="单据号（可空自动生成）" />
            <v-text-field v-model="dialog.form.fdate" label="日期" type="date" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model="dialog.form.fcounterparty" label="往来方" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model.number="dialog.form.famount" label="金额" type="number" :rules="[v => Number(v) > 0 || '必须大于0']" required />
            <v-textarea v-model="dialog.form.fremark" label="备注" rows="2" auto-grow />
          </v-form>
        </v-card-text>
        <v-card-actions><v-spacer/><v-btn variant="text" @click="dialog.visible=false">取消</v-btn><v-btn variant="text" color="primary" @click="handleConfirm">保存</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="360">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除 {{ deleteDialog.item?.fnumber }} ？</v-card-text>
        <v-card-actions><v-spacer/><v-btn variant="text" @click="deleteDialog.visible=false">取消</v-btn><v-btn variant="text" color="error" @click="handleDelete">确定</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/arap-doc'

const route = useRoute()
const docType = computed(() => route.meta?.docType || 'AR')
const title = computed(() => route.meta?.title || '单据')

const list = ref([])
const loading = ref(false)
const selectedItem = ref(null)
const formRef = ref()

const headers = [
  { title: '单据号', value: 'fnumber' },
  { title: '日期', value: 'fdate' },
  { title: '往来方', value: 'fcounterparty' },
  { title: '金额', value: 'famount' },
  { title: '状态', value: 'fstatus', align: 'center', width: 120 },
]

const dialog = reactive({ visible: false, mode: 'create', valid: false, form: { fid: null, fdoctype: '', fnumber: '', fdate: '', fcounterparty: '', famount: null, fremark: '' } })
const deleteDialog = reactive({ visible: false, item: null })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const canEdit = computed(() => selectedItem.value && ['DRAFT','REJECTED'].includes(selectedItem.value.fstatus))
const canSubmit = computed(() => selectedItem.value && ['DRAFT','REJECTED'].includes(selectedItem.value.fstatus))
const canAudit = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canReject = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canDelete = computed(() => selectedItem.value && selectedItem.value.fstatus === 'DRAFT')

function statusLabel(s) {
  return ({DRAFT:'草稿',SUBMITTED:'已提交',AUDITED:'已审核',REJECTED:'已驳回'})[s] || s
}

function getRowProps({ item }) { return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {} }
function handleRowClick(_, row) { selectedItem.value = row?.item || null }

async function fetchList() {
  loading.value = true
  try {
    const res = await api.fetchList({ docType: docType.value, page: 1, size: 500 })
    list.value = res.data?.records || []
  } finally { loading.value = false }
}

function openCreateDialog() { dialog.visible = true; dialog.mode='create'; Object.assign(dialog.form, { fid:null, fdoctype:docType.value, fnumber:'', fdate:'', fcounterparty:'', famount:null, fremark:'' }) }
function openEditDialog(item) { if(!item) return; dialog.visible=true; dialog.mode='edit'; Object.assign(dialog.form, { ...item }) }

async function handleConfirm() {
  const valid = await formRef.value?.validate?.(); if (!valid) return
  try {
    dialog.form.fdoctype = docType.value
    if (dialog.mode === 'create') await api.createItem({ ...dialog.form }); else await api.editItem({ ...dialog.form })
    show('保存成功')
    dialog.visible = false
    await fetchList()
  } catch (e) { show(e?.response?.data?.message || e?.message || '保存失败', 'error') }
}

function openDeleteDialog(item){ if(!item) return; deleteDialog.visible=true; deleteDialog.item=item }
async function handleDelete(){ try { await api.deleteItem(deleteDialog.item.fid); deleteDialog.visible=false; selectedItem.value=null; show('删除成功'); await fetchList() } catch (e) { show(e?.response?.data?.message || '删除失败','error') } }

async function runAction(fn, msg) {
  if (!selectedItem.value?.fid) return
  try { await fn(selectedItem.value.fid); show(msg); await fetchList(); selectedItem.value = null } catch (e) { show(e?.response?.data?.message || e?.message || '操作失败','error') }
}

function show(text, color='success'){ snackbar.text=text; snackbar.color=color; snackbar.show=true }

onMounted(fetchList)
</script>

<style scoped>
.page{padding:24px}.header{margin-bottom:16px}.title{font-size:22px;font-weight:bold;color:#27324c;letter-spacing:2px;margin-bottom:12px}.toolbar{display:flex;flex-wrap:wrap;align-items:center}.selected-row{background:#e8f1ff !important}
</style>
