<!-- Copy into src/views and replace every TODO(matrix) placeholder. -->
<template>
  <v-container fluid class="page-shell">
    <div class="page-header">
      <div>
        <h1 class="text-h5 font-weight-bold">{{ pageTitle }}</h1>
        <p class="text-body-2 text-medium-emphasis">TODO(matrix): 说明业务对象、组织、账簿或期间范围。</p>
      </div>
      <v-btn variant="outlined" @click="goBack">返回</v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <v-card variant="outlined" :loading="loading">
      <v-card-text>
        <v-form ref="formRef" :disabled="readOnly || saving" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.number" label="编号" :rules="requiredRules" maxlength="64" counter />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.trim="form.name" label="名称" :rules="requiredRules" maxlength="120" counter />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.amount"
                label="金额"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                :rules="amountRules"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.remark" label="说明" rows="4" maxlength="500" counter />
            </v-col>
          </v-row>

          <div v-if="!readOnly" class="d-flex ga-2 justify-end">
            <v-btn variant="outlined" :disabled="saving" @click="handleReset">重置</v-btn>
            <v-btn color="primary" type="submit" :loading="saving">保存</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
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
const requiredRules = [(value) => Boolean(String(value ?? '').trim()) || '该字段不能为空']
const amountRules = [
  (value) => value !== null && value !== undefined && value !== '' || '请输入金额',
  (value) => Number(value) >= 0 || '金额不能小于 0',
]

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
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  saving.value = true
  try {
    const payload = {
      number: form.number,
      name: form.name,
      amount: form.amount === null || form.amount === '' ? null : String(form.amount),
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
    formRef.value?.resetValidation()
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
@media (max-width: 960px) {
  .page-header { flex-direction: column; }
}
</style>
