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
          <v-btn color="teal" variant="tonal" class="ml-2" @click="triggerImport" :loading="importing">导入</v-btn>
          <v-btn color="deep-purple" variant="tonal" class="ml-2" @click="triggerOcrImport" :loading="ocrParsing">OCR导入</v-btn>
          <v-btn color="info" variant="tonal" class="ml-2" @click="printSelected" :disabled="!selectedItem">打印</v-btn>
          <input ref="importInputRef" type="file" accept=".csv,text/csv" style="display:none" @change="handleImportFile" />
          <input ref="ocrInputRef" type="file" accept="image/*,.pdf,application/pdf" style="display:none" @change="handleOcrFile" />
        </div>
        <div class="selected-tip">
          当前选中：{{ selectedItem ? `${selectedItem.fnumber || '-'}（${statusLabel(selectedItem.fstatus)}）` : '未选择，请点击表格行' }}
        </div>
        <div class="filters">
          <v-text-field v-model="filters.number" label="凭证号" density="compact" variant="outlined" hide-details class="mr-2" />
          <v-text-field v-model="filters.summary" label="摘要" density="compact" variant="outlined" hide-details class="mr-2" />
          <v-select v-model="filters.status" :items="statusOptions" label="状态" density="compact" variant="outlined" hide-details class="mr-2" style="max-width: 160px;" />
          <v-text-field v-model="filters.startDate" type="date" label="开始日期" density="compact" variant="outlined" hide-details class="mr-2" style="max-width: 180px;" />
          <v-text-field v-model="filters.endDate" type="date" label="结束日期" density="compact" variant="outlined" hide-details class="mr-2" style="max-width: 180px;" />
          <v-btn color="primary" variant="tonal" class="mr-2" @click="handleSearch">查询</v-btn>
          <v-btn variant="tonal" @click="handleReset">重置</v-btn>
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
        <template #item.fnumber="{ item }">
          <v-btn size="small" variant="text" color="primary" @click.stop="openEditDialog(item)">{{ item.fnumber }}</v-btn>
        </template>
        <template #item.fstatus="{ item }">
          {{ statusLabel(item.fstatus) }}
        </template>
        <template #item.famount="{ item }">
          {{ Number(item.famount || 0).toFixed(2) }}
        </template>
        <template #item.flink="{ item }">
          <v-btn v-if="linkLabel(item) !== '-'" size="x-small" color="indigo" variant="text" @click.stop="goLinked(item)">{{ linkLabel(item) }}</v-btn>
          <span v-else class="link-text">-</span>
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

    <v-dialog v-model="ocrDialog.visible" max-width="760" persistent>
      <v-card>
        <v-card-title>OCR导入预览</v-card-title>
        <v-card-text>
          <v-text-field v-model="ocrDialog.form.fdate" type="date" label="凭证日期" />
          <v-text-field v-model="ocrDialog.form.fsummary" label="摘要" />
          <v-text-field v-model.number="ocrDialog.form.famount" type="number" label="金额" />
          <v-textarea v-model="ocrDialog.rawText" label="OCR原文（可核对）" rows="6" auto-grow />
          <v-table density="compact" class="mt-3">
            <thead>
              <tr>
                <th>科目</th><th>摘要</th><th>借方</th><th>贷方</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in ocrDialog.lines" :key="idx">
                <td><v-text-field v-model="line.faccountCode" density="compact" hide-details variant="outlined" /></td>
                <td><v-text-field v-model="line.fsummary" density="compact" hide-details variant="outlined" /></td>
                <td><v-text-field v-model.number="line.fdebitAmount" type="number" density="compact" hide-details variant="outlined" /></td>
                <td><v-text-field v-model.number="line.fcreditAmount" type="number" density="compact" hide-details variant="outlined" /></td>
                <td><v-btn size="x-small" color="error" variant="tonal" @click="ocrDialog.lines.splice(idx,1)">删</v-btn></td>
              </tr>
            </tbody>
          </v-table>
          <v-btn size="small" class="mt-2" variant="tonal" @click="addOcrLine">新增分录</v-btn>
          <div class="text-caption text-medium-emphasis mt-1">借方合计：{{ ocrTotals.debit.toFixed(2) }} ｜ 贷方合计：{{ ocrTotals.credit.toFixed(2) }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="ocrDialog.visible=false">取消</v-btn>
          <v-btn color="primary" variant="text" @click="confirmOcrImport">确认导入</v-btn>
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
import { useRoute } from 'vue-router'
import voucherApi from '@/api/voucher'

const route = useRoute()
const vouchers = ref([])
const loading = ref(false)
const importing = ref(false)
const ocrParsing = ref(false)
const selectedItem = ref(null)
const importInputRef = ref()
const ocrInputRef = ref()

const headers = [
  { title: '凭证号', value: 'fnumber' },
  { title: '日期', value: 'fdate' },
  { title: '摘要', value: 'fsummary' },
  { title: '金额', value: 'famount' },
  { title: '状态', value: 'fstatus', align: 'center', width: 120 },
  { title: '关联', value: 'flink', align: 'center', width: 220 },
]

const snackbar = reactive({ show: false, text: '', color: 'info' })
const formRef = ref()
const filters = reactive({
  number: '',
  summary: '',
  status: '',
  startDate: '',
  endDate: ''
})
const statusOptions = [
  { title: '全部', value: '' },
  { title: '草稿', value: 'DRAFT' },
  { title: '已提交', value: 'SUBMITTED' },
  { title: '已审核', value: 'AUDITED' },
  { title: '已过账', value: 'POSTED' },
  { title: '已驳回', value: 'REJECTED' },
  { title: '已冲销', value: 'REVERSED' }
]
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
const ocrDialog = reactive({
  visible: false,
  rawText: '',
  lines: [],
  form: {
    fdate: '',
    fsummary: '',
    famount: 1
  }
})

const lineTotals = computed(() => ({
  debit: lineDialog.lines.reduce((s, it) => s + Number(it.fdebitAmount || 0), 0),
  credit: lineDialog.lines.reduce((s, it) => s + Number(it.fcreditAmount || 0), 0)
}))

const ocrTotals = computed(() => ({
  debit: ocrDialog.lines.reduce((s, it) => s + Number(it.fdebitAmount || 0), 0),
  credit: ocrDialog.lines.reduce((s, it) => s + Number(it.fcreditAmount || 0), 0)
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

function linkLabel(item) {
  const remark = item?.fremark || ''
  if (item?.fstatus === 'REVERSED') {
    const m = remark.match(/已冲销到凭证:([^；\s]+)/)
    return m ? `冲销至 ${m[1]}` : '已冲销'
  }
  if ((item?.fsummary || '').startsWith('冲销:')) {
    const m = remark.match(/冲销原凭证ID=([0-9]+)/)
    return m ? `冲销自ID ${m[1]}` : '冲销凭证'
  }
  return '-'
}

function handleSearch() {
  fetchVouchers()
}

function handleReset() {
  filters.number = ''
  filters.summary = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  fetchVouchers()
}

function goLinked(item) {
  if (!item) return
  const remark = item.fremark || ''
  if (item.fstatus === 'REVERSED') {
    const m = remark.match(/已冲销到凭证:([^；\s]+)/)
    if (!m) return showMsg('未找到关联凭证号', 'warning')
    const target = vouchers.value.find(v => v.fnumber === m[1])
    if (!target) return showMsg(`未在当前列表找到 ${m[1]}`, 'warning')
    selectedItem.value = target
    return
  }
  if ((item.fsummary || '').startsWith('冲销:')) {
    const m = remark.match(/冲销原凭证ID=([0-9]+)/)
    if (!m) return showMsg('未找到原凭证ID', 'warning')
    const target = vouchers.value.find(v => String(v.fid) === String(m[1]))
    if (!target) return showMsg(`未在当前列表找到 ID=${m[1]}`, 'warning')
    selectedItem.value = target
  }
}

async function fetchVouchers(extraQuery = {}) {
  loading.value = true
  try {
    const res = await voucherApi.fetchList({
      page: 1,
      size: 500,
      number: filters.number || undefined,
      summary: filters.summary || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      ...extraQuery
    })
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
    showMsg(getErrMsg(e, '操作失败'), 'error')
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
    showMsg(getErrMsg(e, '加载分录失败'), 'error')
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
    showMsg(getErrMsg(e, '保存分录失败'), 'error')
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
    showMsg(getErrMsg(e, '删除失败'), 'error')
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
    showMsg(getErrMsg(e, '操作失败'), 'error')
  }
}

const handleSubmitSelected = () => runAction(voucherApi.submitItem, '提交成功')
const handleAuditSelected = () => runAction(voucherApi.auditItem, '审核成功')
const handlePostSelected = () => runAction(voucherApi.postItem, '过账成功')
const handleRejectSelected = () => runAction(voucherApi.rejectItem, '驳回成功')
const handleReverseSelected = () => runAction(voucherApi.reverseItem, '冲销成功')

function triggerImport() {
  importInputRef.value?.click()
}

function parseCsvRow(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result.map(v => (v || '').trim())
}

async function handleImportFile(event) {
  const file = event?.target?.files?.[0]
  if (!file) return
  try {
    importing.value = true
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) throw new Error('导入文件为空')

    // 模板：凭证号,日期,摘要,金额,备注
    const rows = lines.slice(1).map(parseCsvRow)
    let ok = 0
    let fail = 0

    for (const row of rows) {
      const [fnumber, fdate, fsummary, famount, fremark] = row
      if (!fdate || !fsummary || !famount) {
        fail++
        continue
      }
      try {
        await voucherApi.createItem({
          fnumber: fnumber || undefined,
          fdate,
          fsummary,
          famount: Number(famount),
          fremark: fremark || ''
        })
        ok++
      } catch (_) {
        fail++
      }
    }
    showMsg(`导入完成：成功 ${ok} 条，失败 ${fail} 条`, fail ? 'warning' : 'success')
    await fetchVouchers()
  } catch (e) {
    showMsg(getErrMsg(e, '导入失败'), 'error')
  } finally {
    importing.value = false
    if (event?.target) event.target.value = ''
  }
}

function triggerOcrImport() {
  ocrInputRef.value?.click()
}

async function handleOcrFile(event) {
  const file = event?.target?.files?.[0]
  if (!file) return
  try {
    ocrParsing.value = true
    const res = await voucherApi.ocrParse(file)
    const data = res.data || {}
    const voucher = data.voucher || {}
    ocrDialog.rawText = data.rawText || ''
    ocrDialog.form.fdate = voucher.fdate || new Date().toISOString().slice(0, 10)
    ocrDialog.form.fsummary = voucher.fsummary || 'OCR导入凭证'
    ocrDialog.form.famount = Number(voucher.famount || 1)
    ocrDialog.lines = (data.lines || []).map(it => ({
      faccountCode: it.faccountCode || '',
      fsummary: it.fsummary || ocrDialog.form.fsummary,
      fdebitAmount: Number(it.fdebitAmount || 0),
      fcreditAmount: Number(it.fcreditAmount || 0)
    }))
    if (!ocrDialog.lines.length) addOcrLine()
    ocrDialog.visible = true
    showMsg(data.warning || 'OCR解析完成，请核对后导入', 'info')
  } catch (e) {
    showMsg(getErrMsg(e, 'OCR解析失败'), 'error')
  } finally {
    ocrParsing.value = false
    if (event?.target) event.target.value = ''
  }
}

function addOcrLine() {
  ocrDialog.lines.push({
    faccountCode: '',
    fsummary: ocrDialog.form.fsummary || 'OCR导入凭证',
    fdebitAmount: 0,
    fcreditAmount: 0
  })
}

async function confirmOcrImport() {
  try {
    if (!ocrDialog.lines.length) {
      showMsg('请至少保留一条分录', 'warning')
      return
    }
    if (Number(ocrTotals.debit.toFixed(2)) !== Number(ocrTotals.credit.toFixed(2))) {
      showMsg('借贷不平衡，请先调整分录', 'warning')
      return
    }
    await voucherApi.ocrConfirm({
      voucher: {
        fdate: ocrDialog.form.fdate,
        fsummary: ocrDialog.form.fsummary,
        famount: Number(ocrDialog.form.famount || 1),
        fremark: 'OCR导入'
      },
      lines: ocrDialog.lines.map((it, idx) => ({
        flineNo: idx + 1,
        faccountCode: it.faccountCode,
        fsummary: it.fsummary,
        fdebitAmount: Number(it.fdebitAmount || 0),
        fcreditAmount: Number(it.fcreditAmount || 0)
      }))
    })
    ocrDialog.visible = false
    showMsg('OCR导入成功（凭证+分录）', 'success')
    await fetchVouchers()
  } catch (e) {
    showMsg(getErrMsg(e, 'OCR导入失败'), 'error')
  }
}

async function printSelected() {
  if (!selectedItem.value?.fid) return
  try {
    const res = await voucherApi.fetchLines(selectedItem.value.fid)
    const lines = res.data || []
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>凭证打印</title>
      <style>body{font-family:Arial;padding:24px;}h2{margin:0 0 12px 0;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;font-size:12px;}th{text-align:left;background:#f5f5f5;} .meta{margin:8px 0 16px;color:#333;} .right{text-align:right;}</style>
      </head><body>
      <h2>凭证打印</h2>
      <div class="meta">凭证号：${selectedItem.value.fnumber || '-'} ｜ 日期：${selectedItem.value.fdate || '-'} ｜ 状态：${statusLabel(selectedItem.value.fstatus)}</div>
      <div class="meta">摘要：${selectedItem.value.fsummary || '-'}</div>
      <table><thead><tr><th>行号</th><th>科目</th><th>摘要</th><th>借方</th><th>贷方</th></tr></thead><tbody>
      ${lines.map((it, idx) => `<tr><td>${idx + 1}</td><td>${it.faccountCode || ''}</td><td>${it.fsummary || ''}</td><td class="right">${Number(it.fdebitAmount || 0).toFixed(2)}</td><td class="right">${Number(it.fcreditAmount || 0).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      </body></html>`
    const w = window.open('', '_blank')
    if (!w) return showMsg('浏览器拦截了打印窗口', 'warning')
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  } catch (e) {
    showMsg(getErrMsg(e, '打印准备失败'), 'error')
  }
}

function getErrMsg(err, fallback = '操作失败') {
  return err?.response?.data?.message || err?.response?.data?.msg || err?.message || fallback
}

function showMsg(text, color = 'info') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(() => {
  if (route.query?.number) filters.number = String(route.query.number)
  if (route.query?.summary) filters.summary = String(route.query.summary)
  if (route.query?.status) filters.status = String(route.query.status)
  if (route.query?.startDate) filters.startDate = String(route.query.startDate)
  if (route.query?.endDate) filters.endDate = String(route.query.endDate)
  fetchVouchers()
})
</script>

<style scoped>
.voucher-page { padding: 24px; }
.header { margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; margin-bottom: 12px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0; margin-bottom: 8px; }
.selected-tip { font-size: 13px; color: #5f6b84; margin-bottom: 8px; }
.filters { display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
.line-total { font-size: 13px; color: #334155; font-weight: 600; }
.link-text { font-size: 12px; color: #4f46e5; }
:deep(.selected-row) { background: #e8f1ff !important; }
</style>
