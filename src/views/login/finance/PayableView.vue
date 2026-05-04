<template>
  <MatrixModuleHub
    app-code="finance"
    module-code="payable"
    title="应付"
    eyebrow="ACCOUNTS PAYABLE"
    cloud-label="财务云"
    description="围绕供应商、采购暂估、应付确认、付款申请和付款执行建立应付业务工作台。"
    search-placeholder="搜索应付单据、付款、暂估、账龄"
    :stats="stats"
    :groups="groups"
    :actions="actions"
    :top-actions="topActions"
    :focus-items="focusItems"
    :shortcuts="shortcuts"
  />
</template>

<script setup>
import MatrixModuleHub from '@/components/ui/MatrixModuleHub.vue'
import {
  Calendar,
  Connection,
  DataAnalysis,
  DocumentChecked,
  Files,
  Grid,
  List,
  Money,
  Operation,
  Search,
  SetUp,
  Switch,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'

const stats = [
  { label: '本月应付', value: '¥6.18m', hint: '待付 5 笔' },
  { label: '暂估待冲回', value: '14', hint: '采购暂估' },
  { label: '付款申请', value: '9', hint: '审批中' },
  { label: '供应商预警', value: '3', hint: '账龄与信用' },
]

const actions = [
  { name: '应付单据', path: '/payable/manage', icon: Files, primary: true },
  { name: '付款申请', path: '/payable/application', icon: Money },
]

const topActions = [
  { name: '财务云', path: '/finance', icon: Grid },
  { name: '月结', path: '/ledger/month-end-close-workbench', icon: Calendar },
]

const focusItems = [
  { name: '付款申请审批', status: '9 笔', path: '/payable/application' },
  { name: '暂估冲回', status: '14 笔', path: '/payable/estimate' },
  { name: '供应商账龄', status: '预警', path: '/payable/aging-credit' },
]

const shortcuts = [
  { name: '应付单据', path: '/payable/manage', icon: Files },
  { name: '付款处理', path: '/payable/processing', icon: Operation },
  { name: '往来对账', path: '/ledger/counterparty-statement', icon: DocumentChecked },
  { name: '自动核销', path: '/ledger/counterparty-auto-writeoff', icon: Switch },
]

const groups = [
  {
    name: '单据处理',
    summary: '应付确认与暂估',
    eyebrow: 'DOCUMENTS',
    icon: Files,
    modules: [
      { name: '应付单据', description: '发票、采购与应付确认', path: '/payable/manage', icon: Files },
      { name: '暂估应付', description: '采购暂估与冲回', path: '/payable/estimate', icon: DocumentChecked },
      { name: '账龄与信用预警', description: '供应商账龄与信用风险', path: '/payable/aging-credit', icon: TrendCharts },
    ],
  },
  {
    name: '付款管理',
    summary: '申请、处理、追踪',
    eyebrow: 'PAYMENT',
    icon: Wallet,
    modules: [
      { name: '付款申请', description: '付款流程发起与审批', path: '/payable/application', icon: Money },
      { name: '付款处理', description: '付款执行与状态跟踪', path: '/payable/processing', icon: Operation },
      { name: '付款排程', description: '按付款优先级组织排程', ready: false, status: '规划中', icon: Calendar },
    ],
  },
  {
    name: '往来协同',
    summary: '核销、对账、查询',
    eyebrow: 'COUNTERPARTY',
    icon: Connection,
    modules: [
      { name: '往来核销方案', description: '核销规则与方案配置', path: '/ledger/counterparty-plan', icon: SetUp },
      { name: '往来自动核销', description: '自动匹配与核销执行', path: '/ledger/counterparty-auto-writeoff', icon: Switch },
      { name: '往来对账单', description: '供应商对账单', path: '/ledger/counterparty-statement', icon: DocumentChecked },
      { name: '往来账查询', description: '供应商往来账查询', path: '/ledger/counterparty-account-query', icon: Search },
      { name: '往来核销日志', description: '核销执行记录', path: '/ledger/counterparty-writeoff-log', icon: List },
      { name: '账龄分析表', description: '供应商账龄结构分析', path: '/ledger/counterparty-aging-analysis', icon: DataAnalysis },
    ],
  },
]
</script>
