import { getBusinessUnitList } from '@/api/bizUnit'

export const periodSourceMap = {
  PARAM: '页面输入',
  ORG_CONFIG: '组织财务参数',
  SYSTEM: '系统当前月份',
}

export const taskStatusMap = {
  READY: { label: '可执行', color: 'success' },
  WARNING: { label: '需处理', color: 'warning' },
  PENDING: { label: '待准备', color: 'grey' },
  DONE: { label: '已完成', color: 'primary' },
}

export const moduleStatusMap = {
  READY: { label: '就绪', color: 'success' },
  WARNING: { label: '阻塞', color: 'warning' },
  PENDING: { label: '待准备', color: 'grey' },
  DONE: { label: '已完成', color: 'primary' },
}

export const closeStatusMap = {
  READY: { label: '可关账', color: 'success' },
  WARNING: { label: '有预警', color: 'warning' },
  BLOCKED: { label: '阻塞', color: 'error' },
  CLOSED: { label: '已关账', color: 'primary' },
}

export const checkStatusMap = {
  PASSED: { label: '已通过', color: 'success' },
  WARNING: { label: '预警', color: 'warning' },
  BLOCKED: { label: '阻塞', color: 'error' },
  PENDING: { label: '待确认', color: 'grey' },
}

export const checkCategoryMap = {
  FOUNDATION: '基础资料',
  VOUCHER: '凭证',
  LEDGER: '总账',
  PERIOD_END: '期末处理',
  REPORT: '报表',
  CLOSE: '关账',
}

export const severityMap = {
  HIGH: { label: '高', color: 'error' },
  MEDIUM: { label: '中', color: 'warning' },
  LOW: { label: '低', color: 'success' },
}

export function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatAmount(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function periodSourceLabel(value) {
  return periodSourceMap[value] || value || '-'
}

export function taskStatusLabel(value) {
  return taskStatusMap[value]?.label || value || '-'
}

export function taskStatusColor(value) {
  return taskStatusMap[value]?.color || 'default'
}

export function moduleStatusLabel(value) {
  return moduleStatusMap[value]?.label || value || '-'
}

export function moduleStatusColor(value) {
  return moduleStatusMap[value]?.color || 'default'
}

export function closeStatusLabel(value) {
  return closeStatusMap[value]?.label || value || '-'
}

export function closeStatusColor(value) {
  return closeStatusMap[value]?.color || 'default'
}

export function checkStatusLabel(value) {
  return checkStatusMap[value]?.label || value || '-'
}

export function checkStatusColor(value) {
  return checkStatusMap[value]?.color || 'default'
}

export function checkCategoryLabel(value) {
  return checkCategoryMap[value] || value || '-'
}

export function severityLabel(value) {
  return severityMap[value]?.label || value || '-'
}

export function severityColor(value) {
  return severityMap[value]?.color || 'default'
}

export function voucherStatusLabel(value) {
  const mapping = {
    DRAFT: '草稿',
    SUBMITTED: '已提交',
    AUDITED: '已审核',
    POSTED: '已过账',
    REJECTED: '已驳回',
    REVERSED: '已冲销',
  }
  return mapping[value] || value || '-'
}

export async function loadOrgOptions() {
  const res = await getBusinessUnitList({ page: 1, size: 500 })
  const records = res.data?.records || []
  return records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fid,
  }))
}
