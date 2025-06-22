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

    <UserFormDialog
      v-model:visible="dialog.visible"
      :mode="dialog.mode"
      :user="dialog.user"
      :loading="formLoading"
      @submit="handleFormSubmit"
      @cancel="closeDialog"
    />

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
import { ref, reactive, onMounted } from 'vue'
import UserFormDialog from './UserFormDialog.vue'
import { usePersonal } from '@/composables/login/enterprise-modeling/persion/usePersonal.js'

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
  user: null,
})
const formLoading = ref(false)

function openCreateDialog() {
  dialog.visible = true
  dialog.mode = 'create'
  dialog.user = null
}
function openEditDialog(person) {
  dialog.visible = true
  dialog.mode = 'edit'
  dialog.user = person
}
function closeDialog() {
  dialog.visible = false
}
async function handleFormSubmit(user) {
  formLoading.value = true
  try {
    if (dialog.mode === 'create') {
      await createPersonal(user)
      showMsg('创建成功', 'success')
    } else {
      await editPersonal(user)
      showMsg('人员信息已更新', 'success')
    }
    closeDialog()
  } finally {
    formLoading.value = false
  }
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
