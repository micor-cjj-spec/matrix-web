<template>
  <div v-if="visible">
    <v-btn
      class="acl-launcher"
      color="deep-purple"
      icon="mdi-shield-account-outline"
      size="large"
      elevation="8"
      title="知识库权限"
      @click="open"
    />

    <v-dialog v-model="dialog" max-width="1180" scrollable>
      <v-card class="acl-dialog-card">
        <v-card-title class="dialog-title">
          <div>
            <span>Knowledge ACL</span>
            <strong>知识库访问控制</strong>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedKbId"
            :items="baseItems"
            item-title="title"
            item-value="value"
            label="选择知识库"
            variant="outlined"
            density="comfortable"
            :loading="loadingBases"
            class="base-select"
          />

          <KnowledgeAclPanel
            v-if="selectedKbId"
            :kb-id="selectedKbId"
            :kb-name="selectedBaseName"
          />
          <div v-else class="empty-state">当前账号没有可访问的知识库</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { listKnowledgeBases } from '@/api/ai'
import KnowledgeAclPanel from '@/views/ai/components/KnowledgeAclPanel.vue'

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
.acl-launcher {
  position: fixed;
  right: 24px;
  bottom: 170px;
  z-index: 1100;
}

.acl-dialog-card {
  background: #0f172a;
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
  color: rgba(226, 232, 240, 0.58);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.dialog-title strong {
  color: #f8fafc;
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
  .acl-launcher {
    right: 16px;
    bottom: 150px;
  }
}
</style>
