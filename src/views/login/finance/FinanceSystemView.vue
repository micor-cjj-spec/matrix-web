<template>
  <main class="matrix-app-shell" :style="{ '--accent': activeCloud.accent, '--warm': activeCloud.warm }">
    <aside class="cloud-rail" aria-label="云应用">
      <button type="button" class="rail-brand" title="个人工作台" @click="go('/portal')">
        <span>M</span>
      </button>

      <nav class="cloud-stack" aria-label="一级云应用">
        <button
          v-for="cloud in clouds"
          :key="cloud.id"
          type="button"
          :class="{ active: activeCloud.id === cloud.id }"
          :title="cloud.name"
          @click="selectCloud(cloud)"
        >
          <component :is="cloud.icon" class="svg-icon" />
          <span>{{ cloud.short }}</span>
        </button>
      </nav>

      <button type="button" class="rail-tool" title="返回工作台" @click="go('/portal')">
        <House class="svg-icon" />
      </button>
    </aside>

    <aside class="module-panel">
      <header class="panel-brand">
        <div class="cloud-mark">
          <component :is="activeCloud.icon" class="svg-icon" />
        </div>
        <div>
          <strong>{{ activeCloud.name }}</strong>
          <span>{{ activeCloud.subtitle }}</span>
        </div>
      </header>

      <section class="cloud-summary">
        <span>{{ activeCloud.kicker }}</span>
        <strong>{{ activeCloud.summary }}</strong>
      </section>

      <nav class="module-list" aria-label="二级模块">
        <button
          v-for="module in activeCloud.modules"
          :key="module.id"
          type="button"
          :class="{ active: activeModule.id === module.id }"
          @click="selectModule(module)"
        >
          <span class="module-list-icon">
            <component :is="module.icon" class="svg-icon" />
          </span>
          <span class="module-list-copy">
            <strong>{{ module.title }}</strong>
            <small>{{ module.summary }}</small>
          </span>
          <em v-if="module.badge">{{ module.badge }}</em>
        </button>
      </nav>

      <section class="panel-focus">
        <div class="panel-title">
          <span>FOCUS</span>
          <strong>今日关注</strong>
        </div>
        <div class="focus-list">
          <button v-for="item in focusItems" :key="item.name" type="button" @click="go(item.path)">
            <span>{{ item.name }}</span>
            <em>{{ item.status }}</em>
          </button>
        </div>
      </section>
    </aside>

    <section class="workspace">
      <header class="workspace-topbar">
        <div class="breadcrumb">
          <button type="button" @click="selectCloud(activeCloud)">{{ activeCloud.name }}</button>
          <span>/</span>
          <button type="button" @click="selectModule(activeModule)">{{ activeModule.title }}</button>
          <template v-if="activeDomain">
            <span>/</span>
            <button type="button">{{ activeDomain.title }}</button>
          </template>
        </div>

        <label class="global-search" aria-label="搜索业务入口">
          <Search class="svg-icon" />
          <input v-model="keyword" type="search" :placeholder="activeModule.searchPlaceholder || '搜索业务、报表、配置'" />
        </label>

        <div class="workspace-actions">
          <button type="button" title="个人工作台" @click="go('/portal')">
            <House class="svg-icon" />
            <span>工作台</span>
          </button>
          <button type="button" title="月结工作台" @click="go('/ledger/month-end-close-workbench')">
            <Calendar class="svg-icon" />
            <span>月结</span>
          </button>
        </div>
      </header>

      <section class="workspace-main">
        <div class="work-area">
          <section class="overview-band">
            <div class="overview-copy">
              <span>{{ activeModule.kicker }}</span>
              <h1>{{ activeModule.title }}</h1>
              <p>{{ activeModule.description }}</p>
              <div class="overview-actions">
                <button
                  v-for="action in activeModule.actions"
                  :key="action.name"
                  type="button"
                  :class="action.primary ? 'primary-action' : 'plain-action'"
                  @click="go(action.path)"
                >
                  <component :is="action.icon || ArrowRight" class="svg-icon" />
                  <span>{{ action.name }}</span>
                </button>
              </div>
            </div>

            <div class="metric-grid">
              <div v-for="metric in activeStats" :key="metric.label" class="metric-card">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
                <small>{{ metric.hint }}</small>
              </div>
            </div>
          </section>

          <section v-if="currentDomains.length" class="domain-strip" aria-label="三级业务域">
            <button
              v-for="domain in currentDomains"
              :key="domain.id"
              type="button"
              :class="{ active: activeDomain?.id === domain.id && !keyword.trim() }"
              @click="selectDomain(domain)"
            >
              <component :is="domain.icon || activeModule.icon" class="svg-icon" />
              <span>
                <strong>{{ domain.title }}</strong>
                <small>{{ domain.summary }}</small>
              </span>
              <em>{{ domain.items.length }}</em>
            </button>
          </section>

          <section class="business-board">
            <div class="section-heading">
              <div>
                <span>{{ keyword.trim() ? 'SEARCH RESULT' : (activeDomain?.kicker || activeModule.kicker) }}</span>
                <h2>{{ keyword.trim() ? `搜索“${keyword.trim()}”` : (activeDomain?.title || activeModule.title) }}</h2>
              </div>
              <small>{{ totalVisibleItems }} 个业务入口</small>
            </div>

            <div v-if="visibleDomains.length" class="business-groups">
              <section v-for="domain in visibleDomains" :key="domain.id" class="business-group">
                <header v-if="keyword.trim()" class="group-heading">
                  <strong>{{ domain.title }}</strong>
                  <span>{{ domain.summary }}</span>
                </header>

                <div class="business-grid">
                  <button
                    v-for="item in domain.items"
                    :key="`${domain.id}-${item.name}`"
                    type="button"
                    class="business-card"
                    :class="{ muted: item.ready === false }"
                    @click="openBusiness(item)"
                  >
                    <span class="business-icon">
                      <component :is="item.icon || domain.icon || activeModule.icon" class="svg-icon" />
                    </span>
                    <span class="business-copy">
                      <strong>{{ item.name }}</strong>
                      <small>{{ item.desc }}</small>
                    </span>
                    <span class="business-meta">
                      <em>{{ item.status || '进入' }}</em>
                      <ArrowRight class="svg-icon" />
                    </span>
                  </button>
                </div>
              </section>
            </div>

            <div v-else class="empty-state">
              <Search class="svg-icon" />
              <strong>没有找到匹配入口</strong>
              <span>换一个关键词再试试</span>
            </div>
          </section>
        </div>

        <aside class="context-dock">
          <section class="dock-section kpi-section">
            <div class="dock-heading">
              <span>KPI</span>
              <strong>{{ activeModule.title }}看板</strong>
            </div>
            <div class="kpi-list">
              <div v-for="item in moduleKpis" :key="item.name" class="kpi-item">
                <span>{{ item.name }}</span>
                <strong>{{ item.value }}</strong>
                <em>{{ item.trend }}</em>
              </div>
            </div>
          </section>

          <section class="dock-section">
            <div class="dock-heading">
              <span>ACTIONS</span>
              <strong>高频操作</strong>
            </div>
            <div class="quick-grid">
              <button v-for="item in quickActions" :key="item.name" type="button" @click="go(item.path)">
                <component :is="item.icon" class="svg-icon" />
                <span>{{ item.name }}</span>
              </button>
            </div>
          </section>

          <section v-if="stagedFeature" class="dock-section selected-section">
            <div class="dock-heading">
              <span>SELECTED</span>
              <strong>{{ stagedFeature.name }}</strong>
            </div>
            <p>{{ stagedFeature.desc }}</p>
            <button v-if="stagedFeature.path" type="button" class="dock-primary" @click="go(stagedFeature.path)">
              <ArrowRight class="svg-icon" />
              <span>进入业务</span>
            </button>
            <span v-else class="dock-status">{{ stagedFeature.status || '规划中' }}</span>
          </section>
        </aside>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Box,
  Briefcase,
  Calendar,
  Checked,
  Collection,
  Compass,
  Connection,
  Cpu,
  DataAnalysis,
  DocumentChecked,
  Files,
  Finished,
  Goods,
  Grid,
  Histogram,
  House,
  List,
  Memo,
  Money,
  OfficeBuilding,
  Operation,
  PieChart,
  Platform,
  Search,
  SetUp,
  Setting,
  Share,
  Ship,
  Switch,
  Tickets,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'

const router = useRouter()
const keyword = ref('')
const activeCloudId = ref('finance')
const activeModuleId = ref('finance-overview')
const activeDomainId = ref('finance-command')
const stagedFeature = ref(null)

const financeStats = [
  { label: '月结进度', value: '82%', hint: '待确认 3 项' },
  { label: '应收预警', value: '2', hint: '客户超过信用期' },
  { label: '应付待处理', value: '5', hint: '付款与暂估待办' },
  { label: '自动凭证率', value: '64%', hint: '较上月 +8%' },
]

const financeKpis = [
  { name: '现金流完整率', value: '91%', trend: '+4%' },
  { name: '应付逾期风险', value: '5', trend: '-2' },
  { name: '凭证待复核', value: '18', trend: '今日' },
]

const financeFocus = [
  { name: '凭证协同检查', status: '待处理', path: '/ledger/voucher-collaboration-check' },
  { name: '现金流勾稽', status: '进行中', path: '/ledger/cashflow-notice-check' },
  { name: '往来核销', status: '可处理', path: '/ledger/counterparty-auto-writeoff' },
]

const financeQuickActions = [
  { name: '新增凭证', path: '/ledger/voucher', icon: Tickets },
  { name: '应付单据', path: '/payable/manage', icon: Wallet },
  { name: '应收单据', path: '/receivable/manage', icon: DocumentChecked },
  { name: '资产负债表', path: '/ledger/balance-sheet', icon: DataAnalysis },
]

const clouds = [
  {
    id: 'finance',
    name: '财务云',
    short: '财',
    subtitle: 'Finance Cloud',
    kicker: 'MATRIX FINANCE',
    summary: '总账、应收、应付、报表与月结',
    icon: Money,
    accent: '#0f8a6a',
    warm: '#d09a2b',
    stats: financeStats,
    kpis: financeKpis,
    focus: financeFocus,
    quickActions: financeQuickActions,
    modules: [
      {
        id: 'finance-overview',
        title: '财务总览',
        summary: '财务云驾驶舱',
        badge: '总览',
        icon: Histogram,
        kicker: 'FINANCE DASHBOARD',
        description: '把总账、应收、应付、报表和月结放在同一个财务云工作面里，默认先看模块仪表盘，再进入具体业务。',
        searchPlaceholder: '搜索财务云入口',
        stats: financeStats,
        kpis: financeKpis,
        actions: [
          { name: '应收应付', path: '/finance', icon: Wallet, primary: true },
          { name: '月结工作台', path: '/ledger/month-end-close-workbench', icon: Calendar },
        ],
        domains: [
          {
            id: 'finance-command',
            title: '核心工作台',
            summary: '跨模块高频入口',
            kicker: 'COMMAND CENTER',
            icon: Compass,
            items: [
              { name: '应付总览', desc: '应付业务工作台', path: '/payable', icon: Wallet },
              { name: '应收总览', desc: '应收业务工作台', path: '/receivable', icon: DocumentChecked },
              { name: '总账首页', desc: '总账模块导航', path: '/ledger', icon: Tickets },
              { name: '月结工作台', desc: '月结任务统一监控', path: '/ledger/month-end-close-workbench', icon: Calendar },
              { name: '资产负债表', desc: '资产、负债与权益报表', path: '/ledger/balance-sheet', icon: DataAnalysis },
              { name: '财务基础资料', desc: '财务主数据入口', path: '/finance/base-data', icon: OfficeBuilding },
            ],
          },
        ],
      },
      {
        id: 'ledger',
        title: '总账',
        summary: '凭证、账簿、期末处理',
        icon: Tickets,
        kicker: 'GENERAL LEDGER',
        description: '总账模块以凭证为中心，连接账簿查询、现金流量、内部通知单、期末处理和基础配置。',
        searchPlaceholder: '搜索凭证、账簿、现金流、期末',
        stats: [
          { label: '本月凭证', value: '1,286', hint: '自动生成 64%' },
          { label: '待复核', value: '18', hint: '协同检查 2 项' },
          { label: '期末任务', value: '9/12', hint: '完成进度 75%' },
          { label: '现金流缺口', value: '4', hint: '需补充项目' },
        ],
        kpis: [
          { name: '凭证自动化率', value: '64%', trend: '+8%' },
          { name: '账簿勾稽差异', value: '3', trend: '待查' },
          { name: '期末完成率', value: '75%', trend: '本期' },
        ],
        actions: [
          { name: '新增凭证', path: '/ledger/voucher', icon: Tickets, primary: true },
          { name: '总账首页', path: '/ledger', icon: Grid },
        ],
        domains: [
          {
            id: 'voucher',
            title: '凭证处理',
            summary: '录入、汇总、结转',
            kicker: 'VOUCHER',
            icon: Tickets,
            items: [
              { name: '凭证', desc: '凭证录入与维护', path: '/ledger/voucher', icon: Files },
              { name: '凭证汇总表', desc: '按期间查询凭证汇总', path: '/ledger/voucher-summary', icon: DataAnalysis },
              { name: '结转清单', desc: '期末结转任务清单', path: '/ledger/carry-list', icon: Checked },
              { name: '凭证协同检查', desc: '自动凭证与人工复核', path: '/ledger/voucher-collaboration-check', icon: Connection },
              { name: '对冲凭证', desc: '往来、现金流和调整凭证对冲', path: '/ledger/offset-voucher', icon: Switch },
            ],
          },
          {
            id: 'book-query',
            title: '账簿查询',
            summary: '余额、总账、明细账',
            kicker: 'BOOK QUERY',
            icon: Collection,
            items: [
              { name: '科目余额表', desc: '科目余额与发生额查询', path: '/ledger/subject-balance', icon: List },
              { name: '总分类账', desc: '科目总账查询', path: '/ledger/general-ledger', icon: Collection },
              { name: '明细分类账', desc: '科目明细账查询', path: '/ledger/detail-ledger', icon: Files },
              { name: '日报表', desc: '日维度账务报表', path: '/ledger/daily-report', icon: Calendar },
              { name: '核算维度余额表', desc: '按核算维度查询余额', path: '/ledger/dimension-balance', icon: Grid },
              { name: '辅助总账', desc: '辅助核算总账查询', path: '/ledger/aux-general-ledger', icon: Collection },
              { name: '辅助明细账', desc: '辅助核算明细查询', path: '/ledger/aux-detail-ledger', icon: Files },
            ],
          },
          {
            id: 'cashflow',
            title: '现金流量',
            summary: '报表、查询、补充资料',
            kicker: 'CASH FLOW',
            icon: TrendCharts,
            items: [
              { name: '现金流量表', desc: '现金流入流出报表', path: '/ledger/cash-flow', icon: DataAnalysis },
              { name: '现金流量查询', desc: '现金流明细查询', path: '/ledger/cash-flow-query', icon: Search },
              { name: '现金流量补充资料', desc: '补充资料口径维护', path: '/ledger/cash-flow-supplement', icon: Memo },
              { name: '现金流量项目', desc: '现金流项目配置', path: '/ledger/cashflow-item', icon: Setting },
            ],
          },
          {
            id: 'notice',
            title: '内部通知单',
            summary: '往来与现金流通知',
            kicker: 'NOTICE',
            icon: DocumentChecked,
            items: [
              { name: '往来通知单', desc: '往来业务通知单', path: '/ledger/counterparty-notice', icon: DocumentChecked },
              { name: '往来通知单勾稽', desc: '往来通知与凭证勾稽', path: '/ledger/counterparty-notice-check', icon: Checked },
              { name: '现金流通知单', desc: '现金流业务通知单', path: '/ledger/cashflow-notice', icon: Memo },
              { name: '现金流通知单勾稽', desc: '现金流通知与凭证勾稽', path: '/ledger/cashflow-notice-check', icon: Checked },
            ],
          },
          {
            id: 'period',
            title: '期末处理',
            summary: '月结、转账、监控',
            kicker: 'PERIOD CLOSE',
            icon: Calendar,
            items: [
              { name: '月结工作台', desc: '月结任务统一监控', path: '/ledger/month-end-close-workbench', icon: Calendar },
              { name: '监控中心', desc: '期间处理状态监控', path: '/ledger/period-monitor-center', icon: TrendCharts },
              { name: '结转损益', desc: '期间损益结转', path: '/ledger/period-profit-loss', icon: Finished },
              { name: '自动转账', desc: '自动转账规则执行', path: '/ledger/period-auto-transfer', icon: Switch },
              { name: '期末调汇', desc: '外币期末重估', path: '/ledger/period-fx-revalue', icon: Money },
              { name: '期末结账', desc: '账簿封存与结账', path: '/ledger/period-close-books', icon: Checked },
            ],
          },
          {
            id: 'ledger-config',
            title: '配置中心',
            summary: '凭证、维度、初始化',
            kicker: 'CONFIGURATION',
            icon: SetUp,
            items: [
              { name: '凭证类型', desc: '凭证字与类型设置', path: '/ledger/voucher-type', icon: Tickets },
              { name: '凭证折算规则', desc: '凭证折算与协同规则', path: '/ledger/voucher-rule', icon: Setting },
              { name: '科目余额初始化', desc: '科目期初余额', path: '/ledger/opening-subject', icon: Files },
              { name: '现金流初始化', desc: '现金流期初数据', path: '/ledger/opening-cashflow', icon: TrendCharts },
              { name: '往来余额初始化', desc: '往来期初余额', path: '/ledger/opening-counterparty', icon: Wallet },
              { name: '核算维度关系设置', desc: '核算维度关联规则', path: '/ledger/base-config-dimension-relation', icon: Grid },
              { name: '核算维度值范围设置', desc: '维度值范围控制', path: '/ledger/base-config-dimension-value-range', icon: SetUp },
            ],
          },
        ],
      },
      {
        id: 'receivable',
        title: '应收',
        summary: '销售、开票、收款',
        icon: DocumentChecked,
        kicker: 'ACCOUNTS RECEIVABLE',
        description: '应收模块围绕客户、收入确认、收款结算和信用风险，提供从单据到账龄的完整工作面。',
        searchPlaceholder: '搜索应收单据、暂估、结算、账龄',
        stats: [
          { label: '本月应收', value: '¥8.42m', hint: '同比 +12%' },
          { label: '超期客户', value: '2', hint: '需跟进' },
          { label: '待结算', value: '21', hint: '销售与收款' },
          { label: '回款达成', value: '76%', hint: '本月目标' },
        ],
        kpis: [
          { name: 'DSO', value: '37 天', trend: '-3 天' },
          { name: '回款达成', value: '76%', trend: '+6%' },
          { name: '信用预警', value: '2', trend: '客户' },
        ],
        actions: [
          { name: '应收单据', path: '/receivable/manage', icon: DocumentChecked, primary: true },
          { name: '应收总览', path: '/receivable', icon: Histogram },
        ],
        domains: [
          {
            id: 'ar-docs',
            title: '单据处理',
            summary: '应收确认与收款',
            kicker: 'DOCUMENTS',
            icon: Files,
            items: [
              { name: '应收总览', desc: '应收业务工作台', path: '/receivable', icon: Histogram },
              { name: '应收单据', desc: '销售、开票与收款确认', path: '/receivable/manage', icon: Files },
              { name: '暂估应收', desc: '收入暂估与结转处理', path: '/receivable/estimate', icon: DocumentChecked },
              { name: '结算处理', desc: '收款结算与核销', path: '/receivable/settlement', icon: Wallet },
            ],
          },
          {
            id: 'ar-risk',
            title: '账龄信用',
            summary: '客户信用与账龄',
            kicker: 'RISK',
            icon: TrendCharts,
            items: [
              { name: '应收账龄预警', desc: '客户账龄与信用风险', path: '/receivable/aging-credit', icon: TrendCharts },
              { name: '账龄分析表', desc: '客户账龄结构分析', path: '/ledger/counterparty-aging-analysis', icon: DataAnalysis },
              { name: '往来多维分析表', desc: '客户往来多维分析', path: '/ledger/counterparty-multi-analysis', icon: PieChart },
            ],
          },
        ],
      },
      {
        id: 'payable',
        title: '应付',
        summary: '采购、发票、付款',
        icon: Wallet,
        kicker: 'ACCOUNTS PAYABLE',
        description: '应付模块聚合采购暂估、供应商发票、付款申请、付款执行和信用风险。',
        searchPlaceholder: '搜索应付单据、付款、暂估、账龄',
        stats: [
          { label: '本月应付', value: '¥6.18m', hint: '待付 5 笔' },
          { label: '暂估待冲回', value: '14', hint: '采购暂估' },
          { label: '付款申请', value: '9', hint: '审批中' },
          { label: '供应商预警', value: '3', hint: '账龄与信用' },
        ],
        kpis: [
          { name: '付款准时率', value: '93%', trend: '+2%' },
          { name: '暂估准确率', value: '88%', trend: '本月' },
          { name: '待付款', value: '5', trend: '今日' },
        ],
        actions: [
          { name: '应付单据', path: '/payable/manage', icon: Wallet, primary: true },
          { name: '付款申请', path: '/payable/application', icon: Money },
        ],
        domains: [
          {
            id: 'ap-docs',
            title: '单据处理',
            summary: '应付确认与暂估',
            kicker: 'DOCUMENTS',
            icon: Files,
            items: [
              { name: '应付总览', desc: '应付业务工作台', path: '/payable', icon: Histogram },
              { name: '应付单据', desc: '发票、采购与应付确认', path: '/payable/manage', icon: Files },
              { name: '暂估应付', desc: '采购暂估与冲回', path: '/payable/estimate', icon: DocumentChecked },
            ],
          },
          {
            id: 'ap-payment',
            title: '付款管理',
            summary: '申请、处理、追踪',
            kicker: 'PAYMENT',
            icon: Wallet,
            items: [
              { name: '付款申请', desc: '付款流程发起', path: '/payable/application', icon: Money },
              { name: '付款处理', desc: '付款执行与状态跟踪', path: '/payable/processing', icon: Operation },
              { name: '应付账龄预警', desc: '供应商账龄与信用风险', path: '/payable/aging-credit', icon: TrendCharts },
            ],
          },
          {
            id: 'ap-counterparty',
            title: '往来管理',
            summary: '核销、对账、查询',
            kicker: 'COUNTERPARTY',
            icon: Connection,
            items: [
              { name: '往来核销方案', desc: '核销规则与方案配置', path: '/ledger/counterparty-plan', icon: SetUp },
              { name: '往来自动核销', desc: '自动匹配与核销执行', path: '/ledger/counterparty-auto-writeoff', icon: Switch },
              { name: '往来对账单', desc: '供应商对账单', path: '/ledger/counterparty-statement', icon: DocumentChecked },
              { name: '往来账查询', desc: '供应商往来账查询', path: '/ledger/counterparty-account-query', icon: Search },
              { name: '往来核销日志', desc: '核销执行记录', path: '/ledger/counterparty-writeoff-log', icon: List },
            ],
          },
        ],
      },
      {
        id: 'reports',
        title: '报表分析',
        summary: '三大报表与指标',
        icon: TrendCharts,
        kicker: 'FINANCIAL REPORTS',
        description: '报表分析把法定报表、现金流、指标和科目映射集中到同一个财务分析工作区。',
        searchPlaceholder: '搜索资产负债表、利润表、现金流、指标',
        stats: [
          { label: '报表完成', value: '6/8', hint: '本期报表' },
          { label: '映射缺口', value: '4', hint: '科目映射' },
          { label: '指标异常', value: '2', hint: '环比波动' },
          { label: '现金流补充', value: '91%', hint: '完整率' },
        ],
        kpis: [
          { name: '毛利率', value: '31.4%', trend: '+1.2%' },
          { name: '经营现金流', value: '¥2.1m', trend: '本月' },
          { name: '资产负债率', value: '43%', trend: '-2%' },
        ],
        actions: [
          { name: '资产负债表', path: '/ledger/balance-sheet', icon: DataAnalysis, primary: true },
          { name: '报表映射', path: '/ledger/report-account-map', icon: Connection },
        ],
        domains: [
          {
            id: 'statements',
            title: '法定报表',
            summary: '三大报表与税表',
            kicker: 'STATEMENTS',
            icon: DataAnalysis,
            items: [
              { name: '资产负债表', desc: '资产、负债与权益报表', path: '/ledger/balance-sheet', icon: DataAnalysis },
              { name: '利润表', desc: '收入、成本与利润分析', path: '/ledger/profit-statement', icon: TrendCharts },
              { name: '现金流量表', desc: '现金流入流出报表', path: '/ledger/cash-flow', icon: DataAnalysis },
              { name: '企业纳税表', desc: '税务口径报表', path: '/ledger/enterprise-tax', icon: DocumentChecked },
            ],
          },
          {
            id: 'analysis',
            title: '分析配置',
            summary: '指标、项目、映射',
            kicker: 'ANALYSIS',
            icon: PieChart,
            items: [
              { name: '财务指标', desc: '经营指标分析', path: '/ledger/financial-indicators', icon: TrendCharts },
              { name: '报表项目', desc: '报表项目维护', path: '/ledger/report-item', icon: List },
              { name: '报表科目映射', desc: '报表项目与科目关系', path: '/ledger/report-account-map', icon: Connection },
              { name: '现金流量查询', desc: '现金流明细查询', path: '/ledger/cash-flow-query', icon: Search },
              { name: '现金流量补充资料', desc: '补充资料口径维护', path: '/ledger/cash-flow-supplement', icon: Memo },
            ],
          },
        ],
      },
      {
        id: 'finance-base',
        title: '财务基础',
        summary: '科目、项目、组织',
        icon: OfficeBuilding,
        kicker: 'FINANCE MASTER DATA',
        description: '财务基础服务沉淀会计科目、报表项目、现金流项目和组织建模能力。',
        searchPlaceholder: '搜索科目、项目、主数据',
        stats: [
          { label: '会计科目', value: '1,426', hint: '启用中' },
          { label: '报表项目', value: '186', hint: '已映射 93%' },
          { label: '现金流项目', value: '72', hint: '经营类 42' },
          { label: '组织单元', value: '28', hint: '集团口径' },
        ],
        kpis: [
          { name: '科目完整率', value: '98%', trend: '稳定' },
          { name: '报表映射率', value: '93%', trend: '+5%' },
          { name: '主数据待审', value: '7', trend: '今日' },
        ],
        actions: [
          { name: '会计科目', path: '/finance/base-data/account-subject', icon: Files, primary: true },
          { name: '基础资料', path: '/finance/base-data', icon: OfficeBuilding },
        ],
        domains: [
          {
            id: 'subject-data',
            title: '科目与项目',
            summary: '财务主数据',
            kicker: 'MASTER DATA',
            icon: Files,
            items: [
              { name: '财务基础资料', desc: '财务主数据入口', path: '/finance/base-data', icon: OfficeBuilding },
              { name: '会计科目', desc: '科目体系维护', path: '/finance/base-data/account-subject', icon: Files },
              { name: '报表项目', desc: '报表项目维护', path: '/ledger/report-item', icon: List },
              { name: '现金流量项目', desc: '现金流口径设置', path: '/ledger/cashflow-item', icon: TrendCharts },
              { name: '凭证类型', desc: '凭证字与类型设置', path: '/ledger/voucher-type', icon: Tickets },
            ],
          },
          {
            id: 'org-master',
            title: '组织与基础资料',
            summary: '企业建模与主数据',
            kicker: 'ORGANIZATION',
            icon: OfficeBuilding,
            items: [
              { name: '企业建模', desc: '组织与业务单元基础', path: '/enterprise-modeling', icon: OfficeBuilding },
              { name: '基础资料', desc: '全局基础资料入口', path: '/base-data', icon: Box },
              { name: '客户管理', desc: '客户主数据维护', path: '/customer', icon: Briefcase },
              { name: '供应商管理', desc: '供应商主数据维护', path: '/supplier', icon: Goods },
              { name: '币种管理', desc: '币种和汇率基础', path: '/currency', icon: Money },
              { name: '汇率管理', desc: '汇率维护与生效', path: '/exchange-rate', icon: TrendCharts },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'supply',
    name: '供应链云',
    short: '供',
    subtitle: 'Supply Chain Cloud',
    kicker: 'MATRIX SUPPLY',
    summary: '采购、库存、销售与履约',
    icon: Ship,
    accent: '#3f6f9a',
    warm: '#c26d36',
    stats: [
      { label: '采购订单', value: '128', hint: '规划中' },
      { label: '库存周转', value: '42 天', hint: '规划中' },
      { label: '履约异常', value: '6', hint: '规划中' },
      { label: '供应商协同', value: '73%', hint: '规划中' },
    ],
    kpis: [
      { name: '准时交付', value: '92%', trend: '目标' },
      { name: '库存健康', value: 'B+', trend: '规划' },
      { name: '采购节省', value: '3.2%', trend: '目标' },
    ],
    focus: [
      { name: '采购协同', status: '规划中' },
      { name: '库存预警', status: '规划中' },
      { name: '订单履约', status: '规划中' },
    ],
    quickActions: [
      { name: '采购订单', icon: Memo },
      { name: '库存看板', icon: Box },
      { name: '销售订单', icon: Goods },
      { name: '供应商协同', icon: Connection },
    ],
    modules: [
      {
        id: 'supply-overview',
        title: '供应链总览',
        summary: '采购、库存、销售',
        badge: '规划',
        icon: Ship,
        kicker: 'SUPPLY DASHBOARD',
        description: '供应链云将承接采购、库存、销售订单和履约协同，和财务云形成业务财务一体化链路。',
        actions: [],
        domains: [
          {
            id: 'supply-core',
            title: '核心业务',
            summary: '采购到付款、订单到收款',
            kicker: 'CORE',
            icon: Goods,
            items: [
              { name: '采购订单', desc: '采购申请、订单与到货协同', icon: Memo, ready: false, status: '规划中' },
              { name: '库存看板', desc: '库存余额、批次和周转分析', icon: Box, ready: false, status: '规划中' },
              { name: '销售订单', desc: '销售订单、发货和收入衔接', icon: Goods, ready: false, status: '规划中' },
              { name: '供应商协同', desc: '供应商确认、交付和质量协同', icon: Connection, ready: false, status: '规划中' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'shared',
    name: '共享云',
    short: '享',
    subtitle: 'Shared Service Cloud',
    kicker: 'MATRIX SHARED',
    summary: '共享运营、任务中心与服务履约',
    icon: Share,
    accent: '#6c5f9d',
    warm: '#d08a2f',
    stats: [
      { label: '共享任务', value: '316', hint: '今日队列' },
      { label: 'SLA 达成', value: '96%', hint: '本月' },
      { label: '待派单', value: '18', hint: '跨组织' },
      { label: '自动处理', value: '58%', hint: '目标 70%' },
    ],
    kpis: [
      { name: 'SLA', value: '96%', trend: '+1%' },
      { name: '平均处理', value: '2.4h', trend: '-0.3h' },
      { name: '自动化', value: '58%', trend: '提升中' },
    ],
    focus: [
      { name: '共享运营管理', status: '可用', path: '/shared/operations' },
      { name: '任务分派', status: '规划中' },
      { name: '服务目录', status: '规划中' },
    ],
    quickActions: [
      { name: '运营管理', path: '/shared/operations', icon: Operation },
      { name: '任务队列', icon: List },
      { name: '服务目录', icon: Grid },
      { name: 'SLA 看板', icon: TrendCharts },
    ],
    modules: [
      {
        id: 'shared-operations',
        title: '共享运营',
        summary: '任务、SLA、服务目录',
        badge: '可用',
        icon: Operation,
        kicker: 'SHARED OPERATIONS',
        description: '共享云负责把跨部门、跨公司的财务与业务任务统一纳入服务履约和运营监控。',
        actions: [
          { name: '运营管理', path: '/shared/operations', icon: Operation, primary: true },
        ],
        domains: [
          {
            id: 'shared-service',
            title: '服务运营',
            summary: '任务队列与服务履约',
            kicker: 'SERVICE',
            icon: Operation,
            items: [
              { name: '共享运营管理', desc: '共享服务运营工作台', path: '/shared/operations', icon: Operation },
              { name: '任务队列', desc: '跨组织任务池与派单', icon: List, ready: false, status: '规划中' },
              { name: '服务目录', desc: '共享服务产品和 SLA', icon: Grid, ready: false, status: '规划中' },
              { name: '机器人处理中心', desc: '自动化任务与异常回退', icon: Cpu, ready: false, status: '规划中' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'base-service',
    name: '基础服务云',
    short: '基',
    subtitle: 'Foundation Cloud',
    kicker: 'MATRIX FOUNDATION',
    summary: '组织、主数据、权限与集成',
    icon: Platform,
    accent: '#56636f',
    warm: '#b98234',
    stats: [
      { label: '组织单元', value: '28', hint: '集团口径' },
      { label: '主数据对象', value: '11', hint: '可维护' },
      { label: '集成接口', value: '24', hint: '规划中' },
      { label: '权限角色', value: '16', hint: '规划中' },
    ],
    kpis: [
      { name: '主数据完整率', value: '97%', trend: '稳定' },
      { name: '接口健康', value: '99%', trend: '目标' },
      { name: '角色覆盖', value: '16', trend: '规划' },
    ],
    focus: [
      { name: '企业建模', status: '可用', path: '/enterprise-modeling' },
      { name: '基础资料', status: '可用', path: '/base-data' },
      { name: '集成中心', status: '规划中' },
    ],
    quickActions: [
      { name: '企业建模', path: '/enterprise-modeling', icon: OfficeBuilding },
      { name: '基础资料', path: '/base-data', icon: Box },
      { name: '客户', path: '/customer', icon: Briefcase },
      { name: '供应商', path: '/supplier', icon: Goods },
    ],
    modules: [
      {
        id: 'foundation-master',
        title: '主数据服务',
        summary: '组织、客户、供应商',
        badge: '可用',
        icon: Platform,
        kicker: 'MASTER DATA',
        description: '基础服务云提供组织建模、客户供应商、币种汇率等公共能力，给各个业务云复用。',
        actions: [
          { name: '企业建模', path: '/enterprise-modeling', icon: OfficeBuilding, primary: true },
          { name: '基础资料', path: '/base-data', icon: Box },
        ],
        domains: [
          {
            id: 'foundation-org',
            title: '组织建模',
            summary: '企业组织与业务单元',
            kicker: 'ORGANIZATION',
            icon: OfficeBuilding,
            items: [
              { name: '企业建模', desc: '组织建模入口', path: '/enterprise-modeling', icon: OfficeBuilding },
              { name: '人员管理', desc: '人员主数据维护', path: '/personal', icon: Briefcase },
              { name: '业务单元管理', desc: '业务单元与公司结构', path: '/business-unit', icon: Platform },
              { name: '部门维度管理', desc: '部门核算维度维护', path: '/department-dimension', icon: Grid },
              { name: '组织职能类型管理', desc: '职能类型维护', path: '/org-function-type', icon: SetUp },
            ],
          },
          {
            id: 'foundation-data',
            title: '基础资料',
            summary: '客户、供应商、物料、币种',
            kicker: 'BASE DATA',
            icon: Box,
            items: [
              { name: '基础资料', desc: '全局基础资料入口', path: '/base-data', icon: Box },
              { name: '物料管理', desc: '物料主数据维护', path: '/material', icon: Goods },
              { name: '客户管理', desc: '客户主数据维护', path: '/customer', icon: Briefcase },
              { name: '供应商管理', desc: '供应商主数据维护', path: '/supplier', icon: Goods },
              { name: '币种管理', desc: '币种基础数据', path: '/currency', icon: Money },
              { name: '汇率管理', desc: '汇率维护与生效', path: '/exchange-rate', icon: TrendCharts },
              { name: '银行信息', desc: '行名行号与银行基础资料', path: '/bank-info', icon: Collection },
            ],
          },
        ],
      },
    ],
  },
]

const activeCloud = computed(() => clouds.find((cloud) => cloud.id === activeCloudId.value) || clouds[0])

const activeModule = computed(() => (
  activeCloud.value.modules.find((module) => module.id === activeModuleId.value) || activeCloud.value.modules[0]
))

const currentDomains = computed(() => activeModule.value?.domains || [])

const activeDomain = computed(() => (
  currentDomains.value.find((domain) => domain.id === activeDomainId.value) || currentDomains.value[0] || null
))

const activeStats = computed(() => (
  activeModule.value?.stats?.length ? activeModule.value.stats : activeCloud.value.stats
))

const moduleKpis = computed(() => (
  activeModule.value?.kpis?.length ? activeModule.value.kpis : activeCloud.value.kpis
))

const focusItems = computed(() => activeCloud.value.focus || financeFocus)

const quickActions = computed(() => (
  activeModule.value?.quickActions?.length ? activeModule.value.quickActions : activeCloud.value.quickActions
))

const visibleDomains = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return activeDomain.value ? [activeDomain.value] : currentDomains.value
  }

  return currentDomains.value
    .map((domain) => ({
      ...domain,
      items: domain.items.filter((item) => {
        const text = `${item.name} ${item.desc} ${domain.title} ${domain.summary}`.toLowerCase()
        return text.includes(search)
      }),
    }))
    .filter((domain) => domain.items.length > 0)
})

const totalVisibleItems = computed(() => (
  visibleDomains.value.reduce((total, domain) => total + domain.items.length, 0)
))

function selectCloud(cloud) {
  activeCloudId.value = cloud.id
  activeModuleId.value = cloud.modules[0]?.id || ''
  activeDomainId.value = cloud.modules[0]?.domains?.[0]?.id || ''
  keyword.value = ''
  stagedFeature.value = null
}

function selectModule(module) {
  activeModuleId.value = module.id
  activeDomainId.value = module.domains?.[0]?.id || ''
  keyword.value = ''
  stagedFeature.value = null
}

function selectDomain(domain) {
  activeDomainId.value = domain.id
  keyword.value = ''
  stagedFeature.value = null
}

function openBusiness(item) {
  if (item.path) {
    go(item.path)
    return
  }
  stagedFeature.value = item
}

function go(path) {
  if (!path) return
  router.push(path)
}
</script>

<style scoped>
.matrix-app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 76px 292px minmax(0, 1fr);
  color: #17202c;
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 30%),
    radial-gradient(circle at 96% 4%, color-mix(in srgb, var(--warm) 13%, transparent), transparent 26%),
    linear-gradient(180deg, #f8fbfa 0%, #edf3f2 100%);
}

.svg-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

button {
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.cloud-rail {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 22px;
  padding: 16px 12px;
  background: linear-gradient(180deg, #162328 0%, #0f1a1f 100%);
  box-shadow: 18px 0 45px rgba(18, 32, 40, 0.12);
  z-index: 3;
}

.rail-brand,
.rail-tool,
.cloud-stack button {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 8px;
}

.rail-brand {
  color: #ffffff;
  background: linear-gradient(135deg, #0f8a6a 0%, #2b7f99 60%, #d09a2b 100%);
  box-shadow: 0 14px 28px rgba(15, 138, 106, 0.28);
  font-size: 22px;
  font-weight: 900;
}

.cloud-stack {
  display: grid;
  align-content: start;
  gap: 10px;
}

.cloud-stack button,
.rail-tool {
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.07);
}

.cloud-stack button {
  gap: 3px;
  font-size: 11px;
  font-weight: 800;
}

.cloud-stack button .svg-icon {
  width: 20px;
  height: 20px;
}

.cloud-stack button.active {
  color: #ffffff;
  background: color-mix(in srgb, var(--accent) 72%, #ffffff 10%);
}

.rail-tool {
  align-self: end;
}

.module-panel {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 16px;
  padding: 20px 18px;
  border-right: 1px solid rgba(27, 45, 57, 0.08);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(20px);
}

.panel-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cloud-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 65%, var(--warm)));
}

.panel-brand strong,
.panel-brand span,
.cloud-summary span,
.cloud-summary strong {
  display: block;
}

.panel-brand strong {
  font-size: 18px;
}

.panel-brand span {
  margin-top: 2px;
  color: #6b7785;
  font-size: 12px;
}

.cloud-summary {
  padding: 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, #ffffff);
}

.cloud-summary span,
.panel-title span,
.dock-heading span,
.section-heading span {
  color: color-mix(in srgb, var(--accent) 82%, #17202c);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.cloud-summary strong {
  margin-top: 6px;
  color: #17202c;
  line-height: 1.45;
}

.module-list {
  display: grid;
  align-content: start;
  gap: 8px;
  overflow-y: auto;
  padding-right: 2px;
}

.module-list button {
  min-height: 68px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: transparent;
  text-align: left;
}

.module-list button.active,
.module-list button:hover {
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(34, 53, 73, 0.08);
}

.module-list-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 11%, #ffffff);
}

.module-list-copy {
  min-width: 0;
}

.module-list-copy strong,
.module-list-copy small {
  display: block;
}

.module-list-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.module-list-copy small {
  margin-top: 3px;
  overflow: hidden;
  color: #6c7783;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-list em {
  padding: 3px 7px;
  border-radius: 999px;
  color: color-mix(in srgb, var(--accent) 76%, #17202c);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
}

.panel-focus {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid rgba(27, 45, 57, 0.08);
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title strong {
  font-size: 15px;
}

.focus-list {
  display: grid;
  gap: 8px;
}

.focus-list button {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 10px;
  border-radius: 8px;
  background: #f5f8f7;
}

.focus-list span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 800;
}

.focus-list em {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--accent) 78%, #17202c);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.workspace {
  min-width: 0;
  padding: 18px 22px 28px;
}

.workspace-topbar {
  min-height: 50px;
  display: grid;
  grid-template-columns: minmax(260px, auto) minmax(280px, 1fr) auto;
  gap: 14px;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #6b7785;
}

.breadcrumb button {
  max-width: 170px;
  overflow: hidden;
  padding: 0;
  color: #2a3541;
  background: transparent;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb span {
  color: #9aa5af;
}

.global-search {
  min-width: 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid rgba(27, 45, 57, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(34, 53, 73, 0.06);
}

.global-search .svg-icon {
  color: #7d8994;
}

.global-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
}

.workspace-actions {
  display: flex;
  gap: 10px;
}

.workspace-actions button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border: 1px solid rgba(27, 45, 57, 0.1);
  border-radius: 8px;
  background: #ffffff;
  font-weight: 800;
}

.workspace-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 318px;
  gap: 18px;
  margin-top: 16px;
}

.work-area {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 16px;
}

.overview-band {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 480px);
  gap: 22px;
  align-items: stretch;
  padding: 28px;
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent) 96%, #16313a) 0%, color-mix(in srgb, var(--accent) 74%, #2d5f6a) 54%, #20313a 100%);
  box-shadow: 0 20px 52px rgba(26, 42, 58, 0.15);
}

.overview-copy span {
  color: color-mix(in srgb, var(--warm) 52%, #ffffff);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.overview-copy h1 {
  margin: 8px 0 10px;
  font-size: 34px;
  line-height: 1.12;
}

.overview-copy p {
  max-width: 780px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;
  line-height: 1.8;
}

.overview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.primary-action,
.plain-action,
.dock-primary {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 900;
}

.primary-action {
  color: #17202c;
  background: #ffffff;
}

.plain-action {
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  min-height: 104px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 8px;
  background: rgba(9, 24, 30, 0.24);
}

.metric-card span,
.metric-card small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.metric-card strong {
  color: #ffffff;
  font-size: 27px;
  line-height: 1;
}

.metric-card small {
  color: color-mix(in srgb, var(--warm) 46%, #ffffff);
}

.domain-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.domain-strip button {
  min-height: 76px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(27, 45, 57, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  text-align: left;
}

.domain-strip button.active,
.domain-strip button:hover {
  border-color: color-mix(in srgb, var(--accent) 26%, transparent);
  background: color-mix(in srgb, var(--accent) 9%, #ffffff);
}

.domain-strip button > .svg-icon {
  color: var(--accent);
}

.domain-strip strong,
.domain-strip small {
  display: block;
}

.domain-strip strong {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-strip small {
  margin-top: 4px;
  overflow: hidden;
  color: #6c7783;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-strip em {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.business-board {
  min-width: 0;
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.section-heading,
.group-heading,
.dock-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.section-heading {
  align-items: end;
}

.section-heading h2 {
  margin: 3px 0 0;
  font-size: 22px;
}

.section-heading small {
  color: #7b8793;
}

.business-groups {
  display: grid;
  gap: 18px;
}

.business-group {
  display: grid;
  gap: 10px;
}

.group-heading {
  align-items: center;
  padding-top: 4px;
}

.group-heading strong {
  font-size: 15px;
}

.group-heading span {
  color: #77828e;
  font-size: 12px;
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.business-card {
  min-height: 112px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: #f8faf9;
  text-align: left;
}

.business-card:hover {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 7%, #ffffff);
  transform: translateY(-1px);
}

.business-card.muted {
  color: #6b7785;
}

.business-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
}

.business-copy {
  min-width: 0;
}

.business-copy strong,
.business-copy small {
  display: block;
}

.business-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}

.business-copy small {
  margin-top: 5px;
  color: #687582;
  font-size: 12px;
  line-height: 1.5;
}

.business-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
  color: #8a96a1;
}

.business-meta em {
  color: color-mix(in srgb, var(--accent) 78%, #17202c);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.empty-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #72808c;
}

.empty-state .svg-icon {
  width: 28px;
  height: 28px;
}

.empty-state strong {
  color: #2a3541;
}

.context-dock {
  display: grid;
  align-content: start;
  gap: 14px;
}

.dock-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
}

.dock-heading {
  align-items: end;
}

.dock-heading strong {
  font-size: 18px;
}

.kpi-list {
  display: grid;
  gap: 10px;
}

.kpi-item {
  min-height: 62px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px 10px;
  padding: 12px;
  border-radius: 8px;
  background: #f7f9fa;
}

.kpi-item span {
  color: #64717d;
  font-size: 12px;
}

.kpi-item strong {
  color: #17202c;
  font-size: 20px;
}

.kpi-item em {
  grid-column: 2;
  grid-row: 1 / span 2;
  color: color-mix(in srgb, var(--accent) 82%, #17202c);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-grid button {
  min-height: 74px;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: #f7f9fa;
  font-weight: 900;
}

.quick-grid button:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, #ffffff);
}

.quick-grid span {
  max-width: 100%;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-section p {
  margin: 0;
  color: #667482;
  font-size: 13px;
  line-height: 1.6;
}

.dock-primary {
  justify-content: center;
  color: #ffffff;
  background: var(--accent);
}

.dock-status {
  display: inline-flex;
  justify-content: center;
  padding: 8px 10px;
  border-radius: 8px;
  color: color-mix(in srgb, var(--accent) 78%, #17202c);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
  font-size: 13px;
  font-weight: 900;
}

@media (max-width: 1280px) {
  .matrix-app-shell {
    grid-template-columns: 72px 260px minmax(0, 1fr);
  }

  .workspace-main {
    grid-template-columns: 1fr;
  }

  .context-dock {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .selected-section {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1080px) {
  .overview-band {
    grid-template-columns: 1fr;
  }

  .business-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .matrix-app-shell {
    grid-template-columns: 1fr;
  }

  .cloud-rail {
    min-height: auto;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto;
    align-items: center;
    padding: 10px 12px;
  }

  .cloud-stack {
    grid-auto-flow: column;
    grid-auto-columns: 52px;
    overflow-x: auto;
  }

  .module-panel {
    grid-template-rows: auto auto;
    gap: 12px;
    padding: 14px;
  }

  .cloud-summary,
  .panel-focus {
    display: none;
  }

  .module-list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .module-list button {
    min-width: 190px;
  }

  .workspace {
    padding: 14px;
  }

  .workspace-topbar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .module-list,
  .context-dock,
  .metric-grid,
  .business-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .overview-band,
  .business-board {
    padding: 18px;
  }

  .overview-copy h1 {
    font-size: 28px;
  }

  .domain-strip {
    grid-template-columns: 1fr;
  }

  .business-card {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .business-meta {
    grid-column: 1 / -1;
    grid-template-columns: 1fr auto;
    align-items: center;
    justify-items: start;
  }

  .workspace-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-actions button {
    justify-content: center;
  }
}
</style>
