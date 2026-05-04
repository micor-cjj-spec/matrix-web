<template>
  <MatrixModuleHub
    app-code="finance"
    module-code="ledger"
    title="总账"
    eyebrow="GENERAL LEDGER"
    cloud-label="财务云"
    description="以凭证为中心连接账簿、现金流、往来、内部通知单和期末处理，进入具体业务前先看到清晰的总账工作面。"
    search-placeholder="搜索凭证、账簿、现金流、期末、配置"
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
  Checked,
  Collection,
  Connection,
  DataAnalysis,
  DocumentChecked,
  Files,
  Grid,
  List,
  Memo,
  Money,
  Search,
  SetUp,
  Switch,
  Tickets,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'

const stats = [
  { label: '本月凭证', value: '1,286', hint: '自动生成 64%' },
  { label: '待复核', value: '18', hint: '协同检查 2 项' },
  { label: '期末任务', value: '9/12', hint: '完成进度 75%' },
  { label: '现金流缺口', value: '4', hint: '需补充项目' },
]

const actions = [
  { name: '新增凭证', path: '/ledger/voucher', icon: Tickets, primary: true },
  { name: '月结工作台', path: '/ledger/month-end-close-workbench', icon: Calendar },
]

const topActions = [
  { name: '财务云', path: '/finance', icon: Grid },
  { name: '月结', path: '/ledger/month-end-close-workbench', icon: Calendar },
]

const focusItems = [
  { name: '凭证协同检查', status: '待处理', path: '/ledger/voucher-collaboration-check' },
  { name: '现金流勾稽', status: '进行中', path: '/ledger/cashflow-notice-check' },
  { name: '往来核销', status: '可处理', path: '/ledger/counterparty-auto-writeoff' },
]

const shortcuts = [
  { name: '凭证', path: '/ledger/voucher', icon: Tickets },
  { name: '总分类账', path: '/ledger/general-ledger', icon: Collection },
  { name: '科目余额表', path: '/ledger/subject-balance', icon: List },
  { name: '资产负债表', path: '/ledger/balance-sheet', icon: DataAnalysis },
]

const groups = [
  {
    name: '凭证处理',
    summary: '录入、汇总、结转',
    eyebrow: 'VOUCHER',
    icon: Tickets,
    modules: [
      { name: '凭证', description: '凭证录入与维护', path: '/ledger/voucher', icon: Files },
      { name: '凭证汇总表', description: '按期间查询凭证汇总', path: '/ledger/voucher-summary', icon: DataAnalysis },
      { name: '结转清单', description: '期末结转任务清单', path: '/ledger/carry-list', icon: Checked },
    ],
  },
  {
    name: '账表查询',
    summary: '余额、总账、明细账',
    eyebrow: 'BOOK QUERY',
    icon: Collection,
    modules: [
      { name: '科目余额表', description: '科目余额与发生额查询', path: '/ledger/subject-balance', icon: List },
      { name: '总分类账', description: '科目总账查询', path: '/ledger/general-ledger', icon: Collection },
      { name: '明细分类账', description: '科目明细账查询', path: '/ledger/detail-ledger', icon: Files },
      { name: '日报表', description: '日维度账务报表', path: '/ledger/daily-report', icon: Calendar },
      { name: '核算维度余额表', description: '按核算维度查询余额', path: '/ledger/dimension-balance', icon: Grid },
      { name: '辅助核算维度余额表', description: '辅助维度余额查询', path: '/ledger/aux-dimension-balance', icon: Grid },
      { name: '辅助总账', description: '辅助核算总账查询', path: '/ledger/aux-general-ledger', icon: Collection },
      { name: '辅助明细账', description: '辅助核算明细查询', path: '/ledger/aux-detail-ledger', icon: Files },
    ],
  },
  {
    name: '现金流量',
    summary: '报表、查询、补充资料',
    eyebrow: 'CASH FLOW',
    icon: TrendCharts,
    modules: [
      { name: '现金流量表', description: '现金流入流出报表', path: '/ledger/cash-flow', icon: DataAnalysis },
      { name: '现金流量查询', description: '现金流明细查询', path: '/ledger/cash-flow-query', icon: Search },
      { name: '补充资料', description: '现金流量补充资料', path: '/ledger/cash-flow-supplement', icon: Memo },
    ],
  },
  {
    name: '往来管理',
    summary: '核销、对账、账龄',
    eyebrow: 'COUNTERPARTY',
    icon: Wallet,
    modules: [
      { name: '往来核销方案', description: '核销规则与方案配置', path: '/ledger/counterparty-plan', icon: SetUp },
      { name: '往来自动核销', description: '自动匹配与核销执行', path: '/ledger/counterparty-auto-writeoff', icon: Switch },
      { name: '往来对账单', description: '客户与供应商对账单', path: '/ledger/counterparty-statement', icon: DocumentChecked },
      { name: '往来账查询', description: '往来账明细查询', path: '/ledger/counterparty-account-query', icon: Search },
      { name: '往来核销日志', description: '核销执行记录', path: '/ledger/counterparty-writeoff-log', icon: List },
      { name: '账龄分析表', description: '账龄结构分析', path: '/ledger/counterparty-aging-analysis', icon: TrendCharts },
      { name: '往来多维分析表', description: '往来多维分析', path: '/ledger/counterparty-multi-analysis', icon: DataAnalysis },
    ],
  },
  {
    name: '内部通知单',
    summary: '往来与现金流通知',
    eyebrow: 'NOTICE',
    icon: DocumentChecked,
    modules: [
      { name: '往来通知单', description: '往来业务通知单', path: '/ledger/counterparty-notice', icon: DocumentChecked },
      { name: '往来通知单勾稽', description: '往来通知与凭证勾稽', path: '/ledger/counterparty-notice-check', icon: Checked },
      { name: '现金流通知单', description: '现金流业务通知单', path: '/ledger/cashflow-notice', icon: Memo },
      { name: '现金流通知单勾稽', description: '现金流通知与凭证勾稽', path: '/ledger/cashflow-notice-check', icon: Checked },
    ],
  },
  {
    name: '账簿协同管理',
    summary: '折算、对冲、检查',
    eyebrow: 'COLLABORATION',
    icon: Connection,
    modules: [
      { name: '凭证折算规则', description: '凭证折算与协同规则', path: '/ledger/voucher-rule', icon: SetUp },
      { name: '对冲凭证', description: '往来、现金流和调整凭证对冲', path: '/ledger/offset-voucher', icon: Switch },
      { name: '凭证协同检查', description: '自动凭证与人工复核', path: '/ledger/voucher-collaboration-check', icon: Connection },
      { name: '科目余额对照', description: '科目余额对照检查', path: '/ledger/subject-compare', icon: DataAnalysis },
    ],
  },
  {
    name: '期末处理',
    summary: '月结、转账、监控',
    eyebrow: 'PERIOD CLOSE',
    icon: Calendar,
    modules: [
      { name: '结转损益', description: '期间损益结转', path: '/ledger/period-profit-loss', icon: Checked },
      { name: '自动转账', description: '自动转账规则执行', path: '/ledger/period-auto-transfer', icon: Switch },
      { name: '期末调汇', description: '外币期末重估', path: '/ledger/period-fx-revalue', icon: Money },
      { name: '凭证摊销', description: '凭证摊销处理', path: '/ledger/period-voucher-amortization', icon: Files },
      { name: '期末结账', description: '账簿封存与结账', path: '/ledger/period-close-books', icon: Checked },
      { name: '监控中心', description: '期间处理状态监控', path: '/ledger/period-monitor-center', icon: TrendCharts },
      { name: '月结工作台', description: '月结任务统一监控', path: '/ledger/month-end-close-workbench', icon: Calendar },
    ],
  },
  {
    name: '分析报表',
    summary: '报表、指标、税表',
    eyebrow: 'REPORTS',
    icon: DataAnalysis,
    modules: [
      { name: '报表项目', description: '报表项目维护', path: '/ledger/report-item', icon: List },
      { name: '财务指标', description: '经营指标分析', path: '/ledger/financial-indicators', icon: TrendCharts },
      { name: '资产负债表', description: '资产、负债与权益报表', path: '/ledger/balance-sheet', icon: DataAnalysis },
      { name: '利润表', description: '收入、成本与利润分析', path: '/ledger/profit-statement', icon: TrendCharts },
      { name: '企业纳税表', description: '税务口径报表', path: '/ledger/enterprise-tax', icon: DocumentChecked },
      { name: '现金流量表', description: '现金流入流出报表', path: '/ledger/cash-flow', icon: DataAnalysis },
    ],
  },
  {
    name: '初始化',
    summary: '期初余额与现金流',
    eyebrow: 'INITIALIZATION',
    icon: SetUp,
    modules: [
      { name: '科目余额初始化', description: '科目期初余额', path: '/ledger/opening-subject', icon: Files },
      { name: '现金流初始化', description: '现金流期初数据', path: '/ledger/opening-cashflow', icon: TrendCharts },
      { name: '往来余额初始化', description: '往来期初余额', path: '/ledger/opening-counterparty', icon: Wallet },
    ],
  },
  {
    name: '基础设置',
    summary: '类型、维度、映射',
    eyebrow: 'CONFIGURATION',
    icon: SetUp,
    modules: [
      { name: '凭证类型', description: '凭证字与类型设置', path: '/ledger/voucher-type', icon: Tickets },
      { name: '现金流量项目', description: '现金流项目配置', path: '/ledger/cashflow-item', icon: TrendCharts },
      { name: '报表科目映射', description: '报表项目与科目关系', path: '/ledger/report-account-map', icon: Connection },
      { name: '核算维度关系设置', description: '核算维度关联规则', path: '/ledger/base-config-dimension-relation', icon: Grid },
      { name: '核算维度值范围设置', description: '维度值范围控制', path: '/ledger/base-config-dimension-value-range', icon: SetUp },
      { name: '所有者权益变动类型', description: '权益变动类型配置', path: '/ledger/base-config-equity-change-type', icon: DataAnalysis },
      { name: '减值准备性质', description: '减值准备性质配置', path: '/ledger/base-config-impairment-nature', icon: DataAnalysis },
      { name: '车辆牌照号项目', description: '车辆牌照项目配置', path: '/ledger/base-config-license-plate-item', icon: List },
      { name: '成本性质', description: '成本性质配置', path: '/ledger/base-config-cost-nature', icon: Money },
    ],
  },
]
</script>
