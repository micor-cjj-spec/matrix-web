<template>
  <main class="evaluation-page">
    <section class="hero">
      <div>
        <span class="eyebrow">Matrix RAG Quality</span>
        <h1>知识检索评测工作台</h1>
        <p>用标准问题持续验证 Recall@K、MRR、零命中率与检索延迟，为分片、Embedding、混合检索和重排优化建立可对比基线。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="router.push('/ai/knowledge')">返回知识系统</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loadingDatasets" @click="refreshAll">刷新</v-btn>
        <v-btn color="primary" prepend-icon="mdi-database-plus-outline" @click="datasetDialog = true">新建评测集</v-btn>
      </div>
    </section>

    <v-alert type="info" variant="tonal" density="compact" class="dependency-alert">
      本页面依赖后端知识评测 Phase 4A 接口及 V7 数据库脚本。评测运行会使用当前环境的真实混合检索配置。
    </v-alert>

    <section class="metric-grid">
      <article class="metric-card">
        <span>Recall@{{ currentRun?.topK || topK }}</span>
        <strong>{{ percent(currentRun?.recallAtK) }}</strong>
        <small>标准文档或分片召回覆盖率</small>
      </article>
      <article class="metric-card">
        <span>MRR</span>
        <strong>{{ decimal(currentRun?.mrr) }}</strong>
        <small>首个相关结果排名质量</small>
      </article>
      <article class="metric-card">
        <span>零命中率</span>
        <strong>{{ percent(currentRun?.zeroHitRate) }}</strong>
        <small>越低越好</small>
      </article>
      <article class="metric-card">
        <span>平均延迟</span>
        <strong>{{ latency(currentRun?.averageLatencyMs) }}</strong>
        <small>{{ runProgressText }}</small>
      </article>
    </section>

    <section class="workspace">
      <aside class="panel dataset-panel">
        <div class="panel-head">
          <div>
            <span>Evaluation Datasets</span>
            <strong>评测集</strong>
          </div>
          <v-chip size="small" variant="tonal">{{ datasets.length }}</v-chip>
        </div>

        <div v-if="loadingDatasets" class="empty-state">正在加载评测集…</div>
        <div v-else-if="!datasets.length" class="empty-state">
          <v-icon size="36">mdi-database-search-outline</v-icon>
          <span>暂无评测集</span>
          <small>先创建一个财务领域基准集</small>
        </div>
        <template v-else>
          <button
            v-for="dataset in datasets"
            :key="dataset.datasetId"
            type="button"
            class="dataset-item"
            :class="{ active: selectedDatasetId === dataset.datasetId }"
            @click="selectDataset(dataset.datasetId)"
          >
            <div>
              <strong>{{ dataset.name }}</strong>
              <small>{{ dataset.description || dataset.datasetId }}</small>
            </div>
            <v-chip :color="dataset.status === 'ACTIVE' ? 'success' : 'grey'" size="x-small" variant="tonal">
              {{ dataset.status === 'ACTIVE' ? '启用' : '停用' }}
            </v-chip>
          </button>
        </template>
      </aside>

      <section class="panel questions-panel">
        <div class="panel-head">
          <div>
            <span>Ground Truth</span>
            <strong>{{ selectedDataset?.name || '标准问题' }}</strong>
          </div>
          <v-btn
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            :disabled="!selectedDatasetId"
            @click="questionDialog = true"
          >
            添加问题
          </v-btn>
        </div>

        <div class="question-summary">
          <span>共 {{ questions.length }} 题</span>
          <span>启用 {{ activeQuestionCount }} 题</span>
          <span>分片级 {{ chunkLevelQuestionCount }} 题</span>
        </div>

        <v-data-table
          :headers="questionHeaders"
          :items="questions"
          :loading="loadingQuestions"
          class="evaluation-table"
          density="comfortable"
          hide-default-footer
          item-key="questionId"
          :items-per-page="-1"
        >
          <template #item.question="{ item }">
            <div class="question-cell">
              <strong>{{ item.question }}</strong>
              <small>{{ item.questionId }}</small>
            </div>
          </template>
          <template #item.scope="{ item }">
            <v-chip size="small" variant="tonal">
              {{ item.kbIds?.length ? item.kbIds.join('、') : '全部知识库' }}
            </v-chip>
          </template>
          <template #item.groundTruth="{ item }">
            <div class="ground-truth">
              <span v-if="item.expectedChunkIds?.length">{{ item.expectedChunkIds.length }} 个标准分片</span>
              <span v-else>{{ item.expectedDocIds?.length || 0 }} 篇标准文档</span>
            </div>
          </template>
          <template #item.status="{ item }">
            <v-chip :color="item.status === 'ACTIVE' ? 'success' : 'grey'" size="small" variant="tonal">
              {{ item.status === 'ACTIVE' ? '启用' : '停用' }}
            </v-chip>
          </template>
          <template #no-data>
            <div class="table-empty">尚未录入标准问题</div>
          </template>
        </v-data-table>
      </section>

      <aside class="panel run-panel">
        <div class="panel-head">
          <div>
            <span>Benchmark Run</span>
            <strong>执行评测</strong>
          </div>
          <v-chip :color="runColor(currentRun?.status)" size="small" variant="tonal">
            {{ runStatusText(currentRun?.status) }}
          </v-chip>
        </div>

        <v-select
          v-model="topK"
          :items="topKOptions"
          label="Top K"
          variant="outlined"
          density="comfortable"
          hide-details
        />

        <div class="run-explain">
          <p>同一评测集应保持 Top K、知识数据和模型配置可追溯，才能公平比较不同检索方案。</p>
          <small>本次将执行 {{ activeQuestionCount }} 道启用问题。</small>
        </div>

        <v-btn
          block
          color="primary"
          size="large"
          prepend-icon="mdi-play-circle-outline"
          :loading="running"
          :disabled="!selectedDatasetId || !activeQuestionCount"
          @click="runEvaluation"
        >
          开始评测
        </v-btn>

        <div class="run-meta" v-if="currentRun">
          <div><span>Run ID</span><strong>{{ currentRun.runId }}</strong></div>
          <div><span>开始时间</span><strong>{{ formatTime(currentRun.startTime) }}</strong></div>
          <div><span>结束时间</span><strong>{{ formatTime(currentRun.finishTime) }}</strong></div>
          <div><span>完成进度</span><strong>{{ currentRun.completedQuestions || 0 }}/{{ currentRun.totalQuestions || 0 }}</strong></div>
        </div>

        <div class="history-section">
          <div class="history-title">
            <strong>本机最近运行</strong>
            <small>浏览器记录</small>
          </div>
          <div v-if="!runHistory.length" class="history-empty">暂无运行记录</div>
          <template v-else>
            <button
              v-for="runId in runHistory"
              :key="runId"
              type="button"
              class="history-item"
              :class="{ active: currentRun?.runId === runId }"
              @click="loadRun(runId)"
            >
              <span>{{ shortId(runId) }}</span>
              <v-icon size="18">mdi-chevron-right</v-icon>
            </button>
          </template>
        </div>
      </aside>
    </section>

    <section class="panel results-panel">
      <div class="panel-head">
        <div>
          <span>Question Results</span>
          <strong>逐题诊断</strong>
        </div>
        <div class="result-actions">
          <v-chip size="small" variant="tonal">{{ resultRows.length }} 条</v-chip>
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-refresh"
            :disabled="!currentRun?.runId"
            :loading="loadingResults"
            @click="loadRun(currentRun.runId)"
          >
            刷新结果
          </v-btn>
        </div>
      </div>

      <v-data-table
        :headers="resultHeaders"
        :items="resultRows"
        :loading="loadingResults"
        class="evaluation-table result-table"
        density="comfortable"
        hide-default-footer
        item-key="resultId"
        :items-per-page="-1"
      >
        <template #item.question="{ item }">
          <div class="question-cell">
            <strong>{{ item.question }}</strong>
            <small>{{ item.questionId }}</small>
          </div>
        </template>
        <template #item.recall="{ item }">
          <v-chip :color="metricColor(item.recall)" size="small" variant="tonal">{{ percent(item.recall) }}</v-chip>
        </template>
        <template #item.firstRelevantRank="{ item }">
          <strong>{{ item.firstRelevantRank || '未命中' }}</strong>
        </template>
        <template #item.reciprocalRank="{ item }">{{ decimal(item.reciprocalRank) }}</template>
        <template #item.latencyMs="{ item }">{{ latency(item.latencyMs) }}</template>
        <template #item.status="{ item }">
          <v-chip :color="item.errorMessage ? 'error' : item.firstRelevantRank ? 'success' : 'warning'" size="small" variant="tonal">
            {{ item.errorMessage ? '失败' : item.firstRelevantRank ? '命中' : '零命中' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" prepend-icon="mdi-magnify" @click="openResult(item)">查看</v-btn>
        </template>
        <template #no-data>
          <div class="table-empty">运行一次评测后，这里会展示逐题结果</div>
        </template>
      </v-data-table>
    </section>

    <v-dialog v-model="datasetDialog" max-width="620" persistent>
      <v-card>
        <v-card-title>新建评测集</v-card-title>
        <v-card-text class="dialog-fields">
          <v-text-field v-model="datasetForm.name" label="评测集名称" variant="outlined" />
          <v-textarea v-model="datasetForm.description" label="说明" rows="3" variant="outlined" />
          <v-select
            v-model="datasetForm.status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="状态"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="datasetDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="savingDataset" @click="saveDataset">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="questionDialog" max-width="860" persistent>
      <v-card>
        <v-card-title>添加标准问题</v-card-title>
        <v-card-text class="dialog-fields">
          <v-textarea v-model="questionForm.question" label="问题" rows="3" variant="outlined" />
          <v-combobox
            v-model="questionForm.kbIds"
            multiple
            chips
            closable-chips
            label="知识库范围（留空代表全部）"
            hint="输入知识库 ID 后按 Enter"
            persistent-hint
            variant="outlined"
          />
          <v-combobox
            v-model="questionForm.expectedDocIds"
            multiple
            chips
            closable-chips
            label="标准文档 ID"
            hint="至少填写标准文档或标准分片之一"
            persistent-hint
            variant="outlined"
          />
          <v-combobox
            v-model="questionForm.expectedChunkIds"
            multiple
            chips
            closable-chips
            label="标准分片 ID"
            hint="填写后优先按分片级计算指标"
            persistent-hint
            variant="outlined"
          />
          <v-textarea v-model="questionForm.expectedAnswer" label="标准答案要点（可选）" rows="4" variant="outlined" />
          <v-select
            v-model="questionForm.status"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="状态"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="questionDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="savingQuestion" @click="saveQuestion">添加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="resultDialog" max-width="920">
      <v-card v-if="selectedResult">
        <v-card-title>逐题检索诊断</v-card-title>
        <v-card-text>
          <div class="diagnostic-question">{{ selectedResult.question }}</div>
          <div class="diagnostic-metrics">
            <v-chip :color="metricColor(selectedResult.recall)" variant="tonal">Recall {{ percent(selectedResult.recall) }}</v-chip>
            <v-chip variant="tonal">首个相关排名 {{ selectedResult.firstRelevantRank || '未命中' }}</v-chip>
            <v-chip variant="tonal">耗时 {{ latency(selectedResult.latencyMs) }}</v-chip>
          </div>

          <v-alert v-if="selectedResult.errorMessage" type="error" variant="tonal" class="my-4">
            {{ selectedResult.errorMessage }}
          </v-alert>

          <section class="diagnostic-section">
            <h3>Ground Truth</h3>
            <p><strong>标准文档：</strong>{{ selectedResult.expectedDocIds?.join('、') || '未设置' }}</p>
            <p><strong>标准分片：</strong>{{ selectedResult.expectedChunkIds?.join('、') || '未设置' }}</p>
            <p v-if="selectedResult.expectedAnswer"><strong>答案要点：</strong>{{ selectedResult.expectedAnswer }}</p>
          </section>

          <section class="diagnostic-section">
            <h3>实际召回</h3>
            <div v-if="!selectedResult.citations?.length" class="history-empty">没有召回结果</div>
            <article v-for="(citation, index) in selectedResult.citations || []" :key="`${citation.chunkId}-${index}`" class="citation-card">
              <div class="citation-head">
                <strong>#{{ index + 1 }} {{ citation.docName || citation.docId }}</strong>
                <small>{{ citation.docId }} · {{ citation.chunkId }}</small>
              </div>
              <p>{{ citation.snippet }}</p>
            </article>
          </section>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resultDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2600">
      {{ snackbar.text }}
    </v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createEvaluationDataset,
  createEvaluationQuestion,
  getKnowledgeEvaluationRun,
  listEvaluationDatasets,
  listEvaluationQuestions,
  listKnowledgeEvaluationResults,
  runKnowledgeEvaluation,
} from '@/api/knowledgeEvaluation'

const router = useRouter()
const HISTORY_KEY = 'matrixKnowledgeEvaluationRuns'

const datasets = ref([])
const questions = ref([])
const results = ref([])
const selectedDatasetId = ref('')
const currentRun = ref(null)
const selectedResult = ref(null)
const loadingDatasets = ref(false)
const loadingQuestions = ref(false)
const loadingResults = ref(false)
const savingDataset = ref(false)
const savingQuestion = ref(false)
const running = ref(false)
const datasetDialog = ref(false)
const questionDialog = ref(false)
const resultDialog = ref(false)
const topK = ref(5)
const runHistoryMap = ref(readHistory())
const snackbar = reactive({ show: false, text: '', color: 'success' })

const datasetForm = reactive({ name: '', description: '', status: 'ACTIVE' })
const questionForm = reactive({
  question: '',
  kbIds: [],
  expectedDocIds: [],
  expectedChunkIds: [],
  expectedAnswer: '',
  status: 'ACTIVE',
})

const statusOptions = [
  { title: '启用', value: 'ACTIVE' },
  { title: '停用', value: 'INACTIVE' },
]
const topKOptions = [1, 3, 5, 10, 20]
const questionHeaders = [
  { title: '问题', key: 'question', minWidth: 300 },
  { title: '检索范围', key: 'scope', width: 170 },
  { title: '标准依据', key: 'groundTruth', width: 150 },
  { title: '状态', key: 'status', width: 90 },
]
const resultHeaders = [
  { title: '问题', key: 'question', minWidth: 320 },
  { title: 'Recall', key: 'recall', width: 110 },
  { title: '首个相关排名', key: 'firstRelevantRank', width: 130 },
  { title: 'RR', key: 'reciprocalRank', width: 90 },
  { title: '耗时', key: 'latencyMs', width: 100 },
  { title: '结果', key: 'status', width: 100 },
  { title: '诊断', key: 'actions', width: 100, sortable: false },
]

const selectedDataset = computed(() => datasets.value.find(item => item.datasetId === selectedDatasetId.value) || null)
const activeQuestionCount = computed(() => questions.value.filter(item => item.status === 'ACTIVE').length)
const chunkLevelQuestionCount = computed(() => questions.value.filter(item => item.expectedChunkIds?.length).length)
const questionMap = computed(() => new Map(questions.value.map(item => [item.questionId, item])))
const runHistory = computed(() => runHistoryMap.value[selectedDatasetId.value] || [])
const runProgressText = computed(() => {
  if (!currentRun.value) return '尚未执行评测'
  return `${currentRun.value.completedQuestions || 0}/${currentRun.value.totalQuestions || 0} 题完成`
})
const resultRows = computed(() => results.value.map(result => {
  const question = questionMap.value.get(result.questionId) || {}
  return {
    ...result,
    question: question.question || result.questionId,
    expectedDocIds: question.expectedDocIds || [],
    expectedChunkIds: question.expectedChunkIds || [],
    expectedAnswer: question.expectedAnswer || '',
  }
}))

onMounted(refreshAll)

async function refreshAll() {
  await loadDatasets()
  if (selectedDatasetId.value) {
    await loadQuestions(selectedDatasetId.value)
    const latestRunId = runHistory.value[0]
    if (latestRunId) await loadRun(latestRunId, false)
  }
}

async function loadDatasets() {
  loadingDatasets.value = true
  try {
    const response = await listEvaluationDatasets()
    datasets.value = response?.data || []
    if (!datasets.value.some(item => item.datasetId === selectedDatasetId.value)) {
      selectedDatasetId.value = datasets.value[0]?.datasetId || ''
    }
  } catch (error) {
    notify(errorMessage(error, '评测集加载失败'), 'error')
  } finally {
    loadingDatasets.value = false
  }
}

async function selectDataset(datasetId) {
  if (selectedDatasetId.value === datasetId && questions.value.length) return
  selectedDatasetId.value = datasetId
  currentRun.value = null
  results.value = []
  await loadQuestions(datasetId)
  const latestRunId = runHistory.value[0]
  if (latestRunId) await loadRun(latestRunId, false)
}

async function loadQuestions(datasetId) {
  if (!datasetId) {
    questions.value = []
    return
  }
  loadingQuestions.value = true
  try {
    const response = await listEvaluationQuestions(datasetId)
    questions.value = response?.data || []
  } catch (error) {
    questions.value = []
    notify(errorMessage(error, '标准问题加载失败'), 'error')
  } finally {
    loadingQuestions.value = false
  }
}

async function saveDataset() {
  const name = datasetForm.name.trim()
  if (!name) return notify('请输入评测集名称', 'warning')
  savingDataset.value = true
  try {
    const response = await createEvaluationDataset({
      name,
      description: datasetForm.description.trim(),
      status: datasetForm.status,
    })
    const created = response?.data
    datasetDialog.value = false
    resetDatasetForm()
    await loadDatasets()
    if (created?.datasetId) await selectDataset(created.datasetId)
    notify('评测集已创建')
  } catch (error) {
    notify(errorMessage(error, '评测集创建失败'), 'error')
  } finally {
    savingDataset.value = false
  }
}

async function saveQuestion() {
  const question = questionForm.question.trim()
  const expectedDocs = normalizeTags(questionForm.expectedDocIds)
  const expectedChunks = normalizeTags(questionForm.expectedChunkIds)
  if (!question) return notify('请输入标准问题', 'warning')
  if (!expectedDocs.length && !expectedChunks.length) {
    return notify('至少填写一个标准文档或标准分片', 'warning')
  }

  savingQuestion.value = true
  try {
    await createEvaluationQuestion(selectedDatasetId.value, {
      question,
      kbIds: normalizeTags(questionForm.kbIds),
      expectedDocIds: expectedDocs,
      expectedChunkIds: expectedChunks,
      expectedAnswer: questionForm.expectedAnswer.trim(),
      status: questionForm.status,
    })
    questionDialog.value = false
    resetQuestionForm()
    await loadQuestions(selectedDatasetId.value)
    notify('标准问题已添加')
  } catch (error) {
    notify(errorMessage(error, '标准问题添加失败'), 'error')
  } finally {
    savingQuestion.value = false
  }
}

async function runEvaluation() {
  if (!selectedDatasetId.value || running.value) return
  running.value = true
  results.value = []
  try {
    const response = await runKnowledgeEvaluation(selectedDatasetId.value, topK.value)
    currentRun.value = response?.data || null
    if (currentRun.value?.runId) {
      saveRunHistory(selectedDatasetId.value, currentRun.value.runId)
      await loadResults(currentRun.value.runId)
    }
    const status = currentRun.value?.status
    notify(status === 'SUCCEEDED' ? '评测运行完成' : '评测已完成，请检查失败题目', status === 'SUCCEEDED' ? 'success' : 'warning')
  } catch (error) {
    notify(errorMessage(error, '评测执行失败'), 'error')
  } finally {
    running.value = false
  }
}

async function loadRun(runId, showError = true) {
  if (!runId) return
  loadingResults.value = true
  try {
    const [runResponse, resultResponse] = await Promise.all([
      getKnowledgeEvaluationRun(runId),
      listKnowledgeEvaluationResults(runId),
    ])
    currentRun.value = runResponse?.data || null
    results.value = resultResponse?.data || []
  } catch (error) {
    if (showError) notify(errorMessage(error, '评测结果加载失败'), 'error')
  } finally {
    loadingResults.value = false
  }
}

async function loadResults(runId) {
  loadingResults.value = true
  try {
    const response = await listKnowledgeEvaluationResults(runId)
    results.value = response?.data || []
  } catch (error) {
    notify(errorMessage(error, '逐题结果加载失败'), 'error')
  } finally {
    loadingResults.value = false
  }
}

function openResult(item) {
  selectedResult.value = item
  resultDialog.value = true
}

function saveRunHistory(datasetId, runId) {
  const existing = runHistoryMap.value[datasetId] || []
  runHistoryMap.value = {
    ...runHistoryMap.value,
    [datasetId]: [runId, ...existing.filter(item => item !== runId)].slice(0, 8),
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(runHistoryMap.value))
}

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    return {}
  }
}

function resetDatasetForm() {
  datasetForm.name = ''
  datasetForm.description = ''
  datasetForm.status = 'ACTIVE'
}

function resetQuestionForm() {
  questionForm.question = ''
  questionForm.kbIds = []
  questionForm.expectedDocIds = []
  questionForm.expectedChunkIds = []
  questionForm.expectedAnswer = ''
  questionForm.status = 'ACTIVE'
}

function normalizeTags(values) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function notify(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback
}

function percent(value) {
  return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : '--'
}

function decimal(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(3) : '--'
}

function latency(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))} ms` : '--'
}

function formatTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function shortId(value) {
  if (!value) return '--'
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value
}

function metricColor(value) {
  const number = Number(value)
  if (number >= 0.8) return 'success'
  if (number >= 0.5) return 'warning'
  return 'error'
}

function runColor(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'PARTIAL') return 'warning'
  if (status === 'FAILED') return 'error'
  if (status === 'RUNNING') return 'info'
  return 'grey'
}

function runStatusText(status) {
  const labels = {
    RUNNING: '运行中',
    SUCCEEDED: '已完成',
    PARTIAL: '部分失败',
    FAILED: '失败',
  }
  return labels[status] || '未运行'
}
</script>

<style scoped>
.evaluation-page {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(67, 97, 238, 0.14), transparent 34%),
    linear-gradient(180deg, #f7f9fe 0%, #edf2fa 100%);
  color: #172033;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  border-radius: 24px;
  color: white;
  background: linear-gradient(135deg, #172554 0%, #274690 58%, #4361ee 100%);
  box-shadow: 0 18px 48px rgba(30, 64, 175, 0.22);
}

.hero h1 {
  margin: 8px 0 10px;
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.08;
}

.hero p {
  max-width: 780px;
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
}

.eyebrow,
.panel-head span {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.68;
}

.hero-actions,
.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.dependency-alert {
  margin: 18px 0;
  border-radius: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.metric-card,
.panel {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.metric-card {
  padding: 20px;
  border-radius: 18px;
}

.metric-card span,
.metric-card small {
  display: block;
  color: #64748b;
}

.metric-card strong {
  display: block;
  margin: 8px 0 4px;
  font-size: 30px;
  color: #1e3a8a;
}

.workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}

.panel {
  border-radius: 20px;
  overflow: hidden;
}

.dataset-panel,
.run-panel {
  padding: 18px;
}

.questions-panel,
.results-panel {
  padding: 18px 18px 8px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.panel-head strong {
  display: block;
  margin-top: 3px;
  font-size: 18px;
}

.dataset-item {
  width: 100%;
  margin-bottom: 9px;
  padding: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  text-align: left;
  color: inherit;
  background: #f8fafc;
  cursor: pointer;
  transition: 0.18s ease;
}

.dataset-item:hover,
.dataset-item.active {
  border-color: rgba(67, 97, 238, 0.42);
  background: #eef2ff;
  transform: translateY(-1px);
}

.dataset-item div {
  min-width: 0;
}

.dataset-item strong,
.dataset-item small {
  display: block;
}

.dataset-item small {
  margin-top: 4px;
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state,
.table-empty,
.history-empty {
  padding: 30px 12px;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: #64748b;
  text-align: center;
}

.question-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: -2px 0 10px;
  color: #64748b;
  font-size: 13px;
}

.evaluation-table {
  border-radius: 14px;
}

.question-cell strong,
.question-cell small {
  display: block;
}

.question-cell small {
  margin-top: 4px;
  color: #94a3b8;
}

.ground-truth {
  color: #334155;
  font-size: 13px;
}

.run-panel :deep(.v-field) {
  margin-bottom: 14px;
}

.run-explain {
  margin: 4px 0 18px;
  color: #64748b;
  line-height: 1.6;
}

.run-explain p {
  margin: 0 0 8px;
}

.run-meta {
  margin-top: 18px;
  display: grid;
  gap: 9px;
}

.run-meta div {
  padding: 10px 11px;
  border-radius: 11px;
  background: #f8fafc;
}

.run-meta span,
.run-meta strong {
  display: block;
}

.run-meta span {
  color: #64748b;
  font-size: 12px;
}

.run-meta strong {
  margin-top: 3px;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.history-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.history-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.history-title small {
  color: #94a3b8;
}

.history-item {
  width: 100%;
  padding: 9px 10px;
  display: flex;
  justify-content: space-between;
  border: 0;
  border-radius: 10px;
  color: #475569;
  background: transparent;
  cursor: pointer;
}

.history-item:hover,
.history-item.active {
  color: #1d4ed8;
  background: #eff6ff;
}

.results-panel {
  margin-top: 18px;
}

.result-table {
  min-height: 230px;
}

.dialog-fields {
  display: grid;
  gap: 4px;
  padding-top: 20px;
}

.diagnostic-question {
  padding: 16px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 700;
  background: #eff6ff;
}

.diagnostic-metrics {
  margin: 14px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.diagnostic-section {
  margin-top: 20px;
}

.diagnostic-section h3 {
  margin-bottom: 10px;
}

.diagnostic-section p {
  margin: 7px 0;
  line-height: 1.6;
}

.citation-card {
  margin-bottom: 10px;
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 13px;
  background: #f8fbff;
}

.citation-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.citation-head small {
  color: #64748b;
}

.citation-card p {
  margin: 9px 0 0;
  color: #475569;
  line-height: 1.65;
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: 230px minmax(0, 1fr);
  }

  .run-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {
  .evaluation-page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .metric-grid,
  .workspace {
    grid-template-columns: 1fr;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .run-panel {
    grid-column: auto;
  }
}

@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
