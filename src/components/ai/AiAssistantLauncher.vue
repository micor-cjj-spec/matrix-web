<template>
  <div v-if="showLauncher">
    <v-btn
      class="ai-float-btn"
      color="primary"
      size="large"
      elevation="8"
      icon="mdi-robot-happy-outline"
      @click="drawer = true"
    />

    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      width="420"
      class="ai-drawer"
    >
      <div class="ai-header">
        <div class="text-h6 font-weight-bold">AI 助手</div>
        <div class="text-body-2 text-medium-emphasis">快速问答入口</div>
      </div>

      <v-divider />

      <div class="ai-messages">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['msg', msg.role]"
        >
          {{ msg.text }}
        </div>
      </div>

      <div class="ai-input-wrap">
        <v-textarea
          v-model="question"
          placeholder="输入问题，例如：本月应付异常有哪些？"
          rows="2"
          auto-grow
          variant="outlined"
          hide-details
          @keydown.enter.exact.prevent="handleAsk"
        />
        <div class="ai-actions">
          <v-btn variant="text" @click="goFullPage">进入完整版</v-btn>
          <v-btn color="primary" @click="handleAsk">发送</v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const drawer = ref(false)
const question = ref('')
const messages = ref([
  { role: 'assistant', text: '你好，我是 AI 助手。你可以先问我业务流程、报表口径或系统功能。' },
])

const showLauncher = computed(() => {
  const hiddenPaths = ['/', '/login', '/register']
  if (hiddenPaths.includes(route.path)) return false
  return !!localStorage.getItem('token')
})

function handleAsk() {
  const content = question.value.trim()
  if (!content) return

  messages.value.push({ role: 'user', text: content })
  messages.value.push({ role: 'assistant', text: '已收到。当前是前端占位回复，后续会接入 /api/ai/chat 实时回答。' })
  question.value = ''
}

function goFullPage() {
  drawer.value = false
  router.push('/ai/assistant')
}
</script>

<style scoped>
.ai-float-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1006;
}

.ai-drawer {
  z-index: 1007;
}

.ai-header {
  padding: 16px;
}

.ai-messages {
  padding: 16px;
  height: calc(100% - 220px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg {
  max-width: 90%;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.msg.user {
  align-self: flex-end;
  background: #e8f1ff;
}

.msg.assistant {
  align-self: flex-start;
  background: #f5f5f5;
}

.ai-input-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #eee;
}

.ai-actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
}
</style>
