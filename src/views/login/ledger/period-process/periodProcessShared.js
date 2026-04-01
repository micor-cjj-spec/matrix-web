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
