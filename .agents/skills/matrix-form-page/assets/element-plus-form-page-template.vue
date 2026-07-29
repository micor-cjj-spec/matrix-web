<!-- Copy into src/views and replace every TODO(matrix) placeholder. -->
<template>
  <section class="page-shell">
    <header class="page-header">
      <div>
        <h1>{{ pageTitle }}</h1>
        <p>TODO(matrix): 说明业务对象、组织、账簿或期间范围。</p>
      </div>
      <el-button @click="goBack">返回</el-button>
    </header>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon closable class="state-block" />

    <el-card v-loading="loading" shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        :disabled="readOnly || saving"
      >
        <el-form-item label="编号" prop="number">
          <el-input v-model.trim="form.number" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="form.name" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :precision="2" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>

        <el-form-item v-if="!readOnly">
          <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
          <el-button :disabled="saving" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
// TODO(matrix): replace with the owning feature API module.
import { createRecord, getRecord, updateRecord } from '@/api/replace-with-feature-api'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const saving = ref(false)
const dirty = ref(false)
const errorMessage = ref('')
let initialSnapshot = ''

const recordId = computed(() => route.params.id || null)
const mode = computed(() => String(route.meta?.mode || (recordId.value ? 'edit' : 'create')))
const readOnly = computed(() => mode.value === 'view')
const pageTitle = computed(() => ({ create: '新增 TODO(matrix)', edit: '编辑 TODO(matrix)', view: '查看 TODO(matrix)' })[mode.value] || 'TODO(matrix)')

const emptyForm = () => ({ number: '', name: '', amount: null, remark: '' })
const form = reactive(emptyForm())
const rules = {
  number: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'change' }],
}

function snapshot() {
  return JSON.stringify(form)
}

watch(form, () => {
  dirty.value = snapshot() !== initialSnapshot
}, { deep: true })

async function loadDetail() {
  if (!recordId.value) {
    initialSnapshot = snapshot()
    dirty.value = false
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getRecord(recordId.value)
    // TODO(matrix): normalize using the actual ApiResponse contract.
    const data = response?.data?.data ?? response?.data ?? {}
    Object.assign(form, emptyForm(), data)
    initialSnapshot = snapshot()
    dirty.value = false
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error?.message || '数据加载失败'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (saving.value || readOnly.value) return
  errorMessage.value = ''
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = {
      number: form.number,
      name: form.name,
      // Keep decimal values as strings when the backend contract requires exact transport precision.
      amount: form.amount === null ? null : String(form.amount),
      remark: form.remark || null,
    }
    if (recordId.value) {
      await updateRecord(recordId.value, payload)
    } else {
      await createRecord(payload)
    }
    initialSnapshot = snapshot()
    dirty.value = false
    goBack()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error?.message || '保存失败，请检查数据状态后重试'
  } finally {
    saving.value = false
  }
}

function handleReset() {
  if (recordId.value) {
    loadDetail()
  } else {
    Object.assign(form, emptyForm())
    initialSnapshot = snapshot()
    dirty.value = false
    formRef.value?.clearValidate()
  }
}

function goBack() {
  router.back()
}

onBeforeRouteLeave(() => {
  if (!dirty.value || saving.value || readOnly.value) return true
  return window.confirm('当前修改尚未保存，确定离开吗？')
})

onMounted(loadDetail)
</script>

<style scoped>
.page-shell { padding: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.page-header h1 { margin: 0 0 6px; font-size: 22px; }
.page-header p { margin: 0; color: var(--el-text-color-secondary); }
.state-block { margin-bottom: 16px; }
</style>
