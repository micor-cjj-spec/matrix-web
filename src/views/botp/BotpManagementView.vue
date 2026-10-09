<template>
  <div class="botp-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Matrix Integration Platform</p>
        <h1>BOTP 单据下推反写</h1>
        <p class="subtitle">配置转换规则，执行应付单部分金额下推，并追踪执行状态与上下游关系。</p>
      </div>
      <div class="header-actions">
        <button class="secondary" type="button" @click="refreshCurrent">刷新</button>
        <button v-if="activeTab === 'rules'" class="primary" type="button" @click="newRule">新建规则</button>
      </div>
    </header>

    <nav class="tabs" aria-label="BOTP 功能导航">
      <button :class="{ active: activeTab === 'rules' }" type="button" @click="switchTab('rules')">规则配置</button>
      <button :class="{ active: activeTab === 'executions' }" type="button" @click="switchTab('executions')">执行中心</button>
      <button :class="{ active: activeTab === 'relations' }" type="button" @click="switchTab('relations')">单据关系</button>
    </nav>

    <div v-if="message" :class="['message', messageType]">{{ message }}</div>

    <div v-if="activeTab === 'rules'" class="workspace">
      <aside class="rule-list panel">
        <div class="panel-title">
          <span>转换规则</span>
          <span class="count">{{ rules.length }}</span>
        </div>
        <button
          v-for="rule in rules"
          :key="rule.ruleCode"
          type="button"
          :class="['rule-item', { active: selectedCode === rule.ruleCode }]"
          @click="selectRule(rule.ruleCode)"
        >
          <strong>{{ rule.ruleName }}</strong>
          <span>{{ rule.ruleCode }}</span>
          <small>{{ rule.sourceDocumentType }} → {{ rule.targetDocumentType }}</small>
          <em :class="statusClass(rule.status)">V{{ rule.version }} · {{ rule.status }}</em>
        </button>
        <div v-if="!rules.length" class="empty">暂无规则</div>
      </aside>

      <main class="editor panel">
        <div class="editor-head">
          <div>
            <h2>{{ form.ruleName || '新建转换规则' }}</h2>
            <p>当前版本：V{{ form.version || 1 }} · {{ form.status || 'DRAFT' }}</p>
          </div>
          <div class="header-actions">
            <button class="secondary" type="button" :disabled="saving" @click="saveDraft">
              {{ saving ? '保存中…' : '保存草稿' }}
            </button>
            <button class="primary" type="button" :disabled="saving || form.status !== 'DRAFT'" @click="publishRule">
              发布版本
            </button>
          </div>
        </div>

        <section>
          <h3>基本信息</h3>
          <div class="form-grid">
            <label>规则编码<input v-model.trim="form.ruleCode" :disabled="isExistingRule" placeholder="如 AP_TO_PAYMENT_APPLICATION" /></label>
            <label>规则名称<input v-model.trim="form.ruleName" placeholder="请输入规则名称" /></label>
            <label>源系统<input v-model.trim="form.sourceSystemCode" placeholder="如 MATRIX" /></label>
            <label>源单类型<input v-model.trim="form.sourceDocumentType" placeholder="如 FI_AP_DOC" /></label>
            <label>目标系统<input v-model.trim="form.targetSystemCode" placeholder="如 MATRIX" /></label>
            <label>目标单类型<input v-model.trim="form.targetDocumentType" placeholder="如 FI_PAYMENT_APPLICATION" /></label>
          </div>
        </section>

        <section>
          <div class="section-head">
            <div><h3>单头字段映射</h3><p>支持源字段、常量和执行上下文，禁止脚本与 SQL。</p></div>
            <button class="text-button" type="button" @click="addMapping('headerMappings')">+ 添加映射</button>
          </div>
          <MappingTable v-model="form.headerMappings" empty-text="尚未配置单头映射" />
        </section>

        <section>
          <div class="section-head">
            <div><h3>分录字段映射</h3><p>当前财务单据为单头金额模型；分录级映射将在明细模型建立后开放。</p></div>
            <button class="text-button" type="button" @click="addMapping('entryMappings')">+ 添加映射</button>
          </div>
          <MappingTable v-model="form.entryMappings" empty-text="尚未配置分录映射" />
        </section>

        <section>
          <div class="section-head">
            <div><h3>反写规则</h3><p>推荐 RECOMPUTE：按有效关系求和，不直接执行金额累加。</p></div>
            <button class="text-button" type="button" @click="addWriteback">+ 添加反写</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>目标结果路径</th><th>源单反写路径</th><th>模式</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(mapping, index) in form.writebackMappings" :key="index">
                  <td><input v-model.trim="mapping.targetPath" placeholder="allocatedAmount" /></td>
                  <td><input v-model.trim="mapping.sourcePath" placeholder="appliedAmount" /></td>
                  <td>
                    <select v-model="mapping.mode">
                      <option value="OVERWRITE">OVERWRITE</option>
                      <option value="RECOMPUTE">RECOMPUTE</option>
                      <option value="STATUS_TRANSITION">STATUS_TRANSITION</option>
                    </select>
                  </td>
                  <td><button class="danger-link" type="button" @click="removeAt(form.writebackMappings, index)">删除</button></td>
                </tr>
                <tr v-if="!form.writebackMappings.length"><td colspan="4" class="empty-cell">尚未配置反写规则</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="test-section">
          <div class="section-head">
            <div><h3>预览与执行</h3><p>AP 规则支持填写部分金额；同步执行会创建付款申请并重算反写。</p></div>
            <button v-if="isApRule" class="text-button" type="button" @click="applyApExample">填入 AP 示例</button>
          </div>
          <div class="test-grid">
            <label>源单 ID<input v-model.trim="testForm.documentId" :placeholder="isApRule ? '应付单 fid，如 1001' : '演示规则可填 ORDER-001'" /></label>
            <label>操作人<input v-model.trim="testForm.operatorId" placeholder="admin" /></label>
            <label>请求 ID<input v-model.trim="testForm.requestId" placeholder="留空自动生成" /></label>
            <label v-if="isApRule">下推金额<input v-model.trim="testForm.pushAmount" inputmode="decimal" placeholder="如 600.00" /></label>
            <label v-if="isApRule">付款方式<input v-model.trim="testForm.payMethod" placeholder="如 BANK" /></label>
            <label v-if="isApRule">计划付款日<input v-model="testForm.plannedPayDate" type="date" /></label>
            <label v-if="!isApRule">分录 ID（逗号分隔）<input v-model.trim="testForm.entryIds" placeholder="ENTRY-001,ENTRY-002" /></label>
          </div>
          <div class="header-actions test-actions">
            <button class="secondary" type="button" :disabled="testing" @click="previewRule">转换预览</button>
            <button class="primary" type="button" :disabled="testing" @click="executeRule">同步执行</button>
          </div>
          <pre v-if="testResult" class="result">{{ formattedResult }}</pre>
        </section>

        <section v-if="versions.length">
          <h3>已发布版本</h3>
          <div class="version-list">
            <span v-for="version in versions" :key="version.version">V{{ version.version }} · {{ version.ruleName }} · {{ version.status }}</span>
          </div>
        </section>
      </main>
    </div>

    <section v-else-if="activeTab === 'executions'" class="panel operations-panel">
      <div class="section-head operation-head">
        <div><h2>执行中心</h2><p>目标单创建成功后若反写失败，状态为 WRITEBACK_PENDING，不应重新创建目标单。</p></div>
        <label class="compact-field">显示数量<input v-model.number="executionLimit" type="number" min="1" max="200" @change="loadExecutions" /></label>
      </div>
      <div class="table-wrap">
        <table class="operations-table">
          <thead><tr><th>执行 ID</th><th>规则 / 版本</th><th>来源请求</th><th>源单</th><th>目标单</th><th>状态</th><th>开始时间</th><th>错误</th></tr></thead>
          <tbody>
            <tr v-for="item in executions" :key="item.executionId">
              <td><button class="link-button" type="button" @click="showExecution(item)">{{ item.executionId }}</button></td>
              <td>{{ item.ruleCode }}<small>V{{ item.ruleVersion }}</small></td>
              <td>{{ item.sourceSystem }}<small>{{ item.requestId }}</small></td>
              <td>{{ sourceSummary(item) }}</td>
              <td>{{ targetSummary(item) }}</td>
              <td><span :class="['status-pill', executionStatusClass(item.status)]">{{ item.status }}</span></td>
              <td>{{ formatDateTime(item.startTime) }}</td>
              <td class="error-cell">{{ item.errorMessage || '—' }}</td>
            </tr>
            <tr v-if="!executions.length"><td colspan="8" class="empty-cell">暂无执行记录</td></tr>
          </tbody>
        </table>
      </div>
      <pre v-if="operationResult" class="result">{{ operationResult }}</pre>
    </section>

    <section v-else class="panel operations-panel">
      <div class="section-head operation-head">
        <div><h2>单据上下游关系</h2><p>按源单或目标单查询有效及历史关系，关联金额用于重算源单反写。</p></div>
      </div>
      <div class="relation-filters">
        <label>租户<input v-model.trim="relationFilters.tenantId" /></label>
        <label>源单 ID<input v-model.trim="relationFilters.sourceDocumentId" placeholder="可选" /></label>
        <label>目标单 ID<input v-model.trim="relationFilters.targetDocumentId" placeholder="可选" /></label>
        <label>显示数量<input v-model.number="relationFilters.limit" type="number" min="1" max="200" /></label>
        <button class="primary filter-button" type="button" @click="loadRelations">查询</button>
      </div>
      <div class="table-wrap">
        <table class="operations-table">
          <thead><tr><th>关系 ID</th><th>执行 ID</th><th>规则 / 版本</th><th>源单</th><th>目标单</th><th>关联金额</th><th>状态</th><th>创建时间</th></tr></thead>
          <tbody>
            <tr v-for="item in relations" :key="item.relationId">
              <td>{{ item.relationId }}</td>
              <td>{{ item.executionId }}</td>
              <td>{{ item.ruleCode }}<small>V{{ item.ruleVersion }}</small></td>
              <td>{{ documentRefSummary(item.sourceDocument) }}</td>
              <td>{{ targetRefSummary(item.targetDocument) }}</td>
              <td>{{ formatAmount(item.allocatedAmount) }}</td>
              <td><span :class="['status-pill', item.status === 'ACTIVE' ? 'success' : 'muted']">{{ item.status }}</span></td>
              <td>{{ formatDateTime(item.createdTime) }}</td>
            </tr>
            <tr v-if="!relations.length"><td colspan="8" class="empty-cell">暂无单据关系</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import {
  createBotpRule,
  executeBotp,
  getBotpExecution,
  getBotpExecutions,
  getBotpRelations,
  getBotpRule,
  getBotpRules,
  getBotpRuleVersions,
  previewBotpExecution,
  publishBotpRule,
  updateBotpRule,
} from '@/api/botp'

const MappingTable = defineComponent({
  name: 'MappingTable',
  props: {
    modelValue: { type: Array, required: true },
    emptyText: { type: String, default: '暂无数据' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const update = (index, key, value) => {
      emit('update:modelValue', props.modelValue.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      )))
    }
    const remove = (index) => emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index))
    return () => h('div', { class: 'table-wrap' }, [
      h('table', [
        h('thead', h('tr', [
          h('th', '来源类型'), h('th', '源路径'), h('th', '目标路径'), h('th', '常量'), h('th', '必填'), h('th'),
        ])),
        h('tbody', props.modelValue.length
          ? props.modelValue.map((mapping, index) => h('tr', { key: index }, [
            h('td', h('select', {
              value: mapping.sourceType,
              onChange: (event) => update(index, 'sourceType', event.target.value),
            }, [
              h('option', { value: 'SOURCE_FIELD' }, 'SOURCE_FIELD'),
              h('option', { value: 'CONSTANT' }, 'CONSTANT'),
              h('option', { value: 'CONTEXT' }, 'CONTEXT'),
            ])),
            h('td', h('input', {
              value: mapping.sourcePath || '',
              disabled: mapping.sourceType === 'CONSTANT',
              placeholder: 'sourceField',
              onInput: (event) => update(index, 'sourcePath', event.target.value),
            })),
            h('td', h('input', {
              value: mapping.targetPath || '',
              placeholder: 'targetField',
              onInput: (event) => update(index, 'targetPath', event.target.value),
            })),
            h('td', h('input', {
              value: mapping.constantValue ?? '',
              disabled: mapping.sourceType !== 'CONSTANT',
              placeholder: '固定值',
              onInput: (event) => update(index, 'constantValue', event.target.value),
            })),
            h('td', h('input', {
              type: 'checkbox', checked: Boolean(mapping.required),
              onChange: (event) => update(index, 'required', event.target.checked),
            })),
            h('td', h('button', { type: 'button', class: 'danger-link', onClick: () => remove(index) }, '删除')),
          ]))
          : [h('tr', h('td', { colspan: 6, class: 'empty-cell' }, props.emptyText))]),
      ]),
    ])
  },
})

const blankRule = () => ({
  ruleCode: '', ruleName: '', version: 1, status: 'DRAFT',
  sourceSystemCode: 'MATRIX', sourceDocumentType: 'FI_AP_DOC',
  targetSystemCode: 'MATRIX', targetDocumentType: 'FI_PAYMENT_APPLICATION',
  headerMappings: [], entryMappings: [], writebackMappings: [],
})

const activeTab = ref('rules')
const rules = ref([])
const versions = ref([])
const selectedCode = ref('')
const form = reactive(blankRule())
const saving = ref(false)
const testing = ref(false)
const message = ref('')
const messageType = ref('success')
const testResult = ref(null)
const testForm = reactive({
  documentId: '', entryIds: '', operatorId: 'admin', requestId: '',
  pushAmount: '', payMethod: 'BANK', plannedPayDate: '',
})
const executions = ref([])
const executionLimit = ref(50)
const relations = ref([])
const relationFilters = reactive({ tenantId: 'default', sourceDocumentId: '', targetDocumentId: '', limit: 50 })
const operationResult = ref('')

const isExistingRule = computed(() => rules.value.some((rule) => rule.ruleCode === form.ruleCode))
const isApRule = computed(() => form.ruleCode === 'AP_TO_PAYMENT_APPLICATION')
const formattedResult = computed(() => JSON.stringify(testResult.value, null, 2))

onMounted(loadRules)

async function switchTab(tab) {
  activeTab.value = tab
  clearMessage()
  if (tab === 'executions') await loadExecutions()
  if (tab === 'relations') await loadRelations()
}

async function refreshCurrent() {
  if (activeTab.value === 'rules') return loadRules()
  if (activeTab.value === 'executions') return loadExecutions()
  return loadRelations()
}

async function loadRules() {
  try {
    const response = await getBotpRules()
    rules.value = response.data || []
    if (!selectedCode.value && rules.value.length) await selectRule(rules.value[0].ruleCode)
  } catch (error) { showError(error) }
}

async function selectRule(ruleCode) {
  try {
    selectedCode.value = ruleCode
    const [ruleResponse, versionsResponse] = await Promise.all([
      getBotpRule(ruleCode), getBotpRuleVersions(ruleCode),
    ])
    applyRule(ruleResponse.data)
    versions.value = versionsResponse.data || []
    testResult.value = null
    if (ruleCode === 'AP_TO_PAYMENT_APPLICATION') applyApExample(false)
  } catch (error) { showError(error) }
}

function applyRule(rule) { Object.assign(form, blankRule(), JSON.parse(JSON.stringify(rule || {}))) }

function newRule() {
  selectedCode.value = ''
  versions.value = []
  Object.assign(form, blankRule())
  testResult.value = null
  clearMessage()
}

function addMapping(scope) {
  form[scope].push({ sourceType: 'SOURCE_FIELD', sourcePath: '', targetPath: '', constantValue: null, required: false })
}
function addWriteback() { form.writebackMappings.push({ targetPath: '', sourcePath: '', mode: 'RECOMPUTE' }) }
function removeAt(list, index) { list.splice(index, 1) }

function rulePayload() {
  return {
    ruleCode: form.ruleCode, ruleName: form.ruleName,
    sourceSystemCode: form.sourceSystemCode, sourceDocumentType: form.sourceDocumentType,
    targetSystemCode: form.targetSystemCode, targetDocumentType: form.targetDocumentType,
    headerMappings: form.headerMappings, entryMappings: form.entryMappings,
    writebackMappings: form.writebackMappings,
  }
}

async function saveDraft() {
  if (!form.ruleCode || !form.ruleName) return showMessage('请先填写规则编码和名称', 'error')
  saving.value = true
  try {
    const response = isExistingRule.value
      ? await updateBotpRule(form.ruleCode, rulePayload())
      : await createBotpRule(rulePayload())
    applyRule(response.data)
    selectedCode.value = form.ruleCode
    showMessage(response.message || '规则草稿已保存')
    await loadRules()
  } catch (error) { showError(error) } finally { saving.value = false }
}

async function publishRule() {
  if (form.status !== 'DRAFT') return showMessage('当前规则不是待发布草稿', 'error')
  saving.value = true
  try {
    const response = await publishBotpRule(form.ruleCode)
    applyRule(response.data)
    showMessage(response.message || '规则版本已发布')
    await loadRules()
    await selectRule(form.ruleCode)
  } catch (error) { showError(error) } finally { saving.value = false }
}

function applyApExample(showNotice = true) {
  testForm.documentId = testForm.documentId || '1001'
  testForm.pushAmount = testForm.pushAmount || '600.00'
  testForm.payMethod = testForm.payMethod || 'BANK'
  testForm.plannedPayDate = testForm.plannedPayDate || '2026-07-30'
  if (showNotice) showMessage('已填入 AP 部分金额下推示例，请替换为真实应付单 ID')
}

function executionPayload() {
  const entryIds = testForm.entryIds.split(',').map((item) => item.trim()).filter(Boolean)
  const parameters = { operatorId: testForm.operatorId, operator: testForm.operatorId }
  if (isApRule.value) {
    parameters.pushAmount = testForm.pushAmount
    parameters.payMethod = testForm.payMethod
    parameters.plannedPayDate = testForm.plannedPayDate || null
  }
  return {
    requestId: testForm.requestId || `WEB-${Date.now()}`,
    sourceSystem: 'MATRIX_WEB', tenantId: 'default', ruleCode: form.ruleCode,
    sourceDocuments: [{
      systemCode: form.sourceSystemCode, documentType: form.sourceDocumentType,
      documentId: testForm.documentId, entryIds,
    }],
    parameters,
    executionMode: 'SYNC',
  }
}

async function previewRule() { await runTest(previewBotpExecution) }
async function executeRule() { await runTest(executeBotp, true) }
async function runTest(apiCall, refreshOperations = false) {
  if (!form.ruleCode || !testForm.documentId) return showMessage('请选择规则并填写源单 ID', 'error')
  if (isApRule.value && (!testForm.pushAmount || Number(testForm.pushAmount) <= 0)) {
    return showMessage('AP 下推金额必须大于0', 'error')
  }
  testing.value = true
  try {
    const response = await apiCall(executionPayload())
    testResult.value = response.data
    showMessage(response.message || '调用成功')
    if (refreshOperations) await loadExecutions(false)
  } catch (error) { showError(error) } finally { testing.value = false }
}

async function loadExecutions(showErrors = true) {
  try {
    const response = await getBotpExecutions(executionLimit.value)
    executions.value = response.data || []
  } catch (error) { if (showErrors) showError(error) }
}

async function showExecution(item) {
  try {
    const response = await getBotpExecution(item.executionId)
    operationResult.value = JSON.stringify(response.data, null, 2)
  } catch (error) { showError(error) }
}

async function loadRelations() {
  try {
    const response = await getBotpRelations({
      tenantId: relationFilters.tenantId,
      sourceDocumentId: relationFilters.sourceDocumentId || undefined,
      targetDocumentId: relationFilters.targetDocumentId || undefined,
      limit: relationFilters.limit,
    })
    relations.value = response.data || []
  } catch (error) { showError(error) }
}

function statusClass(status) { return status === 'PUBLISHED' ? 'published' : 'draft' }
function executionStatusClass(status) {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'WRITEBACK_PENDING') return 'warning'
  return 'processing'
}
function sourceSummary(item) { return (item.sourceDocuments || []).map(documentRefSummary).join(', ') || '—' }
function targetSummary(item) { return (item.targetDocuments || []).map(targetRefSummary).join(', ') || '—' }
function documentRefSummary(item) { return item ? `${item.documentType}/${item.documentId}` : '—' }
function targetRefSummary(item) { return item ? `${item.documentType}/${item.documentNo || item.documentId}` : '—' }
function formatDateTime(value) { return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—' }
function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 10 })
}
function showMessage(text, type = 'success') { message.value = text; messageType.value = type }
function showError(error) { showMessage(error?.response?.data?.message || error?.message || '操作失败', 'error') }
function clearMessage() { message.value = '' }
</script>

<style scoped>
.botp-page { min-height: 100vh; padding: 28px; background: #f4f6fb; color: #172033; }
.page-header, .editor-head, .section-head, .header-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.page-header { margin-bottom: 16px; }
.eyebrow { margin: 0 0 6px; color: #5d6b89; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin: 0; font-size: 30px; } h2, h3 { margin: 0; }
.subtitle, .editor-head p, .section-head p { margin: 6px 0 0; color: #6d7890; }
.tabs { display: flex; gap: 6px; margin-bottom: 18px; padding: 5px; width: fit-content; border-radius: 12px; background: #e9edf5; }
.tabs button { background: transparent; color: #59657d; }
.tabs button.active { background: #fff; color: #3044bd; box-shadow: 0 2px 8px rgba(36, 54, 90, .12); }
.workspace { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 20px; align-items: start; }
.panel { background: #fff; border: 1px solid #e2e7f0; border-radius: 16px; box-shadow: 0 10px 30px rgba(36, 54, 90, .06); }
.rule-list { padding: 14px; position: sticky; top: 18px; }
.panel-title { display: flex; justify-content: space-between; padding: 8px 8px 14px; font-weight: 700; }
.count { background: #eef2ff; color: #4b5bdc; border-radius: 20px; padding: 2px 9px; }
.rule-item { width: 100%; display: grid; gap: 5px; padding: 13px; margin-bottom: 8px; text-align: left; border: 1px solid transparent; border-radius: 12px; background: #f7f8fb; cursor: pointer; }
.rule-item:hover, .rule-item.active { border-color: #6374e8; background: #f1f3ff; }
.rule-item span, .rule-item small { color: #6d7890; }
.rule-item em { width: fit-content; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-style: normal; }
.rule-item em.published { color: #087c4c; background: #e5f8ef; }
.rule-item em.draft { color: #a15c00; background: #fff2d8; }
.editor { padding: 24px; }
.editor section { padding: 24px 0; border-top: 1px solid #edf0f5; }
.editor section:first-of-type { margin-top: 18px; }
.form-grid, .test-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
label { display: grid; gap: 7px; color: #4d5871; font-size: 13px; }
input, select { width: 100%; min-height: 38px; box-sizing: border-box; border: 1px solid #d9deea; border-radius: 9px; padding: 8px 10px; background: #fff; color: #172033; }
input:focus, select:focus { outline: none; border-color: #6374e8; box-shadow: 0 0 0 3px rgba(99, 116, 232, .12); }
input:disabled { background: #f1f3f7; color: #949bad; }
button { border: 0; border-radius: 9px; padding: 9px 15px; font-weight: 600; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .55; }
.primary { background: #5163df; color: #fff; }
.secondary { background: #eef1f7; color: #34405a; }
.text-button, .danger-link, .link-button { background: transparent; padding: 5px; }
.text-button, .link-button { color: #5163df; } .danger-link { color: #c43c48; }
.table-wrap { overflow-x: auto; margin-top: 14px; border: 1px solid #e7eaf1; border-radius: 12px; }
table { width: 100%; border-collapse: collapse; min-width: 780px; }
th, td { padding: 10px; border-bottom: 1px solid #edf0f5; text-align: left; font-size: 13px; vertical-align: top; }
th { color: #65708a; background: #f8f9fc; } tbody tr:last-child td { border-bottom: 0; }
td input[type='checkbox'] { width: 18px; min-height: 18px; }
td small { display: block; margin-top: 4px; color: #8a93a5; }
.empty, .empty-cell { padding: 24px; text-align: center; color: #929aab; }
.message { margin-bottom: 16px; padding: 12px 16px; border-radius: 10px; }
.message.success { color: #116541; background: #e8f7ef; } .message.error { color: #a52f3b; background: #fdebee; }
.test-actions { justify-content: flex-start; margin-top: 14px; }
.result { margin-top: 16px; max-height: 420px; overflow: auto; padding: 16px; border-radius: 12px; background: #101726; color: #dce6ff; font-size: 12px; }
.version-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.version-list span { padding: 7px 10px; border-radius: 8px; background: #f1f3f8; color: #57627a; font-size: 12px; }
.operations-panel { padding: 24px; }
.operation-head { align-items: end; }
.compact-field { grid-template-columns: auto 90px; align-items: center; }
.relation-filters { display: grid; grid-template-columns: 1fr 1fr 1fr 120px auto; gap: 12px; align-items: end; margin-top: 22px; }
.filter-button { min-height: 38px; }
.operations-table { min-width: 1180px; }
.status-pill { display: inline-block; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.status-pill.success { color: #087c4c; background: #e5f8ef; }
.status-pill.danger { color: #b42332; background: #fdebee; }
.status-pill.warning { color: #965d00; background: #fff2d8; }
.status-pill.processing { color: #3044bd; background: #eef1ff; }
.status-pill.muted { color: #667085; background: #eef0f4; }
.error-cell { max-width: 260px; color: #a52f3b; word-break: break-word; }
@media (max-width: 980px) {
  .botp-page { padding: 16px; }
  .workspace { grid-template-columns: 1fr; }
  .rule-list { position: static; }
  .form-grid, .test-grid, .relation-filters { grid-template-columns: 1fr; }
  .page-header, .editor-head, .section-head { align-items: flex-start; flex-direction: column; }
}
</style>
