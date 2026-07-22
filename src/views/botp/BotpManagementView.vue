<template>
  <div class="botp-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Matrix Integration Platform</p>
        <h1>BOTP 单据下推反写</h1>
        <p class="subtitle">配置单据转换规则，预览目标草稿，并验证幂等执行链路。</p>
      </div>
      <div class="header-actions">
        <button class="secondary" type="button" @click="loadRules">刷新</button>
        <button class="primary" type="button" @click="newRule">新建规则</button>
      </div>
    </header>

    <div v-if="message" :class="['message', messageType]">{{ message }}</div>

    <div class="workspace">
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
            <label>
              规则编码
              <input v-model.trim="form.ruleCode" :disabled="isExistingRule" placeholder="如 AP_TO_PAYMENT_APPLY" />
            </label>
            <label>
              规则名称
              <input v-model.trim="form.ruleName" placeholder="请输入规则名称" />
            </label>
            <label>
              源系统
              <input v-model.trim="form.sourceSystemCode" placeholder="如 MATRIX_FI" />
            </label>
            <label>
              源单类型
              <input v-model.trim="form.sourceDocumentType" placeholder="如 FI_PAYABLE_DOC" />
            </label>
            <label>
              目标系统
              <input v-model.trim="form.targetSystemCode" placeholder="如 MATRIX_FI" />
            </label>
            <label>
              目标单类型
              <input v-model.trim="form.targetDocumentType" placeholder="如 FI_PAYMENT_APPLICATION" />
            </label>
          </div>
        </section>

        <section>
          <div class="section-head">
            <div>
              <h3>单头字段映射</h3>
              <p>支持源字段、常量和执行上下文，禁止脚本与 SQL。</p>
            </div>
            <button class="text-button" type="button" @click="addMapping('headerMappings')">+ 添加映射</button>
          </div>
          <MappingTable
            v-model="form.headerMappings"
            empty-text="尚未配置单头映射"
          />
        </section>

        <section>
          <div class="section-head">
            <div>
              <h3>分录字段映射</h3>
              <p>V1 按源分录逐行生成目标分录。</p>
            </div>
            <button class="text-button" type="button" @click="addMapping('entryMappings')">+ 添加映射</button>
          </div>
          <MappingTable
            v-model="form.entryMappings"
            empty-text="尚未配置分录映射"
          />
        </section>

        <section>
          <div class="section-head">
            <div>
              <h3>反写规则</h3>
              <p>目标创建成功后执行；失败进入 WRITEBACK_PENDING，不重复创建目标单。</p>
            </div>
            <button class="text-button" type="button" @click="addWriteback">+ 添加反写</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>目标结果路径</th>
                  <th>源单反写路径</th>
                  <th>模式</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(mapping, index) in form.writebackMappings" :key="index">
                  <td><input v-model.trim="mapping.targetPath" placeholder="documentNo" /></td>
                  <td><input v-model.trim="mapping.sourcePath" placeholder="lastTargetNo" /></td>
                  <td>
                    <select v-model="mapping.mode">
                      <option value="OVERWRITE">OVERWRITE</option>
                      <option value="RECOMPUTE">RECOMPUTE</option>
                      <option value="STATUS_TRANSITION">STATUS_TRANSITION</option>
                    </select>
                  </td>
                  <td><button class="danger-link" type="button" @click="removeAt(form.writebackMappings, index)">删除</button></td>
                </tr>
                <tr v-if="!form.writebackMappings.length">
                  <td colspan="4" class="empty-cell">尚未配置反写规则</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="test-section">
          <div class="section-head">
            <div>
              <h3>预览与执行</h3>
              <p>使用源单引用验证当前已发布规则。草稿需先发布后才能执行。</p>
            </div>
          </div>
          <div class="test-grid">
            <label>
              源单 ID
              <input v-model.trim="testForm.documentId" placeholder="演示规则可填 ORDER-001" />
            </label>
            <label>
              分录 ID（逗号分隔）
              <input v-model.trim="testForm.entryIds" placeholder="ENTRY-001,ENTRY-002" />
            </label>
            <label>
              操作人
              <input v-model.trim="testForm.operatorId" placeholder="admin" />
            </label>
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
            <span v-for="version in versions" :key="version.version">
              V{{ version.version }} · {{ version.ruleName }} · {{ version.status }}
            </span>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import {
  createBotpRule,
  executeBotp,
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
      const next = props.modelValue.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ))
      emit('update:modelValue', next)
    }
    const remove = (index) => {
      emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index))
    }
    return () => h('div', { class: 'table-wrap' }, [
      h('table', [
        h('thead', h('tr', [
          h('th', '来源类型'),
          h('th', '源路径'),
          h('th', '目标路径'),
          h('th', '常量'),
          h('th', '必填'),
          h('th'),
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
              placeholder: 'customerId',
              onInput: (event) => update(index, 'sourcePath', event.target.value),
            })),
            h('td', h('input', {
              value: mapping.targetPath || '',
              placeholder: 'payeeId',
              onInput: (event) => update(index, 'targetPath', event.target.value),
            })),
            h('td', h('input', {
              value: mapping.constantValue ?? '',
              disabled: mapping.sourceType !== 'CONSTANT',
              placeholder: '固定值',
              onInput: (event) => update(index, 'constantValue', event.target.value),
            })),
            h('td', h('input', {
              type: 'checkbox',
              checked: Boolean(mapping.required),
              onChange: (event) => update(index, 'required', event.target.checked),
            })),
            h('td', h('button', {
              type: 'button',
              class: 'danger-link',
              onClick: () => remove(index),
            }, '删除')),
          ]))
          : [h('tr', h('td', { colspan: 6, class: 'empty-cell' }, props.emptyText))]),
      ]),
    ])
  },
})

const blankRule = () => ({
  ruleCode: '',
  ruleName: '',
  version: 1,
  status: 'DRAFT',
  sourceSystemCode: 'DEMO',
  sourceDocumentType: 'DEMO_ORDER',
  targetSystemCode: 'DEMO',
  targetDocumentType: 'DEMO_DELIVERY',
  headerMappings: [
    { sourceType: 'SOURCE_FIELD', sourcePath: 'orderNo', targetPath: 'sourceOrderNo', constantValue: null, required: true },
  ],
  entryMappings: [
    { sourceType: 'SOURCE_FIELD', sourcePath: 'materialId', targetPath: 'materialId', constantValue: null, required: true },
  ],
  writebackMappings: [],
})

const rules = ref([])
const versions = ref([])
const selectedCode = ref('')
const form = reactive(blankRule())
const saving = ref(false)
const testing = ref(false)
const message = ref('')
const messageType = ref('success')
const testResult = ref(null)
const testForm = reactive({ documentId: 'ORDER-001', entryIds: '', operatorId: 'admin' })

const isExistingRule = computed(() => rules.value.some((rule) => rule.ruleCode === form.ruleCode))
const formattedResult = computed(() => JSON.stringify(testResult.value, null, 2))

onMounted(loadRules)

async function loadRules() {
  try {
    const response = await getBotpRules()
    rules.value = response.data || []
    if (!selectedCode.value && rules.value.length) {
      await selectRule(rules.value[0].ruleCode)
    }
  } catch (error) {
    showError(error)
  }
}

async function selectRule(ruleCode) {
  try {
    selectedCode.value = ruleCode
    const [ruleResponse, versionsResponse] = await Promise.all([
      getBotpRule(ruleCode),
      getBotpRuleVersions(ruleCode),
    ])
    applyRule(ruleResponse.data)
    versions.value = versionsResponse.data || []
    testResult.value = null
  } catch (error) {
    showError(error)
  }
}

function applyRule(rule) {
  Object.assign(form, blankRule(), JSON.parse(JSON.stringify(rule || {})))
}

function newRule() {
  selectedCode.value = ''
  versions.value = []
  Object.assign(form, blankRule(), {
    ruleCode: '',
    ruleName: '',
    version: 1,
    status: 'DRAFT',
  })
  testResult.value = null
  clearMessage()
}

function addMapping(scope) {
  form[scope].push({
    sourceType: 'SOURCE_FIELD',
    sourcePath: '',
    targetPath: '',
    constantValue: null,
    required: false,
  })
}

function addWriteback() {
  form.writebackMappings.push({ targetPath: '', sourcePath: '', mode: 'OVERWRITE' })
}

function removeAt(list, index) {
  list.splice(index, 1)
}

function rulePayload() {
  return {
    ruleCode: form.ruleCode,
    ruleName: form.ruleName,
    sourceSystemCode: form.sourceSystemCode,
    sourceDocumentType: form.sourceDocumentType,
    targetSystemCode: form.targetSystemCode,
    targetDocumentType: form.targetDocumentType,
    headerMappings: form.headerMappings,
    entryMappings: form.entryMappings,
    writebackMappings: form.writebackMappings,
  }
}

async function saveDraft() {
  if (!form.ruleCode || !form.ruleName) {
    return showMessage('请先填写规则编码和名称', 'error')
  }
  saving.value = true
  try {
    const response = isExistingRule.value
      ? await updateBotpRule(form.ruleCode, rulePayload())
      : await createBotpRule(rulePayload())
    applyRule(response.data)
    selectedCode.value = form.ruleCode
    showMessage(response.message || '规则草稿已保存')
    await loadRules()
  } catch (error) {
    showError(error)
  } finally {
    saving.value = false
  }
}

async function publishRule() {
  if (form.status !== 'DRAFT') {
    return showMessage('当前规则不是待发布草稿', 'error')
  }
  saving.value = true
  try {
    const response = await publishBotpRule(form.ruleCode)
    applyRule(response.data)
    showMessage(response.message || '规则版本已发布')
    await loadRules()
    await selectRule(form.ruleCode)
  } catch (error) {
    showError(error)
  } finally {
    saving.value = false
  }
}

function executionPayload() {
  const entryIds = testForm.entryIds
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return {
    requestId: `WEB-${Date.now()}`,
    sourceSystem: 'MATRIX_WEB',
    tenantId: 'default',
    ruleCode: form.ruleCode,
    sourceDocuments: [
      {
        systemCode: form.sourceSystemCode,
        documentType: form.sourceDocumentType,
        documentId: testForm.documentId,
        entryIds,
      },
    ],
    parameters: { operatorId: testForm.operatorId },
    executionMode: 'SYNC',
  }
}

async function previewRule() {
  await runTest(previewBotpExecution)
}

async function executeRule() {
  await runTest(executeBotp)
}

async function runTest(apiCall) {
  if (!form.ruleCode || !testForm.documentId) {
    return showMessage('请选择规则并填写源单 ID', 'error')
  }
  testing.value = true
  try {
    const response = await apiCall(executionPayload())
    testResult.value = response.data
    showMessage(response.message || '调用成功')
  } catch (error) {
    showError(error)
  } finally {
    testing.value = false
  }
}

function statusClass(status) {
  return status === 'PUBLISHED' ? 'published' : 'draft'
}

function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
}

function showError(error) {
  const text = error?.response?.data?.message || error?.message || '操作失败'
  showMessage(text, 'error')
}

function clearMessage() {
  message.value = ''
}
</script>

<style scoped>
.botp-page {
  min-height: 100vh;
  padding: 28px;
  background: #f4f6fb;
  color: #172033;
}

.page-header,
.editor-head,
.section-head,
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header { margin-bottom: 20px; }
.eyebrow { margin: 0 0 6px; color: #5d6b89; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin: 0; font-size: 30px; }
h2, h3 { margin: 0; }
.subtitle, .editor-head p, .section-head p { margin: 6px 0 0; color: #6d7890; }

.workspace {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.panel {
  background: #fff;
  border: 1px solid #e2e7f0;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(36, 54, 90, .06);
}

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
.text-button, .danger-link { background: transparent; padding: 5px; }
.text-button { color: #5163df; }
.danger-link { color: #c43c48; }

.table-wrap { overflow-x: auto; margin-top: 14px; border: 1px solid #e7eaf1; border-radius: 12px; }
table { width: 100%; border-collapse: collapse; min-width: 780px; }
th, td { padding: 10px; border-bottom: 1px solid #edf0f5; text-align: left; font-size: 13px; }
th { color: #65708a; background: #f8f9fc; }
tbody tr:last-child td { border-bottom: 0; }
td input[type='checkbox'] { width: 18px; min-height: 18px; }
.empty, .empty-cell { padding: 24px; text-align: center; color: #929aab; }

.message { margin-bottom: 16px; padding: 12px 16px; border-radius: 10px; }
.message.success { color: #116541; background: #e8f7ef; }
.message.error { color: #a52f3b; background: #fdebee; }
.test-actions { justify-content: flex-start; margin-top: 14px; }
.result { margin-top: 16px; max-height: 420px; overflow: auto; padding: 16px; border-radius: 12px; background: #101726; color: #dce6ff; font-size: 12px; }
.version-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.version-list span { padding: 7px 10px; border-radius: 8px; background: #f1f3f8; color: #57627a; font-size: 12px; }

@media (max-width: 1000px) {
  .workspace { grid-template-columns: 1fr; }
  .rule-list { position: static; }
  .form-grid, .test-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 680px) {
  .botp-page { padding: 14px; }
  .page-header, .editor-head, .section-head { align-items: flex-start; flex-direction: column; }
  .form-grid, .test-grid { grid-template-columns: 1fr; }
}
</style>
