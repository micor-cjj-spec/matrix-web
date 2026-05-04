<template>
  <div v-if="showLauncher">
    <button
      type="button"
      class="ai-float-btn"
      :style="floatBtnStyle"
      :class="{ 'is-dragging': dragState.moved }"
      aria-label="打开 AI 助手"
      @pointerdown="handlePointerDown"
      @click="handleLauncherClick"
    >
      <span class="robot-avatar">
        <span class="robot-head">
          <span class="robot-antenna"></span>
          <span class="robot-face">
            <span class="robot-eye left"></span>
            <span class="robot-eye right"></span>
            <span class="robot-mouth"></span>
          </span>
        </span>
        <span class="robot-shadow"></span>
      </span>
    </button>

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
          <div class="text-body-2 text-medium-emphasis">快速提问入口</div>
        </div>
        <v-chip size="small" variant="tonal" :color="configStatus.configured ? 'success' : 'warning'">
          {{ configStatus.configured ? '已接模型' : '未配 Key' }}
        </v-chip>
      </div>

      <v-divider />

      <div ref="messagePanelRef" class="ai-messages">
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
          <v-btn variant="text" @click="goFullPage">进入完整页</v-btn>
          <v-btn color="primary" :loading="sending" @click="handleAsk">发送</v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chatWithAiStream, createConversation, getAiConfigStatus } from '@/api/ai'

const route = useRoute()
const router = useRouter()

const FLOAT_BTN_SIZE = 72
const FLOAT_BTN_MARGIN = 24
const FLOAT_BTN_STORAGE_KEY = 'aiLauncherPosition'
const AI_LAUNCHER_CONVERSATION_KEY = 'aiLauncherConversationId'
const DRAG_THRESHOLD = 6

const drawer = ref(false)
const question = ref('')
const sending = ref(false)
const conversationId = ref('')
const configStatus = ref({ configured: false, model: '', mode: 'fallback' })
const messagePanelRef = ref(null)
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
  const hiddenPaths = ['/', '/login', '/register', '/portal', '/finance', '/ledger', '/payable', '/receivable', '/finance/base-data', '/base-data', '/enterprise-modeling']
  if (hiddenPaths.includes(route.path)) return false
  const token = localStorage.getItem('token')
  return !!token && token !== 'undefined' && token !== 'null'
})

const helperText = computed(() => (
  configStatus.value.configured
    ? `当前模型：${configStatus.value.model || '已配置'}，支持流式输出。`
    : '当前未配置 API Key，将使用降级回答。'
))

function savePosition() {
  if (typeof window === 'undefined') return
  localStorage.setItem(FLOAT_BTN_STORAGE_KEY, JSON.stringify(buttonPosition.value))
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagePanelRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
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
  scrollToBottom()
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

function resetConversationCache() {
  conversationId.value = ''
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AI_LAUNCHER_CONVERSATION_KEY)
  }
}

function isConversationMissing(error) {
  const message = error?.message || error?.response?.data?.message || ''
  return error?.code === 404 || String(message).includes('会话不存在')
}

async function sendStream(content, currentConversationId, assistantMessage) {
  await chatWithAiStream(
    {
      conversationId: currentConversationId,
      userMessage: content,
      kbIds: ['default'],
      stream: true,
    },
    {
      onStart(payload) {
        if (payload?.conversationId) {
          conversationId.value = payload.conversationId
        }
        if (payload?.model) {
          configStatus.value.model = payload.model
        }
        if (payload?.mode) {
          configStatus.value.mode = payload.mode
          configStatus.value.configured = payload.mode === 'real-model'
        }
      },
      onDelta(payload) {
        assistantMessage.text += payload?.delta || ''
        scrollToBottom()
      },
      onDone(payload) {
        if (!assistantMessage.text?.trim()) {
          assistantMessage.text = payload?.answer || '抱歉，暂时没有生成回复。'
        }
        if (payload?.model) {
          configStatus.value.model = payload.model
        }
        if (payload?.mode) {
          configStatus.value.mode = payload.mode
          configStatus.value.configured = payload.mode === 'real-model'
        }
        scrollToBottom()
      },
      onError(payload) {
        if (!assistantMessage.text?.trim()) {
          assistantMessage.text = payload?.message || 'AI 服务暂不可用，请稍后重试。'
        }
        scrollToBottom()
      },
    }
  )
}

async function handleAsk() {
  const content = question.value.trim()
  if (!content || sending.value) return

  messages.value.push({ role: 'user', text: content })
  question.value = ''
  sending.value = true

  const assistantMessage = { role: 'assistant', text: '' }
  messages.value.push(assistantMessage)
  scrollToBottom()

  try {
    let currentConversationId = await ensureConversation()
    try {
      await sendStream(content, currentConversationId, assistantMessage)
    } catch (error) {
      if (!isConversationMissing(error)) {
        throw error
      }
      resetConversationCache()
      currentConversationId = await ensureConversation()
      await sendStream(content, currentConversationId, assistantMessage)
    }

    if (!assistantMessage.text?.trim()) {
      assistantMessage.text = '抱歉，暂时没有生成回复。'
    }
  } catch (error) {
    if (!assistantMessage.text?.trim()) {
      assistantMessage.text = 'AI 服务暂不可用，请稍后重试。'
    }
  } finally {
    sending.value = false
    scrollToBottom()
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
  width: 72px;
  height: 72px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition: transform 0.2s ease;
}

.ai-float-btn:active,
.ai-float-btn.is-dragging {
  cursor: grabbing;
}

.robot-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
}

.robot-head {
  position: relative;
  width: 60px;
  height: 52px;
  border-radius: 20px;
  background: linear-gradient(145deg, #f8fbff 0%, #d5e6ff 100%);
  border: 2px solid rgba(84, 128, 255, 0.24);
  box-shadow: 0 14px 28px rgba(53, 96, 214, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center bottom;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.robot-antenna {
  position: absolute;
  top: -12px;
  left: 50%;
  width: 4px;
  height: 14px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(180deg, #7aa8ff 0%, #3d6df6 100%);
}

.robot-antenna::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 50%;
  width: 12px;
  height: 12px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #9dc0ff 45%, #4070f6 100%);
  box-shadow: 0 0 14px rgba(96, 138, 255, 0.55);
}

.robot-face {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 14px;
  background: linear-gradient(180deg, #17306d 0%, #2549a5 100%);
}

.robot-eye {
  position: absolute;
  top: 7px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #9be8ff;
  box-shadow: 0 0 10px rgba(116, 237, 255, 0.9);
  animation: ai-eye-blink 4s infinite;
}

.robot-eye.left {
  left: 9px;
}

.robot-eye.right {
  right: 9px;
}

.robot-mouth {
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 16px;
  height: 6px;
  transform: translateX(-50%);
  border-radius: 0 0 999px 999px;
  border: 2px solid rgba(155, 232, 255, 0.9);
  border-top: 0;
}

.robot-shadow {
  position: absolute;
  bottom: 2px;
  width: 42px;
  height: 10px;
  border-radius: 999px;
  background: rgba(49, 83, 176, 0.18);
  filter: blur(4px);
}

.ai-float-btn:hover .robot-head {
  transform: translateY(-4px) rotate(-6deg);
  box-shadow: 0 18px 32px rgba(53, 96, 214, 0.28);
  animation: ai-robot-wave 0.9s ease-in-out infinite alternate;
}

.ai-float-btn:hover .robot-antenna::before {
  animation: ai-robot-pulse 0.9s ease-in-out infinite alternate;
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

@keyframes ai-eye-blink {
  0%,
  45%,
  55%,
  100% {
    transform: scaleY(1);
    opacity: 1;
  }
  50% {
    transform: scaleY(0.2);
    opacity: 0.6;
  }
}

@keyframes ai-robot-wave {
  from {
    transform: translateY(-4px) rotate(-6deg);
  }
  to {
    transform: translateY(-7px) rotate(6deg);
  }
}

@keyframes ai-robot-pulse {
  from {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 14px rgba(96, 138, 255, 0.55);
  }
  to {
    transform: translateX(-50%) scale(1.14);
    box-shadow: 0 0 20px rgba(96, 138, 255, 0.78);
  }
}
</style>
