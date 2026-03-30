import { getAccountSubjectList } from '@/api/accountSubject'
import cashflowItemApi from '@/api/cashflowItem'

export function createDefaultDateRange() {
  const now = new Date()
  return {
    startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    endDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  }
}

export function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function directionLabel(value) {
  const mapping = {
    DEBIT: '借',
    CREDIT: '贷',
    借: '借',
    贷: '贷',
    平: '平',
  }
  return mapping[value] || value || '-'
}

export async function loadAccountOptions() {
  const res = await getAccountSubjectList({ page: 1, size: 500 })
  const records = res.data?.records || []
  return records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fcode,
  }))
}

export async function loadCashflowOptions() {
  const res = await cashflowItemApi.fetchList({ page: 1, size: 500 })
  const records = res.data?.records || []
  return records.map((item) => ({
    label: `${item.fcode || '-'} - ${item.fname || '-'}`,
    value: item.fcode,
  }))
}
