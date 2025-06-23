
import { ref, computed } from 'vue'
import { getDepartmentList, createDepartment as createApi, editDepartment as editApi, deleteDepartment as deleteApi } from '@/api/deptDimension.js'

const DEPT_FIELDS = ['fid', 'fname', 'fcode', 'fparentid', 'fstatus']

export function useDeptDimension() {
    const loading = ref(false)
    const deptList = ref([])

    const deptTree = computed(() => buildTree(deptList.value))


    const fetchDepartmentList = async () => {
        loading.value = true
        try {
            const res = await getDepartmentList()
            deptList.value = (res.data?.records || []).map(d => ({
                ...DEPT_FIELDS.reduce((acc, k) => ({ ...acc, [k]: '' }), {}),
                ...d
            }))
        } finally {
            loading.value = false
        }
    }

    const createDepartment = async (dept) => {
        const data = { ...dept }
        delete data.fid
        await createApi(data)
        await fetchDepartmentList()
    }

    const editDepartment = async (dept) => {
        await editApi(dept)
        await fetchDepartmentList()
    }

    const deleteDepartment = async (dept) => {
        await deleteApi(dept.fid)
        await fetchDepartmentList()
    }

    return {
        deptList,
        deptTree,
        loading,
        fetchDepartmentList,
        createDepartment,
        editDepartment,
        deleteDepartment,
    }
}

function buildTree(list, idKey = 'fid', parentKey = 'fparentid') {
    const map = {}
    const roots = []
    list.forEach(item => {
        map[item[idKey]] = { ...item, children: [] }
    })
    list.forEach(item => {
        const parentId = item[parentKey]
        if (parentId && map[parentId]) {
            map[parentId].children.push(map[item[idKey]])
        } else {
            roots.push(map[item[idKey]])
        }
    })
    return roots
}
