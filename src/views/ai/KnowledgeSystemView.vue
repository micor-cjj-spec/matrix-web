<template>
  <main class="knowledge-page">
    <section class="hero-row">
      <div>
        <span class="eyebrow">Matrix Knowledge</span>
        <h1>知识系统</h1>
        <p>制度、流程、案例和业务口径在这里沉淀，并作为 AI 助手的可追溯引用来源。</p>
      </div>
      <div class="hero-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新建知识</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-robot-outline" @click="goAssistant">AI 助手</v-btn>
      </div>
    </section>

    <section class="metric-row">
      <div class="metric-tile">
        <span>文档总数</span>
        <strong>{{ total }}</strong>
        <small>当前筛选范围</small>
      </div>
      <div class="metric-tile">
        <span>启用文档</span>
        <strong>{{ activeDocCount }}</strong>
        <small>本页可检索</small>
      </div>
      <div class="metric-tile">
        <span>分片数量</span>
        <strong>{{ selectedDetail?.chunkCount || currentPageChunkCount }}</strong>
        <small>{{ selectedDetail ? '当前文档' : '本页合计' }}</small>
      </div>
      <div class="metric-tile">
        <span>分类</span>
        <strong>{{ categories.length }}</strong>
        <small>知识域</small>
      </div>
    </section>

    <section class="workspace-grid">
      <aside class="filter-panel">
        <div class="panel-heading">
          <span>Filter</span>
          <strong>筛选</strong>
        </div>
        <v-text-field
          v-model="filters.keyword"
          density="comfortable"
          hide-details
          label="关键词"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @keydown.enter="fetchDocs"
        />
        <v-select
          v-model="filters.category"
          :items="categoryItems"
          density="comfortable"
          hide-details
          item-title="label"
          item-value="value"
          label="分类"
          variant="outlined"
        />
        <v-select
          v-model="filters.status"
          :items="statusFilterItems"
          density="comfortable"
          hide-details
          item-title="label"
          item-value="value"
          label="状态"
          variant="outlined"
        />
        <div class="filter-actions">
          <v-btn color="primary" block prepend-icon="mdi-filter-outline" @click="applyFilters">应用</v-btn>
          <v-btn variant="text" block @click="resetFilters">重置</v-btn>
        </div>

        <div class="category-stack">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            :class="{ active: filters.category === category }"
            @click="quickCategory(category)"
          >
            <span>{{ category }}</span>
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
      </aside>

      <section class="doc-panel">
        <div class="panel-heading board-heading">
          <div>
            <span>Documents</span>
            <strong>知识文档</strong>
          </div>
          <div class="toolbar">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-refresh" @click="fetchDocs">刷新</v-btn>
            <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">新建</v-btn>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="docs"
          :loading="loading"
          class="knowledge-table"
          density="comfortable"
          hide-default-footer
          item-key="docId"
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.title="{ item }">
            <div class="doc-title">
              <strong>{{ item.title }}</strong>
              <small>{{ item.docId }}</small>
            </div>
          </template>
          <template #item.status="{ item }">
            <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
              {{ statusText(item.status) }}
            </v-chip>
          </template>
          <template #item.chunkCount="{ item }">
            <span class="chunk-count">{{ item.chunkCount || 0 }}</span>
          </template>
          <template #item.modifyTime="{ item }">
            {{ formatTime(item.modifyTime) }}
          </template>
        </v-data-table>

        <div class="pager">
          <v-btn icon="mdi-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="changePage(page - 1)" />
          <span>第 {{ page }} / {{ pageCount }} 页</span>
          <v-btn icon="mdi-chevron-right" size="small" variant="text" :disabled="page >= pageCount" @click="changePage(page + 1)" />
        </div>
      </section>

      <aside class="detail-panel">
        <div class="panel-heading board-heading">
          <div>
            <span>Detail</span>
            <strong>文档详情</strong>
          </div>
          <v-chip v-if="selectedDetail" size="small" variant="tonal" :color="statusColor(selectedDetail.status)">
            {{ statusText(selectedDetail.status) }}
          </v-chip>
        </div>

        <div v-if="!selectedDetail" class="empty-detail">
          <v-icon size="32">mdi-file-search-outline</v-icon>
          <span>选择一篇知识文档</span>
        </div>

        <template v-else>
          <div class="detail-title">
            <h2>{{ selectedDetail.title }}</h2>
            <p>{{ selectedDetail.category }} · {{ selectedDetail.version }}</p>
          </div>
          <div class="detail-actions">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="openEditDialog">编辑</v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-vector-polyline" @click="rebuildSelected">重建分片</v-btn>
            <v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click="openDeleteDialog">删除</v-btn>
          </div>

          <div class="content-preview">{{ selectedDetail.content }}</div>

          <div class="chunk-list">
            <div class="panel-heading compact">
              <span>Chunks</span>
              <strong>检索分片</strong>
            </div>
            <div v-for="chunk in selectedDetail.chunks" :key="chunk.chunkId" class="chunk-item">
              <div>
                <strong>#{{ chunk.seq }}</strong>
                <small>{{ chunk.chunkId }}</small>
              </div>
              <p>{{ chunk.content }}</p>
            </div>
          </div>
        </template>
      </aside>
    </section>

    <section class="retrieve-panel">
      <div class="panel-heading board-heading">
        <div>
          <span>Retrieve</span>
          <strong>检索预览</strong>
        </div>
        <v-select
          v-model="retrieveScope"
          :items="retrieveScopeItems"
          density="compact"
          hide-details
          item-title="label"
          item-value="value"
          variant="outlined"
          class="scope-select"
        />
      </div>
      <div class="retrieve-bar">
        <v-text-field
          v-model="retrieveQuestion"
          density="comfortable"
          hide-details
          label="问题"
          prepend-inner-icon="mdi-comment-question-outline"
          variant="outlined"
          @keydown.enter="runRetrieve"
        />
        <v-btn color="primary" :loading="retrieving" prepend-icon="mdi-text-search" @click="runRetrieve">检索</v-btn>
      </div>
      <div class="citation-grid">
        <article v-for="citation in citations" :key="citation.chunkId" class="citation-card">
          <div>
            <strong>{{ citation.docName || citation.docId }}</strong>
            <small>{{ citation.chunkId }}</small>
          </div>
          <p>{{ citation.snippet }}</p>
        </article>
        <div v-if="!citations.length" class="empty-citation">暂无检索结果</div>
      </div>
    </section>

    <v-dialog v-model="editor.visible" max-width="920" persistent>
      <v-card>
        <v-card-title>{{ editor.mode === 'create' ? '新建知识' : '编辑知识' }}</v-card-title>
        <v-card-text>
          <div class="editor-grid">
            <v-text-field v-model="editor.form.title" label="标题" variant="outlined" hide-details />
            <v-text-field v-model="editor.form.category" label="分类" variant="outlined" hide-details />
            <v-text-field v-model="editor.form.version" label="版本" variant="outlined" hide-details />
            <v-select
              v-model="editor.form.status"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              label="状态"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-model="editor.form.docId"
              :disabled="editor.mode === 'edit'"
              label="文档编号"
              variant="outlined"
              hide-details
            />
            <v-text-field v-model="editor.form.sourcePath" label="来源" variant="outlined" hide-details />
          </div>
          <v-textarea
            v-model="editor.form.content"
            class="mt-4"
            label="正文"
            rows="14"
            auto-grow
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditor">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveDoc">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="420">
      <v-card>
        <v-card-title>删除知识文档</v-card-title>
        <v-card-text>
          删除后该文档及分片将不再参与 AI 检索。
          <strong>{{ selectedDetail?.title }}</strong>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteSelected">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createKnowledgeDoc,
  deleteKnowledgeDoc,
  getKnowledgeDoc,
  listKnowledgeCategories,
  listKnowledgeDocs,
  rebuildKnowledgeDoc,
  retrieveKnowledge,
  updateKnowledgeDoc,
} from '@/api/ai'

const router = useRouter()

const docs = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const retrieving = ref(false)
const categories = ref([])
const selectedDoc = ref(null)
const selectedDetail = ref(null)
const retrieveQuestion = ref('凭证审核流程有哪些关键控制点？')
const retrieveScope = ref('all')
const citations = ref([])

const filters = reactive({
  keyword: '',
  category: '',
  status: '',
})

const editor = reactive({
  visible: false,
  mode: 'create',
  form: emptyForm(),
})

const deleteDialog = reactive({ visible: false })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const headers = [
  { title: '标题', value: 'title', minWidth: 220 },
  { title: '分类', value: 'category', width: 130 },
  { title: '状态', value: 'status', width: 110 },
  { title: '分片', value: 'chunkCount', width: 90, align: 'center' },
  { title: '更新时间', value: 'modifyTime', width: 160 },
]

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
]

const statusFilterItems = [
  { label: '全部', value: '' },
  ...statusOptions,
]

const retrieveScopeItems = [
  { label: '全部知识', value: 'all' },
  { label: '当前文档', value: 'current' },
]

const categoryItems = computed(() => [
  { label: '全部', value: '' },
  ...categories.value.map(category => ({ label: category, value: category })),
])
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const activeDocCount = computed(() => docs.value.filter(item => item.status === 'ACTIVE').length)
const currentPageChunkCount = computed(() => docs.value.reduce((sum, item) => sum + (item.chunkCount || 0), 0))

function emptyForm() {
  return {
    docId: '',
    title: '',
    category: '通用知识',
    sourcePath: '',
    content: '',
    version: 'v1',
    status: 'ACTIVE',
  }
}

async function fetchDocs() {
  loading.value = true
  try {
    const resp = await listKnowledgeDocs({
      page: page.value,
      size: size.value,
      keyword: filters.keyword || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
    })
    const data = resp?.data || {}
    docs.value = data.records || []
    total.value = data.total || 0
    if (selectedDoc.value && !docs.value.some(item => item.docId === selectedDoc.value.docId)) {
      selectedDoc.value = null
      selectedDetail.value = null
    }
  } catch (error) {
    showMsg('知识列表加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function refreshCategories() {
  try {
    const resp = await listKnowledgeCategories()
    categories.value = resp?.data || []
  } catch (error) {
    categories.value = []
  }
}

function applyFilters() {
  page.value = 1
  fetchDocs()
}

function resetFilters() {
  Object.assign(filters, { keyword: '', category: '', status: '' })
  applyFilters()
}

function quickCategory(category) {
  filters.category = category
  applyFilters()
}

function changePage(nextPage) {
  page.value = Math.min(Math.max(1, nextPage), pageCount.value)
  fetchDocs()
}

function handleRowClick(_, row) {
  const item = row?.item
  if (!item) return
  selectedDoc.value = item
  loadDetail(item.docId)
}

function getRowProps({ item }) {
  return item?.docId === selectedDoc.value?.docId ? { class: 'selected-row' } : {}
}

async function loadDetail(docId) {
  try {
    const resp = await getKnowledgeDoc(docId)
    selectedDetail.value = resp?.data || null
  } catch (error) {
    showMsg('知识详情加载失败', 'error')
  }
}

function openCreateDialog() {
  editor.mode = 'create'
  editor.form = emptyForm()
  editor.visible = true
}

async function openEditDialog() {
  if (!selectedDetail.value && selectedDoc.value) {
    await loadDetail(selectedDoc.value.docId)
  }
  if (!selectedDetail.value) return
  editor.mode = 'edit'
  editor.form = {
    docId: selectedDetail.value.docId,
    title: selectedDetail.value.title,
    category: selectedDetail.value.category,
    sourcePath: selectedDetail.value.sourcePath,
    content: selectedDetail.value.content,
    version: selectedDetail.value.version,
    status: selectedDetail.value.status,
  }
  editor.visible = true
}

function closeEditor() {
  editor.visible = false
}

async function saveDoc() {
  if (!editor.form.title.trim() || !editor.form.content.trim()) {
    showMsg('标题和正文不能为空', 'warning')
    return
  }
  saving.value = true
  try {
    let resp
    if (editor.mode === 'create') {
      resp = await createKnowledgeDoc({ ...editor.form })
    } else {
      resp = await updateKnowledgeDoc(editor.form.docId, { ...editor.form })
    }
    const detail = resp?.data
    selectedDetail.value = detail || selectedDetail.value
    selectedDoc.value = detail ? { ...detail } : selectedDoc.value
    closeEditor()
    await refreshCategories()
    await fetchDocs()
    if (detail?.docId) {
      await loadDetail(detail.docId)
    }
    showMsg('知识已保存')
  } catch (error) {
    showMsg(error?.response?.data?.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function openDeleteDialog() {
  if (!selectedDetail.value) return
  deleteDialog.visible = true
}

async function deleteSelected() {
  if (!selectedDetail.value) return
  deleting.value = true
  try {
    await deleteKnowledgeDoc(selectedDetail.value.docId)
    deleteDialog.visible = false
    selectedDoc.value = null
    selectedDetail.value = null
    citations.value = []
    await refreshCategories()
    await fetchDocs()
    showMsg('知识已删除')
  } catch (error) {
    showMsg('删除失败', 'error')
  } finally {
    deleting.value = false
  }
}

async function rebuildSelected() {
  if (!selectedDetail.value) return
  try {
    await rebuildKnowledgeDoc(selectedDetail.value.docId)
    await loadDetail(selectedDetail.value.docId)
    await fetchDocs()
    showMsg('分片已重建')
  } catch (error) {
    showMsg('重建失败', 'error')
  }
}

async function runRetrieve() {
  if (!retrieveQuestion.value.trim()) {
    showMsg('请输入问题', 'warning')
    return
  }
  if (retrieveScope.value === 'current' && !selectedDetail.value) {
    showMsg('请选择当前文档', 'warning')
    return
  }
  retrieving.value = true
  try {
    const resp = await retrieveKnowledge({
      question: retrieveQuestion.value.trim(),
      kbIds: retrieveScope.value === 'current' ? [selectedDetail.value.docId] : ['default'],
      topK: 6,
    })
    citations.value = resp?.data || []
  } catch (error) {
    showMsg('检索失败', 'error')
  } finally {
    retrieving.value = false
  }
}

function goAssistant() {
  router.push('/ai/assistant')
}

function statusText(status) {
  return status === 'ACTIVE' ? '启用' : '停用'
}

function statusColor(status) {
  return status === 'ACTIVE' ? 'success' : 'grey'
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(async () => {
  await Promise.all([refreshCategories(), fetchDocs()])
})
</script>

<style scoped>
.knowledge-page {
  min-height: 100vh;
  padding: 22px;
  color: #17202c;
  background: linear-gradient(180deg, #f7faf9 0%, #edf3f2 100%);
}

.hero-row {
  min-height: 170px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding: 26px;
  border: 1px solid rgba(23, 42, 52, 0.1);
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(12, 82, 91, 0.96) 0%, rgba(18, 126, 105, 0.94) 56%, rgba(47, 62, 71, 0.98) 100%);
  box-shadow: 0 20px 50px rgba(26, 42, 58, 0.15);
}

.eyebrow,
.panel-heading span {
  color: #d9b35c;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-row h1 {
  margin: 8px 0 8px;
  font-size: 38px;
  line-height: 1.1;
}

.hero-row p {
  max-width: 720px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.metric-tile,
.filter-panel,
.doc-panel,
.detail-panel,
.retrieve-panel {
  border: 1px solid rgba(23, 42, 52, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 34px rgba(34, 53, 73, 0.07);
}

.metric-tile {
  display: grid;
  gap: 5px;
  min-height: 96px;
  align-content: center;
  padding: 16px;
}

.metric-tile span,
.metric-tile small {
  color: #6c7784;
  font-size: 12px;
}

.metric-tile strong {
  color: #102431;
  font-size: 27px;
  line-height: 1;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 370px;
  gap: 16px;
  margin-top: 16px;
}

.filter-panel,
.doc-panel,
.detail-panel,
.retrieve-panel {
  padding: 18px;
}

.filter-panel {
  align-self: start;
  display: grid;
  gap: 12px;
}

.panel-heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 12px;
}

.panel-heading strong {
  font-size: 19px;
}

.panel-heading.compact strong {
  font-size: 16px;
}

.board-heading {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar,
.filter-actions,
.detail-actions,
.retrieve-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-actions {
  flex-direction: column;
}

.category-stack {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.category-stack button {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  color: #344252;
  background: #f4f7f7;
  cursor: pointer;
}

.category-stack button.active,
.category-stack button:hover {
  color: #0c5f62;
  background: #e5f4ef;
}

.knowledge-table {
  border: 1px solid rgba(23, 42, 52, 0.06);
  border-radius: 8px;
}

.doc-title {
  display: grid;
  gap: 3px;
}

.doc-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-title small {
  color: #75808c;
  font-size: 12px;
}

.chunk-count {
  font-weight: 900;
}

:deep(.selected-row) {
  background: #e7f4f1 !important;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
  color: #607080;
  font-size: 13px;
}

.detail-panel {
  align-self: start;
  max-height: 720px;
  overflow: auto;
}

.empty-detail,
.empty-citation {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #778390;
}

.detail-title h2 {
  margin: 0;
  font-size: 21px;
  line-height: 1.3;
}

.detail-title p {
  margin: 6px 0 0;
  color: #6f7b87;
}

.detail-actions {
  flex-wrap: wrap;
  margin-top: 14px;
}

.content-preview {
  max-height: 260px;
  overflow: auto;
  margin-top: 14px;
  padding: 14px;
  border-radius: 8px;
  color: #263343;
  background: #f7f9fa;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.chunk-list {
  margin-top: 16px;
}

.chunk-item {
  display: grid;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid rgba(23, 42, 52, 0.08);
}

.chunk-item div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.chunk-item small {
  overflow: hidden;
  color: #7b8792;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chunk-item p {
  margin: 0;
  color: #3e4b58;
  line-height: 1.65;
}

.retrieve-panel {
  margin-top: 16px;
}

.scope-select {
  max-width: 180px;
}

.retrieve-bar {
  align-items: stretch;
}

.retrieve-bar .v-input {
  flex: 1;
}

.citation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.citation-card {
  min-height: 150px;
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 14px;
  border: 1px solid rgba(23, 42, 52, 0.08);
  border-radius: 8px;
  background: #f8faf9;
}

.citation-card strong,
.citation-card small {
  display: block;
}

.citation-card small {
  margin-top: 4px;
  color: #778390;
  font-size: 12px;
}

.citation-card p {
  margin: 0;
  color: #3c4856;
  line-height: 1.7;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1240px) {
  .workspace-grid {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .detail-panel {
    grid-column: 1 / -1;
    max-height: none;
  }

  .citation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .knowledge-page {
    padding: 14px;
  }

  .hero-row,
  .board-heading,
  .retrieve-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-row,
  .workspace-grid,
  .citation-grid,
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .hero-row h1 {
    font-size: 32px;
  }

  .scope-select {
    max-width: none;
  }
}
</style>
