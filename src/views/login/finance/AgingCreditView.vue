<template>
  <div class="page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">{{ title }}-账龄与信用预警</h2>
        <div class="toolbar">
          <v-text-field v-model="asOfDate" type="date" label="统计日期" density="compact" variant="outlined" hide-details style="max-width: 200px" class="mr-2" />
          <v-btn color="primary" variant="tonal" @click="reloadAll">刷新</v-btn>
        </div>
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4">
            <div class="section-title">账龄汇总</div>
            <div class="mt-2">单据数：{{ aging.docCount || 0 }}</div>
            <div>总金额：{{ aging.totalAmount || 0 }}</div>
            <v-table density="compact" class="mt-3">
              <thead><tr><th>区间</th><th>金额</th></tr></thead>
              <tbody>
                <tr v-for="b in aging.buckets || []" :key="b.range">
                  <td>{{ b.range }}</td><td>{{ b.amount }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4">
            <div class="section-title">信用配置</div>
            <v-row class="mt-2" dense>
              <v-col cols="12" md="4"><v-text-field v-model="configForm.fcounterparty" label="往来方" density="compact" variant="outlined" hide-details /></v-col>
              <v-col cols="12" md="3"><v-text-field v-model.number="configForm.fcreditLimit" type="number" label="信用额度" density="compact" variant="outlined" hide-details /></v-col>
              <v-col cols="12" md="3"><v-text-field v-model.number="configForm.foverdueDaysThreshold" type="number" label="逾期阈值(天)" density="compact" variant="outlined" hide-details /></v-col>
              <v-col cols="12" md="2"><v-btn color="primary" block @click="saveConfig">保存</v-btn></v-col>
            </v-row>
            <v-data-table :headers="configHeaders" :items="configs" density="compact" hide-default-footer class="mt-3" />
          </v-card>
        </v-col>
      </v-row>

      <v-card variant="outlined" class="pa-4 mt-4">
        <div class="section-title">预警列表</div>
        <v-data-table :headers="warnHeaders" :items="warnings" density="compact" hide-default-footer class="mt-2" />
      </v-card>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/arap-doc'

const route = useRoute()
const title = computed(() => route.meta?.titleRoot || '应收')
const docTypeRoot = computed(() => route.meta?.docTypeRoot || 'AR')
const asOfDate = ref(new Date().toISOString().slice(0, 10))

const aging = reactive({ docCount: 0, totalAmount: 0, buckets: [] })
const configs = ref([])
const warnings = ref([])
const snackbar = reactive({ show: false, text: '', color: 'success' })

const configForm = reactive({ fcounterparty: '', fcreditLimit: null, foverdueDaysThreshold: 30, fenabled: 1, fremark: '' })

const configHeaders = [
  { title: '往来方', value: 'fcounterparty' },
  { title: '信用额度', value: 'fcreditLimit' },
  { title: '逾期阈值(天)', value: 'foverdueDaysThreshold' },
  { title: '状态', value: 'fenabled' },
]

const warnHeaders = [
  { title: '往来方', value: 'counterparty' },
  { title: '未结金额', value: 'totalOutstanding' },
  { title: '信用额度', value: 'creditLimit' },
  { title: '最大逾期天数', value: 'maxOverdueDays' },
  { title: '超限', value: 'overLimit' },
  { title: '超期', value: 'overdue' },
]

function show(text, color = 'success') { snackbar.text = text; snackbar.color = color; snackbar.show = true }

async function loadAging() {
  const res = await api.getAgingSummary({ docTypeRoot: docTypeRoot.value, asOfDate: asOfDate.value })
  Object.assign(aging, res.data || { docCount: 0, totalAmount: 0, buckets: [] })
}

async function loadConfigs() {
  const res = await api.getCreditConfigList({ docTypeRoot: docTypeRoot.value })
  configs.value = res.data || []
}

async function loadWarnings() {
  const res = await api.getCreditWarnings({ docTypeRoot: docTypeRoot.value, asOfDate: asOfDate.value })
  warnings.value = res.data || []
}

async function reloadAll() {
  try {
    await Promise.all([loadAging(), loadConfigs(), loadWarnings()])
  } catch (e) {
    show(e?.response?.data?.message || e?.message || '加载失败', 'error')
  }
}

async function saveConfig() {
  if (!configForm.fcounterparty || !configForm.fcreditLimit) {
    show('请填写往来方和信用额度', 'error')
    return
  }
  try {
    await api.saveCreditConfig({ ...configForm, fdocTypeRoot: docTypeRoot.value })
    show('保存成功')
    configForm.fcounterparty = ''
    configForm.fcreditLimit = null
    configForm.foverdueDaysThreshold = 30
    await Promise.all([loadConfigs(), loadWarnings()])
  } catch (e) {
    show(e?.response?.data?.message || e?.message || '保存失败', 'error')
  }
}

onMounted(reloadAll)
</script>

<style scoped>
.page{padding:24px}.header{margin-bottom:16px}.title{font-size:22px;font-weight:bold;color:#27324c;letter-spacing:2px;margin-bottom:12px}.toolbar{display:flex;align-items:center}.section-title{font-weight:700;color:#2a3d66}
</style>
