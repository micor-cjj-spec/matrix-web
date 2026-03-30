export const docTypeRootOptions = [
  { title: '应收', value: 'AR' },
  { title: '应付', value: 'AP' },
]

export const statusOptions = [
  { title: '全部', value: 'ALL' },
  { title: '处理中', value: 'OPEN' },
  { title: '已解决', value: 'RESOLVED' },
]

export const severityOptions = [
  { title: '全部', value: '' },
  { title: '高', value: 'HIGH' },
  { title: '中', value: 'MEDIUM' },
  { title: '低', value: 'LOW' },
]

export const cashflowSourceOptions = [
  { title: '全部', value: '' },
  { title: '未知编码', value: 'UNKNOWN_ITEM' },
  { title: '多编码复核', value: 'MIXED_ITEM' },
  { title: '规则推断', value: 'HEURISTIC' },
  { title: '现金划转', value: 'CASH_TRANSFER' },
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

export function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function statusLabel(value) {
  return {
    OPEN: '处理中',
    RESOLVED: '已解决',
  }[value] || value || '-'
}

export function statusColor(value) {
  return {
    OPEN: 'warning',
    RESOLVED: 'success',
  }[value] || 'default'
}

export function severityLabel(value) {
  return {
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  }[value] || value || '-'
}

export function severityColor(value) {
  return {
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info',
  }[value] || 'default'
}

export function matchStatusLabel(value) {
  return {
    ONGOING: '仍需处理',
    RESOLVED: '已解除',
  }[value] || value || '-'
}

export function matchStatusColor(value) {
  return {
    ONGOING: 'warning',
    RESOLVED: 'success',
  }[value] || 'default'
}

export function counterpartySourceLabel(value) {
  return {
    OVER_LIMIT: '超额度',
    OVERDUE: '超期',
    OPEN_AGING: '长期未清',
  }[value] || value || '-'
}

export function cashflowSourceLabel(value) {
  return {
    UNKNOWN_ITEM: '未知编码',
    MIXED_ITEM: '多编码复核',
    HEURISTIC: '规则推断',
    CASH_TRANSFER: '现金划转',
  }[value] || value || '-'
}
