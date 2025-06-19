import { ref, computed, watch } from 'vue'

export function useUserEditDialog() {
    const props = defineProps({
        visible: Boolean,
        mode: String, // 'create' or 'edit'
        user: Object,
        loading: Boolean,
    })
    const emit = defineEmits(['update:visible', 'submit', 'cancel'])

    const visible = computed({
        get: () => props.visible,
        set: v => emit('update:visible', v),
    })
    const valid = ref(false)
    const formRef = ref()
    const mode = computed(() => props.mode)

    // 字段全量
    const form = ref({
        fid: null,
        ftid: '',
        fnumber: '', fphone: '', femail: '', fstatus: '', fgender: '', fbirthday: '',
        fidcard: '', favatar: '', favatarFile: null,
        fnickname: '', ffullpinyin: '', fsimplepinyin: '',
        fdptid: '', fpositionid: '', fsortcode: '', fbillssatusfield: '', fhiredate: '',
        fenable: '', fsource: '', fmaintain: '', fheadsculpture: '', ftruename: '', fcountryid: '',
        fmasterid: ''
    })

    watch(() => props.user, (val) => {
        if (props.mode === 'edit' && val) {
            Object.assign(form.value, val)
        } else {
            Object.keys(form.value).forEach(key => form.value[key] = '')
            form.value.fid = null
        }
    }, { immediate: true })

    // 日期
    const birthdayMenu = ref(false)
    const hiredateMenu = ref(false)
    const birthdayFormatted = computed(() => form.value.fbirthday ? String(form.value.fbirthday).slice(0, 10) : '')
    const hiredateFormatted = computed(() => form.value.fhiredate ? String(form.value.fhiredate).slice(0, 10) : '')

    async function onSubmit() {
        const validForm = await formRef.value?.validate?.()
        if (!validForm) return
        emit('submit', { ...form.value })
    }
    function onCancel() {
        emit('cancel')
        visible.value = false
    }

    return {
        props,
        visible,
        valid,
        form,
        formRef,
        mode,
        birthdayMenu,
        hiredateMenu,
        birthdayFormatted,
        hiredateFormatted,
        onSubmit,
        onCancel,
    }
}
