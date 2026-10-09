<template>
  <main class="knowledge-page">
    <section class="hero-row">
      <div>
        <span class="eyebrow">Matrix Knowledge</span>
        <h1>企业知识系统</h1>
        <p>按知识库组织制度、流程、案例和业务口径，并通过文件导入、异步索引和可追溯引用持续沉淀。</p>
      </div>
      <div class="hero-actions">
        <v-btn color="primary" prepend-icon="mdi-database-plus-outline" @click="openBaseCreate">新建知识库</v-btn>
        <v-btn color="white" variant="tonal" prepend-icon="mdi-file-plus-outline" @click="openDocCreate">新建文档</v-btn>
        <v-btn color="white" variant="text" prepend-icon="mdi-robot-outline" @click="router.push('/ai/assistant')">AI 助手</v-btn>
      </div>
    </section>

    <section class="metric-row">
      <article class="metric-card">
        <span>知识库</span>
        <strong>{{ knowledgeBases.length }}</strong>
        <small>{{ activeBaseCount }} 个启用</small>
      </article>
      <article class="metric-card">
        <span>文档总数</span>
        <strong>{{ total }}</strong>
        <small>{{ selectedBaseName }}</small>
      </article>
      <article class="metric-card">
        <span>当前页分片</span>
        <strong>{{ currentPageChunkCount }}</strong>
        <small>向量检索最小单元</small>
      </article>
      <article class="metric-card">
        <span>知识分类</span>
        <strong>{{ categories.length }}</strong>
        <small>跨知识库分类</small>
      </article>
    </section>

    <KnowledgeIngestionPanel
      :knowledge-bases="knowledgeBases"
      :selected-kb-id="selectedKbId"
      @imported="handleImported"
    />

    <section class="workspace-grid">
      <aside class="panel base-panel">
        <div class="panel-title">
          <div>
            <span>Knowledge Bases</span>
            <strong>知识库</strong>
          </div>
          <v-btn icon="mdi-refresh" size="small" variant="text" :loading="baseLoading" @click="refreshAll" />
        </div>

        <button type="button" class="base-item" :class="{ active: selectedKbId === 'all' }" @click="selectBase('all')">
          <div>
            <strong>全部知识</strong>
            <small>跨知识库检索</small>
          </div>
          <v-chip size="x-small" variant="tonal">{{ allDocumentCount }}</v-chip>
        </button>

        <div v-for="base in knowledgeBases" :key="base.kbId" class="base-item-wrap">
          <button type="button" class="base-item" :class="{ active: selectedKbId === base.kbId }" @click="selectBase(base.kbId)">
            <div>
              <strong>{{ base.name }}</strong>
              <small>{{ base.description || base.kbId }}</small>
            </div>
            <v-chip :color="base.status === 'ACTIVE' ? 'success' : 'grey'" size="x-small" variant="tonal">
              {{ base.documentCount || 0 }}
            </v-chip>
          </button>
          <div class="base-actions">
            <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click.stop="openBaseEdit(base)" />
            <v-btn
              icon="mdi-delete-outline"
              size="x-small"
              color="error"
              variant="text"
              :disabled="base.kbId === 'default'"
              @click.stop="confirmBaseDelete(base)"
            />
          </div>
        </div>
      </aside>

      <section class="panel document-panel">
        <div class="panel-title">
          <div>
            <span>Documents</span>
            <strong>{{ selectedBaseName }}</strong>
          </div>
          <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openDocCreate">新建文档</v-btn>
        </div>

        <div class="filters">
          <v-text-field
            v-model="filters.keyword"
            density="compact"
            hide-details
            label="搜索标题、正文或分类"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            @keydown.enter="applyFilters"
          />
          <v-select
            v-model="filters.category"
            :items="categoryItems"
            density="compact"
            hide-details
            item-title="title"
            item-value="value"
            label="分类"
            variant="outlined"
          />
          <v-select
            v-model="filters.status"
            :items="statusFilterItems"
            density="compact"
            hide-details
            item-title="title"
            item-value="value"
            label="状态"
            variant="outlined"
          />
          <v-btn variant="tonal" prepend-icon="mdi-filter-outline" @click="applyFilters">筛选</v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="docs"
          :loading="loading"
          class="knowledge-table"
          density="comfortable"
          hide-default-footer
          item-key="docId"
          :row-props="getRowProps"
          @click:row="handleRowClick"
        >
          <template #item.title="{ item }">
            <div class="doc-title">
              <strong>{{ item.title }}</strong>
              <small>{{ item.docId }}</small>
            </div>
          </template>
          <template #item.kbId="{ item }">{{ baseName(item.kbId) }}</template>
          <template #item.status="{ item }">
            <v-chip :color="item.status === 'ACTIVE' ? 'success' : 'grey'" size="small" variant="tonal">
              {{ item.status === 'ACTIVE' ? '启用' : '停用' }}
            </v-chip>
          </template>
          <template #item.modifyTime="{ item }">{{ formatTime(item.modifyTime) }}</template>
        </v-data-table>

        <div class="pager">
          <v-btn icon="mdi-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="changePage(page - 1)" />
          <span>第 {{ page }} / {{ pageCount }} 页</span>
          <v-btn icon="mdi-chevron-right" size="small" variant="text" :disabled="page >= pageCount" @click="changePage(page + 1)" />
        </div>
      </section>

      <aside class="panel detail-panel">
        <div class="panel-title">
          <div>
            <span>Document Detail</span>
            <strong>文档与分片</strong>
          </div>
          <v-chip v-if="selectedDetail" size="small" variant="tonal" :color="selectedDetail.status === 'ACTIVE' ? 'success' : 'grey'">
            {{ selectedDetail.status === 'ACTIVE' ? '启用' : '停用' }}
          </v-chip>
        </div>

        <div v-if="!selectedDetail" class="empty-state">
          <v-icon size="36">mdi-file-search-outline</v-icon>
          <span>从中间选择一篇文档</span>
        </div>

        <template v-else>
          <div class="detail-head">
            <h2>{{ selectedDetail.title }}</h2>
            <p>{{ baseName(selectedDetail.kbId) }} · {{ selectedDetail.category }} · {{ selectedDetail.version }}</p>
          </div>
          <div class="detail-actions">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="openDocEdit">编辑</v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-vector-polyline" :loading="rebuilding" @click="rebuildSelected">重建分片</v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-database-clock-outline" :loading="reindexing" @click="reindexSelected">异步重建向量</v-btn>
            <v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click="confirmDocDelete">删除</v-btn>
          </div>

          <div class="content-preview">{{ selectedDetail.content }}</div>
          <div class="chunk-list">
            <div
              v-for="chunk in selectedDetail.chunks || []"
              :id="`chunk-${chunk.chunkId}`"
              :key="chunk.chunkId"
              class="chunk-card"
              :class="{ highlighted: highlightChunkId === chunk.chunkId }"
            >
              <div class="chunk-head">
                <strong>#{{ chunk.seq }}</strong>
                <small>{{ chunk.chunkId }}</small>
              </div>
              <p>{{ chunk.content }}</p>
            </div>
          </div>
        </template>
      </aside>
    </section>

    <section class="panel retrieve-panel">
      <div class="panel-title retrieve-heading">
        <div>
          <span>Retrieval Preview</span>
          <strong>检索预览</strong>
        </div>
        <v-select
          v-model="retrieveScope"
          :items="retrieveScopeItems"
          density="compact"
          hide-details
          item-title="title"
          item-value="value"
          label="检索范围"
          variant="outlined"
          class="retrieve-scope"
        />
      </div>
      <div class="retrieve-bar">
        <v-text-field
          v-model="retrieveQuestion"
          density="comfortable"
          hide-details
          label="输入业务问题"
          prepend-inner-icon="mdi-comment-question-outline"
          variant="outlined"
          @keydown.enter="runRetrieve"
        />
        <v-btn color="primary" :loading="retrieving" prepend-icon="mdi-text-search" @click="runRetrieve">检索</v-btn>
      </div>
      <div class="citation-grid">
        <button
          v-for="citation in citations"
          :key="citation.chunkId"
          type="button"
          class="citation-card"
          @click="openCitation(citation)"
        >
          <div>
            <strong>{{ citation.docName || citation.docId }}</strong>
            <small>{{ citation.chunkId }}</small>
          </div>
          <p>{{ citation.snippet }}</p>
        </button>
        <div v-if="!citations.length" class="empty-citation">暂无检索结果</div>
      </div>
    </section>

    <v-dialog v-model="baseEditor.visible" max-width="620" persistent>
      <v-card>
        <v-card-title>{{ baseEditor.mode === 'create' ? '新建知识库' : '编辑知识库' }}</v-card-title>
        <v-card-text class="dialog-fields">
          <v-text-field v-model="baseEditor.form.name" label="知识库名称" variant="outlined" />
          <v-text-field v-model="baseEditor.form.kbId" :disabled="baseEditor.mode === 'edit'" label="知识库编号" variant="outlined" hint="留空时自动生成" persistent-hint />
          <v-textarea v-model="baseEditor.form.description" label="说明" rows="3" variant="outlined" />
          <v-select v-model="baseEditor.form.status" :items="statusOptions" item-title="title" item-value="value" label="状态" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="baseEditor.visible = false">取消</v-btn>
          <v-btn color="primary" :loading="baseSaving" @click="saveBase">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="docEditor.visible" max-width="920" persistent>
      <v-card>
        <v-card-title>{{ docEditor.mode === 'create' ? '新建知识文档' : '编辑知识文档' }}</v-card-title>
        <v-card-text>
          <div class="editor-grid">
            <v-select v-model="docEditor.form.kbId" :items="activeBaseItems" item-title="title" item-value="value" label="所属知识库" variant="outlined" />
            <v-text-field v-model="docEditor.form.title" label="标题" variant="outlined" />
            <v-text-field v-model="docEditor.form.docId" :disabled="docEditor.mode === 'edit'" label="文档编号" variant="outlined" />
            <v-text-field v-model="docEditor.form.category" label="分类" variant="outlined" />
            <v-text-field v-model="docEditor.form.version" label="版本" variant="outlined" />
            <v-select v-model="docEditor.form.status" :items="statusOptions" item-title="title" item-value="value" label="状态" variant="outlined" />
            <v-text-field v-model="docEditor.form.sourcePath" class="span-2" label="来源" variant="outlined" />
          </div>
          <v-textarea v-model="docEditor.form.content" label="正文" rows="14" auto-grow variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="docEditor.visible = false">取消</v-btn>
          <v-btn color="primary" :loading="docSaving" @click="saveDoc">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="460">
      <v-card>
        <v-card-title>{{ deleteDialog.type === 'base' ? '删除知识库' : '删除知识文档' }}</v-card-title>
        <v-card-text>
          确认删除 <strong>{{ deleteDialog.name }}</strong>？
          <p v-if="deleteDialog.type === 'base'" class="delete-tip">知识库中仍有文档时，后端会拒绝删除。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn color="error" :loading="deleting" @click="performDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createKnowledgeBase,
  createKnowledgeDoc,
  deleteKnowledgeBase,
  deleteKnowledgeDoc,
  getKnowledgeDoc,
  listKnowledgeBases,
  listKnowledgeCategories,
  listKnowledgeDocs,
  rebuildKnowledgeDoc,
  retrieveKnowledge,
  updateKnowledgeBase,
  updateKnowledgeDoc,
} from '@/api/ai'
import { enqueueKnowledgeIndexJob } from '@/api/knowledgeIngestion'
import KnowledgeIngestionPanel from '@/views/ai/components/KnowledgeIngestionPanel.vue'

const route = useRoute()
const router = useRouter()
const knowledgeBases = ref([])
const docs = ref([])
const total = ref(0)
const allDocumentCount = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const baseLoading = ref(false)
const baseSaving = ref(false)
const docSaving = ref(false)
const deleting = ref(false)
const rebuilding = ref(false)
const reindexing = ref(false)
const retrieving = ref(false)
const selectedKbId = ref('all')
const selectedDoc = ref(null)
const selectedDetail = ref(null)
const categories = ref([])
const retrieveQuestion = ref('凭证审核流程有哪些关键控制点？')
const retrieveScope = ref('all')
const citations = ref([])
const highlightChunkId = ref('')

const filters = reactive({ keyword: '', category: '', status: '' })
const baseEditor = reactive({ visible: false, mode: 'create', form: emptyBaseForm() })
const docEditor = reactive({ visible: false, mode: 'create', form: emptyDocForm() })
const deleteDialog = reactive({ visible: false, type: 'doc', id: '', name: '' })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const headers = [
  { title: '标题', value: 'title', minWidth: 220 },
  { title: '知识库', value: 'kbId', width: 150 },
  { title: '分类', value: 'category', width: 120 },
  { title: '状态', value: 'status', width: 90 },
  { title: '分片', value: 'chunkCount', width: 80, align: 'center' },
  { title: '更新时间', value: 'modifyTime', width: 150 },
]
const statusOptions = [
  { title: '启用', value: 'ACTIVE' },
  { title: '停用', value: 'INACTIVE' },
]
const statusFilterItems = [{ title: '全部状态', value: '' }, ...statusOptions]
const categoryItems = computed(() => [
  { title: '全部分类', value: '' },
  ...categories.value.map(value => ({ title: value, value })),
])
const activeBaseItems = computed(() => knowledgeBases.value
  .filter(item => item.status === 'ACTIVE')
  .map(item => ({ title: item.name, value: item.kbId })))
const retrieveScopeItems = computed(() => [
  { title: '全部知识库', value: 'all' },
  ...(selectedDetail.value ? [{ title: `当前文档：${selectedDetail.value.title}`, value: 'current' }] : []),
  ...activeBaseItems.value,
])
const activeBaseCount = computed(() => knowledgeBases.value.filter(item => item.status === 'ACTIVE').length)
const selectedBaseName = computed(() => selectedKbId.value === 'all' ? '全部知识文档' : baseName(selectedKbId.value))
const currentPageChunkCount = computed(() => docs.value.reduce((sum, item) => sum + Number(item.chunkCount || 0), 0))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / size.value)))

function emptyBaseForm() {
  return { kbId: '', name: '', description: '', status: 'ACTIVE' }
}

function emptyDocForm() {
  return {
    kbId: selectedKbId.value !== 'all' ? selectedKbId.value : 'default',
    docId: '',
    title: '',
    category: '通用知识',
    sourcePath: '',
    content: '',
    version: 'v1',
    status: 'ACTIVE',
  }
}

function baseName(kbId) {
  return knowledgeBases.value.find(item => item.kbId === kbId)?.name || kbId || '默认知识库'
}

async function fetchBases() {
  baseLoading.value = true
  try {
    const resp = await listKnowledgeBases()
    knowledgeBases.value = resp?.data || []
    allDocumentCount.value = knowledgeBases.value.reduce((sum, item) => sum + Number(item.documentCount || 0), 0)
  } catch (error) {
    showMsg('知识库加载失败', 'error')
  } finally {
    baseLoading.value = false
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
      kbId: selectedKbId.value === 'all' ? undefined : selectedKbId.value,
    })
    const data = resp?.data || {}
    docs.value = data.records || []
    total.value = Number(data.total || 0)
  } catch (error) {
    showMsg('知识文档加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const resp = await listKnowledgeCategories()
    categories.value = resp?.data || []
  } catch (error) {
    categories.value = []
  }
}

async function refreshAll() {
  await Promise.all([fetchBases(), fetchCategories()])
  await fetchDocs()
}

async function handleImported(docId) {
  await refreshAll()
  await openDocument(docId)
  showMsg('文件已导入，向量索引将在后台完成')
}

async function selectBase(kbId) {
  selectedKbId.value = kbId
  page.value = 1
  selectedDoc.value = null
  selectedDetail.value = null
  citations.value = []
  retrieveScope.value = kbId
  await fetchDocs()
}

function applyFilters() {
  page.value = 1
  fetchDocs()
}

function changePage(nextPage) {
  page.value = Math.min(Math.max(1, nextPage), pageCount.value)
  fetchDocs()
}

function getRowProps({ item }) {
  return item?.docId === selectedDoc.value?.docId ? { class: 'selected-row' } : {}
}

function handleRowClick(_, row) {
  if (row?.item) openDocument(row.item.docId)
}

async function openDocument(docId, chunkId = '') {
  try {
    const resp = await getKnowledgeDoc(docId)
    selectedDetail.value = resp?.data || null
    selectedDoc.value = selectedDetail.value ? { ...selectedDetail.value } : null
    highlightChunkId.value = chunkId
    await router.replace({ path: '/ai/knowledge', query: { docId, ...(chunkId ? { chunkId } : {}) } })
    if (chunkId) {
      await nextTick()
      document.getElementById(`chunk-${chunkId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  } catch (error) {
    showMsg('知识文档详情加载失败', 'error')
  }
}

function openCitation(citation) {
  openDocument(citation.docId, citation.chunkId)
}

function openBaseCreate() {
  baseEditor.mode = 'create'
  baseEditor.form = emptyBaseForm()
  baseEditor.visible = true
}

function openBaseEdit(base) {
  baseEditor.mode = 'edit'
  baseEditor.form = { kbId: base.kbId, name: base.name, description: base.description || '', status: base.status }
  baseEditor.visible = true
}

async function saveBase() {
  if (!baseEditor.form.name.trim()) return showMsg('知识库名称不能为空', 'warning')
  baseSaving.value = true
  try {
    if (baseEditor.mode === 'create') await createKnowledgeBase({ ...baseEditor.form })
    else await updateKnowledgeBase(baseEditor.form.kbId, { ...baseEditor.form })
    baseEditor.visible = false
    await fetchBases()
    showMsg('知识库已保存')
  } catch (error) {
    showMsg(error?.response?.data?.message || '知识库保存失败', 'error')
  } finally {
    baseSaving.value = false
  }
}

function confirmBaseDelete(base) {
  Object.assign(deleteDialog, { visible: true, type: 'base', id: base.kbId, name: base.name })
}

function openDocCreate() {
  docEditor.mode = 'create'
  docEditor.form = emptyDocForm()
  docEditor.visible = true
}

function openDocEdit() {
  if (!selectedDetail.value) return
  docEditor.mode = 'edit'
  docEditor.form = {
    kbId: selectedDetail.value.kbId || 'default',
    docId: selectedDetail.value.docId,
    title: selectedDetail.value.title,
    category: selectedDetail.value.category,
    sourcePath: selectedDetail.value.sourcePath,
    content: selectedDetail.value.content,
    version: selectedDetail.value.version,
    status: selectedDetail.value.status,
  }
  docEditor.visible = true
}

async function saveDoc() {
  if (!docEditor.form.title.trim() || !docEditor.form.content.trim()) return showMsg('标题和正文不能为空', 'warning')
  docSaving.value = true
  try {
    const resp = docEditor.mode === 'create'
      ? await createKnowledgeDoc({ ...docEditor.form })
      : await updateKnowledgeDoc(docEditor.form.docId, { ...docEditor.form })
    const detail = resp?.data
    docEditor.visible = false
    await refreshAll()
    if (detail?.docId) await openDocument(detail.docId)
    showMsg('知识文档已保存')
  } catch (error) {
    showMsg(error?.response?.data?.message || '知识文档保存失败', 'error')
  } finally {
    docSaving.value = false
  }
}

function confirmDocDelete() {
  if (!selectedDetail.value) return
  Object.assign(deleteDialog, { visible: true, type: 'doc', id: selectedDetail.value.docId, name: selectedDetail.value.title })
}

async function performDelete() {
  deleting.value = true
  try {
    if (deleteDialog.type === 'base') {
      await deleteKnowledgeBase(deleteDialog.id)
      if (selectedKbId.value === deleteDialog.id) selectedKbId.value = 'all'
    } else {
      await deleteKnowledgeDoc(deleteDialog.id)
      selectedDoc.value = null
      selectedDetail.value = null
      highlightChunkId.value = ''
      await router.replace('/ai/knowledge')
    }
    deleteDialog.visible = false
    await refreshAll()
    showMsg('删除成功')
  } catch (error) {
    showMsg(error?.response?.data?.message || '删除失败', 'error')
  } finally {
    deleting.value = false
  }
}

async function rebuildSelected() {
  if (!selectedDetail.value) return
  rebuilding.value = true
  try {
    await rebuildKnowledgeDoc(selectedDetail.value.docId)
    await openDocument(selectedDetail.value.docId)
    await fetchDocs()
    showMsg('分片已重建')
  } catch (error) {
    showMsg(error?.response?.data?.message || '分片重建失败', 'error')
  } finally {
    rebuilding.value = false
  }
}

async function reindexSelected() {
  if (!selectedDetail.value) return
  reindexing.value = true
  try {
    await enqueueKnowledgeIndexJob(selectedDetail.value.docId)
    showMsg('向量索引任务已进入后台队列')
  } catch (error) {
    showMsg(error?.response?.data?.message || '索引任务创建失败', 'error')
  } finally {
    reindexing.value = false
  }
}

async function runRetrieve() {
  if (!retrieveQuestion.value.trim()) return showMsg('请输入问题', 'warning')
  if (retrieveScope.value === 'current' && !selectedDetail.value) return showMsg('请先选择文档', 'warning')
  retrieving.value = true
  try {
    const kbIds = retrieveScope.value === 'current' ? [selectedDetail.value.docId] : [retrieveScope.value || 'all']
    const resp = await retrieveKnowledge({ question: retrieveQuestion.value.trim(), kbIds, topK: 6 })
    citations.value = resp?.data || []
  } catch (error) {
    showMsg('检索失败', 'error')
  } finally {
    retrieving.value = false
  }
}

function formatTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-'
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(async () => {
  await refreshAll()
  const docId = typeof route.query.docId === 'string' ? route.query.docId : ''
  const chunkId = typeof route.query.chunkId === 'string' ? route.query.chunkId : ''
  if (docId) await openDocument(docId, chunkId)
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
  gap: 24px;
  padding: 28px;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #0c525b 0%, #127e69 58%, #293945 100%);
  box-shadow: 0 20px 50px rgba(26, 42, 58, 0.16);
}

.eyebrow,
.panel-title span {
  color: #e0bd6b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.hero-row h1 { margin: 8px 0; font-size: 38px; }
.hero-row p { max-width: 760px; margin: 0; color: rgba(255, 255, 255, 0.82); line-height: 1.7; }
.hero-actions,
.detail-actions,
.retrieve-bar,
.filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}

.metric-card,
.panel {
  border: 1px solid rgba(23, 42, 52, 0.09);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(34, 53, 73, 0.07);
}

.metric-card { display: grid; gap: 5px; padding: 17px; }
.metric-card span,
.metric-card small,
.doc-title small,
.base-item small,
.detail-head p,
.chunk-head small,
.citation-card small { color: #6c7784; font-size: 12px; }
.metric-card strong { font-size: 28px; }

.workspace-grid {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 390px;
  gap: 16px;
}

.panel { padding: 18px; }
.panel-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.panel-title > div:first-child { display: grid; gap: 3px; }
.panel-title strong { font-size: 19px; }
.base-panel { align-self: start; }
.base-item-wrap { position: relative; margin-bottom: 8px; }

.base-item {
  width: 100%;
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 70px 10px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  text-align: left;
  background: #f5f8f8;
  cursor: pointer;
}

.base-item > div { min-width: 0; display: grid; gap: 4px; }
.base-item small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.base-item.active { border-color: rgba(18, 126, 105, 0.3); background: #e9f6f1; }
.base-actions { position: absolute; top: 18px; right: 5px; display: flex; }
.document-panel { min-width: 0; }
.filters { display: grid; grid-template-columns: minmax(220px, 1fr) 150px 130px auto; margin-bottom: 12px; }
.doc-title { display: grid; gap: 3px; }
.selected-row { background: #edf8f4 !important; }
.pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 10px; font-size: 13px; }
.detail-panel { max-height: 920px; overflow: auto; }
.empty-state,
.empty-citation { min-height: 150px; display: grid; place-content: center; gap: 8px; color: #7a8792; text-align: center; }
.detail-head h2 { margin: 0 0 6px; font-size: 22px; }
.detail-head p { margin: 0 0 12px; }

.content-preview {
  max-height: 220px;
  overflow: auto;
  margin: 14px 0;
  padding: 14px;
  border-radius: 10px;
  color: #354452;
  background: #f5f7f8;
  white-space: pre-wrap;
  line-height: 1.65;
}

.chunk-list { display: grid; gap: 10px; }
.chunk-card { padding: 12px; border: 1px solid rgba(23, 42, 52, 0.08); border-radius: 10px; background: #fff; transition: 0.25s ease; }
.chunk-card.highlighted { border-color: #d4a943; background: #fff8df; box-shadow: 0 0 0 3px rgba(212, 169, 67, 0.14); }
.chunk-head { display: flex; justify-content: space-between; gap: 8px; }
.chunk-card p,
.citation-card p { margin: 8px 0 0; color: #465564; line-height: 1.6; }
.retrieve-panel { margin-top: 16px; }
.retrieve-scope { min-width: 260px; max-width: 420px; }
.retrieve-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
.citation-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }

.citation-card {
  min-height: 130px;
  padding: 14px;
  border: 1px solid rgba(23, 42, 52, 0.09);
  border-radius: 10px;
  text-align: left;
  background: #fff;
  cursor: pointer;
}

.citation-card:hover { border-color: rgba(18, 126, 105, 0.36); transform: translateY(-1px); }
.citation-card > div { display: grid; gap: 3px; }
.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.span-2 { grid-column: 1 / -1; }
.dialog-fields { display: grid; gap: 4px; }
.delete-tip { margin: 10px 0 0; color: #7a4d20; }

@media (max-width: 1280px) {
  .workspace-grid { grid-template-columns: 230px minmax(0, 1fr); }
  .detail-panel { grid-column: 1 / -1; max-height: none; }
}

@media (max-width: 900px) {
  .knowledge-page { padding: 14px; }
  .hero-row { align-items: start; flex-direction: column; }
  .metric-row,
  .workspace-grid,
  .citation-grid,
  .filters,
  .editor-grid { grid-template-columns: 1fr; }
  .retrieve-bar { grid-template-columns: 1fr; }
  .retrieve-scope { min-width: 100%; max-width: 100%; }
}
</style>
