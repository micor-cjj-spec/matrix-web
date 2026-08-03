<template>
  <div v-if="visible">
    <v-btn
      class="evaluation-launcher"
      color="cyan-darken-2"
      icon="mdi-chart-box-outline"
      size="large"
      elevation="8"
      title="RAG 检索评测"
      @click="open"
    />

    <v-dialog v-model="dialog" max-width="1440" scrollable>
      <v-card class="evaluation-dialog-card">
        <v-card-title class="dialog-title">
          <div>
            <span>RAG Quality</span>
            <strong>检索质量评测</strong>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedKbId"
            :items="baseItems"
            item-title="title"
            item-value="value"
            label="评测知识库"
            variant="outlined"
            density="comfortable"
            :loading="loadingBases"
            class="base-select"
          />

          <KnowledgeEvaluationPanel
            v-if="selectedKbId"
            :kb-id="selectedKbId"
            :kb-name="selectedBaseName"
          />
          <div v-else class="empty-state">当前账号没有可管理的知识库</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { listKnowledgeBases } from '@/api/ai'
import KnowledgeEvaluationPanel from '@/views/ai/components/KnowledgeEvaluationPanel.vue'

const route = useRoute()
const dialog = ref(false)
const loadingBases = ref(false)
const bases = ref([])
const selectedKbId = ref('')

const visible = computed(() => route.path === '/ai/knowledge')
const baseItems = computed(() => bases.value.map(item => ({ title: item.name, value: item.kbId })))
const selectedBaseName = computed(() => bases.value.find(item => item.kbId === selectedKbId.value)?.name || selectedKbId.value)

async function open() {
  dialog.value = true
  loadingBases.value = true
  try {
    const response = await listKnowledgeBases()
    bases.value = response?.data || []
    if (!bases.value.some(item => item.kbId === selectedKbId.value)) {
      selectedKbId.value = bases.value[0]?.kbId || ''
    }
  } finally {
    loadingBases.value = false
  }
}
</script>

<style scoped>
.evaluation-launcher {
  position: fixed;
  right: 24px;
  bottom: 240px;
  z-index: 1100;
}

.evaluation-dialog-card {
  background: #07131f;
}

.dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dialog-title span {
  font-size: 11px;
  color: rgba(207, 250, 254, 0.58);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.dialog-title strong {
  color: #ecfeff;
}

.base-select {
  max-width: 460px;
  margin: 4px 0 18px;
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: rgba(226, 232, 240, 0.6);
}

@media (max-width: 720px) {
  .evaluation-launcher {
    right: 16px;
    bottom: 220px;
  }
}
</style>
