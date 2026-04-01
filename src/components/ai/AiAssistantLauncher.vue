<template>
  <div v-if="showLauncher">
    <v-btn
      class="ai-float-btn"
      :style="floatBtnStyle"
      color="primary"
      size="large"
      elevation="8"
      icon="mdi-robot-happy-outline"
      @pointerdown="handlePointerDown"
      @click="handleLauncherClick"
    />

    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      width="420"
      class="ai-drawer"
    >
      <div class="ai-header">
        <div>
          <div class="text-h6 font-weight-bold">AI 助手</div>
          <div class="text-body-2 text-medium-emphasis">快速问答入口</div>
        </div>
        <v-chip size="small" variant="tonal" :color="configStatus.configured ? 'success' : 'warning'">
          {{ configStatus.configured ? '已接模型' : '未配置Key' }}
        </v-chip>
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
        <div class="text-caption text-medium-emphasis mb-2">
          {{ helperText }}
        </div>
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
          <v-btn color="primary" :loading="sending" @click="handleAsk">发送</v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chatWithAi, createConversation, getAiConfigStatus } from '@/api/ai'

const route = useRoute()
const router = useRouter()

const FLOAT_BTN_SIZE = 56
const FLOAT_BTN_MARGIN = 24
const FLOAT_BTN_STORAGE_KEY = 'aiLauncherPosition'
const AI_LAUNCHER_CONVERSATION_KEY = 'aiLauncherConversationId'
const DRAG_THRESHOLD = 6

const drawer = ref(false)
const question = ref('')
const sending = ref(false)
const conversationId = ref('')
const configStatus = ref({ configured: false, model: '', mode: 'fallback' })
const messages = ref([
  { role: 'assistant', text: '你好，我是 AI 助手。你可以先问我业务流程、报表口径或系统功能。' },
])

function getDefaultPosition() {
  if (typeof window === 'undefined') {
    return { x: FLOAT_BTN_MARGIN, y: FLOAT_BTN_MARGIN }
  }
  return {
    x: window.innerWidth - FLOAT_BTN_SIZE - FLOAT_BTN_MARGIN,
    y: window.innerHeight - FLOAT_BTN_SIZE - FLOAT_BTN_MARGIN,
  }
}

function clampPosition(x, y) {
  if (typeof window === 'undefined') {
    return { x, y }
  }
  const maxX = Math.max(FLOAT_BTN_MARGIN, window.innerWidth - FLOAT_BTN_SIZE - FLOAT_BTN_MARGIN)
  const maxY = Math.max(FLOAT_BTN_MARGIN, window.innerHeight - FLOAT_BTN_SIZE - FLOAT_BTN_MARGIN)
  return {
    x: Math.min(Math.max(FLOAT_BTN_MARGIN, x), maxX),
    y: Math.min(Math.max(FLOAT_BTN_MARGIN, y), maxY),
  }
}

function loadSavedPosition() {
  const fallback = getDefaultPosition()
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(FLOAT_BTN_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return fallback
    return clampPosition(parsed.x, parsed.y)
  } catch (error) {
    return fallback
  }
}

const buttonPosition = ref(loadSavedPosition())
const dragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  moved: false,
}

const floatBtnStyle = computed(() => ({
  left: `${buttonPosition.value.x}px`,
  top: `${buttonPosition.value.y}px`,
}))

const showLauncher = computed(() => {
  const hiddenPaths = ['/', '/login', '/register']
  if (hiddenPaths.includes(route.path)) return false
  const token = localStorage.getItem('token')
  return !!token && token !== 'undefined' && token !== 'null'
})

const helperText = computed(() => {
  return configStatus.value.configured
    ? `当前模型：${configStatus.value.model || '已配置'}，支持连续追问。`
    : '当前未配置 API Key，将使用降级回答。'
})

function savePosition() {
  if (typeof window === 'undefined') return
  localStorage.setItem(FLOAT_BTN_STORAGE_KEY, JSON.stringify(buttonPosition.value))
}

function handlePointerMove(event) {
  if (dragState.pointerId !== event.pointerId) return
  const nextX = dragState.originX + (event.clientX - dragState.startX)
  const nextY = dragState.originY + (event.clientY - dragState.startY)
  buttonPosition.value = clampPosition(nextX, nextY)

  if (!dragState.moved) {
    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    dragState.moved = Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD
  }
}

function clearDragListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerUp)
}

function handlePointerUp(event) {
  if (dragState.pointerId !== event.pointerId) return
  if (dragState.moved) {
    savePosition()
  }
  dragState.pointerId = null
  clearDragListeners()
}

function handlePointerDown(event) {
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.originX = buttonPosition.value.x
  dragState.originY = buttonPosition.value.y
  dragState.moved = false

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }
}

function handleLauncherClick() {
  if (dragState.moved) return
  drawer.value = true
}

async function ensureConversation() {
  if (conversationId.value) return conversationId.value
  const cached = typeof window !== 'undefined' ? localStorage.getItem(AI_LAUNCHER_CONVERSATION_KEY) : ''
  if (cached) {
    conversationId.value = cached
    return cached
  }
  const resp = await createConversation({ title: '悬浮球快速提问', scene: 'quick_chat' })
  const id = resp?.data?.conversationId
  if (id) {
    conversationId.value = id
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_LAUNCHER_CONVERSATION_KEY, id)
    }
  }
  return id
}

async function refreshConfigStatus() {
  try {
    const resp = await getAiConfigStatus()
    configStatus.value = resp?.data || configStatus.value
  } catch (error) {
    configStatus.value = { configured: false, model: '读取失败', mode: 'error' }
  }
}

async function sendWithConversation(content, currentConversationId) {
  return chatWithAi({ conversationId: currentConversationId, userMessage: content, stream: false })
}

function resetConversationCache() {
  conversationId.value = ''
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AI_LAUNCHER_CONVERSATION_KEY)
  }
}

function isConversationMissing(error) {
  const code = error?.response?.data?.code
  const message = error?.response?.data?.message || ''
  return code === 404 || String(message).includes('会话不存在')
}

async function handleAsk() {
  const content = question.value.trim()
  if (!content || sending.value) return

  messages.value.push({ role: 'user', text: content })
  question.value = ''
  sending.value = true

  try {
    let currentConversationId = await ensureConversation()
    let resp
    try {
      resp = await sendWithConversation(content, currentConversationId)
    } catch (error) {
      if (!isConversationMissing(error)) {
        throw error
      }
      resetConversationCache()
      currentConversationId = await ensureConversation()
      resp = await sendWithConversation(content, currentConversationId)
    }

    const answer = resp?.data?.answer || '抱歉，暂时没有生成回复。'
    messages.value.push({ role: 'assistant', text: answer })
    if (resp?.data?.mode === 'real-model') {
      configStatus.value.configured = true
      configStatus.value.mode = resp.data.mode
    }
  } catch (error) {
    messages.value.push({ role: 'assistant', text: 'AI 服务暂不可用，请稍后重试。' })
  } finally {
    sending.value = false
  }
}

function goFullPage() {
  drawer.value = false
  router.push('/ai/assistant')
}

onMounted(async () => {
  if (!showLauncher.value) return
  await refreshConfigStatus()
  await ensureConversation()
})

onBeforeUnmount(() => {
  clearDragListeners()
})
</script>

<style scoped>
.ai-float-btn {
  position: fixed;
  z-index: 1006;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.ai-float-btn:active {
  cursor: grabbing;
}

.ai-drawer {
  z-index: 1007;
}

.ai-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-messages {
  padding: 16px;
  height: calc(100% - 250px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(180deg, #fafcff 0%, #f7f9fc 100%);
}

.msg {
  max-width: 90%;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
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
