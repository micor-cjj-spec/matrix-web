import { createRouter, createWebHistory } from 'vue-router'
import { updateActivity } from '@/utils/auth'

import Login from '../views/login/Login.vue'
import Portal from '../views/login/Portal.vue'
import Register from '../views/login/Register.vue'
import BalanceSheetView from '../views/login/ledger/report/BalanceSheetView.vue'

const EnterpriseModelingView = () => import('../views/login/enterprise-modeling/EnterpriseModelingView.vue')
const PersonalView = () => import('../views/login/enterprise-modeling/person/PersonalView.vue')
const BusinessUnitView = () => import('../views/login/enterprise-modeling/business-unit/BusinessUnitView.vue')
const DeptDimensionView = () => import('../views/login/enterprise-modeling/dept-dimension/DeptDimensionView.vue')
const OrgFunctionTypeView = () => import('../views/login/enterprise-modeling/org-function-type/OrgFunctionTypeView.vue')
const OrgPatternView = () => import('../views/login/enterprise-modeling/org-pattern/OrgPatternView.vue')

const BaseDataView = () => import('../views/login/base-data/BaseDataView.vue')
const MaterialView = () => import('../views/login/base-data/material/MaterialView.vue')
const CustomerView = () => import('../views/login/base-data/customer/CustomerView.vue')
const SupplierView = () => import('../views/login/base-data/supplier/SupplierView.vue')
const CurrencyView = () => import('../views/login/base-data/currency/CurrencyView.vue')
const ExchangeRateView = () => import('../views/login/base-data/exchange-rate/ExchangeRateView.vue')
const BankInfoView = () => import('../views/login/base-data/bank-info/BankInfoView.vue')
const CountryView = () => import('../views/login/base-data/country/CountryView.vue')
const RegionView = () => import('../views/login/base-data/region/RegionView.vue')
const UnitView = () => import('../views/login/base-data/unit/UnitView.vue')

const PayableView = () => import('../views/login/finance/PayableView.vue')
const ReceivableView = () => import('../views/login/finance/ReceivableView.vue')
const ArapDocView = () => import('../views/login/finance/ArapDocView.vue')
const AgingCreditView = () => import('../views/login/finance/AgingCreditView.vue')
const FinanceBaseDataView = () => import('../views/login/finance/base-data/FinanceBaseDataView.vue')
const AccountSubjectView = () => import('../views/login/finance/base-data/AccountSubjectView.vue')
const AccountSubjectForm = () => import('../views/login/finance/base-data/account-subject/AccountSubjectForm.vue')

const GeneralLedgerView = () => import('../views/login/ledger/GeneralLedgerView.vue')
const VoucherView = () => import('../views/login/ledger/VoucherView.vue')
const VoucherSummaryView = () => import('../views/login/ledger/VoucherSummaryView.vue')
const CarryForwardListView = () => import('../views/login/ledger/CarryForwardListView.vue')
const SubjectBalanceView = () => import('../views/login/ledger/subject-balance/SubjectBalanceView.vue')
const GeneralLedgerBookView = () => import('../views/login/ledger/general-ledger/GeneralLedgerBookView.vue')
const DetailLedgerView = () => import('../views/login/ledger/detail-ledger/DetailLedgerView.vue')
const DailyReportView = () => import('../views/login/ledger/daily-report/DailyReportView.vue')
const DimensionBalanceView = () => import('../views/login/ledger/dimension-balance/DimensionBalanceView.vue')
const AuxDimensionBalanceView = () => import('../views/login/ledger/aux-dimension-balance/AuxDimensionBalanceView.vue')
const AuxGeneralLedgerView = () => import('../views/login/ledger/aux-general-ledger/AuxGeneralLedgerView.vue')
const AuxDetailLedgerView = () => import('../views/login/ledger/aux-detail-ledger/AuxDetailLedgerView.vue')
const ReportItemView = () => import('../views/login/ledger/report/ReportItemView.vue')
const FinancialIndicatorView = () => import('../views/login/ledger/report/FinancialIndicatorView.vue')
const ProfitStatementView = () => import('../views/login/ledger/report/ProfitStatementView.vue')
const EnterpriseTaxView = () => import('../views/login/ledger/report/EnterpriseTaxView.vue')
const CashFlowView = () => import('../views/login/ledger/report/CashFlowView.vue')
const CashFlowQueryView = () => import('../views/login/ledger/report/CashFlowQueryView.vue')
const CashFlowSupplementView = () => import('../views/login/ledger/report/CashFlowSupplementView.vue')
const CashflowItemView = () => import('../views/login/ledger/report/CashflowItemView.vue')
const ReportAccountMapView = () => import('../views/login/ledger/report/ReportAccountMapView.vue')
const CounterpartyPlanView = () => import('../views/login/ledger/arap/CounterpartyPlanView.vue')
const CounterpartyAutoWriteoffView = () => import('../views/login/ledger/arap/CounterpartyAutoWriteoffView.vue')
const CounterpartyStatementView = () => import('../views/login/ledger/arap/CounterpartyStatementView.vue')
const CounterpartyAccountQueryView = () => import('../views/login/ledger/arap/CounterpartyAccountQueryView.vue')
const CounterpartyWriteoffLogView = () => import('../views/login/ledger/arap/CounterpartyWriteoffLogView.vue')
const CounterpartyAgingAnalysisView = () => import('../views/login/ledger/arap/CounterpartyAgingAnalysisView.vue')
const CounterpartyMultiAnalysisView = () => import('../views/login/ledger/arap/CounterpartyMultiAnalysisView.vue')
const CounterpartyNoticeView = () => import('../views/login/ledger/notice/CounterpartyNoticeView.vue')
const CounterpartyNoticeCheckView = () => import('../views/login/ledger/notice/CounterpartyNoticeCheckView.vue')
const CashflowNoticeView = () => import('../views/login/ledger/notice/CashflowNoticeView.vue')
const CashflowNoticeCheckView = () => import('../views/login/ledger/notice/CashflowNoticeCheckView.vue')
const VoucherRuleView = () => import('../views/login/ledger/collaboration/VoucherRuleView.vue')
const OffsetVoucherView = () => import('../views/login/ledger/collaboration/OffsetVoucherView.vue')
const VoucherCollaborationCheckView = () => import('../views/login/ledger/collaboration/VoucherCollaborationCheckView.vue')
const SubjectCompareView = () => import('../views/login/ledger/collaboration/SubjectCompareView.vue')
const PeriodProcessModuleView = () => import('../views/login/ledger/period-process/PeriodProcessModuleView.vue')
const PeriodProcessMonitorView = () => import('../views/login/ledger/period-process/PeriodProcessMonitorView.vue')
const InitializationModuleView = () => import('../views/login/ledger/init/InitializationModuleView.vue')
const VoucherTypeView = () => import('../views/login/ledger/settings/VoucherTypeView.vue')
const BaseConfigItemView = () => import('../views/login/ledger/settings/BaseConfigItemView.vue')

const SharedOperationsView = () => import('../views/login/shared/SharedOperationsView.vue')
const AiAssistantView = () => import('../views/ai/AiAssistantView.vue')

const EmptyView = {
  template: '<div style="padding: 20px; font-size: 18px;">这里是占位页面：{{ $route.path }}</div>',
}

const routes = [
  { path: '/', name: 'Login', component: Login, meta: { title: '登录' } },
  { path: '/login', name: 'LoginPage', component: Login, meta: { title: '登录' } },
  { path: '/register', name: 'Register', component: Register, meta: { title: '注册' } },
  { path: '/portal', name: 'Portal', component: Portal, meta: { title: '企业门户' } },

  { path: '/tax-connect', component: EmptyView, meta: { title: '税企直连' } },
  { path: '/invoice', component: EmptyView, meta: { title: '开票管理' } },
  { path: '/receipt', component: EmptyView, meta: { title: '收票管理' } },
  { path: '/funds', component: EmptyView, meta: { title: '资金调度' } },
  { path: '/settlement', component: EmptyView, meta: { title: '资金结算' } },
  { path: '/bills', component: EmptyView, meta: { title: '票据管理' } },
  { path: '/travel', component: EmptyView, meta: { title: '人人差旅' } },
  { path: '/expenses', component: EmptyView, meta: { title: '人人费用' } },
  { path: '/workbench', component: EmptyView, meta: { title: '报账工作台' } },

  { path: '/ledger', name: 'Ledger', component: GeneralLedgerView, meta: { title: '总账' } },
  { path: '/ledger/voucher', name: 'Voucher', component: VoucherView, meta: { title: '凭证' } },
  { path: '/ledger/voucher-summary', name: 'VoucherSummary', component: VoucherSummaryView, meta: { title: '凭证汇总表' } },
  { path: '/ledger/carry-list', name: 'CarryList', component: CarryForwardListView, meta: { title: '结转清单' } },
  { path: '/ledger/counterparty-plan', name: 'CounterpartyPlan', component: CounterpartyPlanView, meta: { title: '往来核销方案' } },
  { path: '/ledger/counterparty-auto-writeoff', name: 'CounterpartyAutoWriteoff', component: CounterpartyAutoWriteoffView, meta: { title: '往来自动核销' } },
  { path: '/ledger/counterparty-statement', name: 'CounterpartyStatement', component: CounterpartyStatementView, meta: { title: '往来对账单' } },
  { path: '/ledger/counterparty-account-query', name: 'CounterpartyAccountQuery', component: CounterpartyAccountQueryView, meta: { title: '往来账查询' } },
  { path: '/ledger/counterparty-writeoff-log', name: 'CounterpartyWriteoffLog', component: CounterpartyWriteoffLogView, meta: { title: '往来核销日志' } },
  { path: '/ledger/counterparty-aging-analysis', name: 'CounterpartyAgingAnalysis', component: CounterpartyAgingAnalysisView, meta: { title: '账龄分析表' } },
  { path: '/ledger/counterparty-multi-analysis', name: 'CounterpartyMultiAnalysis', component: CounterpartyMultiAnalysisView, meta: { title: '往来多维分析表' } },
  { path: '/ledger/counterparty-notice', name: 'CounterpartyNotice', component: CounterpartyNoticeView, meta: { title: '往来通知单' } },
  { path: '/ledger/counterparty-notice-check', name: 'CounterpartyNoticeCheck', component: CounterpartyNoticeCheckView, meta: { title: '往来通知单勾稽' } },
  { path: '/ledger/cashflow-notice', name: 'CashflowNotice', component: CashflowNoticeView, meta: { title: '现金流通知单' } },
  { path: '/ledger/cashflow-notice-check', name: 'CashflowNoticeCheck', component: CashflowNoticeCheckView, meta: { title: '现金流通知单勾稽' } },
  { path: '/ledger/voucher-rule', name: 'VoucherRule', component: VoucherRuleView, meta: { title: '凭证折算规则' } },
  { path: '/ledger/offset-voucher', name: 'OffsetVoucher', component: OffsetVoucherView, meta: { title: '对冲凭证' } },
  { path: '/ledger/voucher-collaboration-check', name: 'VoucherCollaborationCheck', component: VoucherCollaborationCheckView, meta: { title: '凭证协同检查' } },
  { path: '/ledger/subject-compare', name: 'SubjectCompare', component: SubjectCompareView, meta: { title: '科目余额对照' } },
  { path: '/ledger/period-profit-loss', name: 'PeriodProfitLoss', component: PeriodProcessModuleView, meta: { title: '结转损益', periodModule: 'profitLoss' } },
  { path: '/ledger/period-auto-transfer', name: 'PeriodAutoTransfer', component: PeriodProcessModuleView, meta: { title: '自动转账', periodModule: 'autoTransfer' } },
  { path: '/ledger/period-fx-revalue', name: 'PeriodFxRevalue', component: PeriodProcessModuleView, meta: { title: '期末调汇', periodModule: 'fxRevalue' } },
  { path: '/ledger/period-voucher-amortization', name: 'PeriodVoucherAmortization', component: PeriodProcessModuleView, meta: { title: '凭证摊销', periodModule: 'voucherAmortization' } },
  { path: '/ledger/period-close-books', name: 'PeriodCloseBooks', component: PeriodProcessModuleView, meta: { title: '期末结账', periodModule: 'closeBooks' } },
  { path: '/ledger/period-monitor-center', name: 'PeriodMonitorCenter', component: PeriodProcessMonitorView, meta: { title: '监控中心' } },
  { path: '/ledger/opening-subject', name: 'OpeningSubject', component: InitializationModuleView, meta: { title: '科目余额初始化', initModule: 'subject' } },
  { path: '/ledger/opening-cashflow', name: 'OpeningCashflow', component: InitializationModuleView, meta: { title: '现金流初始化', initModule: 'cashflow' } },
  { path: '/ledger/opening-counterparty', name: 'OpeningCounterparty', component: InitializationModuleView, meta: { title: '往来余额初始化', initModule: 'counterparty' } },
  { path: '/ledger/voucher-type', name: 'VoucherType', component: VoucherTypeView, meta: { title: '凭证类型' } },
  { path: '/ledger/base-config-dimension-relation', name: 'BaseConfigDimensionRelation', component: BaseConfigItemView, meta: { title: '核算维度关系设置', baseConfigModule: 'dimensionRelation' } },
  { path: '/ledger/base-config-dimension-value-range', name: 'BaseConfigDimensionValueRange', component: BaseConfigItemView, meta: { title: '核算维度值范围设置', baseConfigModule: 'dimensionValueRange' } },
  { path: '/ledger/base-config-equity-change-type', name: 'BaseConfigEquityChangeType', component: BaseConfigItemView, meta: { title: '所有者权益变动类型', baseConfigModule: 'equityChangeType' } },
  { path: '/ledger/base-config-impairment-nature', name: 'BaseConfigImpairmentNature', component: BaseConfigItemView, meta: { title: '减值准备性质', baseConfigModule: 'impairmentNature' } },
  { path: '/ledger/base-config-license-plate-item', name: 'BaseConfigLicensePlateItem', component: BaseConfigItemView, meta: { title: '车辆牌照号项目', baseConfigModule: 'licensePlateItem' } },
  { path: '/ledger/base-config-cost-nature', name: 'BaseConfigCostNature', component: BaseConfigItemView, meta: { title: '成本性质', baseConfigModule: 'costNature' } },
  { path: '/ledger/subject-balance', name: 'SubjectBalance', component: SubjectBalanceView, meta: { title: '科目余额表' } },
  { path: '/ledger/general-ledger', name: 'GeneralLedgerBook', component: GeneralLedgerBookView, meta: { title: '总分类账' } },
  { path: '/ledger/detail-ledger', name: 'DetailLedger', component: DetailLedgerView, meta: { title: '明细分类账' } },
  { path: '/ledger/daily-report', name: 'DailyReport', component: DailyReportView, meta: { title: '日报表' } },
  { path: '/ledger/dimension-balance', name: 'DimensionBalance', component: DimensionBalanceView, meta: { title: '核算维度余额表' } },
  { path: '/ledger/aux-dimension-balance', name: 'AuxDimensionBalance', component: AuxDimensionBalanceView, meta: { title: '辅助核算维度余额表' } },
  { path: '/ledger/aux-general-ledger', name: 'AuxGeneralLedger', component: AuxGeneralLedgerView, meta: { title: '辅助总账' } },
  { path: '/ledger/aux-detail-ledger', name: 'AuxDetailLedger', component: AuxDetailLedgerView, meta: { title: '辅助明细账' } },
  { path: '/ledger/report-item', name: 'ReportItem', component: ReportItemView, meta: { title: '报表项目' } },
  { path: '/ledger/financial-indicators', name: 'FinancialIndicators', component: FinancialIndicatorView, meta: { title: '财务指标' } },
  { path: '/ledger/balance-sheet', name: 'BalanceSheet', component: BalanceSheetView, meta: { title: '资产负债表' } },
  { path: '/ledger/profit-statement', name: 'ProfitStatement', component: ProfitStatementView, meta: { title: '利润表' } },
  { path: '/ledger/enterprise-tax', name: 'EnterpriseTax', component: EnterpriseTaxView, meta: { title: '企业纳税表' } },
  { path: '/ledger/cash-flow', name: 'CashFlow', component: CashFlowView, meta: { title: '现金流量表' } },
  { path: '/ledger/cash-flow-query', name: 'CashFlowQuery', component: CashFlowQueryView, meta: { title: '现金流量查询' } },
  { path: '/ledger/cash-flow-supplement', name: 'CashFlowSupplement', component: CashFlowSupplementView, meta: { title: '现金流量补充资料' } },
  { path: '/ledger/cashflow-item', name: 'CashflowItem', component: CashflowItemView, meta: { title: '现金流量项目' } },
  { path: '/ledger/report-account-map', name: 'ReportAccountMap', component: ReportAccountMapView, meta: { title: '报表科目映射' } },

  { path: '/finance/base-data', name: 'FinanceBaseData', component: FinanceBaseDataView, meta: { title: '财务基础资料' } },
  { path: '/finance/base-data/account-subject', name: 'AccountSubject', component: AccountSubjectView, meta: { title: '会计科目' } },
  { path: '/finance/base-data/account-subject/form/:fid?', name: 'AccountSubjectForm', component: AccountSubjectForm, meta: { title: '会计科目维护' } },
  { path: '/cost', component: EmptyView, meta: { title: '费用核算' } },
  { path: '/reports', component: EmptyView, meta: { title: '财务报表' } },
  { path: '/estimated-payable', component: EmptyView, meta: { title: '暂估应付' } },
  { path: '/payment-application', component: EmptyView, meta: { title: '付款申请' } },
  { path: '/payment-processing', component: EmptyView, meta: { title: '付款处理' } },
  { path: '/estimated-receivable', component: EmptyView, meta: { title: '暂估应收' } },
  { path: '/settlement-processing', component: EmptyView, meta: { title: '结算处理' } },

  { path: '/payable', name: 'Payable', component: PayableView, meta: { title: '应付' } },
  { path: '/payable/manage', component: ArapDocView, meta: { title: '应付', docType: 'AP' } },
  { path: '/payable/estimate', component: ArapDocView, meta: { title: '暂估应付', docType: 'AP_ESTIMATE' } },
  { path: '/payable/application', component: ArapDocView, meta: { title: '付款申请', docType: 'AP_PAYMENT_APPLY' } },
  { path: '/payable/processing', component: ArapDocView, meta: { title: '付款处理', docType: 'AP_PAYMENT_PROCESS' } },
  { path: '/payable/aging-credit', component: AgingCreditView, meta: { title: '应付账龄与信用预警', titleRoot: '应付', docTypeRoot: 'AP' } },

  { path: '/receivable', name: 'Receivable', component: ReceivableView, meta: { title: '应收' } },
  { path: '/receivable/manage', component: ArapDocView, meta: { title: '应收', docType: 'AR' } },
  { path: '/receivable/estimate', component: ArapDocView, meta: { title: '暂估应收', docType: 'AR_ESTIMATE' } },
  { path: '/receivable/settlement', component: ArapDocView, meta: { title: '结算处理', docType: 'AR_SETTLEMENT' } },
  { path: '/receivable/aging-credit', component: AgingCreditView, meta: { title: '应收账龄与信用预警', titleRoot: '应收', docTypeRoot: 'AR' } },

  { path: '/shared/operations', name: 'SharedOperations', component: SharedOperationsView, meta: { title: '共享运营管理' } },
  { path: '/ai/assistant', name: 'AiAssistant', component: AiAssistantView, meta: { title: 'AI 助手' } },

  { path: '/enterprise-modeling', name: 'EnterpriseModeling', component: EnterpriseModelingView, meta: { title: '企业建模' } },
  { path: '/base-data', name: 'BaseData', component: BaseDataView, meta: { title: '基础资料' } },
  { path: '/personal', name: 'Personal', component: PersonalView, meta: { title: '人员管理' } },
  { path: '/business-unit', name: 'BusinessUnit', component: BusinessUnitView, meta: { title: '业务单元管理' } },
  { path: '/department-dimension', name: 'DepartmentDimension', component: DeptDimensionView, meta: { title: '部门维度管理' } },
  { path: '/org-function-type', name: 'OrgFunctionType', component: OrgFunctionTypeView, meta: { title: '组织职能类型管理' } },
  { path: '/org-pattern', name: 'OrgPattern', component: OrgPatternView, meta: { title: '组织形态管理' } },
  { path: '/material', name: 'Material', component: MaterialView, meta: { title: '物料管理' } },
  { path: '/customer', name: 'Customer', component: CustomerView, meta: { title: '客户管理' } },
  { path: '/supplier', name: 'Supplier', component: SupplierView, meta: { title: '供应商管理' } },
  { path: '/currency', name: 'Currency', component: CurrencyView, meta: { title: '币种管理' } },
  { path: '/exchange-rate', name: 'ExchangeRate', component: ExchangeRateView, meta: { title: '汇率管理' } },
  { path: '/bank-info', name: 'BankInfo', component: BankInfoView, meta: { title: '行名行号管理' } },
  { path: '/country', name: 'Country', component: CountryView, meta: { title: '国家管理' } },
  { path: '/region', name: 'Region', component: RegionView, meta: { title: '地区管理' } },
  { path: '/unit', name: 'Unit', component: UnitView, meta: { title: '计量单位管理' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const urlToken = typeof to.query?.token === 'string' ? to.query.token : ''
  if (urlToken) {
    localStorage.setItem('token', urlToken)
    localStorage.setItem('lastActivityTime', Date.now().toString())

    const query = { ...to.query }
    delete query.token
    delete query.from
    return next({ path: to.path, query, replace: true })
  }

  if (to.meta?.title) {
    document.title = to.meta.title
  }

  const publicPages = ['/', '/login', '/register']
  const token = localStorage.getItem('token')
  if (!token && !publicPages.includes(to.path)) {
    return next('/login')
  }

  if (token) {
    updateActivity()
  }

  next()
})

export default router
