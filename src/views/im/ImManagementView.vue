<template>
  <main class="im-page">
    <section class="hero">
      <div>
        <span>IM MANAGEMENT</span>
        <h1>IM 推送平台</h1>
        <p>管理接入应用、调用密钥、渠道权限与消息模板。</p>
      </div>
      <div class="hero-actions">
        <v-btn variant="tonal" prepend-icon="mdi-bell-outline" @click="router.push('/notifications')">个人消息中心</v-btn>
        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="refreshAll">刷新</v-btn>
      </div>
    </section>

    <v-card class="workspace" elevation="0">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="applications">接入应用</v-tab>
        <v-tab value="templates">消息模板</v-tab>
      </v-tabs>
      <v-divider />

      <v-window v-model="activeTab">
        <v-window-item value="applications">
          <div class="section-heading">
            <div><span>APPLICATIONS</span><strong>接入应用</strong></div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openApplication()">新增应用</v-btn>
          </div>
          <v-data-table
            :headers="applicationHeaders"
            :items="applications"
            :loading="loading"
            item-value="appCode"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.application="{ item }">
              <div class="primary-cell"><strong>{{ item.appName }}</strong><small>{{ item.appCode }}</small></div>
            </template>
            <template #item.channels="{ item }">
              <div class="chip-row"><v-chip v-for="channel in toArray(item.allowedChannels)" :key="channel" size="small" variant="tonal">{{ channel }}</v-chip></div>
            </template>
            <template #item.status="{ item }"><v-chip size="small" :color="item.status === 'ENABLED' ? 'success' : 'default'" variant="tonal">{{ item.status }}</v-chip></template>
            <template #item.actions="{ item }">
              <div class="row-actions">
                <v-btn size="small" variant="tonal" @click="openApplication(item)">编辑</v-btn>
                <v-btn size="small" color="warning" variant="tonal" @click="rotateSecret(item)">轮换密钥</v-btn>
              </div>
            </template>
          </v-data-table>
        </v-window-item>

        <v-window-item value="templates">
          <div class="section-heading">
            <div><span>TEMPLATES</span><strong>消息模板</strong></div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openTemplate()">新增模板</v-btn>
          </div>
          <v-data-table
            :headers="templateHeaders"
            :items="templates"
            :loading="loading"
            item-value="templateCode"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.template="{ item }">
              <div class="primary-cell"><strong>{{ item.templateName }}</strong><small>{{ item.templateCode }} · v{{ item.version }}</small></div>
            </template>
            <template #item.defaultChannels="{ item }">
              <div class="chip-row"><v-chip v-for="channel in toArray(item.defaultChannels)" :key="channel" size="small" variant="tonal">{{ channel }}</v-chip></div>
            </template>
            <template #item.status="{ item }"><v-chip size="small" :color="item.status === 'ENABLED' ? 'success' : 'default'" variant="tonal">{{ item.status }}</v-chip></template>
            <template #item.actions="{ item }"><v-btn size="small" variant="tonal" @click="openTemplate(item)">编辑</v-btn></template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card>

    <v-dialog v-model="applicationDialog.visible" max-width="760" persistent>
      <v-card>
        <v-card-title>{{ applicationDialog.editing ? '编辑接入应用' : '新增接入应用' }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model.trim="applicationDialog.form.appCode" label="应用编码" variant="outlined" :disabled="applicationDialog.editing" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model.trim="applicationDialog.form.appName" label="应用名称" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model.trim="applicationDialog.form.tenantId" label="租户" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="applicationDialog.form.status" label="状态" :items="statusOptions" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="applicationDialog.form.allowedChannels" label="允许渠道" :items="channelOptions" multiple chips variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model.number="applicationDialog.form.rateLimitPerMinute" label="每分钟限流" type="number" min="1" variant="outlined" /></v-col>
            <v-col cols="12"><v-text-field v-model="applicationDialog.form.allowedIpsText" label="IP 白名单" hint="多个 IP 使用逗号分隔，* 表示不限制" persistent-hint variant="outlined" /></v-col>
            <v-col cols="12"><v-text-field v-model.trim="applicationDialog.form.callbackUrl" label="结果回调地址" variant="outlined" clearable /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="applicationDialog.visible = false">取消</v-btn><v-btn color="primary" :loading="applicationDialog.loading" @click="saveApplication">保存</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="templateDialog.visible" max-width="860" persistent>
      <v-card>
        <v-card-title>{{ templateDialog.editing ? '编辑消息模板' : '新增消息模板' }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model.trim="templateDialog.form.templateCode" label="模板编码" variant="outlined" :disabled="templateDialog.editing" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model.trim="templateDialog.form.templateName" label="模板名称" variant="outlined" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model.trim="templateDialog.form.messageType" label="消息类型" variant="outlined" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model.number="templateDialog.form.version" label="版本" type="number" min="1" variant="outlined" /></v-col>
            <v-col cols="12" md="4"><v-select v-model="templateDialog.form.status" label="状态" :items="statusOptions" variant="outlined" /></v-col>
            <v-col cols="12"><v-select v-model="templateDialog.form.defaultChannels" label="默认渠道" :items="channelOptions" multiple chips variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="templateDialog.form.localTitleTemplate" label="站内信标题模板" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="templateDialog.form.emailSubjectTemplate" label="邮件主题模板" variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="templateDialog.form.localBodyTemplate" label="站内信正文模板" rows="5" auto-grow variant="outlined" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="templateDialog.form.emailBodyTemplate" label="邮件正文模板" rows="5" auto-grow variant="outlined" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="templateDialog.visible = false">取消</v-btn><v-btn color="primary" :loading="templateDialog.loading" @click="saveTemplate">保存</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="secretDialog.visible" max-width="560">
      <v-card>
        <v-card-title>应用密钥已更新</v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">密钥只在本次操作中返回，请立即复制并安全保存。</v-alert>
          <v-text-field :model-value="secretDialog.secret" label="AppSecret" readonly variant="outlined" append-inner-icon="mdi-content-copy" @click:append-inner="copySecret" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn color="primary" @click="secretDialog.visible = false">已保存</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2400">{{ snackbar.text }}</v-snackbar>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  listImApplications,
  listImTemplates,
  rotateImApplicationSecret,
  saveImApplication,
  saveImTemplate,
} from '@/api/imManagement'

const router = useRouter()
const activeTab = ref('applications')
const loading = ref(false)
const applications = ref([])
const templates = ref([])
const channelOptions = ['LOCAL', 'EMAIL']
const statusOptions = ['ENABLED', 'DISABLED']
const snackbar = reactive({ show: false, text: '', color: 'success' })
const secretDialog = reactive({ visible: false, secret: '' })

const applicationHeaders = [
  { title: '应用', key: 'application', minWidth: 220 },
  { title: '租户', key: 'tenantId', width: 130 },
  { title: '渠道', key: 'channels', width: 180 },
  { title: '限流/分钟', key: 'rateLimitPerMinute', width: 120 },
  { title: '状态', key: 'status', width: 110 },
  { title: '操作', key: 'actions', sortable: false, width: 210 },
]
const templateHeaders = [
  { title: '模板', key: 'template', minWidth: 230 },
  { title: '消息类型', key: 'messageType', width: 140 },
  { title: '默认渠道', key: 'defaultChannels', width: 180 },
  { title: '状态', key: 'status', width: 110 },
  { title: '更新时间', key: 'updatedTime', width: 180 },
  { title: '操作', key: 'actions', sortable: false, width: 100 },
]

const applicationDialog = reactive({ visible: false, loading: false, editing: false, form: emptyApplication() })
const templateDialog = reactive({ visible: false, loading: false, editing: false, form: emptyTemplate() })

onMounted(refreshAll)

function emptyApplication() {
  return { appCode: '', appName: '', tenantId: 'default', allowedChannels: ['LOCAL'], allowedIpsText: '*', rateLimitPerMinute: 600, callbackUrl: '', status: 'ENABLED' }
}
function emptyTemplate() {
  return { templateCode: '', templateName: '', messageType: 'NOTICE', localTitleTemplate: '', localBodyTemplate: '', emailSubjectTemplate: '', emailBodyTemplate: '', defaultChannels: ['LOCAL'], version: 1, status: 'ENABLED' }
}

async function refreshAll() {
  loading.value = true
  try {
    const [appsResponse, templatesResponse] = await Promise.all([listImApplications(), listImTemplates()])
    applications.value = Array.isArray(appsResponse?.data) ? appsResponse.data : []
    templates.value = Array.isArray(templatesResponse?.data) ? templatesResponse.data : []
  } catch (error) {
    showMessage(error?.response?.data?.message || 'IM 管理数据加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function openApplication(item = null) {
  applicationDialog.editing = Boolean(item)
  applicationDialog.form = item ? {
    appCode: item.appCode,
    appName: item.appName,
    tenantId: item.tenantId || 'default',
    allowedChannels: toArray(item.allowedChannels),
    allowedIpsText: toArray(item.allowedIps).join(',') || '*',
    rateLimitPerMinute: item.rateLimitPerMinute || 600,
    callbackUrl: item.callbackUrl || '',
    status: item.status || 'ENABLED',
  } : emptyApplication()
  applicationDialog.visible = true
}

async function saveApplication() {
  const form = applicationDialog.form
  if (!form.appCode || !form.appName || !form.allowedChannels.length) {
    showMessage('应用编码、名称和允许渠道不能为空', 'warning')
    return
  }
  applicationDialog.loading = true
  try {
    const response = await saveImApplication({
      appCode: form.appCode,
      appName: form.appName,
      tenantId: form.tenantId || 'default',
      allowedChannels: form.allowedChannels,
      allowedIps: form.allowedIpsText.split(',').map(item => item.trim()).filter(Boolean),
      rateLimitPerMinute: Number(form.rateLimitPerMinute || 600),
      callbackUrl: form.callbackUrl || undefined,
      status: form.status,
    })
    applicationDialog.visible = false
    const result = response?.data
    if (result?.secretChanged && result?.secret) {
      secretDialog.secret = result.secret
      secretDialog.visible = true
    }
    showMessage('IM 应用配置已保存')
    await refreshAll()
  } catch (error) {
    showMessage(error?.response?.data?.message || 'IM 应用保存失败', 'error')
  } finally {
    applicationDialog.loading = false
  }
}

async function rotateSecret(item) {
  if (!window.confirm(`确认轮换应用 ${item.appCode} 的密钥？旧密钥将立即失效。`)) return
  try {
    const response = await rotateImApplicationSecret(item.appCode)
    secretDialog.secret = response?.data?.secret || ''
    secretDialog.visible = true
    showMessage('应用密钥已轮换')
  } catch (error) {
    showMessage(error?.response?.data?.message || '密钥轮换失败', 'error')
  }
}

function openTemplate(item = null) {
  templateDialog.editing = Boolean(item)
  templateDialog.form = item ? {
    templateCode: item.templateCode,
    templateName: item.templateName,
    messageType: item.messageType,
    localTitleTemplate: item.localTitleTemplate || '',
    localBodyTemplate: item.localBodyTemplate || '',
    emailSubjectTemplate: item.emailSubjectTemplate || '',
    emailBodyTemplate: item.emailBodyTemplate || '',
    defaultChannels: toArray(item.defaultChannels),
    version: Number(item.version || 1),
    status: item.status || 'ENABLED',
  } : emptyTemplate()
  templateDialog.visible = true
}

async function saveTemplate() {
  const form = templateDialog.form
  if (!form.templateCode || !form.templateName || !form.messageType || !form.defaultChannels.length || Number(form.version) < 1) {
    showMessage('请完整填写模板必填项', 'warning')
    return
  }
  templateDialog.loading = true
  try {
    await saveImTemplate({ ...form, version: Number(form.version) })
    templateDialog.visible = false
    showMessage('消息模板已保存')
    await refreshAll()
  } catch (error) {
    showMessage(error?.response?.data?.message || '消息模板保存失败', 'error')
  } finally {
    templateDialog.loading = false
  }
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (value instanceof Set) return Array.from(value)
  if (!value) return []
  return String(value).split(',').map(item => item.trim()).filter(Boolean)
}

async function copySecret() {
  try {
    await navigator.clipboard.writeText(secretDialog.secret)
    showMessage('密钥已复制')
  } catch (error) {
    showMessage('无法自动复制，请手动选择密钥', 'warning')
  }
}

function showMessage(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
.im-page { min-height: 100vh; padding: 30px; color: #253431; background: #f4f6f7; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; padding: 30px 34px; border-radius: 24px; color: #fff; background: linear-gradient(135deg, #4c356e, #7659a7); }
.hero span { font-size: 11px; font-weight: 800; letter-spacing: .16em; opacity: .72; }
.hero h1 { margin: 8px 0 0; font-size: 36px; }
.hero p { margin: 12px 0 0; opacity: .78; }
.hero-actions { display: flex; gap: 10px; }
.workspace { border: 1px solid #e0e4e6; border-radius: 18px; background: #fff; }
.section-heading { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 12px; }
.section-heading span, .section-heading strong { display: block; }
.section-heading span { color: #86749a; font-size: 11px; font-weight: 800; letter-spacing: .12em; }
.section-heading strong { margin-top: 5px; font-size: 20px; }
.primary-cell { display: grid; gap: 4px; }
.primary-cell small { color: #82908d; font-size: 11px; }
.chip-row, .row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 760px) {
  .im-page { padding: 16px; }
  .hero { align-items: flex-start; flex-direction: column; padding: 24px; }
  .hero h1 { font-size: 28px; }
  .hero-actions { width: 100%; flex-wrap: wrap; }
}
</style>
