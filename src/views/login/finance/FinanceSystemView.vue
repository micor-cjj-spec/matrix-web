<template>
  <main class="finance-shell">
    <header class="finance-topbar">
      <button type="button" class="brand-block" @click="router.push('/portal')">
        <span class="brand-mark">M</span>
        <span>
          <strong>Matrix Finance</strong>
          <small>财务系统</small>
        </span>
      </button>

      <label class="finance-search" aria-label="搜索财务模块">
        <Search class="svg-icon" />
        <input v-model="keyword" type="search" placeholder="搜索总账、应收、应付、报表" />
      </label>

      <div class="top-actions">
        <button type="button" @click="router.push('/portal')">
          <House class="svg-icon" />
          <span>工作台</span>
        </button>
        <button type="button" @click="router.push('/ledger/month-end-close-workbench')">
          <Calendar class="svg-icon" />
          <span>月结</span>
        </button>
      </div>
    </header>

    <section class="finance-hero">
      <div class="hero-copy">
        <span class="eyebrow">Finance System</span>
        <h1>财务系统总览</h1>
        <p>从这里进入总账、应收、应付、报表、月结和财务基础资料，不再把财务系统等同于单一总账页面。</p>
        <div class="hero-actions">
          <button type="button" class="primary-action" @click="router.push('/payable')">
            <Wallet class="svg-icon" />
            <span>应付管理</span>
          </button>
          <button type="button" class="secondary-action" @click="router.push('/receivable')">
            <DocumentChecked class="svg-icon" />
            <span>应收管理</span>
          </button>
          <button type="button" class="secondary-action" @click="router.push('/ledger')">
            <Tickets class="svg-icon" />
            <span>总账模块</span>
          </button>
        </div>
      </div>

      <div class="hero-metrics">
        <div v-for="metric in metrics" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.hint }}</small>
        </div>
      </div>
    </section>

    <section class="finance-layout">
      <aside class="section-nav">
        <button
          v-for="section in filteredSections"
          :key="section.id"
          type="button"
          :class="{ active: activeSection === section.id }"
          @click="activeSection = section.id"
        >
          <component :is="section.icon" class="svg-icon" />
          <span>{{ section.title }}</span>
        </button>
      </aside>

      <section class="module-board">
        <section
          v-for="section in visibleSections"
          :key="section.id"
          class="module-section"
        >
          <div class="section-heading">
            <div>
              <span>{{ section.subtitle }}</span>
              <h2>{{ section.title }}</h2>
            </div>
            <small>{{ section.modules.length }} 个入口</small>
          </div>

          <div class="module-grid">
            <button
              v-for="module in section.modules"
              :key="module.name"
              type="button"
              class="module-card"
              @click="router.push(module.path)"
            >
              <span class="module-icon" :style="{ '--accent': section.accent }">
                <component :is="module.icon || section.icon" class="svg-icon" />
              </span>
              <span class="module-copy">
                <strong>{{ module.name }}</strong>
                <small>{{ module.desc }}</small>
              </span>
              <ArrowRight class="svg-icon arrow-icon" />
            </button>
          </div>
        </section>
      </section>

      <aside class="insight-panel">
        <section class="panel-card">
          <div class="panel-heading">
            <span>Period Close</span>
            <h2>月结关注</h2>
          </div>
          <div class="close-list">
            <div v-for="item in closeItems" :key="item.name" class="close-item">
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.desc }}</span>
              </div>
              <em>{{ item.status }}</em>
            </div>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-heading">
            <span>Shortcuts</span>
            <h2>高频操作</h2>
          </div>
          <div class="shortcut-grid">
            <button v-for="item in shortcuts" :key="item.name" type="button" @click="router.push(item.path)">
              <component :is="item.icon" class="svg-icon" />
              <span>{{ item.name }}</span>
            </button>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Calendar,
  DataAnalysis,
  DocumentChecked,
  Files,
  House,
  OfficeBuilding,
  Search,
  Tickets,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'

const router = useRouter()
const keyword = ref('')
const activeSection = ref('arap')

const metrics = [
  { label: '月结进度', value: '82%', hint: '待确认 3 项' },
  { label: '应收预警', value: '2', hint: '客户超过信用期' },
  { label: '应付待处理', value: '5', hint: '付款与暂估待办' },
  { label: '自动凭证率', value: '64%', hint: '较上月 +8%' },
]

const sections = [
  {
    id: 'arap',
    title: '应收应付',
    subtitle: 'AR / AP',
    icon: Wallet,
    accent: '#0f8a6a',
    modules: [
      { name: '应付总览', desc: '应付业务工作台', path: '/payable', icon: Wallet },
      { name: '应付单据', desc: '发票、采购与应付确认', path: '/payable/manage', icon: Files },
      { name: '暂估应付', desc: '采购暂估与冲回', path: '/payable/estimate', icon: DocumentChecked },
      { name: '付款申请', desc: '付款流程发起', path: '/payable/application', icon: Wallet },
      { name: '付款处理', desc: '付款执行与状态跟踪', path: '/payable/processing', icon: Tickets },
      { name: '应付账龄预警', desc: '供应商账龄与信用风险', path: '/payable/aging-credit', icon: TrendCharts },
      { name: '应收总览', desc: '应收业务工作台', path: '/receivable', icon: DocumentChecked },
      { name: '应收单据', desc: '销售、开票与收款确认', path: '/receivable/manage', icon: Files },
      { name: '暂估应收', desc: '收入暂估与结转处理', path: '/receivable/estimate', icon: DocumentChecked },
      { name: '结算处理', desc: '收款结算与核销', path: '/receivable/settlement', icon: Wallet },
      { name: '应收账龄预警', desc: '客户账龄与信用风险', path: '/receivable/aging-credit', icon: TrendCharts },
    ],
  },
  {
    id: 'ledger',
    title: '总账与月结',
    subtitle: 'GL / Close',
    icon: Tickets,
    accent: '#1769aa',
    modules: [
      { name: '总账首页', desc: '总账模块导航', path: '/ledger', icon: Tickets },
      { name: '凭证', desc: '凭证录入与维护', path: '/ledger/voucher', icon: Files },
      { name: '凭证汇总表', desc: '按期间查询凭证汇总', path: '/ledger/voucher-summary', icon: DataAnalysis },
      { name: '结转清单', desc: '期末结转任务清单', path: '/ledger/carry-list', icon: DocumentChecked },
      { name: '月结工作台', desc: '月结任务统一监控', path: '/ledger/month-end-close-workbench', icon: Calendar },
      { name: '监控中心', desc: '期间处理状态监控', path: '/ledger/period-monitor-center', icon: TrendCharts },
    ],
  },
  {
    id: 'report',
    title: '报表分析',
    subtitle: 'Reports',
    icon: TrendCharts,
    accent: '#b7791f',
    modules: [
      { name: '资产负债表', desc: '资产、负债与权益报表', path: '/ledger/balance-sheet', icon: DataAnalysis },
      { name: '利润表', desc: '收入、成本与利润分析', path: '/ledger/profit-statement', icon: TrendCharts },
      { name: '现金流量表', desc: '现金流入流出报表', path: '/ledger/cash-flow', icon: DataAnalysis },
      { name: '现金流量查询', desc: '现金流明细查询', path: '/ledger/cash-flow-query', icon: Search },
      { name: '企业纳税表', desc: '税务口径报表', path: '/ledger/enterprise-tax', icon: DocumentChecked },
      { name: '财务指标', desc: '经营指标分析', path: '/ledger/financial-indicators', icon: TrendCharts },
      { name: '报表科目映射', desc: '报表项目与科目关系', path: '/ledger/report-account-map', icon: Files },
    ],
  },
  {
    id: 'base',
    title: '财务基础',
    subtitle: 'Master Data',
    icon: OfficeBuilding,
    accent: '#56636f',
    modules: [
      { name: '财务基础资料', desc: '财务主数据入口', path: '/finance/base-data', icon: OfficeBuilding },
      { name: '会计科目', desc: '科目体系维护', path: '/finance/base-data/account-subject', icon: Files },
      { name: '报表项目', desc: '报表项目设置', path: '/ledger/report-item', icon: DataAnalysis },
      { name: '现金流量项目', desc: '现金流口径设置', path: '/ledger/cashflow-item', icon: Wallet },
      { name: '凭证类型', desc: '凭证字与类型设置', path: '/ledger/voucher-type', icon: Tickets },
      { name: '企业建模', desc: '组织与业务单元基础', path: '/enterprise-modeling', icon: OfficeBuilding },
    ],
  },
]

const closeItems = [
  { name: '凭证协同检查', desc: '自动凭证仍有 2 条待复核', status: '待处理' },
  { name: '现金流勾稽', desc: '经营活动现金流待补充', status: '进行中' },
  { name: '往来核销', desc: '应收应付核销任务可执行', status: '可处理' },
]

const shortcuts = [
  { name: '新增凭证', path: '/ledger/voucher', icon: Tickets },
  { name: '应付单据', path: '/payable/manage', icon: Wallet },
  { name: '应收单据', path: '/receivable/manage', icon: DocumentChecked },
  { name: '资产负债表', path: '/ledger/balance-sheet', icon: DataAnalysis },
]

const filteredSections = computed(() => {
  const search = keyword.value.trim()
  if (!search) return sections

  return sections
    .map((section) => ({
      ...section,
      modules: section.modules.filter((module) => (
        module.name.includes(search) || module.desc.includes(search) || section.title.includes(search)
      )),
    }))
    .filter((section) => section.modules.length > 0)
})

const visibleSections = computed(() => {
  const available = filteredSections.value
  const selected = available.find((section) => section.id === activeSection.value)
  if (keyword.value.trim()) return available
  return selected ? [selected] : available.slice(0, 1)
})
</script>

<style scoped>
.finance-shell {
  min-height: 100vh;
  padding: 18px 22px 34px;
  color: #17202c;
  background:
    radial-gradient(circle at 12% 0%, rgba(15, 138, 106, 0.11), transparent 32%),
    radial-gradient(circle at 92% 8%, rgba(183, 121, 31, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbfa 0%, #eef4f4 100%);
}

.svg-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.finance-topbar {
  min-height: 56px;
  display: grid;
  grid-template-columns: minmax(220px, 310px) minmax(280px, 1fr) auto;
  gap: 16px;
  align-items: center;
}

.brand-block,
.top-actions button,
.primary-action,
.secondary-action,
.section-nav button,
.module-card,
.shortcut-grid button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  color: inherit;
  background: transparent;
  text-align: left;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  background: linear-gradient(135deg, #0d5f69 0%, #0f8a6a 58%, #d6a23a 100%);
  box-shadow: 0 12px 28px rgba(15, 138, 106, 0.22);
  font-size: 22px;
  font-weight: 800;
}

.brand-block strong,
.brand-block small {
  display: block;
}

.brand-block strong {
  font-size: 18px;
}

.brand-block small {
  color: #667482;
  font-size: 12px;
}

.finance-search {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid rgba(28, 44, 61, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 30px rgba(34, 53, 73, 0.06);
}

.finance-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #17202c;
  background: transparent;
}

.finance-search .svg-icon {
  color: #7f8d99;
}

.top-actions {
  display: flex;
  gap: 10px;
}

.top-actions button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border-radius: 8px;
  color: #354151;
  background: #ffffff;
  border: 1px solid rgba(28, 44, 61, 0.1);
}

.finance-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 520px);
  gap: 22px;
  margin-top: 18px;
  padding: 34px;
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(13, 95, 105, 0.97) 0%, rgba(15, 138, 106, 0.9) 52%, rgba(35, 65, 76, 0.98) 100%);
  box-shadow: 0 22px 58px rgba(26, 42, 58, 0.16);
}

.eyebrow {
  color: #b7ead8;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 10px 0 12px;
  font-size: 42px;
  line-height: 1.12;
}

.hero-copy p {
  max-width: 760px;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.primary-action,
.secondary-action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 18px;
  border-radius: 8px;
}

.primary-action {
  color: #173126;
  background: #b7ead8;
}

.secondary-action {
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  min-height: 104px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(8, 27, 33, 0.28);
}

.metric-card span,
.metric-card small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.metric-card strong {
  color: #ffffff;
  font-size: 30px;
  line-height: 1;
}

.metric-card small {
  color: #b7ead8;
}

.finance-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) 330px;
  gap: 18px;
  margin-top: 22px;
}

.section-nav {
  position: sticky;
  top: 18px;
  align-self: start;
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
}

.section-nav button {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 8px;
  color: #53606d;
  background: transparent;
  text-align: left;
}

.section-nav button.active,
.section-nav button:hover {
  color: #0d5f69;
  background: rgba(15, 138, 106, 0.12);
  font-weight: 800;
}

.module-board {
  min-width: 0;
}

.module-section,
.panel-card {
  padding: 18px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 38px rgba(34, 53, 73, 0.07);
}

.section-heading,
.panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-heading span,
.panel-heading span {
  display: block;
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.section-heading h2,
.panel-heading h2 {
  margin: 2px 0 0;
  font-size: 22px;
}

.section-heading small {
  color: #7a8794;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.module-card {
  min-height: 112px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  border-radius: 8px;
  color: #17202c;
  background: #f8faf9;
  text-align: left;
}

.module-card:hover {
  border-color: rgba(15, 138, 106, 0.34);
  background: #edf6f3;
}

.module-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, #ffffff);
}

.module-copy {
  min-width: 0;
}

.module-copy strong,
.module-copy small {
  display: block;
}

.module-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}

.module-copy small {
  margin-top: 4px;
  color: #667482;
  font-size: 12px;
  line-height: 1.45;
}

.arrow-icon {
  color: #8b96a1;
}

.insight-panel {
  display: grid;
  align-content: start;
  gap: 16px;
}

.close-list {
  display: grid;
  gap: 10px;
}

.close-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f7f9fa;
}

.close-item strong,
.close-item span {
  display: block;
}

.close-item strong {
  font-size: 14px;
}

.close-item span {
  margin-top: 4px;
  color: #667482;
  font-size: 12px;
}

.close-item em {
  flex: 0 0 auto;
  color: #0d6c5a;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.shortcut-grid button {
  min-height: 74px;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  color: #263443;
  background: #f7f9fa;
}

.shortcut-grid button:hover {
  color: #0d5f69;
  background: #edf6f3;
}

.shortcut-grid span {
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 1240px) {
  .finance-layout {
    grid-template-columns: 180px minmax(0, 1fr);
  }

  .insight-panel {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .finance-topbar {
    grid-template-columns: 1fr;
  }

  .finance-hero,
  .finance-layout,
  .insight-panel {
    grid-template-columns: 1fr;
  }

  .section-nav {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .module-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .finance-shell {
    padding: 14px;
  }

  .finance-hero {
    padding: 24px 18px;
  }

  .hero-copy h1 {
    font-size: 32px;
  }

  .hero-metrics,
  .section-nav,
  .shortcut-grid {
    grid-template-columns: 1fr;
  }

  .top-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .top-actions button {
    justify-content: center;
  }
}
</style>
