import { ref } from 'vue'
import {
  fetchSimpleList,
  createSimpleData,
  editSimpleData,
  deleteSimpleData,
} from '@/api/simpleData'

export function useSimpleData(basePath, fields = ['fid','fname','fcode']) {
  const list = ref([])
  const loading = ref(false)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await fetchSimpleList(basePath)
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
    await createSimpleData(basePath, data)
    await fetchList()
  }

  const editItem = async (item) => {
    await editSimpleData(basePath, item)
    await fetchList()
  }

  const deleteItem = async (item) => {
    await deleteSimpleData(basePath, item.fid)
    await fetchList()
  }

  return { list, loading, fetchList, createItem, editItem, deleteItem }
}
