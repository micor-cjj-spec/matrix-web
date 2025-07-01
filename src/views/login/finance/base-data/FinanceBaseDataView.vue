<template>
  <div class="ledger-base-page">
    <v-row dense>
      <v-col v-for="module in modules" :key="module.name" cols="12" sm="6" md="3" lg="2">
        <v-card class="module-card" @click="handleModuleClick(module)" hover elevation="0" outlined>
          <div class="module-icon">{{ module.icon }}</div>
          <div class="module-name">{{ module.name }}</div>
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

const modules = [
  { name: '会计期间', icon: '📅' },
  { name: '账簿类型', icon: '📚' },
  { name: '会计账簿', icon: '📖' },
  { name: '核算维度', icon: '📐' },
  { name: '科目表', icon: '📂' },
  { name: '会计科目', icon: '📝', path: '/finance/base-data/account-subject' },
  { name: '科目对照关系', icon: '🔗' },
  { name: '科目版本化', icon: '🗂️' },
  { name: '核算体系', icon: '🏢' }
]

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
.ledger-base-page { padding: 24px; }
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

