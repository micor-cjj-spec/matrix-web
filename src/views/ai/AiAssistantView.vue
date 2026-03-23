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
          <v-list>
            <v-list-item
              v-for="item in conversations"
              :key="item.id"
              :active="item.id === activeConversationId"
              @click="selectConversation(item.id)"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card class="h-100 d-flex flex-column" variant="outlined">
          <v-card-title>AI 助手（完整版）</v-card-title>
          <v-divider />

          <v-card-text class="flex-grow-1 overflow-y-auto">
            <div
              v-for="(msg, index) in activeMessages"
              :key="index"
              :class="['msg', msg.role]"
            >
              {{ msg.text }}
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
            <div class="d-flex justify-space-between mt-2">
              <div class="text-caption text-medium-emphasis">当前已接入 /api/ai/chat 接口。</div>
              <v-btn color="primary" @click="send">发送</v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { chatWithAi, createConversation, getConversationMessages } from '@/api/ai'

const conversations = ref([])
const activeConversationId = ref('')
const input = ref('')
const sending = ref(false)
const messages = ref({})

const activeMessages = computed(() => messages.value[activeConversationId.value] || [])

async function createConversationAction() {
  const resp = await createConversation({ title: '新会话', scene: 'knowledge_qa' })
  const id = resp?.data?.conversationId
  const title = resp?.data?.title || '新会话'
  if (!id) return

  conversations.value.unshift({ id, title })
  messages.value[id] = [{ role: 'assistant', text: '新会话已创建。' }]
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

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  const conversationId = activeConversationId.value
  if (!conversationId) return

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
  } catch (e) {
    messages.value[conversationId].push({ role: 'assistant', text: 'AI 服务暂不可用，请稍后重试。' })
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await createConversationAction()
})
</script>

<style scoped>
.ai-page {
  min-height: calc(100vh - 64px);
  background: #f7f9fc;
}
.msg {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  line-height: 1.5;
}
.msg.user {
  margin-left: auto;
  background: #e8f1ff;
}
.msg.assistant {
  background: #f2f2f2;
}
</style>
