<template>
  <div class="arap-page">
    <section class="arap-hero">
      <div class="hero-copy">
        <span class="section-kicker">{{ moduleEyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ pageDescription }}</p>
        <div class="hero-actions">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">创建单据</v-btn>
          <v-btn class="hero-secondary" color="white" variant="outlined" prepend-icon="mdi-export-variant" @click="exportExcel">导出清单</v-btn>
        </div>
      </div>
      <div class="summary-grid">
        <div v-for="card in summaryCards" :key="card.label" class="summary-card" :class="card.tone">
          <v-icon :icon="card.icon" size="20" />
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.hint }}</small>
        </div>
      </div>
    </section>

    <section class="work-layout">
      <section class="work-panel">
        <div class="panel-heading">
          <div>
            <span class="section-kicker">DOCUMENT FLOW</span>
            <h2>单据处理</h2>
          </div>
          <div class="toolbar">
            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-pencil-outline" @click="openEditDialog(selectedItem)" :disabled="!canEdit">编辑</v-btn>
            <v-btn color="warning" variant="tonal" size="small" prepend-icon="mdi-send-outline" @click="submitDoc" :disabled="!canSubmit">提交</v-btn>
            <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-check-decagram-outline" @click="auditDoc" :disabled="!canAudit">审核</v-btn>
            <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-undo-variant" @click="rejectDoc" :disabled="!canReject">驳回</v-btn>
            <v-btn color="deep-purple" variant="tonal" size="small" prepend-icon="mdi-file-document-check-outline" @click="generateVoucher" :disabled="!canGenerateVoucher">生成凭证</v-btn>
            <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-delete-outline" @click="openDeleteDialog(selectedItem)" :disabled="!canDelete">删除</v-btn>
          </div>
        </div>

        <div class="filter-panel">
          <div class="filter-title">
            <span class="section-kicker">FILTER</span>
            <strong>筛选条件</strong>
          </div>
          <div class="filter-grid">
            <v-text-field v-model="filters.number" label="单据号" density="compact" variant="solo-filled" flat hide-details prepend-inner-icon="mdi-magnify" />
            <v-text-field v-model="filters.counterparty" label="往来方" density="compact" variant="solo-filled" flat hide-details prepend-inner-icon="mdi-domain" />
            <v-select v-model="filters.status" :items="statusOptions" item-title="title" item-value="value" label="状态" density="compact" variant="solo-filled" flat hide-details />
            <v-text-field v-model="filters.startDate" type="date" label="开始日期" density="compact" variant="solo-filled" flat hide-details />
            <v-text-field v-model="filters.endDate" type="date" label="结束日期" density="compact" variant="solo-filled" flat hide-details />
            <v-text-field v-model.number="filters.minAmount" type="number" label="最小金额" density="compact" variant="solo-filled" flat hide-details />
            <v-text-field v-model.number="filters.maxAmount" type="number" label="最大金额" density="compact" variant="solo-filled" flat hide-details />
            <div class="filter-actions">
              <v-btn color="primary" prepend-icon="mdi-tune-variant" @click="fetchList">查询</v-btn>
              <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="resetFilters">重置</v-btn>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <v-data-table
            :headers="headers"
            :items="list"
            :loading="loading"
            item-key="fid"
            hide-default-footer
            density="comfortable"
            class="arap-table"
            @click:row="handleRowClick"
            :row-props="getRowProps"
          >
            <template #item.fnumber="{ item }">
              <v-btn size="small" variant="text" color="primary" class="doc-link" @click.stop="openEditDialog(item)">{{ item.fnumber }}</v-btn>
            </template>
            <template #item.famount="{ item }">
              <span class="amount-text">{{ currencyFormat(item.famount) }}</span>
            </template>
            <template #item.fstatus="{ item }">
              <v-chip size="small" :color="statusTone(item.fstatus)" variant="tonal">{{ statusLabel(item.fstatus) }}</v-chip>
            </template>
            <template #item.fvoucherNumber="{ item }">
              <v-btn v-if="item.fvoucherNumber" size="small" variant="text" color="indigo" class="doc-link" @click.stop="goVoucher(item)">{{ item.fvoucherNumber }}</v-btn>
              <span v-else class="muted-text">待生成</span>
            </template>
            <template #no-data>
              <div class="empty-table">
                <v-icon icon="mdi-file-search-outline" size="34" />
                <strong>暂无符合条件的单据</strong>
                <span>调整筛选条件，或创建一张新的{{ title }}单据。</span>
              </div>
            </template>
          </v-data-table>
        </div>
      </section>

      <aside class="detail-panel">
        <div class="panel-heading detail-heading">
          <div>
            <span class="section-kicker">DETAIL</span>
            <h2>单据详情</h2>
          </div>
          <v-chip v-if="selectedItem" size="small" :color="statusTone(selectedItem.fstatus)" variant="tonal">{{ statusLabel(selectedItem.fstatus) }}</v-chip>
        </div>

        <div v-if="!selectedItem" class="empty-detail">
          <v-icon icon="mdi-cursor-default-click-outline" size="36" />
          <strong>选择一张单据</strong>
          <span>右侧会展示金额、往来方、凭证关联与可执行动作。</span>
        </div>
        <template v-else>
          <div class="detail-identity">
            <span>当前单据</span>
            <strong>{{ selectedItem.fnumber }}</strong>
            <small>{{ selectedItem.fdate || '未填写日期' }}</small>
          </div>
          <dl class="detail-list">
            <div>
              <dt>往来方</dt>
              <dd>{{ selectedItem.fcounterparty || '-' }}</dd>
            </div>
            <div>
              <dt>金额</dt>
              <dd class="amount-text">{{ currencyFormat(selectedItem.famount) }}</dd>
            </div>
            <div>
              <dt>关联凭证</dt>
              <dd>
                <button v-if="selectedItem.fvoucherNumber" class="voucher-text" type="button" @click="goVoucher(selectedItem)">{{ selectedItem.fvoucherNumber }}</button>
                <span v-else class="muted-text">未生成</span>
              </dd>
            </div>
            <div>
              <dt>备注</dt>
              <dd>{{ selectedItem.fremark || '暂无备注' }}</dd>
            </div>
          </dl>
          <div class="detail-actions">
            <v-btn
              v-for="action in selectedActionItems"
              :key="action.label"
              :color="action.color"
              :disabled="action.disabled"
              variant="tonal"
              block
              :prepend-icon="action.icon"
              @click="action.handler()"
            >
              {{ action.label }}
            </v-btn>
          </div>
        </template>
      </aside>
    </section>

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

    <v-dialog v-model="riskDialog.visible" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-h6">风险预警</v-card-title>
        <v-card-text>
          <div class="mb-2">往来方：<b>{{ riskDialog.counterparty }}</b></div>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-2">检测到信用风险，请确认是否继续。</v-alert>
          <v-list density="compact" class="risk-list">
            <v-list-item v-for="(tip, idx) in riskDialog.tips" :key="idx" :title="tip" />
          </v-list>
          <div class="mt-2" v-if="riskDialog.suggestions.length">
            <div class="text-subtitle-2 mb-1">建议动作</div>
            <v-chip v-for="(s, idx) in riskDialog.suggestions" :key="idx" size="small" color="indigo" variant="tonal" class="mr-1 mb-1">{{ s }}</v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resolveRisk(false)">取消</v-btn>
          <v-btn color="warning" variant="tonal" @click="resolveRisk(true)">继续操作</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/arap-doc'
import { exportRowsToXlsx } from '@/utils/excelExport'

const route = useRoute()
const router = useRouter()
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
const riskDialog = reactive({ visible: false, counterparty: '', tips: [], suggestions: [], resolver: null })
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
const docTypeRoot = computed(() => getDocTypeRoot())
const moduleEyebrow = computed(() => {
  const root = docTypeRoot.value === 'AP' ? 'ACCOUNTS PAYABLE' : 'ACCOUNTS RECEIVABLE'
  return `${root} / ${docType.value}`
})
const pageDescription = computed(() => {
  if (docType.value === 'AP_PAYMENT_APPLY') return '付款申请、供应商账款与付款计划在这里集中处理。'
  if (docType.value === 'AR_SETTLEMENT') return '客户收款、结算核销与凭证关联在这里完成闭环。'
  if (docType.value.includes('ESTIMATE')) return '暂估单据用于承接未达票据和期间成本，应关注后续冲回与差异处理。'
  if (docTypeRoot.value === 'AP') return '供应商发票、采购确认与应付凭证在这里统一流转。'
  return '客户账款、收入确认与应收凭证在这里统一流转。'
})
const amountTotal = computed(() => list.value.reduce((sum, item) => sum + Number(item.famount || 0), 0))
const auditedCount = computed(() => list.value.filter(item => item.fstatus === 'AUDITED').length)
const voucherCount = computed(() => list.value.filter(item => item.fvoucherNumber).length)
const summaryCards = computed(() => [
  { label: '单据数量', value: list.value.length, hint: '当前筛选范围', icon: 'mdi-file-document-multiple-outline', tone: 'tone-teal' },
  { label: '已审核', value: auditedCount.value, hint: '可生成或已生成凭证', icon: 'mdi-check-decagram-outline', tone: 'tone-green' },
  { label: '已关联凭证', value: voucherCount.value, hint: '总账已接收', icon: 'mdi-link-variant', tone: 'tone-blue' },
  { label: '金额合计', value: currencyFormat(amountTotal.value), hint: '按列表汇总', icon: 'mdi-cash-multiple', tone: 'tone-amber' },
])
const selectedActionItems = computed(() => [
  { label: '编辑单据', icon: 'mdi-pencil-outline', color: 'primary', disabled: !canEdit.value, handler: () => openEditDialog(selectedItem.value) },
  { label: '提交审核', icon: 'mdi-send-outline', color: 'warning', disabled: !canSubmit.value, handler: submitDoc },
  { label: '审核通过', icon: 'mdi-check-decagram-outline', color: 'success', disabled: !canAudit.value, handler: auditDoc },
  { label: '驳回单据', icon: 'mdi-undo-variant', color: 'secondary', disabled: !canReject.value, handler: rejectDoc },
  { label: '生成凭证', icon: 'mdi-file-document-check-outline', color: 'deep-purple', disabled: !canGenerateVoucher.value, handler: generateVoucher },
  { label: '删除草稿', icon: 'mdi-delete-outline', color: 'error', disabled: !canDelete.value, handler: () => openDeleteDialog(selectedItem.value) },
])

function statusLabel(s) { return ({DRAFT:'草稿',SUBMITTED:'已提交',AUDITED:'已审核',REJECTED:'已驳回'})[s] || s }
function statusTone(s) { return ({DRAFT:'grey',SUBMITTED:'warning',AUDITED:'success',REJECTED:'error'})[s] || 'grey' }
function currencyFormat(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)
}

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
    if (selectedItem.value && !list.value.some(item => item.fid === selectedItem.value.fid)) selectedItem.value = null
  } catch (e) {
    list.value = []
    selectedItem.value = null
    show(e?.response?.data?.message || e?.message || '单据列表加载失败', 'error')
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

function getDocTypeRoot() {
  return String(docType.value || '').startsWith('AP') ? 'AP' : 'AR'
}

function askRiskConfirm(counterparty, tips = [], suggestions = []) {
  return new Promise((resolve) => {
    riskDialog.counterparty = counterparty || ''
    riskDialog.tips = tips
    riskDialog.suggestions = suggestions
    riskDialog.visible = true
    riskDialog.resolver = resolve
  })
}

function resolveRisk(pass) {
  riskDialog.visible = false
  if (typeof riskDialog.resolver === 'function') {
    riskDialog.resolver(!!pass)
  }
  riskDialog.resolver = null
  riskDialog.suggestions = []
}

async function confirmRiskIfNeeded() {
  const item = selectedItem.value
  if (!item?.fcounterparty) return true
  try {
    const res = await api.getCreditWarnings({
      docTypeRoot: getDocTypeRoot(),
      asOfDate: item.fdate || new Date().toISOString().slice(0, 10),
    })
    const warnings = res.data || []
    const hit = warnings.find(w => w.counterparty === item.fcounterparty)
    if (!hit) return true

    const tips = []
    const suggestions = []
    if (hit.overLimit) {
      tips.push(`超额度：未结 ${hit.totalOutstanding} > 额度 ${hit.creditLimit}${hit.blockOnOverLimit ? '（硬拦截）' : ''}`)
      suggestions.push('先收款/降额后再提交')
    }
    if (hit.overdue) {
      tips.push(`超逾期：最大逾期 ${hit.maxOverdueDays} 天 > 阈值 ${hit.overdueDaysThreshold} 天${hit.blockOnOverdue ? '（硬拦截）' : ''}`)
      suggestions.push('走特批流程或先处理逾期')
    }
    return await askRiskConfirm(item.fcounterparty, tips, suggestions)
  } catch (e) {
    show('风险预警检查失败，已放行操作', 'warning')
    return true
  }
}

async function runActionByNumber(fn, msg, withRiskCheck = false) {
  if (!selectedItem.value?.fnumber) return
  if (withRiskCheck) {
    const pass = await confirmRiskIfNeeded()
    if (!pass) return
  }
  try { await fn(selectedItem.value.fnumber); show(msg); await fetchList(); selectedItem.value = null } catch (e) { show(e?.response?.data?.message || e?.message || '操作失败','error') }
}

function submitDoc() { return runActionByNumber(api.submitByNumber, '提交成功', true) }
function auditDoc() { return runActionByNumber(api.auditByNumber, '审核成功', true) }
function rejectDoc() { return runActionByNumber(api.rejectByNumber, '驳回成功') }

async function generateVoucher() {
  if (!selectedItem.value?.fnumber) return
  try {
    await api.generateVoucherByNumber(selectedItem.value.fnumber)
    show('已生成凭证')
    await fetchList()
  } catch (e) {
    show(e?.response?.data?.message || e?.message || '生成凭证失败', 'error')
  }
}

function goVoucher(item) {
  if (!item?.fvoucherNumber) return
  const url = router.resolve({
    path: '/ledger/voucher',
    query: { number: item.fvoucherNumber }
  }).href
  window.open(url, '_blank')
}

function exportExcel() {
  const head = ['单据号','日期','往来方','金额','状态','关联凭证']
  const rows = list.value.map(it => [it.fnumber,it.fdate,it.fcounterparty,it.famount,statusLabel(it.fstatus),it.fvoucherNumber || ''])
  exportRowsToXlsx({
    filename: `${docType.value}-list.xlsx`,
    sheetName: title.value || '单据清单',
    headers: head,
    rows,
  })
}

function show(text, color='success'){ snackbar.text=text; snackbar.color=color; snackbar.show=true }

onMounted(fetchList)
</script>

<style scoped>
.arap-page {
  min-height: calc(100vh - 16px);
  padding: 22px;
  background:
    linear-gradient(140deg, rgba(13, 148, 136, 0.08), rgba(241, 245, 249, 0.36) 42%, rgba(245, 158, 11, 0.08)),
    #f6faf9;
  color: #142033;
}

.arap-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(440px, 0.75fr);
  gap: 22px;
  min-height: 214px;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 8px;
  background:
    linear-gradient(120deg, rgba(7, 89, 81, 0.94), rgba(15, 145, 123, 0.88) 54%, rgba(31, 51, 66, 0.92)),
    #0f766e;
  box-shadow: 0 18px 40px rgba(15, 44, 42, 0.16);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  color: #fff;
}

.hero-copy h1 {
  margin: 8px 0 10px;
  font-size: 34px;
  line-height: 1.16;
  font-weight: 800;
}

.hero-copy p {
  max-width: 720px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  color: #d9a832;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  gap: 2px 10px;
  align-content: center;
  min-height: 84px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(9, 44, 45, 0.36);
  color: rgba(255, 255, 255, 0.82);
}

.summary-card .v-icon {
  grid-row: 1 / 4;
  align-self: center;
  justify-self: center;
}

.summary-card span {
  font-size: 12px;
}

.summary-card strong {
  color: #fff;
  font-size: 24px;
  line-height: 1.2;
}

.summary-card small {
  color: rgba(255, 255, 255, 0.66);
}

.tone-teal .v-icon { color: #99f6e4; }
.tone-green .v-icon { color: #bbf7d0; }
.tone-blue .v-icon { color: #bfdbfe; }
.tone-amber .v-icon { color: #fde68a; }

.work-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  margin-top: 18px;
}

.work-panel,
.detail-panel {
  border: 1px solid rgba(201, 213, 225, 0.72);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 34px rgba(31, 41, 55, 0.08);
}

.work-panel {
  min-width: 0;
  padding: 18px;
}

.detail-panel {
  align-self: start;
  padding: 18px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-heading h2 {
  margin: 4px 0 0;
  color: #172033;
  font-size: 20px;
  line-height: 1.25;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.filter-panel {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 16px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid #dbe7e5;
  border-radius: 8px;
  background: linear-gradient(180deg, #f8fcfb, #eef7f5);
}

.filter-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.filter-title strong {
  color: #172033;
  font-size: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(135px, 1fr));
  gap: 10px;
  align-items: center;
}

.filter-actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  gap: 8px;
}

.filter-actions .v-btn {
  min-width: 88px;
}

.table-wrap {
  overflow: hidden;
  border: 1px solid #dfe8ee;
  border-radius: 8px;
  background: #fff;
}

.arap-table {
  background: transparent;
}

:deep(.arap-table thead th) {
  color: #445066 !important;
  font-weight: 700 !important;
  background: #f7faf9;
}

:deep(.arap-table table) {
  min-width: 820px;
}

:deep(.arap-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

:deep(.arap-table tbody tr:hover) {
  background: #f1f8f6;
}

:deep(.selected-row) {
  background: #e3f5f1 !important;
  box-shadow: inset 3px 0 0 #0f9f8f;
}

.doc-link {
  font-weight: 700;
}

.amount-text {
  color: #183c39;
  font-weight: 800;
}

.muted-text {
  color: #8b97a8;
}

.empty-table {
  display: flex;
  position: sticky;
  left: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(100%, 680px);
  min-height: 180px;
  margin: 0 auto;
  gap: 8px;
  color: #758195;
}

.empty-table strong {
  color: #253149;
}

.detail-heading {
  align-items: center;
}

.empty-detail {
  display: flex;
  min-height: 250px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  border-radius: 8px;
  background: #f6faf9;
  color: #7b8798;
  text-align: center;
}

.empty-detail strong {
  color: #243149;
}

.detail-identity {
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f766e, #1f3a44);
  color: #fff;
}

.detail-identity span,
.detail-identity small {
  display: block;
  color: rgba(255, 255, 255, 0.72);
}

.detail-identity strong {
  display: block;
  margin: 8px 0 2px;
  overflow-wrap: anywhere;
  font-size: 18px;
}

.detail-list {
  display: grid;
  gap: 10px;
  margin: 16px 0;
}

.detail-list div {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e7eef2;
}

.detail-list dt {
  color: #7a8798;
  font-size: 12px;
}

.detail-list dd {
  min-width: 0;
  margin: 0;
  color: #1f2937;
  overflow-wrap: anywhere;
}

.voucher-text {
  border: 0;
  padding: 0;
  background: transparent;
  color: #4f63d8;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.detail-actions {
  display: grid;
  gap: 8px;
}

.risk-list {
  max-height: 220px;
  overflow: auto;
}

@media (max-width: 1280px) {
  .arap-hero,
  .work-layout {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .filter-grid {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }
}

@media (max-width: 760px) {
  .arap-page {
    padding: 14px;
  }

  .arap-hero {
    padding: 20px;
  }

  .hero-copy h1 {
    font-size: 26px;
  }

  .summary-grid,
  .filter-panel,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    grid-column: auto;
    justify-content: stretch;
  }

  .filter-actions .v-btn {
    flex: 1;
  }

  .panel-heading {
    flex-direction: column;
  }

  .toolbar {
    justify-content: flex-start;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .empty-table {
    width: calc(100vw - 92px);
    margin: 0;
  }
}
</style>
