<template>
  <section class="workbench-panel">
    <section class="workbench-hero">
      <div class="hero-copy">
        <span class="eyebrow">PERSONAL WORKBENCH</span>
        <h1>早上好，欢迎回到 Matrix</h1>
        <p>工作台聚焦你今天需要处理的事项、关键指标和最近工作，不再承担完整应用导航。</p>
        <div class="hero-actions">
          <button type="button" class="primary-button" @click="$emit('open-app-center')">
            <Grid class="button-icon" />
            打开应用中心
          </button>
          <button type="button" class="secondary-button" @click="$emit('navigate', '/ai/assistant')">
            <ChatDotRound class="button-icon" />
            询问 AI 助手
          </button>
        </div>
      </div>

      <div class="metric-grid" aria-label="工作台关键指标">
        <article v-for="metric in heroMetrics" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.hint }}</small>
        </article>
      </div>
    </section>

    <section class="workbench-grid">
      <div class="main-column">
        <section class="panel-card todo-panel">
          <div class="section-heading">
            <div>
              <span>TODAY</span>
              <h2>我的待办</h2>
            </div>
            <button type="button" class="icon-button" title="刷新待办" @click="$emit('refresh')">
              <Refresh />
            </button>
          </div>

          <div v-if="todos.length" class="todo-list">
            <button
              v-for="todo in todos"
              :key="todo.title"
              type="button"
              class="todo-item"
              @click="$emit('navigate', todo.path)"
            >
              <span class="priority-dot" :class="todo.priority || 'low'"></span>
              <div>
                <strong>{{ todo.title }}</strong>
                <small>{{ todo.desc }}</small>
              </div>
              <Clock class="row-icon" />
            </button>
          </div>
          <div v-else class="empty-state">今天没有待处理事项。</div>
        </section>

        <section class="panel-card">
          <div class="section-heading">
            <div>
              <span>RECENT</span>
              <h2>最近访问</h2>
            </div>
          </div>

          <div class="recent-list">
            <button
              v-for="item in recentItems"
              :key="item.title"
              type="button"
              class="recent-item"
              @click="$emit('navigate', item.path)"
            >
              <span class="recent-icon-wrap">
                <component :is="item.icon" class="dynamic-icon" />
              </span>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.detail }}</small>
              </div>
              <span class="recent-time">{{ item.time }}</span>
              <ArrowRight class="row-icon" />
            </button>
          </div>
        </section>
      </div>

      <aside class="side-column">
        <section class="panel-card">
          <div class="section-heading">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>快捷操作</h2>
            </div>
          </div>

          <div class="quick-grid">
            <button
              v-for="action in quickActions"
              :key="action.label"
              type="button"
              @click="$emit('navigate', action.path)"
            >
              <component :is="action.icon" class="dynamic-icon" />
              <span>{{ action.label }}</span>
            </button>
          </div>
        </section>

        <section class="panel-card">
          <div class="section-heading">
            <div>
              <span>NOTICE</span>
              <h2>通知动态</h2>
            </div>
          </div>

          <div class="notice-list">
            <article v-for="notice in notices" :key="notice.title" class="notice-item">
              <span class="notice-tag" :class="notice.type || 'platform'">{{ notice.tag }}</span>
              <div>
                <strong>{{ notice.title }}</strong>
                <p>{{ notice.desc }}</p>
              </div>
            </article>
          </div>
        </section>
      </aside>
    </section>
  </section>
</template>

<script setup>
import { ArrowRight, ChatDotRound, Clock, Grid, Refresh } from '@element-plus/icons-vue'

defineProps({
  heroMetrics: { type: Array, default: () => [] },
  todos: { type: Array, default: () => [] },
  recentItems: { type: Array, default: () => [] },
  notices: { type: Array, default: () => [] },
  quickActions: { type: Array, default: () => [] },
})

defineEmits(['navigate', 'open-app-center', 'refresh'])
</script>

<style scoped>
.workbench-panel {
  display: grid;
  gap: 24px;
}

.workbench-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.85fr);
  gap: 28px;
  padding: 36px;
  border-radius: 28px;
  color: #f7fffc;
  background:
    radial-gradient(circle at 88% 12%, rgba(83, 211, 167, 0.28), transparent 34%),
    linear-gradient(135deg, #102b2c 0%, #174f49 58%, #1d6d5d 100%);
  box-shadow: 0 22px 50px rgba(20, 65, 61, 0.18);
}

.hero-copy {
  align-self: center;
}

.eyebrow,
.section-heading span {
  display: block;
  margin-bottom: 8px;
  color: #2f7f6b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.hero-copy .eyebrow {
  color: #9be4cf;
}

.hero-copy h1 {
  margin: 0;
  max-width: 620px;
  font-size: clamp(28px, 3vw, 44px);
  line-height: 1.15;
}

.hero-copy p {
  max-width: 650px;
  margin: 16px 0 0;
  color: rgba(240, 255, 251, 0.76);
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.hero-actions button {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  color: #15483f;
  background: #e8fff7;
}

.secondary-button {
  color: #f1fffb;
  background: rgba(255, 255, 255, 0.11);
  outline: 1px solid rgba(255, 255, 255, 0.18);
}

.button-icon,
.dynamic-icon,
.row-icon,
.icon-button svg {
  width: 18px;
  height: 18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-content: center;
}

.metric-card {
  min-height: 122px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.metric-card:first-child {
  grid-column: 1 / -1;
}

.metric-card span,
.metric-card small {
  display: block;
  color: rgba(241, 255, 251, 0.7);
}

.metric-card strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 30px;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.7fr);
  gap: 24px;
}

.main-column,
.side-column {
  display: grid;
  align-content: start;
  gap: 24px;
}

.panel-card {
  padding: 24px;
  border: 1px solid #e4ece9;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(38, 70, 68, 0.07);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0;
  color: #17282b;
  font-size: 20px;
}

.icon-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #dce8e4;
  border-radius: 10px;
  color: #2d7563;
  background: #f6fbf9;
  cursor: pointer;
}

.todo-list,
.recent-list,
.notice-list {
  display: grid;
  gap: 10px;
}

.todo-item,
.recent-item {
  display: grid;
  width: 100%;
  align-items: center;
  border: 0;
  border-radius: 14px;
  color: inherit;
  background: #f8fbfa;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, background 0.18s ease;
}

.todo-item {
  grid-template-columns: 10px minmax(0, 1fr) 20px;
  gap: 14px;
  padding: 16px;
}

.todo-item:hover,
.recent-item:hover {
  transform: translateY(-1px);
  background: #f0f8f5;
}

.todo-item strong,
.todo-item small,
.recent-item strong,
.recent-item small {
  display: block;
}

.todo-item small,
.recent-item small {
  margin-top: 5px;
  color: #748482;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #79a69a;
}

.priority-dot.high { background: #df5f59; }
.priority-dot.medium { background: #d79b31; }
.priority-dot.low { background: #4f9a83; }

.row-icon {
  color: #8da09d;
}

.recent-item {
  grid-template-columns: 42px minmax(0, 1fr) auto 18px;
  gap: 12px;
  padding: 13px 14px;
}

.recent-icon-wrap {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  color: #2f7f6b;
  background: #e9f6f1;
}

.recent-time {
  color: #8b9997;
  font-size: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-grid button {
  display: flex;
  min-height: 74px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid #e2ece9;
  border-radius: 14px;
  color: #294642;
  background: #fbfdfc;
  cursor: pointer;
  text-align: left;
}

.quick-grid button:hover {
  border-color: #9dc8bb;
  background: #f2faf7;
}

.notice-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #edf2f0;
}

.notice-item:last-child {
  border-bottom: 0;
}

.notice-item strong {
  color: #213633;
  font-size: 14px;
}

.notice-item p {
  margin: 5px 0 0;
  color: #748482;
  font-size: 12px;
  line-height: 1.55;
}

.notice-tag {
  height: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  color: #245f50;
  background: #e6f5ef;
  font-size: 11px;
  font-weight: 700;
}

.notice-tag.finance { color: #8a5a17; background: #fff3d8; }
.notice-tag.knowledge { color: #315f91; background: #e8f1fb; }
.notice-tag.platform { color: #5b4d89; background: #f0ecfb; }

.empty-state {
  padding: 28px;
  border-radius: 14px;
  color: #81908d;
  background: #f8fbfa;
  text-align: center;
}

@media (max-width: 1100px) {
  .workbench-hero,
  .workbench-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .workbench-hero {
    padding: 24px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .metric-card:first-child {
    grid-column: auto;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
