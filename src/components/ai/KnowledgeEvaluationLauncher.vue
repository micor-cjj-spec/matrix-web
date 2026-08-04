<template>
  <v-btn
    v-if="visible"
    class="evaluation-launcher"
    color="primary"
    :prepend-icon="launcherIcon"
    elevation="8"
    @click="router.push(targetPath)"
  >
    {{ launcherText }}
  </v-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const visible = computed(() => [
  '/ai/knowledge',
  '/ai/knowledge/evaluations',
  '/ai/knowledge/evaluations/curation',
  '/ai/knowledge/evaluations/traces',
].includes(route.path))

const targetPath = computed(() => {
  if (route.path === '/ai/knowledge') return '/ai/knowledge/evaluations'
  if (route.path === '/ai/knowledge/evaluations') return '/ai/knowledge/evaluations/traces'
  if (route.path === '/ai/knowledge/evaluations/traces') return '/ai/knowledge/evaluations/curation'
  return '/ai/knowledge/evaluations'
})

const launcherText = computed(() => {
  if (route.path === '/ai/knowledge') return '检索评测'
  if (route.path === '/ai/knowledge/evaluations') return 'Trace 诊断'
  if (route.path === '/ai/knowledge/evaluations/traces') return '财务问题标注'
  return '返回评测'
})

const launcherIcon = computed(() => {
  if (route.path === '/ai/knowledge/evaluations') return 'mdi-source-branch'
  if (route.path === '/ai/knowledge/evaluations/traces') return 'mdi-clipboard-text-search-outline'
  return 'mdi-chart-box-outline'
})
</script>

<style scoped>
.evaluation-launcher {
  position: fixed;
  top: 22px;
  right: 24px;
  z-index: 1200;
  border-radius: 999px;
}

@media (max-width: 720px) {
  .evaluation-launcher {
    top: auto;
    right: 18px;
    bottom: 110px;
  }
}
</style>
