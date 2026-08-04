<template>
  <v-btn
    v-if="visible"
    class="evaluation-launcher"
    color="primary"
    prepend-icon="mdi-chart-box-outline"
    elevation="8"
    @click="router.push('/ai/knowledge/evaluations')"
  >
    检索评测
  </v-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const visible = computed(() => route.path === '/ai/knowledge')
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
