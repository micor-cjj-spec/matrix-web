<template>
  <div class="report-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <div>
          <h2 class="title">报表项目</h2>
          <div class="subtitle">查看三大报表的项目定义、层级和行次，便于科目映射与报表调试。</div>
        </div>
        <v-btn color="primary" variant="flat" @click="fetchData">刷新</v-btn>
      </div>

      <v-row class="mb-4" dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="query.ftemplateId"
            :items="templateOptions"
            item-title="label"
            item-value="value"
            label="报表模板"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="query.fcode" label="项目编码" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model.trim="query.fname" label="项目名称" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="2" class="actions">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </v-col>
      </v-row>

      <v-data-table
        :headers="headers"
        :items="list"
        :loading="loading"
        hide-default-footer
        class="elevation-0"
      >
        <template #item.ftemplateId="{ item }">
          {{ templateName(item.ftemplateId) }}
        </template>
        <template #item.fdrillable="{ item }">
          {{ item.fdrillable === 1 ? '是' : '否' }}
        </template>
      </v-data-table>

      <div class="footer">
        <div class="summary">共 {{ total }} 条</div>
        <v-pagination
          v-model="query.page"
          :length="Math.max(1, pages)"
          :total-visible="7"
          @update:model-value="fetchData"
        />
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import reportItemApi from '@/api/reportItem'
import reportTemplateApi from '@/api/reportTemplate'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const templates = ref([])
const snackbar = ref({ show: false, text: '', color: 'info' })

const query = reactive({
  page: 1,
  size: 10,
  ftemplateId: null,
  fcode: '',
  fname: '',
})

const headers = [
  { title: '模板', value: 'ftemplateId' },
  { title: '项目编码', value: 'fcode' },
  { title: '项目名称', value: 'fname' },
  { title: '行次', value: 'frowNo' },
  { title: '层级', value: 'flevel' },
  { title: '行类型', value: 'flineType' },
  { title: '期间模式', value: 'fperiodMode' },
  { title: '可下钻', value: 'fdrillable', align: 'center' },
  { title: '排序', value: 'fsort' },
]

const templateOptions = computed(() =>
  templates.value.map((item) => ({
    label: `${item.fname} (${item.fcode})`,
    value: item.fid,
  })),
)

async function fetchTemplates() {
  const res = await reportTemplateApi.fetchList({ page: 1, size: 200 })
  templates.value = res.data?.records || []
}

async function fetchData() {
  loading.value = true
  try {
    const res = await reportItemApi.listReportItems({
      page: query.page,
      size: query.size,
      ftemplateId: query.ftemplateId || undefined,
      fcode: query.fcode || undefined,
      fname: query.fname || undefined,
    })
    const pageData = res.data || {}
    list.value = pageData.records || []
    total.value = pageData.total || 0
    pages.value = pageData.pages || 1
  } catch (error) {
    showMsg('报表项目加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchData()
}

function resetQuery() {
  query.page = 1
  query.ftemplateId = null
  query.fcode = ''
  query.fname = ''
  fetchData()
}

function templateName(fid) {
  const match = templates.value.find((item) => item.fid === fid)
  return match ? `${match.fname} (${match.fcode})` : fid ?? '-'
}

function showMsg(text, color = 'info') {
  snackbar.value = { show: true, text, color }
}

onMounted(async () => {
  await fetchTemplates()
  await fetchData()
})
</script>

<style scoped>
.report-page {
  padding: 24px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.summary {
  color: #667085;
  font-size: 14px;
}
</style>
