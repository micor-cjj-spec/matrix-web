<template>
  <div class="voucher-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">凭证</h2>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="addVoucher">新增凭证</v-btn>
      </div>
      <v-data-table :headers="headers" :items="vouchers" :loading="loading" item-key="fid" class="elevation-0" hide-default-footer>
        <template #item.actions="{ item }">
          <v-btn size="small" color="primary" variant="tonal" @click="editVoucher(item)">编辑</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import voucherApi from '@/api/voucher'

const vouchers = ref([])
const loading = ref(false)

const headers = [
  { title: '凭证号', value: 'number' },
  { title: '日期', value: 'date' },
  { title: '摘要', value: 'summary' },
  { title: '金额', value: 'amount' },
  { title: '操作', value: 'actions', sortable: false, align: 'center', width: 100 }
]

const snackbar = ref({ show: false, text: '', color: 'info' })

async function fetchVouchers() {
  loading.value = true
  try {
    const res = await voucherApi.fetchList()
    vouchers.value = res.data?.records || []
  } catch (e) {
    showMsg('加载凭证失败', 'error')
  } finally {
    loading.value = false
  }
}

function addVoucher() {
  showMsg('点击新增凭证')
}

function editVoucher(item) {
  showMsg(`编辑 ${item.number}`)
}

function showMsg(text, color = 'info') {
  snackbar.value = { show: true, text, color }
}

onMounted(fetchVouchers)
</script>

<style scoped>
.voucher-page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; letter-spacing: 2px; }
</style>
