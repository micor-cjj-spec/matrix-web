<template>
  <MatrixModuleHub
    app-code="finance"
    module-code="receivable"
    title="应收"
    eyebrow="ACCOUNTS RECEIVABLE"
    cloud-label="财务云"
    description="围绕客户、销售确认、暂估收入、收款结算和信用风险搭建应收业务工作台。"
    search-placeholder="搜索应收单据、暂估、结算、账龄"
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
  Money,
  PieChart,
  Search,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'

const stats = [
  { label: '本月应收', value: '¥8.42m', hint: '同比 +12%' },
  { label: '超期客户', value: '2', hint: '需跟进' },
  { label: '待结算', value: '21', hint: '销售与收款' },
  { label: '回款达成', value: '76%', hint: '本月目标' },
]

const actions = [
  { name: '应收单据', path: '/receivable/manage', icon: Files, primary: true },
  { name: '结算处理', path: '/receivable/settlement', icon: Wallet },
]

const topActions = [
  { name: '财务云', path: '/finance', icon: Grid },
  { name: '月结', path: '/ledger/month-end-close-workbench', icon: Calendar },
]

const focusItems = [
  { name: '客户超信用期', status: '2 户', path: '/receivable/aging-credit' },
  { name: '收款结算', status: '21 笔', path: '/receivable/settlement' },
  { name: '收入暂估', status: '待处理', path: '/receivable/estimate' },
]

const shortcuts = [
  { name: '应收单据', path: '/receivable/manage', icon: Files },
  { name: '结算处理', path: '/receivable/settlement', icon: Wallet },
  { name: '账龄预警', path: '/receivable/aging-credit', icon: TrendCharts },
  { name: '往来查询', path: '/ledger/counterparty-account-query', icon: Search },
]

const groups = [
  {
    name: '单据处理',
    summary: '应收确认与暂估',
    eyebrow: 'DOCUMENTS',
    icon: Files,
    modules: [
      { name: '应收单据', description: '销售、开票与收款确认', path: '/receivable/manage', icon: Files },
      { name: '暂估应收', description: '收入暂估与结转处理', path: '/receivable/estimate', icon: DocumentChecked },
      { name: '结算处理', description: '收款结算与核销', path: '/receivable/settlement', icon: Wallet },
    ],
  },
  {
    name: '账龄信用',
    summary: '客户信用与风险',
    eyebrow: 'CREDIT RISK',
    icon: TrendCharts,
    modules: [
      { name: '账龄与信用预警', description: '客户账龄与信用风险', path: '/receivable/aging-credit', icon: TrendCharts },
      { name: '账龄分析表', description: '客户账龄结构分析', path: '/ledger/counterparty-aging-analysis', icon: DataAnalysis },
      { name: '往来多维分析表', description: '客户往来多维分析', path: '/ledger/counterparty-multi-analysis', icon: PieChart },
    ],
  },
  {
    name: '往来协同',
    summary: '对账、查询、通知',
    eyebrow: 'COUNTERPARTY',
    icon: Connection,
    modules: [
      { name: '往来对账单', description: '客户对账单', path: '/ledger/counterparty-statement', icon: DocumentChecked },
      { name: '往来账查询', description: '客户往来账查询', path: '/ledger/counterparty-account-query', icon: Search },
      { name: '往来通知单', description: '往来业务通知单', path: '/ledger/counterparty-notice', icon: DocumentChecked },
      { name: '自动核销', description: '自动匹配与核销执行', path: '/ledger/counterparty-auto-writeoff', icon: Money },
    ],
  },
]
</script>
