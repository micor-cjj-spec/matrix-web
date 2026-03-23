<template>
  <v-container fluid class="ai-page pa-6">
    <v-row>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="d-flex align-center justify-space-between">
            会话
            <v-btn size="small" color="primary" variant="tonal" @click="createConversation">新建</v-btn>
          </v-card-title>
          <v-divider />
          <v-list>
            <v-list-item
              v-for="item in conversations"
              :key="item.id"
              :active="item.id === activeConversationId"
              @click="activeConversationId = item.id"
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
              <div class="text-caption text-medium-emphasis">提示：当前为前端页面骨架，后续接 AI 接口。</div>
              <v-btn color="primary" @click="send">发送</v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'

const conversations = ref([
  { id: 'c1', title: '默认会话' },
])
const activeConversationId = ref('c1')
const input = ref('')
const messages = ref({
  c1: [{ role: 'assistant', text: '欢迎使用 AI 助手完整版。' }],
})

const activeMessages = computed(() => messages.value[activeConversationId.value] || [])

function createConversation() {
  const id = `c${Date.now()}`
  conversations.value.unshift({ id, title: '新会话' })
  messages.value[id] = [{ role: 'assistant', text: '新会话已创建。' }]
  activeConversationId.value = id
}

function send() {
  const text = input.value.trim()
  if (!text) return

  if (!messages.value[activeConversationId.value]) messages.value[activeConversationId.value] = []
  messages.value[activeConversationId.value].push({ role: 'user', text })
  messages.value[activeConversationId.value].push({ role: 'assistant', text: '已收到。这里后续会接入后端 /api/ai/chat。' })
  input.value = ''
}
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
