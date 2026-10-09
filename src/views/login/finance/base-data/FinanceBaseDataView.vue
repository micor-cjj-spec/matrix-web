<template>
  <MatrixModuleHub
    app-code="finance"
    module-code="finance-base-data"
    title="财务基础资料"
    eyebrow="FINANCE MASTER DATA"
    cloud-label="财务云"
    description="沉淀会计科目、报表项目、现金流项目和报表映射，让凭证、报表和月结都能使用稳定口径。"
    search-placeholder="搜索会计科目、报表项目、现金流项目、映射"
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
  Collection,
  Connection,
  DataAnalysis,
  Files,
  Grid,
  OfficeBuilding,
  SetUp,
  Tickets,
  TrendCharts,
} from '@element-plus/icons-vue'

const stats = [
  { label: '会计科目', value: '1,426', hint: '启用中' },
  { label: '报表项目', value: '186', hint: '已映射 93%' },
  { label: '现金流项目', value: '72', hint: '经营类 42' },
  { label: '主数据待审', value: '7', hint: '今日待处理' },
]

const actions = [
  { name: '会计科目', path: '/finance/base-data/account-subject', icon: Files, primary: true },
  { name: '报表映射', path: '/ledger/report-account-map', icon: Connection },
]

const topActions = [
  { name: '财务云', path: '/finance', icon: Grid },
  { name: '总账', path: '/ledger', icon: Tickets },
]

const focusItems = [
  { name: '科目完整率', status: '98%', path: '/finance/base-data/account-subject' },
  { name: '报表映射率', status: '93%', path: '/ledger/report-account-map' },
  { name: '现金流项目', status: '72 项', path: '/ledger/cashflow-item' },
]

const shortcuts = [
  { name: '会计科目', path: '/finance/base-data/account-subject', icon: Files },
  { name: '报表项目', path: '/ledger/report-item', icon: DataAnalysis },
  { name: '现金流项目', path: '/ledger/cashflow-item', icon: TrendCharts },
  { name: '凭证类型', path: '/ledger/voucher-type', icon: Tickets },
]

const groups = [
  {
    name: '已可使用',
    summary: '当前可维护主数据',
    eyebrow: 'AVAILABLE',
    icon: Files,
    modules: [
      {
        name: '会计科目',
        description: '维护科目层级、损益类型、报表项目以及现金类标记。',
        path: '/finance/base-data/account-subject',
        icon: Files,
      },
      {
        name: '报表项目',
        description: '查看三大报表项目定义和模板结构。',
        path: '/ledger/report-item',
        icon: DataAnalysis,
      },
      {
        name: '现金流量项目',
        description: '维护现金流项目主数据，供凭证和现金流量表归集使用。',
        path: '/ledger/cashflow-item',
        icon: TrendCharts,
      },
      {
        name: '报表科目映射',
        description: '维护会计科目与报表项目之间的显式映射关系。',
        path: '/ledger/report-account-map',
        icon: Connection,
      },
    ],
  },
  {
    name: '待补充',
    summary: '后续基础服务能力',
    eyebrow: 'PLANNING',
    icon: SetUp,
    modules: [
      { name: '会计期间', description: '会计期间关闭、开账和锁账控制。', ready: false, status: '规划中', icon: Calendar },
      { name: '会计账簿', description: '账簿类型、账簿组织范围和账套控制。', ready: false, status: '规划中', icon: Collection },
      { name: '核算维度', description: '辅助核算维度与科目约束联动。', ready: false, status: '规划中', icon: Grid },
      { name: '科目版本', description: '科目版本和历史口径切换。', ready: false, status: '规划中', icon: OfficeBuilding },
    ],
  },
]
</script>
