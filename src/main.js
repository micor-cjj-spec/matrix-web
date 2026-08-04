import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import vuetify from './plugins/vuetify'
import router from './router'
import { initAuth } from './utils/auth'

router.removeRoute('Portal')
router.addRoute({
  path: '/portal',
  name: 'Portal',
  component: () => import('./views/login/PlatformPortalView.vue'),
  meta: { title: '个人工作台' },
})

router.addRoute({
  path: '/scheduler/jobs',
  name: 'SchedulerJobs',
  component: () => import('./views/scheduler/SchedulerJobsView.vue'),
  meta: { title: '定时任务调度' },
})

router.addRoute({
  path: '/scheduler/operations',
  name: 'SchedulerOperations',
  component: () => import('./views/scheduler/SchedulerOperationsView.vue'),
  meta: { title: '调度运行中心' },
})

router.addRoute({
  path: '/botp',
  name: 'BotpManagement',
  component: () => import('./views/botp/BotpManagementView.vue'),
  meta: { title: 'BOTP 单据下推反写' },
})

router.addRoute({
  path: '/botp/operations',
  name: 'BotpOperations',
  component: () => import('./views/botp/BotpOperationsView.vue'),
  meta: { title: 'BOTP 异常恢复与对账' },
})

router.addRoute({
  path: '/openapi',
  name: 'OpenApiManagement',
  component: () => import('./views/login/openapi/OpenApiManagementView.vue'),
  meta: { title: 'Matrix 开放平台' },
})

router.addRoute({
  path: '/openapi/reliability',
  name: 'OpenApiReliability',
  component: () => import('./views/login/openapi/OpenApiReliabilityView.vue'),
  meta: { title: '开放平台可靠性中心' },
})

router.addRoute({
  path: '/notifications',
  name: 'Notifications',
  component: () => import('./views/im/NotificationsView.vue'),
  meta: { title: '消息中心' },
})

router.addRoute({
  path: '/workflow/tasks',
  name: 'WorkflowTaskCenter',
  component: () => import('./views/login/workflow/WorkflowTaskCenterView.vue'),
  meta: { title: '工作流任务中心' },
})

router.addRoute({
  path: '/expense-reimbursements',
  name: 'ExpenseReimbursements',
  component: () => import('./views/login/expense/ExpenseReimbursementView.vue'),
  meta: { title: '费用报销' },
})

router.addRoute({
  path: '/im/management',
  name: 'ImManagement',
  component: () => import('./views/im/ImManagementView.vue'),
  meta: { title: 'IM 推送平台' },
})

router.addRoute({
  path: '/ai/knowledge/evaluations',
  name: 'KnowledgeEvaluation',
  component: () => import('./views/ai/KnowledgeEvaluationView.vue'),
  meta: { title: '知识检索评测' },
})

const legacyRedirects = new Map([
  ['/expenses', '/expense-reimbursements'],
  ['/cost', '/expense-reimbursements'],
  ['/workbench', '/workflow/tasks'],
  ['/reports', '/ledger/balance-sheet'],
  ['/estimated-payable', '/payable/estimate'],
  ['/payment-application', '/payable/application'],
  ['/payment-processing', '/payable/processing'],
  ['/estimated-receivable', '/receivable/estimate'],
  ['/settlement-processing', '/receivable/settlement'],
])

router.beforeEach(to => {
  const target = legacyRedirects.get(to.path)
  if (!target) return true
  return { path: target, query: to.query, hash: to.hash, replace: true }
})

const app = createApp(App)
app.use(ElementPlus)
app.use(vuetify)
app.use(router)
initAuth(router)
app.mount('#app')
