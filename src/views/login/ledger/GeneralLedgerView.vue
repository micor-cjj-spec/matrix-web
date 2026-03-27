<template>
  <div class="ledger-page">
    <v-card v-for="group in groups" :key="group.name" class="group-card" elevation="2">
      <div class="group-title">{{ group.name }}</div>
      <v-row dense>
        <v-col
          v-for="module in group.modules"
          :key="module.name"
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-card class="module-card" hover elevation="0" @click="handleModuleClick(module)">
            <div class="module-badge">{{ module.badge || module.name.slice(0, 2) }}</div>
            <div class="module-name">{{ module.name }}</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <router-view />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const groups = [
  {
    name: '凭证处理',
    modules: [
      { name: '凭证', badge: 'V', path: '/ledger/voucher' },
      { name: '凭证汇总表', badge: 'VS' },
      { name: '结转清单', badge: 'CL' },
    ],
  },
  {
    name: '账表查询',
    modules: [
      { name: '科目余额表', badge: 'SB', path: '/ledger/subject-balance' },
      { name: '总分类账', badge: 'GL', path: '/ledger/general-ledger' },
      { name: '明细分类账', badge: 'DL', path: '/ledger/detail-ledger' },
      { name: '日报表', badge: 'DR', path: '/ledger/daily-report' },
      { name: '核算维度余额表', badge: 'DB', path: '/ledger/dimension-balance' },
      { name: '辅助核算维度余额表', badge: 'AB', path: '/ledger/aux-dimension-balance' },
      { name: '辅助总账', badge: 'AG', path: '/ledger/aux-general-ledger' },
      { name: '辅助明细账', badge: 'AD', path: '/ledger/aux-detail-ledger' },
    ],
  },
  {
    name: '现金流量',
    modules: [
      { name: '现金流量表', badge: 'CF', path: '/ledger/cash-flow' },
      { name: '现金流量查询', badge: 'CQ' },
      { name: '补充资料', badge: 'EX' },
    ],
  },
  {
    name: '往来管理',
    modules: [
      { name: '往来核销方案', badge: 'CP' },
      { name: '往来自动核销', badge: 'CA' },
      { name: '往来对账单', badge: 'CS' },
      { name: '往来账查询', badge: 'CQ' },
      { name: '往来核销日志', badge: 'CL' },
      { name: '账龄分析表', badge: 'AG' },
      { name: '往来多维分析表', badge: 'MA' },
    ],
  },
  {
    name: '内部通知单',
    modules: [
      { name: '往来通知单', badge: 'CN' },
      { name: '往来通知单勾稽', badge: 'CC' },
      { name: '现金流通知单', badge: 'FN' },
      { name: '现金流通知单勾稽', badge: 'FC' },
    ],
  },
  {
    name: '账簿协同管理',
    modules: [
      { name: '凭证折算规则', badge: 'VR' },
      { name: '对冲凭证', badge: 'OV' },
      { name: '凭证协同检查', badge: 'VC' },
      { name: '科目余额对照', badge: 'SC' },
    ],
  },
  {
    name: '期末处理',
    modules: [
      { name: '结转损益', badge: 'PL' },
      { name: '自动转账', badge: 'AT' },
      { name: '期末调汇', badge: 'FX' },
      { name: '凭证摊销', badge: 'AM' },
      { name: '期末结账', badge: 'CL' },
      { name: '监控中心', badge: 'MC' },
    ],
  },
  {
    name: '分析报表',
    modules: [
      { name: '报表项目', badge: 'RI', path: '/ledger/report-item' },
      { name: '财务指标', badge: 'KP' },
      { name: '资产负债表', badge: 'BS', path: '/ledger/balance-sheet' },
      { name: '利润表', badge: 'PL', path: '/ledger/profit-statement' },
      { name: '企业纳税表', badge: 'TX' },
      { name: '现金流量表', badge: 'CF', path: '/ledger/cash-flow' },
    ],
  },
  {
    name: '初始化',
    modules: [
      { name: '科目余额初始化', badge: 'SI' },
      { name: '现金流初始化', badge: 'CI' },
      { name: '往来余额初始化', badge: 'BI' },
    ],
  },
  {
    name: '基础设置',
    modules: [
      { name: '凭证类型', badge: 'VT' },
      { name: '现金流量项目', badge: 'CF' },
      { name: '科目现金流映射关系', badge: 'CM' },
      { name: '核算维度关系设置', badge: 'DR' },
      { name: '核算维度值范围设置', badge: 'DV' },
      { name: '所有者权益变动类型', badge: 'EQ' },
      { name: '减值准备性质', badge: 'IM' },
      { name: '车辆牌照号项目', badge: 'LP' },
      { name: '成本性质', badge: 'CT' },
    ],
  },
]

const snackbar = ref({ show: false, text: '', color: 'info' })

function handleModuleClick(module) {
  if (module.path) {
    const url = router.resolve(module.path).href
    window.open(url, '_blank')
    return
  }

  snackbar.value = {
    show: true,
    text: `模块 ${module.name} 暂未接通`,
    color: 'info',
  }
}
</script>

<style scoped>
.ledger-page {
  padding: 24px;
}

.group-card {
  margin-bottom: 26px;
  padding: 20px 16px 16px;
  border-radius: 16px;
}

.group-title {
  margin-bottom: 18px;
  color: #2850a7;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
}

.module-card {
  display: flex;
  min-height: 120px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5eaf3;
  border-radius: 12px;
  background: #fff;
  padding: 22px 12px 18px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.26s, transform 0.18s, border-color 0.18s;
}

.module-card:hover {
  transform: translateY(-3px);
  border-color: #90bafd;
  background: #fafdff;
  box-shadow: 0 8px 24px rgba(71, 109, 200, 0.12);
}

.module-badge {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ecf3ff 0%, #dbe9ff 100%);
  color: #2850a7;
  font-size: 14px;
  font-weight: 700;
}

.module-name {
  color: #24457a;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}
</style>
