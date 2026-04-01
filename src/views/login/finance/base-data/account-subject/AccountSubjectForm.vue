<template>
  <div class="account-subject-form-page">
    <div class="page-header">
      <div>
        <h2 class="title">{{ isEdit ? '编辑会计科目' : '新建会计科目' }}</h2>
        <div class="subtitle">组织字段已改为引用企业建模中的业务单元，避免财务主数据继续手工输组织文本。</div>
      </div>
    </div>

    <v-form ref="formRef" v-model="valid">
      <v-card class="mb-6" elevation="2">
        <v-card-title>基本信息</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field v-model.trim="form.fcode" label="科目编码" :rules="[requiredRule]" required />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model.trim="form.fname" label="科目名称" :rules="[requiredRule]" required />
            </v-col>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="form.forg"
                :items="orgOptions"
                item-title="label"
                item-value="value"
                label="业务单元"
                clearable
                :rules="[requiredRule]"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.flongName" label="科目全称" />
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="form.ftype" :items="accountTypeOptions" label="科目类型" :rules="[requiredRule]" required />
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="form.fdirection" :items="directionOptions" label="余额方向" :rules="[requiredRule]" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.fparent"
                :items="parentOptions"
                item-title="label"
                item-value="value"
                label="上级科目"
                clearable
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.flevel1"
                :items="level1Options"
                item-title="label"
                item-value="value"
                label="一级科目"
                clearable
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-6" elevation="2">
        <v-card-title>报表口径</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-select
                v-model="form.fpltype"
                :items="profitLossTypeOptions"
                label="损益类型"
                clearable
                hint="建议优先使用收入、成本、费用，与当前利润表识别逻辑保持一致。"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" md="8">
              <v-autocomplete
                v-model="form.freportItem"
                :items="reportItemOptions"
                item-title="label"
                item-value="value"
                label="关联报表项目"
                clearable
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-6" elevation="2">
        <v-card-title>控制信息</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-select v-model="form.fentryControl" :items="entryControlOptions" label="分录录入控制" :rules="[requiredRule]" required />
            </v-col>
            <v-col cols="12" md="4">
              <v-combobox v-model="form.fcontrolLevel" :items="controlLevelOptions" label="控制级次" clearable />
            </v-col>
            <v-col cols="12" md="4" class="switch-col">
              <v-switch v-model="form.fisDetail" label="末级科目" :true-value="1" :false-value="0" color="primary" inset />
            </v-col>
            <v-col cols="12" md="4" class="switch-col">
              <v-switch v-model="form.fallowChild" label="允许新增下级" :true-value="1" :false-value="0" color="primary" inset />
            </v-col>
            <v-col cols="12" md="4" class="switch-col">
              <v-switch v-model="form.fmanualEntry" label="允许手工录入" :true-value="1" :false-value="0" color="primary" inset />
            </v-col>
            <v-col cols="12" md="4" class="switch-col">
              <v-switch v-model="form.fisEntry" label="允许凭证分录使用" :true-value="1" :false-value="0" color="primary" inset />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-6" elevation="2">
        <v-card-title>科目属性</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="3">
              <v-checkbox v-model="form.fcash" label="现金科目" :true-value="1" :false-value="0" color="primary" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-checkbox v-model="form.fbank" label="银行科目" :true-value="1" :false-value="0" color="primary" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-checkbox v-model="form.fequivalent" label="现金等价物" :true-value="1" :false-value="0" color="primary" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-checkbox v-model="form.fexchange" label="外币科目" :true-value="1" :false-value="0" color="primary" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-checkbox v-model="form.fnotice" label="往来通知" :true-value="1" :false-value="0" color="primary" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-checkbox v-model="form.fqtyAccounting" label="数量核算" :true-value="1" :false-value="0" color="primary" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="actions">
        <v-btn color="primary" @click="handleSave">保存</v-btn>
        <v-btn class="ml-3" variant="tonal" @click="goBack">取消</v-btn>
      </div>
    </v-form>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import accountSubjectApi, {
  createAccountSubject,
  editAccountSubject,
  getAccountSubjectDetail,
} from '@/api/accountSubject'
import { getBusinessUnitList } from '@/api/bizUnit'
import reportItemApi from '@/api/reportItem'
import reportTemplateApi from '@/api/reportTemplate'

const route = useRoute()
const router = useRouter()
const fid = route.params.fid

const accountTypeOptions = ['资产', '负债', '权益', '成本', '损益']
const directionOptions = ['借', '贷']
const profitLossTypeOptions = ['收入', '成本', '费用', '其他']
const entryControlOptions = ['借', '贷', '借或贷']
const controlLevelOptions = ['集团级', '组织级', '账簿级']

const valid = ref(false)
const formRef = ref()
const snackbar = reactive({ show: false, text: '', color: 'success' })
const subjects = ref([])
const reportItems = ref([])
const templates = ref([])
const businessUnits = ref([])

const isEdit = computed(() => !!fid)
const form = reactive(defaultForm())

const orgOptions = computed(() =>
  businessUnits.value.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname}`,
    value: item.fid,
  })),
)

const parentOptions = computed(() =>
  subjects.value
    .filter((item) => item.fid !== normalizeNumber(form.fid))
    .map((item) => ({
      label: `${item.fcode} - ${item.fname}`,
      value: item.fid,
    })),
)

const level1Options = computed(() =>
  subjects.value
    .filter((item) => !item.fparent)
    .map((item) => ({
      label: `${item.fcode} - ${item.fname}`,
      value: item.fid,
    })),
)

const templateNameMap = computed(() =>
  templates.value.reduce((acc, item) => {
    acc[item.fid] = item.fname || item.fcode || `模板${item.fid}`
    return acc
  }, {}),
)

const reportItemOptions = computed(() =>
  reportItems.value.map((item) => ({
    label: `${templateNameMap.value[item.ftemplateId] || '未命名模板'} / ${item.fname} (${item.fcode})`,
    value: item.fid,
  })),
)

watch(
  () => form.fparent,
  (parentId) => {
    const match = subjects.value.find((item) => item.fid === normalizeNumber(parentId))
    if (!match) return
    if (!form.flevel1) {
      form.flevel1 = match.flevel1 || match.fid
    }
    if (!form.forg && match.forg) {
      form.forg = match.forg
    }
  },
)

async function loadLookups() {
  const [subjectRes, reportItemRes, templateRes, businessUnitRes] = await Promise.all([
    accountSubjectApi.fetchList({ page: 1, size: 1000 }),
    reportItemApi.listReportItems({ page: 1, size: 1000 }),
    reportTemplateApi.fetchList({ page: 1, size: 200 }),
    getBusinessUnitList({ page: 1, size: 500 }),
  ])

  subjects.value = subjectRes.data?.records || []
  reportItems.value = reportItemRes.data?.records || []
  templates.value = templateRes.data?.records || []
  businessUnits.value = businessUnitRes.data?.records || []
}

async function fetchDetail() {
  if (!fid) return
  const res = await getAccountSubjectDetail(fid)
  hydrateForm(res.data || {})
}

async function handleSave() {
  const validation = await formRef.value?.validate?.()
  if (!validationPassed(validation)) return

  const payload = normalizePayload(form)
  try {
    if (isEdit.value) {
      await editAccountSubject(payload)
      showMsg('会计科目保存成功')
    } else {
      delete payload.fid
      await createAccountSubject(payload)
      showMsg('会计科目创建成功')
    }
    router.push('/finance/base-data/account-subject')
  } catch (error) {
    showMsg('会计科目保存失败', 'error')
  }
}

function goBack() {
  router.push('/finance/base-data/account-subject')
}

function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function defaultForm() {
  return {
    fid: null,
    fcode: '',
    fname: '',
    forg: null,
    flongName: '',
    ftype: '资产',
    fparent: null,
    fpltype: '',
    fdirection: '借',
    fisDetail: 1,
    freportItem: null,
    flevel1: null,
    fentryControl: '借或贷',
    fcontrolLevel: '',
    fallowChild: 0,
    fmanualEntry: 1,
    fcash: 0,
    fbank: 0,
    fequivalent: 0,
    fisEntry: 1,
    fnotice: 0,
    fexchange: 0,
    fqtyAccounting: 0,
  }
}

function hydrateForm(source) {
  Object.assign(form, defaultForm(), {
    ...source,
    fid: normalizeNumber(source.fid),
    forg: normalizeNumber(source.forg),
    fparent: normalizeNumber(source.fparent),
    freportItem: normalizeNumber(source.freportItem),
    flevel1: normalizeNumber(source.flevel1),
    fisDetail: normalizeFlag(source.fisDetail, 1),
    fallowChild: normalizeFlag(source.fallowChild, 0),
    fmanualEntry: normalizeFlag(source.fmanualEntry, 1),
    fcash: normalizeFlag(source.fcash, 0),
    fbank: normalizeFlag(source.fbank, 0),
    fequivalent: normalizeFlag(source.fequivalent, 0),
    fisEntry: normalizeFlag(source.fisEntry, 1),
    fnotice: normalizeFlag(source.fnotice, 0),
    fexchange: normalizeFlag(source.fexchange, 0),
    fqtyAccounting: normalizeFlag(source.fqtyAccounting, 0),
  })
}

function normalizePayload(source) {
  return {
    ...source,
    fid: normalizeNumber(source.fid),
    forg: normalizeNumber(source.forg),
    fparent: normalizeNumber(source.fparent),
    freportItem: normalizeNumber(source.freportItem),
    flevel1: normalizeNumber(source.flevel1),
    fcode: source.fcode?.trim?.() || '',
    fname: source.fname?.trim?.() || '',
    flongName: source.flongName?.trim?.() || '',
    fpltype: source.fpltype || '',
    fcontrolLevel: source.fcontrolLevel?.trim?.() || '',
    fisDetail: normalizeFlag(source.fisDetail, 1),
    fallowChild: normalizeFlag(source.fallowChild, 0),
    fmanualEntry: normalizeFlag(source.fmanualEntry, 1),
    fcash: normalizeFlag(source.fcash, 0),
    fbank: normalizeFlag(source.fbank, 0),
    fequivalent: normalizeFlag(source.fequivalent, 0),
    fisEntry: normalizeFlag(source.fisEntry, 1),
    fnotice: normalizeFlag(source.fnotice, 0),
    fexchange: normalizeFlag(source.fexchange, 0),
    fqtyAccounting: normalizeFlag(source.fqtyAccounting, 0),
  }
}

function normalizeNumber(value) {
  if (value === '' || value === undefined || value === null) return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function normalizeFlag(value, fallback = 0) {
  if (value === '' || value === undefined || value === null) return fallback
  if (value === true) return 1
  if (value === false) return 0
  return Number(value) === 1 ? 1 : 0
}

function validationPassed(result) {
  if (result === undefined) return true
  if (typeof result === 'boolean') return result
  return result.valid !== false
}

const requiredRule = (value) => value !== null && value !== undefined && value !== '' || '必填'

onMounted(async () => {
  await Promise.all([loadLookups(), fetchDetail()])
})
</script>

<style scoped>
.account-subject-form-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  color: #24344d;
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
}

.switch-col {
  display: flex;
  align-items: center;
}

.actions {
  margin-top: 24px;
  text-align: right;
}
</style>
