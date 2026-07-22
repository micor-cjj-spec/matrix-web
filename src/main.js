import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import vuetify from './plugins/vuetify'
import router from './router'
import { initAuth } from './utils/auth'

router.addRoute({
  path: '/scheduler/jobs',
  name: 'SchedulerJobs',
  component: () => import('./views/scheduler/SchedulerJobsView.vue'),
  meta: { title: '定时任务调度' },
})

router.addRoute({
  path: '/botp',
  name: 'BotpManagement',
  component: () => import('./views/botp/BotpManagementView.vue'),
  meta: { title: 'BOTP 单据下推反写' },
})

router.addRoute({
  path: '/openapi',
  name: 'OpenApiManagement',
  component: () => import('./views/login/openapi/OpenApiManagementView.vue'),
  meta: { title: 'Matrix 开放平台' },
})

const app = createApp(App)
app.use(ElementPlus)
app.use(vuetify)
app.use(router)
initAuth(router)
app.mount('#app')
