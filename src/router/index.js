import { createRouter, createWebHistory } from 'vue-router'
import { updateActivity } from '@/utils/auth'

import Login from '../views/login/Login.vue'
import Portal from '../views/login/Portal.vue'
import Register from '../views/login/Register.vue'

import EnterpriseModelingView from '../views/login/enterprise-modeling/EnterpriseModelingView.vue'
import PersonalView from '../views/login/enterprise-modeling/person/PersonalView.vue'
import BusinessUnitView from '../views/login/enterprise-modeling/business-unit/BusinessUnitView.vue'
import DeptDimensionView from '../views/login/enterprise-modeling/dept-dimension/DeptDimensionView.vue'
import OrgFunctionTypeView from '../views/login/enterprise-modeling/org-function-type/OrgFunctionTypeView.vue'
import OrgPatternView from '../views/login/enterprise-modeling/org-pattern/OrgPatternView.vue'

import BaseDataView from '../views/login/base-data/BaseDataView.vue'
import MaterialView from '../views/login/base-data/material/MaterialView.vue'
import CustomerView from '../views/login/base-data/customer/CustomerView.vue'
import SupplierView from '../views/login/base-data/supplier/SupplierView.vue'
import CurrencyView from '../views/login/base-data/currency/CurrencyView.vue'
import ExchangeRateView from '../views/login/base-data/exchange-rate/ExchangeRateView.vue'
import BankInfoView from '../views/login/base-data/bank-info/BankInfoView.vue'
import CountryView from '../views/login/base-data/country/CountryView.vue'
import RegionView from '../views/login/base-data/region/RegionView.vue'
import UnitView from '../views/login/base-data/unit/UnitView.vue'

import PayableView from '../views/login/finance/PayableView.vue'
import ReceivableView from '../views/login/finance/ReceivableView.vue'
import ArapDocView from '../views/login/finance/ArapDocView.vue'
import AgingCreditView from '../views/login/finance/AgingCreditView.vue'
import FinanceBaseDataView from '../views/login/finance/base-data/FinanceBaseDataView.vue'
import AccountSubjectView from '../views/login/finance/base-data/AccountSubjectView.vue'
import AccountSubjectForm from '../views/login/finance/base-data/account-subject/AccountSubjectForm.vue'

import GeneralLedgerView from '../views/login/ledger/GeneralLedgerView.vue'
import VoucherView from '../views/login/ledger/VoucherView.vue'
import SubjectBalanceView from '../views/login/ledger/subject-balance/SubjectBalanceView.vue'
import GeneralLedgerBookView from '../views/login/ledger/general-ledger/GeneralLedgerBookView.vue'
import DetailLedgerView from '../views/login/ledger/detail-ledger/DetailLedgerView.vue'
import DailyReportView from '../views/login/ledger/daily-report/DailyReportView.vue'
import DimensionBalanceView from '../views/login/ledger/dimension-balance/DimensionBalanceView.vue'
import AuxDimensionBalanceView from '../views/login/ledger/aux-dimension-balance/AuxDimensionBalanceView.vue'
import AuxGeneralLedgerView from '../views/login/ledger/aux-general-ledger/AuxGeneralLedgerView.vue'
import AuxDetailLedgerView from '../views/login/ledger/aux-detail-ledger/AuxDetailLedgerView.vue'
import ReportItemView from '../views/login/ledger/report/ReportItemView.vue'
import BalanceSheetView from '../views/login/ledger/report/BalanceSheetView.vue'
import ProfitStatementView from '../views/login/ledger/report/ProfitStatementView.vue'
import CashFlowView from '../views/login/ledger/report/CashFlowView.vue'

import SharedOperationsView from '../views/login/shared/SharedOperationsView.vue'
import AiAssistantView from '../views/ai/AiAssistantView.vue'

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
  { path: '/ledger/subject-balance', name: 'SubjectBalance', component: SubjectBalanceView, meta: { title: '科目余额表' } },
  { path: '/ledger/general-ledger', name: 'GeneralLedgerBook', component: GeneralLedgerBookView, meta: { title: '总分类账' } },
  { path: '/ledger/detail-ledger', name: 'DetailLedger', component: DetailLedgerView, meta: { title: '明细分类账' } },
  { path: '/ledger/daily-report', name: 'DailyReport', component: DailyReportView, meta: { title: '日报表' } },
  { path: '/ledger/dimension-balance', name: 'DimensionBalance', component: DimensionBalanceView, meta: { title: '核算维度余额表' } },
  { path: '/ledger/aux-dimension-balance', name: 'AuxDimensionBalance', component: AuxDimensionBalanceView, meta: { title: '辅助核算维度余额表' } },
  { path: '/ledger/aux-general-ledger', name: 'AuxGeneralLedger', component: AuxGeneralLedgerView, meta: { title: '辅助总账' } },
  { path: '/ledger/aux-detail-ledger', name: 'AuxDetailLedger', component: AuxDetailLedgerView, meta: { title: '辅助明细账' } },
  { path: '/ledger/report-item', name: 'ReportItem', component: ReportItemView, meta: { title: '报表项目' } },
  { path: '/ledger/balance-sheet', name: 'BalanceSheet', component: BalanceSheetView, meta: { title: '资产负债表' } },
  { path: '/ledger/profit-statement', name: 'ProfitStatement', component: ProfitStatementView, meta: { title: '利润表' } },
  { path: '/ledger/cash-flow', name: 'CashFlow', component: CashFlowView, meta: { title: '现金流量表' } },

  { path: '/finance/base-data', name: 'FinanceBaseData', component: FinanceBaseDataView, meta: { title: '财务基础资料' } },
  { path: '/finance/base-data/account-subject', name: 'AccountSubject', component: AccountSubjectView, meta: { title: '会计科目' } },
  { path: '/finance/base-data/account-subject/form/:fid?', name: 'AccountSubjectForm', component: AccountSubjectForm, meta: { title: '科目维护' } },
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

  if (token) updateActivity()

  next()
})

export default router
