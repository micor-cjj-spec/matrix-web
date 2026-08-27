<template>
  <main class="p2p-workbench">
    <header class="workbench-header">
      <div class="title-block">
        <button class="back-button" type="button" @click="router.push('/finance')">
          <ArrowLeft />
        </button>
        <div>
          <span class="eyebrow">PROCURE TO PAY · P0 E2E</span>
          <h1>采购到付款工作台</h1>
          <p>供应商 → 采购订单 → 收货 → 验收 → 入库 → 发票 → 应付 → 付款申请 → 付款单 → 银行流水 → 核销 → 凭证</p>
        </div>
      </div>

      <div class="context-controls">
        <label>
          <span>Tenant</span>
          <input v-model.trim="context.tenantId" placeholder="tenantId" @change="saveContext" />
        </label>
        <label>
          <span>Org</span>
          <input v-model.trim="context.orgId" inputmode="numeric" placeholder="全部组织" @change="saveContext" />
        </label>
        <button type="button" class="primary" :disabled="loading" @click="refresh">
          <Refresh :class="{ spin: loading }" />
          刷新
        </button>
      </div>
    </header>

    <section class="stage-strip" aria-label="P2P阶段">
      <button type="button" class="supplier-shortcut" @click="router.push('/supplier')">
        <Connection />
        <span>
          <small>主数据</small>
          <strong>供应商</strong>
        </span>
      </button>
      <button
        v-for="stage in stages"
        :key="stage.key"
        type="button"
        :class="{ active: stageKey === stage.key }"
        @click="selectStage(stage.key)"
      >
        <span class="stage-index">{{ stage.index }}</span>
        <span class="stage-copy">
          <small>{{ stage.english }}</small>
          <strong>{{ stage.label }}</strong>
        </span>
      </button>
    </section>

    <section class="metric-grid">
      <article>
        <span>当前阶段</span>
        <strong>{{ currentStage.label }}</strong>
        <small>{{ currentStage.description }}</small>
      </article>
      <article>
        <span>当前记录</span>
        <strong>{{ filteredRows.length }}</strong>
        <small>本次查询返回</small>
      </article>
      <article>
        <span>待处理</span>
        <strong>{{ pendingCount }}</strong>
        <small>草稿 / 提交 / 未匹配</small>
      </article>
      <article>
        <span>金额合计</span>
        <strong>{{ money(totalAmount) }}</strong>
        <small>按当前阶段可识别金额统计</small>
      </article>
    </section>

    <section class="workspace-grid">
      <section class="list-panel">
        <header class="panel-header">
          <div>
            <span>{{ currentStage.english }}</span>
            <h2>{{ currentStage.label }}</h2>
          </div>
          <div class="panel-actions">
            <button type="button" v-if="stageKey === 'purchase-order'" @click="openPurchaseOrderDialog">
              <Plus /> 新建采购订单
            </button>
            <button type="button" v-if="stageKey === 'bank-transaction'" @click="openBankDialog()">
              <Plus /> 录入银行流水
            </button>
          </div>
        </header>

        <div class="toolbar">
          <label class="search-box">
            <Search />
            <input v-model.trim="keyword" placeholder="搜索单号、供应商、状态" />
          </label>
          <select v-model="statusFilter">
            <option value="">全部状态</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>

        <div v-if="loadError" class="error-banner">
          <Warning />
          <div>
            <strong>当前阶段加载失败</strong>
            <span>{{ loadError }}</span>
          </div>
        </div>

        <div class="table-wrap" :class="{ loading }">
          <table>
            <thead>
              <tr>
                <th>单号 / ID</th>
                <th>业务日期</th>
                <th>供应商 / 对手方</th>
                <th class="amount-col">金额 / 数量</th>
                <th>状态</th>
                <th>关联状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredRows"
                :key="rowKey(row)"
                :class="{ selected: selected && rowKey(selected) === rowKey(row) }"
                @click="selectRow(row)"
              >
                <td>
                  <strong>{{ rowNumber(row) }}</strong>
                  <small>#{{ rowId(row) }}</small>
                </td>
                <td>{{ rowDate(row) || '—' }}</td>
                <td>
                  <strong>{{ rowPartner(row) || '—' }}</strong>
                  <small>{{ rowPartnerCode(row) }}</small>
                </td>
                <td class="amount-col">{{ rowMetric(row) }}</td>
                <td><span class="status-pill" :class="statusTone(rowStatus(row))">{{ rowStatus(row) }}</span></td>
                <td><span class="secondary-status">{{ rowSecondaryStatus(row) }}</span></td>
              </tr>
              <tr v-if="!filteredRows.length && !loading">
                <td colspan="6" class="empty-row">当前筛选条件下没有记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside class="detail-panel">
        <template v-if="selected">
          <header class="detail-header">
            <div>
              <span>SELECTED DOCUMENT</span>
              <h2>{{ rowNumber(selected) }}</h2>
              <p>{{ currentStage.label }} · #{{ rowId(selected) }}</p>
            </div>
            <button type="button" class="icon-button" :disabled="detailLoading" @click="reloadSelected">
              <Refresh :class="{ spin: detailLoading }" />
            </button>
          </header>

          <div class="action-bar" v-if="selectedActions.length">
            <button
              v-for="action in selectedActions"
              :key="action.key"
              type="button"
              :class="{ primary: action.primary, danger: action.danger }"
              :disabled="actionBusy"
              @click="runSelectedAction(action)"
            >
              <component :is="action.icon || Right" />
              {{ action.label }}
            </button>
          </div>

          <dl class="detail-facts">
            <template v-for="fact in detailFacts" :key="fact.label">
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value || '—' }}</dd>
            </template>
          </dl>

          <section v-if="detailEntries.length" class="entry-section">
            <div class="section-title">
              <span>LINES</span>
              <strong>分录 / 分配</strong>
              <em>{{ detailEntries.length }}</em>
            </div>
            <div class="entry-list">
              <article v-for="(entry, index) in detailEntries" :key="entry.fid || entry.id || index">
                <strong>{{ entryTitle(entry, index) }}</strong>
                <span>{{ entrySummary(entry) }}</span>
                <small>{{ entryMetric(entry) }}</small>
              </article>
            </div>
          </section>

          <section v-if="relations.length" class="relation-section">
            <div class="section-title">
              <span>BOTP</span>
              <strong>单据转换关系</strong>
              <em>{{ relations.length }}</em>
            </div>
            <article v-for="relation in relations" :key="relation.relationId" class="relation-card">
              <div>
                <strong>{{ relation.sourceDocument?.documentType }}</strong>
                <span>{{ relation.sourceDocument?.documentId }}</span>
              </div>
              <Right />
              <div>
                <strong>{{ relation.targetDocument?.documentType }}</strong>
                <span>{{ relation.targetDocument?.documentNo || relation.targetDocument?.documentId }}</span>
              </div>
              <span class="status-pill" :class="statusTone(relation.status)">{{ relation.status }}</span>
            </article>
          </section>

          <section v-if="stageKey === 'settlement' && currentHeader?.voucherId" class="voucher-link-card">
            <Tickets />
            <div>
              <strong>付款凭证 {{ currentHeader.voucherNumber || currentHeader.voucherId }}</strong>
              <span>AccountingEvent: {{ currentHeader.accountingEventId || '待生成' }}</span>
            </div>
            <button type="button" @click="router.push('/ledger/voucher')">查看凭证</button>
          </section>

          <details class="raw-detail">
            <summary>查看完整业务快照</summary>
            <pre>{{ prettyDetail }}</pre>
          </details>
        </template>

        <div v-else class="empty-detail">
          <View />
          <strong>选择一条记录</strong>
          <span>右侧将显示业务详情、可执行动作和单据关系。</span>
        </div>
      </aside>
    </section>

    <el-dialog v-model="poDialog.visible" title="新建采购订单" width="880px" destroy-on-close>
      <div class="form-grid">
        <label><span>供应商ID</span><el-input v-model="poDialog.form.partnerId" /></label>
        <label><span>供应商编码</span><el-input v-model="poDialog.form.partnerCode" /></label>
        <label><span>供应商名称</span><el-input v-model="poDialog.form.partnerName" /></label>
        <label><span>币种</span><el-input v-model="poDialog.form.currencyCode" /></label>
        <label><span>付款条件</span><el-input v-model="poDialog.form.paymentTermCode" /></label>
        <label><span>计划交货日</span><el-date-picker v-model="poDialog.form.plannedDeliveryDate" value-format="YYYY-MM-DD" /></label>
      </div>
      <div class="dialog-section-title">
        <strong>采购明细</strong>
        <button type="button" @click="addPoLine"><Plus />增加行</button>
      </div>
      <div class="line-editor" v-for="(line, index) in poDialog.form.lines" :key="index">
        <el-input v-model="line.materialId" placeholder="物料ID" />
        <el-input v-model="line.materialCode" placeholder="物料编码" />
        <el-input v-model="line.materialName" placeholder="物料名称" />
        <el-input-number v-model="line.quantity" :min="0.000001" :precision="6" />
        <el-input-number v-model="line.unitPrice" :min="0" :precision="6" />
        <el-input-number v-model="line.taxRate" :min="0" :max="1" :precision="4" />
        <button type="button" class="line-remove" @click="removePoLine(index)">×</button>
      </div>
      <template #footer>
        <el-button @click="poDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitPurchaseOrder">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="downstream.visible" :title="downstreamTitle" width="900px" destroy-on-close>
      <div v-if="downstream.type === 'receipt'" class="form-grid">
        <label><span>供应商送货单号</span><el-input v-model="downstream.deliveryNo" /></label>
        <label><span>仓库ID</span><el-input v-model="downstream.warehouseId" /></label>
      </div>
      <div v-if="downstream.type === 'invoice'" class="form-grid">
        <label><span>发票号码</span><el-input v-model="downstream.invoiceNo" /></label>
        <label><span>发票代码</span><el-input v-model="downstream.invoiceCode" /></label>
        <label><span>发票日期</span><el-date-picker v-model="downstream.invoiceDate" value-format="YYYY-MM-DD" /></label>
      </div>
      <div class="downstream-lines">
        <article v-for="(line, index) in downstream.lines" :key="line.sourceEntryId || index">
          <div>
            <strong>{{ line.materialName || ('分录 ' + (index + 1)) }}</strong>
            <span>{{ line.materialCode || line.sourceEntryId }}</span>
          </div>
          <div>
            <small>可处理 {{ numberText(line.available) }}</small>
            <el-input-number v-model="line.quantity" :min="0" :max="line.available" :precision="6" />
          </div>
          <div v-if="downstream.type === 'acceptance'" class="quality-inputs">
            <el-input-number v-model="line.qualifiedQuantity" :min="0" :max="line.quantity" :precision="6" />
            <el-select v-model="line.qualityResult">
              <el-option label="合格 PASS" value="PASS" />
              <el-option label="让步 CONCESSION" value="CONCESSION" />
              <el-option label="不合格 REJECT" value="REJECT" />
            </el-select>
          </div>
          <div v-if="downstream.type === 'invoice'">
            <small>税率</small>
            <el-input-number v-model="line.taxRate" :min="0" :max="1" :precision="4" />
          </div>
        </article>
      </div>
      <template #footer>
        <el-button @click="downstream.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitDownstream">生成下游单据</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="controlDialog.visible" title="付款申请控制检查" width="620px" destroy-on-close>
      <div class="form-grid two-col">
        <label><span>证据类型</span><el-input v-model="controlDialog.evidenceType" /></label>
        <label><span>证据单号</span><el-input v-model="controlDialog.evidenceNo" /></label>
        <label><span>资金计划ID</span><el-input v-model="controlDialog.fundPlanId" /></label>
        <label><span>预算可用额度</span><el-input-number v-model="controlDialog.availableAmount" :min="0" :precision="2" /></label>
      </div>
      <template #footer>
        <el-button @click="controlDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitPaymentControls">记录并通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="botpDialog.visible" :title="botpDialog.kind === 'ap' ? '正式应付下推付款申请' : '付款申请下推付款单'" width="620px" destroy-on-close>
      <div class="form-grid two-col">
        <label><span>下推金额</span><el-input-number v-model="botpDialog.amount" :min="0.01" :max="botpDialog.maxAmount" :precision="2" /></label>
        <label v-if="botpDialog.kind === 'ap'"><span>付款方式</span><el-input v-model="botpDialog.paymentMethod" /></label>
        <label v-if="botpDialog.kind === 'ap'"><span>计划付款日</span><el-date-picker v-model="botpDialog.plannedPayDate" value-format="YYYY-MM-DD" /></label>
        <label v-if="botpDialog.kind === 'payment-application'"><span>付款银行账户ID</span><el-input v-model="botpDialog.payerBankAccountId" /></label>
      </div>
      <p class="dialog-hint">最大可下推：{{ money(botpDialog.maxAmount) }}。BOTP 使用 requestId + target idempotency key 防止重复创建。</p>
      <template #footer>
        <el-button @click="botpDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitBotp">执行下推</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="liquidityDialog.visible" title="资金头寸校验" width="560px" destroy-on-close>
      <div class="form-grid two-col">
        <label><span>校验编号</span><el-input v-model="liquidityDialog.checkId" /></label>
        <label><span>可用资金</span><el-input-number v-model="liquidityDialog.availableAmount" :min="0" :precision="2" /></label>
      </div>
      <template #footer>
        <el-button @click="liquidityDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitLiquidityCheck">标记通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bankSubmitDialog.visible" title="提交支付渠道" width="520px" destroy-on-close>
      <div class="form-grid two-col">
        <label><span>渠道编码</span><el-input v-model="bankSubmitDialog.channelCode" /></label>
        <label><span>渠道请求号</span><el-input v-model="bankSubmitDialog.channelRequestId" placeholder="留空自动生成" /></label>
      </div>
      <template #footer>
        <el-button @click="bankSubmitDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitToBank">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bankDialog.visible" title="录入银行流水" width="760px" destroy-on-close>
      <div class="form-grid">
        <label><span>银行账户ID</span><el-input v-model="bankDialog.form.bankAccountId" /></label>
        <label><span>银行流水号</span><el-input v-model="bankDialog.form.bankTransactionNo" /></label>
        <label><span>交易日期</span><el-date-picker v-model="bankDialog.form.transactionDate" value-format="YYYY-MM-DD" /></label>
        <label><span>币种</span><el-input v-model="bankDialog.form.currencyCode" /></label>
        <label><span>金额</span><el-input-number v-model="bankDialog.form.amount" :min="0.01" :precision="2" /></label>
        <label><span>对手户名</span><el-input v-model="bankDialog.form.counterpartyName" /></label>
        <label><span>对手账号</span><el-input v-model="bankDialog.form.counterpartyAccount" /></label>
        <label><span>银行回单号</span><el-input v-model="bankDialog.form.bankReceiptNo" /></label>
      </div>
      <template #footer>
        <el-button @click="bankDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitBankTransaction">保存流水</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="matchDialog.visible" title="银行流水匹配付款单" width="480px" destroy-on-close>
      <label class="single-field">
        <span>PaymentOrder ID</span>
        <el-input v-model="matchDialog.paymentOrderId" />
      </label>
      <template #footer>
        <el-button @click="matchDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="actionBusy" @click="submitBankMatch">执行匹配</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  BankCard,
  Connection,
  Document,
  Finished,
  Goods,
  Money,
  Plus,
  Refresh,
  Right,
  Search,
  Tickets,
  View,
  Warning,
} from '@element-plus/icons-vue'
import { getCurrentUserId, newRequestId } from '@/utils/currentUser'
import { getVoucherList, getVoucherLines } from '@/api/voucher'
import {
  actionPaymentApplication,
  actionPaymentOrder,
  actionPurchaseAcceptance,
  actionPurchaseInbound,
  actionPurchaseOrder,
  actionPurchaseReceipt,
  actionSupplierInvoice,
  addPaymentApplicationEvidence,
  checkPaymentApplicationBudget,
  checkPaymentOrderLiquidity,
  createBankTransaction,
  createPurchaseAcceptance,
  createPurchaseInbound,
  createPurchaseOrder,
  createPurchaseReceipt,
  createSupplierInvoice,
  executeP2pBotp,
  finalizePaymentSettlement,
  getBankTransaction,
  getPaymentApplication,
  getPaymentOrder,
  getPaymentSettlement,
  getPurchaseAcceptance,
  getPurchaseInbound,
  getPurchaseOrder,
  getPurchaseReceipt,
  getSupplierInvoice,
  listBankTransactions,
  listFormalPayables,
  listP2pRelations,
  listPaymentApplications,
  listPaymentOrders,
  listPaymentSettlements,
  listPurchaseAcceptances,
  listPurchaseInbounds,
  listPurchaseOrders,
  listPurchaseReceipts,
  listSupplierInvoices,
  matchBankTransaction,
  submitPaymentOrderToBank,
} from '@/api/p2p'

const router = useRouter()
const route = useRoute()

const stages = [
  { key: 'purchase-order', index: '01', label: '采购订单', english: 'PURCHASE ORDER', description: '采购承诺、价格与交付计划' },
  { key: 'receipt', index: '02', label: '采购收货', english: 'RECEIPT', description: '到货登记与订单履约占用' },
  { key: 'acceptance', index: '03', label: '采购验收', english: 'ACCEPTANCE', description: '质量验收、合格与拒收数量' },
  { key: 'inbound', index: '04', label: '采购入库', english: 'INBOUND', description: '库存入账与暂估应付触发' },
  { key: 'invoice', index: '05', label: '供应商发票', english: 'INVOICE', description: '三单匹配与正式应付触发' },
  { key: 'payable', index: '06', label: '正式应付', english: 'FORMAL AP', description: '应付余额、占用、核销与挂账凭证' },
  { key: 'payment-application', index: '07', label: '付款申请', english: 'PAYMENT APPLICATION', description: '证据、预算、审批与应付占用' },
  { key: 'payment-order', index: '08', label: '付款单', english: 'PAYMENT ORDER', description: '资金头寸、支付渠道与银行匹配' },
  { key: 'bank-transaction', index: '09', label: '银行流水', english: 'BANK TRANSACTION', description: '支付事实与 BANK_PAYMENT 对账' },
  { key: 'settlement', index: '10', label: '付款核销', english: 'SETTLEMENT', description: 'AP余额核销、PAYMENT_COMPLETED 与付款凭证' },
  { key: 'voucher', index: '11', label: '财务凭证', english: 'VOUCHER', description: '核算结果与总账入口' },
]

const validStageKeys = new Set(stages.map((item) => item.key))
const initialStage = validStageKeys.has(String(route.query.stage || ''))
  ? String(route.query.stage)
  : 'purchase-order'

const context = reactive({
  tenantId: localStorage.getItem('p2pTenantId') || localStorage.getItem('tenantId') || 'default',
  orgId: localStorage.getItem('p2pOrgId') || localStorage.getItem('orgId') || '',
})
const operatorId = computed(() => {
  const value = String(getCurrentUserId() || '').trim()
  return /^\d+$/.test(value) ? Number(value) : null
})

const stageKey = ref(initialStage)
const rows = ref([])
const selected = ref(null)
const detail = ref(null)
const relations = ref([])
const loading = ref(false)
const detailLoading = ref(false)
const actionBusy = ref(false)
const loadError = ref('')
const keyword = ref('')
const statusFilter = ref('')

const poDialog = reactive({
  visible: false,
  form: emptyPoForm(),
})
const downstream = reactive({
  visible: false,
  type: '',
  sourceId: null,
  deliveryNo: '',
  warehouseId: '',
  invoiceNo: '',
  invoiceCode: '',
  invoiceDate: today(),
  lines: [],
})
const controlDialog = reactive({
  visible: false,
  evidenceType: 'CONTRACT',
  evidenceNo: '',
  fundPlanId: '',
  availableAmount: 0,
})
const botpDialog = reactive({
  visible: false,
  kind: '',
  amount: 0,
  maxAmount: 0,
  paymentMethod: 'BANK_DIRECT',
  plannedPayDate: '',
  payerBankAccountId: '',
})
const liquidityDialog = reactive({
  visible: false,
  checkId: '',
  availableAmount: 0,
})
const bankSubmitDialog = reactive({
  visible: false,
  channelCode: 'BANK_DIRECT',
  channelRequestId: '',
})
const bankDialog = reactive({
  visible: false,
  sourcePaymentOrderId: null,
  sourceOrgId: null,
  form: emptyBankForm(),
})
const matchDialog = reactive({
  visible: false,
  paymentOrderId: '',
})

const currentStage = computed(() => stages.find((item) => item.key === stageKey.value) || stages[0])
const currentHeader = computed(() => {
  if (!detail.value) return null
  return detail.value.order
    || detail.value.receipt
    || detail.value.acceptance
    || detail.value.inbound
    || detail.value.invoice
    || detail.value.voucher
    || detail.value
})

const detailEntries = computed(() => {
  if (!detail.value) return []
  if (Array.isArray(detail.value.entries)) return detail.value.entries
  if (Array.isArray(detail.value.allocations)) return detail.value.allocations
  if (Array.isArray(detail.value.lines)) return detail.value.lines
  return []
})

const detailFacts = computed(() => {
  const h = currentHeader.value
  if (!h) return []
  return [
    { label: 'ID', value: rowId(h) },
    { label: '单号', value: rowNumber(h) },
    { label: '日期', value: rowDate(h) },
    { label: '组织', value: h.forgId ?? h.orgId },
    { label: '供应商', value: rowPartner(h) },
    { label: '币种', value: h.fcurrencyCode ?? h.currencyCode },
    { label: '金额', value: money(rowNumericAmount(h)) },
    { label: '业务状态', value: rowStatus(h) },
    { label: '审批/匹配', value: rowSecondaryStatus(h) },
    { label: '核算状态', value: h.faccountingStatus ?? h.accountingStatus },
    { label: '来源单据', value: h.fsourceDocumentNo ?? h.sourceDocumentNo },
    { label: 'AccountingEvent', value: h.accountingEventId ?? h.faccountingEventId },
    { label: 'Voucher', value: h.voucherNumber ?? h.fvoucherNumber ?? h.voucherId ?? h.fvoucherId },
  ].filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
})

const filteredRows = computed(() => {
  const q = keyword.value.toLowerCase()
  return rows.value.filter((row) => {
    const status = rowStatus(row)
    if (statusFilter.value && status !== statusFilter.value) return false
    if (!q) return true
    const text = [
      rowNumber(row),
      rowId(row),
      rowPartner(row),
      rowPartnerCode(row),
      status,
      rowSecondaryStatus(row),
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(q)
  })
})

const statusOptions = computed(() => [...new Set(rows.value.map(rowStatus).filter(Boolean))])
const pendingCount = computed(() => rows.value.filter((row) => {
  const text = (rowStatus(row) + ' ' + rowSecondaryStatus(row)).toUpperCase()
  return /DRAFT|SUBMITTED|UNMATCHED|MATCHING|PENDING|PARTIAL|PAYING/.test(text)
}).length)
const totalAmount = computed(() => rows.value.reduce((sum, row) => sum + rowNumericAmount(row), 0))
const prettyDetail = computed(() => JSON.stringify(detail.value, null, 2))

const downstreamTitle = computed(() => ({
  receipt: '从采购订单生成收货单',
  acceptance: '从收货单生成验收单',
  inbound: '从验收单生成入库单',
  invoice: '从入库生成供应商发票',
}[downstream.type] || '生成下游单据'))

const selectedActions = computed(() => {
  const h = currentHeader.value
  if (!h) return []
  const status = String(h.fstatus ?? h.status ?? '').toUpperCase()
  const approval = String(h.fapprovalStatus ?? h.approvalStatus ?? '').toUpperCase()
  const actions = []

  if (stageKey.value === 'purchase-order') {
    if (status === 'DRAFT' && ['DRAFT', 'REJECTED'].includes(approval)) actions.push(action('submit', '提交', true))
    if (status === 'DRAFT' && approval === 'SUBMITTED') actions.push(action('audit', '审核通过', true), action('reject', '驳回', false, true))
    if (status === 'EFFECTIVE' && approval === 'AUDITED') actions.push(action('create-receipt', '生成收货单', true), action('cancel', '取消订单', false, true))
  }

  if (stageKey.value === 'receipt') {
    if (status === 'DRAFT' && ['DRAFT', 'REJECTED'].includes(approval)) actions.push(action('submit', '提交', true))
    if (status === 'DRAFT' && approval === 'SUBMITTED') actions.push(action('confirm', '确认收货', true), action('reject', '驳回', false, true))
    if (status === 'CONFIRMED') actions.push(action('create-acceptance', '生成验收单', true), action('cancel', '取消收货', false, true))
  }

  if (stageKey.value === 'acceptance') {
    if (status === 'DRAFT' && ['DRAFT', 'REJECTED'].includes(approval)) actions.push(action('submit', '提交', true))
    if (status === 'DRAFT' && approval === 'SUBMITTED') actions.push(action('confirm', '确认验收', true), action('reject', '驳回', false, true))
    if (status === 'CONFIRMED') actions.push(action('create-inbound', '生成入库单', true), action('cancel', '取消验收', false, true))
  }

  if (stageKey.value === 'inbound') {
    if (status === 'DRAFT' && ['DRAFT', 'REJECTED'].includes(approval)) actions.push(action('submit', '提交', true))
    if (status === 'DRAFT' && approval === 'SUBMITTED') actions.push(action('confirm', '确认入库', true), action('reject', '驳回', false, true))
    if (status === 'CONFIRMED') actions.push(action('create-invoice', '按入库生成发票', true), action('cancel', '取消入库', false, true))
  }

  if (stageKey.value === 'invoice') {
    const matchStatus = String(h.fmatchStatus || '').toUpperCase()
    if (['DRAFT', 'REJECTED'].includes(status)) actions.push(action('submit', '提交发票', true), action('cancel', '取消', false, true))
    if (status === 'SUBMITTED' && matchStatus !== 'MATCHED') actions.push(action('match', '执行三单匹配', true))
    if (status === 'SUBMITTED' && matchStatus === 'MATCHED') actions.push(action('audit', '审核并生成正式应付', true), action('reject', '驳回', false, true))
  }

  if (stageKey.value === 'payable') {
    if (Number(h.availableAmount || 0) > 0 && ['VOUCHER_GENERATED', 'POSTED'].includes(String(h.accountingStatus || '').toUpperCase())) {
      actions.push(action('push-payment-application', '下推付款申请', true))
    }
    if (h.voucherId) actions.push(action('open-voucher', '查看挂账凭证'))
  }

  if (stageKey.value === 'payment-application') {
    if (['DRAFT', 'REJECTED'].includes(status)) actions.push(action('controls', '补控制资料'), action('submit', '提交申请', true), action('cancel', '取消', false, true))
    if (status === 'SUBMITTED') actions.push(action('approve', '审批通过', true), action('reject', '驳回', false, true))
    if (status === 'APPROVED') actions.push(action('push-payment-order', '下推付款单', true))
  }

  if (stageKey.value === 'payment-order') {
    if (['DRAFT', 'SUBMITTED'].includes(status)) actions.push(action('liquidity', '资金头寸校验'))
    if (['DRAFT', 'REJECTED'].includes(status)) actions.push(action('submit', '提交付款单', true), action('cancel', '取消', false, true))
    if (status === 'SUBMITTED') actions.push(action('audit', '审核付款单', true), action('reject', '驳回', false, true))
    if (status === 'AUDITED') actions.push(action('submit-bank', '提交支付渠道', true), action('record-bank', '录入银行流水'))
    if (status === 'PAYING') actions.push(action('record-bank', '录入银行流水'))
    if (status !== 'PAID' && String(h.bankMatchStatus).toUpperCase() === 'MATCHED') actions.push(action('finalize', '完成支付核销', true))
  }

  if (stageKey.value === 'bank-transaction') {
    if (String(h.matchStatus).toUpperCase() !== 'MATCHED') actions.push(action('match-payment-order', '匹配付款单', true))
    if (String(h.matchStatus).toUpperCase() === 'MATCHED' && h.matchedPaymentOrderId) actions.push(action('finalize-bank', '完成支付核销', true))
  }

  if (stageKey.value === 'settlement' && h.voucherId) {
    actions.push(action('open-voucher', '查看付款凭证', true))
  }

  if (stageKey.value === 'voucher') actions.push(action('open-voucher', '进入凭证管理', true))
  return actions
})

function action(key, label, primary = false, danger = false) {
  return { key, label, primary, danger, icon: key.includes('create') || key.includes('push') ? Plus : Right }
}

function saveContext() {
  localStorage.setItem('p2pTenantId', context.tenantId || '')
  localStorage.setItem('p2pOrgId', context.orgId || '')
  refresh()
}

function selectStage(key) {
  stageKey.value = key
  keyword.value = ''
  statusFilter.value = ''
  selected.value = null
  detail.value = null
  relations.value = []
  router.replace({ path: '/p2p', query: { ...route.query, stage: key } })
  loadStage()
}

async function refresh() {
  await loadStage()
  if (selected.value) {
    const id = rowId(selected.value)
    const current = rows.value.find((item) => String(rowId(item)) === String(id))
    if (current) await selectRow(current)
  }
}

async function loadStage() {
  if (!context.tenantId) {
    rows.value = []
    loadError.value = '请输入 tenantId'
    return
  }
  loading.value = true
  loadError.value = ''
  selected.value = null
  detail.value = null
  relations.value = []
  const params = {
    tenantId: context.tenantId,
    orgId: numericOrUndefined(context.orgId),
  }
  try {
    let response
    switch (stageKey.value) {
      case 'purchase-order':
        response = await listPurchaseOrders({ ...params, page: 1, size: 100 })
        break
      case 'receipt':
        response = await listPurchaseReceipts({ ...params, page: 1, size: 100 })
        break
      case 'acceptance':
        response = await listPurchaseAcceptances({ ...params, page: 1, size: 100 })
        break
      case 'inbound':
        response = await listPurchaseInbounds({ ...params, page: 1, size: 100 })
        break
      case 'invoice':
        response = await listSupplierInvoices({ ...params, page: 1, size: 100 })
        break
      case 'payable':
        response = await listFormalPayables({ ...params, limit: 200 })
        break
      case 'payment-application':
        response = await listPaymentApplications({ ...params, limit: 200 })
        break
      case 'payment-order':
        response = await listPaymentOrders({ ...params, limit: 200 })
        break
      case 'bank-transaction':
        response = await listBankTransactions({ ...params, limit: 200 })
        break
      case 'settlement':
        response = await listPaymentSettlements({ ...params, limit: 200 })
        break
      case 'voucher':
        response = await getVoucherList({ ...params, page: 1, size: 100 })
        break
      default:
        response = []
    }
    rows.value = extractRows(unwrap(response))
  } catch (error) {
    rows.value = []
    loadError.value = errorMessage(error)
  } finally {
    loading.value = false
  }
}

async function selectRow(row) {
  selected.value = row
  await reloadSelected()
}

async function reloadSelected() {
  if (!selected.value) return
  detailLoading.value = true
  relations.value = []
  try {
    const id = rowId(selected.value)
    let response
    switch (stageKey.value) {
      case 'purchase-order':
        response = await getPurchaseOrder(id, context.tenantId)
        break
      case 'receipt':
        response = await getPurchaseReceipt(id, context.tenantId)
        break
      case 'acceptance':
        response = await getPurchaseAcceptance(id, context.tenantId)
        break
      case 'inbound':
        response = await getPurchaseInbound(id, context.tenantId)
        break
      case 'invoice':
        response = await getSupplierInvoice(id, context.tenantId)
        break
      case 'payable':
        response = selected.value
        break
      case 'payment-application':
        response = await getPaymentApplication(id, context.tenantId)
        break
      case 'payment-order':
        response = await getPaymentOrder(id, context.tenantId)
        break
      case 'bank-transaction':
        response = await getBankTransaction(id, context.tenantId)
        break
      case 'settlement':
        response = await getPaymentSettlement(id, context.tenantId)
        break
      case 'voucher':
        response = { voucher: selected.value, lines: unwrap(await getVoucherLines(id)) || [] }
        break
      default:
        response = selected.value
    }
    detail.value = unwrap(response)
    await loadDocumentRelations()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    detailLoading.value = false
  }
}

async function loadDocumentRelations() {
  const documentId = canonicalDocumentId()
  if (!documentId) return
  try {
    const [upstream, downstreamRows] = await Promise.all([
      listP2pRelations({ tenantId: context.tenantId, targetDocumentId: documentId, limit: 100 }),
      listP2pRelations({ tenantId: context.tenantId, sourceDocumentId: documentId, limit: 100 }),
    ])
    const map = new Map()
    ;[...extractRows(unwrap(upstream)), ...extractRows(unwrap(downstreamRows))].forEach((item) => {
      map.set(item.relationId, item)
    })
    relations.value = [...map.values()]
  } catch (error) {
    console.warn('P2P BOTP relation load failed', error)
  }
}

function canonicalDocumentId() {
  const h = currentHeader.value
  if (!h) return ''
  const id = rowId(h)
  if (stageKey.value === 'payable') return 'AP:' + id
  if (stageKey.value === 'payment-application') return 'PA:' + id
  if (stageKey.value === 'payment-order') return 'PAYORD:' + id
  return ''
}

async function runSelectedAction(actionDef) {
  if (!currentHeader.value) return
  const key = actionDef.key
  if (key === 'create-receipt') return prepareReceipt()
  if (key === 'create-acceptance') return prepareAcceptance()
  if (key === 'create-inbound') return prepareInbound()
  if (key === 'create-invoice') return prepareInvoice()
  if (key === 'push-payment-application') return openBotpDialog('ap')
  if (key === 'push-payment-order') return openBotpDialog('payment-application')
  if (key === 'controls') return openControlDialog()
  if (key === 'liquidity') return openLiquidityDialog()
  if (key === 'submit-bank') {
    bankSubmitDialog.visible = true
    bankSubmitDialog.channelCode = currentHeader.value.channelCode || 'BANK_DIRECT'
    bankSubmitDialog.channelRequestId = ''
    return
  }
  if (key === 'record-bank') return openBankDialog(currentHeader.value)
  if (key === 'match-payment-order') {
    matchDialog.paymentOrderId = currentHeader.value.matchedPaymentOrderId || ''
    matchDialog.visible = true
    return
  }
  if (key === 'finalize') return finalizeOrder(rowId(currentHeader.value))
  if (key === 'finalize-bank') return finalizeOrder(currentHeader.value.matchedPaymentOrderId)
  if (key === 'open-voucher') return router.push('/ledger/voucher')

  const confirmed = ['cancel', 'reject'].includes(key)
    ? await ElMessageBox.confirm('确认执行“' + actionDef.label + '”？', 'P2P操作确认', { type: 'warning' }).catch(() => false)
    : true
  if (!confirmed) return

  actionBusy.value = true
  try {
    const id = rowId(currentHeader.value)
    if (stageKey.value === 'purchase-order') await actionPurchaseOrder(id, key, context.tenantId, operatorId.value)
    if (stageKey.value === 'receipt') await actionPurchaseReceipt(id, key, context.tenantId, operatorId.value)
    if (stageKey.value === 'acceptance') await actionPurchaseAcceptance(id, key, context.tenantId, operatorId.value)
    if (stageKey.value === 'inbound') await actionPurchaseInbound(id, key, context.tenantId, operatorId.value)
    if (stageKey.value === 'invoice') await actionSupplierInvoice(id, key, context.tenantId, operatorId.value)
    if (stageKey.value === 'payment-application') await actionPaymentApplication(id, key, context.tenantId, operatorId.value)
    if (stageKey.value === 'payment-order') await actionPaymentOrder(id, key, context.tenantId, operatorId.value)
    ElMessage.success(actionDef.label + '成功')
    await refresh()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function openPurchaseOrderDialog() {
  poDialog.form = emptyPoForm()
  poDialog.visible = true
}

function addPoLine() {
  poDialog.form.lines.push(emptyPoLine())
}

function removePoLine(index) {
  if (poDialog.form.lines.length === 1) return
  poDialog.form.lines.splice(index, 1)
}

async function submitPurchaseOrder() {
  const form = poDialog.form
  if (!form.partnerId || !form.partnerCode || !form.partnerName || !form.currencyCode) {
    return ElMessage.warning('请填写供应商与币种')
  }
  if (form.lines.some((line) => !line.materialId || !line.materialCode || !line.materialName || Number(line.quantity) <= 0)) {
    return ElMessage.warning('请完整填写采购明细')
  }
  actionBusy.value = true
  try {
    await createPurchaseOrder({
      ftenantId: context.tenantId,
      forgId: requiredOrgId(),
      fdate: today(),
      fbusinessPartnerId: Number(form.partnerId),
      fbusinessPartnerCode: form.partnerCode,
      fbusinessPartnerName: form.partnerName,
      fcurrencyCode: form.currencyCode,
      fpaymentTermCode: form.paymentTermCode || null,
      fplannedDeliveryDate: form.plannedDeliveryDate || null,
      entries: form.lines.map((line) => ({
        fmaterialId: Number(line.materialId),
        fmaterialCode: line.materialCode,
        fmaterialName: line.materialName,
        fquantity: Number(line.quantity),
        funitPrice: Number(line.unitPrice || 0),
        ftaxRate: Number(line.taxRate || 0),
        fplannedDeliveryDate: form.plannedDeliveryDate || null,
      })),
    }, operatorId.value)
    poDialog.visible = false
    ElMessage.success('采购订单创建成功')
    await loadStage()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function prepareReceipt() {
  const source = detail.value
  const order = source?.order
  if (!order) return
  const lines = (source.entries || []).map((entry) => {
    const available = Math.max(0, Number(entry.fquantity || 0) - Number(entry.freceiptReservedQuantity || 0))
    return {
      sourceEntryId: entry.fid,
      materialCode: entry.fmaterialCode,
      materialName: entry.fmaterialName,
      available,
      quantity: available,
      warehouseId: '',
      batchNo: '',
    }
  }).filter((line) => line.available > 0)
  if (!lines.length) return ElMessage.warning('采购订单没有可收货数量')
  Object.assign(downstream, {
    visible: true,
    type: 'receipt',
    sourceId: order.fid,
    deliveryNo: '',
    warehouseId: '',
    lines,
  })
}

function prepareAcceptance() {
  const source = detail.value
  const receipt = source?.receipt
  if (!receipt) return
  const lines = (source.entries || []).map((entry) => {
    const available = Math.max(0, Number(entry.fquantity || 0) - Number(entry.finspectionReservedQuantity || 0))
    return {
      sourceEntryId: entry.fid,
      materialCode: entry.fmaterialCode,
      materialName: entry.fmaterialName,
      available,
      quantity: available,
      qualifiedQuantity: available,
      qualityResult: 'PASS',
    }
  }).filter((line) => line.available > 0)
  if (!lines.length) return ElMessage.warning('收货单没有可验收数量')
  Object.assign(downstream, { visible: true, type: 'acceptance', sourceId: receipt.fid, lines })
}

function prepareInbound() {
  const source = detail.value
  const acceptance = source?.acceptance
  if (!acceptance) return
  const lines = (source.entries || []).map((entry) => {
    const accepted = Number(entry.fqualifiedQuantity || 0) + Number(entry.fconcessionQuantity || 0)
    const available = Math.max(0, accepted - Number(entry.finboundReservedQuantity || 0))
    return {
      sourceEntryId: entry.fid,
      materialCode: entry.fmaterialCode,
      materialName: entry.fmaterialName,
      available,
      quantity: available,
      batchNo: entry.fbatchNo || '',
      warehouseId: '',
    }
  }).filter((line) => line.available > 0)
  if (!lines.length) return ElMessage.warning('验收单没有可入库数量')
  Object.assign(downstream, { visible: true, type: 'inbound', sourceId: acceptance.fid, warehouseId: '', lines })
}

async function prepareInvoice() {
  const source = detail.value
  const inbound = source?.inbound
  if (!inbound) return
  actionBusy.value = true
  try {
    const orderIds = [...new Set((source.entries || []).map((entry) => entry.fpurchaseOrderId).filter(Boolean))]
    const orderDetails = await Promise.all(orderIds.map((id) => getPurchaseOrder(id, context.tenantId)))
    const poEntries = new Map()
    orderDetails.forEach((response) => {
      const data = unwrap(response)
      ;(data.entries || []).forEach((entry) => poEntries.set(String(entry.fid), entry))
    })
    const lines = (source.entries || []).map((entry) => {
      const poEntry = poEntries.get(String(entry.fpurchaseOrderEntryId))
      const remaining = poEntry
        ? Math.max(0, Number(poEntry.finboundQuantity || 0) - Number(poEntry.finvoicedQuantity || 0))
        : Number(entry.fquantity || 0)
      const available = Math.min(Number(entry.fquantity || 0), remaining)
      return {
        sourceEntryId: entry.fid,
        purchaseOrderEntryId: entry.fpurchaseOrderEntryId,
        materialId: entry.fmaterialId,
        materialCode: entry.fmaterialCode,
        materialName: entry.fmaterialName,
        available,
        quantity: available,
        unitPrice: Number(entry.funitPrice || poEntry?.funitPrice || 0),
        taxRate: Number(poEntry?.ftaxRate || 0.13),
      }
    }).filter((line) => line.available > 0)
    if (!lines.length) return ElMessage.warning('当前入库单没有可开票数量')
    Object.assign(downstream, {
      visible: true,
      type: 'invoice',
      sourceId: inbound.fid,
      invoiceNo: '',
      invoiceCode: '',
      invoiceDate: today(),
      lines,
    })
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

async function submitDownstream() {
  const lines = downstream.lines.filter((line) => Number(line.quantity) > 0)
  if (!lines.length) return ElMessage.warning('至少保留一条处理数量大于0的分录')
  actionBusy.value = true
  try {
    if (downstream.type === 'receipt') {
      const order = detail.value.order
      await createPurchaseReceipt({
        ftenantId: context.tenantId,
        forgId: order.forgId,
        fdate: today(),
        fbusinessPartnerId: order.fbusinessPartnerId,
        fbusinessPartnerCode: order.fbusinessPartnerCode,
        fbusinessPartnerName: order.fbusinessPartnerName,
        fcurrencyCode: order.fcurrencyCode,
        fsupplierDeliveryNo: downstream.deliveryNo || null,
        fwarehouseId: numericOrUndefined(downstream.warehouseId),
        entries: lines.map((line) => ({
          fpurchaseOrderEntryId: Number(line.sourceEntryId),
          fquantity: Number(line.quantity),
          fbatchNo: line.batchNo || null,
          fwarehouseId: numericOrUndefined(line.warehouseId || downstream.warehouseId),
        })),
      }, operatorId.value)
    }

    if (downstream.type === 'acceptance') {
      const receipt = detail.value.receipt
      await createPurchaseAcceptance({
        ftenantId: context.tenantId,
        forgId: receipt.forgId,
        fdate: today(),
        fpurchaseReceiptId: receipt.fid,
        fbusinessPartnerId: receipt.fbusinessPartnerId,
        fbusinessPartnerCode: receipt.fbusinessPartnerCode,
        fbusinessPartnerName: receipt.fbusinessPartnerName,
        fcurrencyCode: receipt.fcurrencyCode,
        entries: lines.map((line) => ({
          fpurchaseReceiptEntryId: Number(line.sourceEntryId),
          finspectionQuantity: Number(line.quantity),
          fqualifiedQuantity: line.qualityResult === 'PASS' ? Number(line.qualifiedQuantity || line.quantity) : 0,
          fconcessionQuantity: line.qualityResult === 'CONCESSION' ? Number(line.quantity) : 0,
          frejectedQuantity: line.qualityResult === 'REJECT' ? Number(line.quantity) : 0,
          finspectionMethod: 'P2P_WORKBENCH',
          fqualityResult: line.qualityResult,
        })),
      }, operatorId.value)
    }

    if (downstream.type === 'inbound') {
      const acceptance = detail.value.acceptance
      await createPurchaseInbound({
        ftenantId: context.tenantId,
        forgId: acceptance.forgId,
        fdate: today(),
        fpurchaseAcceptanceId: acceptance.fid,
        fbusinessPartnerId: acceptance.fbusinessPartnerId,
        fbusinessPartnerCode: acceptance.fbusinessPartnerCode,
        fbusinessPartnerName: acceptance.fbusinessPartnerName,
        fcurrencyCode: acceptance.fcurrencyCode,
        fwarehouseId: numericOrUndefined(downstream.warehouseId),
        entries: lines.map((line) => ({
          fpurchaseAcceptanceEntryId: Number(line.sourceEntryId),
          fquantity: Number(line.quantity),
          fbatchNo: line.batchNo || null,
          fwarehouseId: numericOrUndefined(line.warehouseId || downstream.warehouseId),
        })),
      }, operatorId.value)
    }

    if (downstream.type === 'invoice') {
      const inbound = detail.value.inbound
      if (!downstream.invoiceNo) throw new Error('发票号码不能为空')
      await createSupplierInvoice({
        ftenantId: context.tenantId,
        forgId: inbound.forgId,
        finvoiceNo: downstream.invoiceNo,
        finvoiceCode: downstream.invoiceCode || null,
        finvoiceDate: downstream.invoiceDate || today(),
        fbusinessPartnerId: inbound.fbusinessPartnerId,
        fbusinessPartnerCode: inbound.fbusinessPartnerCode,
        fbusinessPartnerName: inbound.fbusinessPartnerName,
        fcurrencyCode: inbound.fcurrencyCode,
        entries: lines.map((line) => ({
          fpurchaseOrderEntryId: Number(line.purchaseOrderEntryId),
          fmaterialId: Number(line.materialId),
          fmaterialCode: line.materialCode,
          fmaterialName: line.materialName,
          fquantity: Number(line.quantity),
          funitPrice: Number(line.unitPrice || 0),
          ftaxRate: Number(line.taxRate || 0),
        })),
      }, operatorId.value)
    }

    const targetStage = {
      receipt: 'receipt',
      acceptance: 'acceptance',
      inbound: 'inbound',
      invoice: 'invoice',
    }[downstream.type]
    downstream.visible = false
    ElMessage.success('下游单据创建成功')
    selectStage(targetStage)
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function openControlDialog() {
  const h = currentHeader.value
  controlDialog.evidenceType = 'CONTRACT'
  controlDialog.evidenceNo = h.sourceDocumentId || h.number || ''
  controlDialog.fundPlanId = h.fundPlanId || ''
  controlDialog.availableAmount = Number(h.amount || 0)
  controlDialog.visible = true
}

async function submitPaymentControls() {
  const h = currentHeader.value
  actionBusy.value = true
  try {
    if (!Array.isArray(h.evidence) || !h.evidence.some((item) => item.required && item.verificationStatus === 'VERIFIED')) {
      await addPaymentApplicationEvidence(h.fid, context.tenantId, {
        evidenceType: controlDialog.evidenceType || 'CONTRACT',
        sourceSystemCode: 'MATRIX',
        sourceDocumentType: h.sourceDocumentType || 'FI_AP_PAYABLE',
        sourceDocumentId: h.sourceDocumentId || '',
        sourceDocumentNo: controlDialog.evidenceNo || null,
        required: true,
        verificationStatus: 'VERIFIED',
        remark: 'P2P工作台控制资料',
      }, operatorId.value)
    }
    await checkPaymentApplicationBudget(h.fid, context.tenantId, {
      status: 'PASSED',
      checkId: 'P2P-BUDGET-' + h.fid,
      fundPlanId: controlDialog.fundPlanId || null,
      availableAmount: Number(controlDialog.availableAmount || h.amount),
      message: 'P2P工作台预算校验通过',
      snapshot: { source: 'P2P_WORKBENCH' },
    }, operatorId.value)
    controlDialog.visible = false
    ElMessage.success('付款控制资料已记录')
    await reloadSelected()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function openBotpDialog(kind) {
  const h = currentHeader.value
  botpDialog.kind = kind
  if (kind === 'ap') {
    botpDialog.maxAmount = Number(h.availableAmount || 0)
    botpDialog.amount = botpDialog.maxAmount
    botpDialog.paymentMethod = 'BANK_DIRECT'
    botpDialog.plannedPayDate = h.date || today()
    botpDialog.payerBankAccountId = ''
  } else {
    const used = relations.value
      .filter((relation) => relation.status === 'ACTIVE' && relation.sourceDocument?.documentId === 'PA:' + h.fid)
      .reduce((sum, relation) => sum + Number(relation.allocatedAmount || 0), 0)
    botpDialog.maxAmount = Math.max(0, Number(h.amount || 0) - used)
    botpDialog.amount = botpDialog.maxAmount
    botpDialog.paymentMethod = h.paymentMethod || 'BANK_DIRECT'
    botpDialog.plannedPayDate = h.plannedPayDate || today()
    botpDialog.payerBankAccountId = ''
  }
  if (botpDialog.maxAmount <= 0) return ElMessage.warning('当前单据没有可下推余额')
  botpDialog.visible = true
}

async function submitBotp() {
  const h = currentHeader.value
  const amount = Number(botpDialog.amount || 0)
  if (amount <= 0 || amount > Number(botpDialog.maxAmount)) return ElMessage.warning('下推金额不合法')
  actionBusy.value = true
  try {
    const isAp = botpDialog.kind === 'ap'
    const documentType = isAp ? 'FI_AP_PAYABLE' : 'FI_PAYMENT_APPLICATION'
    const documentId = (isAp ? 'AP:' : 'PA:') + h.fid
    const parameters = {
      pushAmount: amount,
      operatorId: operatorId.value,
    }
    if (isAp) {
      parameters.payMethod = botpDialog.paymentMethod || 'BANK_DIRECT'
      parameters.plannedPayDate = botpDialog.plannedPayDate || null
    } else {
      parameters.payerBankAccountId = botpDialog.payerBankAccountId || null
    }
    const response = await executeP2pBotp({
      requestId: newRequestId(isAp ? 'p2p-ap-payapp' : 'p2p-payapp-order'),
      sourceSystem: 'MATRIX',
      tenantId: context.tenantId,
      ruleCode: isAp ? 'FORMAL_AP_TO_PAYMENT_APPLICATION' : 'PAYMENT_APPLICATION_TO_PAYMENT_ORDER',
      sourceDocuments: [{
        systemCode: 'MATRIX',
        documentType,
        documentId,
        entryIds: [],
      }],
      parameters,
      executionMode: 'SYNC',
    })
    const result = unwrap(response)
    if (!['SUCCEEDED', 'WRITEBACK_PENDING'].includes(result.status)) {
      throw new Error(result.errorMessage || ('BOTP执行失败: ' + result.status))
    }
    botpDialog.visible = false
    ElMessage.success(result.status === 'SUCCEEDED' ? 'BOTP下推成功' : '目标单已创建，反写进入补偿队列')
    selectStage(isAp ? 'payment-application' : 'payment-order')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function openLiquidityDialog() {
  const h = currentHeader.value
  liquidityDialog.checkId = 'P2P-LIQ-' + h.fid
  liquidityDialog.availableAmount = Number(h.amount || 0)
  liquidityDialog.visible = true
}

async function submitLiquidityCheck() {
  const h = currentHeader.value
  actionBusy.value = true
  try {
    await checkPaymentOrderLiquidity(h.fid, context.tenantId, {
      status: 'PASSED',
      checkId: liquidityDialog.checkId,
      availableAmount: Number(liquidityDialog.availableAmount || 0),
      message: 'P2P工作台资金头寸校验通过',
      snapshot: { source: 'P2P_WORKBENCH' },
    }, operatorId.value)
    liquidityDialog.visible = false
    ElMessage.success('资金头寸校验通过')
    await reloadSelected()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

async function submitToBank() {
  const h = currentHeader.value
  actionBusy.value = true
  try {
    await submitPaymentOrderToBank(h.fid, context.tenantId, {
      operatorId: operatorId.value,
      channelCode: bankSubmitDialog.channelCode || 'BANK_DIRECT',
      channelRequestId: bankSubmitDialog.channelRequestId || null,
    })
    bankSubmitDialog.visible = false
    ElMessage.success('付款单已提交支付渠道')
    await refresh()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function openBankDialog(paymentOrder = null) {
  bankDialog.form = emptyBankForm()
  bankDialog.sourcePaymentOrderId = paymentOrder?.fid || null
  bankDialog.sourceOrgId = paymentOrder?.orgId || null
  if (paymentOrder) {
    bankDialog.form.bankAccountId = paymentOrder.payerBankAccountId || ''
    bankDialog.form.currencyCode = paymentOrder.currencyCode || 'CNY'
    bankDialog.form.amount = Number(paymentOrder.amount || 0)
    bankDialog.form.counterpartyName = paymentOrder.payeeAccountName || paymentOrder.businessPartnerName || ''
    bankDialog.form.counterpartyAccount = paymentOrder.payeeBankAccountNo || ''
  }
  bankDialog.visible = true
}

async function submitBankTransaction() {
  const form = bankDialog.form
  if (!form.bankAccountId || !form.bankTransactionNo || !form.transactionDate || Number(form.amount) <= 0) {
    return ElMessage.warning('银行账户、流水号、日期和金额必填')
  }
  actionBusy.value = true
  try {
    const response = await createBankTransaction({
      tenantId: context.tenantId,
      orgId: bankDialog.sourceOrgId || requiredOrgId(),
      bankAccountId: form.bankAccountId,
      bankTransactionNo: form.bankTransactionNo,
      transactionDate: form.transactionDate,
      direction: 'OUTBOUND',
      currencyCode: form.currencyCode || 'CNY',
      amount: Number(form.amount),
      counterpartyName: form.counterpartyName || null,
      counterpartyAccount: form.counterpartyAccount || null,
      purpose: '采购付款',
      summary: 'P2P采购付款',
      bankReceiptNo: form.bankReceiptNo || null,
      sourceChannel: 'P2P_WORKBENCH',
      rawPayload: {
        sourcePaymentOrderId: bankDialog.sourcePaymentOrderId,
      },
    }, operatorId.value)
    const created = unwrap(response)
    bankDialog.visible = false
    ElMessage.success('银行流水已录入')
    selectStage('bank-transaction')
    await loadStage()
    const hit = rows.value.find((item) => String(rowId(item)) === String(created.fid))
    if (hit) await selectRow(hit)
    if (bankDialog.sourcePaymentOrderId) {
      matchDialog.paymentOrderId = String(bankDialog.sourcePaymentOrderId)
      matchDialog.visible = true
    }
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

async function submitBankMatch() {
  const h = currentHeader.value
  const paymentOrderId = Number(matchDialog.paymentOrderId)
  if (!paymentOrderId) return ElMessage.warning('请输入 PaymentOrder ID')
  actionBusy.value = true
  try {
    const response = await matchBankTransaction(h.fid, context.tenantId, paymentOrderId, operatorId.value)
    const result = unwrap(response)
    if (result.result !== 'MATCHED') {
      const messages = (result.differences || []).map((item) => item.message).join('；')
      throw new Error(messages || '银行付款匹配存在差异')
    }
    matchDialog.visible = false
    ElMessage.success('BANK_PAYMENT 匹配成功')
    await refresh()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

async function finalizeOrder(paymentOrderId) {
  const ok = await ElMessageBox.confirm(
    '将执行 PaymentOrder PAID + AP Settlement + PAYMENT_COMPLETED。确认继续？',
    '完成支付核销',
    { type: 'warning' },
  ).catch(() => false)
  if (!ok) return
  actionBusy.value = true
  try {
    await finalizePaymentSettlement(Number(paymentOrderId), context.tenantId, operatorId.value)
    ElMessage.success('支付核销完成，PAYMENT_COMPLETED 已写入 Outbox')
    selectStage('settlement')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    actionBusy.value = false
  }
}

function rowId(row) {
  return row?.fid ?? row?.id ?? row?.voucherId ?? ''
}

function rowNumber(row) {
  return row?.fnumber
    ?? row?.number
    ?? row?.bankTransactionNo
    ?? row?.voucherNumber
    ?? ('ID-' + rowId(row))
}

function rowDate(row) {
  return row?.fdate
    ?? row?.date
    ?? row?.finvoiceDate
    ?? row?.transactionDate
    ?? row?.settlementDate
    ?? row?.fcreatedTime
    ?? ''
}

function rowPartner(row) {
  return row?.fbusinessPartnerName
    ?? row?.businessPartnerName
    ?? row?.counterpartyName
    ?? ''
}

function rowPartnerCode(row) {
  return row?.fbusinessPartnerCode
    ?? row?.businessPartnerCode
    ?? row?.counterpartyAccount
    ?? ''
}

function rowNumericAmount(row) {
  const value = row?.fgrossAmount
    ?? row?.amount
    ?? row?.famount
    ?? row?.fnetAmount
    ?? row?.ftotalQuantity
    ?? 0
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function rowMetric(row) {
  const amount = rowNumericAmount(row)
  const currency = row?.fcurrencyCode ?? row?.currencyCode
  if (amount === 0) return '—'
  return currency ? currency + ' ' + numberText(amount) : numberText(amount)
}

function rowStatus(row) {
  return String(
    row?.fstatus
      ?? row?.status
      ?? row?.matchStatus
      ?? row?.fapprovalStatus
      ?? '—'
  )
}

function rowSecondaryStatus(row) {
  const values = [
    row?.fapprovalStatus ?? row?.approvalStatus,
    row?.fmatchStatus ?? row?.matchStatus,
    row?.faccountingStatus ?? row?.accountingStatus,
    row?.bankMatchStatus,
    row?.channelStatus,
  ].filter((value) => value && value !== rowStatus(row))
  return values.length ? values.join(' · ') : '—'
}

function rowKey(row) {
  return stageKey.value + ':' + String(rowId(row))
}

function statusTone(status) {
  const value = String(status || '').toUpperCase()
  if (/AUDITED|APPROVED|CONFIRMED|MATCHED|SETTLED|PAID|POSTED|SUCCEEDED|EFFECTIVE|COMPLETED/.test(value)) return 'success'
  if (/REJECT|FAILED|CANCEL|DIFFERENCE|DEAD/.test(value)) return 'danger'
  if (/SUBMITTED|PAYING|MATCHING|PROCESSING|PARTIAL|PENDING/.test(value)) return 'warning'
  return 'neutral'
}

function entryTitle(entry, index) {
  return entry.fmaterialName
    || entry.materialName
    || entry.payableNumber
    || entry.paymentApplicationNo
    || entry.faccountCode
    || ('分录 ' + (index + 1))
}

function entrySummary(entry) {
  const values = [
    entry.fmaterialCode ?? entry.materialCode,
    entry.fqualityResult,
    entry.status,
    entry.verificationStatus,
    entry.fsummary,
  ].filter(Boolean)
  return values.join(' · ') || ('ID ' + (entry.fid ?? entry.id ?? '—'))
}

function entryMetric(entry) {
  const qty = entry.fquantity
    ?? entry.quantity
    ?? entry.finspectionQuantity
  const amount = entry.famount
    ?? entry.amount
    ?? entry.settledAmount
    ?? entry.reservedAmount
    ?? entry.appliedAmount
    ?? entry.fdebitAmount
    ?? entry.fcreditAmount
  if (qty !== undefined && qty !== null) return '数量 ' + numberText(qty)
  if (amount !== undefined && amount !== null) return money(amount)
  return ''
}

function unwrap(response) {
  if (response && response.code && response.code !== 200) {
    throw new Error(response.message || '接口调用失败')
  }
  return response?.data ?? response
}

function extractRows(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.list)) return data.list
  return []
}

function errorMessage(error) {
  return error?.response?.data?.message
    || error?.response?.data?.msg
    || error?.message
    || '操作失败'
}

function numericOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

function requiredOrgId() {
  const value = numericOrUndefined(context.orgId)
  if (!value) throw new Error('当前操作需要 Org ID，请先在顶部填写组织')
  return value
}

function numberText(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return String(value ?? '—')
  return number.toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

function money(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return '—'
  return number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function today() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function emptyPoLine() {
  return {
    materialId: '',
    materialCode: '',
    materialName: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0.13,
  }
}

function emptyPoForm() {
  return {
    partnerId: '',
    partnerCode: '',
    partnerName: '',
    currencyCode: 'CNY',
    paymentTermCode: '',
    plannedDeliveryDate: '',
    lines: [emptyPoLine()],
  }
}

function emptyBankForm() {
  return {
    bankAccountId: '',
    bankTransactionNo: '',
    transactionDate: today(),
    currencyCode: 'CNY',
    amount: 0,
    counterpartyName: '',
    counterpartyAccount: '',
    bankReceiptNo: '',
  }
}

watch(
  () => route.query.stage,
  (value) => {
    const next = String(value || '')
    if (validStageKeys.has(next) && next !== stageKey.value) {
      stageKey.value = next
      loadStage()
    }
  },
)

onMounted(loadStage)
</script>

<style scoped>
.p2p-workbench {
  --ink: #18312d;
  --muted: #70807c;
  --accent: #16755f;
  --accent-soft: #eaf6f1;
  min-height: 100vh;
  padding: 22px;
  color: var(--ink);
  background: #f4f7f6;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.workbench-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  padding: 24px 26px;
  border: 1px solid #dce8e4;
  border-radius: 18px;
  background: #fff;
}

.title-block {
  display: flex;
  gap: 16px;
  min-width: 0;
}

.back-button,
.icon-button {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #dbe7e3;
  border-radius: 11px;
  color: #41675d;
  background: #f7faf9;
}

.back-button svg,
.icon-button svg,
.context-controls button svg,
.panel-actions button svg,
.dialog-section-title button svg {
  width: 17px;
  height: 17px;
}

.eyebrow,
.panel-header span,
.detail-header span,
.section-title > span {
  display: block;
  color: var(--accent);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.title-block h1 {
  margin: 4px 0 7px;
  font-size: 27px;
}

.title-block p {
  max-width: 820px;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.context-controls {
  display: flex;
  flex: 0 0 auto;
  gap: 9px;
  align-items: flex-end;
}

.context-controls label {
  display: grid;
  gap: 5px;
}

.context-controls label span,
.form-grid label > span,
.single-field > span {
  color: #71817d;
  font-size: 11px;
  font-weight: 700;
}

.context-controls input {
  width: 128px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #d9e5e1;
  border-radius: 9px;
  outline: 0;
  background: #fbfcfc;
}

.context-controls button,
.panel-actions button,
.action-bar button,
.dialog-section-title button,
.voucher-link-card button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #d8e5e1;
  border-radius: 9px;
  color: #45665e;
  background: #fff;
  font-size: 12px;
  font-weight: 800;
}

.context-controls button.primary,
.action-bar button.primary {
  border-color: var(--accent);
  color: #fff;
  background: var(--accent);
}

.action-bar button.danger {
  color: #a34242;
  border-color: #efd1d1;
  background: #fff8f8;
}

.stage-strip {
  display: flex;
  gap: 7px;
  margin-top: 14px;
  padding: 10px;
  overflow-x: auto;
  border: 1px solid #dde8e5;
  border-radius: 15px;
  background: #fff;
}

.stage-strip > button {
  display: flex;
  min-width: 145px;
  align-items: center;
  gap: 9px;
  padding: 10px 11px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #687b76;
  background: transparent;
  text-align: left;
}

.stage-strip > button.active {
  border-color: #add2c6;
  color: #155f4d;
  background: var(--accent-soft);
}

.stage-strip .supplier-shortcut {
  min-width: 126px;
  border-right: 1px solid #e6ecea;
}

.supplier-shortcut svg {
  width: 20px;
  height: 20px;
}

.stage-index {
  color: #96a5a1;
  font-size: 10px;
  font-weight: 900;
}

.stage-copy {
  min-width: 0;
}

.stage-copy small,
.stage-copy strong {
  display: block;
  white-space: nowrap;
}

.stage-copy small {
  font-size: 8px;
  letter-spacing: 0.05em;
}

.stage-copy strong {
  margin-top: 2px;
  font-size: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.metric-grid article {
  padding: 15px 17px;
  border: 1px solid #dfe9e6;
  border-radius: 13px;
  background: #fff;
}

.metric-grid span,
.metric-grid strong,
.metric-grid small {
  display: block;
}

.metric-grid span {
  color: #82918d;
  font-size: 11px;
}

.metric-grid strong {
  margin-top: 4px;
  font-size: 21px;
}

.metric-grid small {
  margin-top: 4px;
  overflow: hidden;
  color: #8b9995;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(370px, 0.75fr);
  gap: 14px;
  margin-top: 14px;
}

.list-panel,
.detail-panel {
  min-height: 610px;
  border: 1px solid #dce7e4;
  border-radius: 15px;
  background: #fff;
}

.list-panel {
  overflow: hidden;
}

.panel-header,
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 17px 19px;
  border-bottom: 1px solid #e7edeb;
}

.panel-header h2,
.detail-header h2 {
  margin: 3px 0 0;
  font-size: 18px;
}

.detail-header p {
  margin: 4px 0 0;
  color: #8b9995;
  font-size: 11px;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.toolbar {
  display: flex;
  gap: 9px;
  padding: 11px 14px;
  border-bottom: 1px solid #edf1f0;
  background: #fafcfc;
}

.search-box {
  display: flex;
  min-width: 260px;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid #dde7e4;
  border-radius: 9px;
  background: #fff;
}

.search-box svg {
  width: 15px;
  color: #7d8e89;
}

.search-box input {
  width: 100%;
  height: 35px;
  border: 0;
  outline: 0;
  background: transparent;
}

.toolbar select {
  min-width: 145px;
  border: 1px solid #dde7e4;
  border-radius: 9px;
  padding: 0 9px;
  color: #596c67;
  background: #fff;
}

.error-banner {
  display: flex;
  gap: 10px;
  margin: 12px 14px 0;
  padding: 11px;
  border: 1px solid #f0d1cf;
  border-radius: 9px;
  color: #904a45;
  background: #fff8f7;
}

.error-banner svg {
  width: 20px;
}

.error-banner strong,
.error-banner span {
  display: block;
}

.error-banner span {
  margin-top: 2px;
  font-size: 11px;
}

.table-wrap {
  max-height: 610px;
  overflow: auto;
  transition: opacity .15s ease;
}

.table-wrap.loading {
  opacity: .48;
  pointer-events: none;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  color: #7c8b87;
  background: #f7faf9;
  font-size: 10px;
  text-align: left;
}

td {
  padding: 11px 12px;
  border-top: 1px solid #eef2f1;
  color: #425550;
  font-size: 11px;
  vertical-align: middle;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover,
tbody tr.selected {
  background: #f0f8f5;
}

td strong,
td small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

td strong {
  color: #263d37;
  font-size: 12px;
}

td small {
  margin-top: 3px;
  color: #94a19e;
  font-size: 9px;
}

.amount-col {
  text-align: right;
}

.status-pill {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 900;
}

.status-pill.success {
  color: #18735a;
  background: #dff4eb;
}

.status-pill.warning {
  color: #956417;
  background: #fff1ce;
}

.status-pill.danger {
  color: #a64242;
  background: #fde6e6;
}

.status-pill.neutral {
  color: #687875;
  background: #edf1f0;
}

.secondary-status {
  color: #71807d;
  font-size: 9px;
  line-height: 1.5;
}

.empty-row {
  height: 180px;
  color: #98a5a1;
  text-align: center;
}

.detail-panel {
  align-self: start;
  overflow: hidden;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 11px 15px;
  border-bottom: 1px solid #edf1ef;
  background: #fbfcfc;
}

.action-bar button {
  min-height: 34px;
  padding: 0 10px;
}

.action-bar button svg {
  width: 14px;
  height: 14px;
}

.detail-facts {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  margin: 0;
  padding: 13px 17px;
}

.detail-facts dt,
.detail-facts dd {
  margin: 0;
  padding: 7px 0;
  border-bottom: 1px solid #eef2f1;
  font-size: 11px;
}

.detail-facts dt {
  color: #83928e;
}

.detail-facts dd {
  overflow-wrap: anywhere;
  color: #314842;
  font-weight: 700;
}

.entry-section,
.relation-section {
  padding: 13px 16px;
  border-top: 1px solid #e8eeec;
}

.section-title {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 10px;
  align-items: center;
  margin-bottom: 10px;
}

.section-title > span {
  grid-column: 1 / -1;
}

.section-title strong {
  font-size: 13px;
}

.section-title em {
  color: #78908a;
  font-size: 10px;
  font-style: normal;
}

.entry-list {
  display: grid;
  gap: 7px;
  max-height: 210px;
  overflow: auto;
}

.entry-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
  padding: 9px 10px;
  border-radius: 8px;
  background: #f7faf9;
}

.entry-list article strong,
.entry-list article span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-list article strong {
  font-size: 11px;
}

.entry-list article span {
  grid-column: 1;
  color: #7f8d89;
  font-size: 9px;
}

.entry-list article small {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  color: #326c5e;
  font-weight: 800;
}

.relation-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 9px;
  border: 1px solid #e3ece9;
  border-radius: 8px;
}

.relation-card + .relation-card {
  margin-top: 7px;
}

.relation-card > svg {
  width: 15px;
  color: #86a39a;
}

.relation-card strong,
.relation-card span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relation-card strong {
  font-size: 9px;
}

.relation-card div span {
  margin-top: 2px;
  color: #85938f;
  font-size: 8px;
}

.voucher-link-card {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin: 12px 15px;
  padding: 11px;
  border: 1px solid #cfe3dc;
  border-radius: 10px;
  background: #f0f8f5;
}

.voucher-link-card > svg {
  width: 24px;
  color: var(--accent);
}

.voucher-link-card strong,
.voucher-link-card span {
  display: block;
}

.voucher-link-card strong {
  font-size: 11px;
}

.voucher-link-card span {
  margin-top: 2px;
  color: #748682;
  font-size: 9px;
}

.raw-detail {
  margin: 12px 15px 16px;
  border-top: 1px solid #e9efed;
  padding-top: 10px;
}

.raw-detail summary {
  color: #71837e;
  cursor: pointer;
  font-size: 10px;
  font-weight: 800;
}

.raw-detail pre {
  max-height: 280px;
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  color: #40524d;
  background: #f5f8f7;
  font-size: 9px;
  line-height: 1.55;
}

.empty-detail {
  min-height: 610px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  color: #899793;
  text-align: center;
}

.empty-detail svg {
  width: 30px;
  height: 30px;
}

.empty-detail strong {
  color: #4a5d58;
}

.empty-detail span {
  max-width: 270px;
  font-size: 11px;
  line-height: 1.6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.form-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid label,
.single-field {
  display: grid;
  gap: 6px;
}

.dialog-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 9px;
}

.line-editor {
  display: grid;
  grid-template-columns: 110px 130px minmax(130px, 1fr) 130px 130px 120px 30px;
  gap: 7px;
  margin-top: 8px;
}

.line-remove {
  border: 0;
  border-radius: 7px;
  color: #a44949;
  background: #fff1f1;
}

.downstream-lines {
  display: grid;
  gap: 9px;
  margin-top: 16px;
}

.downstream-lines article {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 180px 230px 130px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid #e3ebe8;
  border-radius: 10px;
  background: #fafcfc;
}

.downstream-lines strong,
.downstream-lines span,
.downstream-lines small {
  display: block;
}

.downstream-lines span,
.downstream-lines small {
  margin-top: 3px;
  color: #7c8e89;
  font-size: 10px;
}

.quality-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.dialog-hint {
  margin: 14px 0 0;
  color: #758681;
  font-size: 11px;
}

.spin {
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1280px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    min-height: 0;
  }

  .empty-detail {
    min-height: 280px;
  }
}

@media (max-width: 900px) {
  .p2p-workbench {
    padding: 12px;
  }

  .workbench-header {
    flex-direction: column;
  }

  .context-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-grid,
  .form-grid.two-col {
    grid-template-columns: 1fr;
  }

  .line-editor,
  .downstream-lines article {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
