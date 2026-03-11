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
          <v-btn color="deep-purple" variant="tonal" class="ml-2" @click="generateVoucher" :disabled="!canGenerateVoucher">生成凭证</v-btn>
          <v-btn color="error" variant="tonal" class="ml-2" @click="openDeleteDialog(selectedItem)" :disabled="!canDelete">删除</v-btn>
          <v-btn color="info" variant="tonal" class="ml-2" @click="exportCsv">导出</v-btn>
        </div>
        <div class="filter-row">
          <v-text-field v-model="filters.number" label="单据号" density="compact" variant="outlined" hide-details class="mr-2" />
          <v-text-field v-model="filters.counterparty" label="往来方" density="compact" variant="outlined" hide-details class="mr-2" />
          <v-select v-model="filters.status" :items="statusOptions" item-title="title" item-value="value" label="状态" density="compact" variant="outlined" hide-details class="mr-2" style="max-width:160px" />
          <v-text-field v-model="filters.startDate" type="date" label="开始日期" density="compact" variant="outlined" hide-details class="mr-2" style="max-width:180px" />
          <v-text-field v-model="filters.endDate" type="date" label="结束日期" density="compact" variant="outlined" hide-details class="mr-2" style="max-width:180px" />
          <v-text-field v-model.number="filters.minAmount" type="number" label="最小金额" density="compact" variant="outlined" hide-details class="mr-2" style="max-width:140px" />
          <v-text-field v-model.number="filters.maxAmount" type="number" label="最大金额" density="compact" variant="outlined" hide-details class="mr-2" style="max-width:140px" />
          <v-btn color="primary" variant="tonal" class="mr-2" @click="fetchList">查询</v-btn>
          <v-btn variant="tonal" @click="resetFilters">重置</v-btn>
        </div>
      </div>

      <v-data-table :headers="headers" :items="list" :loading="loading" item-key="fid" hide-default-footer dense @click:row="handleRowClick" :row-props="getRowProps">
        <template #item.fstatus="{ item }">{{ statusLabel(item.fstatus) }}</template>
        <template #item.fvoucherNumber="{ item }">{{ item.fvoucherNumber || '-' }}</template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="680" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '创建单据' : '编辑单据' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fnumber" label="单据号（可空自动生成）" />
            <v-text-field v-model="dialog.form.fdate" label="日期" type="date" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model="dialog.form.fcounterparty" label="往来方" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model.number="dialog.form.famount" label="金额" type="number" :rules="[v => Number(v) > 0 || '必须大于0']" required />

            <template v-if="isPaymentApply">
              <v-select v-model="dialog.form.fpayMethod" :items="['银行转账','电汇','现金']" label="付款方式" />
              <v-text-field v-model="dialog.form.fplannedPayDate" label="预计付款日" type="date" />
            </template>

            <template v-if="isSettlement">
              <v-select v-model="dialog.form.fsettleMethod" :items="['全额结算','部分结算','核销']" label="结算方式" />
              <v-textarea v-model="dialog.form.fwriteoffDetail" label="核销明细" rows="2" auto-grow />
            </template>

            <template v-if="isEstimate">
              <v-text-field v-model="dialog.form.fsourceBillNo" label="暂估来源单号" />
            </template>

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
  { title: '关联凭证', value: 'fvoucherNumber', align: 'center', width: 180 },
]

const statusOptions = [
  { title: '全部', value: '' },
  { title: '草稿', value: 'DRAFT' },
  { title: '已提交', value: 'SUBMITTED' },
  { title: '已审核', value: 'AUDITED' },
  { title: '已驳回', value: 'REJECTED' },
]

const filters = reactive({ number: '', counterparty: '', status: '', startDate: '', endDate: '', minAmount: null, maxAmount: null })

const dialog = reactive({ visible: false, mode: 'create', valid: false, form: { fid: null, fdoctype: '', fnumber: '', fdate: '', fcounterparty: '', famount: null, fremark: '', fpayMethod: '', fplannedPayDate: '', fsettleMethod: '', fwriteoffDetail: '', fsourceBillNo: '' } })
const deleteDialog = reactive({ visible: false, item: null })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const canEdit = computed(() => selectedItem.value && ['DRAFT','REJECTED'].includes(selectedItem.value.fstatus))
const canSubmit = computed(() => selectedItem.value && ['DRAFT','REJECTED'].includes(selectedItem.value.fstatus))
const canAudit = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canReject = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canDelete = computed(() => selectedItem.value && selectedItem.value.fstatus === 'DRAFT')
const canGenerateVoucher = computed(() => selectedItem.value && selectedItem.value.fstatus === 'AUDITED')

const isPaymentApply = computed(() => docType.value === 'AP_PAYMENT_APPLY')
const isSettlement = computed(() => docType.value === 'AR_SETTLEMENT')
const isEstimate = computed(() => docType.value.includes('ESTIMATE'))

function statusLabel(s) { return ({DRAFT:'草稿',SUBMITTED:'已提交',AUDITED:'已审核',REJECTED:'已驳回'})[s] || s }

function getRowProps({ item }) { return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {} }
function handleRowClick(_, row) { selectedItem.value = row?.item || null }

async function fetchList() {
  loading.value = true
  try {
    const res = await api.fetchList({
      docType: docType.value,
      page: 1,
      size: 500,
      number: filters.number || undefined,
      counterparty: filters.counterparty || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      minAmount: filters.minAmount ?? undefined,
      maxAmount: filters.maxAmount ?? undefined,
    })
    list.value = res.data?.records || []
  } finally { loading.value = false }
}

function resetFilters() {
  Object.assign(filters, { number: '', counterparty: '', status: '', startDate: '', endDate: '', minAmount: null, maxAmount: null })
  fetchList()
}

function openCreateDialog() {
  dialog.visible = true
  dialog.mode='create'
  Object.assign(dialog.form, {
    fid:null, fdoctype:docType.value, fnumber:'', fdate:'', fcounterparty:'', famount:null, fremark:'',
    fpayMethod:'', fplannedPayDate:'', fsettleMethod:'', fwriteoffDetail:'', fsourceBillNo:''
  })
}

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

async function generateVoucher() {
  if (!selectedItem.value?.fid) return
  try {
    await api.generateVoucher(selectedItem.value.fid)
    show('已生成凭证')
    await fetchList()
  } catch (e) {
    show(e?.response?.data?.message || e?.message || '生成凭证失败', 'error')
  }
}

function exportCsv() {
  const head = ['单据号','日期','往来方','金额','状态','关联凭证']
  const rows = list.value.map(it => [it.fnumber,it.fdate,it.fcounterparty,it.famount,statusLabel(it.fstatus),it.fvoucherNumber || ''])
  const csv = [head, ...rows].map(r => r.map(x => `"${String(x ?? '').replaceAll('"','""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${docType.value}-list.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function show(text, color='success'){ snackbar.text=text; snackbar.color=color; snackbar.show=true }

onMounted(fetchList)
</script>

<style scoped>
.page{padding:24px}.header{margin-bottom:16px}.title{font-size:22px;font-weight:bold;color:#27324c;letter-spacing:2px;margin-bottom:12px}.toolbar{display:flex;flex-wrap:wrap;align-items:center;margin-bottom:8px}.filter-row{display:flex;flex-wrap:wrap;align-items:center;margin-bottom:8px}.selected-row{background:#e8f1ff !important}
</style>
