<template>
  <div class="enterprise-modeling-page">
    <!-- 卡片分组区域 -->
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
          <v-card
              class="module-card"
              @click="handleModuleClick(module)"
              hover
              elevation="0"
              outlined
          >
            <div class="module-icon">{{ module.icon }}</div>
            <div class="module-name">{{ module.name }}</div>
          </v-card>
        </v-col>
        <!-- + 卡片 -->
        <v-col cols="12" sm="6" md="3" lg="2">
          <v-card
              class="module-card add-card"
              hover
              elevation="0"
              outlined
              @click="handleAddModule(group)"
          >
            <div class="module-icon">＋</div>
            <div class="module-name">添加</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- 子路由出口 -->
    <router-view></router-view>

    <!-- 顶部snackbar提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { useEnterpriseModeling } from '@/composables/login/enterprise-modeling/useEnterpriseModeling.js'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const { groups } = useEnterpriseModeling()

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
})

function handleModuleClick(module) {
  if (module.path) {
    // 使用新标签页打开目标路由
    const url = router.resolve(module.path).href
    window.open(url, '_blank')
  } else {
    showMsg(`点击了模块：${module.name}`, 'info')
  }
}

function handleAddModule(group) {
  showMsg(`添加模块到分组：${group.name}`, 'success')
}

function showMsg(text, color = 'info') {
  snackbar.value.text = text
  snackbar.value.color = color
  snackbar.value.show = true
}
</script>

<style scoped>
.enterprise-modeling-page {
  padding: 24px;
}
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
.add-card {
  color: #276ef1;
  border: 2px dashed #1976d2 !important;
  background-color: #f6fafd;
  font-weight: 700;
}
.add-card .module-icon {
  font-size: 35px;
  color: #1976d2;
}
</style>
