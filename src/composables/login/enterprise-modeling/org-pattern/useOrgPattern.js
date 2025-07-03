import { ref } from 'vue'
import { getOrgPatternList, createOrgPattern as createApi, editOrgPattern as editApi, deleteOrgPattern as deleteApi } from '@/api/orgPattern'

const FIELDS = ['fid','fbillno','fname','fpattern','fenable']

export function useOrgPattern() {
  const list = ref([])
  const loading = ref(false)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await getOrgPatternList()
      list.value = (res.data?.records || []).map(i => ({
        ...FIELDS.reduce((a,k)=>({ ...a, [k]: '' }), {}),
        ...i
      }))
    } finally {
      loading.value = false
    }
  }

  const createItem = async (item) => {
    const data = { ...item }
    delete data.fid
    await createApi(data)
    await fetchList()
  }

  const editItem = async (item) => {
    await editApi(item)
    await fetchList()
  }

  const deleteItem = async (item) => {
    await deleteApi(item.fid)
    await fetchList()
  }

  return { list, loading, fetchList, createItem, editItem, deleteItem }
}
