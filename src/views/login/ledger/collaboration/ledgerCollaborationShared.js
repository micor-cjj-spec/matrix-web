export const docTypeRootOptions = [
  { title: '全部', value: 'ALL' },
  { title: '应收', value: 'AR' },
  { title: '应付', value: 'AP' },
]

export const offsetMatchOptions = [
  { title: '全部', value: 'ALL' },
  { title: '已配对', value: 'PAIRED' },
  { title: '孤儿记录', value: 'ORPHAN' },
]

export const issueOptions = [
  { title: '全部', value: 'ALL' },
  { title: '分录缺失', value: 'MISSING_LINES' },
  { title: '借贷不平', value: 'LINE_NOT_BALANCED' },
  { title: '表头金额不符', value: 'HEADER_LINE_AMOUNT' },
  { title: '重复凭证号', value: 'DUPLICATE_NUMBER' },
  { title: '缺少总账分录', value: 'MISSING_GL_ENTRY' },
  { title: '总账条数不符', value: 'GL_LINE_COUNT_DIFF' },
  { title: '总账金额不符', value: 'GL_LINE_MISMATCH' },
  { title: '提前生成总账', value: 'PREMATURE_GL_ENTRY' },
]

export const severityOptions = [
  { title: '全部', value: 'ALL' },
  { title: '高', value: 'HIGH' },
  { title: '中', value: 'MEDIUM' },
  { title: '低', value: 'LOW' },
]

export const voucherStatusOptions = [
  { title: '全部', value: 'ALL' },
  { title: '草稿', value: 'DRAFT' },
  { title: '已提交', value: 'SUBMITTED' },
  { title: '已审核', value: 'AUDITED' },
  { title: '已过账', value: 'POSTED' },
  { title: '已驳回', value: 'REJECTED' },
  { title: '已冲销', value: 'REVERSED' },
]

export function createDefaultDateRange() {
  const now = new Date()
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return { startDate, endDate }
}

export function formatAmount(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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

export function voucherStatusLabel(value) {
  return {
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    AUDITED: '已审核',
    POSTED: '已过账',
    REJECTED: '已驳回',
    REVERSED: '已冲销',
  }[value] || value || '-'
}

export function voucherStatusColor(value) {
  return {
    DRAFT: 'default',
    SUBMITTED: 'warning',
    AUDITED: 'info',
    POSTED: 'success',
    REJECTED: 'error',
    REVERSED: 'secondary',
  }[value] || 'default'
}

export function matchStatusLabel(value) {
  return {
    PAIRED: '已配对',
    ORPHAN: '孤儿记录',
    MATCH: '一致',
    DIFF: '存在差异',
  }[value] || value || '-'
}

export function matchStatusColor(value) {
  return {
    PAIRED: 'success',
    ORPHAN: 'warning',
    MATCH: 'success',
    DIFF: 'error',
  }[value] || 'default'
}
