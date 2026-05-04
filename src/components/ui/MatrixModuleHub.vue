<template>
  <main class="matrix-hub" :style="{ '--accent': accent, '--warm': warm }">
    <header class="hub-topbar">
      <div class="hub-breadcrumb">
        <button type="button" @click="go(homePath)">
          <House class="svg-icon" />
          <span>{{ cloudLabel }}</span>
        </button>
        <span>/</span>
        <strong>{{ title }}</strong>
      </div>

      <label class="hub-search" aria-label="搜索模块入口">
        <Search class="svg-icon" />
        <input v-model="keyword" type="search" :placeholder="searchPlaceholder" />
      </label>

      <div class="hub-actions">
        <button
          v-for="action in resolvedTopActions"
          :key="action.name"
          type="button"
          @click="go(action.path)"
        >
          <component :is="action.icon || Grid" class="svg-icon" />
          <span>{{ action.name }}</span>
        </button>
      </div>
    </header>

    <section class="hub-hero">
      <div class="hero-copy">
        <span>{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <div v-if="resolvedActions.length" class="hero-actions">
          <button
            v-for="action in resolvedActions"
            :key="action.name"
            type="button"
            :class="action.primary ? 'primary-action' : 'plain-action'"
            @click="go(action.path)"
          >
            <component :is="action.icon || ArrowRight" class="svg-icon" />
            <span>{{ action.name }}</span>
          </button>
        </div>
      </div>

      <div class="metric-grid">
        <div v-for="metric in resolvedStats" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.hint }}</small>
        </div>
      </div>
    </section>

    <section class="hub-layout">
      <aside class="section-nav" aria-label="业务分组">
        <button
          v-for="group in resolvedGroups"
          :key="group.name"
          type="button"
          :class="{ active: activeGroupName === group.name && !keyword.trim() }"
          @click="selectGroup(group)"
        >
          <span class="section-icon">
            <component v-if="typeof group.icon !== 'string'" :is="group.icon || Grid" class="svg-icon" />
            <span v-else>{{ group.icon }}</span>
          </span>
          <span class="section-copy">
            <strong>{{ group.name }}</strong>
            <small>{{ group.summary || `${group.modules.length} 个入口` }}</small>
          </span>
          <em>{{ group.modules.length }}</em>
        </button>
      </aside>

      <section class="module-board">
        <div class="board-heading">
          <div>
            <span>{{ keyword.trim() ? 'SEARCH RESULT' : activeBoardEyebrow }}</span>
            <h2>{{ keyword.trim() ? `搜索“${keyword.trim()}”` : activeBoardTitle }}</h2>
          </div>
          <small>{{ totalVisibleModules }} 个入口</small>
        </div>

        <div v-if="visibleGroups.length" class="group-stack">
          <section v-for="group in visibleGroups" :key="group.name" class="module-group">
            <header v-if="keyword.trim()" class="group-heading">
              <strong>{{ group.name }}</strong>
              <span>{{ group.summary || `${group.modules.length} 个入口` }}</span>
            </header>

            <div class="module-grid">
              <button
                v-for="module in group.modules"
                :key="`${group.name}-${module.name}`"
                type="button"
                class="module-card"
                :class="{ muted: module.ready === false || !module.path }"
                @click="openModule(module)"
              >
                <span class="module-icon">
                  <component v-if="typeof module.icon !== 'string'" :is="module.icon || group.icon || Grid" class="svg-icon" />
                  <span v-else>{{ module.icon }}</span>
                </span>
                <span class="module-copy">
                  <strong>{{ module.name }}</strong>
                  <small>{{ module.description || module.desc || '进入业务处理' }}</small>
                </span>
                <span class="module-meta">
                  <em>{{ module.status || (module.path ? '进入' : '规划中') }}</em>
                  <ArrowRight class="svg-icon" />
                </span>
              </button>
            </div>
          </section>
        </div>

        <div v-else class="empty-state">
          <Search class="svg-icon" />
          <strong>没有找到匹配入口</strong>
          <span>换一个关键词再试试</span>
        </div>
      </section>

      <aside class="context-dock">
        <section v-if="resolvedFocusItems.length" class="dock-section">
          <div class="dock-heading">
            <span>FOCUS</span>
            <strong>今日关注</strong>
          </div>
          <div class="focus-list">
            <button v-for="item in resolvedFocusItems" :key="item.name" type="button" @click="go(item.path)">
              <span>{{ item.name }}</span>
              <em>{{ item.status }}</em>
            </button>
          </div>
        </section>

        <section v-if="resolvedShortcuts.length" class="dock-section">
          <div class="dock-heading">
            <span>ACTIONS</span>
            <strong>高频操作</strong>
          </div>
          <div class="shortcut-grid">
            <button v-for="item in resolvedShortcuts" :key="item.name" type="button" @click="go(item.path)">
              <component :is="item.icon || Grid" class="svg-icon" />
              <span>{{ item.name }}</span>
            </button>
          </div>
        </section>
      </aside>
    </section>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="1800">
      {{ snackbar.text }}
    </v-snackbar>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getModuleHub } from '@/api/platform'
import { resolveMatrixIcon } from '@/utils/matrixIcons'
import {
  ArrowRight,
  Grid,
  House,
  Search,
} from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  appCode: { type: String, default: '' },
  moduleCode: { type: String, default: '' },
  eyebrow: { type: String, default: 'MATRIX MODULE' },
  cloudLabel: { type: String, default: '财务云' },
  homePath: { type: String, default: '/finance' },
  searchPlaceholder: { type: String, default: '搜索业务入口、报表、配置' },
  accent: { type: String, default: '#0f8a6a' },
  warm: { type: String, default: '#d09a2b' },
  stats: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  actions: { type: Array, default: () => [] },
  topActions: { type: Array, default: () => [] },
  focusItems: { type: Array, default: () => [] },
  shortcuts: { type: Array, default: () => [] },
})

const router = useRouter()
const keyword = ref('')
const activeGroupName = ref('')
const snackbar = ref({ show: false, text: '', color: 'info' })
const remoteHub = ref(null)

const resolvedStats = computed(() => withFallback(remoteHub.value?.stats, props.stats))
const resolvedActions = computed(() => withFallback(remoteHub.value?.actions, props.actions))
const resolvedTopActions = computed(() => withFallback(remoteHub.value?.topActions, props.topActions))
const resolvedFocusItems = computed(() => withFallback(remoteHub.value?.focusItems, props.focusItems))
const resolvedShortcuts = computed(() => withFallback(remoteHub.value?.shortcuts, props.shortcuts))
const resolvedGroups = computed(() => withFallback(remoteHub.value?.groups, props.groups))

onMounted(loadRemoteHub)

watch(
  () => resolvedGroups.value,
  (groups) => {
    if (!groups.some((group) => group.name === activeGroupName.value)) {
      activeGroupName.value = groups[0]?.name || ''
    }
  },
  { immediate: true },
)

const activeGroup = computed(() => (
  resolvedGroups.value.find((group) => group.name === activeGroupName.value) || resolvedGroups.value[0] || null
))

const visibleGroups = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    return activeGroup.value ? [activeGroup.value] : []
  }

  return resolvedGroups.value
    .map((group) => ({
      ...group,
      modules: group.modules.filter((module) => {
        const text = `${group.name} ${group.summary || ''} ${module.name} ${module.description || module.desc || ''}`.toLowerCase()
        return text.includes(search)
      }),
    }))
    .filter((group) => group.modules.length > 0)
})

const activeBoardTitle = computed(() => activeGroup.value?.name || props.title)
const activeBoardEyebrow = computed(() => activeGroup.value?.eyebrow || props.eyebrow)

const totalVisibleModules = computed(() => (
  visibleGroups.value.reduce((total, group) => total + group.modules.length, 0)
))

function selectGroup(group) {
  activeGroupName.value = group.name
  keyword.value = ''
}

async function loadRemoteHub() {
  if (!props.appCode || !props.moduleCode) {
    return
  }
  try {
    const res = await getModuleHub(props.appCode, props.moduleCode)
    const data = unwrapResponse(res)
    if (hasRemoteHubData(data)) {
      remoteHub.value = hydrateHub(data)
    }
  } catch (error) {
    console.warn('Matrix module hub config fallback to local data', error)
  }
}

function unwrapResponse(res) {
  if (res?.code && res.code !== 200) {
    throw new Error(res.message || 'module hub api error')
  }
  return res?.data || res || {}
}

function hasRemoteHubData(data) {
  return ['stats', 'actions', 'topActions', 'focusItems', 'shortcuts', 'groups']
    .some((key) => Array.isArray(data?.[key]) && data[key].length > 0)
}

function withFallback(source, fallback) {
  return Array.isArray(source) && source.length > 0 ? source : fallback
}

function hydrateHub(data) {
  return {
    stats: hydrateMetrics(data.stats),
    actions: hydrateActionList(data.actions),
    topActions: hydrateActionList(data.topActions),
    focusItems: hydratePlainList(data.focusItems),
    shortcuts: hydrateActionList(data.shortcuts),
    groups: hydrateGroups(data.groups),
  }
}

function hydrateMetrics(items = []) {
  return items.map((item) => ({
    label: item.label || item.name || item.title,
    value: item.value,
    hint: item.hint,
  }))
}

function hydrateActionList(items = []) {
  return items.map((item) => ({
    ...item,
    name: item.name || item.title || item.label,
    description: item.description || item.desc || item.detail,
    path: item.path || item.routePath,
    icon: resolveMatrixIcon(item.iconKey || item.icon, Grid),
    primary: item.primary === true,
    ready: item.ready !== false,
  }))
}

function hydratePlainList(items = []) {
  return items.map((item) => ({
    ...item,
    name: item.name || item.title || item.label,
    path: item.path || item.routePath,
  }))
}

function hydrateGroups(groups = []) {
  return groups.map((group) => ({
    ...group,
    icon: resolveMatrixIcon(group.iconKey || group.icon, Grid),
    modules: (group.modules || []).map((module) => ({
      ...module,
      name: module.name || module.title || module.label,
      description: module.description || module.desc || module.detail,
      path: module.path || module.routePath,
      icon: resolveMatrixIcon(module.iconKey || module.icon || group.iconKey, Grid),
      ready: module.ready !== false && module.available !== false,
    })),
  }))
}

function openModule(module) {
  if (module.path) {
    go(module.path)
    return
  }

  snackbar.value = {
    show: true,
    text: `${module.name} 暂未开放`,
    color: 'info',
  }
}

function go(path) {
  if (!path) return
  router.push(path)
}
</script>

<style scoped>
.matrix-hub {
  min-height: 100vh;
  padding: 18px 22px 30px;
  color: #17202c;
  background:
    radial-gradient(circle at 14% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 32%),
    radial-gradient(circle at 96% 4%, color-mix(in srgb, var(--warm) 12%, transparent), transparent 28%),
    linear-gradient(180deg, #f8fbfa 0%, #eef4f3 100%);
}

.svg-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

button {
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.hub-topbar {
  min-height: 50px;
  display: grid;
  grid-template-columns: minmax(240px, auto) minmax(280px, 1fr) auto;
  gap: 14px;
  align-items: center;
}

.hub-breadcrumb {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7785;
}

.hub-breadcrumb button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0;
  color: #263443;
  background: transparent;
  font-weight: 900;
}

.hub-breadcrumb strong {
  overflow: hidden;
  color: #17202c;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hub-search {
  min-width: 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid rgba(27, 45, 57, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 30px rgba(34, 53, 73, 0.06);
}

.hub-search .svg-icon {
  color: #7d8994;
}

.hub-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
}

.hub-actions {
  display: flex;
  gap: 10px;
}

.hub-actions button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border: 1px solid rgba(27, 45, 57, 0.1);
  border-radius: 8px;
  background: #ffffff;
  font-weight: 900;
}

.hub-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);
  gap: 22px;
  margin-top: 18px;
  padding: 30px;
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent) 96%, #16313a) 0%, color-mix(in srgb, var(--accent) 74%, #2d5f6a) 54%, #20313a 100%);
  box-shadow: 0 20px 52px rgba(26, 42, 58, 0.15);
}

.hero-copy > span,
.board-heading span,
.dock-heading span {
  color: color-mix(in srgb, var(--warm) 52%, #ffffff);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 8px 0 10px;
  font-size: 36px;
  line-height: 1.12;
}

.hero-copy p {
  max-width: 780px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.primary-action,
.plain-action {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 900;
}

.primary-action {
  color: #17202c;
  background: #ffffff;
}

.plain-action {
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  min-height: 104px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 8px;
  background: rgba(9, 24, 30, 0.24);
}

.metric-card span,
.metric-card small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.metric-card strong {
  color: #ffffff;
  font-size: 27px;
  line-height: 1;
}

.metric-card small {
  color: color-mix(in srgb, var(--warm) 46%, #ffffff);
}

.hub-layout {
  display: grid;
  grid-template-columns: 245px minmax(0, 1fr) 318px;
  gap: 18px;
  margin-top: 18px;
}

.section-nav {
  position: sticky;
  top: 18px;
  align-self: start;
  display: grid;
  gap: 9px;
}

.section-nav button {
  min-height: 72px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  text-align: left;
}

.section-nav button.active,
.section-nav button:hover {
  border-color: color-mix(in srgb, var(--accent) 24%, transparent);
  background: color-mix(in srgb, var(--accent) 9%, #ffffff);
  box-shadow: 0 12px 28px rgba(34, 53, 73, 0.07);
}

.section-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
  font-size: 15px;
  font-weight: 900;
}

.section-copy {
  min-width: 0;
}

.section-copy strong,
.section-copy small {
  display: block;
}

.section-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.section-copy small {
  margin-top: 4px;
  overflow: hidden;
  color: #6c7783;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-nav em {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.module-board {
  min-width: 0;
  align-self: start;
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.board-heading,
.group-heading,
.dock-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.board-heading {
  align-items: end;
}

.board-heading span,
.dock-heading span {
  color: color-mix(in srgb, var(--accent) 82%, #17202c);
}

.board-heading h2 {
  margin: 3px 0 0;
  font-size: 22px;
}

.board-heading small,
.group-heading span {
  color: #77828e;
  font-size: 12px;
}

.group-stack {
  display: grid;
  align-content: start;
  gap: 18px;
}

.module-group {
  display: grid;
  align-content: start;
  gap: 10px;
}

.group-heading {
  align-items: center;
}

.group-heading strong {
  font-size: 15px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.module-card {
  min-height: 112px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: #f8faf9;
  text-align: left;
}

.module-card:hover {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent) 7%, #ffffff);
  transform: translateY(-1px);
}

.module-card.muted {
  color: #667482;
}

.module-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, #ffffff);
  font-size: 15px;
  font-weight: 900;
}

.module-copy {
  min-width: 0;
}

.module-copy strong,
.module-copy small {
  display: block;
}

.module-copy strong {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-copy small {
  margin-top: 5px;
  color: #687582;
  font-size: 12px;
  line-height: 1.5;
}

.module-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
  color: #8a96a1;
}

.module-meta em {
  color: color-mix(in srgb, var(--accent) 78%, #17202c);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.empty-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #72808c;
}

.empty-state .svg-icon {
  width: 28px;
  height: 28px;
}

.empty-state strong {
  color: #2a3541;
}

.context-dock {
  align-self: start;
  display: grid;
  align-content: start;
  gap: 14px;
}

.dock-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(27, 45, 57, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
}

.dock-heading {
  align-items: end;
}

.dock-heading strong {
  font-size: 18px;
}

.focus-list {
  display: grid;
  gap: 9px;
}

.focus-list button {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 11px;
  border-radius: 8px;
  background: #f7f9fa;
}

.focus-list span {
  overflow: hidden;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-list em {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--accent) 78%, #17202c);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.shortcut-grid button {
  min-height: 74px;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: #f7f9fa;
  font-weight: 900;
}

.shortcut-grid button:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, #ffffff);
}

.shortcut-grid span {
  max-width: 100%;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1280px) {
  .hub-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .context-dock {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1060px) {
  .hub-hero {
    grid-template-columns: 1fr;
  }

  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .matrix-hub {
    padding: 14px;
  }

  .hub-topbar,
  .hub-layout,
  .context-dock {
    grid-template-columns: 1fr;
  }

  .section-nav {
    position: static;
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .section-nav button {
    min-width: 200px;
  }
}

@media (max-width: 560px) {
  .hub-hero,
  .module-board {
    padding: 18px;
  }

  .hero-copy h1 {
    font-size: 30px;
  }

  .metric-grid,
  .module-grid,
  .shortcut-grid {
    grid-template-columns: 1fr;
  }

  .hub-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hub-actions button {
    justify-content: center;
  }

  .module-card {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .module-meta {
    grid-column: 1 / -1;
    grid-template-columns: 1fr auto;
    align-items: center;
    justify-items: start;
  }
}
</style>
