<template>
  <main class="matrix-shell">
    <aside class="side-nav">
      <div class="brand">
        <div class="brand-mark">M</div>
        <div class="brand-copy">
          <strong>Matrix</strong>
          <span>企业智能工作台</span>
        </div>
      </div>

      <nav class="nav-group" aria-label="Matrix 主导航">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="nav-item"
          :class="{ active: activeNav === item.key, disabled: item.disabled }"
          :title="item.label"
          @click="handleNav(item)"
        >
          <component :is="item.icon" class="svg-icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="side-status">
        <div class="status-dot"></div>
        <div>
          <span>平台运行正常</span>
          <strong>99.98%</strong>
        </div>
      </div>

      <button type="button" class="logout-link" @click="handleLogout">
        <SwitchButton class="svg-icon" />
        <span>退出登录</span>
      </button>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="page-title">
          <span>{{ currentDate }}</span>
          <strong>个人工作台</strong>
        </div>

        <label class="search-box" aria-label="搜索业务、知识与单据">
          <Search class="svg-icon" />
          <input v-model="searchKeyword" type="search" placeholder="搜索业务、知识与单据" />
        </label>

        <div class="top-actions">
          <button type="button" class="icon-button" title="新建事项" @click="showToast('统一新建入口正在接入')">
            <Plus class="svg-icon" />
          </button>
          <button type="button" class="icon-button" title="通知中心" @click="showToast('你有 3 条新的平台通知')">
            <Bell class="svg-icon" />
            <span class="notice-badge"></span>
          </button>
          <button type="button" class="avatar-button" title="个人中心" @click="showToast('个人中心正在设计中')">
            <span>林</span>
            <div>
              <strong>林澈</strong>
              <small>财务共享中心</small>
            </div>
          </button>
        </div>
      </header>

      <section class="hero-band" aria-label="Matrix 工作台概览">
        <img src="/assets/matrix-workbench-hero.png" alt="Matrix 企业工作台视觉概览" class="hero-image" />
        <div class="hero-shade"></div>
        <div class="hero-content">
          <div class="eyebrow">
            <span></span>
            Matrix 个人工作台
          </div>
          <h1>早上好，林澈</h1>
          <p>今日待处理 6 项，财务月结正在推进，知识系统与更多业务系统将从这里统一进入。</p>
          <div class="hero-actions">
            <button type="button" class="primary-action" @click="navigateTo('/finance', { newPage: true })">
              <Wallet class="svg-icon" />
              <span>进入财务系统</span>
            </button>
            <button type="button" class="secondary-action" @click="navigateTo('/ai/assistant')">
              <ChatDotRound class="svg-icon" />
              <span>询问 AI 助手</span>
            </button>
          </div>
        </div>

        <div class="hero-metrics" aria-label="今日关键指标">
          <div v-for="metric in heroMetrics" :key="metric.label" class="metric-item">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.hint }}</small>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <section class="main-column">
          <div class="section-heading">
            <div>
              <span>Application Hub</span>
              <h2>我的应用</h2>
            </div>
            <button type="button" class="text-button" @click="showToast('应用中心将支持按角色配置')">
              <Grid class="svg-icon" />
              <span>管理应用</span>
            </button>
          </div>

          <div class="app-grid">
            <article
              v-for="app in apps"
              :key="app.name"
              class="app-card"
              :class="{ featured: app.featured, disabled: !app.available }"
              @click="openApp(app)"
            >
              <div class="app-card-head">
                <span class="app-icon" :style="{ '--accent': app.accent }">
                  <component :is="app.icon" class="svg-icon" />
                </span>
                <span class="app-status" :class="{ live: app.available }">{{ app.status }}</span>
              </div>
              <h3>{{ app.name }}</h3>
              <p>{{ app.desc }}</p>
              <div class="app-card-foot">
                <span>{{ app.meta }}</span>
                <ArrowRight class="svg-icon" />
              </div>
            </article>
          </div>

          <div class="lower-grid">
            <section class="work-section">
              <div class="section-heading compact">
                <div>
                  <span>Recent</span>
                  <h2>最近访问</h2>
                </div>
              </div>
              <div class="recent-list">
                <button
                  v-for="item in recentItems"
                  :key="item.title"
                  type="button"
                  class="recent-item"
                  @click="navigateTo(item.path)"
                >
                  <component :is="item.icon" class="svg-icon recent-icon" />
                  <div>
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.detail }}</span>
                  </div>
                  <small>{{ item.time }}</small>
                </button>
              </div>
            </section>

            <section class="work-section">
              <div class="section-heading compact">
                <div>
                  <span>Notice</span>
                  <h2>通知动态</h2>
                </div>
              </div>
              <div class="notice-list">
                <div v-for="notice in notices" :key="notice.title" class="notice-item">
                  <span :class="['notice-type', notice.type]">{{ notice.tag }}</span>
                  <div>
                    <strong>{{ notice.title }}</strong>
                    <p>{{ notice.desc }}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <aside class="right-column">
          <section class="today-panel">
            <div class="section-heading compact">
              <div>
                <span>Today</span>
                <h2>我的待办</h2>
              </div>
              <button type="button" class="icon-button small" title="刷新待办" @click="showToast('待办已刷新')">
                <Refresh class="svg-icon" />
              </button>
            </div>

            <div class="todo-list">
              <button
                v-for="todo in todos"
                :key="todo.title"
                type="button"
                class="todo-item"
                @click="navigateTo(todo.path)"
              >
                <span class="todo-priority" :class="todo.priority"></span>
                <div>
                  <strong>{{ todo.title }}</strong>
                  <small>{{ todo.desc }}</small>
                </div>
                <Clock class="svg-icon" />
              </button>
            </div>
          </section>

          <section class="quick-panel">
            <div class="section-heading compact">
              <div>
                <span>Quick Actions</span>
                <h2>快捷操作</h2>
              </div>
            </div>
            <div class="quick-grid">
              <button v-for="action in quickActions" :key="action.label" type="button" @click="navigateTo(action.path)">
                <component :is="action.icon" class="svg-icon" />
                <span>{{ action.label }}</span>
              </button>
            </div>
          </section>
        </aside>
      </section>
    </section>

    <transition name="toast">
      <div v-if="snackbar.show" class="toast" :class="snackbar.type">
        {{ snackbar.text }}
      </div>
    </transition>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { clearToken } from '@/utils/auth'
import {
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  ChatDotRound,
  Clock,
  DataAnalysis,
  DocumentChecked,
  Files,
  Grid,
  House,
  Link,
  Notebook,
  OfficeBuilding,
  Plus,
  Refresh,
  Search,
  Setting,
  SwitchButton,
  Tickets,
  TrendCharts,
  Upload,
  User,
  Wallet,
} from '@element-plus/icons-vue'

const router = useRouter()
const activeNav = ref('workbench')
const searchKeyword = ref('')
const snackbar = ref({ show: false, text: '', type: 'info' })
let toastTimer = null

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())
})

const navItems = [
  { key: 'workbench', label: '工作台', icon: House },
  { key: 'apps', label: '应用中心', icon: Grid },
  { key: 'finance', label: '财务系统', icon: Wallet, path: '/finance', newPage: true },
  { key: 'knowledge', label: '知识系统', icon: Notebook, path: '/ai/knowledge' },
  { key: 'settings', label: '平台设置', icon: Setting },
]

const heroMetrics = [
  { label: '月结进度', value: '82%', hint: '较昨日 +11%' },
  { label: '待我处理', value: '6', hint: '含 2 项高优先级' },
  { label: '本月凭证', value: '1,280', hint: '自动生成 64%' },
]

const apps = [
  {
    name: '财务系统',
    desc: '总账、应收应付、报表、月结协同统一入口。',
    meta: '核心系统',
    status: '已上线',
    icon: Wallet,
    accent: '#0f8a6a',
    path: '/finance',
    newPage: true,
    featured: true,
    available: true,
  },
  {
    name: '知识系统',
    desc: '沉淀制度、流程、案例与业务问答，连接 AI 助手。',
    meta: '知识底座',
    status: '已上线',
    icon: Notebook,
    accent: '#1769aa',
    path: '/ai/knowledge',
    available: true,
  },
  {
    name: '审批系统',
    desc: '费用、付款、合同与组织审批流的统一处理中心。',
    meta: '流程能力',
    status: '规划中',
    icon: DocumentChecked,
    accent: '#b7791f',
    available: false,
  },
  {
    name: '项目系统',
    desc: '项目预算、成本归集、里程碑与经营分析。',
    meta: '业务协同',
    status: '规划中',
    icon: Briefcase,
    accent: '#6f7b35',
    available: false,
  },
  {
    name: 'AI 助手',
    desc: '围绕财务、数据与知识的智能问答入口。',
    meta: '智能协作',
    status: '已上线',
    icon: ChatDotRound,
    accent: '#2454a6',
    path: '/ai/assistant',
    available: true,
  },
  {
    name: '基础服务',
    desc: '企业建模、主数据、人员与组织基础能力。',
    meta: '平台底座',
    status: '已上线',
    icon: OfficeBuilding,
    accent: '#56636f',
    path: '/base-data',
    available: true,
  },
]

const todos = [
  { title: '确认 4 月月结检查项', desc: '总账模块还有 3 项需确认', path: '/ledger/month-end-close-workbench', priority: 'high' },
  { title: '复核应付账龄预警', desc: '2 家供应商超过信用期', path: '/payable/aging-credit', priority: 'medium' },
  { title: '补充现金流通知单', desc: '经营活动现金流待勾稽', path: '/ledger/cashflow-notice-check', priority: 'low' },
]

const recentItems = [
  { title: '资产负债表', detail: '2026 年 4 月报表', time: '10:24', path: '/ledger/balance-sheet', icon: DataAnalysis },
  { title: '凭证协同检查', detail: '自动生成凭证复核', time: '昨天', path: '/ledger/voucher-collaboration-check', icon: Tickets },
  { title: '往来对账单', detail: '客户与供应商余额核对', time: '周五', path: '/ledger/counterparty-statement', icon: Files },
]

const notices = [
  { tag: '财务', type: 'finance', title: '月结监控中心已更新', desc: '新增异常凭证定位与结转进度提醒。' },
  { tag: '平台', type: 'platform', title: 'Matrix 工作台升级', desc: '多系统入口、待办与最近访问已整合。' },
  { tag: '知识', type: 'knowledge', title: '知识系统进入产品设计', desc: '后续会接入制度、问答与文档资产。' },
]

const quickActions = [
  { label: '新增凭证', icon: Plus, path: '/ledger/voucher' },
  { label: '上传附件', icon: Upload, path: '/payable/manage' },
  { label: '查看报表', icon: TrendCharts, path: '/ledger/balance-sheet' },
  { label: '企业建模', icon: Link, path: '/enterprise-modeling' },
  { label: '我的档案', icon: User, path: '/personal' },
  { label: '日程日历', icon: Calendar, path: '/ledger/period-monitor-center' },
]

function handleNav(item) {
  if (item.disabled) {
    showToast(`${item.label}正在规划中`)
    return
  }

  activeNav.value = item.key
  if (item.path) {
    navigateTo(item.path, { newPage: item.newPage })
  }
}

function openApp(app) {
  if (!app.available) {
    showToast(`${app.name}正在规划中，将作为 Matrix 的下一批系统入口`)
    return
  }
  navigateTo(app.path, { newPage: app.newPage })
}

function navigateTo(path, options = {}) {
  if (!path) {
    showToast('该入口正在接入')
    return
  }
  if (options.newPage) {
    openRouteInNewPage(path)
    return
  }
  router.push(path)
}

function openRouteInNewPage(path) {
  const url = router.resolve(path).href
  window.open(url, '_blank', 'noopener')
}

function handleLogout() {
  clearToken()
  showToast('已退出登录', 'success')
  window.setTimeout(() => router.push('/login'), 700)
}

function showToast(text, type = 'info') {
  snackbar.value = { show: true, text, type }
  if (toastTimer) {
    window.clearTimeout(toastTimer)
  }
  toastTimer = window.setTimeout(() => {
    snackbar.value.show = false
  }, 2200)
}
</script>

<style scoped>
.matrix-shell {
  min-height: 100vh;
  display: flex;
  background:
    linear-gradient(180deg, rgba(247, 250, 249, 0.96) 0%, rgba(237, 243, 244, 0.96) 100%),
    #f4f7f8;
  color: #17202c;
}

.svg-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.side-nav {
  width: 236px;
  min-height: 100vh;
  position: sticky;
  top: 0;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 22px 16px;
  border-right: 1px solid rgba(26, 42, 58, 0.1);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #0d5f69 0%, #0f8a6a 58%, #d6a23a 100%);
  box-shadow: 0 12px 28px rgba(15, 138, 106, 0.22);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-copy strong {
  font-size: 19px;
  line-height: 1.1;
}

.brand-copy span {
  margin-top: 4px;
  color: #667482;
  font-size: 12px;
}

.nav-group {
  display: grid;
  gap: 6px;
}

.nav-item,
.logout-link,
.text-button,
.primary-action,
.secondary-action,
.recent-item,
.todo-item,
.quick-grid button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.nav-item {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border-radius: 8px;
  color: #4c5967;
  background: transparent;
  text-align: left;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.nav-item:hover {
  color: #0d5f69;
  background: rgba(13, 95, 105, 0.08);
}

.nav-item.active {
  color: #0c5b63;
  background: rgba(15, 138, 106, 0.12);
  font-weight: 700;
}

.nav-item.disabled {
  color: #9aa4ad;
}

.side-status {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 138, 106, 0.16);
  background: #f4fbf7;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #12a66a;
  box-shadow: 0 0 0 5px rgba(18, 166, 106, 0.12);
}

.side-status span,
.side-status strong {
  display: block;
}

.side-status span {
  color: #5c6976;
  font-size: 12px;
}

.side-status strong {
  margin-top: 2px;
  color: #152331;
  font-size: 15px;
}

.logout-link {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 8px;
  color: #6a7480;
  background: #f7f9fa;
}

.logout-link:hover {
  color: #a64024;
  background: #fff2ec;
}

.workspace {
  flex: 1;
  min-width: 0;
  padding: 20px 24px 34px;
}

.topbar {
  min-height: 58px;
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(260px, 1fr) auto;
  align-items: center;
  gap: 18px;
}

.page-title {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.page-title span {
  color: #74808c;
  font-size: 13px;
}

.page-title strong {
  margin-top: 2px;
  font-size: 22px;
}

.search-box {
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

.search-box .svg-icon {
  color: #7f8d99;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #17202c;
  background: transparent;
  font-size: 14px;
}

.search-box input::placeholder {
  color: #8b96a1;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.icon-button {
  width: 42px;
  height: 42px;
  position: relative;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(28, 44, 61, 0.1);
  color: #354151;
  background: #ffffff;
  cursor: pointer;
}

.icon-button:hover {
  color: #0f766e;
  border-color: rgba(15, 118, 110, 0.24);
}

.icon-button.small {
  width: 34px;
  height: 34px;
}

.notice-badge {
  width: 8px;
  height: 8px;
  position: absolute;
  top: 9px;
  right: 9px;
  border-radius: 50%;
  background: #d67c21;
}

.avatar-button {
  min-width: 168px;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 8px;
  border: 1px solid rgba(28, 44, 61, 0.1);
  border-radius: 8px;
  background: #ffffff;
  color: #17202c;
  cursor: pointer;
  text-align: left;
}

.avatar-button > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #0d5f69;
  color: #ffffff;
  font-weight: 700;
}

.avatar-button div {
  min-width: 0;
}

.avatar-button strong,
.avatar-button small {
  display: block;
  white-space: nowrap;
}

.avatar-button strong {
  font-size: 13px;
}

.avatar-button small {
  margin-top: 1px;
  color: #73808d;
  font-size: 11px;
}

.hero-band {
  min-height: 316px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 440px);
  align-items: end;
  gap: 18px;
  margin-top: 12px;
  padding: 34px;
  border-radius: 8px;
  border: 1px solid rgba(18, 32, 45, 0.12);
  background: #10222b;
  box-shadow: 0 22px 58px rgba(26, 42, 58, 0.16);
}

.hero-image,
.hero-shade {
  position: absolute;
  inset: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-shade {
  background:
    linear-gradient(90deg, rgba(10, 28, 34, 0.82) 0%, rgba(10, 28, 34, 0.58) 38%, rgba(10, 28, 34, 0.18) 74%),
    linear-gradient(180deg, rgba(10, 28, 34, 0.08) 0%, rgba(10, 28, 34, 0.48) 100%);
}

.hero-content,
.hero-metrics {
  position: relative;
  z-index: 1;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #b7ead8;
  font-size: 13px;
  font-weight: 700;
}

.eyebrow span {
  width: 24px;
  height: 2px;
  border-radius: 2px;
  background: #d6a23a;
}

.hero-content h1 {
  max-width: 680px;
  margin: 14px 0 12px;
  color: #ffffff;
  font-size: 42px;
  line-height: 1.12;
  letter-spacing: 0;
}

.hero-content p {
  max-width: 640px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
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
  justify-content: center;
  gap: 9px;
  padding: 0 18px;
  border-radius: 8px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.primary-action {
  color: #ffffff;
  background: #0f8a6a;
  box-shadow: 0 14px 30px rgba(15, 138, 106, 0.3);
}

.secondary-action {
  color: #f8fbfb;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.12);
}

.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-1px);
}

.hero-metrics {
  display: grid;
  gap: 10px;
  align-self: stretch;
}

.metric-item {
  display: grid;
  align-content: center;
  gap: 4px;
  min-height: 82px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(8, 27, 33, 0.45);
  backdrop-filter: blur(16px);
}

.metric-item span {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.metric-item strong {
  color: #ffffff;
  font-size: 25px;
  line-height: 1;
}

.metric-item small {
  color: #b7ead8;
  font-size: 12px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 352px;
  gap: 22px;
  margin-top: 24px;
}

.main-column,
.right-column {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.section-heading.compact {
  margin-bottom: 12px;
}

.section-heading span {
  display: block;
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 2px 0 0;
  font-size: 22px;
  line-height: 1.25;
}

.section-heading.compact h2 {
  font-size: 18px;
}

.text-button {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 8px;
  color: #1b4d5c;
  background: #e8f4f1;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.app-card {
  min-height: 186px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 38px rgba(34, 53, 73, 0.08);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.app-card:hover {
  transform: translateY(-2px);
  border-color: rgba(15, 138, 106, 0.34);
  box-shadow: 0 18px 46px rgba(34, 53, 73, 0.12);
}

.app-card.featured {
  color: #ffffff;
  border-color: rgba(15, 138, 106, 0.24);
  background:
    linear-gradient(135deg, rgba(13, 95, 105, 0.96) 0%, rgba(15, 138, 106, 0.94) 58%, rgba(35, 65, 76, 0.98) 100%);
}

.app-card.disabled {
  cursor: default;
  background: #f7f9fa;
}

.app-card-head,
.app-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, #ffffff);
}

.app-card.featured .app-icon {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
}

.app-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  color: #7b8792;
  background: #edf1f3;
  font-size: 12px;
  font-weight: 700;
}

.app-status.live {
  color: #0f6f55;
  background: #def6eb;
}

.app-card.featured .app-status {
  color: #173126;
  background: #b7ead8;
}

.app-card h3 {
  margin: 4px 0 0;
  font-size: 19px;
  line-height: 1.28;
}

.app-card p {
  margin: 0;
  color: #65717d;
  font-size: 14px;
  line-height: 1.65;
}

.app-card.featured p {
  color: rgba(255, 255, 255, 0.78);
}

.app-card-foot {
  margin-top: auto;
  color: #53606d;
  font-size: 13px;
  font-weight: 700;
}

.app-card.featured .app-card-foot {
  color: #ffffff;
}

.lower-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.work-section,
.today-panel,
.quick-panel {
  padding: 18px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 38px rgba(34, 53, 73, 0.07);
}

.right-column {
  display: grid;
  align-content: start;
  gap: 16px;
}

.recent-list,
.notice-list,
.todo-list {
  display: grid;
  gap: 10px;
}

.recent-item,
.todo-item {
  width: 100%;
  min-height: 62px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  color: #17202c;
  background: #f7f9fa;
  text-align: left;
}

.recent-item:hover,
.todo-item:hover {
  background: #edf6f3;
}

.recent-icon {
  color: #0d5f69;
}

.recent-item strong,
.recent-item span,
.todo-item strong,
.todo-item small {
  display: block;
}

.recent-item strong,
.todo-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.recent-item span,
.todo-item small {
  margin-top: 3px;
  color: #697684;
  font-size: 12px;
}

.recent-item small {
  color: #87929d;
  font-size: 12px;
}

.notice-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(26, 42, 58, 0.08);
}

.notice-item:last-child {
  border-bottom: 0;
}

.notice-type {
  min-width: 42px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.notice-type.finance {
  color: #0f6f55;
  background: #def6eb;
}

.notice-type.platform {
  color: #2454a6;
  background: #e4edff;
}

.notice-type.knowledge {
  color: #8a5a0f;
  background: #fff1cf;
}

.notice-item strong {
  display: block;
  font-size: 14px;
}

.notice-item p {
  margin: 4px 0 0;
  color: #667482;
  font-size: 12px;
  line-height: 1.6;
}

.todo-priority {
  width: 9px;
  height: 38px;
  border-radius: 999px;
  background: #8ca0ad;
}

.todo-priority.high {
  background: #c9562d;
}

.todo-priority.medium {
  background: #d6a23a;
}

.todo-priority.low {
  background: #0f8a6a;
}

.todo-item .svg-icon {
  color: #96a0aa;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-grid button {
  min-height: 76px;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 8px;
  color: #263443;
  background: #f7f9fa;
}

.quick-grid button:hover {
  color: #0d5f69;
  background: #edf6f3;
}

.quick-grid span {
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: 13px;
  font-weight: 700;
}

.toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 30;
  max-width: min(360px, calc(100vw - 48px));
  padding: 12px 16px;
  border-radius: 8px;
  color: #ffffff;
  background: #17202c;
  box-shadow: 0 16px 38px rgba(23, 32, 44, 0.22);
}

.toast.success {
  background: #0f8a6a;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1180px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .right-column {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .side-nav {
    width: 84px;
    padding: 18px 12px;
    align-items: center;
  }

  .brand-copy,
  .nav-item span,
  .side-status,
  .logout-link span {
    display: none;
  }

  .nav-item,
  .logout-link {
    width: 46px;
    justify-content: center;
    padding: 0;
  }

  .topbar {
    grid-template-columns: 1fr;
  }

  .top-actions {
    justify-content: space-between;
  }

  .search-box {
    order: 3;
  }

  .hero-band {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .app-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .matrix-shell {
    display: block;
  }

  .side-nav {
    width: 100%;
    min-height: auto;
    position: sticky;
    top: 0;
    z-index: 10;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    overflow-x: auto;
    padding: 10px 12px;
    border-right: 0;
    border-bottom: 1px solid rgba(26, 42, 58, 0.1);
  }

  .brand-copy,
  .nav-item span,
  .logout-link span {
    display: none;
  }

  .nav-group {
    display: flex;
    gap: 6px;
  }

  .workspace {
    padding: 16px 14px 28px;
  }

  .top-actions {
    flex-wrap: wrap;
  }

  .avatar-button {
    min-width: 144px;
  }

  .hero-band {
    min-height: auto;
    padding: 26px 18px;
  }

  .hero-content h1 {
    font-size: 32px;
  }

  .hero-content p {
    font-size: 14px;
  }

  .hero-metrics,
  .app-grid,
  .lower-grid,
  .right-column {
    grid-template-columns: 1fr;
  }

  .metric-item {
    min-height: 72px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .text-button {
    align-self: stretch;
    justify-content: center;
  }

  .toast {
    right: 14px;
    bottom: 14px;
    max-width: calc(100vw - 28px);
  }
}

@media (max-width: 430px) {
  .top-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .icon-button {
    width: 100%;
  }

  .avatar-button {
    grid-column: 1 / -1;
    width: 100%;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
  }
}
</style>
