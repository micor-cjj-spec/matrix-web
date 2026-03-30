export const docTypeRootOptions = [
  { title: '应收', value: 'AR' },
  { title: '应付', value: 'AP' },
]

export const groupDimensionOptions = [
  { title: '按往来方', value: 'COUNTERPARTY' },
  { title: '按单据类型', value: 'DOCTYPE' },
  { title: '按单据状态', value: 'STATUS' },
  { title: '按往来方 + 单据类型', value: 'COUNTERPARTY_DOCTYPE' },
  { title: '按角色', value: 'ROLE' },
]

export function formatAmount(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function currentDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function docTypeRootLabel(value) {
  return {
    AR: '应收',
    AP: '应付',
  }[value] || value || '-'
}

export function groupDimensionLabel(value) {
  return groupDimensionOptions.find((item) => item.value === value)?.title || value || '-'
}

export function roleLabel(value) {
  return {
    SOURCE: '源单据',
    TARGET: '结算单据',
    OTHER: '其他单据',
  }[value] || value || '-'
}

export function writeoffStatusLabel(value) {
  return {
    UNWRITTEN: '未核销',
    PARTIAL: '部分核销',
    FULL: '已核销',
  }[value] || value || '-'
}

export function writeoffStatusColor(value) {
  return {
    UNWRITTEN: 'warning',
    PARTIAL: 'info',
    FULL: 'success',
  }[value] || 'default'
}

export function riskLabel(value) {
  return value ? '预警' : '正常'
}

export function riskColor(value) {
  return value ? 'warning' : 'success'
}

export function logStatusLabel(value) {
  return {
    DONE: '已完成',
    FAILED: '失败',
  }[value] || value || '-'
}

export function roleTone(value) {
  return {
    SOURCE: 'primary',
    TARGET: 'success',
    OTHER: 'default',
  }[value] || 'default'
}
