<template>
  <div class="voucher-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">凭证</h2>
        <div class="toolbar">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新增凭证</v-btn>
          <v-btn color="primary" variant="tonal" class="ml-2" @click="openEditDialog(selectedItem)" :disabled="!canEdit">编辑</v-btn>
          <v-btn color="teal" variant="tonal" class="ml-2" @click="openLineDialog" :disabled="!canEdit">分录</v-btn>
          <v-btn color="warning" variant="tonal" class="ml-2" @click="handleSubmitSelected" :disabled="!canSubmit">提交</v-btn>
          <v-btn color="success" variant="tonal" class="ml-2" @click="handleAuditSelected" :disabled="!canAudit">审核</v-btn>
          <v-btn color="indigo" variant="tonal" class="ml-2" @click="handlePostSelected" :disabled="!canPost">过账</v-btn>
          <v-btn color="secondary" variant="tonal" class="ml-2" @click="handleRejectSelected" :disabled="!canReject">驳回</v-btn>
          <v-btn color="deep-purple" variant="tonal" class="ml-2" @click="handleReverseSelected" :disabled="!canReverse">冲销</v-btn>
          <v-btn color="error" variant="tonal" class="ml-2" @click="openDeleteDialog(selectedItem)" :disabled="!canDelete">删除</v-btn>
        </div>
        <div class="selected-tip">
          当前选中：{{ selectedItem ? `${selectedItem.fnumber || '-'}（${statusLabel(selectedItem.fstatus)}）` : '未选择，请点击表格行' }}
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="vouchers"
        :loading="loading"
        item-key="fid"
        class="elevation-0"
        hide-default-footer
        dense
        @click:row="handleRowClick"
        :row-props="getRowProps"
      >
        <template #item.fstatus="{ item }">
          {{ statusLabel(item.fstatus) }}
        </template>
        <template #item.famount="{ item }">
          {{ Number(item.famount || 0).toFixed(2) }}
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="560" persistent>
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '新增凭证' : '编辑凭证' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-text-field v-model="dialog.form.fnumber" label="凭证号（可空，后端自动生成）" />
            <v-text-field v-model="dialog.form.fdate" type="date" label="凭证日期" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model="dialog.form.fsummary" label="摘要" :rules="[v => !!v || '必填']" required />
            <v-text-field v-model.number="dialog.form.famount" type="number" label="金额" :rules="[v => Number(v) > 0 || '必须大于0']" required />
            <v-textarea v-model="dialog.form.fremark" label="备注" rows="2" auto-grow />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">取消</v-btn>
          <v-btn variant="text" color="primary" @click="handleConfirm">{{ dialog.mode === 'create' ? '创建' : '保存' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="lineDialog.visible" max-width="980" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>分录维护 - {{ selectedItem?.fnumber || '-' }}</span>
          <v-btn size="small" color="primary" variant="tonal" @click="addLine">新增行</v-btn>
        </v-card-title>
        <v-card-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th style="width:60px;">行号</th>
                <th>科目</th>
                <th>摘要</th>
                <th style="width:140px;">借方</th>
                <th style="width:140px;">贷方</th>
                <th style="width:90px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in lineDialog.lines" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td><v-text-field v-model="line.faccountCode" density="compact" hide-details variant="outlined" /></td>
                <td><v-text-field v-model="line.fsummary" density="compact" hide-details variant="outlined" /></td>
                <td><v-text-field v-model.number="line.fdebitAmount" type="number" density="compact" hide-details variant="outlined" /></td>
                <td><v-text-field v-model.number="line.fcreditAmount" type="number" density="compact" hide-details variant="outlined" /></td>
                <td><v-btn size="x-small" color="error" variant="tonal" @click="removeLine(idx)">删除</v-btn></td>
              </tr>
            </tbody>
          </v-table>
          <div class="mt-3 line-total">借方合计：{{ lineTotals.debit.toFixed(2) }} ｜ 贷方合计：{{ lineTotals.credit.toFixed(2) }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="lineDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="primary" @click="saveLines">保存分录</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="360">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除凭证 <b>{{ deleteDialog.item?.fnumber }}</b>？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="handleDelete">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import voucherApi from '@/api/voucher'

const vouchers = ref([])
const loading = ref(false)
const selectedItem = ref(null)

const headers = [
  { title: '凭证号', value: 'fnumber' },
  { title: '日期', value: 'fdate' },
  { title: '摘要', value: 'fsummary' },
  { title: '金额', value: 'famount' },
  { title: '状态', value: 'fstatus', align: 'center', width: 120 },
]

const snackbar = reactive({ show: false, text: '', color: 'info' })
const formRef = ref()
const dialog = reactive({
  visible: false,
  mode: 'create',
  valid: false,
  form: {
    fid: null,
    fnumber: '',
    fdate: '',
    fsummary: '',
    famount: null,
    fremark: ''
  }
})
const deleteDialog = reactive({ visible: false, item: null })
const lineDialog = reactive({ visible: false, lines: [] })

const lineTotals = computed(() => ({
  debit: lineDialog.lines.reduce((s, it) => s + Number(it.fdebitAmount || 0), 0),
  credit: lineDialog.lines.reduce((s, it) => s + Number(it.fcreditAmount || 0), 0)
}))

const canEdit = computed(() => selectedItem.value && ['DRAFT', 'REJECTED'].includes(selectedItem.value.fstatus))
const canSubmit = computed(() => selectedItem.value && ['DRAFT', 'REJECTED'].includes(selectedItem.value.fstatus))
const canAudit = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canPost = computed(() => selectedItem.value && selectedItem.value.fstatus === 'AUDITED')
const canReject = computed(() => selectedItem.value && selectedItem.value.fstatus === 'SUBMITTED')
const canReverse = computed(() => selectedItem.value && selectedItem.value.fstatus === 'POSTED')
const canDelete = computed(() => selectedItem.value && selectedItem.value.fstatus === 'DRAFT')

function statusLabel(status) {
  const map = {
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    AUDITED: '已审核',
    POSTED: '已过账',
    REJECTED: '已驳回',
    REVERSED: '已冲销'
  }
  return map[status] || status || '-'
}

async function fetchVouchers() {
  loading.value = true
  try {
    const res = await voucherApi.fetchList({ page: 1, size: 500 })
    vouchers.value = res.data?.records || []
  } catch (e) {
    showMsg('加载凭证失败', 'error')
  } finally {
    loading.value = false
  }
}

function handleRowClick(_, row) {
  selectedItem.value = row?.item || null
}

function getRowProps({ item }) {
  return item?.fid && selectedItem.value?.fid === item.fid ? { class: 'selected-row' } : {}
}

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, { fid: null, fnumber: '', fdate: '', fsummary: '', famount: null, fremark: '' })
}

function openEditDialog(item) {
  if (!item) return
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, {
    fid: item.fid,
    fnumber: item.fnumber || '',
    fdate: item.fdate || '',
    fsummary: item.fsummary || '',
    famount: item.famount,
    fremark: item.fremark || ''
  })
}

function closeDialog() {
  dialog.visible = false
}

async function handleConfirm() {
  const valid = await formRef.value?.validate?.()
  if (!valid) return
  try {
    if (dialog.mode === 'create') {
      await voucherApi.createItem({ ...dialog.form })
      showMsg('创建成功', 'success')
    } else {
      await voucherApi.editItem({ ...dialog.form })
      showMsg('保存成功', 'success')
    }
    closeDialog()
    await fetchVouchers()
  } catch (e) {
    showMsg(e?.message || '操作失败', 'error')
  }
}

async function openLineDialog() {
  if (!selectedItem.value?.fid) return
  try {
    const res = await voucherApi.fetchLines(selectedItem.value.fid)
    lineDialog.lines = (res.data || []).map(it => ({ ...it }))
    if (!lineDialog.lines.length) addLine()
    lineDialog.visible = true
  } catch (e) {
    showMsg(e?.message || '加载分录失败', 'error')
  }
}

function addLine() {
  lineDialog.lines.push({
    faccountCode: '',
    fsummary: selectedItem.value?.fsummary || '',
    fdebitAmount: 0,
    fcreditAmount: 0
  })
}

function removeLine(index) {
  lineDialog.lines.splice(index, 1)
}

async function saveLines() {
  if (!selectedItem.value?.fid) return
  try {
    const payload = lineDialog.lines.map((it, idx) => ({
      ...it,
      flineNo: idx + 1,
      fdebitAmount: Number(it.fdebitAmount || 0),
      fcreditAmount: Number(it.fcreditAmount || 0)
    }))
    await voucherApi.saveLines(selectedItem.value.fid, payload)
    lineDialog.visible = false
    showMsg('分录保存成功', 'success')
    await fetchVouchers()
  } catch (e) {
    showMsg(e?.message || '保存分录失败', 'error')
  }
}

function openDeleteDialog(item) {
  if (!item) return
  deleteDialog.visible = true
  deleteDialog.item = item
}

async function handleDelete() {
  if (!deleteDialog.item?.fid) return
  try {
    await voucherApi.deleteItem(deleteDialog.item.fid)
    showMsg('删除成功', 'success')
    deleteDialog.visible = false
    selectedItem.value = null
    await fetchVouchers()
  } catch (e) {
    showMsg(e?.message || '删除失败', 'error')
  }
}

async function runAction(apiFn, successMsg) {
  if (!selectedItem.value?.fid) return
  try {
    await apiFn(selectedItem.value.fid)
    showMsg(successMsg, 'success')
    await fetchVouchers()
    if (selectedItem.value?.fid) {
      selectedItem.value = vouchers.value.find(v => v.fid === selectedItem.value.fid) || null
    }
  } catch (e) {
    showMsg(e?.message || '操作失败', 'error')
  }
}

const handleSubmitSelected = () => runAction(voucherApi.submitItem, '提交成功')
const handleAuditSelected = () => runAction(voucherApi.auditItem, '审核成功')
const handlePostSelected = () => runAction(voucherApi.postItem, '过账成功')
const handleRejectSelected = () => runAction(voucherApi.rejectItem, '驳回成功')
const handleReverseSelected = () => runAction(voucherApi.reverseItem, '冲销成功')

function showMsg(text, color = 'info') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(fetchVouchers)
</script>

<style scoped>
.voucher-page { padding: 24px; }
.header { margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; margin-bottom: 12px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0; margin-bottom: 8px; }
.selected-tip { font-size: 13px; color: #5f6b84; }
.line-total { font-size: 13px; color: #334155; font-weight: 600; }
:deep(.selected-row) { background: #e8f1ff !important; }
</style>
