<template>
  <main class="template-page">
    <section class="hero">
      <div>
        <span class="eyebrow">Matrix RAG Ground Truth</span>
        <h1>财务标准问题标注</h1>
        <p>先批量导入领域问题，再为每道题绑定标准文档或标准分片。只有完成标注的问题才能激活并进入正式评测。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-chart-box-outline" @click="router.push('/ai/knowledge/evaluations')">评测工作台</v-btn>
        <v-btn color="primary" prepend-icon="mdi-database-import-outline" :loading="importing" @click="importTemplate">导入 50 条模板</v-btn>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span>模板问题</span>
        <strong>{{ templateMeta.total }}</strong>
        <small>7 个财务主题</small>
      </article>
      <article class="summary-card">
        <span>已落库</span>
        <strong>{{ questions.length }}</strong>
        <small>{{ selectedDatasetName }}</small>
      </article>
      <article class="summary-card">
        <span>待标注</span>
        <strong>{{ draftCount }}</strong>
        <small>尚未进入评测</small>
      </article>
      <article class="summary-card">
        <span>可执行</span>
        <strong>{{ activeCount }}</strong>
        <small>标注完成率 {{ completionRate }}%</small>
      </article>
    </section>

    <section class="panel setup-panel">
      <div class="panel-head">
        <div>
          <span>Dataset Setup</span>
          <strong>选择评测集</strong>
        </div>
        <v-btn icon="mdi-refresh" variant="text" :loading="loading" @click="loadAll" />
      </div>
      <div class="setup-grid">
        <v-select
          v-model="selectedDatasetId"
          :items="datasetItems"
          item-title="title"
          item-value="value"
          label="目标评测集"
          variant="outlined"
          hide-details
          @update:model-value="loadQuestions"
        />
        <v-btn variant="tonal" prepend-icon="mdi-plus" @click="createBaselineDataset">新建财务基线评测集</v-btn>
      </div>
      <v-alert type="info" variant="tonal" density="compact">
        模板导入默认创建为 INACTIVE 草稿，不会污染当前 Recall@K 和 MRR。绑定标准文档或分片后再激活。
      </v-alert>
    </section>

    <section class="category-grid">
      <article v-for="category in templateMeta.categories" :key="category.name" class="category-card">
        <v-icon>mdi-folder-text-outline</v-icon>
        <div>
          <strong>{{ category.name }}</strong>
          <small>{{ category.count }} 条问题</small>
        </div>
      </article>
    </section>

    <section class="panel question-panel">
      <div class="panel-head">
        <div>
          <span>Curation Queue</span>
          <strong>标准答案标注队列</strong>
        </div>
        <v-chip size="small" variant="tonal">{{ filteredQuestions.length }} 条</v-chip>
      </div>

      <div class="filters">
        <v-text-field v-model="keyword" label="搜索问题" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details />
        <v-select v-model="statusFilter" :items="statusFilterItems" item-title="title" item-value="value" label="状态" variant="outlined" density="compact" hide-details />
      </div>

      <div v-if="loading" class="empty-state">正在加载评测问题…</div>
      <div v-else-if="!selectedDatasetId" class="empty-state">先选择或创建一个评测集</div>
      <div v-else-if="!questions.length" class="empty-state">当前评测集暂无问题，可导入财务模板</div>
      <div v-else class="question-list">
        <button
          v-for="(item, index) in filteredQuestions"
          :key="item.questionId"
          type="button"
          class="question-card"
          @click="openEditor(item)"
        >
          <span class="question-index">{{ index + 1 }}</span>
          <div class="question-main">
            <strong>{{ item.question }}</strong>
            <small>
              范围 {{ scopeText(item.kbIds) }} · 标准文档 {{ item.expectedDocIds?.length || 0 }} · 标准分片 {{ item.expectedChunkIds?.length || 0 }}
            </small>
          </div>
          <v-chip :color="item.status === 'ACTIVE' ? 'success' : 'warning'" size="small" variant="tonal">
            {{ item.status === 'ACTIVE' ? '可执行' : '待标注' }}
          </v-chip>
          <v-icon>mdi-chevron-right</v-icon>
        </button>
      </div>
    </section>

    <v-dialog v-model="editor.visible" max-width="860" persistent>
      <v-card>
        <v-card-title>标注标准问题</v-card-title>
        <v-card-text class="editor-fields">
          <v-textarea v-model="editor.form.question" label="问题" rows="2" auto-grow variant="outlined" />
          <v-select
            v-model="editor.form.kbIds"
            :items="knowledgeScopeItems"
            item-title="title"
            item-value="value"
            label="检索知识库范围"
            multiple
            chips
            variant="outlined"
          />
          <v-text-field v-model="editor.form.expectedDocIdsText" label="标准文档 ID" hint="多个 ID 使用逗号或换行分隔" persistent-hint variant="outlined" />
          <v-text-field v-model="editor.form.expectedChunkIdsText" label="标准分片 ID" hint="分片标准优先于文档标准；多个 ID 使用逗号或换行分隔" persistent-hint variant="outlined" />
          <v-textarea v-model="editor.form.expectedAnswer" label="标准答案要点" rows="5" auto-grow variant="outlined" />
          <v-alert v-if="!hasGroundTruth" type="warning" density="compact" variant="tonal">
            当前尚未绑定标准文档或标准分片，只能保存为草稿。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editor.visible = false">取消</v-btn>
          <v-btn variant="tonal" :loading="saving" @click="saveQuestion('INACTIVE')">保存草稿</v-btn>
          <v-btn color="primary" :disabled="!hasGroundTruth" :loading="saving" @click="saveQuestion('ACTIVE')">保存并激活</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="importResult.visible" max-width="720">
      <v-card>
        <v-card-title>模板导入结果</v-card-title>
        <v-card-text>
          <div class="import-summary">
            <span>导入 <strong>{{ importResult.data.imported || 0 }}</strong></span>
            <span>跳过 <strong>{{ importResult.data.skipped || 0 }}</strong></span>
            <span>拒绝 <strong>{{ importResult.data.rejected || 0 }}</strong></span>
          </div>
          <div v-if="rejectedItems.length" class="rejected-list">
            <article v-for="item in rejectedItems" :key="item.row">
              <strong>第 {{ item.row }} 条：{{ item.question }}</strong>
              <small>{{ item.message }}</small>
            </article>
          </div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn color="primary" @click="importResult.visible = false">知道了</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2600">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listKnowledgeBases } from '@/api/ai'
import {
  bulkImportEvaluationQuestions,
  createEvaluationDataset,
  listEvaluationDatasets,
  listEvaluationQuestions,
  updateEvaluationQuestion,
} from '@/api/knowledgeEvaluation'
import { financeEvaluationTemplate, financeEvaluationTemplateMeta } from '@/data/financeEvaluationTemplate'

const router = useRouter()
const templateMeta = financeEvaluationTemplateMeta
const datasets = ref([])
const questions = ref([])
const knowledgeBases = ref([])
const selectedDatasetId = ref('')
const keyword = ref('')
const statusFilter = ref('ALL')
const loading = ref(false)
const importing = ref(false)
const saving = ref(false)

const editor = reactive({
  visible: false,
  questionId: '',
  form: {
    question: '',
    kbIds: ['all'],
    expectedDocIdsText: '',
    expectedChunkIdsText: '',
    expectedAnswer: '',
  },
})
const importResult = reactive({ visible: false, data: {} })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const statusFilterItems = [
  { title: '全部状态', value: 'ALL' },
  { title: '待标注', value: 'INACTIVE' },
  { title: '可执行', value: 'ACTIVE' },
]
const datasetItems = computed(() => datasets.value.map(item => ({ title: item.name, value: item.datasetId })))
const selectedDatasetName = computed(() => datasets.value.find(item => item.datasetId === selectedDatasetId.value)?.name || '尚未选择')
const draftCount = computed(() => questions.value.filter(item => item.status !== 'ACTIVE').length)
const activeCount = computed(() => questions.value.filter(item => item.status === 'ACTIVE').length)
const completionRate = computed(() => questions.value.length ? Math.round(activeCount.value * 100 / questions.value.length) : 0)
const filteredQuestions = computed(() => questions.value.filter(item => {
  if (statusFilter.value !== 'ALL' && item.status !== statusFilter.value) return false
  if (keyword.value.trim() && !item.question?.toLowerCase().includes(keyword.value.trim().toLowerCase())) return false
  return true
}))
const knowledgeScopeItems = computed(() => [
  { title: '全部知识库', value: 'all' },
  ...knowledgeBases.value.filter(item => item.status === 'ACTIVE').map(item => ({ title: item.name, value: item.kbId })),
])
const hasGroundTruth = computed(() => splitIds(editor.form.expectedDocIdsText).length > 0 || splitIds(editor.form.expectedChunkIdsText).length > 0)
const rejectedItems = computed(() => (importResult.data.items || []).filter(item => item.status === 'REJECTED'))

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [datasetResp, baseResp] = await Promise.all([
      listEvaluationDatasets(),
      listKnowledgeBases(),
    ])
    datasets.value = datasetResp?.data || []
    knowledgeBases.value = baseResp?.data || []
    if (!selectedDatasetId.value && datasets.value.length) selectedDatasetId.value = datasets.value[0].datasetId
    await loadQuestions()
  } catch (error) {
    notify(error?.message || '标注工作台加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadQuestions() {
  if (!selectedDatasetId.value) {
    questions.value = []
    return
  }
  try {
    const resp = await listEvaluationQuestions(selectedDatasetId.value)
    questions.value = resp?.data || []
  } catch (error) {
    notify(error?.message || '评测问题加载失败', 'error')
  }
}

async function createBaselineDataset() {
  loading.value = true
  try {
    const resp = await createEvaluationDataset({
      name: templateMeta.name,
      description: templateMeta.description,
      status: 'ACTIVE',
    })
    const dataset = resp?.data
    if (dataset) {
      datasets.value = [dataset, ...datasets.value]
      selectedDatasetId.value = dataset.datasetId
      questions.value = []
      notify('财务基线评测集已创建')
    }
  } catch (error) {
    notify(error?.message || '评测集创建失败', 'error')
  } finally {
    loading.value = false
  }
}

async function importTemplate() {
  if (!selectedDatasetId.value) await createBaselineDataset()
  if (!selectedDatasetId.value) return
  importing.value = true
  try {
    const payload = financeEvaluationTemplate.map(({ category, ...question }) => question)
    const resp = await bulkImportEvaluationQuestions(selectedDatasetId.value, payload)
    importResult.data = resp?.data || {}
    importResult.visible = true
    await loadQuestions()
  } catch (error) {
    notify(error?.message || '财务问题模板导入失败', 'error')
  } finally {
    importing.value = false
  }
}

function openEditor(item) {
  editor.questionId = item.questionId
  editor.form.question = item.question || ''
  editor.form.kbIds = item.kbIds?.length ? [...item.kbIds] : ['all']
  editor.form.expectedDocIdsText = (item.expectedDocIds || []).join('\n')
  editor.form.expectedChunkIdsText = (item.expectedChunkIds || []).join('\n')
  editor.form.expectedAnswer = item.expectedAnswer || ''
  editor.visible = true
}

async function saveQuestion(status) {
  if (!selectedDatasetId.value || !editor.questionId) return
  saving.value = true
  try {
    await updateEvaluationQuestion(selectedDatasetId.value, editor.questionId, {
      question: editor.form.question,
      kbIds: normalizeScope(editor.form.kbIds),
      expectedDocIds: splitIds(editor.form.expectedDocIdsText),
      expectedChunkIds: splitIds(editor.form.expectedChunkIdsText),
      expectedAnswer: editor.form.expectedAnswer,
      status,
    })
    editor.visible = false
    await loadQuestions()
    notify(status === 'ACTIVE' ? '标准问题已激活' : '草稿已保存')
  } catch (error) {
    notify(error?.message || '标准问题保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function normalizeScope(values) {
  const list = Array.isArray(values) ? values.filter(Boolean) : []
  if (list.includes('all') || !list.length) return ['all']
  return [...new Set(list)]
}

function splitIds(text) {
  return [...new Set(String(text || '').split(/[\n,，;；]+/).map(item => item.trim()).filter(Boolean))]
}

function scopeText(kbIds) {
  if (!kbIds?.length || kbIds.includes('all')) return '全部知识库'
  return kbIds.map(id => knowledgeBases.value.find(item => item.kbId === id)?.name || id).join('、')
}

function notify(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
.template-page { min-height: 100vh; padding: 32px; background: linear-gradient(145deg, #eef3ff 0%, #f8fafc 46%, #eefbf8 100%); color: #172033; }
.hero { display: flex; justify-content: space-between; gap: 24px; padding: 32px; border-radius: 28px; background: linear-gradient(125deg, #172554, #1e3a8a 55%, #0f766e); color: white; box-shadow: 0 24px 60px rgba(30, 58, 138, .24); }
.hero h1 { margin: 8px 0; font-size: clamp(30px, 4vw, 48px); }
.hero p { max-width: 760px; margin: 0; color: rgba(255,255,255,.78); line-height: 1.7; }
.eyebrow, .panel-head span { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; opacity: .7; }
.hero-actions { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 22px 0; }
.summary-card, .panel, .category-card { border: 1px solid rgba(148, 163, 184, .22); background: rgba(255,255,255,.92); box-shadow: 0 14px 36px rgba(15, 23, 42, .07); }
.summary-card { padding: 20px; border-radius: 20px; display: grid; gap: 6px; }
.summary-card span, .summary-card small, .question-main small { color: #64748b; }
.summary-card strong { font-size: 34px; }
.panel { border-radius: 22px; padding: 22px; margin-bottom: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.panel-head > div { display: grid; gap: 3px; }
.panel-head strong { font-size: 20px; }
.setup-grid, .filters { display: grid; grid-template-columns: minmax(260px, 1fr) auto; gap: 14px; align-items: center; margin-bottom: 16px; }
.category-grid { display: grid; grid-template-columns: repeat(7, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; }
.category-card { border-radius: 18px; padding: 16px; display: flex; gap: 10px; align-items: center; }
.category-card div { display: grid; gap: 2px; }
.category-card small { color: #64748b; }
.question-list { display: grid; gap: 10px; }
.question-card { width: 100%; border: 1px solid #e2e8f0; background: #fff; border-radius: 16px; padding: 15px; display: grid; grid-template-columns: 34px 1fr auto 24px; align-items: center; gap: 12px; text-align: left; cursor: pointer; transition: .18s ease; }
.question-card:hover { transform: translateY(-1px); border-color: #93c5fd; box-shadow: 0 10px 24px rgba(37, 99, 235, .08); }
.question-index { width: 30px; height: 30px; border-radius: 10px; background: #eff6ff; color: #1d4ed8; display: grid; place-items: center; font-weight: 700; }
.question-main { display: grid; gap: 5px; }
.empty-state { padding: 48px; text-align: center; color: #64748b; }
.editor-fields { display: grid; gap: 4px; padding-top: 18px !important; }
.import-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.import-summary span { padding: 18px; border-radius: 14px; background: #f1f5f9; text-align: center; }
.import-summary strong { display: block; font-size: 28px; }
.rejected-list { display: grid; gap: 8px; margin-top: 16px; max-height: 280px; overflow: auto; }
.rejected-list article { display: grid; gap: 3px; padding: 12px; border-radius: 12px; background: #fff1f2; }
.rejected-list small { color: #be123c; }
@media (max-width: 1100px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } .category-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 720px) { .template-page { padding: 16px; } .hero { padding: 22px; flex-direction: column; } .summary-grid, .category-grid, .setup-grid, .filters { grid-template-columns: 1fr; } .question-card { grid-template-columns: 30px 1fr auto; } .question-card > .v-icon { display: none; } }
</style>
