import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import vuetify from './plugins/vuetify'
import router from './router'
import { initAuth } from './utils/auth'

const legacyRedirects = new Map([
  ['/expenses', '/expense-reimbursements'],
  ['/cost', '/expense-reimbursements'],
  ['/workbench', '/workflow/tasks'],
  ['/reports', '/ledger/balance-sheet'],
  ['/estimated-payable', '/payable/estimate'],
  ['/payment-application', '/p2p?stage=payment-application'],
  ['/payment-processing', '/p2p?stage=payment-order'],
  ['/estimated-receivable', '/receivable/estimate'],
  ['/settlement-processing', '/p2p?stage=settlement'],
])

router.beforeEach(to => {
  const target = legacyRedirects.get(to.path)
  if (!target) return true

  const [path, search = ''] = target.split('?')
  const legacyQuery = Object.fromEntries(new URLSearchParams(search))
  return {
    path,
    query: { ...legacyQuery, ...to.query },
    hash: to.hash,
    replace: true,
  }
})

const app = createApp(App)
app.use(ElementPlus)
app.use(vuetify)
app.use(router)
initAuth(router)
app.mount('#app')
