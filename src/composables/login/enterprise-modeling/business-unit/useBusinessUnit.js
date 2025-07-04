import { ref } from 'vue'
import { getBusinessUnitList, createBusinessUnit as createApi, editBusinessUnit as editApi, deleteBusinessUnit as deleteApi } from '@/api/bizUnit.js'

// Fields of business unit entity
const UNIT_FIELDS = [
    'fid',
    'fcode',
    'fname',
    'fshort_name',
    'fmanage_org_code',
    'fmanage_org_name',
    'fusagestatus',
]

export function useBusinessUnit() {
    const loading = ref(false)
    const unitList = ref([])

    const fetchBusinessUnitList = async () => {
        loading.value = true
        try {
            const res = await getBusinessUnitList()
            unitList.value = (res.data?.records || []).map(u => ({
                ...UNIT_FIELDS.reduce((acc, k) => ({ ...acc, [k]: '' }), {}),
                ...u
            }))
        } finally {
            loading.value = false
        }
    }

    const createBusinessUnit = async (unit) => {
        const data = { ...unit }
        delete data.fid
        await createApi(data)
        await fetchBusinessUnitList()
    }

    const editBusinessUnit = async (unit) => {
        await editApi(unit)
        await fetchBusinessUnitList()
    }

    const deleteBusinessUnit = async (unit) => {
        await deleteApi(unit.fid)
        await fetchBusinessUnitList()
    }

    return {
        unitList,
        loading,
        fetchBusinessUnitList,
        createBusinessUnit,
        editBusinessUnit,
        deleteBusinessUnit,
    }
}
