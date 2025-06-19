import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { sendEmailCode, registerByEmail } from '@/api/auth' // 引入你刚加的接口方法

export function useRegister() {
    const router = useRouter()
    const valid = ref(false)
    const formRef = ref()
    const form = reactive({
        email: '',
        code: '',
        password: '',
        confirmPassword: ''
    })
    const loading = ref(false)
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const smsCountdown = ref(0)
    let smsTimer = null

    const snackbar = reactive({
        show: false,
        text: '',
        color: 'success',
    })

    function showMsg(text, color = 'success') {
        snackbar.text = text
        snackbar.color = color
        snackbar.show = true
    }

    // 发送邮箱验证码（真实接口）
    async function handleSendEmailCode() {
        if (!form.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email)) {
            showMsg('请输入正确的邮箱', 'error')
            return
        }
        if (smsCountdown.value > 0) return
        try {
            loading.value = true
            await sendEmailCode(form.email)
            showMsg('验证码已发送到邮箱', 'success')
            smsCountdown.value = 60
            smsTimer = setInterval(() => {
                smsCountdown.value--
                if (smsCountdown.value <= 0) clearInterval(smsTimer)
            }, 1000)
        } catch (e) {
            showMsg((e?.response?.data?.msg) || '发送失败', 'error')
        } finally {
            loading.value = false
        }
    }

    // 注册逻辑（真实接口）
    async function handleRegister() {
        const validForm = await formRef.value?.validate()
        if (!validForm) return
        loading.value = true
        try {
            await registerByEmail({
                email: form.email,
                password: form.password,
                code: form.code
            })
            showMsg('注册成功！即将跳转登录', 'success')
            setTimeout(() => {
                router.push('/login')
            }, 1500)
        } catch (e) {
            showMsg((e?.response?.data?.msg) || e.message || '注册失败', 'error')
        } finally {
            loading.value = false
        }
    }

    return {
        form,
        formRef,
        valid,
        loading,
        showPassword,
        showConfirmPassword,
        smsCountdown,
        snackbar,
        handleSendEmailCode,
        handleRegister,
    }
}
