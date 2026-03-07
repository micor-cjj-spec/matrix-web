<template>
  <v-container class="shared-operations" fluid>
    <v-breadcrumbs :items="breadcrumbs" class="mb-6" divider="mdi-chevron-right" />

    <v-row class="mb-6" align="stretch" no-gutters>
      <v-col cols="12" md="4" class="pr-md-4 mb-6 mb-md-0">
        <v-card class="info-card" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-avatar color="primary" size="40" class="mr-3">
              <v-icon icon="mdi-account-group-outline" size="26" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">共享运营管理</div>
              <div class="text-body-2 text-medium-emphasis">统一管理共享服务运营任务</div>
            </div>
          </v-card-title>
          <v-divider class="my-3" />
          <v-card-text>
            <div class="text-body-2 text-medium-emphasis mb-4">
              通过标准化任务池，实现跨团队协作、进度追踪与质量管控，支撑共享服务体系的高效运营。
            </div>
            <v-chip-group column class="chip-group" selected-class="bg-primary">
              <v-chip color="primary" class="text-body-2" variant="tonal" prepend-icon="mdi-format-list-checks">
                共享任务
              </v-chip>
              <v-chip color="primary" class="text-body-2" variant="text" prepend-icon="mdi-account-arrow-left">
                拉式认领
              </v-chip>
              <v-chip color="primary" class="text-body-2" variant="text" prepend-icon="mdi-shield-check">
                风险防控
              </v-chip>
              <v-chip color="primary" class="text-body-2" variant="text" prepend-icon="mdi-chart-areaspline">
                运营看板
              </v-chip>
            </v-chip-group>
            <v-alert type="info" variant="tonal" density="comfortable" class="mt-4">
              共享任务涵盖了任务创建、认领、执行、验收与复盘的全生命周期。
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card elevation="2" class="task-card">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-clipboard-list-outline" color="primary" size="28" class="mr-3" />
              <div>
                <div class="text-h6 font-weight-bold">共享任务</div>
                <div class="text-caption text-medium-emphasis">请完善任务信息，确保入池标准与风险可控</div>
              </div>
            </div>
            <div>
              <v-btn class="mr-2" color="primary" variant="tonal" @click="resetForm">重置</v-btn>
              <v-btn color="primary" @click="simulateSubmit">提交</v-btn>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-form ref="taskForm">
              <section-title title="基础信息" />
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.title"
                    label="title｜标题"
                    :rules="titleRules"
                    maxlength="120"
                    counter
                    placeholder="请用“模块-场景-关键词”命名"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.priority"
                    :items="priorityOptions"
                    label="priority｜优先级"
                    item-title="label"
                    item-value="value"
                    required
                    :chips="false"
                    class="priority-select"
                  >
                    <template #selection="{ item }">
                      <v-chip :color="priorityColor(item.value)" size="small" variant="flat">{{ item.value }}</v-chip>
                    </template>
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-avatar :color="priorityColor(item.value)" size="18" />
                        </template>
                        <template #title>
                          {{ item.value }}
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.description"
                    label="description｜描述"
                    rows="3"
                    counter
                    :rules="descriptionRules"
                    placeholder="请描述复现场景 / 期望 / 验收方式"
                    auto-grow
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="form.requester" label="requester｜提交人" readonly variant="outlined" />
                </v-col>
                <v-col cols="12" md="4">
                  <v-autocomplete v-model="form.assignee" :items="assigneeOptions" label="assignee｜负责人" clearable chips hide-no-data />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.status" :items="statusOptions" label="status｜状态" required />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.dueDate"
                    label="dueDate｜截止日期"
                    type="date"
                    :min="minDueDate"
                    clearable
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-combobox
                    v-model="form.labels"
                    label="labels｜标签"
                    multiple
                    chips
                    clearable
                    hint="最多 3 个标签"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.module" :items="moduleOptions" label="module｜模块" required />
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="form.acceptanceCriteria"
                    label="acceptanceCriteria｜验收标准"
                    multiple
                    chips
                    hint="至少添加 1 条可验证的验收标准"
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <section-title title="影响与来源" />
              <v-row>
                <v-col cols="12" md="4">
                  <v-select v-model="form.impactScope" :items="impactScopeOptions" label="impactScope｜影响范围" clearable />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.ticketSource" :items="ticketSourceOptions" label="ticketSource｜来源" clearable />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.taskType" :items="taskTypeOptions" label="taskType｜类型" required />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model.number="form.estimate" label="estimate｜预估 (h / pts)" type="number" min="0" suffix="h" />
                </v-col>
                <v-col cols="12" md="8">
                  <v-combobox v-model="form.dependencies" label="dependencies｜依赖项" multiple chips clearable />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.slaClass" :items="slaOptions" label="slaClass｜SLA等级" />
                </v-col>
              </v-row>

              <section-title title="子任务与执行" />
              <v-row class="align-center mb-2">
                <v-col cols="12" md="8">
                  <div class="text-body-2 text-medium-emphasis">
                    请拆解子任务并更新完成状态，进度条将随完成率变化。
                  </div>
                </v-col>
                <v-col cols="12" md="4" class="text-md-right">
                  <v-btn color="primary" variant="text" prepend-icon="mdi-plus" @click="addSubtask">新增子任务</v-btn>
                </v-col>
              </v-row>
              <v-row v-for="(subtask, index) in form.subtasks" :key="index" class="subtask-row" align="center">
                <v-col cols="12" md="8">
                  <v-text-field v-model="subtask.title" :label="`子任务 ${index + 1}`" required />
                </v-col>
                <v-col cols="6" md="2">
                  <v-switch v-model="subtask.done" inset color="success" :label="subtask.done ? '已完成' : '未完成'" />
                </v-col>
                <v-col cols="6" md="2" class="text-right">
                  <v-btn icon variant="text" color="default" @click="removeSubtask(index)" :disabled="form.subtasks.length === 1">
                    <v-icon icon="mdi-delete-outline" />
                  </v-btn>
                </v-col>
              </v-row>
              <v-progress-linear :model-value="subtaskProgress" color="primary" class="mb-6" rounded height="8" />

              <section-title title="时间追踪" />
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.firstResponseAt" label="firstResponseAt｜首次响应" readonly />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.createdAt" label="createdAt｜创建时间" readonly />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.completedAt" label="completedAt｜完成时间" readonly />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field :model-value="ageDays" label="ageDays｜任务年龄 (天)" readonly />
                </v-col>
              </v-row>

              <section-title title="沟通与关联" />
              <v-row>
                <v-col cols="12" md="6">
                  <v-file-input v-model="form.attachments" label="attachments｜附件" multiple prepend-icon="mdi-paperclip" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-combobox v-model="form.relatedLinks" label="relatedLinks｜关联链接" multiple chips clearable />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.milestone" label="milestone｜里程碑" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="form.quarter" :items="quarterOptions" label="quarter｜归属季度" clearable />
                </v-col>
              </v-row>

              <section-title title="质量与风险" />
              <v-row>
                <v-col cols="12">
                  <v-combobox
                    v-model="form.dorCheck"
                    label="dorCheck｜入池标准"
                    multiple
                    chips
                    hint="示例：场景清晰 / 可测 / 口径明确"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.riskLevel" :items="riskOptions" label="riskLevel｜风险等级" />
                </v-col>
                <v-col cols="12" md="8">
                  <v-textarea v-model="form.rollbackPlan" label="rollbackPlan｜回滚方案" auto-grow rows="2" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-file-input v-model="form.testEvidence" label="testEvidence｜测试证据" multiple prepend-icon="mdi-clipboard-check" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-combobox v-model="form.testEvidenceLinks" label="testEvidence｜测试链接" multiple chips />
                </v-col>
              </v-row>

              <section-title title="执行与发布" />
              <v-row>
                <v-col cols="12" md="4">
                  <v-select v-model="form.ownerTeam" :items="ownerTeamOptions" label="ownerTeam｜负责人团队" clearable />
                </v-col>
                <v-col cols="12" md="4">
                  <v-combobox v-model="form.coOwners" label="coOwners｜协作者" multiple chips clearable />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.env" :items="envOptions" label="env｜环境" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.releaseLink" label="releaseLink｜发布单" type="url" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-combobox v-model="form.prLinks" label="prLinks｜代码PR链接" multiple chips />
                </v-col>
                <v-col cols="12" md="4">
                  <v-chip color="success" class="mt-5" variant="tonal">CI 状态：{{ form.ciStatus }}</v-chip>
                </v-col>
              </v-row>

              <section-title title="追踪与审计" />
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.reopenCount" type="number" label="reopenCount｜退回次数" readonly />
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field v-model="form.duplicateOf" label="duplicateOf｜重复任务指向" />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="form.securityLevel" :items="securityOptions" label="securityLevel｜敏感级别" />
                </v-col>
                <v-col cols="12">
                  <v-card variant="tonal" class="mt-2">
                    <v-card-title class="text-subtitle-2">eventLog｜事件流水</v-card-title>
                    <v-divider />
                    <v-list density="comfortable">
                      <v-list-item v-for="(event, idx) in form.eventLog" :key="idx">
                        <v-list-item-title>{{ event.title }}</v-list-item-title>
                        <v-list-item-subtitle>{{ event.time }} · {{ event.actor }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-col>
              </v-row>

              <section-title title="业务价值" />
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field v-model="form.expectedValue" label="expectedValue｜预期价值" />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="form.postmortem" label="postmortem｜复盘链接" type="url" />
                </v-col>
                <v-col cols="12" md="4">
                  <div class="d-flex align-center">
                    <span class="text-body-2 mr-4">csat｜验收满意度</span>
                    <v-slider v-model="form.csat" min="1" max="5" step="1" thumb-label ticks show-ticks="always" />
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const breadcrumbs = [
  { title: '共享云', disabled: false, href: '#' },
  { title: '共享运营管理', disabled: false, href: '#' },
  { title: '共享任务', disabled: true },
]

const taskForm = ref(null)

const form = reactive({
  title: '',
  description: '',
  priority: 'P2',
  requester: '当前用户',
  assignee: null,
  status: '待分诊',
  dueDate: '',
  labels: [],
  module: '共享运营',
  acceptanceCriteria: ['输入→处理→输出可验证'],
  impactScope: null,
  ticketSource: null,
  taskType: '运营',
  estimate: null,
  subtasks: [
    { title: '梳理需求背景', done: false },
    { title: '制定执行方案', done: false },
  ],
  dependencies: [],
  slaClass: 'SLA-P2',
  firstResponseAt: '',
  createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  completedAt: '',
  attachments: [],
  relatedLinks: [],
  milestone: '',
  quarter: null,
  dorCheck: ['场景清晰'],
  riskLevel: '中',
  rollbackPlan: '',
  testEvidence: [],
  testEvidenceLinks: [],
  ownerTeam: null,
  coOwners: [],
  env: '测试',
  releaseLink: '',
  prLinks: [],
  ciStatus: '进行中',
  eventLog: [
    { title: '任务创建', time: new Date().toLocaleString(), actor: '当前用户' },
  ],
  reopenCount: 0,
  duplicateOf: '',
  securityLevel: '内部',
  expectedValue: '',
  postmortem: '',
  csat: 3,
})

const titleRules = [
  v => !!v || '标题为必填项',
  v => (v && v.length <= 120) || '标题长度需在 120 字以内',
]

const descriptionRules = [
  v => !!v || '描述为必填项',
  v => (v && v.length >= 20) || '描述需至少 20 字',
]

const priorityOptions = [
  { label: '最高优先级', value: 'P0' },
  { label: '高优先级', value: 'P1' },
  { label: '默认优先级', value: 'P2' },
  { label: '低优先级', value: 'P3' },
]

const statusOptions = ['待分诊', '待办', '进行中', '待验收', '已完成', '搁置', '阻塞']
const moduleOptions = ['共享运营', '共享客服', '共享财务', '共享法务']
const impactScopeOptions = ['单用户', '≤1%', '1–5%', '>5%', '关键客户', '金额区间']
const ticketSourceOptions = ['客户', '运营', '监控', '内部', '渠道名']
const taskTypeOptions = ['缺陷', '需求', '运营', '支持', '数据', '自动化']
const slaOptions = ['SLA-P0', 'SLA-P1', 'SLA-P2']
const assigneeOptions = ['张敏', '王涛', '李静', '陈岚']
const quarterOptions = ['FY25Q1', 'FY25Q2', 'FY25Q3', 'FY25Q4']
const riskOptions = ['高', '中', '低']
const ownerTeamOptions = ['共享运营组', '共享质检组', '共享客服组']
const envOptions = ['生产', '预发', '测试']
const securityOptions = ['公开', '内部', '涉密']

const minDueDate = computed(() => new Date().toISOString().split('T')[0])

const ageDays = computed(() => {
  const created = new Date(form.createdAt)
  if (Number.isNaN(created.getTime())) return '-'
  const now = new Date()
  const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : 0
})

const subtaskProgress = computed(() => {
  const total = form.subtasks.length
  if (!total) return 0
  const done = form.subtasks.filter(item => item.done).length
  return Math.round((done / total) * 100)
})

watch(() => form.priority, value => {
  const mapping = {
    P0: 'SLA-P0',
    P1: 'SLA-P1',
    P2: 'SLA-P2',
    P3: 'SLA-P2',
  }
  form.slaClass = mapping[value] || 'SLA-P2'
})

watch(
  () => form.labels,
  labels => {
    if (labels.length > 3) {
      labels.splice(3)
    }
  },
  { deep: true }
)

function priorityColor(priority) {
  switch (priority) {
    case 'P0':
      return 'error'
    case 'P1':
      return 'warning'
    case 'P2':
      return 'info'
    default:
      return 'grey'
  }
}

function addSubtask() {
  form.subtasks.push({ title: '', done: false })
}

function removeSubtask(index) {
  if (form.subtasks.length > 1) {
    form.subtasks.splice(index, 1)
  }
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.priority = 'P2'
  form.assignee = null
  form.status = '待分诊'
  form.dueDate = ''
  form.labels = []
  form.module = '共享运营'
  form.acceptanceCriteria = ['输入→处理→输出可验证']
  form.impactScope = null
  form.ticketSource = null
  form.taskType = '运营'
  form.estimate = null
  form.subtasks = [
    { title: '梳理需求背景', done: false },
    { title: '制定执行方案', done: false },
  ]
  form.dependencies = []
  form.slaClass = 'SLA-P2'
  form.firstResponseAt = ''
  form.completedAt = ''
  form.attachments = []
  form.relatedLinks = []
  form.milestone = ''
  form.quarter = null
  form.dorCheck = ['场景清晰']
  form.riskLevel = '中'
  form.rollbackPlan = ''
  form.testEvidence = []
  form.testEvidenceLinks = []
  form.ownerTeam = null
  form.coOwners = []
  form.env = '测试'
  form.releaseLink = ''
  form.prLinks = []
  form.ciStatus = '进行中'
  form.eventLog = [
    { title: '任务创建', time: new Date().toLocaleString(), actor: '当前用户' },
  ]
  form.reopenCount = 0
  form.duplicateOf = ''
  form.securityLevel = '内部'
  form.expectedValue = ''
  form.postmortem = ''
  form.csat = 3
}

function simulateSubmit() {
  if (!taskForm.value) return
  taskForm.value.validate().then(result => {
    if (result.valid) {
      form.firstResponseAt = form.firstResponseAt || new Date().toISOString().slice(0, 16).replace('T', ' ')
      if (form.status === '已完成' && !form.completedAt) {
        form.completedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
      form.eventLog.push({ title: '任务信息已保存', time: new Date().toLocaleString(), actor: '当前用户' })
      alert('共享任务信息已保存（模拟）')
    }
  })
}
</script>

<script>
export default {
  components: {
    SectionTitle: {
      props: {
        title: {
          type: String,
          required: true,
        },
      },
      template: `
        <div class="section-title">
          <div class="d-flex align-center mb-3 mt-6">
            <div class="section-indicator mr-3"></div>
            <div class="text-subtitle-1 font-weight-medium">{{ title }}</div>
          </div>
        </div>
      `,
    },
  },
}
</script>

<style scoped>
.shared-operations {
  padding: 24px 32px 48px;
  background: linear-gradient(180deg, #f7faff 0%, #ffffff 60%);
}

.info-card {
  border-radius: 18px;
  height: 100%;
}

.task-card {
  border-radius: 18px;
}

.section-title {
  margin-bottom: 8px;
}

.section-indicator {
  width: 6px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(180deg, #4d7cfe 0%, #90b4ff 100%);
}

.subtask-row {
  background-color: rgba(79, 129, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 4px 8px;
}

.priority-select :deep(.v-field__outline) {
  border-radius: 12px;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 960px) {
  .shared-operations {
    padding: 16px;
  }
}
</style>
