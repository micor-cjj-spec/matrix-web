<template>
  <main class="trace-page">
    <section class="hero">
      <div>
        <span class="eyebrow">Retrieval Trace</span>
        <h1>知识检索链路诊断</h1>
        <p>查看关键词候选、语义候选、RRF 融合分值、向量后端、Embedding 模型和降级原因。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-chart-box-outline" @click="router.push('/ai/knowledge/evaluations')">
          返回评测工作台
        </v-btn>
        <v-btn variant="text" prepend-icon="mdi-database-outline" @click="router.push('/ai/knowledge')">
          知识系统
        </v-btn>
      </div>
    </section>

    <section class="control-grid">
      <article class="panel">
        <div class="panel-title">
          <div>
            <span>New Trace Run</span>
            <strong>发起带 Trace 的评测</strong>
          </div>
        </div>
        <div class="form-grid">
          <v-select
            v-model="selectedDatasetId"
            :items="datasetItems"
            item-title="title"
            item-value="value"
            label="评测集"
            variant="outlined"
            density="comfortable"
            :loading="datasetsLoading"
          />
          <v-select
            v-model="topK"
            :items="[3, 5, 10, 20]"
            label="Top K"
            variant="outlined"
            density="comfortable"
          />
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-play-circle-outline"
          :loading="running"
          :disabled="!selectedDatasetId"
          @click="executeTraceRun"
        >
          运行并保存 Trace
        </v-btn>
      </article>

      <article class="panel">
        <div class="panel-title">
          <div>
            <span>Open Existing Run</span>
            <strong>按运行编号诊断</strong>
          </div>
        </div>
        <v-text-field
          v-model="runIdInput"
          label="评测运行编号"
          placeholder="eval_run_..."
          variant="outlined"
          density="comfortable"
          clearable
          @keydown.enter="loadTraceRun"
        />
        <v-btn
          variant="tonal"
          prepend-icon="mdi-magnify"
          :loading="loading"
          :disabled="!runIdInput.trim()"
          @click="loadTraceRun"
        >
          加载诊断数据
        </v-btn>
      </article>
    </section>

    <v-alert v-if="notice" :type="noticeType" variant="tonal" class="notice">
      {{ notice }}
    </v-alert>

    <template v-if="run">
      <section class="metric-grid">
        <article class="metric-card">
          <span>运行状态</span>
          <strong>{{ statusText(run.status) }}</strong>
          <small>{{ run.runId }}</small>
        </article>
        <article class="metric-card">
          <span>Recall@{{ run.topK }}</span>
          <strong>{{ percent(run.recallAtK) }}</strong>
          <small>标准知识召回比例</small>
        </article>
        <article class="metric-card">
          <span>MRR</span>
          <strong>{{ decimal(run.mrr) }}</strong>
          <small>首个正确结果排名</small>
        </article>
        <article class="metric-card">
          <span>零命中率</span>
          <strong>{{ percent(run.zeroHitRate) }}</strong>
          <small>{{ run.completedQuestions || 0 }}/{{ run.totalQuestions || 0 }} 已完成</small>
        </article>
        <article class="metric-card">
          <span>平均延迟</span>
          <strong>{{ run.averageLatencyMs || 0 }} ms</strong>
          <small>包含候选召回与融合</small>
        </article>
        <article class="metric-card">
          <span>Trace 数量</span>
          <strong>{{ traces.length }}</strong>
          <small>逐题不可变诊断快照</small>
        </article>
      </section>

      <section class="panel trace-list-panel">
        <div class="panel-title list-title">
          <div>
            <span>Question Traces</span>
            <strong>逐题检索链路</strong>
          </div>
          <v-chip size="small" variant="tonal">{{ traces.length }} 条</v-chip>
        </div>

        <div v-if="loading" class="empty-state">正在读取 Trace…</div>
        <div v-else-if="!traceRows.length" class="empty-state">
          当前运行没有 Trace。旧评测运行不会自动补录，请重新执行一次评测。
        </div>

        <v-expansion-panels v-else multiple variant="accordion">
          <v-expansion-panel v-for="item in traceRows" :key="item.traceId">
            <v-expansion-panel-title>
              <div class="trace-summary">
                <div>
                  <strong>{{ item.questionText }}</strong>
                  <small>{{ item.questionId }}</small>
                </div>
                <div class="trace-badges">
                  <v-chip size="x-small" :color="modeColor(item.mode)" variant="tonal">
                    {{ item.mode }}
                  </v-chip>
                  <v-chip size="x-small" variant="outlined">
                    {{ item.configFingerprint }}
                  </v-chip>
                  <v-chip v-if="item.trace?.fallbackUsed" size="x-small" color="warning" variant="tonal">
                    已降级
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="trace-meta-grid">
                <div><span>配置向量库</span><strong>{{ item.trace?.configuredVectorStore || '-' }}</strong></div>
                <div><span>实际语义后端</span><strong>{{ item.trace?.actualSemanticBackend || '-' }}</strong></div>
                <div><span>Embedding 模型</span><strong>{{ item.trace?.embeddingModel || '-' }}</strong></div>
                <div><span>候选数量</span><strong>{{ candidateCount(item.trace) }}</strong></div>
                <div><span>关键词权重</span><strong>{{ decimal(item.trace?.keywordWeight) }}</strong></div>
                <div><span>语义权重</span><strong>{{ decimal(item.trace?.semanticWeight) }}</strong></div>
                <div><span>RRF K</span><strong>{{ item.trace?.rrfK ?? '-' }}</strong></div>
                <div><span>候选 Top K</span><strong>{{ item.trace?.candidateTopK ?? '-' }}</strong></div>
              </div>

              <v-alert
                v-if="item.trace?.fallbackReason"
                type="warning"
                density="compact"
                variant="tonal"
                class="fallback-alert"
              >
                {{ item.trace.fallbackReason }}
              </v-alert>

              <div class="candidate-section">
                <h3>关键词候选</h3>
                <CandidateTable :items="item.trace?.keywordCandidates || []" />
              </div>
              <div class="candidate-section">
                <h3>语义候选</h3>
                <CandidateTable :items="item.trace?.semanticCandidates || []" />
              </div>
              <div class="candidate-section">
                <h3>RRF 融合结果</h3>
                <CandidateTable :items="item.trace?.fusedCandidates || []" />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getKnowledgeEvaluationRun,
  listEvaluationDatasets,
  listEvaluationQuestions,
  listKnowledgeEvaluationTraces,
  runKnowledgeEvaluation,
} from '@/api/knowledgeEvaluation'

const router = useRouter()
const route = useRoute()
const datasets = ref([])
const questions = ref([])
const traces = ref([])
const run = ref(null)
const selectedDatasetId = ref('')
const topK = ref(5)
const runIdInput = ref(typeof route.query.runId === 'string' ? route.query.runId : '')
const datasetsLoading = ref(false)
const running = ref(false)
const loading = ref(false)
const notice = ref('')
const noticeType = ref('info')

const datasetItems = computed(() => datasets.value
  .filter(item => item.status === 'ACTIVE')
  .map(item => ({ title: item.name, value: item.datasetId })))

const questionMap = computed(() => new Map(
  questions.value.map(item => [item.questionId, item]),
))

const traceRows = computed(() => traces.value.map(item => ({
  ...item,
  questionText: questionMap.value.get(item.questionId)?.question || item.questionId,
})))

const CandidateTable = defineComponent({
  name: 'CandidateTable',
  props: {
    items: { type: Array, default: () => [] },
  },
  setup(props) {
    return () => {
      if (!props.items.length) {
        return h('div', { class: 'candidate-empty' }, '暂无候选')
      }
      return h('div', { class: 'candidate-table-wrap' }, [
        h('table', { class: 'candidate-table' }, [
          h('thead', [h('tr', [
            h('th', '排名'),
            h('th', '文档 / 分片'),
            h('th', 'RRF 贡献'),
            h('th', '融合分值'),
            h('th', '最终入选'),
          ])]),
          h('tbody', props.items.map(item => h('tr', { key: `${item.source}-${item.rank}-${item.chunkId || item.docId}` }, [
            h('td', `#${item.rank ?? '-'}`),
            h('td', [
              h('strong', item.docName || item.docId || '-'),
              h('small', item.chunkId || item.docId || '-'),
              h('p', item.snippet || ''),
            ]),
            h('td', item.rrfContribution == null ? '-' : Number(item.rrfContribution).toFixed(6)),
            h('td', item.fusedScore == null ? '-' : Number(item.fusedScore).toFixed(6)),
            h('td', item.selected ? '是' : '否'),
          ]))),
        ]),
      ])
    }
  },
})

async function loadDatasets() {
  datasetsLoading.value = true
  try {
    const response = await listEvaluationDatasets()
    datasets.value = response?.data || []
    if (!selectedDatasetId.value) selectedDatasetId.value = datasetItems.value[0]?.value || ''
  } catch (error) {
    showNotice(errorMessage(error, '评测集加载失败'), 'error')
  } finally {
    datasetsLoading.value = false
  }
}

async function executeTraceRun() {
  if (!selectedDatasetId.value) return
  running.value = true
  try {
    const response = await runKnowledgeEvaluation(selectedDatasetId.value, topK.value)
    const created = response?.data
    if (!created?.runId) throw new Error('后端未返回运行编号')
    runIdInput.value = created.runId
    await router.replace({ query: { runId: created.runId } })
    await loadTraceRun()
    showNotice('Trace 评测完成，已保存逐题候选和配置快照。', 'success')
  } catch (error) {
    showNotice(errorMessage(error, 'Trace 评测执行失败'), 'error')
  } finally {
    running.value = false
  }
}

async function loadTraceRun() {
  const runId = runIdInput.value.trim()
  if (!runId) return
  loading.value = true
  try {
    const runResponse = await getKnowledgeEvaluationRun(runId)
    run.value = runResponse?.data || null
    if (!run.value?.datasetId) throw new Error('运行记录缺少评测集编号')

    const [traceResponse, questionResponse] = await Promise.all([
      listKnowledgeEvaluationTraces(runId),
      listEvaluationQuestions(run.value.datasetId),
    ])
    traces.value = traceResponse?.data || []
    questions.value = questionResponse?.data || []
    selectedDatasetId.value = run.value.datasetId
    await router.replace({ query: { runId } })
    if (!traces.value.length) showNotice('该运行没有 Trace，请使用新版评测入口重新执行。', 'warning')
    else showNotice(`已加载 ${traces.value.length} 条检索 Trace。`, 'success')
  } catch (error) {
    run.value = null
    traces.value = []
    questions.value = []
    showNotice(errorMessage(error, 'Trace 加载失败'), 'error')
  } finally {
    loading.value = false
  }
}

function candidateCount(trace) {
  return (trace?.keywordCandidates?.length || 0)
    + (trace?.semanticCandidates?.length || 0)
    + (trace?.fusedCandidates?.length || 0)
}

function statusText(status) {
  return {
    RUNNING: '运行中',
    SUCCEEDED: '成功',
    PARTIAL: '部分失败',
    FAILED: '失败',
  }[status] || status || '-'
}

function modeColor(mode) {
  return {
    HYBRID_RRF: 'success',
    KEYWORD_ONLY: 'info',
    KEYWORD_FALLBACK: 'warning',
    UNAVAILABLE: 'error',
  }[mode] || 'grey'
}

function percent(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return `${(Number(value) * 100).toFixed(1)}%`
}

function decimal(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toFixed(4)
}

function showNotice(text, type = 'info') {
  notice.value = text
  noticeType.value = type
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback
}

onMounted(async () => {
  await loadDatasets()
  if (runIdInput.value.trim()) await loadTraceRun()
})
</script>

<style scoped>
.trace-page {
  min-height: 100vh;
  padding: 30px;
  background: #f3f6fb;
  color: #172033;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(135deg, #14213d 0%, #214b76 58%, #287f8f 100%);
  color: white;
  box-shadow: 0 20px 45px rgba(20, 33, 61, 0.18);
}

.eyebrow,
.panel-title span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.72;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: 34px;
}

.hero p {
  max-width: 780px;
  margin: 0;
  opacity: 0.82;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.panel,
.metric-card {
  border: 1px solid rgba(111, 127, 151, 0.16);
  border-radius: 18px;
  background: white;
  box-shadow: 0 10px 30px rgba(41, 61, 89, 0.07);
}

.panel {
  padding: 22px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-title strong {
  display: block;
  font-size: 19px;
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 12px;
}

.notice {
  margin-bottom: 18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.metric-card {
  padding: 18px;
}

.metric-card span,
.metric-card small {
  display: block;
  color: #72809a;
}

.metric-card strong {
  display: block;
  margin: 8px 0;
  font-size: 22px;
}

.trace-list-panel {
  padding-bottom: 30px;
}

.list-title {
  margin-bottom: 14px;
}

.empty-state {
  padding: 50px 20px;
  color: #758299;
  text-align: center;
}

.trace-summary {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 12px;
}

.trace-summary strong,
.trace-summary small {
  display: block;
}

.trace-summary small {
  margin-top: 4px;
  color: #7c899e;
}

.trace-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.trace-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.trace-meta-grid div {
  padding: 12px;
  border-radius: 12px;
  background: #f6f8fc;
}

.trace-meta-grid span,
.trace-meta-grid strong {
  display: block;
}

.trace-meta-grid span {
  margin-bottom: 5px;
  color: #7b8799;
  font-size: 12px;
}

.fallback-alert {
  margin-bottom: 16px;
}

.candidate-section {
  margin-top: 20px;
}

.candidate-section h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

:deep(.candidate-table-wrap) {
  overflow-x: auto;
  border: 1px solid #e5eaf1;
  border-radius: 12px;
}

:deep(.candidate-table) {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
}

:deep(.candidate-table th),
:deep(.candidate-table td) {
  padding: 11px 12px;
  border-bottom: 1px solid #edf0f5;
  text-align: left;
  vertical-align: top;
}

:deep(.candidate-table th) {
  background: #f6f8fb;
  color: #617087;
  font-size: 12px;
}

:deep(.candidate-table td strong),
:deep(.candidate-table td small) {
  display: block;
}

:deep(.candidate-table td small) {
  margin-top: 3px;
  color: #77859a;
}

:deep(.candidate-table td p) {
  max-width: 520px;
  margin: 7px 0 0;
  color: #4e5d73;
  line-height: 1.5;
}

:deep(.candidate-empty) {
  padding: 24px;
  border: 1px dashed #dce2eb;
  border-radius: 12px;
  color: #8490a2;
  text-align: center;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trace-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .trace-page {
    padding: 14px;
  }

  .hero,
  .trace-summary {
    flex-direction: column;
  }

  .control-grid,
  .form-grid,
  .metric-grid,
  .trace-meta-grid {
    grid-template-columns: 1fr;
  }

  .trace-badges {
    justify-content: flex-start;
  }
}
</style>
