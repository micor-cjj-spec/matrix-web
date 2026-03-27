<template>
  <div class="account-subject-form-page">
    <h2 class="title">{{ isEdit ? '编辑科目' : '创建科目' }}</h2>
    <v-form ref="formRef" v-model="valid">
      <v-card class="mb-6" elevation="2">
        <v-card-title>基本信息</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fcode" label="编码" :rules="[v=>!!v||'必填']" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fname" label="名称" :rules="[v=>!!v||'必填']" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.forg" :items="orgOptions" label="核算组织" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.flongName" label="长名称" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.ftype" :items="acctTypeOptions" label="科目类型" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="form.fparent" :items="subjectOptions" label="上级" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fpltype" :items="profitLossOptions" label="损益类型" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fdirection" :items="['借','贷']" label="余额方向" required />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch v-model="form.fisDetail" label="明细科目" />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="form.freportItem" :items="reportItemOptions" label="报表项目" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="form.flevel1" :items="level1Options" label="一级科目" clearable />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-6" elevation="2">
        <v-card-title>控制信息</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select v-model="form.fentryControl" :items="entryControlOptions" label="科目录入方向控制" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fcontrolLevel" :items="controlLevelOptions" label="控制级次" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch v-model="form.fallowChild" label="允许公司增加下级科目" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch v-model="form.fmanualEntry" label="手工录入" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-6" elevation="2">
        <v-card-title>科目属性</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fcash" label="现金科目" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fbank" label="银行科目" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fequivalent" label="现金等价物" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fisEntry" label="登记记账" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fnotice" label="往来通知" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fexchange" label="期末调汇" />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-checkbox v-model="form.fqtyAccounting" label="数量核算" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="actions">
        <v-btn color="primary" @click="handleSave">保存</v-btn>
        <v-btn class="ml-3" @click="goBack">取消</v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getAccountSubjectDetail,
  createAccountSubject,
  editAccountSubject,
} from '@/api/accountSubject'

const route = useRoute()
const router = useRouter()
const fid = route.params.fid

const fields = [
  'fid','fcode','fname','forg','flongName','ftype','fparent','fpltype','fdirection','fisDetail',
  'freportItem','flevel1','fentryControl','fcontrolLevel','fallowChild','fmanualEntry',
  'fcash','fbank','fequivalent','fisEntry','fnotice','fexchange','fqtyAccounting',
]

const form = reactive(Object.fromEntries(fields.map(k => [k, ''])))
const valid = ref(false)
const formRef = ref()

const orgOptions = ref([])
const acctTypeOptions = ref(['资产','负债','权益','成本','损益'])
const subjectOptions = ref([])
const profitLossOptions = ref([])
const entryControlOptions = ref(['借','贷','借或贷'])
const controlLevelOptions = ref([])
const reportItemOptions = ref([])
const level1Options = ref([])

const isEdit = computed(() => !!fid)

async function fetchDetail() {
  if (!fid) return
  const res = await getAccountSubjectDetail(fid)
  Object.assign(form, res.data || {})
}

async function handleSave() {
  const ok = await formRef.value?.validate?.()
  if (!ok) return
  if (fid) {
    await editAccountSubject({ ...form, fid })
  } else {
    const data = { ...form }
    delete data.fid
    await createAccountSubject(data)
  }
  router.push('/finance/base-data/account-subject')
}

function goBack() {
  router.push('/finance/base-data/account-subject')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.account-subject-form-page { padding: 24px; }
.title { font-size: 22px; font-weight: bold; color: #27324c; margin-bottom: 20px; }
.actions { text-align: right; margin-top: 24px; }
</style>

