import { createApp } from 'vue'
import App from './App.vue'
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'

import vuetify from './plugins/vuetify'
import router from './router'
import { initAuth } from './utils/auth'

const app = createApp(App)
// app.use(ElementPlus)
app.use(vuetify)
app.use(router)
initAuth(router)
app.mount('#app')
