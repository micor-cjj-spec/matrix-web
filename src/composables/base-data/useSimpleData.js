import { ref } from 'vue'

export function useSimpleData(api, fields = ['fid','fname','fcode','fstatus']) {
  const list = ref([])
  const loading = ref(false)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await api.fetchList()
      list.value = (res.data?.records || []).map(i => ({
        ...fields.reduce((a, k) => ({ ...a, [k]: '' }), {}),
        ...i,
      }))
    } finally {
      loading.value = false
    }
  }

  const createItem = async (item) => {
    const data = { ...item }
    delete data.fid
    await api.createItem(data)
    await fetchList()
  }

  const editItem = async (item) => {
    await api.editItem(item)
    await fetchList()
  }

  const deleteItem = async (item) => {
    await api.deleteItem(item.fid)
    await fetchList()
  }

  const submitItem = async (item) => {
    if (!api.submitItem) return
    await api.submitItem(item.fid)
    await fetchList()
  }

  const auditItem = async (item) => {
    if (!api.auditItem) return
    await api.auditItem(item.fid)
    await fetchList()
  }

  const rejectItem = async (item) => {
    if (!api.rejectItem) return
    await api.rejectItem(item.fid)
    await fetchList()
  }

  return { list, loading, fetchList, createItem, editItem, deleteItem, submitItem, auditItem, rejectItem }
}
