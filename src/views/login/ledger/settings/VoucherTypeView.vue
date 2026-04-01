<template>
  <div class="settings-page">
    <v-card elevation="4" class="pa-6">
      <div class="page-header">
        <div>
          <h2 class="page-title">凭证类型</h2>
          <div class="page-subtitle">维护凭证字、前缀、排序和启停状态，为凭证录入与期末处理提供基础参数。</div>
        </div>
        <div class="page-actions">
          <v-btn color="primary" variant="flat" @click="openCreate">新增</v-btn>
          <v-btn variant="text" @click="fetchData">刷新</v-btn>
        </div>
      </div>

      <v-row dense class="mb-4">
        <v-col cols="12" md="3">
          <v-select v-model="query.forg" :items="orgOptions" item-title="label" item-value="value" label="业务单元" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field v-model.trim="query.fcode" label="凭证类型编码" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.trim="query.fname" label="凭证类型名称" density="comfortable" clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="query.fstatus"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            label="状态"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2" class="actions-col">
          <v-btn color="primary" variant="flat" @click="handleSearch">查询</v-btn>
          <v-btn variant="text" @click="resetQuery">重置</v-btn>
        </v-col>
      </v-row>

      <v-data-table :headers="headers" :items="list" :loading="loading" item-key="fid" hide-default-footer class="elevation-0">
        <template #item.fstatus="{ item }">
          <v-chip size="small" variant="tonal" :color="item.fstatus === 'ENABLED' ? 'success' : 'grey'">
            {{ item.fstatus === 'ENABLED' ? '启用' : '停用' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openEdit(item)">编辑</v-btn>
          <v-btn size="small" variant="text" color="primary" @click="toggleStatus(item)">
            {{ item.fstatus === 'ENABLED' ? '停用' : '启用' }}
          </v-btn>
          <v-btn size="small" variant="text" color="error" @click="handleDelete(item)">删除</v-btn>
        </template>
      </v-data-table>

      <div class="footer">
        <div class="summary-text">共 {{ total }} 条</div>
        <v-pagination v-model="query.page" :length="Math.max(1, pages)" :total-visible="7" @update:model-value="fetchData" />
      </div>
    </v-card>

    <v-dialog v-model="dialog.visible" max-width="720">
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? '新增凭证类型' : '编辑凭证类型' }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select v-model="form.forg" :items="orgOptions" item-title="label" item-value="value" label="业务单元" density="comfortable" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.fcode" label="编码" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.fname" label="名称" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.fprefix" label="前缀" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.number="form.fsort" label="排序" type="number" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fstatus" :items="statusOptions" item-title="label" item-value="value" label="状态" density="comfortable" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model.trim="form.fremark" label="备注" rows="2" density="comfortable" auto-grow />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.visible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="handleSave">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getBusinessUnitList } from '@/api/bizUnit'
import voucherTypeApi from '@/api/voucherType'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pages = ref(1)
const orgOptions = ref([])

const statusOptions = [
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
]

const headers = [
  { title: '业务单元', key: 'forg', value: 'forg', width: 120 },
  { title: '编码', key: 'fcode', value: 'fcode', width: 120 },
  { title: '名称', key: 'fname', value: 'fname' },
  { title: '前缀', key: 'fprefix', value: 'fprefix', width: 120 },
  { title: '排序', key: 'fsort', value: 'fsort', width: 90, align: 'center' },
  { title: '状态', key: 'fstatus', value: 'fstatus', width: 100, align: 'center' },
  { title: '操作', key: 'actions', value: 'actions', width: 180, align: 'center' },
]

const query = reactive({
  page: 1,
  size: 10,
  forg: null,
  fcode: '',
  fname: '',
  fstatus: null,
})

const dialog = reactive({
  visible: false,
  mode: 'create',
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'info',
})

const form = reactive(emptyForm())

function emptyForm() {
  return {
    fid: null,
    forg: null,
    fcode: '',
    fname: '',
    fprefix: '',
    fsort: 0,
    fstatus: 'ENABLED',
    fremark: '',
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  form.forg = query.forg
}

function showMsg(text, color = 'info') {
  snackbar.show = true
  snackbar.text = text
  snackbar.color = color
}

async function loadOrgs() {
  const res = await getBusinessUnitList({ page: 1, size: 500 })
  const records = res.data?.records || []
  orgOptions.value = records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
  }))
  if (!query.forg && orgOptions.value.length) {
    query.forg = orgOptions.value[0].value
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await voucherTypeApi.fetchList({
      page: query.page,
      size: query.size,
      forg: query.forg || undefined,
      fcode: query.fcode || undefined,
      fname: query.fname || undefined,
      fstatus: query.fstatus || undefined,
    })
    const data = res.data || {}
    list.value = data.records || []
    total.value = Number(data.total || 0)
    pages.value = Number(data.pages || 1)
  } catch {
    list.value = []
    total.value = 0
    pages.value = 1
    showMsg('凭证类型加载失败', 'error')
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
  query.fcode = ''
  query.fname = ''
  query.fstatus = null
  fetchData()
}

function openCreate() {
  resetForm()
  dialog.mode = 'create'
  dialog.visible = true
}

function openEdit(item) {
  Object.assign(form, JSON.parse(JSON.stringify(item)))
  dialog.mode = 'edit'
  dialog.visible = true
}

async function handleSave() {
  try {
    const payload = JSON.parse(JSON.stringify(form))
    if (dialog.mode === 'create') {
      await voucherTypeApi.createItem(payload)
      showMsg('凭证类型新增成功', 'success')
    } else {
      await voucherTypeApi.editItem(payload)
      showMsg('凭证类型更新成功', 'success')
    }
    dialog.visible = false
    fetchData()
  } catch {
    showMsg('凭证类型保存失败', 'error')
  }
}

async function toggleStatus(item) {
  try {
    if (item.fstatus === 'ENABLED') {
      await voucherTypeApi.disableItem(item.fid)
      showMsg('凭证类型已停用', 'success')
    } else {
      await voucherTypeApi.enableItem(item.fid)
      showMsg('凭证类型已启用', 'success')
    }
    fetchData()
  } catch {
    showMsg('凭证类型状态更新失败', 'error')
  }
}

async function handleDelete(item) {
  try {
    await voucherTypeApi.deleteItem(item.fid)
    showMsg('凭证类型删除成功', 'success')
    fetchData()
  } catch {
    showMsg('凭证类型删除失败', 'error')
  }
}

onMounted(async () => {
  await loadOrgs().catch(() => showMsg('业务单元加载失败', 'warning'))
  await fetchData()
})
</script>

<style scoped>
.settings-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-title {
  margin: 0 0 6px;
  color: #23447a;
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  color: #62779b;
  font-size: 14px;
  line-height: 1.7;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.actions-col {
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

.summary-text {
  color: #667085;
  font-size: 14px;
}
</style>
