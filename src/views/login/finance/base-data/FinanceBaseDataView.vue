<template>
  <div class="ledger-base-page">
    <div class="page-header">
      <div>
        <h2 class="title">财务基础资料</h2>
        <div class="subtitle">先把会计科目和报表主数据配好，三大报表和现金流量表后面就能稳定接数。</div>
      </div>
    </div>

    <div class="section-title">已可使用</div>
    <v-row dense class="mb-6">
      <v-col v-for="module in activeModules" :key="module.name" cols="12" sm="6" md="3">
        <v-card class="module-card" @click="handleModuleClick(module)" hover elevation="0">
          <div class="module-code">{{ module.code }}</div>
          <div class="module-name">{{ module.name }}</div>
          <div class="module-desc">{{ module.description }}</div>
        </v-card>
      </v-col>
    </v-row>

    <div class="section-title">待补充</div>
    <v-row dense>
      <v-col v-for="module in planningModules" :key="module.name" cols="12" sm="6" md="3">
        <v-card class="module-card muted-card" elevation="0">
          <div class="module-code">{{ module.code }}</div>
          <div class="module-name">{{ module.name }}</div>
          <div class="module-desc">{{ module.description }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeModules = [
  {
    code: 'GL',
    name: '会计科目',
    description: '维护科目层级、损益类型、报表项目以及现金类标记。',
    path: '/finance/base-data/account-subject',
  },
  {
    code: 'RP',
    name: '报表项目',
    description: '查看三大报表项目定义和模板结构。',
    path: '/ledger/report-item',
  },
  {
    code: 'CF',
    name: '现金流量项目',
    description: '维护现金流项目主数据，供凭证分录与现金流量表归集使用。',
    path: '/ledger/cashflow-item',
  },
  {
    code: 'MAP',
    name: '报表科目映射',
    description: '维护会计科目与报表项目之间的显式映射关系。',
    path: '/ledger/report-account-map',
  },
]

const planningModules = [
  { code: 'PER', name: '会计期间', description: '后续可补会计期间关闭、开账和锁账控制。' },
  { code: 'BOOK', name: '会计账簿', description: '后续可补账簿类型、账簿组织范围和账套控制。' },
  { code: 'DIM', name: '核算维度', description: '后续可补辅助核算维度与科目约束联动。' },
  { code: 'VER', name: '科目版本', description: '后续可补科目版本和历史口径切换。' },
]

const snackbar = ref({ show: false, text: '', color: 'info' })

function handleModuleClick(module) {
  if (!module.path) {
    snackbar.value = { show: true, text: `${module.name} 暂未开放`, color: 'info' }
    return
  }
  router.push(module.path)
}
</script>

<style scoped>
.ledger-base-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.title {
  margin: 0;
  color: #24344d;
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
}

.section-title {
  margin-bottom: 12px;
  color: #24344d;
  font-size: 16px;
  font-weight: 700;
}

.module-card {
  height: 100%;
  border: 1px solid #e5eaf3;
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.module-card:hover {
  transform: translateY(-2px);
  border-color: #9db8ff;
  box-shadow: 0 10px 24px rgba(69, 96, 173, 0.08);
}

.muted-card {
  cursor: default;
  background: #fafbfc;
}

.muted-card:hover {
  transform: none;
  border-color: #e5eaf3;
  box-shadow: none;
}

.module-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2b5fc7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.module-name {
  margin-top: 16px;
  color: #24344d;
  font-size: 18px;
  font-weight: 700;
}

.module-desc {
  margin-top: 10px;
  color: #667085;
  font-size: 14px;
  line-height: 1.6;
}
</style>
