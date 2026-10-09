<!-- Copy into src/views and replace every TODO(matrix) placeholder. -->
<template>
  <v-container fluid class="page-shell">
    <div class="page-header">
      <div>
        <h1 class="text-h5 font-weight-bold">TODO(matrix): 页面标题</h1>
        <p class="text-body-2 text-medium-emphasis">TODO(matrix): 说明组织、账簿、期间或业务范围。</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="handleCreate">新增</v-btn>
    </div>

    <v-card variant="outlined" class="mb-4">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model.trim="filters.keyword"
              label="关键词"
              placeholder="编号或名称"
              clearable
              hide-details
              @keyup.enter="handleSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="状态"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="5" class="d-flex ga-2 justify-end">
            <v-btn color="primary" :loading="loading" @click="handleSearch">查询</v-btn>
            <v-btn variant="outlined" :disabled="loading" @click="handleReset">重置</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <v-card variant="outlined">
      <v-data-table-server
        v-model:page="pagination.page"
        v-model:items-per-page="pagination.size"
        :headers="headers"
        :items="rows"
        :items-length="pagination.total"
        :loading="loading"
        item-value="id"
        @update:options="handleOptions"
      >
        <template #item.amount="{ item }">
          <div class="text-right tabular-number">{{ formatAmount(item.amount) }}</div>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="handleView(item)">查看</v-btn>
          <v-btn size="small" variant="text" color="primary" :disabled="!canEdit(item)" @click="handleEdit(item)">编辑</v-btn>
        </template>
        <template #no-data>
          <div class="pa-8 text-center text-medium-emphasis">暂无符合条件的数据</div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
// TODO(matrix): replace with the owning feature API module.
import { listRecords } from '@/api/replace-with-feature-api'

const router = useRouter()
const rows = ref([])
const loading = ref(false)
const errorMessage = ref('')
let requestSequence = 0

const statusOptions = [
  { title: '草稿', value: 'DRAFT' },
  { title: '已提交', value: 'SUBMITTED' },
]
const headers = [
  { title: '编号', key: 'number', minWidth: 150 },
  { title: '名称', key: 'name', minWidth: 200 },
  { title: '金额', key: 'amount', align: 'end', minWidth: 140 },
  { title: '状态', key: 'status', width: 120 },
  { title: '操作', key: 'actions', sortable: false, width: 180 },
]
const filters = reactive({ keyword: '', status: '', sortField: '', sortOrder: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

async function loadRows() {
  const sequence = ++requestSequence
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listRecords({
      page: pagination.page,
      size: pagination.size,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      sortField: filters.sortField || undefined,
      sortOrder: filters.sortOrder || undefined,
    })
    if (sequence !== requestSequence) return
    // TODO(matrix): normalize using the actual ApiResponse and pagination contract.
    const pageData = response?.data?.data ?? response?.data ?? {}
    rows.value = pageData.records ?? pageData.items ?? []
    pagination.total = Number(pageData.total ?? 0)
  } catch (error) {
    if (sequence !== requestSequence) return
    rows.value = []
    pagination.total = 0
    errorMessage.value = error?.response?.data?.message || error?.message || '数据加载失败'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

function handleOptions(options) {
  pagination.page = options.page || 1
  pagination.size = options.itemsPerPage || 20
  const sort = options.sortBy?.[0]
  filters.sortField = sort?.key || ''
  filters.sortOrder = sort?.order === 'asc' ? 'ASC' : sort?.order === 'desc' ? 'DESC' : ''
  loadRows()
}

function handleSearch() {
  pagination.page = 1
  loadRows()
}

function handleReset() {
  Object.assign(filters, { keyword: '', status: '', sortField: '', sortOrder: '' })
  pagination.page = 1
  loadRows()
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function canEdit(row) {
  return ['DRAFT', 'REJECTED'].includes(row.status)
}

function handleCreate() {
  router.push({ name: 'TODOCreateRoute' })
}

function handleView(row) {
  router.push({ name: 'TODOViewRoute', params: { id: row.id } })
}

function handleEdit(row) {
  if (canEdit(row)) router.push({ name: 'TODOEditRoute', params: { id: row.id } })
}

onMounted(loadRows)
</script>

<style scoped>
.page-shell { padding: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.tabular-number { font-variant-numeric: tabular-nums; }
@media (max-width: 960px) {
  .page-header { flex-direction: column; }
}
</style>
