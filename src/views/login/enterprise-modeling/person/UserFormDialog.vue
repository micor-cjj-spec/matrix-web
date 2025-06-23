<template>
  <v-dialog v-model="visible" max-width="800" persistent>
    <v-card>
      <v-card-title class="text-h6">
        <div style="display:flex;align-items:center;">
          <div class="avatar-box" v-if="form.favatar" style="margin-right:18px;">
            <v-avatar size="70" rounded="0">
              <img :src="form.favatar" alt="头像" style="object-fit:cover;" />
            </v-avatar>
          </div>
          {{ mode === 'edit' ? '编辑人员' : '创建人员' }}
        </div>
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="valid">
          <v-row dense>
            <!-- 头像上传（靠前） -->
            <v-col cols="12" md="6">
              <v-file-input
                  v-model="form.favatarFile"
                  label="头像上传"
                  prepend-icon="mdi-camera"
                  accept="image/*"
                  @change="handleAvatarChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fheadsculpture" label="个性头像URL" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.ftruename" label="真实姓名" :rules="[v=>!!v||'必填']" required />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fnickname" label="昵称" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fgender" :items="['男','女','其他']" label="性别" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fphone" label="手机号" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.femail" label="邮箱" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fidcard" label="身份证号" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fnumber" label="工号" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fdptid" label="部门ID" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fpositionid" label="岗位ID" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fstatus" :items="['启用','停用','草稿','离职']" label="数据状态" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fenable" :items="['Y','N']" label="是否启用" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fsource" :items="['manual','import','register','sync']" label="来源" clearable />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.fmaintain" :items="['手动','接口']" label="维护方式" clearable />
            </v-col>
            <!-- 入职日期 -->
            <v-col cols="12" md="6">
              <v-menu v-model="hiredateMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto">
                <template #activator="{ props }">
                  <v-text-field
                      v-model="hiredateFormatted"
                      label="入职日期"
                      readonly
                      v-bind="props"
                  />
                </template>
                <v-date-picker v-model="form.fhiredate" @input="hiredateMenu = false" />
              </v-menu>
            </v-col>
            <!-- 出生日期 -->
            <v-col cols="12" md="6">
              <v-menu v-model="birthdayMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto">
                <template #activator="{ props }">
                  <v-text-field
                      v-model="birthdayFormatted"
                      label="出生日期"
                      readonly
                      v-bind="props"
                  />
                </template>
                <v-date-picker v-model="form.fbirthday" @input="birthdayMenu = false" />
              </v-menu>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fcountryid" label="国家ID" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fsortcode" label="排序编号" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fbillssatusfield" label="单据状态字段" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.ffullpinyin" label="姓名全拼" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fsimplepinyin" label="拼音缩写" />
            </v-col>
            <!-- 只读：用户ID -->
            <v-col cols="12" md="6">
              <v-text-field v-model="form.fid" label="用户ID" readonly />
            </v-col>
            <!-- 可补充其他字段 -->
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="onCancel">取消</v-btn>
        <v-btn color="primary" :loading="loading" @click="onSubmit">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  mode: String, // 'create' or 'edit'
  user: Object,
  loading: Boolean,
})
const emit = defineEmits(['update:visible', 'submit', 'cancel'])

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})
const valid = ref(false)
const formRef = ref()
const mode = computed(() => props.mode)

const form = ref({
  fid: null,
  ftid: '',
  fnumber: '',
  fphone: '',
  femail: '',
  fstatus: '',
  fgender: '',
  fbirthday: '',
  fidcard: '',
  favatar: '',
  favatarFile: null,
  fnickname: '',
  ffullpinyin: '',
  fsimplepinyin: '',
  fdptid: '',
  fpositionid: '',
  fsortcode: '',
  fbillssatusfield: '',
  fhiredate: '',
  fenable: '',
  fsource: '',
  fmaintain: '',
  fheadsculpture: '',
  ftruename: '',
  fcountryid: '',
})

watch(() => props.user, (val) => {
  if (props.mode === 'edit' && val) {
    Object.assign(form.value, val)
  } else {
    Object.keys(form.value).forEach(key => form.value[key] = '')
    form.value.fid = null
  }
  form.value.favatarFile = null
}, { immediate: true })

// 日期处理
const birthdayMenu = ref(false)
const hiredateMenu = ref(false)
const birthdayFormatted = computed(() =>
    form.value.fbirthday ? (typeof form.value.fbirthday === 'string'
            ? form.value.fbirthday.slice(0, 10)
            : form.value.fbirthday?.toISOString?.().slice(0, 10) || ''
    ) : ''
)
const hiredateFormatted = computed(() =>
    form.value.fhiredate ? (typeof form.value.fhiredate === 'string'
            ? form.value.fhiredate.slice(0, 10)
            : form.value.fhiredate?.toISOString?.().slice(0, 10) || ''
    ) : ''
)

// 头像图片选择
function handleAvatarChange(files) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    form.value.favatar = e.target.result
  }
  reader.readAsDataURL(file)
}

async function onSubmit() {
  const validForm = await formRef.value?.validate?.()
  if (!validForm) return
  emit('submit', { ...form.value })
}
function onCancel() {
  emit('cancel')
  visible.value = false
}
</script>

<style scoped>
.avatar-box {
  border: 1px solid #eee;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  width: 70px;
  height: 70px;
  overflow: hidden;
  margin-top: 2px;
}
</style>
