<template>
  <div class="page">
    <v-card elevation="4" class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">往来对账单</h2>
          <div class="page-subtitle">
            按单据维度展示原额、已核销金额、未核销金额和最近核销批次，适合作为往来方对账和业务复核的主报表。
          </div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="fetchData">查询</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="2">
          <v-select
            v-model="query.docTypeRoot"
            :items="docTypeRootOptions"
            label="往来类型"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.trim="query.counterparty"
            label="往来方"
            density="comfortable"
            placeholder="不填则查看全部往来方"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="query.asOfDate"
            type="date"
            label="统计日期"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="2" class="switch-col">
          <v-switch
            v-model="query.openOnly"
            color="primary"
            inset
            label="仅看未核销"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense class="summary-row">
        <v-col v-for="card in summaryCards" :key="card.label" cols="12" md="3">
          <v-card class="summary-card" elevation="0">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value" :class="card.tone">{{ card.value }}</div>
            <div v-if="card.tip" class="summary-tip">{{ card.tip }}</div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="warnings.length" class="alert-list">
        <v-alert
          v-for="warning in warnings"
          :key="warning"
          type="warning"
          variant="tonal"
          density="comfortable"
          class="mb-2"
        >
          {{ warning }}
        </v-alert>
      </div>

      <div class="section-title">对账明细</div>
      <v-data-table
        :headers="docHeaders"
        :items="rows"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0 mb-6"
      >
        <template #item.role="{ item }">
          <v-chip size="small" variant="tonal" :color="roleTone(item.role)">
            {{ roleLabel(item.role) }}
          </v-chip>
        </template>
        <template #item.amount="{ item }">{{ formatAmount(item.amount) }}</template>
        <template #item.writtenOffAmount="{ item }">{{ formatAmount(item.writtenOffAmount) }}</template>
        <template #item.openAmount="{ item }">{{ formatAmount(item.openAmount) }}</template>
        <template #item.writeoffStatus="{ item }">
          <v-chip size="small" variant="tonal" :color="writeoffStatusColor(item.writeoffStatus)">
            {{ writeoffStatusLabel(item.writeoffStatus) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.voucherNumber"
            size="small"
            variant="text"
            color="primary"
            @click="openVoucher(item.voucherNumber)"
          >
            查看凭证
          </v-btn>
        </template>
      </v-data-table>

      <div class="section-title">最近核销批次</div>
      <v-data-table
        :headers="logHeaders"
        :items="recentLogs"
        :loading="loading"
        item-key="fid"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.totalAmount="{ item }">{{ formatAmount(item.totalAmount) }}</template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            @click="openWriteoffLog(item.planCode)"
          >
            查看明细
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import arapManageApi from '@/api/arapManage'
import {
  currentDate,
  docTypeRootOptions,
  formatAmount,
  roleLabel,
  roleTone,
  writeoffStatusColor,
  writeoffStatusLabel,
} from './arapManageShared'

const router = useRouter()
const loading = ref(false)
const rows = ref([])
const recentLogs = ref([])
const warnings = ref([])
const summary = reactive({
  totalAmount: 0,
  writtenOffAmount: 0,
  openAmount: 0,
  docCount: 0,
  openDocCount: 0,
  recentWriteoffCount: 0,
})

const query = reactive({
  docTypeRoot: 'AR',
  counterparty: '',
  asOfDate: currentDate(),
  openOnly: false,
})

const docHeaders = [
  { title: '往来方', key: 'counterparty', value: 'counterparty', width: 160 },
  { title: '单据类型', key: 'docType', value: 'docType', width: 140 },
  { title: '单据号', key: 'number', value: 'number', width: 160 },
  { title: '单据日期', key: 'docDate', value: 'docDate', width: 110 },
  { title: '角色', key: 'role', value: 'role', width: 110, align: 'center' },
  { title: '状态', key: 'status', value: 'status', width: 110, align: 'center' },
  { title: '原额', key: 'amount', value: 'amount', width: 120, align: 'end' },
  { title: '已核销', key: 'writtenOffAmount', value: 'writtenOffAmount', width: 120, align: 'end' },
  { title: '未核销', key: 'openAmount', value: 'openAmount', width: 120, align: 'end' },
  { title: '核销状态', key: 'writeoffStatus', value: 'writeoffStatus', width: 120, align: 'center' },
  { title: '账龄', key: 'ageDays', value: 'ageDays', width: 88, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const logHeaders = [
  { title: '方案号', key: 'planCode', value: 'planCode', minWidth: 220 },
  { title: '模式', key: 'mode', value: 'mode', width: 96, align: 'center' },
  { title: '链接数', key: 'linkCount', value: 'linkCount', width: 90, align: 'center' },
  { title: '金额', key: 'totalAmount', value: 'totalAmount', width: 120, align: 'end' },
  { title: '操作人', key: 'operator', value: 'operator', width: 120 },
  { title: '操作时间', key: 'operateTime', value: 'operateTime', width: 180 },
  { title: '操作', key: 'actions', value: 'actions', width: 100, align: 'center' },
]

const summaryCards = computed(() => [
  {
    label: '单据原额',
    value: formatAmount(summary.totalAmount),
    tip: `${summary.docCount} 张单据`,
    tone: 'tone-primary',
  },
  {
    label: '已核销金额',
    value: formatAmount(summary.writtenOffAmount),
    tip: `最近批次 ${summary.recentWriteoffCount} 次`,
    tone: 'tone-success',
  },
  {
    label: '未核销金额',
    value: formatAmount(summary.openAmount),
    tip: `${summary.openDocCount} 张未核销单据`,
    tone: 'tone-warning',
  },
  {
    label: '核销率',
    value: summary.totalAmount ? `${((summary.writtenOffAmount / summary.totalAmount) * 100).toFixed(2)}%` : '0.00%',
    tip: '已核销金额 / 单据原额',
    tone: 'tone-danger',
  },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await arapManageApi.fetchCounterpartyStatement({
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      asOfDate: query.asOfDate || undefined,
      openOnly: query.openOnly,
    })
    const data = res.data || {}
    rows.value = data.rows || []
    recentLogs.value = data.recentLogs || []
    warnings.value = data.warnings || []
    summary.totalAmount = Number(data.totalAmount || 0)
    summary.writtenOffAmount = Number(data.writtenOffAmount || 0)
    summary.openAmount = Number(data.openAmount || 0)
    summary.docCount = Number(data.docCount || 0)
    summary.openDocCount = Number(data.openDocCount || 0)
    summary.recentWriteoffCount = Number(data.recentWriteoffCount || 0)
  } catch (error) {
    rows.value = []
    recentLogs.value = []
    warnings.value = ['往来对账单加载失败。']
  } finally {
    loading.value = false
  }
}

function openVoucher(number) {
  const routeData = router.resolve({ path: '/ledger/voucher', query: { number } })
  window.open(routeData.href, '_blank')
}

function openWriteoffLog(planCode) {
  router.push({
    path: '/ledger/counterparty-writeoff-log',
    query: {
      docTypeRoot: query.docTypeRoot,
      counterparty: query.counterparty || undefined,
      planCode,
    },
  })
}

onMounted(fetchData)
</script>

<style scoped>
.page { padding: 24px; }
.page-card { padding: 24px; border-radius: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-title { margin: 0; color: #1d3f8f; font-size: 24px; font-weight: 700; }
.page-subtitle { margin-top: 8px; color: #5d6b85; font-size: 14px; line-height: 1.7; }
.page-actions { display: flex; gap: 8px; }
.switch-col { display: flex; align-items: center; }
.summary-row { margin-bottom: 18px; }
.summary-card { height: 100%; border: 1px solid #e8eef7; border-radius: 14px; background: linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%); padding: 18px; }
.summary-label { color: #6d7891; font-size: 13px; }
.summary-value { margin-top: 8px; font-size: 28px; font-weight: 700; }
.summary-tip { margin-top: 6px; color: #8793ac; font-size: 12px; }
.alert-list { margin-bottom: 16px; }
.section-title { margin-bottom: 12px; color: #284780; font-size: 16px; font-weight: 700; }
.tone-primary { color: #2453b3; }
.tone-success { color: #21875e; }
.tone-warning { color: #d08a08; }
.tone-danger { color: #c44f37; }
</style>
