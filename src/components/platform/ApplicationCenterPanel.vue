<template>
  <section class="application-center">
    <section class="center-hero">
      <div>
        <span class="eyebrow">MATRIX APPLICATION CENTER</span>
        <h1>应用中心</h1>
        <p>统一发现和进入 Matrix 已建设的业务系统、智能能力、平台服务与集成工具。</p>
      </div>

      <div class="catalog-stats" aria-label="应用中心统计">
        <article>
          <strong>{{ apps.length }}</strong>
          <span>系统总数</span>
        </article>
        <article>
          <strong>{{ availableCount }}</strong>
          <span>可直接使用</span>
        </article>
        <article>
          <strong>{{ categoryCount }}</strong>
          <span>能力分类</span>
        </article>
      </div>
    </section>

    <section class="catalog-toolbar">
      <label class="catalog-search">
        <Search />
        <input v-model.trim="keyword" type="search" placeholder="搜索系统、能力或关键词" />
        <button v-if="keyword" type="button" aria-label="清空搜索" @click="keyword = ''">
          <Close />
        </button>
      </label>

      <div class="category-tabs" role="tablist" aria-label="应用分类">
        <button
          v-for="category in categories"
          :key="category.key"
          type="button"
          :class="{ active: activeCategory === category.key }"
          @click="activeCategory = category.key"
        >
          <component :is="category.icon" />
          <span>{{ category.label }}</span>
          <small>{{ countByCategory(category.key) }}</small>
        </button>
      </div>
    </section>

    <section v-if="featuredApps.length && activeCategory === 'all' && !keyword" class="featured-section">
      <div class="section-heading">
        <div>
          <span>FEATURED</span>
          <h2>核心系统</h2>
        </div>
        <p>高频业务系统与平台核心入口</p>
      </div>

      <div class="featured-grid">
        <article
          v-for="app in featuredApps"
          :key="app.key || app.name"
          class="featured-card"
          :style="{ '--accent': app.accent || '#2f7f6b' }"
          @click="openApp(app)"
        >
          <div class="featured-icon">
            <component :is="app.icon" />
          </div>
          <div class="featured-copy">
            <div class="card-title-row">
              <h3>{{ app.name }}</h3>
              <span class="status-pill" :class="statusClass(app)">{{ displayStatus(app) }}</span>
            </div>
            <p>{{ app.desc }}</p>
            <div class="tag-row">
              <span v-for="tag in app.tags || []" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <ArrowRight class="featured-arrow" />
        </article>
      </div>
    </section>

    <section class="all-apps-section">
      <div class="section-heading">
        <div>
          <span>CATALOG</span>
          <h2>{{ currentCategoryLabel }}</h2>
        </div>
        <p>共 {{ filteredApps.length }} 个系统</p>
      </div>

      <div v-if="filteredApps.length" class="app-grid">
        <article
          v-for="app in filteredApps"
          :key="app.key || app.name"
          class="app-card"
          :class="{ disabled: app.available === false }"
          :style="{ '--accent': app.accent || '#2f7f6b' }"
          @click="openApp(app)"
        >
          <div class="app-card-head">
            <span class="app-icon">
              <component :is="app.icon" />
            </span>
            <span class="status-pill" :class="statusClass(app)">{{ displayStatus(app) }}</span>
          </div>

          <div class="app-copy">
            <span class="app-category">{{ categoryLabel(app.category) }}</span>
            <h3>{{ app.name }}</h3>
            <p>{{ app.desc }}</p>
          </div>

          <div class="tag-row compact">
            <span v-for="tag in app.tags || []" :key="tag">{{ tag }}</span>
          </div>

          <div class="app-card-foot">
            <span>{{ app.meta || 'Matrix 平台应用' }}</span>
            <span class="open-link">
              {{ app.available === false ? '查看规划' : '进入系统' }}
              <ArrowRight />
            </span>
          </div>
        </article>
      </div>

      <div v-else class="empty-catalog">
        <Search />
        <strong>没有匹配的系统</strong>
        <p>尝试调整搜索词或切换其他分类。</p>
        <button type="button" @click="resetFilter">查看全部应用</button>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  ArrowRight,
  Close,
  Connection,
  Cpu,
  Grid,
  Monitor,
  Search,
} from '@element-plus/icons-vue'

const props = defineProps({
  apps: { type: Array, default: () => [] },
})

const emit = defineEmits(['open'])

const keyword = ref('')
const activeCategory = ref('all')

const categories = [
  { key: 'all', label: '全部应用', icon: Grid },
  { key: 'business', label: '业务系统', icon: Monitor },
  { key: 'intelligence', label: '智能系统', icon: Cpu },
  { key: 'platform', label: '平台服务', icon: Grid },
  { key: 'integration', label: '集成工具', icon: Connection },
]

const normalizedKeyword = computed(() => keyword.value.toLowerCase())

const filteredApps = computed(() => {
  return props.apps.filter((app) => {
    const categoryMatched = activeCategory.value === 'all' || app.category === activeCategory.value
    if (!categoryMatched) {
      return false
    }

    if (!normalizedKeyword.value) {
      return true
    }

    const text = [
      app.name,
      app.desc,
      app.meta,
      app.category,
      ...(app.tags || []),
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(normalizedKeyword.value)
  })
})

const featuredApps = computed(() => props.apps.filter((app) => app.featured).slice(0, 3))
const availableCount = computed(() => props.apps.filter((app) => app.available !== false).length)
const categoryCount = computed(() => new Set(props.apps.map((app) => app.category).filter(Boolean)).size)
const currentCategoryLabel = computed(() => {
  return categories.find((item) => item.key === activeCategory.value)?.label || '全部应用'
})

function countByCategory(category) {
  if (category === 'all') {
    return props.apps.length
  }
  return props.apps.filter((app) => app.category === category).length
}

function categoryLabel(category) {
  return categories.find((item) => item.key === category)?.label || '平台应用'
}

function displayStatus(app) {
  if (app.status) {
    return app.status
  }
  return app.available === false ? '规划中' : '已上线'
}

function statusClass(app) {
  const status = displayStatus(app)
  if (app.available === false || status.includes('规划')) {
    return 'planned'
  }
  if (status.includes('试运行') || status.includes('内测')) {
    return 'preview'
  }
  return 'live'
}

function openApp(app) {
  emit('open', app)
}

function resetFilter() {
  keyword.value = ''
  activeCategory.value = 'all'
}
</script>

<style scoped>
.application-center {
  display: grid;
  gap: 24px;
}

.center-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 34px 36px;
  border: 1px solid #dce9e5;
  border-radius: 28px;
  background:
    radial-gradient(circle at 88% 20%, rgba(61, 154, 126, 0.15), transparent 34%),
    linear-gradient(135deg, #f7fffc 0%, #edf8f4 55%, #e4f3ee 100%);
  box-shadow: 0 18px 44px rgba(38, 70, 68, 0.08);
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

.center-hero h1 {
  margin: 0;
  color: #16312e;
  font-size: clamp(30px, 3vw, 46px);
}

.center-hero p {
  max-width: 680px;
  margin: 14px 0 0;
  color: #617672;
  font-size: 15px;
  line-height: 1.75;
}

.catalog-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 10px;
  min-width: 350px;
}

.catalog-stats article {
  padding: 16px;
  border: 1px solid rgba(47, 127, 107, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.74);
  text-align: center;
}

.catalog-stats strong,
.catalog-stats span {
  display: block;
}

.catalog-stats strong {
  color: #1e6554;
  font-size: 25px;
}

.catalog-stats span {
  margin-top: 5px;
  color: #72837f;
  font-size: 12px;
}

.catalog-toolbar {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  padding: 16px;
  border: 1px solid #e2ece9;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(38, 70, 68, 0.05);
}

.catalog-search {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 28px;
  gap: 10px;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #dbe8e4;
  border-radius: 13px;
  color: #638078;
  background: #f8fbfa;
}

.catalog-search > svg,
.catalog-search button svg {
  width: 18px;
  height: 18px;
}

.catalog-search input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: #203532;
  background: transparent;
  font: inherit;
}

.catalog-search button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: #7a8b87;
  background: transparent;
  cursor: pointer;
}

.category-tabs {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  overflow-x: auto;
}

.category-tabs button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #657975;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
}

.category-tabs button svg {
  width: 16px;
  height: 16px;
}

.category-tabs button small {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 999px;
  color: #71817e;
  background: #edf3f1;
}

.category-tabs button.active {
  border-color: #b9d9cf;
  color: #1f6956;
  background: #edf8f4;
}

.featured-section,
.all-apps-section {
  display: grid;
  gap: 16px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.section-heading h2 {
  margin: 0;
  color: #172c29;
  font-size: 22px;
}

.section-heading p {
  margin: 0;
  color: #82918e;
  font-size: 13px;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.featured-card {
  position: relative;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) 22px;
  gap: 16px;
  align-items: start;
  min-height: 190px;
  padding: 24px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, #dce8e4);
  border-radius: 22px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--accent) 8%, white), white 66%);
  box-shadow: 0 14px 34px rgba(38, 70, 68, 0.07);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.featured-card::after {
  position: absolute;
  right: -34px;
  bottom: -46px;
  width: 128px;
  height: 128px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  content: '';
}

.featured-card:hover,
.app-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 42px rgba(38, 70, 68, 0.12);
}

.featured-icon,
.app-icon {
  display: grid;
  place-items: center;
  color: #ffffff;
  background: var(--accent);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--accent) 28%, transparent);
}

.featured-icon {
  width: 56px;
  height: 56px;
  border-radius: 17px;
}

.featured-icon svg {
  width: 27px;
  height: 27px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.featured-copy h3,
.app-copy h3 {
  margin: 0;
  color: #18312d;
}

.featured-copy h3 {
  font-size: 20px;
}

.featured-copy p,
.app-copy p {
  color: #6f807c;
  line-height: 1.7;
}

.featured-copy p {
  margin: 12px 0 18px;
  font-size: 13px;
}

.featured-arrow {
  width: 20px;
  height: 20px;
  margin-top: 4px;
  color: var(--accent);
}

.status-pill {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.status-pill.live {
  color: #1f755c;
  background: #def4eb;
}

.status-pill.preview {
  color: #8b621d;
  background: #fff1d2;
}

.status-pill.planned {
  color: #7b8180;
  background: #edf0ef;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-row span {
  padding: 5px 9px;
  border-radius: 999px;
  color: #55736b;
  background: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

.tag-row.compact span {
  background: #f0f5f3;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.app-card {
  display: flex;
  min-height: 270px;
  flex-direction: column;
  padding: 22px;
  border: 1px solid #e0eae7;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(38, 70, 68, 0.06);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.app-card.disabled {
  cursor: default;
  opacity: 0.72;
}

.app-card-head,
.app-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-icon {
  width: 48px;
  height: 48px;
  border-radius: 15px;
}

.app-icon svg {
  width: 23px;
  height: 23px;
}

.app-copy {
  margin-top: 20px;
}

.app-category {
  display: block;
  margin-bottom: 8px;
  color: var(--accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.app-copy h3 {
  font-size: 18px;
}

.app-copy p {
  min-height: 66px;
  margin: 10px 0 16px;
  font-size: 13px;
}

.app-card-foot {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #edf2f0;
  color: #81908d;
  font-size: 12px;
}

.open-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-weight: 700;
}

.open-link svg {
  width: 15px;
  height: 15px;
}

.empty-catalog {
  display: grid;
  justify-items: center;
  padding: 64px 24px;
  border: 1px dashed #cddbd7;
  border-radius: 22px;
  color: #748681;
  background: #f9fbfa;
  text-align: center;
}

.empty-catalog > svg {
  width: 34px;
  height: 34px;
  margin-bottom: 14px;
  color: #7fa297;
}

.empty-catalog strong {
  color: #304743;
  font-size: 17px;
}

.empty-catalog p {
  margin: 8px 0 18px;
}

.empty-catalog button {
  min-height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  color: #ffffff;
  background: #2f7f6b;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .center-hero,
  .catalog-toolbar {
    grid-template-columns: 1fr;
  }

  .center-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .category-tabs {
    justify-content: flex-start;
  }

  .featured-grid,
  .app-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .center-hero {
    padding: 24px;
  }

  .catalog-stats {
    min-width: 0;
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .featured-grid,
  .app-grid {
    grid-template-columns: 1fr;
  }

  .featured-card {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .featured-arrow {
    display: none;
  }
}
</style>
