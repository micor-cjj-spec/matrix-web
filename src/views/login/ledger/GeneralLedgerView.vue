<template>
  <div class="ledger-page">
    <v-card v-for="group in groups" :key="group.name" class="group-card" elevation="2">
      <div class="group-title">{{ group.name }}</div>
      <v-row dense>
        <v-col v-for="module in group.modules" :key="module.name" cols="12" sm="6" md="3" lg="2">
          <v-card class="module-card" @click="handleModuleClick(module)" hover elevation="0" outlined>
            <div class="module-icon">{{ module.icon }}</div>
            <div class="module-name">{{ module.name }}</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
    <router-view></router-view>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const groups = ref([
  {
    name: '凭证处理',
    modules: [
      { name: '凭证', icon: '📄', path: '/ledger/voucher' },
      { name: '凭证汇总表', icon: '📊' },
      { name: '结转清单', icon: '🧾' }
    ]
  },
  {
    name: '账表查询',
    modules: [
      { name: '科目余额表', icon: '📈', path: '/ledger/subject-balance' },
      { name: '总分类账', icon: '📂', path: '/ledger/general-ledger' },
      { name: '明细分类账', icon: '📑', path: '/ledger/detail-ledger' },
      { name: '日报表', icon: '🗓️', path: '/ledger/daily-report' },
      { name: '核算维度余额表', icon: '📊', path: '/ledger/dimension-balance' },
      { name: '辅助核算维度余额表', icon: '📊', path: '/ledger/aux-dimension-balance' },
      { name: '辅助总账', icon: '📋', path: '/ledger/aux-general-ledger' },
      { name: '辅助明细账', icon: '📋', path: '/ledger/aux-detail-ledger' }
    ]
  },
  {
    name: '现金流量',
    modules: [
      { name: '现金流量表', icon: '💧' },
      { name: '现金流量查询', icon: '🔍' },
      { name: '补充资料', icon: '➕' }
    ]
  },
  {
    name: '往来管理',
    modules: [
      { name: '往来核销方案', icon: '📝' },
      { name: '往来自动核销', icon: '⚙️' },
      { name: '往来对账单', icon: '📃' },
      { name: '往来账查询', icon: '🔍' },
      { name: '往来核销日志', icon: '📑' },
      { name: '账龄分析表', icon: '📊' },
      { name: '往来多维分析表', icon: '📈' }
    ]
  },
  {
    name: '内部通知单',
    modules: [
      { name: '往来通知单', icon: '📮' },
      { name: '往来通知单勾稽', icon: '✅' },
      { name: '现金流量通知单', icon: '📮' },
      { name: '现金流量通知单勾稽', icon: '✅' }
    ]
  },
  {
    name: '账簿协同管理',
    modules: [
      { name: '凭证折算规则', icon: '⚖️' },
      { name: '对照凭证', icon: '📑' },
      { name: '凭证协同检查', icon: '🔎' },
      { name: '科目余额对照', icon: '📊' }
    ]
  },
  {
    name: '期末处理',
    modules: [
      { name: '结转损益', icon: '🔄' },
      { name: '自动转账', icon: '💱' },
      { name: '期末调汇', icon: '💹' },
      { name: '凭证摊销', icon: '🧾' },
      { name: '期末结帐', icon: '📅' },
      { name: '监控中心', icon: '🖥️' }
    ]
  },
  {
    name: '分析报表',
    modules: [
      { name: '报表项目', icon: '📑' },
      { name: '财务指标', icon: '📊' },
      { name: '资产负债表', icon: '📈' },
      { name: '利润表', icon: '💹' },
      { name: '企业纳税表', icon: '💰' },
      { name: '现金流量表', icon: '💧' }
    ]
  },
  {
    name: '初始化',
    modules: [
      { name: '科目余额初始化', icon: '⚙️' },
      { name: '现金流量初始化', icon: '⚙️' },
      { name: '往来余额初始化', icon: '⚙️' }
    ]
  },
  {
    name: '基础设置',
    modules: [
      { name: '凭证类型', icon: '📄' },
      { name: '现金流量项目', icon: '💧' },
      { name: '科目现金流量映射关系', icon: '🔗' },
      { name: '核算维度关系设置', icon: '⚙️' },
      { name: '核算维度值范围设置', icon: '📏' },
      { name: '所有者权益变动类型', icon: '🏷️' },
      { name: '减值准备性质', icon: '📄' },
      { name: '车辆牌照号项目', icon: '🚗' },
      { name: '成本性质', icon: '💲' }
    ]
  }
])

const snackbar = ref({ show: false, text: '', color: 'info' })

function handleModuleClick(module) {
  if (module.path) {
    const url = router.resolve(module.path).href
    window.open(url, '_blank')
  } else {
    snackbar.value = { show: true, text: `点击了模块：${module.name}`, color: 'info' }
  }
}
</script>

<style scoped>
.ledger-page { padding: 24px; }
.group-card {
  margin-bottom: 26px;
  padding: 20px 16px 16px 16px;
  border-radius: 16px;
}
.group-title {
  font-size: 17px;
  font-weight: bold;
  margin-bottom: 19px;
  color: #2850a7;
  letter-spacing: 1.5px;
}
.module-card {
  background-color: #fff;
  border: 1.3px solid #e5eaf3 !important;
  border-radius: 11px;
  padding: 24px 0 16px 0;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.26s, transform 0.18s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 122px;
}
.module-card:hover {
  box-shadow: 0 6px 20px rgba(71, 109, 200, 0.11);
  transform: translateY(-3px) scale(1.04);
  border-color: #90bafd !important;
  background: #fafdff;
}
.module-icon {
  font-size: 38px;
  margin-bottom: 13px;
}
.module-name {
  font-size: 15px;
  color: #24457a;
  font-weight: 500;
  letter-spacing: 1px;
}
</style>

