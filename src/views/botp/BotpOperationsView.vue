<template>
  <div class="ops-page">
    <header class="hero">
      <div>
        <p class="eyebrow">BOTP V3 Operations</p>
        <h1>异常恢复与自动对账</h1>
        <p>处理目标作废反写、WRITEBACK_PENDING、DEAD 任务和数据不一致问题。</p>
      </div>
      <div class="actions">
        <button class="secondary" type="button" @click="router.push('/botp')">返回规则中心</button>
        <button class="primary" type="button" :disabled="loading" @click="refreshAll">刷新全部</button>
      </div>
    </header>

    <div v-if="message" :class="['message', messageType]">{{ message }}</div>

    <section class="stats">
      <article><span>待处理反写</span><strong>{{ pendingTaskCount }}</strong></article>
      <article><span>失败任务</span><strong>{{ failedTaskCount }}</strong></article>
      <article><span>DEAD 任务</span><strong>{{ deadTaskCount }}</strong></article>
      <article><span>开放对账异常</span><strong>{{ openIssueCount }}</strong></article>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>执行恢复</h2>
          <p>resume 仅从已创建目标单之后继续；retry-writeback 不会重新创建目标单。</p>
        </div>
      </div>
      <div class="inline-form">
        <label>执行 ID<input v-model.trim="executionId" placeholder="BOTP-..." /></label>
        <button class="secondary" type="button" @click="loadExecutionLogs">查看阶段日志</button>
        <button class="primary" type="button" @click="resumeExecution">继续执行</button>
        <button class="warning" type="button" @click="retryExecutionWriteback">仅重试反写</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>阶段</th><th>状态</th><th>说明</th><th>异常类型</th><th>时间</th></tr></thead>
          <tbody>
            <tr v-for="item in executionLogs" :key="item.logId">
              <td>{{ item.stage }}</td>
              <td><span :class="['pill', taskStatusClass(item.status)]">{{ item.status }}</span></td>
              <td>{{ item.message || '—' }}</td>
              <td>{{ item.exceptionType || '—' }}</td>
              <td>{{ formatTime(item.finishTime || item.startTime) }}</td>
            </tr>
            <tr v-if="!executionLogs.length"><td colspan="5" class="empty">输入执行 ID 查看阶段日志</td></tr>
          </tbody>
        </table>
      </div>
      <pre v-if="executionResult" class="result">{{ executionResult }}</pre>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <h2>关系反转与重算</h2>
          <p>目标状态事件按 eventId 去重；源单金额始终按 ACTIVE 关系求和重算。</p>
        </div>
      </div>
      <div class="form-grid">
        <label>目标单 ID<input v-model.trim="targetEvent.targetDocumentId" placeholder="付款申请 fid" /></label>
        <label>事件 ID<input v-model.trim="targetEvent.eventId" placeholder="留空自动生成" /></label>
        <label>目标状态
          <select v-model="targetEvent.targetStatus">
            <option>VOID</option><option>CANCELLED</option><option>DELETED</option><option>REJECTED</option>
          </select>
        </label>
        <label>原因<input v-model.trim="targetEvent.reason" placeholder="付款申请作废" /></label>
        <label>关系 ID<input v-model.trim="relationId" placeholder="人工失效/重算使用" /></label>
        <label>操作人<input v-model.trim="operator" placeholder="admin" /></label>
      </div>
      <div class="actions left">
        <button class="warning" type="button" @click="sendTargetEvent">发送目标状态事件</button>
        <button class="danger" type="button" @click="invalidateRelation">人工失效关系</button>
        <button class="secondary" type="button" @click="recomputeRelation">重新计算反写</button>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div><h2>反写任务中心</h2><p>自动重试使用指数退避；超过五次进入 DEAD，由人工重新打开。</p></div>
        <button class="secondary" type="button" @click="loadWritebackTasks">刷新任务</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>任务</th><th>类型</th><th>执行 / 关系</th><th>源单 → 目标单</th><th>金额</th><th>状态</th><th>重试</th><th>下次执行</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in writebackTasks" :key="item.taskId">
              <td>#{{ item.taskId }}</td>
              <td>{{ item.taskType }}</td>
              <td>{{ item.executionId }}<small>关系 {{ item.relationId || '—' }}</small></td>
              <td>{{ documentId(item.sourceDocument) }} → {{ documentId(item.targetDocument) }}</td>
              <td>{{ formatAmount(item.activeAllocatedAmount) }}</td>
              <td><span :class="['pill', taskStatusClass(item.status)]">{{ item.status }}</span></td>
              <td>{{ item.retryCount }}</td>
              <td>{{ formatTime(item.nextRetryTime) }}</td>
              <td><button class="link" type="button" :disabled="item.status === 'SUCCEEDED'" @click="retryTask(item.taskId)">立即重试</button></td>
            </tr>
            <tr v-if="!writebackTasks.length"><td colspan="9" class="empty">暂无反写任务</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div><h2>自动对账异常</h2><p>检查源单已申请金额与关系台账，以及目标已作废但关系仍有效。</p></div>
        <div class="actions">
          <label class="checkbox"><input v-model="autoFix" type="checkbox" /> 自动修复</label>
          <button class="primary" type="button" @click="runReconciliation">立即对账</button>
          <button class="secondary" type="button" @click="loadIssues">刷新异常</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>异常</th><th>类型</th><th>源单 → 目标单</th><th>期望 / 实际</th><th>状态</th><th>说明</th><th>发现时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in issues" :key="item.issueId">
              <td>#{{ item.issueId }}</td>
              <td>{{ item.issueType }}</td>
              <td>{{ documentId(item.sourceDocument) }} → {{ documentId(item.targetDocument) }}</td>
              <td>{{ formatAmount(item.expectedAmount) }} / {{ formatAmount(item.actualAmount) }}</td>
              <td><span :class="['pill', issueStatusClass(item.status)]">{{ item.status }}</span></td>
              <td>{{ item.description }}<small v-if="item.resolution">{{ item.resolution }}</small></td>
              <td>{{ formatTime(item.detectedTime) }}</td>
              <td>
                <button class="link" type="button" :disabled="item.status !== 'OPEN'" @click="fixIssue(item.issueId)">修复</button>
                <button class="link muted-link" type="button" :disabled="item.status !== 'OPEN'" @click="ignoreIssue(item.issueId)">忽略</button>
              </td>
            </tr>
            <tr v-if="!issues.length"><td colspan="8" class="empty">暂无对账异常</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fixBotpReconciliationIssue,
  getBotpExecutionLogs,
  getBotpReconciliationIssues,
  getBotpWritebackTasks,
  ignoreBotpReconciliationIssue,
  invalidateBotpRelation,
  postBotpTargetStatusEvent,
  recomputeBotpRelation,
  resumeBotpExecution,
  retryBotpExecutionWriteback,
  retryBotpWritebackTask,
  runBotpReconciliation,
} from '@/api/botp'

const router = useRouter()
const loading = ref(false)
const message = ref('')
const messageType = ref('success')
const executionId = ref('')
const relationId = ref('')
const operator = ref('admin')
const executionLogs = ref([])
const executionResult = ref('')
const writebackTasks = ref([])
const issues = ref([])
const autoFix = ref(true)
const targetEvent = reactive({ eventId: '', targetDocumentId: '', targetStatus: 'VOID', reason: '付款申请作废' })

const pendingTaskCount = computed(() => writebackTasks.value.filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING').length)
const failedTaskCount = computed(() => writebackTasks.value.filter((item) => item.status === 'FAILED').length)
const deadTaskCount = computed(() => writebackTasks.value.filter((item) => item.status === 'DEAD').length)
const openIssueCount = computed(() => issues.value.filter((item) => item.status === 'OPEN').length)

onMounted(refreshAll)

async function refreshAll() {
  loading.value = true
  try {
    await Promise.all([loadWritebackTasks(), loadIssues()])
  } finally {
    loading.value = false
  }
}

async function loadExecutionLogs() {
  if (!executionId.value) return show('请输入执行 ID', 'error')
  await call(async () => {
    const response = await getBotpExecutionLogs(executionId.value)
    executionLogs.value = response.data || []
    executionResult.value = ''
  }, '阶段日志已加载')
}

async function resumeExecution() {
  if (!executionId.value) return show('请输入执行 ID', 'error')
  await call(async () => {
    const response = await resumeBotpExecution(executionId.value)
    executionResult.value = JSON.stringify(response.data, null, 2)
    await loadExecutionLogs()
    await loadWritebackTasks()
  }, '执行恢复完成')
}

async function retryExecutionWriteback() {
  if (!executionId.value) return show('请输入执行 ID', 'error')
  await call(async () => {
    const response = await retryBotpExecutionWriteback(executionId.value)
    executionResult.value = JSON.stringify(response.data, null, 2)
    await loadExecutionLogs()
    await loadWritebackTasks()
  }, '反写重试完成')
}

async function sendTargetEvent() {
  if (!targetEvent.targetDocumentId) return show('请输入目标单 ID', 'error')
  await call(async () => {
    const response = await postBotpTargetStatusEvent({
      eventId: targetEvent.eventId || `WEB-${targetEvent.targetStatus}-${targetEvent.targetDocumentId}-${Date.now()}`,
      tenantId: 'default',
      targetSystemCode: 'MATRIX',
      targetDocumentType: 'FI_PAYMENT_APPLICATION',
      targetDocumentId: targetEvent.targetDocumentId,
      targetStatus: targetEvent.targetStatus,
      reason: targetEvent.reason,
      operator: operator.value,
    })
    executionResult.value = JSON.stringify(response.data, null, 2)
    await refreshAll()
  }, '目标状态事件已处理')
}

async function invalidateRelation() {
  if (!relationId.value) return show('请输入关系 ID', 'error')
  await call(async () => {
    await invalidateBotpRelation(relationId.value, {
      eventId: `MANUAL-INVALID-${relationId.value}-${Date.now()}`,
      reason: targetEvent.reason || '人工失效',
      operator: operator.value,
    })
    await refreshAll()
  }, '关系已失效并触发反向重算')
}

async function recomputeRelation() {
  if (!relationId.value) return show('请输入关系 ID', 'error')
  await call(async () => {
    await recomputeBotpRelation(relationId.value)
    await refreshAll()
  }, '重新计算任务已执行')
}

async function loadWritebackTasks() {
  const response = await getBotpWritebackTasks(200)
  writebackTasks.value = response.data || []
}

async function retryTask(taskId) {
  await call(async () => {
    await retryBotpWritebackTask(taskId)
    await loadWritebackTasks()
  }, '任务重试完成')
}

async function loadIssues() {
  const response = await getBotpReconciliationIssues(200)
  issues.value = response.data || []
}

async function runReconciliation() {
  await call(async () => {
    await runBotpReconciliation(500, autoFix.value)
    await Promise.all([loadIssues(), loadWritebackTasks()])
  }, '对账扫描完成')
}

async function fixIssue(issueId) {
  await call(async () => {
    await fixBotpReconciliationIssue(issueId, { resolution: '前端人工修复', operator: operator.value })
    await Promise.all([loadIssues(), loadWritebackTasks()])
  }, '异常已修复')
}

async function ignoreIssue(issueId) {
  await call(async () => {
    await ignoreBotpReconciliationIssue(issueId, { resolution: '人工确认忽略', operator: operator.value })
    await loadIssues()
  }, '异常已忽略')
}

async function call(action, successText) {
  loading.value = true
  try {
    await action()
    show(successText)
  } catch (error) {
    show(error?.response?.data?.message || error?.message || '操作失败', 'error')
  } finally {
    loading.value = false
  }
}

function show(text, type = 'success') {
  message.value = text
  messageType.value = type
}

function taskStatusClass(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'DEAD') return 'danger-pill'
  if (status === 'FAILED') return 'warning-pill'
  return 'processing'
}

function issueStatusClass(status) {
  if (status === 'FIXED') return 'success'
  if (status === 'IGNORED') return 'muted'
  return 'warning-pill'
}

function documentId(document) {
  return document?.documentId || '—'
}

function formatAmount(value) {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value
}

function formatTime(value) {
  if (!value) return '—'
  return String(value).replace('T', ' ').slice(0, 19)
}
</script>

<style scoped>
.ops-page { min-height: 100vh; padding: 28px; background: #f4f6fb; color: #172033; }
.hero, .section-head, .actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.hero { margin-bottom: 18px; }
.eyebrow { margin: 0 0 6px; color: #65708a; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
h1, h2 { margin: 0; }
.hero p, .section-head p { margin: 7px 0 0; color: #6d7890; }
.message { margin-bottom: 16px; padding: 12px 16px; border-radius: 10px; }
.message.success { color: #116541; background: #e8f7ef; }
.message.error { color: #a52f3b; background: #fdebee; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
.stats article, .panel { background: #fff; border: 1px solid #e2e7f0; border-radius: 16px; box-shadow: 0 10px 30px rgba(36, 54, 90, .06); }
.stats article { padding: 18px; display: grid; gap: 8px; }
.stats span { color: #6d7890; font-size: 13px; }
.stats strong { font-size: 28px; }
.panel { padding: 22px; margin-bottom: 18px; }
.inline-form, .form-grid { display: grid; gap: 12px; margin-top: 16px; align-items: end; }
.inline-form { grid-template-columns: minmax(260px, 1fr) auto auto auto; }
.form-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
label { display: grid; gap: 7px; color: #4d5871; font-size: 13px; }
input, select { min-height: 38px; box-sizing: border-box; border: 1px solid #d9deea; border-radius: 9px; padding: 8px 10px; background: #fff; }
button { border: 0; border-radius: 9px; padding: 9px 14px; font-weight: 650; cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
.primary { color: #fff; background: #5163df; }
.secondary { color: #34405a; background: #eef1f7; }
.warning { color: #8a5400; background: #fff0cf; }
.danger { color: #a52f3b; background: #fdebee; }
.left { justify-content: flex-start; margin-top: 14px; }
.table-wrap { overflow-x: auto; margin-top: 16px; border: 1px solid #e7eaf1; border-radius: 12px; }
table { width: 100%; border-collapse: collapse; min-width: 980px; }
th, td { padding: 10px; border-bottom: 1px solid #edf0f5; text-align: left; font-size: 12px; vertical-align: top; }
th { color: #65708a; background: #f8f9fc; }
td small { display: block; margin-top: 4px; color: #8790a4; }
.empty { padding: 24px; text-align: center; color: #929aab; }
.pill { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 11px; }
.pill.success { color: #087c4c; background: #e5f8ef; }
.pill.processing { color: #4054c7; background: #edf0ff; }
.pill.warning-pill { color: #9b5d00; background: #fff1d5; }
.pill.danger-pill { color: #b22f3e; background: #fde8eb; }
.pill.muted { color: #65708a; background: #edf0f5; }
.link { padding: 3px 5px; color: #5163df; background: transparent; }
.muted-link { color: #778198; }
.result { max-height: 320px; overflow: auto; margin-top: 14px; padding: 14px; border-radius: 10px; background: #101726; color: #dce6ff; font-size: 12px; }
.checkbox { display: flex; grid-auto-flow: column; align-items: center; gap: 6px; }
.checkbox input { min-height: auto; }
@media (max-width: 980px) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .inline-form, .form-grid { grid-template-columns: 1fr; }
  .hero, .section-head { align-items: flex-start; flex-direction: column; }
}
</style>
