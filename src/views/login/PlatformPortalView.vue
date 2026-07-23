<template>
  <main class="matrix-shell">
    <aside class="side-nav">
      <div class="brand">
        <div class="brand-mark">M</div>
        <div class="brand-copy"><strong>Matrix</strong><span>企业智能平台</span></div>
      </div>

      <nav class="nav-group" aria-label="Matrix 主导航">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="nav-item"
          :class="{ active: activeNav === item.key }"
          @click="handleNav(item)"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="side-spacer" />
      <div class="platform-status"><span class="status-dot" /><div><strong>平台运行正常</strong><small>核心服务可用</small></div></div>
      <button type="button" class="logout-link" @click="handleLogout"><SwitchButton class="nav-icon" /><span>退出登录</span></button>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="page-title"><span>{{ currentDate }}</span><strong>{{ currentPage.title }}</strong><small>{{ currentPage.subtitle }}</small></div>
        <div class="top-actions">
          <button type="button" class="top-action" title="新建费用报销" @click="navigateTo('/expenses')"><Plus /></button>
          <button type="button" class="top-action notification-button" title="消息中心" @click="navigateTo('/notifications')"><Bell /><span class="notice-badge" /></button>
          <button type="button" class="profile-button" @click="navigateTo('/personal')"><span class="avatar">M</span><span class="profile-copy"><strong>当前用户</strong><small>Matrix 平台</small></span></button>
        </div>
      </header>

      <div class="page-content">
        <WorkbenchPanel
          v-if="activeNav === 'workbench'"
          :hero-metrics="heroMetrics"
          :todos="todos"
          :recent-items="recentItems"
          :notices="notices"
          :quick-actions="quickActions"
          @navigate="navigateTo"
          @open-app-center="switchInternalView('apps')"
          @refresh="refreshWorkbench"
        />
        <ApplicationCenterPanel v-else-if="activeNav === 'apps'" :apps="apps" @open="openApp" />
        <section v-else class="settings-view">
          <div class="settings-hero"><Setting class="settings-icon" /><span>PLATFORM SETTINGS</span><h1>平台设置</h1><p>配置应用、权限和个性化工作台的后台能力仍在建设中。</p></div>
          <div class="settings-grid">
            <article><Grid /><strong>应用配置</strong><span>维护应用入口、状态、分类与展示顺序。</span></article>
            <article><OfficeBuilding /><strong>组织与权限</strong><span>按租户、组织和角色控制应用可见范围。</span></article>
            <article><Operation /><strong>工作台配置</strong><span>配置指标、待办、快捷操作和通知内容。</span></article>
          </div>
        </section>
      </div>
    </section>

    <transition name="toast"><div v-if="snackbar.show" class="toast" :class="snackbar.type">{{ snackbar.text }}</div></transition>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApps, getWorkbench } from '@/api/platform'
import ApplicationCenterPanel from '@/components/platform/ApplicationCenterPanel.vue'
import WorkbenchPanel from '@/components/platform/WorkbenchPanel.vue'
import { clearToken } from '@/utils/auth'
import { resolveMatrixIcon } from '@/utils/matrixIcons'
import {
  Bell,
  Calendar,
  ChatDotRound,
  Connection,
  Cpu,
  DataAnalysis,
  Files,
  Grid,
  House,
  Link,
  Message,
  Notebook,
  OfficeBuilding,
  Operation,
  Plus,
  Promotion,
  Setting,
  SwitchButton,
  Tickets,
  TrendCharts,
  Upload,
  User,
  Wallet,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const snackbar = ref({ show: false, text: '', type: 'info' })
let toastTimer = null
const activeNav = ref(resolveInternalView(route.query.view))

const navItems = [
  { key: 'workbench', label: '工作台', icon: House, internal: true },
  { key: 'apps', label: '应用中心', icon: Grid, internal: true },
  { key: 'finance', label: '财务系统', icon: Wallet, path: '/finance', newPage: true },
  { key: 'workflow', label: '审批中心', icon: Operation, path: '/workflow/tasks' },
  { key: 'knowledge', label: '知识系统', icon: Notebook, path: '/ai/knowledge' },
  { key: 'messages', label: '消息中心', icon: Message, path: '/notifications' },
  { key: 'settings', label: '平台设置', icon: Setting, internal: true },
]

const pageMap = {
  workbench: { title: '个人工作台', subtitle: '聚焦今日任务、关键指标与最近工作' },
  apps: { title: '应用中心', subtitle: '统一进入 Matrix 业务系统与平台能力' },
  settings: { title: '平台设置', subtitle: '配置应用、权限与个性化工作台' },
}
const currentPage = computed(() => pageMap[activeNav.value] || pageMap.workbench)
const currentDate = computed(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()))

const defaultHeroMetrics = [
  { label: '月结进度', value: '82%', hint: '较昨日 +11%' },
  { label: '待我处理', value: '6', hint: '进入审批中心处理' },
  { label: '本月凭证', value: '1,280', hint: '自动生成 64%' },
]
const defaultTodos = [
  { title: '处理流程待办', desc: '查看费用报销和其他审批任务', path: '/workflow/tasks', priority: 'high' },
  { title: '确认月结检查项', desc: '总账模块还有 3 项需确认', path: '/ledger/month-end-close-workbench', priority: 'medium' },
  { title: '复核应付账龄预警', desc: '2 家供应商超过信用期', path: '/payable/aging-credit', priority: 'low' },
]
const defaultRecentItems = [
  { title: '费用报销', detail: '创建或查询报销单', time: '常用', path: '/expenses', icon: Tickets },
  { title: '资产负债表', detail: '本期财务报表', time: '10:24', path: '/ledger/balance-sheet', icon: DataAnalysis },
  { title: '往来对账单', detail: '客户与供应商余额核对', time: '周五', path: '/ledger/counterparty-statement', icon: Files },
]
const defaultNotices = [
  { tag: '流程', type: 'platform', title: '统一审批中心已接入', desc: '支持我的待办、已办、我发起和审批处理。' },
  { tag: '费用', type: 'finance', title: '费用报销已接入工作流', desc: '支持草稿、提交、取消和审批详情。' },
  { tag: 'IM', type: 'knowledge', title: '消息中心与推送管理已拆分', desc: '个人收件箱和平台管理职责更加清晰。' },
]
const defaultQuickActions = [
  { label: '新增报销', icon: Plus, path: '/expenses' },
  { label: '审批待办', icon: Operation, path: '/workflow/tasks' },
  { label: '新增凭证', icon: Tickets, path: '/ledger/voucher' },
  { label: '查看报表', icon: TrendCharts, path: '/ledger/balance-sheet' },
  { label: '消息中心', icon: Message, path: '/notifications' },
  { label: '调度中心', icon: Calendar, path: '/scheduler/jobs' },
]

const defaultApps = [
  { key: 'finance', name: '财务系统', desc: '覆盖总账、凭证、应收应付、报表、期末处理和财务基础资料。', meta: '核心业务系统', status: '已上线', category: 'business', tags: ['总账', '应收应付', '报表', '月结'], icon: Wallet, accent: '#15745f', path: '/finance', newPage: true, featured: true, available: true, order: 10 },
  { key: 'workflow', name: '审批与流程中心', desc: '统一处理待办、查看已办，并追踪我发起的业务流程。', meta: '流程协同平台', status: '已上线', category: 'business', tags: ['审批流', '待办', '流程追踪'], icon: Operation, accent: '#a36a28', path: '/workflow/tasks', featured: true, available: true, order: 20 },
  { key: 'expense', name: '费用报销', desc: '创建费用报销单、提交审批、取消单据并查看审批详情。', meta: '员工费用应用', status: '已上线', category: 'business', tags: ['费用', '报销', '审批'], icon: Tickets, accent: '#b07a25', path: '/expenses', available: true, order: 30 },
  { key: 'shared-operations', name: '共享运营', desc: '承载共享任务池、协同处理、进度跟踪与运营质量管理。', meta: '共享服务运营', status: '试运行', category: 'business', tags: ['任务池', '协同', '运营'], icon: Link, accent: '#8a6933', path: '/shared/operations', available: true, order: 40 },
  { key: 'message-center', name: '消息中心', desc: '查看个人站内消息、实时通知、未读状态和断线同步结果。', meta: '个人消息收件箱', status: '已上线', category: 'platform', tags: ['站内信', 'WebSocket', '已读'], icon: Message, accent: '#7656a8', path: '/notifications', featured: true, available: true, order: 50 },
  { key: 'im-management', name: 'IM 推送平台', desc: '管理接入应用、AppSecret、渠道权限和消息模板。', meta: '统一消息能力', status: '已上线', category: 'platform', tags: ['应用管理', '密钥', '模板', '渠道'], icon: Message, accent: '#5e438f', path: '/im/management', available: true, order: 60 },
  { key: 'knowledge', name: '知识系统', desc: '维护制度、流程、业务文档和知识切片，为检索与 AI 问答提供底座。', meta: '企业知识底座', status: '已上线', category: 'intelligence', tags: ['知识库', '文档', '检索', 'RAG'], icon: Notebook, accent: '#2f66a3', path: '/ai/knowledge', available: true, order: 70 },
  { key: 'scheduler', name: '任务调度中心', desc: '管理定时任务、执行实例、重试、补偿和运行监控。', meta: '平台调度能力', status: '已上线', category: 'platform', tags: ['Quartz', '任务管理', '重试'], icon: Calendar, accent: '#267b83', path: '/scheduler/jobs', available: true, order: 80 },
  { key: 'openapi', name: 'Matrix 开放平台', desc: '管理外部应用、接口授权、调用日志、异步任务和回调可靠性。', meta: '外部系统接入', status: '已上线', category: 'integration', tags: ['AppKey', 'HMAC', '授权', '回调'], icon: Connection, accent: '#3c6f9f', path: '/openapi', available: true, order: 90 },
  { key: 'botp', name: 'BOTP 单据转换平台', desc: '配置单据转换规则、字段映射、下推反写、执行追踪和异常对账。', meta: '业务单据集成', status: '已上线', category: 'integration', tags: ['单据转换', '映射规则', '反写'], icon: Promotion, accent: '#8b5d3b', path: '/botp', available: true, order: 100 },
  { key: 'ai-assistant', name: 'AI 助手', desc: '围绕财务、数据、知识和平台文档提供智能问答与业务辅助。', meta: '智能协作入口', status: '已上线', category: 'intelligence', tags: ['智能问答', '流式输出'], icon: ChatDotRound, accent: '#365bc0', path: '/ai/assistant', available: true, order: 110 },
  { key: 'master-data', name: '企业建模与主数据', desc: '维护组织、人员、客户、供应商、物料、币种和公共基础资料。', meta: '平台基础服务', status: '已上线', category: 'platform', tags: ['组织', '人员', '客户', '供应商'], icon: OfficeBuilding, accent: '#596d72', path: '/enterprise-modeling', available: true, order: 120 },
  { key: 'scheduler-operations', name: '调度运行与可靠性中心', desc: '集中查看调度执行、失败记录、补偿任务和异常恢复操作。', meta: '运行保障', status: '已上线', category: 'platform', tags: ['运行中心', '补偿', '异常恢复'], icon: Cpu, accent: '#4c758a', path: '/scheduler/operations', available: true, order: 130 },
]

const heroMetrics = ref(defaultHeroMetrics)
const todos = ref(defaultTodos)
const recentItems = ref(defaultRecentItems)
const notices = ref(defaultNotices)
const quickActions = ref(defaultQuickActions)
const apps = ref(defaultApps)

watch(() => route.query.view, value => { activeNav.value = resolveInternalView(value) })
onMounted(loadPortalData)

async function loadPortalData() {
  const [workbenchResult, appsResult] = await Promise.allSettled([getWorkbench(), getApps()])
  if (workbenchResult.status === 'fulfilled') {
    const data = unwrapResponse(workbenchResult.value)
    heroMetrics.value = hydrateList(data.heroMetrics, hydrateMetric, defaultHeroMetrics)
    todos.value = hydrateList(data.todos, hydrateTodo, defaultTodos)
    recentItems.value = hydrateList(data.recentItems, hydrateRecent, defaultRecentItems)
    notices.value = hydrateList(data.notices, hydrateNotice, defaultNotices)
    quickActions.value = hydrateList(data.quickActions, hydrateQuickAction, defaultQuickActions)
  }
  if (appsResult.status === 'fulfilled') {
    const remoteApps = unwrapResponse(appsResult.value)
    apps.value = mergeAppCatalog(Array.isArray(remoteApps) ? remoteApps : [])
  }
}

function unwrapResponse(response) {
  if (response?.code && response.code !== 200) throw new Error(response.message || 'platform api error')
  return response?.data || response || {}
}
function hydrateList(source, mapper, fallback) { return Array.isArray(source) && source.length ? source.map(mapper) : fallback }
function hydrateMetric(item) { return { label: item.label || item.name || item.title, value: item.value, hint: item.hint } }
function hydrateTodo(item) { return { title: item.title || item.name || item.label, desc: item.desc || item.description || item.detail, path: item.path || item.routePath, priority: item.priority } }
function hydrateRecent(item) { return { title: item.title || item.name || item.label, detail: item.detail || item.desc || item.description, time: item.time || item.value, path: item.path || item.routePath, icon: resolveMatrixIcon(item.iconKey, Files) } }
function hydrateNotice(item) { return { tag: item.tag, type: item.type, title: item.title || item.name || item.label, desc: item.desc || item.description || item.detail } }
function hydrateQuickAction(item) { return { label: item.label || item.name || item.title, icon: resolveMatrixIcon(item.iconKey, Grid), path: item.path || item.routePath } }

function normalizeRemoteKey(item) {
  const key = item.key || ''
  const name = item.name || item.title || ''
  if (key === 'im' || name === 'IM 推送平台') return 'im-management'
  if (key === 'workflow' || name.includes('工作流')) return 'workflow'
  return key
}
function mergeAppCatalog(remoteApps) {
  const catalog = defaultApps.map(item => ({ ...item }))
  const byKey = new Map(catalog.map(item => [item.key, item]))
  remoteApps.forEach(raw => {
    const key = normalizeRemoteKey(raw)
    const target = byKey.get(key)
    const remote = {
      key,
      name: raw.name || raw.title || raw.label,
      desc: raw.desc || raw.description || raw.detail,
      meta: raw.meta || raw.hint,
      status: normalizeStatus(raw.status, raw.available),
      icon: resolveMatrixIcon(raw.iconKey, Grid),
      accent: raw.accent,
      path: raw.path || raw.routePath,
      newPage: raw.newPage === true,
      featured: raw.featured === true,
      available: raw.available !== false,
    }
    if (target) {
      Object.assign(target, {
        ...remote,
        name: target.name,
        desc: target.desc,
        meta: target.meta,
        category: target.category,
        tags: target.tags,
        icon: raw.iconKey ? remote.icon : target.icon,
        accent: remote.accent || target.accent,
        path: target.path,
        featured: target.featured || remote.featured,
        order: target.order,
      })
    } else {
      catalog.push({ ...remote, key: key || `remote-${catalog.length + 1}`, category: inferCategory(remote), tags: [], order: 1000 + catalog.length })
    }
  })
  return catalog.sort((left, right) => (left.order || 9999) - (right.order || 9999))
}
function inferCategory(app) {
  const text = `${app.name || ''} ${app.meta || ''}`.toLowerCase()
  if (text.includes('ai') || text.includes('知识') || text.includes('智能')) return 'intelligence'
  if (text.includes('开放') || text.includes('集成') || text.includes('botp')) return 'integration'
  if (text.includes('财务') || text.includes('审批') || text.includes('业务')) return 'business'
  return 'platform'
}
function normalizeStatus(status, available) {
  if (status === 'ENABLED') return '已上线'
  if (status === 'DISABLED') return '规划中'
  return status || (available === false ? '规划中' : '已上线')
}
function resolveInternalView(value) { return ['workbench', 'apps', 'settings'].includes(value) ? value : 'workbench' }
function handleNav(item) { item.internal ? switchInternalView(item.key) : navigateTo(item.path, { newPage: item.newPage }) }
function switchInternalView(view) { activeNav.value = view; router.replace({ path: '/portal', query: view === 'workbench' ? {} : { view } }) }
function openApp(app) { app.available === false ? showToast(`${app.name}仍在规划中`) : navigateTo(app.path, { newPage: app.newPage }) }
function navigateTo(path, options = {}) {
  if (!path) return showToast('该入口正在接入')
  if (options.newPage) return window.open(router.resolve(path).href, '_blank', 'noopener')
  router.push(path)
}
async function refreshWorkbench() { showToast('正在刷新工作台', 'success'); await loadPortalData() }
function handleLogout() { clearToken(); showToast('已退出登录', 'success'); window.setTimeout(() => router.push('/login'), 600) }
function showToast(text, type = 'info') {
  snackbar.value = { show: true, text, type }
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { snackbar.value.show = false }, 2200)
}
</script>

<style scoped>
.matrix-shell { min-height: 100vh; display: flex; color: #1b2d2a; background: #f2f6f5; }
.side-nav { position: sticky; top: 0; display: flex; width: 226px; height: 100vh; flex: 0 0 226px; flex-direction: column; padding: 24px 16px 18px; border-right: 1px solid #dfe8e5; background: #fff; }
.brand { display: flex; align-items: center; gap: 12px; padding: 0 8px 26px; }
.brand-mark { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 14px; color: #fff; background: linear-gradient(135deg, #1e6957, #3d9a7e); font-size: 21px; font-weight: 900; }
.brand-copy strong, .brand-copy span { display: block; }
.brand-copy strong { color: #17312d; font-size: 19px; }
.brand-copy span { margin-top: 3px; color: #7a8986; font-size: 11px; }
.nav-group { display: grid; gap: 7px; }
.nav-item, .logout-link { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 44px; padding: 0 13px; border: 0; border-radius: 12px; color: #60716d; background: transparent; cursor: pointer; font: inherit; font-weight: 650; text-align: left; }
.nav-item:hover, .logout-link:hover { color: #1f6956; background: #f0f8f5; }
.nav-item.active { color: #1e6956; background: #e8f5f0; box-shadow: inset 3px 0 0 #2f8b70; }
.nav-icon, .nav-item :deep(svg), .logout-link :deep(svg) { width: 19px; height: 19px; }
.side-spacer { flex: 1; }
.platform-status { display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: 10px; align-items: center; margin: 18px 4px; padding: 14px; border: 1px solid #e3ece9; border-radius: 14px; background: #f8fbfa; }
.status-dot { width: 9px; height: 9px; border-radius: 999px; background: #39a77f; box-shadow: 0 0 0 5px rgba(57,167,127,.11); }
.platform-status strong, .platform-status small { display: block; }
.platform-status strong { font-size: 12px; }.platform-status small { margin-top: 3px; color: #879591; font-size: 10px; }
.logout-link { color: #8a5b5b; }.workspace { min-width: 0; flex: 1; }
.topbar { position: sticky; z-index: 20; top: 0; display: flex; align-items: center; justify-content: space-between; min-height: 82px; gap: 24px; padding: 14px 30px; border-bottom: 1px solid rgba(218,230,226,.9); background: rgba(247,250,249,.9); backdrop-filter: blur(16px); }
.page-title span, .page-title strong, .page-title small { display: block; }.page-title span { color: #7e8d89; font-size: 11px; }.page-title strong { margin-top: 3px; font-size: 20px; }.page-title small { margin-top: 2px; color: #87938f; font-size: 11px; }
.top-actions { display: flex; align-items: center; gap: 9px; }.top-action { position: relative; display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid #dbe7e3; border-radius: 12px; color: #56716a; background: #fff; cursor: pointer; }.top-action svg { width: 18px; height: 18px; }
.notice-badge { position: absolute; top: 7px; right: 7px; width: 7px; height: 7px; border: 2px solid #fff; border-radius: 999px; background: #e45c58; }
.profile-button { display: flex; align-items: center; gap: 9px; min-height: 42px; padding: 3px 10px 3px 4px; border: 0; border-radius: 14px; color: inherit; background: transparent; cursor: pointer; }.avatar { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 12px; color: #fff; background: #2f7f6b; font-weight: 800; }.profile-copy strong, .profile-copy small { display: block; text-align: left; }.profile-copy strong { font-size: 12px; }.profile-copy small { color: #87938f; font-size: 10px; }
.page-content { max-width: 1600px; margin: 0 auto; padding: 28px 30px 42px; }
.settings-view { display: grid; gap: 24px; }.settings-hero { display: grid; justify-items: start; padding: 42px; border-radius: 28px; color: #fff; background: linear-gradient(135deg, #273b45, #365a61); }.settings-icon { width: 34px; height: 34px; margin-bottom: 18px; }.settings-hero span { color: #b9d5d2; font-size: 11px; font-weight: 800; letter-spacing: .16em; }.settings-hero h1 { margin: 9px 0 0; font-size: 38px; }.settings-hero p { max-width: 640px; margin: 14px 0 0; color: rgba(255,255,255,.72); }
.settings-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }.settings-grid article { display: grid; min-height: 180px; align-content: start; gap: 12px; padding: 24px; border: 1px solid #e0e9e6; border-radius: 20px; background: #fff; }.settings-grid svg { width: 28px; height: 28px; color: #2f7f6b; }.settings-grid strong { font-size: 17px; }.settings-grid span { color: #73847f; font-size: 13px; line-height: 1.7; }
.toast { position: fixed; z-index: 100; right: 28px; bottom: 28px; max-width: 360px; padding: 13px 18px; border-radius: 12px; color: #fff; background: #344e49; }.toast.success { background: #23785f; }.toast-enter-active, .toast-leave-active { transition: opacity .2s ease, transform .2s ease; }.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
@media (max-width: 920px) { .side-nav { width: 78px; flex-basis: 78px; padding-inline: 10px; }.brand-copy, .nav-item span, .logout-link span, .platform-status div { display: none; }.brand { justify-content: center; padding-inline: 0; }.nav-item, .logout-link { justify-content: center; padding: 0; }.platform-status { grid-template-columns: 1fr; justify-items: center; padding: 12px 6px; }.settings-grid { grid-template-columns: 1fr; } }
@media (max-width: 680px) { .topbar { align-items: flex-start; padding: 14px 18px; }.profile-copy { display: none; }.page-content { padding: 20px 16px 32px; } }
</style>
