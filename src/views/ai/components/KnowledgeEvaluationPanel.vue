<template>
  <section class="evaluation-shell">
    <v-progress-linear v-if="loadingConfig" indeterminate color="cyan" />

    <v-alert
      v-else-if="!config.enabled"
      type="info"
      variant="tonal"
      title="RAG 评测尚未启用"
      class="rollout-alert"
    >
      先执行 <code>{{ config.migration || 'sql/bizfi_ai_rag_evaluation_v7.sql' }}</code>，再设置
      <code>AI_KNOWLEDGE_EVALUATION_ENABLED=true</code> 并重启 base-service。
    </v-alert>

    <template v-else>
      <header class="evaluation-header">
        <div>
          <span>Evaluation Workspace</span>
          <h2>{{ kbName }}</h2>
          <p>用固定问题与期望文档/Chunk持续验证当前混合检索参数。</p>
        </div>
        <div class="header-actions">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loadingSets" @click="refreshAll">刷新</v-btn>
          <v-btn color="cyan-darken-2" prepend-icon="mdi-folder-plus-outline" @click="openSetCreate">新建评测集</v-btn>
        </div>
      </header>

      <div class="workspace-grid">
        <aside class="set-panel">
          <div class="panel-caption">
            <span>Evaluation Sets</span>
            <strong>评测集</strong>
          </div>
          <button
            v-for="item in sets"
            :key="item.setId"
            type="button"
            class="set-item"
            :class="{ active: selectedSetId === item.setId }"
            @click="selectedSetId = item.setId"
          >
            <div>
              <strong>{{ item.name }}</strong>
              <small>{{ item.description || item.setId }}</small>
            </div>
            <div class="set-meta">
              <v-chip size="x-small" :color="item.status === 'ACTIVE' ? 'success' : 'grey'" variant="tonal">
                {{ item.status === 'ACTIVE' ? '启用' : '停用' }}
              </v-chip>
              <span>{{ item.caseCount }} 题</span>
            </div>
          </button>
          <div v-if="!sets.length && !loadingSets" class="empty-small">还没有评测集</div>
        </aside>

        <main class="content-panel">
          <div v-if="!selectedSet" class="empty-main">
            <v-icon size="46">mdi-chart-timeline-variant-shimmer</v-icon>
            <strong>创建一个评测集开始建立质量基线</strong>
            <span>建议先录入 20–50 道真实财务问题。</span>
          </div>

          <template v-else>
            <div class="set-toolbar">
              <div>
                <span>{{ selectedSet.setId }}</span>
                <h3>{{ selectedSet.name }}</h3>
              </div>
              <div>
                <v-btn size="small" variant="text" prepend-icon="mdi-pencil-outline" @click="openSetEdit">编辑</v-btn>
                <v-btn size="small" color="error" variant="text" prepend-icon="mdi-delete-outline" @click="removeSet">删除</v-btn>
                <v-btn
                  size="small"
                  color="cyan-darken-2"
                  prepend-icon="mdi-play-circle-outline"
                  :loading="startingRun"
                  :disabled="selectedSet.status !== 'ACTIVE' || !!activeRun || !cases.length"
                  @click="startRun"
                >
                  运行评测
                </v-btn>
              </div>
            </div>

            <div class="metric-grid">
              <article class="metric-card">
                <span>Hit@K</span>
                <strong>{{ formatPercent(latestCompletedRun?.hitAtK) }}</strong>
                <small>{{ latestCompletedRun ? `${latestCompletedRun.hitCount}/${latestCompletedRun.caseCount} 命中` : '暂无运行' }}</small>
              </article>
              <article class="metric-card">
                <span>MRR</span>
                <strong>{{ formatNumber(latestCompletedRun?.mrr) }}</strong>
                <small>首个相关结果排名</small>
              </article>
              <article class="metric-card">
                <span>Recall@K</span>
                <strong>{{ formatPercent(latestCompletedRun?.recallAtK) }}</strong>
                <small>期望项覆盖率</small>
              </article>
              <article class="metric-card">
                <span>P95 Latency</span>
                <strong>{{ formatLatency(latestCompletedRun?.p95LatencyMs) }}</strong>
                <small>平均 {{ formatLatency(latestCompletedRun?.averageLatencyMs) }}</small>
              </article>
            </div>

            <v-tabs v-model="tab" color="cyan" class="evaluation-tabs">
              <v-tab value="cases">标准问题（{{ cases.length }}）</v-tab>
              <v-tab value="runs">运行历史（{{ runs.length }}）</v-tab>
            </v-tabs>

            <v-window v-model="tab">
              <v-window-item value="cases">
                <div class="section-toolbar">
                  <div>
                    <strong>标准问题</strong>
                    <span>每题至少配置一个期望文档或Chunk。</span>
                  </div>
                  <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" :disabled="!!activeRun" @click="openCaseCreate">
                    新增问题
                  </v-btn>
                </div>
                <v-table density="comfortable" class="data-table">
                  <thead>
                    <tr>
                      <th>问题</th>
                      <th>期望结果</th>
                      <th>Top-K</th>
                      <th>状态</th>
                      <th class="actions-column">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in cases" :key="item.caseId">
                      <td>
                        <div class="question-cell">
                          <strong>{{ item.question }}</strong>
                          <small>{{ item.caseId }}</small>
                        </div>
                      </td>
                      <td>
                        <div class="expected-cell">
                          <span v-if="item.expectedChunkIds?.length">Chunk：{{ item.expectedChunkIds.join(', ') }}</span>
                          <span v-else>文档：{{ docNames(item.expectedDocIds) }}</span>
                        </div>
                      </td>
                      <td>{{ item.topK }}</td>
                      <td>
                        <v-chip size="x-small" :color="item.status === 'ACTIVE' ? 'success' : 'grey'" variant="tonal">
                          {{ item.status === 'ACTIVE' ? '启用' : '停用' }}
                        </v-chip>
                      </td>
                      <td class="actions-column">
                        <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" :disabled="!!activeRun" @click="openCaseEdit(item)" />
                        <v-btn icon="mdi-delete-outline" size="x-small" color="error" variant="text" :disabled="!!activeRun" @click="removeCase(item)" />
                      </td>
                    </tr>
                    <tr v-if="!cases.length">
                      <td colspan="5" class="empty-row">暂无标准问题</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-window-item>

              <v-window-item value="runs">
                <div class="section-toolbar">
                  <div>
                    <strong>运行历史</strong>
                    <span>运行会保存当前RRF权重、向量后端和回退配置。</span>
                  </div>
                  <v-chip v-if="activeRun" color="warning" variant="tonal" size="small">
                    {{ activeRun.status }} · {{ activeRun.completedCount }}/{{ activeRun.caseCount }}
                  </v-chip>
                </div>
                <v-table density="comfortable" class="data-table run-table">
                  <thead>
                    <tr>
                      <th>运行时间</th>
                      <th>状态</th>
                      <th>进度</th>
                      <th>Hit@K</th>
                      <th>MRR</th>
                      <th>Recall</th>
                      <th>P95</th>
                      <th class="actions-column">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="run in runs"
                      :key="run.runId"
                      :class="{ selected: selectedRunId === run.runId }"
                      @click="selectRun(run)"
                    >
                      <td>{{ formatTime(run.createTime) }}</td>
                      <td><v-chip size="x-small" :color="statusColor(run.status)" variant="tonal">{{ run.status }}</v-chip></td>
                      <td>{{ run.completedCount }}/{{ run.caseCount }}</td>
                      <td>{{ formatPercent(run.hitAtK) }}</td>
                      <td>{{ formatNumber(run.mrr) }}</td>
                      <td>{{ formatPercent(run.recallAtK) }}</td>
                      <td>{{ formatLatency(run.p95LatencyMs) }}</td>
                      <td class="actions-column">
                        <v-btn
                          v-if="['FAILED', 'PARTIAL', 'SUCCEEDED'].includes(run.status)"
                          icon="mdi-replay"
                          size="x-small"
                          variant="text"
                          :disabled="!!activeRun && activeRun.runId !== run.runId"
                          @click.stop="retryRun(run)"
                        />
                      </td>
                    </tr>
                    <tr v-if="!runs.length">
                      <td colspan="8" class="empty-row">暂无运行记录</td>
                    </tr>
                  </tbody>
                </v-table>

                <div v-if="selectedRun" class="result-section">
                  <div class="result-heading">
                    <div>
                      <strong>逐题结果</strong>
                      <span>{{ selectedRun.runId }}</span>
                    </div>
                    <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loadingResults" @click="loadResults" />
                  </div>
                  <v-alert v-if="selectedRun.errorMessage" type="warning" variant="tonal" density="compact" class="run-error">
                    {{ selectedRun.errorMessage }}
                  </v-alert>
                  <v-table density="compact" class="data-table result-table">
                    <thead>
                      <tr>
                        <th>结果</th>
                        <th>问题</th>
                        <th>首个相关排名</th>
                        <th>Recall</th>
                        <th>耗时</th>
                        <th>召回文档</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="result in results" :key="result.caseId">
                        <td><v-icon :color="result.hit ? 'success' : 'error'">{{ result.hit ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon></td>
                        <td>
                          <div class="question-cell">
                            <strong>{{ result.question }}</strong>
                            <small v-if="result.errorMessage" class="error-text">{{ result.errorMessage }}</small>
                          </div>
                        </td>
                        <td>{{ result.firstRelevantRank || '—' }}</td>
                        <td>{{ formatPercent(result.recallAtK) }}</td>
                        <td>{{ formatLatency(result.latencyMs) }}</td>
                        <td>{{ docNames(result.retrievedDocIds) || '—' }}</td>
                      </tr>
                      <tr v-if="!results.length">
                        <td colspan="6" class="empty-row">当前运行尚无逐题结果</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-window-item>
            </v-window>
          </template>
        </main>
      </div>
    </template>

    <v-dialog v-model="setEditor.visible" max-width="620" persistent>
      <v-card>
        <v-card-title>{{ setEditor.mode === 'create' ? '新建评测集' : '编辑评测集' }}</v-card-title>
        <v-card-text class="dialog-fields">
          <v-text-field v-model="setEditor.form.name" label="评测集名称" variant="outlined" />
          <v-textarea v-model="setEditor.form.description" label="说明" rows="3" variant="outlined" />
          <v-select v-model="setEditor.form.status" :items="statusItems" item-title="title" item-value="value" label="状态" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="setEditor.visible = false">取消</v-btn>
          <v-btn color="cyan-darken-2" :loading="savingSet" @click="saveSet">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="caseEditor.visible" max-width="820" persistent>
      <v-card>
        <v-card-title>{{ caseEditor.mode === 'create' ? '新增标准问题' : '编辑标准问题' }}</v-card-title>
        <v-card-text class="dialog-fields">
          <v-textarea v-model="caseEditor.form.question" label="业务问题" rows="3" variant="outlined" />
          <v-select
            v-model="caseEditor.form.expectedDocIds"
            :items="docItems"
            item-title="title"
            item-value="value"
            label="期望文档（可多选）"
            multiple
            chips
            closable-chips
            variant="outlined"
          />
          <v-textarea
            v-model="caseEditor.form.expectedChunkIdsText"
            label="期望Chunk ID（可选，逗号或换行分隔）"
            rows="3"
            variant="outlined"
            hint="填写Chunk后，评测会优先按Chunk精确命中计算。"
            persistent-hint
          />
          <div class="case-options">
            <v-select v-model="caseEditor.form.topK" :items="topKItems" label="Top-K" variant="outlined" />
            <v-select v-model="caseEditor.form.status" :items="statusItems" item-title="title" item-value="value" label="状态" variant="outlined" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="caseEditor.visible = false">取消</v-btn>
          <v-btn color="cyan-darken-2" :loading="savingCase" @click="saveCase">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2600">{{ snackbar.text }}</v-snackbar>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { listKnowledgeDocs } from '@/api/ai'
import {
  createRagEvaluationCase,
  createRagEvaluationRun,
  createRagEvaluationSet,
  deleteRagEvaluationCase,
  deleteRagEvaluationSet,
  getRagEvaluationConfig,
  listRagEvaluationCases,
  listRagEvaluationResults,
  listRagEvaluationRuns,
  listRagEvaluationSets,
  retryRagEvaluationRun,
  updateRagEvaluationCase,
  updateRagEvaluationSet,
} from '@/api/knowledgeEvaluation'

const props = defineProps({
  kbId: { type: String, required: true },
  kbName: { type: String, default: '' },
})

const config = reactive({ enabled: false, maxCasesPerSet: 100, migration: '' })
const sets = ref([])
const cases = ref([])
const runs = ref([])
const results = ref([])
const docs = ref([])
const selectedSetId = ref('')
const selectedRunId = ref('')
const tab = ref('cases')
const loadingConfig = ref(false)
const loadingSets = ref(false)
const loadingResults = ref(false)
const savingSet = ref(false)
const savingCase = ref(false)
const startingRun = ref(false)
const setEditor = reactive({ visible: false, mode: 'create', form: emptySetForm() })
const caseEditor = reactive({ visible: false, mode: 'create', caseId: '', form: emptyCaseForm() })
const snackbar = reactive({ show: false, text: '', color: 'success' })
let pollTimer = null

const selectedSet = computed(() => sets.value.find(item => item.setId === selectedSetId.value) || null)
const selectedRun = computed(() => runs.value.find(item => item.runId === selectedRunId.value) || null)
const activeRun = computed(() => runs.value.find(item => ['PENDING', 'RUNNING'].includes(item.status)) || null)
const latestCompletedRun = computed(() => runs.value.find(item => ['SUCCEEDED', 'PARTIAL'].includes(item.status)) || null)
const statusItems = [
  { title: '启用', value: 'ACTIVE' },
  { title: '停用', value: 'DISABLED' },
]
const topKItems = [1, 3, 5, 8, 10, 15, 20]
const docItems = computed(() => docs.value.map(item => ({ title: `${item.title} · ${item.docId}`, value: item.docId })))

watch(() => props.kbId, async () => {
  selectedSetId.value = ''
  selectedRunId.value = ''
  sets.value = []
  cases.value = []
  runs.value = []
  results.value = []
  await refreshAll()
}, { immediate: true })

watch(selectedSetId, async value => {
  selectedRunId.value = ''
  cases.value = []
  runs.value = []
  results.value = []
  if (value) await loadSetDetails()
})

watch(selectedRunId, async value => {
  results.value = []
  if (value) await loadResults()
})

onMounted(() => {
  pollTimer = window.setInterval(async () => {
    if (selectedSetId.value && activeRun.value) await loadRuns(false)
  }, 3000)
})

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})

function emptySetForm() {
  return { name: '', description: '', status: 'ACTIVE' }
}

function emptyCaseForm() {
  return { question: '', expectedDocIds: [], expectedChunkIdsText: '', topK: 5, status: 'ACTIVE' }
}

async function refreshAll() {
  await loadConfig()
  if (!config.enabled) return
  await Promise.all([loadSets(), loadDocs()])
}

async function loadConfig() {
  loadingConfig.value = true
  try {
    const response = await getRagEvaluationConfig()
    Object.assign(config, response?.data || {})
  } catch (error) {
    Object.assign(config, { enabled: false, migration: 'sql/bizfi_ai_rag_evaluation_v7.sql' })
    showMessage('评测配置加载失败', 'error')
  } finally {
    loadingConfig.value = false
  }
}

async function loadSets() {
  loadingSets.value = true
  try {
    const response = await listRagEvaluationSets(props.kbId)
    sets.value = response?.data || []
    if (!sets.value.some(item => item.setId === selectedSetId.value)) {
      selectedSetId.value = sets.value[0]?.setId || ''
    }
  } catch (error) {
    sets.value = []
    showApiError(error, '评测集加载失败')
  } finally {
    loadingSets.value = false
  }
}

async function loadDocs() {
  try {
    const response = await listKnowledgeDocs({ kbId: props.kbId, page: 1, size: 100, status: 'ACTIVE' })
    docs.value = response?.data?.records || []
  } catch (error) {
    docs.value = []
  }
}

async function loadSetDetails() {
  await Promise.all([loadCases(), loadRuns(true)])
}

async function loadCases() {
  if (!selectedSetId.value) return
  try {
    const response = await listRagEvaluationCases(selectedSetId.value)
    cases.value = response?.data || []
  } catch (error) {
    cases.value = []
    showApiError(error, '标准问题加载失败')
  }
}

async function loadRuns(selectLatest = false) {
  if (!selectedSetId.value) return
  try {
    const response = await listRagEvaluationRuns(selectedSetId.value, 50)
    runs.value = response?.data || []
    if (selectLatest || !runs.value.some(item => item.runId === selectedRunId.value)) {
      selectedRunId.value = runs.value[0]?.runId || ''
    } else if (selectedRunId.value) {
      const current = runs.value.find(item => item.runId === selectedRunId.value)
      if (current && ['RUNNING', 'PENDING'].includes(current.status)) await loadResults()
    }
  } catch (error) {
    runs.value = []
    showApiError(error, '运行历史加载失败')
  }
}

async function loadResults() {
  if (!selectedRunId.value) return
  loadingResults.value = true
  try {
    const response = await listRagEvaluationResults(selectedRunId.value)
    results.value = response?.data || []
  } catch (error) {
    results.value = []
    showApiError(error, '逐题结果加载失败')
  } finally {
    loadingResults.value = false
  }
}

function openSetCreate() {
  setEditor.mode = 'create'
  setEditor.form = emptySetForm()
  setEditor.visible = true
}

function openSetEdit() {
  if (!selectedSet.value) return
  setEditor.mode = 'edit'
  setEditor.form = {
    name: selectedSet.value.name,
    description: selectedSet.value.description || '',
    status: selectedSet.value.status,
  }
  setEditor.visible = true
}

async function saveSet() {
  if (!setEditor.form.name.trim()) return showMessage('评测集名称不能为空', 'warning')
  savingSet.value = true
  try {
    const response = setEditor.mode === 'create'
      ? await createRagEvaluationSet(props.kbId, { ...setEditor.form })
      : await updateRagEvaluationSet(selectedSetId.value, { ...setEditor.form })
    setEditor.visible = false
    await loadSets()
    if (response?.data?.setId) selectedSetId.value = response.data.setId
    showMessage('评测集已保存')
  } catch (error) {
    showApiError(error, '评测集保存失败')
  } finally {
    savingSet.value = false
  }
}

async function removeSet() {
  if (!selectedSet.value || !window.confirm(`确认删除评测集“${selectedSet.value.name}”及其运行记录？`)) return
  try {
    await deleteRagEvaluationSet(selectedSet.value.setId)
    selectedSetId.value = ''
    await loadSets()
    showMessage('评测集已删除')
  } catch (error) {
    showApiError(error, '评测集删除失败')
  }
}

function openCaseCreate() {
  caseEditor.mode = 'create'
  caseEditor.caseId = ''
  caseEditor.form = emptyCaseForm()
  caseEditor.visible = true
}

function openCaseEdit(item) {
  caseEditor.mode = 'edit'
  caseEditor.caseId = item.caseId
  caseEditor.form = {
    question: item.question,
    expectedDocIds: [...(item.expectedDocIds || [])],
    expectedChunkIdsText: (item.expectedChunkIds || []).join('\n'),
    topK: item.topK,
    status: item.status,
  }
  caseEditor.visible = true
}

async function saveCase() {
  const expectedChunkIds = splitIds(caseEditor.form.expectedChunkIdsText)
  if (!caseEditor.form.question.trim()) return showMessage('业务问题不能为空', 'warning')
  if (!caseEditor.form.expectedDocIds.length && !expectedChunkIds.length) {
    return showMessage('至少选择一个期望文档或填写一个Chunk ID', 'warning')
  }
  savingCase.value = true
  const payload = {
    question: caseEditor.form.question,
    expectedDocIds: caseEditor.form.expectedDocIds,
    expectedChunkIds,
    topK: caseEditor.form.topK,
    status: caseEditor.form.status,
  }
  try {
    if (caseEditor.mode === 'create') await createRagEvaluationCase(selectedSetId.value, payload)
    else await updateRagEvaluationCase(selectedSetId.value, caseEditor.caseId, payload)
    caseEditor.visible = false
    await Promise.all([loadCases(), loadSets()])
    showMessage('标准问题已保存')
  } catch (error) {
    showApiError(error, '标准问题保存失败')
  } finally {
    savingCase.value = false
  }
}

async function removeCase(item) {
  if (!window.confirm(`确认删除问题“${item.question}”？`)) return
  try {
    await deleteRagEvaluationCase(selectedSetId.value, item.caseId)
    await Promise.all([loadCases(), loadSets()])
    showMessage('标准问题已删除')
  } catch (error) {
    showApiError(error, '标准问题删除失败')
  }
}

async function startRun() {
  startingRun.value = true
  try {
    const response = await createRagEvaluationRun(selectedSetId.value)
    await loadRuns(false)
    selectedRunId.value = response?.data?.runId || runs.value[0]?.runId || ''
    tab.value = 'runs'
    showMessage('评测运行已进入后台队列')
  } catch (error) {
    showApiError(error, '评测运行创建失败')
  } finally {
    startingRun.value = false
  }
}

async function retryRun(run) {
  try {
    await retryRagEvaluationRun(run.runId)
    selectedRunId.value = run.runId
    await loadRuns(false)
    showMessage('评测运行已重新排队')
  } catch (error) {
    showApiError(error, '评测重试失败')
  }
}

function selectRun(run) {
  selectedRunId.value = run.runId
}

function splitIds(value) {
  return [...new Set(String(value || '')
    .split(/[,\n\s]+/)
    .map(item => item.trim())
    .filter(Boolean))]
}

function docNames(ids) {
  return (ids || []).map(id => docs.value.find(item => item.docId === id)?.title || id).join(', ')
}

function formatPercent(value) {
  return value === null || value === undefined ? '—' : `${(Number(value) * 100).toFixed(1)}%`
}

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(3)
}

function formatLatency(value) {
  return value === null || value === undefined ? '—' : `${Math.round(Number(value))} ms`
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function statusColor(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'PARTIAL') return 'warning'
  if (status === 'FAILED') return 'error'
  if (status === 'RUNNING') return 'cyan'
  return 'grey'
}

function showApiError(error, fallback) {
  showMessage(error?.response?.data?.message || error?.message || fallback, 'error')
}

function showMessage(text, color = 'success') {
  Object.assign(snackbar, { show: true, text, color })
}
</script>

<style scoped>
.evaluation-shell {
  color: #e2e8f0;
}

.rollout-alert code {
  color: #a5f3fc;
}

.evaluation-header,
.set-toolbar,
.section-toolbar,
.result-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.evaluation-header {
  padding: 4px 0 22px;
}

.evaluation-header span,
.panel-caption span,
.set-toolbar span,
.section-toolbar span,
.result-heading span {
  display: block;
  color: rgba(203, 213, 225, 0.58);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.evaluation-header h2,
.set-toolbar h3 {
  margin: 4px 0;
  color: #f8fafc;
}

.evaluation-header p {
  margin: 0;
  color: rgba(226, 232, 240, 0.65);
}

.header-actions,
.set-toolbar > div:last-child {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  min-height: 660px;
  border: 1px solid rgba(103, 232, 249, 0.16);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.66);
}

.set-panel {
  padding: 20px 14px;
  border-right: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(2, 8, 23, 0.5);
}

.panel-caption {
  padding: 0 10px 14px;
}

.panel-caption strong {
  display: block;
  margin-top: 3px;
}

.set-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 12px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: inherit;
  text-align: left;
  background: rgba(15, 23, 42, 0.46);
  cursor: pointer;
}

.set-item.active {
  border-color: rgba(34, 211, 238, 0.48);
  background: rgba(8, 145, 178, 0.14);
}

.set-item strong,
.set-item small {
  display: block;
}

.set-item small {
  max-width: 150px;
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.52);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.set-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.55);
}

.content-panel {
  min-width: 0;
  padding: 22px;
}

.empty-main {
  min-height: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(226, 232, 240, 0.58);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.metric-card {
  padding: 16px;
  border: 1px solid rgba(103, 232, 249, 0.14);
  border-radius: 14px;
  background: rgba(8, 47, 73, 0.24);
}

.metric-card span,
.metric-card small,
.metric-card strong {
  display: block;
}

.metric-card span,
.metric-card small {
  color: rgba(207, 250, 254, 0.58);
}

.metric-card strong {
  margin: 6px 0 3px;
  font-size: 25px;
  color: #cffafe;
}

.evaluation-tabs {
  margin: 4px 0 12px;
}

.section-toolbar {
  padding: 12px 0;
}

.section-toolbar strong,
.result-heading strong {
  display: block;
}

.data-table {
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.45);
}

.data-table th {
  color: rgba(226, 232, 240, 0.58) !important;
  font-size: 11px !important;
  text-transform: uppercase;
}

.data-table tr.selected {
  background: rgba(8, 145, 178, 0.15);
}

.run-table tbody tr {
  cursor: pointer;
}

.question-cell strong,
.question-cell small,
.expected-cell span {
  display: block;
}

.question-cell small {
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.45);
}

.expected-cell {
  max-width: 300px;
  color: rgba(226, 232, 240, 0.7);
  overflow-wrap: anywhere;
}

.actions-column {
  width: 90px;
  white-space: nowrap;
}

.empty-row,
.empty-small {
  padding: 30px !important;
  text-align: center;
  color: rgba(226, 232, 240, 0.5);
}

.result-section {
  margin-top: 18px;
}

.result-heading {
  margin-bottom: 10px;
}

.run-error {
  margin-bottom: 10px;
}

.error-text {
  color: #fca5a5 !important;
}

.dialog-fields {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 18px !important;
}

.case-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 980px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .set-panel {
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .evaluation-header,
  .set-toolbar,
  .section-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-grid,
  .case-options {
    grid-template-columns: 1fr;
  }
}
</style>
