<template>
  <section class="ingestion-panel">
    <div class="panel-head">
      <div>
        <span>File Ingestion</span>
        <strong>文件导入与异步索引</strong>
      </div>
      <div class="head-actions">
        <v-chip :color="config.enabled ? 'success' : 'warning'" size="small" variant="tonal">
          {{ config.enabled ? '已启用' : '未启用' }}
        </v-chip>
        <v-btn icon="mdi-refresh" size="small" variant="text" :loading="jobsLoading" @click="refreshJobs" />
      </div>
    </div>

    <v-alert v-if="!config.enabled" type="warning" variant="tonal" density="compact" class="mb-4">
      后端文件导入尚未启用。执行 V5 迁移后设置 AI_KNOWLEDGE_INGESTION_ENABLED=true。
    </v-alert>

    <div class="import-grid">
      <v-file-input
        v-model="fileModel"
        :disabled="!config.enabled || uploading"
        :accept="acceptTypes"
        label="选择 PDF、Word、TXT 或 Markdown"
        prepend-icon="mdi-paperclip"
        variant="outlined"
        density="comfortable"
        show-size
        clearable
      />
      <v-select
        v-model="form.kbId"
        :items="baseItems"
        :disabled="!config.enabled || uploading"
        item-title="title"
        item-value="value"
        label="导入到知识库"
        variant="outlined"
        density="comfortable"
      />
      <v-text-field
        v-model="form.title"
        :disabled="!config.enabled || uploading"
        label="标题（留空使用文件名）"
        variant="outlined"
        density="comfortable"
      />
      <v-text-field
        v-model="form.category"
        :disabled="!config.enabled || uploading"
        label="分类"
        variant="outlined"
        density="comfortable"
      />
      <v-text-field
        v-model="form.version"
        :disabled="!config.enabled || uploading"
        label="版本"
        variant="outlined"
        density="comfortable"
      />
      <v-select
        v-model="form.status"
        :items="statusItems"
        :disabled="!config.enabled || uploading"
        item-title="title"
        item-value="value"
        label="文档状态"
        variant="outlined"
        density="comfortable"
      />
    </div>

    <div class="import-actions">
      <div>
        <small>最大 {{ maxSizeText }}；扫描版 PDF 暂不包含 OCR。</small>
        <p v-if="notice.text" :class="['notice', notice.type]">{{ notice.text }}</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-cloud-upload-outline"
        :disabled="!config.enabled || !selectedFile"
        :loading="uploading"
        @click="upload"
      >
        导入并创建索引任务
      </v-btn>
    </div>

    <div class="job-section">
      <div class="job-title">
        <strong>最近索引任务</strong>
        <small>{{ jobs.length }} 条</small>
      </div>
      <div v-if="jobsLoading && !jobs.length" class="job-empty">正在读取索引任务…</div>
      <div v-else-if="!jobs.length" class="job-empty">暂无文件导入或异步索引任务</div>
      <div v-else class="job-list">
        <article v-for="job in jobs" :key="job.jobId" class="job-card">
          <div class="job-main">
            <div>
              <strong>{{ job.fileName || job.docId }}</strong>
              <small>{{ baseName(job.kbId) }} · {{ job.docId }}</small>
            </div>
            <v-chip :color="jobColor(job.status)" size="small" variant="tonal">
              {{ jobStatusText(job.status) }}
            </v-chip>
          </div>
          <v-progress-linear
            :model-value="jobProgress(job.status)"
            :indeterminate="job.status === 'RUNNING'"
            height="5"
            rounded
          />
          <div class="job-meta">
            <span>尝试 {{ job.attempts || 0 }}/{{ job.maxAttempts || 0 }}</span>
            <span>{{ formatTime(job.modifyTime || job.createTime) }}</span>
            <span>{{ formatBytes(job.fileSize) }}</span>
          </div>
          <p v-if="job.errorMessage" class="job-error">{{ job.errorMessage }}</p>
          <div v-if="retryable(job.status)" class="job-actions">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-reload"
              :loading="retryingJobId === job.jobId"
              @click="retry(job)"
            >
              重新排队
            </v-btn>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  getKnowledgeIngestionConfig,
  importKnowledgeFile,
  listKnowledgeIndexJobs,
  retryKnowledgeIndexJob,
} from '@/api/knowledgeIngestion'

const props = defineProps({
  knowledgeBases: { type: Array, default: () => [] },
  selectedKbId: { type: String, default: 'all' },
})
const emit = defineEmits(['imported'])

const config = reactive({
  enabled: false,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxExtractedCharacters: 2_000_000,
  allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown'],
})
const form = reactive({ kbId: 'default', title: '', category: '导入文档', version: 'v1', status: 'ACTIVE' })
const notice = reactive({ text: '', type: 'success' })
const fileModel = ref([])
const jobs = ref([])
const uploading = ref(false)
const jobsLoading = ref(false)
const retryingJobId = ref('')
let pollTimer = null

const statusItems = [
  { title: '启用', value: 'ACTIVE' },
  { title: '停用', value: 'INACTIVE' },
]
const baseItems = computed(() => props.knowledgeBases
  .filter(item => item.status === 'ACTIVE')
  .map(item => ({ title: item.name, value: item.kbId })))
const selectedFile = computed(() => {
  if (Array.isArray(fileModel.value)) return fileModel.value[0] || null
  return fileModel.value || null
})
const acceptTypes = computed(() => (config.allowedExtensions || [])
  .map(extension => `.${extension}`)
  .join(','))
const maxSizeText = computed(() => formatBytes(config.maxFileSizeBytes))

watch(() => props.selectedKbId, (value) => {
  if (value && value !== 'all' && baseItems.value.some(item => item.value === value)) form.kbId = value
}, { immediate: true })

watch(baseItems, (items) => {
  if (!items.some(item => item.value === form.kbId)) form.kbId = items[0]?.value || 'default'
}, { immediate: true })

async function fetchConfig() {
  try {
    const resp = await getKnowledgeIngestionConfig()
    Object.assign(config, resp?.data || {})
  } catch (error) {
    config.enabled = false
    setNotice('无法读取文件导入配置', 'error')
  }
}

async function refreshJobs() {
  jobsLoading.value = true
  try {
    const resp = await listKnowledgeIndexJobs({ limit: 30 })
    jobs.value = resp?.data || []
  } catch (error) {
    if (config.enabled) setNotice('索引任务加载失败', 'error')
  } finally {
    jobsLoading.value = false
  }
}

async function upload() {
  const file = selectedFile.value
  if (!file) return setNotice('请选择需要导入的文件', 'warning')
  if (Number(file.size || 0) > Number(config.maxFileSizeBytes || 0)) {
    return setNotice(`文件不能超过 ${maxSizeText.value}`, 'warning')
  }
  uploading.value = true
  try {
    const payload = new FormData()
    payload.append('file', file)
    payload.append('kbId', form.kbId || 'default')
    if (form.title.trim()) payload.append('title', form.title.trim())
    if (form.category.trim()) payload.append('category', form.category.trim())
    if (form.version.trim()) payload.append('version', form.version.trim())
    payload.append('status', form.status)
    const resp = await importKnowledgeFile(payload)
    const document = resp?.data?.document
    fileModel.value = []
    form.title = ''
    setNotice(`已导入 ${document?.title || file.name}，索引任务已进入队列`, 'success')
    await refreshJobs()
    if (document?.docId) emit('imported', document.docId)
  } catch (error) {
    setNotice(error?.response?.data?.message || '文件导入失败', 'error')
  } finally {
    uploading.value = false
  }
}

async function retry(job) {
  retryingJobId.value = job.jobId
  try {
    await retryKnowledgeIndexJob(job.jobId)
    setNotice('索引任务已重新排队', 'success')
    await refreshJobs()
  } catch (error) {
    setNotice(error?.response?.data?.message || '任务重试失败', 'error')
  } finally {
    retryingJobId.value = ''
  }
}

function retryable(status) {
  return ['FAILED', 'PARTIAL', 'SKIPPED'].includes(status)
}

function jobProgress(status) {
  if (status === 'PENDING') return 12
  if (status === 'RUNNING') return 55
  return 100
}

function jobColor(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'RUNNING') return 'primary'
  if (status === 'PENDING') return 'info'
  if (status === 'PARTIAL' || status === 'SKIPPED') return 'warning'
  return 'error'
}

function jobStatusText(status) {
  return {
    PENDING: '等待中',
    RUNNING: '索引中',
    SUCCEEDED: '已完成',
    PARTIAL: '部分成功',
    SKIPPED: '已跳过',
    FAILED: '失败',
  }[status] || status || '未知'
}

function baseName(kbId) {
  return props.knowledgeBases.find(item => item.kbId === kbId)?.name || kbId || '默认知识库'
}

function formatTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-'
}

function formatBytes(value) {
  const bytes = Number(value || 0)
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function setNotice(text, type = 'success') {
  notice.text = text
  notice.type = type
}

onMounted(async () => {
  await Promise.all([fetchConfig(), refreshJobs()])
  pollTimer = window.setInterval(() => {
    if (jobs.value.some(item => ['PENDING', 'RUNNING'].includes(item.status))) refreshJobs()
  }, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>

<style scoped>
.ingestion-panel {
  margin: 16px 0;
  padding: 18px;
  border: 1px solid rgba(23, 42, 52, 0.09);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(34, 53, 73, 0.07);
}

.panel-head,
.job-main,
.job-title,
.import-actions,
.job-meta,
.head-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head > div:first-child {
  display: grid;
  gap: 3px;
}

.panel-head span {
  color: #d1a848;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.panel-head strong {
  font-size: 19px;
}

.import-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) repeat(2, minmax(150px, 0.8fr));
  gap: 12px;
}

.import-actions {
  margin-top: 2px;
}

.import-actions small,
.job-title small,
.job-main small,
.job-meta {
  color: #6c7784;
  font-size: 12px;
}

.notice {
  margin: 5px 0 0;
  font-size: 13px;
}

.notice.success { color: #16715f; }
.notice.warning { color: #8a6519; }
.notice.error { color: #b43838; }

.job-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(23, 42, 52, 0.08);
}

.job-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.job-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(23, 42, 52, 0.08);
  border-radius: 10px;
  background: #f8faf9;
}

.job-main > div:first-child {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.job-main strong,
.job-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-meta {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.job-error {
  margin: 0;
  color: #a93e3e;
  font-size: 12px;
  line-height: 1.5;
}

.job-actions {
  display: flex;
  justify-content: flex-end;
}

.job-empty {
  min-height: 90px;
  display: grid;
  place-content: center;
  color: #7a8792;
}

@media (max-width: 1100px) {
  .import-grid,
  .job-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .import-grid,
  .job-list {
    grid-template-columns: 1fr;
  }

  .import-actions,
  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
