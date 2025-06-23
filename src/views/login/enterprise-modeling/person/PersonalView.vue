<template>
  <div class="personal-page">
    <v-card elevation="4" class="pa-6">
      <div class="header">
        <h2 class="title">人员管理</h2>
        <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">
          创建人员
        </v-btn>
      </div>

      <v-data-table
          :headers="headers"
          :items="personalList"
          :loading="loading"
          loading-text="加载中..."
          class="elevation-0"
          item-key="fid"
          hide-default-footer
          dense
      >
        <template #item.actions="{ item }">
          <v-btn size="small" color="primary" @click="openEditDialog(item)" variant="tonal">编辑</v-btn>
          <v-btn size="small" color="error" @click="openDeleteDialog(item)" variant="tonal" class="ml-1">删除</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 创建/编辑人员弹窗 -->
    <v-dialog v-model="dialog.visible" max-width="820" persistent>
      <v-card>
        <v-card-title class="d-flex align-center" style="gap:20px;">
          <v-avatar size="70" rounded="0" class="avatar-box">
            <img v-if="dialog.form.favatar" :src="dialog.form.favatar" style="object-fit:cover;" alt=""/>
            <div v-else style="width:100%;height:100%;background:#ececec;" />
          </v-avatar>
          <v-file-input
              v-model="dialog.form.favatarFile"
              label="头像上传"
              prepend-icon="mdi-camera"
              accept="image/*"
              @change="handleAvatarChange"
              hide-details
              dense
              style="max-width:200px;"
          />
          <span style="font-weight:bold;margin-left:18px;">
            {{ dialog.mode === 'create' ? '创建人员' : '编辑人员' }}
          </span>
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="dialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.ftruename" label="真实姓名" :rules="[v=>!!v||'必填']" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fnickname" label="昵称" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fgender" :items="['男','女','其他']" label="性别" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fphone" label="手机号" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.femail" label="邮箱" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fidcard" label="身份证号" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fnumber" label="工号" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fdptid" label="部门ID" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fpositionid" label="岗位ID" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fstatus" :items="['启用','停用','草稿','离职']" label="数据状态" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fenable" :items="['Y','N']" label="是否启用" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fsource" :items="['manual','import','register','sync']" label="来源" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="dialog.form.fmaintain" :items="['手动','接口']" label="维护方式" clearable />
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
                  <v-date-picker v-model="dialog.form.fhiredate" @input="hiredateMenu = false" />
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
                  <v-date-picker v-model="dialog.form.fbirthday" @input="birthdayMenu = false" />
                </v-menu>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fcountryid" label="国家ID" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fsortcode" label="排序编号" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fbillssatusfield" label="单据状态字段" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.ffullpinyin" label="姓名全拼" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fsimplepinyin" label="拼音缩写" />
              </v-col>
              <!-- 只读：用户ID -->
              <v-col cols="12" md="6">
                <v-text-field v-model="dialog.form.fid" label="用户ID" readonly />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">取消</v-btn>
          <v-btn variant="text" color="primary" @click="handleConfirm">
            {{ dialog.mode === 'create' ? '创建' : '保存' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认弹窗 -->
    <v-dialog v-model="deleteDialog.visible" max-width="350">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>确认删除人员 <b>{{ deleteDialog.person?.ftruename }}</b>？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="handleDeletePersonal">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { usePersonal } from '@/composables/login/enterprise-modeling/person/usePersonal.js'

const {
  personalList,
  loading,
  fetchPersonalList,
  createPersonal,
  editPersonal,
  deletePersonal,
} = usePersonal()

const headers = ref([
  { title: '真实姓名', value: 'ftruename', align: 'start' },
  { title: '性别', value: 'fgender' },
  { title: '手机号', value: 'fphone' },
  { title: '邮箱', value: 'femail' },
  { title: '工号', value: 'fnumber' },
  { title: '部门ID', value: 'fdptid' },
  { title: '岗位ID', value: 'fpositionid' },
  { title: '状态', value: 'fstatus' },
  { title: '入职日期', value: 'fhiredate' },
  { title: '操作', value: 'actions', sortable: false, align: 'center', width: 150 },
])

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
})

const dialog = reactive({
  visible: false,
  mode: 'create',
  form: {
    fid: null, ftid: '', ftruename: '', fnickname: '', fgender: '', fphone: '', femail: '',
    fidcard: '', fnumber: '', fdptid: '', fpositionid: '', fstatus: '', fenable: '',
    fsource: '', fmaintain: '', favatar: '', favatarFile: null,
    fhiredate: '', fbirthday: '', fcountryid: '', fsortcode: '', fbillssatusfield: '',
    ffullpinyin: '', fsimplepinyin: '',
  },
  valid: false,
  personRef: null,
})
const formRef = ref()

const hiredateMenu = ref(false)
const birthdayMenu = ref(false)
const hiredateFormatted = computed(() =>
    dialog.form.fhiredate
        ? (typeof dialog.form.fhiredate === 'string'
            ? dialog.form.fhiredate.slice(0, 10)
            : dialog.form.fhiredate?.toISOString?.().slice(0, 10) || '')
        : ''
)
const birthdayFormatted = computed(() =>
    dialog.form.fbirthday
        ? (typeof dialog.form.fbirthday === 'string'
            ? dialog.form.fbirthday.slice(0, 10)
            : dialog.form.fbirthday?.toISOString?.().slice(0, 10) || '')
        : ''
)

function handleAvatarChange(files) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    dialog.form.favatar = e.target.result
  }
  reader.readAsDataURL(file)
}

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  Object.assign(dialog.form, {
    fid: null, ftid: '', ftruename: '', fnickname: '', fgender: '', fphone: '', femail: '',
    fidcard: '', fnumber: '', fdptid: '', fpositionid: '', fstatus: '', fenable: '',
    fsource: '', fmaintain: '', favatar: '', favatarFile: null,
    fhiredate: '', fbirthday: '', fcountryid: '', fsortcode: '', fbillssatusfield: '',
    ffullpinyin: '', fsimplepinyin: '',
  })
  dialog.personRef = null
}
function openEditDialog(person) {
  dialog.visible = true
  dialog.mode = 'edit'
  Object.assign(dialog.form, {
    ...person,
    favatarFile: null
  })
  dialog.personRef = person
}
function closeDialog() {
  dialog.visible = false
  dialog.personRef = null
}
async function handleConfirm() {
  const validForm = await formRef.value?.validate?.()
  if (!validForm) return
  if (dialog.mode === 'create') {
    await createPersonal({ ...dialog.form })
    showMsg('创建成功', 'success')
  } else {
    await editPersonal({ ...dialog.form })
    showMsg('人员信息已更新', 'success')
  }
  closeDialog()
}

const deleteDialog = reactive({
  visible: false,
  person: null,
})
function openDeleteDialog(person) {
  deleteDialog.visible = true
  deleteDialog.person = person
}
async function handleDeletePersonal() {
  await deletePersonal(deleteDialog.person)
  showMsg('删除成功', 'success')
  deleteDialog.visible = false
}
function showMsg(text, color = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
onMounted(() => {
  fetchPersonalList()
})
</script>

<style scoped>
.personal-page {
  padding: 24px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.title {
  font-size: 22px;
  font-weight: bold;
  color: #27324c;
  letter-spacing: 2px;
}
.avatar-box {
  border: 1px solid #eee;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  width: 70px;
  height: 70px;
  overflow: hidden;
}
</style>
