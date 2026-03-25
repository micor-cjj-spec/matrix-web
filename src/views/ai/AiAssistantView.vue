<template>
  <v-container fluid class="ai-page pa-6">
    <v-row>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="d-flex align-center justify-space-between">
            会话
            <v-btn size="small" color="primary" variant="tonal" @click="createConversationAction">新建</v-btn>
          </v-card-title>
          <v-divider />

          <div class="px-4 py-3 border-b status-bar">
            <div class="text-caption text-medium-emphasis">模型状态</div>
            <div class="d-flex align-center justify-space-between mt-1">
              <div>
                <div class="text-body-2 font-weight-medium">{{ configStatus.model || '未识别模型' }}</div>
                <div class="text-caption text-medium-emphasis">{{ configModeText }}</div>
              </div>
              <v-chip :color="configStatus.configured ? 'success' : 'warning'" size="small" variant="tonal">
                {{ configStatus.configured ? '已配置' : '未配置' }}
              </v-chip>
            </div>
          </div>

          <v-list>
            <v-list-item
              v-for="item in conversations"
              :key="item.id"
              :active="item.id === activeConversationId"
              @click="selectConversation(item.id)"
            >
              <template #prepend>
                <v-icon size="18">mdi-message-text-outline</v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card class="h-100 d-flex flex-column" variant="outlined">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>AI 助手（完整版）</span>
            <v-btn variant="text" size="small" @click="clearCurrentMessages" :disabled="!activeConversationId || activeMessages.length === 0">
              清空当前会话显示
            </v-btn>
          </v-card-title>
          <v-divider />

          <v-card-text class="flex-grow-1 overflow-y-auto message-panel">
            <div v-if="activeMessages.length === 0" class="empty-state">
              还没有消息，发一句开始吧。
            </div>
            <div
              v-for="(msg, index) in activeMessages"
              :key="index"
              :class="['msg', msg.role]"
            >
              <div class="msg-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
              <div class="msg-text">{{ msg.text }}</div>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="d-block pa-4">
            <v-textarea
              v-model="input"
              variant="outlined"
              rows="2"
              auto-grow
              hide-details
              placeholder="输入问题，Enter 发送"
              @keydown.enter.exact.prevent="send"
            />
            <div class="d-flex justify-space-between align-center mt-2 flex-wrap ga-2">
              <div class="text-caption text-medium-emphasis">
                {{ configStatus.configured ? '当前已接入真实模型，可多轮连续对话。' : '当前仍是降级模式，请检查 AI_API_KEY / AI_BASE_URL / AI_CHAT_MODEL。' }}
              </div>
              <v-btn color="primary" :loading="sending" @click="send">发送</v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { chatWithAi, createConversation, getAiConfigStatus, getConversationMessages } from '@/api/ai'

const conversations = ref([])
const activeConversationId = ref('')
const input = ref('')
const sending = ref(false)
const messages = ref({})
const configStatus = ref({ configured: false, model: '', mode: 'fallback' })

const activeMessages = computed(() => messages.value[activeConversationId.value] || [])
const configModeText = computed(() => {
  if (configStatus.value.mode === 'real-model') return '真实模型模式'
  if (configStatus.value.mode === 'fallback') return '降级占位模式'
  return configStatus.value.mode || '未知模式'
})

async function refreshConfigStatus() {
  try {
    const resp = await getAiConfigStatus()
    configStatus.value = resp?.data || configStatus.value
  } catch (error) {
    configStatus.value = { configured: false, model: '读取失败', mode: 'error' }
  }
}

async function createConversationAction() {
  const seq = conversations.value.length + 1
  const resp = await createConversation({ title: `新会话 ${seq}`, scene: 'knowledge_qa' })
  const id = resp?.data?.conversationId
  const title = resp?.data?.title || `新会话 ${seq}`
  if (!id) return

  conversations.value.unshift({ id, title })
  messages.value[id] = [{ role: 'assistant', text: '你好，我已经准备好了。你可以继续追问，不用每次重复背景。' }]
  activeConversationId.value = id
}

async function selectConversation(conversationId) {
  activeConversationId.value = conversationId
  if (!messages.value[conversationId] || messages.value[conversationId].length === 0) {
    await loadMessages(conversationId)
  }
}

async function loadMessages(conversationId) {
  try {
    const resp = await getConversationMessages(conversationId)
    const list = resp?.data?.messages || []
    messages.value[conversationId] = list.map(item => ({ role: item.role, text: item.content }))
  } catch (e) {
    if (!messages.value[conversationId]) {
      messages.value[conversationId] = [{ role: 'assistant', text: '历史消息加载失败，请稍后重试。' }]
    }
  }
}

function clearCurrentMessages() {
  if (!activeConversationId.value) return
  messages.value[activeConversationId.value] = []
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  const conversationId = activeConversationId.value
  if (!conversationId) return

  if (!messages.value[conversationId]) {
    messages.value[conversationId] = []
  }

  messages.value[conversationId].push({ role: 'user', text })
  input.value = ''
  sending.value = true

  try {
    const resp = await chatWithAi({
      conversationId,
      userMessage: text,
      kbIds: ['default'],
      stream: false,
    })
    const answer = resp?.data?.answer || '抱歉，暂时没有生成回复。'
    messages.value[conversationId].push({ role: 'assistant', text: answer })
    if (resp?.data?.mode) {
      configStatus.value.mode = resp.data.mode
      if (resp.data.mode === 'real-model') {
        configStatus.value.configured = true
      }
    }
  } catch (e) {
    messages.value[conversationId].push({ role: 'assistant', text: 'AI 服务暂不可用，请稍后重试。' })
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await refreshConfigStatus()
  await createConversationAction()
})
</script>

<style scoped>
.ai-page {
  min-height: calc(100vh - 64px);
  background: #f7f9fc;
}

.status-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.message-panel {
  background: linear-gradient(180deg, #fafcff 0%, #f7f9fc 100%);
}

.empty-state {
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
  padding: 48px 12px;
}

.msg {
  max-width: 82%;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 12px;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.msg-role {
  font-size: 12px;
  opacity: 0.65;
  margin-bottom: 4px;
}

.msg-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.msg.user {
  margin-left: auto;
  background: #e8f1ff;
}

.msg.assistant {
  background: #ffffff;
}
</style>
