<template>
  <div class="openapi-page">
    <header class="page-header">
      <div>
        <div class="eyebrow">PLATFORM INTEGRATION</div>
        <h1>Matrix 开放平台</h1>
        <p>管理外部应用、数据授权、凭证写入任务、调用日志与运行指标。</p>
      </div>
      <div class="header-actions">
        <el-button @click="loadAll" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="openCreateApp">新建应用</el-button>
      </div>
    </header>

    <section class="metric-grid">
      <article class="metric-card">
        <span>近 {{ dashboard.hours }} 小时调用</span>
        <strong>{{ dashboard.total }}</strong>
        <small>失败 {{ dashboard.failureCount }}</small>
      </article>
      <article class="metric-card">
        <span>成功率</span>
        <strong>{{ dashboard.successRate }}%</strong>
        <small>成功 {{ dashboard.successCount }}</small>
      </article>
      <article class="metric-card">
        <span>平均耗时</span>
        <strong>{{ dashboard.averageDurationMs }} ms</strong>
        <small>P95 {{ dashboard.p95DurationMs }} ms</small>
      </article>
      <article class="metric-card">
        <span>外部应用</span>
        <strong>{{ apps.length }}</strong>
        <small>启用 {{ enabledAppCount }}</small>
      </article>
    </section>

    <el-alert
      v-if="dashboard.sampleTruncated"
      type="warning"
      :closable="false"
      class="mb-16"
      title="看板已达到 10000 条采样上限，请缩小统计时间窗口。"
    />

    <section class="content-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="运行总览" name="overview">
          <div class="overview-grid">
            <div class="panel">
              <div class="panel-title">热门 API</div>
              <div v-if="topApiRows.length" class="rank-list">
                <div v-for="item in topApiRows" :key="item.name" class="rank-item">
                  <span>{{ item.name }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
              <el-empty v-else description="暂无调用数据" :image-size="80" />
            </div>
            <div class="panel">
              <div class="panel-title">错误码分布</div>
              <div v-if="errorRows.length" class="rank-list">
                <div v-for="item in errorRows" :key="item.name" class="rank-item error">
                  <span>{{ item.name }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
              <el-empty v-else description="暂无失败调用" :image-size="80" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="外部应用" name="apps">
          <el-table :data="apps" border stripe>
            <el-table-column prop="appName" label="应用名称" min-width="160" />
            <el-table-column label="AppKey" min-width="240">
              <template #default="scope"><code>{{ scope.row.appKey }}</code></template>
            </el-table-column>
            <el-table-column prop="tenantId" label="租户" width="120" />
            <el-table-column prop="qpsLimit" label="QPS" width="80" />
            <el-table-column prop="maxPageSize" label="分页上限" width="100" />
            <el-table-column label="有效期" min-width="150">
              <template #default="scope">{{ formatDate(scope.row.validTo) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openEditApp(scope.row)">编辑</el-button>
                <el-button link type="warning" @click="rotateSecret(scope.row)">轮换密钥</el-button>
                <el-button link @click="toggleAppStatus(scope.row)">
                  {{ scope.row.status === 'ENABLED' ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="API 授权" name="grants">
          <div class="toolbar-row">
            <el-select v-model="selectedAppId" placeholder="选择外部应用" filterable @change="loadGrants">
              <el-option v-for="app in apps" :key="app.id" :label="app.appName" :value="app.id" />
            </el-select>
            <el-alert
              type="info"
              :closable="false"
              title="租户由应用固定；只读接口最多开放 POSTED，写入接口只能创建草稿且单独配置额度。"
            />
          </div>
          <el-table :data="definitions" border>
            <el-table-column prop="apiName" label="API" min-width="160" />
            <el-table-column prop="apiCode" label="API 编码" min-width="210" />
            <el-table-column prop="httpMethod" label="方法" width="90" />
            <el-table-column prop="externalPath" label="外部路径" min-width="280" />
            <el-table-column label="授权状态" width="110">
              <template #default="scope">
                <el-tag :type="grantFor(scope.row.id)?.status === 'ENABLED' ? 'success' : 'info'">
                  {{ grantFor(scope.row.id)?.status || '未授权' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据范围" min-width="300">
              <template #default="scope">{{ permissionText(grantFor(scope.row.id), scope.row) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="scope">
                <el-button link type="primary" :disabled="!selectedAppId" @click="openGrant(scope.row)">
                  {{ grantFor(scope.row.id) ? '编辑' : '授权' }}
                </el-button>
                <el-button
                  v-if="grantFor(scope.row.id) && grantFor(scope.row.id).status !== 'REVOKED'"
                  link
                  type="danger"
                  @click="revokeGrant(grantFor(scope.row.id))"
                >撤销</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="写入任务" name="writes">
          <el-form :inline="true" class="filter-form" @submit.prevent>
            <el-form-item label="请求 ID">
              <el-input v-model="writeQuery.requestId" clearable placeholder="vwr_..." />
            </el-form-item>
            <el-form-item label="应用">
              <el-select v-model="writeQuery.appId" clearable filterable placeholder="全部应用">
                <el-option v-for="app in apps" :key="app.appId" :label="app.appName" :value="app.appId" />
              </el-select>
            </el-form-item>
            <el-form-item label="外部业务单号">
              <el-input v-model="writeQuery.externalBizNo" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="writeQuery.status" clearable placeholder="全部状态">
                <el-option v-for="status in writeStatuses" :key="status" :label="status" :value="status" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchWriteRequests">查询</el-button>
              <el-button @click="resetWriteRequests">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="writeRequests" border stripe v-loading="writeLoading">
            <el-table-column label="受理时间" min-width="165">
              <template #default="scope">{{ formatDate(scope.row.createdAt, false) }}</template>
            </el-table-column>
            <el-table-column label="请求 ID" min-width="250">
              <template #default="scope"><code>{{ scope.row.requestId }}</code></template>
            </el-table-column>
            <el-table-column prop="externalBizNo" label="外部业务单号" min-width="180" />
            <el-table-column label="组织 / 账簿" min-width="190">
              <template #default="scope">{{ scope.row.organizationId }} / {{ scope.row.bookId }}</template>
            </el-table-column>
            <el-table-column label="状态" width="150">
              <template #default="scope">
                <el-tag :type="writeStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="凭证" min-width="150">
              <template #default="scope">{{ scope.row.voucherNumber || scope.row.voucherId || '—' }}</template>
            </el-table-column>
            <el-table-column prop="retryCount" label="重试" width="70" />
            <el-table-column label="错误" min-width="220" show-overflow-tooltip>
              <template #default="scope">{{ scope.row.errorMessage || '—' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openWriteRequest(scope.row.requestId)">详情</el-button>
                <el-button
                  v-if="canRetryWrite(scope.row.status)"
                  link
                  type="warning"
                  @click="retryWriteRequest(scope.row.requestId)"
                >重试</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-row">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="writeTotal"
              v-model:current-page="writeQuery.pageNo"
              v-model:page-size="writeQuery.pageSize"
              :page-sizes="[20, 50, 100]"
              @current-change="loadWriteRequests"
              @size-change="searchWriteRequests"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="调用日志" name="logs">
          <el-form :inline="true" class="filter-form" @submit.prevent>
            <el-form-item label="Request ID">
              <el-input v-model="logQuery.requestId" clearable placeholder="req_..." />
            </el-form-item>
            <el-form-item label="应用">
              <el-select v-model="logQuery.appId" clearable filterable placeholder="全部应用">
                <el-option v-for="app in apps" :key="app.appId" :label="app.appName" :value="app.appId" />
              </el-select>
            </el-form-item>
            <el-form-item label="API">
              <el-select v-model="logQuery.apiCode" clearable filterable placeholder="全部 API">
                <el-option v-for="api in definitions" :key="api.apiCode" :label="api.apiName" :value="api.apiCode" />
              </el-select>
            </el-form-item>
            <el-form-item label="结果">
              <el-select v-model="logQuery.success" clearable placeholder="全部">
                <el-option label="成功" :value="true" />
                <el-option label="失败" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchLogs">查询</el-button>
              <el-button @click="resetLogs">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="logs" border stripe v-loading="logLoading">
            <el-table-column prop="requestTime" label="请求时间" min-width="165">
              <template #default="scope">{{ formatDate(scope.row.requestTime, false) }}</template>
            </el-table-column>
            <el-table-column prop="requestId" label="Request ID" min-width="250">
              <template #default="scope"><code>{{ scope.row.requestId }}</code></template>
            </el-table-column>
            <el-table-column prop="appId" label="App ID" min-width="190" />
            <el-table-column prop="apiCode" label="API" min-width="180" />
            <el-table-column prop="clientIp" label="客户端 IP" min-width="130" />
            <el-table-column label="结果" width="90">
              <template #default="scope">
                <el-tag :type="scope.row.success ? 'success' : 'danger'">
                  {{ scope.row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="responseCode" label="错误码" min-width="170" />
            <el-table-column prop="durationMs" label="耗时(ms)" width="100" />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="openLog(scope.row.requestId)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-row">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="logTotal"
              v-model:current-page="logQuery.pageNo"
              v-model:page-size="logQuery.pageSize"
              :page-sizes="[20, 50, 100]"
              @current-change="loadLogs"
              @size-change="searchLogs"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="appDialog" :title="editingApp ? '编辑外部应用' : '新建外部应用'" width="620px">
      <el-form label-width="100px">
        <el-form-item label="应用名称"><el-input v-model="appForm.appName" /></el-form-item>
        <el-form-item v-if="!editingApp" label="租户"><el-input v-model="appForm.tenantId" /></el-form-item>
        <el-form-item label="IP 白名单"><el-input v-model="appForm.ipWhitelist" placeholder="逗号分隔；留空表示不限制" /></el-form-item>
        <el-form-item label="QPS"><el-input-number v-model="appForm.qpsLimit" :min="1" :max="10000" /></el-form-item>
        <el-form-item label="分页上限"><el-input-number v-model="appForm.maxPageSize" :min="1" :max="500" /></el-form-item>
        <el-form-item label="失效时间"><el-date-picker v-model="appForm.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveApp">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="credentialDialog" title="请立即保存 AppSecret" width="680px" :close-on-click-modal="false">
      <el-alert type="warning" :closable="false" title="关闭后平台不会再次返回明文 AppSecret。" class="mb-16" />
      <el-form label-width="90px">
        <el-form-item label="App ID"><el-input :model-value="credential.appId" readonly /></el-form-item>
        <el-form-item label="AppKey"><el-input :model-value="credential.appKey" readonly /></el-form-item>
        <el-form-item label="AppSecret"><el-input :model-value="credential.appSecret" type="textarea" readonly /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="credentialDialog = false">我已保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="grantDialog" title="配置 API 授权" width="700px">
      <el-form label-width="120px">
        <el-form-item label="API"><el-input :model-value="grantTarget?.apiName" readonly /></el-form-item>
        <el-form-item label="授权状态">
          <el-select v-model="grantForm.status"><el-option label="ENABLED" value="ENABLED" /><el-option label="DISABLED" value="DISABLED" /></el-select>
        </el-form-item>
        <el-form-item label="组织范围"><el-input v-model="grantForm.organizationIds" placeholder="ORG-001,ORG-002；* 表示租户内全部" /></el-form-item>
        <el-form-item label="账簿范围"><el-input v-model="grantForm.bookIds" placeholder="BOOK-001；* 表示租户内全部" /></el-form-item>
        <template v-if="isWriteApi(grantTarget)">
          <el-form-item label="最大分录数"><el-input-number v-model="grantForm.maxLinesPerVoucher" :min="2" :max="500" /></el-form-item>
          <el-form-item label="每日写入额度"><el-input-number v-model="grantForm.dailyWriteQuota" :min="1" :max="1000000" /></el-form-item>
          <el-alert type="warning" :closable="false" title="写入权限只创建凭证草稿，不包含提交、审核、过账、冲销和删除。" />
        </template>
        <template v-else>
          <el-form-item label="允许状态"><el-select v-model="grantForm.allowedStatuses" multiple disabled><el-option label="POSTED" value="POSTED" /></el-select></el-form-item>
          <el-form-item label="历史月份"><el-input-number v-model="grantForm.maxHistoryMonths" :min="1" :max="120" /></el-form-item>
        </template>
        <el-form-item label="失效时间"><el-date-picker v-model="grantForm.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveGrant">保存授权</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="writeDrawer" title="凭证写入任务详情" size="760px">
      <template v-if="selectedWrite?.request">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="请求 ID" :span="2"><code>{{ selectedWrite.request.requestId }}</code></el-descriptions-item>
          <el-descriptions-item label="外部业务单号">{{ selectedWrite.request.externalBizNo }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="writeStatusType(selectedWrite.request.status)">{{ selectedWrite.request.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="租户">{{ selectedWrite.request.tenantId }}</el-descriptions-item>
          <el-descriptions-item label="组织 / 账簿">{{ selectedWrite.request.organizationId }} / {{ selectedWrite.request.bookId }}</el-descriptions-item>
          <el-descriptions-item label="凭证日期">{{ selectedWrite.request.voucherDate }}</el-descriptions-item>
          <el-descriptions-item label="凭证编号">{{ selectedWrite.request.voucherNumber || '—' }}</el-descriptions-item>
          <el-descriptions-item label="摘要" :span="2">{{ selectedWrite.request.summary }}</el-descriptions-item>
          <el-descriptions-item label="错误码">{{ selectedWrite.request.errorCode || '—' }}</el-descriptions-item>
          <el-descriptions-item label="重试次数">{{ selectedWrite.request.retryCount }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">{{ selectedWrite.request.errorMessage || '—' }}</el-descriptions-item>
        </el-descriptions>

        <h3 class="drawer-title">凭证分录</h3>
        <el-table :data="selectedWrite.lines || []" border size="small">
          <el-table-column prop="lineNo" label="行" width="55" />
          <el-table-column prop="accountCode" label="科目" min-width="120" />
          <el-table-column prop="summary" label="摘要" min-width="160" />
          <el-table-column prop="debitAmount" label="借方" width="110" />
          <el-table-column prop="creditAmount" label="贷方" width="110" />
        </el-table>

        <h3 class="drawer-title">状态轨迹</h3>
        <el-timeline>
          <el-timeline-item
            v-for="item in selectedWrite.logs || []"
            :key="item.id"
            :timestamp="formatDate(item.createdAt, false)"
            placement="top"
          >
            <strong>{{ item.fromStatus || 'NEW' }} → {{ item.toStatus }}</strong>
            <p class="timeline-message">{{ item.message || item.errorCode || '—' }}</p>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-drawer v-model="logDrawer" title="调用日志详情" size="520px">
      <el-descriptions v-if="selectedLog" :column="1" border>
        <el-descriptions-item label="Request ID">{{ selectedLog.requestId }}</el-descriptions-item>
        <el-descriptions-item label="请求时间">{{ formatDate(selectedLog.requestTime, false) }}</el-descriptions-item>
        <el-descriptions-item label="应用">{{ selectedLog.appId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="API">{{ selectedLog.apiCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="路径">{{ selectedLog.requestPath }}</el-descriptions-item>
        <el-descriptions-item label="客户端 IP">{{ selectedLog.clientIp }}</el-descriptions-item>
        <el-descriptions-item label="HTTP 状态">{{ selectedLog.httpStatus }}</el-descriptions-item>
        <el-descriptions-item label="响应码">{{ selectedLog.responseCode }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ selectedLog.durationMs }} ms</el-descriptions-item>
        <el-descriptions-item label="失败原因">{{ selectedLog.errorMessage || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createOpenApiApp,
  getOpenApiDashboard,
  getOpenApiLog,
  getOpenApiWriteRequest,
  listOpenApiApps,
  listOpenApiDefinitions,
  listOpenApiGrants,
  listOpenApiLogs,
  listOpenApiWriteRequests,
  retryOpenApiWriteRequest,
  revokeOpenApiGrant,
  rotateOpenApiSecret,
  saveOpenApiGrant,
  updateOpenApiApp,
  updateOpenApiAppStatus,
  updateOpenApiGrant,
} from '@/api/openapi'

const activeTab = ref('overview')
const loading = ref(false)
const saving = ref(false)
const logLoading = ref(false)
const writeLoading = ref(false)
const apps = ref([])
const definitions = ref([])
const grants = ref([])
const logs = ref([])
const writeRequests = ref([])
const logTotal = ref(0)
const writeTotal = ref(0)
const selectedAppId = ref(null)
const dashboard = reactive({ hours: 24, total: 0, successCount: 0, failureCount: 0, successRate: 0, averageDurationMs: 0, p95DurationMs: 0, topApis: {}, errorCodes: {}, sampleTruncated: false })

const appDialog = ref(false)
const credentialDialog = ref(false)
const grantDialog = ref(false)
const logDrawer = ref(false)
const writeDrawer = ref(false)
const editingApp = ref(null)
const grantTarget = ref(null)
const selectedLog = ref(null)
const selectedWrite = ref(null)
const credential = reactive({ appId: '', appKey: '', appSecret: '' })
const appForm = reactive(defaultAppForm())
const grantForm = reactive(defaultGrantForm())
const logQuery = reactive({ pageNo: 1, pageSize: 20, requestId: '', appId: '', apiCode: '', success: null })
const writeQuery = reactive({ pageNo: 1, pageSize: 20, requestId: '', appId: '', externalBizNo: '', status: '' })
const writeStatuses = ['ACCEPTED', 'PROCESSING', 'RETRYING', 'PROCESSING_FAILED', 'SUCCEEDED', 'MANUAL_REQUIRED']

const enabledAppCount = computed(() => apps.value.filter((item) => item.status === 'ENABLED').length)
const grantMap = computed(() => new Map(grants.value.map((item) => [item.apiDefinitionId, item])))
const topApiRows = computed(() => Object.entries(dashboard.topApis || {}).map(([name, value]) => ({ name, value })))
const errorRows = computed(() => Object.entries(dashboard.errorCodes || {}).map(([name, value]) => ({ name, value })))

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [appRes, apiRes, dashboardRes] = await Promise.all([
      listOpenApiApps(),
      listOpenApiDefinitions(),
      getOpenApiDashboard({ hours: 24 }),
    ])
    apps.value = unwrap(appRes)
    definitions.value = unwrap(apiRes)
    Object.assign(dashboard, unwrap(dashboardRes))
    if (!selectedAppId.value && apps.value.length) selectedAppId.value = apps.value[0].id
    if (selectedAppId.value) await loadGrants(selectedAppId.value)
    if (activeTab.value === 'logs') await loadLogs()
    if (activeTab.value === 'writes') await loadWriteRequests()
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function handleTabChange(name) {
  if (name === 'logs') await loadLogs()
  if (name === 'writes') await loadWriteRequests()
}

async function loadGrants(appId = selectedAppId.value) {
  if (!appId) return
  grants.value = unwrap(await listOpenApiGrants(appId))
}

async function loadLogs() {
  logLoading.value = true
  try {
    const page = unwrap(await listOpenApiLogs(cleanParams(logQuery)))
    logs.value = page.items || []
    logTotal.value = Number(page.total || 0)
  } catch (error) {
    showError(error)
  } finally {
    logLoading.value = false
  }
}

async function loadWriteRequests() {
  writeLoading.value = true
  try {
    const page = unwrap(await listOpenApiWriteRequests(cleanParams(writeQuery)))
    writeRequests.value = page.items || []
    writeTotal.value = Number(page.total || 0)
  } catch (error) {
    showError(error)
  } finally {
    writeLoading.value = false
  }
}

function searchLogs() {
  logQuery.pageNo = 1
  loadLogs()
}

function resetLogs() {
  Object.assign(logQuery, { pageNo: 1, pageSize: 20, requestId: '', appId: '', apiCode: '', success: null })
  loadLogs()
}

function searchWriteRequests() {
  writeQuery.pageNo = 1
  loadWriteRequests()
}

function resetWriteRequests() {
  Object.assign(writeQuery, { pageNo: 1, pageSize: 20, requestId: '', appId: '', externalBizNo: '', status: '' })
  loadWriteRequests()
}

function openCreateApp() {
  editingApp.value = null
  Object.assign(appForm, defaultAppForm())
  appDialog.value = true
}

function openEditApp(app) {
  editingApp.value = app
  Object.assign(appForm, { appName: app.appName, tenantId: app.tenantId, ipWhitelist: app.ipWhitelist || '', qpsLimit: app.qpsLimit, maxPageSize: app.maxPageSize, validTo: app.validTo || '' })
  appDialog.value = true
}

async function saveApp() {
  if (!appForm.appName?.trim()) return ElMessage.warning('请输入应用名称')
  saving.value = true
  try {
    if (editingApp.value) {
      unwrap(await updateOpenApiApp(editingApp.value.id, { appName: appForm.appName, ipWhitelist: appForm.ipWhitelist, qpsLimit: appForm.qpsLimit, maxPageSize: appForm.maxPageSize, validFrom: null, validTo: appForm.validTo || null }))
      ElMessage.success('应用配置已更新')
    } else {
      const result = unwrap(await createOpenApiApp({ ...appForm, validFrom: null, validTo: appForm.validTo || null }))
      Object.assign(credential, result)
      credentialDialog.value = true
      ElMessage.success('应用创建成功')
    }
    appDialog.value = false
    await loadAll()
  } catch (error) {
    showError(error)
  } finally {
    saving.value = false
  }
}

async function toggleAppStatus(app) {
  try {
    const status = app.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
    unwrap(await updateOpenApiAppStatus(app.id, status))
    ElMessage.success(`应用已${status === 'ENABLED' ? '启用' : '停用'}`)
    await loadAll()
  } catch (error) { showError(error) }
}

async function rotateSecret(app) {
  try {
    await ElMessageBox.confirm(`轮换 ${app.appName} 的 AppSecret 后，旧密钥会立即失效。`, '确认轮换密钥', { type: 'warning' })
    const result = unwrap(await rotateOpenApiSecret(app.id))
    Object.assign(credential, result)
    credentialDialog.value = true
    ElMessage.success('AppSecret 已轮换')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error)
  }
}

function openGrant(api) {
  grantTarget.value = api
  const existing = grantFor(api.id)
  const permission = parsePermission(existing?.dataPermissionJson)
  Object.assign(grantForm, {
    id: existing?.id || null,
    status: existing?.status === 'REVOKED' ? 'ENABLED' : (existing?.status || 'ENABLED'),
    allowedStatuses: ['POSTED'],
    organizationIds: permission.organizationIds.join(','),
    bookIds: permission.bookIds.join(','),
    maxHistoryMonths: permission.maxHistoryMonths,
    maxLinesPerVoucher: permission.maxLinesPerVoucher,
    dailyWriteQuota: permission.dailyWriteQuota,
    validTo: existing?.validTo || '',
  })
  grantDialog.value = true
}

async function saveGrant() {
  if (!grantTarget.value || !selectedAppId.value) return
  saving.value = true
  const dataPermission = {
    organizationIds: parseCsv(grantForm.organizationIds),
    bookIds: parseCsv(grantForm.bookIds),
  }
  if (isWriteApi(grantTarget.value)) {
    dataPermission.maxLinesPerVoucher = Number(grantForm.maxLinesPerVoucher || 200)
    dataPermission.dailyWriteQuota = Number(grantForm.dailyWriteQuota || 10000)
  } else {
    dataPermission.allowedStatuses = ['POSTED']
    dataPermission.maxHistoryMonths = Number(grantForm.maxHistoryMonths || 24)
  }
  const payload = {
    status: grantForm.status,
    dataPermissionJson: JSON.stringify(dataPermission),
    fieldPermissionJson: null,
    validFrom: null,
    validTo: grantForm.validTo || null,
  }
  try {
    if (grantForm.id) unwrap(await updateOpenApiGrant(grantForm.id, payload))
    else unwrap(await saveOpenApiGrant({ appId: selectedAppId.value, apiDefinitionId: grantTarget.value.id, ...payload }))
    grantDialog.value = false
    await loadGrants()
    ElMessage.success('授权已保存')
  } catch (error) { showError(error) } finally { saving.value = false }
}

async function revokeGrant(grant) {
  try {
    await ElMessageBox.confirm('撤销后外部应用将立即失去该 API 权限。', '确认撤销授权', { type: 'warning' })
    unwrap(await revokeOpenApiGrant(grant.id))
    await loadGrants()
    ElMessage.success('授权已撤销')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error)
  }
}

async function openWriteRequest(requestId) {
  try {
    selectedWrite.value = unwrap(await getOpenApiWriteRequest(requestId))
    writeDrawer.value = true
  } catch (error) { showError(error) }
}

async function retryWriteRequest(requestId) {
  try {
    await ElMessageBox.confirm('确认重新执行该凭证写入任务？财务服务仍会通过来源请求号保证幂等。', '重新执行', { type: 'warning' })
    unwrap(await retryOpenApiWriteRequest(requestId))
    ElMessage.success('已提交重试')
    await loadWriteRequests()
    if (writeDrawer.value) await openWriteRequest(requestId)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') showError(error)
  }
}

async function openLog(requestId) {
  try {
    selectedLog.value = unwrap(await getOpenApiLog(requestId))
    logDrawer.value = true
  } catch (error) { showError(error) }
}

function grantFor(apiDefinitionId) { return grantMap.value.get(apiDefinitionId) }
function isWriteApi(api) { return Boolean(api?.apiCode?.startsWith('fi.voucher.write')) }
function permissionText(grant, api) {
  if (!grant) return '—'
  const value = parsePermission(grant.dataPermissionJson)
  if (isWriteApi(api)) {
    return `组织 ${value.organizationIds.join(',')}；账簿 ${value.bookIds.join(',')}；最多 ${value.maxLinesPerVoucher} 行；每日 ${value.dailyWriteQuota} 笔`
  }
  return `组织 ${value.organizationIds.join(',')}；账簿 ${value.bookIds.join(',')}；最近 ${value.maxHistoryMonths} 月`
}
function parsePermission(value) {
  try {
    const data = value ? JSON.parse(value) : {}
    return {
      organizationIds: data.organizationIds?.length ? data.organizationIds : ['*'],
      bookIds: data.bookIds?.length ? data.bookIds : ['*'],
      maxHistoryMonths: data.maxHistoryMonths || 24,
      maxLinesPerVoucher: data.maxLinesPerVoucher || 200,
      dailyWriteQuota: data.dailyWriteQuota || 10000,
    }
  } catch {
    return { organizationIds: ['*'], bookIds: ['*'], maxHistoryMonths: 24, maxLinesPerVoucher: 200, dailyWriteQuota: 10000 }
  }
}
function parseCsv(value) {
  const values = String(value || '*').split(',').map((item) => item.trim()).filter(Boolean)
  return values.includes('*') || !values.length ? ['*'] : [...new Set(values)]
}
function writeStatusType(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'MANUAL_REQUIRED' || status === 'PROCESSING_FAILED') return 'danger'
  if (status === 'RETRYING') return 'warning'
  if (status === 'PROCESSING') return 'primary'
  return 'info'
}
function canRetryWrite(status) { return ['MANUAL_REQUIRED', 'PROCESSING_FAILED'].includes(status) }
function defaultAppForm() { return { appName: '', tenantId: 'default', ipWhitelist: '', qpsLimit: 10, maxPageSize: 200, validTo: '' } }
function defaultGrantForm() { return { id: null, status: 'ENABLED', allowedStatuses: ['POSTED'], organizationIds: '*', bookIds: '*', maxHistoryMonths: 24, maxLinesPerVoucher: 200, dailyWriteQuota: 10000, validTo: '' } }
function cleanParams(source) { return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== '' && value !== null && value !== undefined)) }
function unwrap(response) { if (!response || response.code !== 200) throw new Error(response?.message || '请求失败'); return response.data ?? [] }
function showError(error) { ElMessage.error(error?.response?.data?.message || error?.message || '请求失败') }
function formatDate(value, fallbackLong = true) { if (!value) return fallbackLong ? '长期有效' : '—'; return String(value).replace('T', ' ').slice(0, 19) }
</script>

<style scoped>
.openapi-page { min-height: 100vh; padding: 28px; background: #f4f7fb; color: #172033; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 22px; }
.page-header h1 { margin: 4px 0 6px; font-size: 30px; }
.page-header p { margin: 0; color: #6b778c; }
.eyebrow { font-size: 12px; letter-spacing: 2px; color: #2878d0; font-weight: 700; }
.header-actions { display: flex; gap: 10px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
.metric-card { padding: 20px; border: 1px solid #dfe7f2; background: #fff; border-radius: 14px; box-shadow: 0 8px 28px rgba(30, 60, 100, 0.06); }
.metric-card span, .metric-card small { display: block; color: #728096; }
.metric-card strong { display: block; margin: 8px 0; font-size: 28px; }
.content-card { padding: 18px; background: #fff; border: 1px solid #dfe7f2; border-radius: 14px; box-shadow: 0 8px 28px rgba(30, 60, 100, 0.06); }
.overview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.panel { min-height: 260px; padding: 18px; border: 1px solid #e4eaf2; border-radius: 12px; }
.panel-title { margin-bottom: 14px; font-size: 17px; font-weight: 700; }
.rank-list { display: grid; gap: 10px; }
.rank-item { display: flex; justify-content: space-between; padding: 12px; background: #f6f9fd; border-radius: 8px; }
.rank-item.error { background: #fff6f5; }
.toolbar-row { display: grid; grid-template-columns: 260px 1fr; gap: 14px; align-items: center; margin-bottom: 16px; }
.filter-form { margin-bottom: 4px; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 18px; }
.drawer-title { margin: 24px 0 12px; }
.timeline-message { margin: 6px 0 0; color: #6d788b; }
.mb-16 { margin-bottom: 16px; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; word-break: break-all; }
:deep(.el-tabs__content) { padding-top: 14px; }
@media (max-width: 980px) {
  .metric-grid, .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .toolbar-row { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .openapi-page { padding: 16px; }
  .page-header { align-items: flex-start; flex-direction: column; }
  .metric-grid, .overview-grid { grid-template-columns: 1fr; }
}
</style>
