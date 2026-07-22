<template>
  <v-container class="openapi-page" fluid>
    <v-breadcrumbs :items="breadcrumbs" divider="mdi-chevron-right" class="px-0 mb-4" />

    <v-card class="hero-card mb-6" elevation="2">
      <v-card-text class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="48" class="mr-4">
            <v-icon icon="mdi-api" size="30" />
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Matrix 开放平台</div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              管理外部应用、API 发布目录与凭证只读授权
            </div>
          </div>
        </div>
        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="loadAll">刷新</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateApp">新建应用</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="metric-card" elevation="1">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">外部应用</div>
            <div class="text-h4 font-weight-bold mt-2">{{ apps.length }}</div>
            <div class="text-caption mt-2">启用 {{ enabledAppCount }} 个</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="metric-card" elevation="1">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">已发布 API</div>
            <div class="text-h4 font-weight-bold mt-2">{{ publishedApiCount }}</div>
            <div class="text-caption mt-2">第一期仅支持凭证只读</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="metric-card" elevation="1">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">当前应用授权</div>
            <div class="text-h4 font-weight-bold mt-2">{{ enabledGrantCount }}</div>
            <div class="text-caption mt-2">默认只允许 POSTED 凭证</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card elevation="2">
      <v-tabs v-model="activeTab" color="primary" class="px-4">
        <v-tab value="apps">外部应用</v-tab>
        <v-tab value="apis">API 目录</v-tab>
        <v-tab value="grants">API 授权</v-tab>
      </v-tabs>
      <v-divider />

      <v-window v-model="activeTab">
        <v-window-item value="apps">
          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4">
              AppSecret 只会在创建成功时展示一次，请立即交付给接入方并妥善保存。
            </v-alert>
            <v-table fixed-header height="520">
              <thead>
                <tr>
                  <th>应用名称</th>
                  <th>AppId / AppKey</th>
                  <th>租户</th>
                  <th>QPS</th>
                  <th>分页上限</th>
                  <th>有效期</th>
                  <th>状态</th>
                  <th class="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in apps" :key="app.id">
                  <td>
                    <div class="font-weight-medium">{{ app.appName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ app.ipWhitelist || '不限 IP' }}</div>
                  </td>
                  <td>
                    <div class="mono text-caption">{{ app.appId }}</div>
                    <div class="mono text-caption text-medium-emphasis">{{ app.appKey }}</div>
                  </td>
                  <td>{{ app.tenantId }}</td>
                  <td>{{ app.qpsLimit }}</td>
                  <td>{{ app.maxPageSize }}</td>
                  <td>{{ formatDate(app.validTo) }}</td>
                  <td>
                    <v-chip :color="app.status === 'ENABLED' ? 'success' : 'default'" size="small" variant="tonal">
                      {{ app.status }}
                    </v-chip>
                  </td>
                  <td class="text-right">
                    <v-btn
                      size="small"
                      variant="text"
                      :color="app.status === 'ENABLED' ? 'warning' : 'success'"
                      @click="toggleAppStatus(app)"
                    >
                      {{ app.status === 'ENABLED' ? '停用' : '启用' }}
                    </v-btn>
                  </td>
                </tr>
                <tr v-if="!apps.length">
                  <td colspan="8" class="text-center text-medium-emphasis py-10">暂无外部应用</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-window-item>

        <v-window-item value="apis">
          <v-card-text>
            <v-alert type="warning" variant="tonal" class="mb-4">
              API 定义由开发侧注册，前台只能查看和授权，不能填写任意内部 URL。
            </v-alert>
            <v-table>
              <thead>
                <tr>
                  <th>API 名称</th>
                  <th>API 编码</th>
                  <th>方法</th>
                  <th>外部路径</th>
                  <th>Scope</th>
                  <th>版本</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="api in definitions" :key="api.id">
                  <td>{{ api.apiName }}</td>
                  <td class="mono">{{ api.apiCode }}</td>
                  <td><v-chip size="small" color="primary" variant="tonal">{{ api.httpMethod }}</v-chip></td>
                  <td class="mono">{{ api.externalPath }}</td>
                  <td class="mono">{{ api.scopeCode }}</td>
                  <td>{{ api.apiVersion }}</td>
                  <td>
                    <v-chip :color="api.status === 'PUBLISHED' ? 'success' : 'default'" size="small" variant="tonal">
                      {{ api.status }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-window-item>

        <v-window-item value="grants">
          <v-card-text>
            <v-row align="center" class="mb-3">
              <v-col cols="12" md="5">
                <v-select
                  v-model="selectedAppId"
                  :items="apps"
                  item-title="appName"
                  item-value="id"
                  label="选择外部应用"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="7">
                <v-alert type="info" variant="tonal" density="compact">
                  数据权限与外部请求条件取交集。当前凭证模型暂未包含组织和账簿字段，第一期控制状态与历史月份。
                </v-alert>
              </v-col>
            </v-row>

            <v-table>
              <thead>
                <tr>
                  <th>API</th>
                  <th>路径</th>
                  <th>授权状态</th>
                  <th>数据权限</th>
                  <th>有效期</th>
                  <th class="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="api in definitions" :key="api.id">
                  <td>
                    <div class="font-weight-medium">{{ api.apiName }}</div>
                    <div class="mono text-caption">{{ api.apiCode }}</div>
                  </td>
                  <td class="mono">{{ api.externalPath }}</td>
                  <td>
                    <v-chip
                      :color="grantFor(api.id)?.status === 'ENABLED' ? 'success' : 'default'"
                      size="small"
                      variant="tonal"
                    >
                      {{ grantFor(api.id)?.status || '未授权' }}
                    </v-chip>
                  </td>
                  <td class="text-caption">{{ permissionText(grantFor(api.id)) }}</td>
                  <td>{{ formatDate(grantFor(api.id)?.validTo) }}</td>
                  <td class="text-right">
                    <v-btn size="small" color="primary" variant="text" :disabled="!selectedAppId" @click="openGrant(api)">
                      {{ grantFor(api.id) ? '编辑授权' : '授权' }}
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <v-dialog v-model="createDialog" max-width="680">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-application-brackets-outline" color="primary" class="mr-2" />
          新建外部应用
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="createFormRef">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field v-model="createForm.appName" label="应用名称" :rules="[requiredRule]" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="createForm.tenantId" label="租户" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="createForm.qpsLimit" type="number" min="1" max="10000" label="QPS 限制" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="createForm.maxPageSize" type="number" min="1" max="500" label="单页上限" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="createForm.validTo" type="datetime-local" label="失效时间" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="createForm.ipWhitelist" label="IP 白名单" hint="多个精确 IP 使用逗号分隔；留空表示不限制" persistent-hint />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="submitCreateApp">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="secretDialog" max-width="720" persistent>
      <v-card>
        <v-card-title class="text-error">请立即保存 AppSecret</v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            关闭窗口后，平台不会再次返回明文 AppSecret。
          </v-alert>
          <v-text-field :model-value="createdCredential.appId" label="AppId" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copy(createdCredential.appId)" />
          <v-text-field :model-value="createdCredential.appKey" label="AppKey" readonly append-inner-icon="mdi-content-copy" @click:append-inner="copy(createdCredential.appKey)" />
          <v-textarea :model-value="createdCredential.appSecret" label="AppSecret" readonly rows="2" append-inner-icon="mdi-content-copy" @click:append-inner="copy(createdCredential.appSecret)" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="secretDialog = false">我已保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="grantDialog" max-width="680">
      <v-card>
        <v-card-title>配置 API 授权</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field :model-value="grantTarget?.apiName" label="API" readonly />
          <v-select v-model="grantForm.status" :items="['ENABLED', 'DISABLED']" label="授权状态" />
          <v-select v-model="grantForm.allowedStatuses" :items="['POSTED']" label="允许凭证状态" multiple chips readonly />
          <v-text-field v-model.number="grantForm.maxHistoryMonths" type="number" min="1" max="120" label="最大历史月份" />
          <v-text-field v-model="grantForm.validTo" type="datetime-local" label="授权失效时间" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="grantDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="submitGrant">保存授权</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2600">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  createOpenApiApp,
  listOpenApiApps,
  listOpenApiDefinitions,
  listOpenApiGrants,
  saveOpenApiGrant,
  updateOpenApiAppStatus,
} from '@/api/openapi'

const breadcrumbs = [
  { title: '企业门户', to: '/portal' },
  { title: '基础服务云' },
  { title: '开放平台' },
]

const activeTab = ref('apps')
const loading = ref(false)
const saving = ref(false)
const apps = ref([])
const definitions = ref([])
const grants = ref([])
const selectedAppId = ref(null)
const createDialog = ref(false)
const secretDialog = ref(false)
const grantDialog = ref(false)
const createFormRef = ref(null)
const grantTarget = ref(null)

const createForm = ref(defaultCreateForm())
const grantForm = ref(defaultGrantForm())
const createdCredential = ref({ appId: '', appKey: '', appSecret: '' })
const snackbar = ref({ show: false, text: '', color: 'info' })

const enabledAppCount = computed(() => apps.value.filter((item) => item.status === 'ENABLED').length)
const publishedApiCount = computed(() => definitions.value.filter((item) => item.status === 'PUBLISHED').length)
const enabledGrantCount = computed(() => grants.value.filter((item) => item.status === 'ENABLED').length)
const grantMap = computed(() => new Map(grants.value.map((item) => [item.apiDefinitionId, item])))

const requiredRule = (value) => Boolean(value?.trim()) || '必填项'

onMounted(loadAll)

watch(selectedAppId, async (value) => {
  if (!value) {
    grants.value = []
    return
  }
  await loadGrants(value)
})

async function loadAll() {
  loading.value = true
  try {
    const [appResponse, apiResponse] = await Promise.all([
      listOpenApiApps(),
      listOpenApiDefinitions(),
    ])
    apps.value = unwrap(appResponse)
    definitions.value = unwrap(apiResponse)
    if (!selectedAppId.value && apps.value.length) {
      selectedAppId.value = apps.value[0].id
    } else if (selectedAppId.value) {
      await loadGrants(selectedAppId.value)
    }
  } catch (error) {
    notify(errorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}

async function loadGrants(appId) {
  try {
    grants.value = unwrap(await listOpenApiGrants(appId))
  } catch (error) {
    grants.value = []
    notify(errorMessage(error), 'error')
  }
}

function openCreateApp() {
  createForm.value = defaultCreateForm()
  createDialog.value = true
}

async function submitCreateApp() {
  const validation = await createFormRef.value?.validate()
  if (validation && !validation.valid) return
  saving.value = true
  try {
    const payload = {
      ...createForm.value,
      validTo: toIsoDateTime(createForm.value.validTo),
    }
    const result = unwrap(await createOpenApiApp(payload))
    createdCredential.value = result
    createDialog.value = false
    secretDialog.value = true
    await loadAll()
    selectedAppId.value = result.id
    notify('应用创建成功，请立即保存密钥', 'success')
  } catch (error) {
    notify(errorMessage(error), 'error')
  } finally {
    saving.value = false
  }
}

async function toggleAppStatus(app) {
  const nextStatus = app.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
  try {
    unwrap(await updateOpenApiAppStatus(app.id, nextStatus))
    await loadAll()
    notify(`应用已${nextStatus === 'ENABLED' ? '启用' : '停用'}`, 'success')
  } catch (error) {
    notify(errorMessage(error), 'error')
  }
}

function openGrant(api) {
  if (!selectedAppId.value) {
    notify('请先选择外部应用', 'warning')
    return
  }
  grantTarget.value = api
  const existing = grantFor(api.id)
  const permission = parsePermission(existing?.dataPermissionJson)
  grantForm.value = {
    status: existing?.status || 'ENABLED',
    allowedStatuses: permission.allowedStatuses,
    maxHistoryMonths: permission.maxHistoryMonths,
    validTo: toLocalDateTime(existing?.validTo),
  }
  grantDialog.value = true
}

async function submitGrant() {
  if (!grantTarget.value || !selectedAppId.value) return
  saving.value = true
  try {
    unwrap(await saveOpenApiGrant({
      appId: selectedAppId.value,
      apiDefinitionId: grantTarget.value.id,
      status: grantForm.value.status,
      dataPermissionJson: JSON.stringify({
        allowedStatuses: grantForm.value.allowedStatuses,
        maxHistoryMonths: Number(grantForm.value.maxHistoryMonths || 24),
      }),
      fieldPermissionJson: null,
      validFrom: null,
      validTo: toIsoDateTime(grantForm.value.validTo),
    }))
    grantDialog.value = false
    await loadGrants(selectedAppId.value)
    notify('授权保存成功', 'success')
  } catch (error) {
    notify(errorMessage(error), 'error')
  } finally {
    saving.value = false
  }
}

function grantFor(apiDefinitionId) {
  return grantMap.value.get(apiDefinitionId)
}

function permissionText(grant) {
  if (!grant) return '—'
  const value = parsePermission(grant.dataPermissionJson)
  return `${value.allowedStatuses.join(', ')}；最近 ${value.maxHistoryMonths} 个月`
}

function parsePermission(value) {
  try {
    const parsed = value ? JSON.parse(value) : {}
    return {
      allowedStatuses: parsed.allowedStatuses?.length ? parsed.allowedStatuses : ['POSTED'],
      maxHistoryMonths: parsed.maxHistoryMonths || 24,
    }
  } catch {
    return { allowedStatuses: ['POSTED'], maxHistoryMonths: 24 }
  }
}

function unwrap(response) {
  if (!response || response.code !== 200) {
    throw new Error(response?.message || '请求失败')
  }
  return response.data ?? []
}

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || '请求失败'
}

function notify(text, color = 'info') {
  snackbar.value = { show: true, text, color }
}

async function copy(value) {
  if (!value) return
  await navigator.clipboard.writeText(value)
  notify('已复制', 'success')
}

function formatDate(value) {
  if (!value) return '长期有效'
  return String(value).replace('T', ' ').slice(0, 16)
}

function toIsoDateTime(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

function toLocalDateTime(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function defaultCreateForm() {
  return {
    appName: '',
    tenantId: 'default',
    validFrom: null,
    validTo: '',
    ipWhitelist: '',
    qpsLimit: 10,
    maxPageSize: 200,
  }
}

function defaultGrantForm() {
  return {
    status: 'ENABLED',
    allowedStatuses: ['POSTED'],
    maxHistoryMonths: 24,
    validTo: '',
  }
}
</script>

<style scoped>
.openapi-page {
  min-height: 100vh;
  padding: 28px;
  background: #f5f7fb;
}

.hero-card,
.metric-card {
  border-radius: 16px;
}

.metric-card {
  border: 1px solid rgba(25, 118, 210, 0.1);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}

:deep(th) {
  font-weight: 700 !important;
  white-space: nowrap;
}
</style>
