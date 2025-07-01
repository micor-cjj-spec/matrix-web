<template>
  <v-app class="portal-layout">
    <!-- 顶部导航栏 -->
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title class="logo">
        <v-icon class="mr-2">mdi-domain</v-icon>
        BizFi 企业管理平台
      </v-toolbar-title>
      <v-tabs v-model="activeTab" bg-color="primary" align-tabs="center" color="white" class="portal-tabs" slider-color="white">
        <v-tab value="home">首页</v-tab>
        <v-tab value="apps">应用</v-tab>
        <v-tab value="integration">集成管理</v-tab>
      </v-tabs>
      <v-spacer />
      <v-btn size="small" color="white" variant="text" @click="handleLogout" class="logout-btn">
        <v-icon start>mdi-logout</v-icon>退出登录
      </v-btn>
    </v-app-bar>

    <!-- 主体区域 -->
    <v-main class="portal-body">
      <!-- 左侧菜单 -->
      <v-navigation-drawer
          v-model="drawer"
          app
          color="#f5f7fa"
          width="190"
          class="portal-sidebar"
          permanent
      >
        <v-list density="comfortable">
          <v-list-item
              v-for="menu in sideMenus"
              :key="menu.name"
              :active="activeMenu === menu.name"
              @click="activeMenu = menu.name"
              class="sidebar-item"
              rounded="lg"
              :color="activeMenu === menu.name ? 'primary' : undefined"
          >
            <v-list-item-title :class="activeMenu === menu.name ? 'sidebar-active' : ''">
              {{ menu.name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- 右侧内容区域 -->
      <v-container class="portal-content" fluid>
        <v-row class="module-grid" align="stretch">
          <v-col
              v-for="module in currentModules"
              :key="module.name"
              cols="12" sm="6" md="4" lg="3"
          >
            <v-card
                class="module-card"
                variant="outlined"
                @click="navigateTo(module.path)"
                elevation="2"
                hover
            >
              <v-card-text>
                <div class="module-icon">{{ module.icon }}</div>
                <div class="module-name">{{ module.name }}</div>
                <div class="module-desc">{{ module.desc }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearToken } from '@/utils/auth'

const router = useRouter()

const activeTab = ref('apps')
const activeMenu = ref('发票云')
const drawer = ref(true)

const sideMenus = [
  { name: '发票云' },
  { name: '资金云' },
  { name: '员工服务云' },
  { name: '财务云' },
  { name: '基础服务云' },
]

const modulesMap = {
  '发票云': [
    { name: '税企直连', path: '/tax-connect', icon: '📄', desc: '企业税务数据对接' },
    { name: '开票管理', path: '/invoice', icon: '🧾', desc: '发票开具与管理' },
    { name: '收票管理', path: '/receipt', icon: '📥', desc: '发票收集与管理' },
  ],
  '资金云': [
    { name: '资金调度', path: '/funds', icon: '💰', desc: '资金流转调度' },
    { name: '资金结算', path: '/settlement', icon: '📝', desc: '资金结算处理' },
    { name: '票据管理', path: '/bills', icon: '🏦', desc: '票据业务管理' },
  ],
  '员工服务云': [
    { name: '人人差旅', path: '/travel', icon: '✈️', desc: '差旅报销管理' },
    { name: '人人费用', path: '/expenses', icon: '💳', desc: '费用报销管理' },
    { name: '报账工作台', path: '/workbench', icon: '🖥️', desc: '统一报账工作平台' },
  ],
  '财务云': [
    { name: '总账', path: '/ledger', icon: '📚', desc: '总账处理与报表' },
    { name: '基础资料', path: '/finance/base-data', icon: '📚', desc: '财务基础资料' },
    { name: '费用核算', path: '/cost', icon: '💼', desc: '费用核算流程' },
    { name: '财务报表', path: '/reports', icon: '📊', desc: '财务分析报表' },
    { name: '应付', path: '/payable', icon: '💳', desc: '应付业务管理' },
    { name: '应收', path: '/receivable', icon: '💰', desc: '应收业务管理' },
  ],
  '基础服务云': [
    { name: '企业建模', path: '/enterprise-modeling', icon: '🏗️', desc: '企业业务建模' },
    { name: '基础资料', path: '/base-data', icon: '📚', desc: '主数据与公共数据管理' },
  ],
}

const currentModules = computed(() => modulesMap[activeMenu.value] || [])

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
})

function navigateTo(path) {
  // 打开新标签页访问目标路由
  const url = router.resolve(path).href
  window.open(url, '_blank')
}

function handleLogout() {
  snackbar.value = {
    show: true,
    text: '已退出登录',
    color: 'success',
  }
  clearToken()
  setTimeout(() => router.push('/login'), 900)
}
</script>

<style scoped>
.portal-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f6ff 100%);
}

.logo {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  user-select: none;
}

.portal-tabs {
  margin-left: 60px;
  min-width: 380px;
  font-size: 17px;
}

.logout-btn {
  margin-left: 40px;
  font-size: 15px;
}

.portal-body {
  display: flex;
  min-height: calc(100vh - 64px);
  background: none;
}

.portal-sidebar {
  border-right: 1px solid #e4eaf2;
}

.sidebar-item {
  font-size: 16px;
  font-weight: 500;
  color: #2e3e59 !important;
  cursor: pointer;
  padding-left: 18px;
  margin: 2px 0;
  border-radius: 10px;
  min-height: 48px;
  display: flex;
  align-items: center;
  transition: background 0.18s, color 0.18s;
}
.sidebar-item:deep(.v-list-item--active), .sidebar-item.active, .sidebar-active {
  background: #e7f1ff !important;
  color: #1976d2 !important;
  font-weight: bold !important;
}

.portal-content {
  flex: 1;
  padding: 30px 30px 30px 35px;
  background: none;
}

.module-grid {
  width: 100%;
}

.module-card {
  border-radius: 18px;
  text-align: center;
  min-height: 148px;
  transition: box-shadow 0.3s, border 0.2s;
  border: 1.5px solid #e6eaf3 !important;
  cursor: pointer;
  background: #fff;
}
.module-card:hover {
  box-shadow: 0 8px 26px 0 rgba(72, 129, 240, 0.11);
  border-color: #b5cdfb !important;
  background: #fafdff;
}
.module-icon {
  font-size: 37px;
  margin-bottom: 8px;
  line-height: 1.2;
  color: #246efc;
}
.module-name {
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 17px;
  color: #20294a;
  letter-spacing: 1px;
}
.module-desc {
  font-size: 13px;
  color: #7381a7;
  line-height: 1.5;
}
</style>
