import { ref } from 'vue'
import { getUserList, createUser, editUser, deleteUser } from '@/api/user.js'

// 实体类的所有主要字段（根据后端字段覆盖即可，下面为示例）
const USER_FIELDS = [
    'fid', 'ftid', 'fnumber', 'fphone', 'femail', 'fstatus', 'fgender', 'fbirthday',
    'fidcard', 'favatar', 'fnickname', 'ffullpinyin', 'fsimplepinyin', 'fdptid',
    'fpositionid', 'fsortcode', 'fbillssatusfield', 'fhiredate', 'fenable',
    'fsource', 'fmaintain', 'fstartdate', 'fenddate', 'fmasterid', 'fheadsculpture',
    'ftruename', 'fcountryid'
]

export function usePersonal() {
    const loading = ref(false)
    const personalList = ref([])

    // 拉取数据（根据后端返回结构适配，默认 records）
    const fetchPersonalList = async () => {
        loading.value = true
        try {
            const res = await getUserList()
            // 保证每个用户对象字段全量，有些接口返回字段缺失会导致编辑无回显
            personalList.value = (res.data?.records || []).map(u => ({
                ...USER_FIELDS.reduce((acc, k) => ({ ...acc, [k]: '' }), {}),
                ...u
            }))
        } finally {
            loading.value = false
        }
    }

    const createPersonal = async (user) => {
        // 新建时丢弃 fid 等主键，避免后端误认为是编辑
        const data = { ...user }
        delete data.fid
        await createUser(data)
        await fetchPersonalList()
    }

    const editPersonal = async (user) => {
        await editUser(user)
        await fetchPersonalList()
    }

    const deletePersonal = async (user) => {
        await deleteUser(user.fid)
        await fetchPersonalList()
    }

    return {
        personalList,
        loading,
        fetchPersonalList,
        createPersonal,
        editPersonal,
        deletePersonal
    }
}
