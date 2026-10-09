<template>
  <div class="reliability-page">
    <header class="page-header">
      <div>
        <div class="eyebrow">RELIABILITY & RECONCILIATION</div>
        <h1>开放平台可靠性中心</h1>
        <p>管理结果回调、失败重试、每日对账和异常修复。</p>
      </div>
      <div class="header-actions">
        <el-button @click="router.push('/openapi')">返回开放平台</el-button>
        <el-button :loading="loading" @click="loadAll">刷新</el-button>
        <el-button type="primary" :loading="runningReconcile" @click="runReconcile">立即对账</el-button>
      </div>
    </header>

    <section class="metric-grid">
      <article class="metric-card">
        <span>外部应用</span>
        <strong>{{ apps.length }}</strong>
        <small>启用回调 {{ callbackEnabledApps }}</small>
      </article>
      <article class="metric-card">
        <span>回调任务</span>
        <strong>{{ callbackTotal }}</strong>
        <small>当前筛选结果</small>
      </article>
      <article class="metric-card danger">
        <span>未处理异常</span>
        <strong>{{ reconcileTotal }}</strong>
        <small>默认仅显示 OPEN</small>
      </article>
      <article class="metric-card">
        <span>对账窗口</span>
        <strong>{{ lookbackDays }} 天</strong>
        <small>最长支持 90 天</small>
      </article>
    </section>

    <el-alert
      type="info"
      :closable="false"
      class="mb-16"
      title="回调地址固定在应用上，默认只允许公网 HTTPS；凭证缺失和凭证 ID 冲突不会自动修复。"
    />

    <section class="content-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="回调配置" name="settings">
          <el-table :data="apps" border stripe>
            <el-table-column prop="appName" label="应用名称" min-width="160" />
            <el-table-column prop="appId" label="应用 ID" min-width="180" />
            <el-table-column prop="tenantId" label="租户" width="120" />
            <el-table-column label="回调状态" width="110">
              <template #default="scope">
                <el-tag :type="scope.row.callbackEnabled ? 'success' : 'info'">
                  {{ scope.row.callbackEnabled ? '已启用' : '未启用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="callbackUrl" label="固定回调地址" min-width="320">
              <template #default="scope"><code>{{ scope.row.callbackUrl || '—' }}</code></template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openCallbackSettings(scope.row)">配置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="回调任务" name="callbacks">
          <el-form :inline="true" class="filter-row" @submit.prevent>
            <el-form-item label="事件 ID">
              <el-input v-model="callbackQuery.eventId" clearable placeholder="cb_..." />
            </el-form-item>
            <el-form-item label="Request ID">
              <el-input v-model="callbackQuery.requestId" clearable placeholder="req_..." />
            </el-form-item>
            <el-form-item label="应用">
              <el-select v-model="callbackQuery.appId" clearable filterable placeholder="全部应用">
                <el-option v-for="app in apps" :key="app.id" :label="app.appName" :value="app.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="callbackQuery.status" clearable placeholder="全部状态">
                <el-option v-for="status in callbackStatuses" :key="status" :label="status" :value="status" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchCallbacks">查询</el-button>
              <el-button @click="resetCallbacks">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="callbacks" border stripe v-loading="callbackLoading">
            <el-table-column prop="createdAt" label="创建时间" min-width="165">
              <template #default="scope">{{ formatDate(scope.row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="eventId" label="事件 ID" min-width="240">
              <template #default="scope"><code>{{ scope.row.eventId }}</code></template>
            </el-table-column>
            <el-table-column prop="requestId" label="Request ID" min-width="230" />
            <el-table-column label="应用" min-width="150">
              <template #default="scope">{{ appName(scope.row.appId) }}</template>
            </el-table-column>
            <el-table-column prop="eventType" label="事件类型" min-width="220" />
            <el-table-column label="状态" width="110">
              <template #default="scope">
                <el-tag :type="callbackStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="retryCount" label="重试" width="70" />
            <el-table-column prop="lastHttpStatus" label="HTTP" width="80" />
            <el-table-column prop="errorMessage" label="失败原因" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openCallback(scope.row)">详情</el-button>
                <el-button
                  v-if="['FAILED', 'DEAD'].includes(scope.row.status)"
                  link
                  type="warning"
                  @click="retryCallback(scope.row)"
                >重试</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-row">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="callbackTotal"
              v-model:current-page="callbackQuery.pageNo"
              v-model:page-size="callbackQuery.pageSize"
              :page-sizes="[20, 50, 100]"
              @current-change="loadCallbacks"
              @size-change="searchCallbacks"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="对账异常" name="reconciliation">
          <div class="reconcile-toolbar">
            <el-form :inline="true" class="filter-row" @submit.prevent>
              <el-form-item label="Request ID">
                <el-input v-model="reconcileQuery.requestId" clearable placeholder="req_..." />
              </el-form-item>
              <el-form-item label="异常类型">
                <el-select v-model="reconcileQuery.issueType" clearable filterable placeholder="全部类型">
                  <el-option v-for="type in issueTypes" :key="type" :label="type" :value="type" />
                </el-select>
              </el-form-item>
              <el-form-item label="级别">
                <el-select v-model="reconcileQuery.severity" clearable placeholder="全部级别">
                  <el-option label="WARNING" value="WARNING" />
                  <el-option label="HIGH" value="HIGH" />
                  <el-option label="CRITICAL" value="CRITICAL" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="reconcileQuery.status" clearable placeholder="全部状态">
                  <el-option label="OPEN" value="OPEN" />
                  <el-option label="RESOLVED" value="RESOLVED" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="searchReconciliation">查询</el-button>
                <el-button @click="resetReconciliation">重置</el-button>
              </el-form-item>
            </el-form>
            <div class="lookback-control">
              <span>扫描最近</span>
              <el-input-number v-model="lookbackDays" :min="1" :max="90" controls-position="right" />
              <span>天</span>
            </div>
          </div>

          <el-table :data="reconciliation" border stripe v-loading="reconcileLoading">
            <el-table-column prop="detectedAt" label="发现时间" min-width="165">
              <template #default="scope">{{ formatDate(scope.row.detectedAt) }}</template>
            </el-table-column>
            <el-table-column prop="recordId" label="记录 ID" min-width="230" />
            <el-table-column prop="issueType" label="异常类型" min-width="210" />
            <el-table-column label="级别" width="100">
              <template #default="scope">
                <el-tag :type="severityType(scope.row.severity)">{{ scope.row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="requestId" label="Request ID" min-width="220" />
            <el-table-column prop="expectedStatus" label="期望" min-width="120" />
            <el-table-column prop="actualStatus" label="实际" min-width="120" />
            <el-table-column prop="detailMessage" label="异常说明" min-width="260" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'OPEN' ? 'danger' : 'success'">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="scope">
                <template v-if="scope.row.status === 'OPEN'">
                  <el-button
                    v-if="repairable(scope.row.issueType)"
                    link
                    type="warning"
                    @click="repairRecord(scope.row)"
                  >自动修复</el-button>
                  <el-button link type="primary" @click="openResolve(scope.row)">关闭</el-button>
                </template>
                <el-button v-else link type="primary" @click="openReconcile(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-row">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="reconcileTotal"
              v-model:current-page="reconcileQuery.pageNo"
              v-model:page-size="reconcileQuery.pageSize"
              :page-sizes="[20, 50, 100]"
              @current-change="loadReconciliation"
              @size-change="searchReconciliation"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="settingsDialog" title="配置结果回调" width="680px">
      <el-form label-width="110px">
        <el-form-item label="应用"><el-input :model-value="settingsApp?.appName" readonly /></el-form-item>
        <el-form-item label="启用回调"><el-switch v-model="settingsForm.enabled" /></el-form-item>
        <el-form-item label="回调地址">
          <el-input v-model="settingsForm.callbackUrl" placeholder="https://partner.example.com/matrix/callback" />
        </el-form-item>
      </el-form>
      <el-alert type="warning" :closable="false" title="保存时会解析域名并拒绝本机、内网、保留地址和非 HTTPS 地址。" />
      <template #footer>
        <el-button @click="settingsDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCallbackSettings">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawer" :title="detailTitle" size="560px">
      <el-descriptions v-if="detailRecord" :column="1" border>
        <el-descriptions-item v-for="(value, key) in detailRecord" :key="key" :label="key">
          <pre v-if="key === 'payloadJson'" class="payload">{{ prettyJson(value) }}</pre>
          <span v-else>{{ value ?? '—' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="resolveDialog" title="关闭对账异常" width="620px">
      <el-alert type="warning" :closable="false" title="关闭仅记录人工处理结果，不会修改凭证或写入任务。" class="mb-16" />
      <el-input v-model="resolution" type="textarea" :rows="4" placeholder="填写核查结果和处理说明" />
      <template #footer>
        <el-button @click="resolveDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="resolveRecord">确认关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listOpenApiApps,
  listOpenApiCallbacks,
  listOpenApiReconciliation,
  repairOpenApiReconciliation,
  resolveOpenApiReconciliation,
  retryOpenApiCallback,
  runOpenApiReconciliation,
  updateOpenApiCallbackSettings,
} from '@/api/openapi'

const router = useRouter()
const activeTab = ref('settings')
const loading = ref(false)
const saving = ref(false)
const callbackLoading = ref(false)
const reconcileLoading = ref(false)
const runningReconcile = ref(false)
const apps = ref([])
const callbacks = ref([])
const reconciliation = ref([])
const callbackTotal = ref(0)
const reconcileTotal = ref(0)
const lookbackDays = ref(7)

const settingsDialog = ref(false)
const settingsApp = ref(null)
const settingsForm = reactive({ enabled: false, callbackUrl: '' })
const detailDrawer = ref(false)
const detailTitle = ref('详情')
const detailRecord = ref(null)
const resolveDialog = ref(false)
const resolveTarget = ref(null)
const resolution = ref('')

const callbackQuery = reactive({ pageNo: 1, pageSize: 20, eventId: '', requestId: '', appId: '', status: '' })
const reconcileQuery = reactive({ pageNo: 1, pageSize: 20, requestId: '', issueType: '', severity: '', status: 'OPEN' })
const callbackStatuses = ['PENDING', 'SENDING', 'SUCCEEDED', 'FAILED', 'DEAD', 'SKIPPED']
const issueTypes = ['VOUCHER_MISSING', 'TASK_STATUS_MISMATCH', 'VOUCHER_ID_MISMATCH', 'OUTBOX_STUCK', 'CALLBACK_DEAD', 'FINANCE_LOOKUP_FAILED']
const callbackEnabledApps = computed(() => apps.value.filter((item) => item.callbackEnabled).length)

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    apps.value = unwrap(await listOpenApiApps())
    await Promise.all([loadCallbacks(), loadReconciliation()])
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function handleTabChange(name) {
  if (name === 'callbacks') await loadCallbacks()
  if (name === 'reconciliation') await loadReconciliation()
}

async function loadCallbacks() {
  callbackLoading.value = true
  try {
    const page = unwrap(await listOpenApiCallbacks(cleanParams(callbackQuery)))
    callbacks.value = page.items || []
    callbackTotal.value = Number(page.total || 0)
  } catch (error) {
    showError(error)
  } finally {
    callbackLoading.value = false
  }
}

async function loadReconciliation() {
  reconcileLoading.value = true
  try {
    const page = unwrap(await listOpenApiReconciliation(cleanParams(reconcileQuery)))
    reconciliation.value = page.items || []
    reconcileTotal.value = Number(page.total || 0)
  } catch (error) {
    showError(error)
  } finally {
    reconcileLoading.value = false
  }
}

function searchCallbacks() { callbackQuery.pageNo = 1; loadCallbacks() }
function resetCallbacks() {
  Object.assign(callbackQuery, { pageNo: 1, pageSize: 20, eventId: '', requestId: '', appId: '', status: '' })
  loadCallbacks()
}
function searchReconciliation() { reconcileQuery.pageNo = 1; loadReconciliation() }
function resetReconciliation() {
  Object.assign(reconcileQuery, { pageNo: 1, pageSize: 20, requestId: '', issueType: '', severity: '', status: 'OPEN' })
  loadReconciliation()
}

function openCallbackSettings(app) {
  settingsApp.value = app
  Object.assign(settingsForm, { enabled: Boolean(app.callbackEnabled), callbackUrl: app.callbackUrl || '' })
  settingsDialog.value = true
}

async function saveCallbackSettings() {
  if (!settingsApp.value) return
  if (settingsForm.enabled && !settingsForm.callbackUrl?.trim()) return ElMessage.warning('启用回调时必须填写回调地址')
  saving.value = true
  try {
    unwrap(await updateOpenApiCallbackSettings(settingsApp.value.id, {
      enabled: settingsForm.enabled,
      callbackUrl: settingsForm.callbackUrl?.trim() || null,
    }))
    settingsDialog.value = false
    ElMessage.success('回调配置已保存')
    apps.value = unwrap(await listOpenApiApps())
  } catch (error) {
    showError(error)
  } finally {
    saving.value = false
  }
}

async function retryCallback(row) {
  try {
    await ElMessageBox.confirm(`重新发送回调事件 ${row.eventId}？`, '确认重试', { type: 'warning' })
    unwrap(await retryOpenApiCallback(row.eventId))
    ElMessage.success('回调任务已重新激活')
    await loadCallbacks()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error)
  }
}

async function runReconcile() {
  runningReconcile.value = true
  try {
    const result = unwrap(await runOpenApiReconciliation(lookbackDays.value))
    ElMessage.success(`扫描 ${result.scannedWriteRequests || 0} 个写入任务，发现 ${result.detectedIssues || 0} 个异常`)
    activeTab.value = 'reconciliation'
    reconcileQuery.status = 'OPEN'
    await loadReconciliation()
  } catch (error) {
    showError(error)
  } finally {
    runningReconcile.value = false
  }
}

async function repairRecord(row) {
  try {
    await ElMessageBox.confirm(`自动修复异常 ${row.issueType}？`, '确认修复', { type: 'warning' })
    unwrap(await repairOpenApiReconciliation(row.recordId))
    ElMessage.success('异常已修复')
    await Promise.all([loadReconciliation(), loadCallbacks()])
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error)
  }
}

function openResolve(row) {
  resolveTarget.value = row
  resolution.value = ''
  resolveDialog.value = true
}

async function resolveRecord() {
  if (!resolveTarget.value) return
  if (!resolution.value.trim()) return ElMessage.warning('请填写处理说明')
  saving.value = true
  try {
    unwrap(await resolveOpenApiReconciliation(resolveTarget.value.recordId, { resolution: resolution.value.trim() }))
    resolveDialog.value = false
    ElMessage.success('异常记录已关闭')
    await loadReconciliation()
  } catch (error) {
    showError(error)
  } finally {
    saving.value = false
  }
}

function openCallback(row) { detailTitle.value = '回调任务详情'; detailRecord.value = row; detailDrawer.value = true }
function openReconcile(row) { detailTitle.value = '对账异常详情'; detailRecord.value = row; detailDrawer.value = true }
function repairable(type) { return ['TASK_STATUS_MISMATCH', 'OUTBOX_STUCK', 'CALLBACK_DEAD'].includes(type) }
function appName(id) { return apps.value.find((item) => item.id === id)?.appName || id || '—' }
function callbackStatusType(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'FAILED') return 'warning'
  if (status === 'DEAD') return 'danger'
  return 'info'
}
function severityType(severity) {
  if (severity === 'CRITICAL') return 'danger'
  if (severity === 'HIGH') return 'warning'
  return 'info'
}
function formatDate(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '—' }
function cleanParams(source) { return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== '' && value !== null && value !== undefined)) }
function unwrap(response) { if (!response || response.code !== 200) throw new Error(response?.message || '请求失败'); return response.data ?? [] }
function showError(error) { ElMessage.error(error?.response?.data?.message || error?.message || '请求失败') }
function prettyJson(value) { try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value || '—' } }
</script>

<style scoped>
.reliability-page { min-height: 100vh; padding: 28px; background: #f4f7fb; color: #172033; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 22px; }
.page-header h1 { margin: 4px 0 6px; font-size: 30px; }
.page-header p { margin: 0; color: #6b778c; }
.eyebrow { font-size: 12px; letter-spacing: 2px; color: #2878d0; font-weight: 700; }
.header-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
.metric-card { padding: 20px; border: 1px solid #e3eaf3; border-radius: 14px; background: white; box-shadow: 0 8px 24px rgb(30 63 105 / 6%); }
.metric-card span { display: block; color: #6b778c; font-size: 13px; }
.metric-card strong { display: block; margin: 8px 0 4px; font-size: 28px; }
.metric-card small { color: #8c98aa; }
.metric-card.danger strong { color: #d94b4b; }
.content-card { padding: 18px; border: 1px solid #e3eaf3; border-radius: 14px; background: white; }
.filter-row { display: flex; flex-wrap: wrap; align-items: center; }
.reconcile-toolbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.lookback-control { display: flex; align-items: center; gap: 8px; white-space: nowrap; padding-top: 2px; }
.pagination-row { display: flex; justify-content: flex-end; padding-top: 18px; }
.mb-16 { margin-bottom: 16px; }
code { color: #245f9e; word-break: break-all; }
.payload { margin: 0; white-space: pre-wrap; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
@media (max-width: 1000px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-header, .reconcile-toolbar { align-items: flex-start; flex-direction: column; }
}
@media (max-width: 640px) {
  .reliability-page { padding: 16px; }
  .metric-grid { grid-template-columns: 1fr; }
}
</style>
