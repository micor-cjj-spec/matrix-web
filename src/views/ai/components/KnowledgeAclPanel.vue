<template>
  <section class="acl-panel">
    <div class="acl-heading">
      <div>
        <span>Access Control</span>
        <strong>{{ kbName || kbId }} 权限</strong>
      </div>
      <div class="acl-heading-actions">
        <v-chip :color="permissionColor" size="small" variant="tonal">
          {{ permissionLabel }}
        </v-chip>
        <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="load" />
      </div>
    </div>

    <v-alert
      v-if="access && !access.aclEnabled"
      type="warning"
      variant="tonal"
      density="comfortable"
      class="acl-alert"
    >
      ACL 尚未启用。请先执行 V6 迁移并为已有知识库配置 OWNER，再设置
      <code>AI_KNOWLEDGE_ACL_ENABLED=true</code>。
    </v-alert>

    <div v-else-if="loading && !access" class="acl-empty">正在读取权限...</div>

    <template v-else-if="access">
      <div class="permission-grid">
        <div :class="{ enabled: access.canView }"><v-icon>mdi-eye-outline</v-icon><span>查看与检索</span></div>
        <div :class="{ enabled: access.canEdit }"><v-icon>mdi-file-edit-outline</v-icon><span>文档编辑</span></div>
        <div :class="{ enabled: access.canAdmin }"><v-icon>mdi-account-key-outline</v-icon><span>成员管理</span></div>
        <div :class="{ enabled: access.canOwn }"><v-icon>mdi-crown-outline</v-icon><span>所有者操作</span></div>
      </div>

      <div v-if="access.aclEnabled && access.canAdmin" class="acl-workspace">
        <div class="grant-card">
          <div class="section-title">
            <strong>授权成员</strong>
            <small>相同主体再次保存会更新权限</small>
          </div>
          <div class="grant-fields">
            <v-select
              v-model="form.subjectType"
              :items="subjectTypeItems"
              item-title="title"
              item-value="value"
              label="主体类型"
              density="compact"
              hide-details
              variant="outlined"
            />
            <v-text-field
              v-model="form.subjectId"
              :label="subjectIdLabel"
              density="compact"
              hide-details
              variant="outlined"
            />
            <v-select
              v-model="form.permission"
              :items="permissionItems"
              item-title="title"
              item-value="value"
              label="权限"
              density="compact"
              hide-details
              variant="outlined"
            />
            <v-btn color="primary" :loading="saving" prepend-icon="mdi-account-plus-outline" @click="saveGrant">
              保存授权
            </v-btn>
          </div>
        </div>

        <div class="member-card">
          <div class="section-title member-title">
            <div>
              <strong>ACL 成员</strong>
              <small>{{ entries.length }} 条授权记录</small>
            </div>
          </div>

          <div v-if="!entries.length" class="acl-empty">暂无授权记录</div>
          <div v-else class="member-list">
            <article v-for="entry in entries" :key="entry.id" class="member-row">
              <div class="subject-icon">
                <v-icon>{{ subjectIcon(entry.subjectType) }}</v-icon>
              </div>
              <div class="member-main">
                <strong>{{ subjectTypeLabel(entry.subjectType) }} · {{ entry.subjectId }}</strong>
                <small>授权人 {{ entry.createdBy }} · {{ formatTime(entry.modifyTime) }}</small>
              </div>
              <v-chip :color="permissionColorFor(entry.permission)" size="small" variant="tonal">
                {{ permissionText(entry.permission) }}
              </v-chip>
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                @click="editEntry(entry)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                color="error"
                variant="text"
                :disabled="entry.permission === 'OWNER' && !access.canOwn"
                :loading="removingId === entry.id"
                @click="removeEntry(entry)"
              />
            </article>
          </div>
        </div>
      </div>

      <div v-else-if="access.aclEnabled" class="acl-empty">
        当前账号只有 {{ permissionLabel }} 权限，成员列表仅对 ADMIN 和 OWNER 开放。
      </div>
    </template>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2400">
      {{ snackbar.text }}
    </v-snackbar>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  getKnowledgeBaseAccess,
  grantKnowledgeBaseAcl,
  listKnowledgeBaseAcl,
  revokeKnowledgeBaseAcl,
} from '@/api/knowledgeAcl'

const props = defineProps({
  kbId: { type: String, required: true },
  kbName: { type: String, default: '' },
})
const emit = defineEmits(['access-change'])

const loading = ref(false)
const saving = ref(false)
const removingId = ref(null)
const access = ref(null)
const entries = ref([])
const form = reactive({ subjectType: 'USER', subjectId: '', permission: 'VIEWER' })
const snackbar = reactive({ show: false, text: '', color: 'success' })

const subjectTypeItems = [
  { title: '用户', value: 'USER' },
  { title: '组织', value: 'ORGANIZATION' },
  { title: '认证权限', value: 'AUTHORITY' },
]
const permissionItems = [
  { title: '查看者 VIEWER', value: 'VIEWER' },
  { title: '编辑者 EDITOR', value: 'EDITOR' },
  { title: '管理员 ADMIN', value: 'ADMIN' },
  { title: '所有者 OWNER', value: 'OWNER' },
]

const permissionLabel = computed(() => permissionText(access.value?.permission || 'NONE'))
const permissionColor = computed(() => permissionColorFor(access.value?.permission || 'NONE'))
const subjectIdLabel = computed(() => {
  if (form.subjectType === 'USER') return '用户ID'
  if (form.subjectType === 'ORGANIZATION') return '组织ID'
  return 'Authority，例如 ROLE_FINANCE'
})

watch(() => props.kbId, () => load(), { immediate: true })

async function load() {
  if (!props.kbId || props.kbId === 'all') return
  loading.value = true
  try {
    const accessResp = await getKnowledgeBaseAccess(props.kbId)
    access.value = accessResp?.data || null
    emit('access-change', access.value)
    if (access.value?.aclEnabled && access.value?.canAdmin) {
      const aclResp = await listKnowledgeBaseAcl(props.kbId)
      entries.value = aclResp?.data || []
    } else {
      entries.value = []
    }
  } catch (error) {
    access.value = null
    entries.value = []
    emit('access-change', null)
    showMessage(resolveError(error, '权限信息加载失败'), 'error')
  } finally {
    loading.value = false
  }
}

async function saveGrant() {
  if (!form.subjectId.trim()) {
    showMessage('请填写主体编号', 'warning')
    return
  }
  saving.value = true
  try {
    await grantKnowledgeBaseAcl(props.kbId, {
      subjectType: form.subjectType,
      subjectId: form.subjectId.trim(),
      permission: form.permission,
    })
    form.subjectId = ''
    form.permission = 'VIEWER'
    showMessage('授权已保存')
    await load()
  } catch (error) {
    showMessage(resolveError(error, '授权保存失败'), 'error')
  } finally {
    saving.value = false
  }
}

function editEntry(entry) {
  form.subjectType = entry.subjectType
  form.subjectId = entry.subjectId
  form.permission = entry.permission
}

async function removeEntry(entry) {
  if (!window.confirm(`确认撤销 ${entry.subjectType}:${entry.subjectId} 的 ${entry.permission} 权限？`)) return
  removingId.value = entry.id
  try {
    await revokeKnowledgeBaseAcl(props.kbId, entry.id)
    showMessage('授权已撤销')
    await load()
  } catch (error) {
    showMessage(resolveError(error, '撤销授权失败'), 'error')
  } finally {
    removingId.value = null
  }
}

function permissionText(permission) {
  return ({
    NONE: '无权限',
    VIEWER: '查看者',
    EDITOR: '编辑者',
    ADMIN: '管理员',
    OWNER: '所有者',
  })[permission] || permission
}

function permissionColorFor(permission) {
  return ({ NONE: 'grey', VIEWER: 'info', EDITOR: 'success', ADMIN: 'warning', OWNER: 'deep-purple' })[permission] || 'grey'
}

function subjectTypeLabel(type) {
  return ({ USER: '用户', ORGANIZATION: '组织', AUTHORITY: 'Authority' })[type] || type
}

function subjectIcon(type) {
  return ({ USER: 'mdi-account-outline', ORGANIZATION: 'mdi-domain', AUTHORITY: 'mdi-shield-account-outline' })[type] || 'mdi-key-outline'
}

function formatTime(value) {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function resolveError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.msg || error?.message || fallback
}

function showMessage(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
.acl-panel {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.78);
  padding: 20px;
  margin-bottom: 22px;
}

.acl-heading,
.acl-heading-actions,
.section-title,
.member-title,
.member-row {
  display: flex;
  align-items: center;
}

.acl-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.acl-heading > div:first-child,
.section-title,
.member-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.acl-heading span,
.section-title small,
.member-main small {
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
}

.acl-heading strong,
.section-title strong,
.member-main strong {
  color: #f8fafc;
}

.acl-heading-actions {
  gap: 8px;
}

.acl-alert {
  margin-bottom: 8px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.permission-grid > div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.65);
  color: rgba(226, 232, 240, 0.46);
}

.permission-grid > div.enabled {
  color: #e2e8f0;
  background: rgba(51, 65, 85, 0.82);
}

.acl-workspace {
  display: grid;
  grid-template-columns: minmax(320px, 0.75fr) minmax(420px, 1.25fr);
  gap: 16px;
}

.grant-card,
.member-card {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.55);
}

.grant-fields {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.member-title {
  justify-content: space-between;
  margin-bottom: 12px;
}

.member-list {
  display: grid;
  gap: 8px;
}

.member-row {
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.65);
}

.subject-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: rgba(99, 102, 241, 0.15);
}

.member-main {
  flex: 1;
  min-width: 0;
}

.acl-empty {
  text-align: center;
  color: rgba(226, 232, 240, 0.6);
  padding: 24px;
}

code {
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.75);
}

@media (max-width: 980px) {
  .permission-grid,
  .acl-workspace {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 680px) {
  .permission-grid,
  .acl-workspace {
    grid-template-columns: 1fr;
  }

  .member-row {
    flex-wrap: wrap;
  }
}
</style>
