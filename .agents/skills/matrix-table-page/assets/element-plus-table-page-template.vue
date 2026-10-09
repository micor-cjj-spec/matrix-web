<!-- Copy into src/views and replace every TODO(matrix) placeholder. -->
<template>
  <section class="page-shell">
    <header class="page-header">
      <div>
        <h1>TODO(matrix): 页面标题</h1>
        <p>TODO(matrix): 说明组织、账簿、期间或业务范围。</p>
      </div>
      <el-button type="primary" @click="handleCreate">新增</el-button>
    </header>

    <el-card shadow="never" class="filter-card">
      <el-form :model="filters" inline @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input v-model.trim="filters.keyword" clearable placeholder="编号或名称" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 160px">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已提交" value="SUBMITTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :disabled="loading" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon closable class="state-block" />

    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        @sort-change="handleSortChange"
      >
        <el-table-column prop="number" label="编号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" min-width="140" align="right">
          <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :disabled="!canEdit(row)" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="loading ? '正在加载' : '暂无符合条件的数据'" />
        </template>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadRows"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </section>
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

function handleSearch() {
  pagination.page = 1
  loadRows()
}

function handleReset() {
  Object.assign(filters, { keyword: '', status: '', sortField: '', sortOrder: '' })
  pagination.page = 1
  loadRows()
}

function handleSizeChange() {
  pagination.page = 1
  loadRows()
}

function handleSortChange({ prop, order }) {
  filters.sortField = prop || ''
  filters.sortOrder = order === 'ascending' ? 'ASC' : order === 'descending' ? 'DESC' : ''
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
.page-header h1 { margin: 0 0 6px; font-size: 22px; }
.page-header p { margin: 0; color: var(--el-text-color-secondary); }
.filter-card, .state-block { margin-bottom: 16px; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 16px; overflow-x: auto; }
</style>
