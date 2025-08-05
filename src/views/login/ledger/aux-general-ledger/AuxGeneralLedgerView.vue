<template>
  <div class="aux-general-ledger-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">辅助总账</h2>
      </div>
      <v-data-table :headers="headers" :items="list" :loading="loading" class="elevation-0" hide-default-footer />
    </v-card>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ledgerApi from '@/api/ledgerReport'

const list = ref([])
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'info' })

const headers = [
  { title: '维度', value: 'dimension' },
  { title: '借方', value: 'debit' },
  { title: '贷方', value: 'credit' },
  { title: '余额', value: 'balance' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await ledgerApi.fetchAuxGeneralLedger()
    list.value = res.data?.records || []
  } catch (e) {
    showMsg('加载数据失败', 'error')
  } finally {
    loading.value = false
  }
}

function showMsg(text, color = 'info') {
  snackbar.value = { show: true, text, color }
}

onMounted(fetchData)
</script>

<style scoped>
.aux-general-ledger-page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
