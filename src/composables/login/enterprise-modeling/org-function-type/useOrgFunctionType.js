import { ref } from 'vue'
import { getOrgFunctionTypeList, createOrgFunctionType as createApi, editOrgFunctionType as editApi, deleteOrgFunctionType as deleteApi } from '@/api/orgFunctionType'

const FIELDS = ['fid','fname','fnumber','ftype','fbasefunction','fcustom']

export function useOrgFunctionType() {
  const list = ref([])
  const loading = ref(false)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await getOrgFunctionTypeList()
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
