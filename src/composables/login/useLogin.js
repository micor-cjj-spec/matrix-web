import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import {
    loginByAccount,
    loginByPhone,
    getCaptcha,
    generateQrCode,
    checkQrStatus,
    sendSmsCode,
} from '@/api/auth.js'

export function useLogin(router, snackbar) {
    const activeTab = ref('account')
    const loading = ref(false)
    const showPassword = ref(false)

    const formRef = ref()
    const phoneFormRef = ref()
    const validAccount = ref(false)
    const validPhone = ref(false)

    // 新增：短信验证码倒计时
    const smsCountdown = ref(0)
    let smsTimer = null

    const form = reactive({
        account: {
            username: '',
            password: '',
            captcha: '',
            captchaKey: '',
        },
        phone: {
            mobile: '',
            code: '',
        },
        qrcode: {
            token: '',
            imageUrl: '',
            pollingTimer: null,
        },
    })

    // 获取图形验证码
    const captchaUrl = ref('')
    const refreshCaptcha = async () => {
        try {
            const res = await getCaptcha()
            if (res.data?.img && res.data?.captchaKey) {
                captchaUrl.value = res.data.img
                form.account.captchaKey = res.data.captchaKey
            } else {
                captchaUrl.value = `/auth/captcha?_t=${Date.now()}`
                form.account.captchaKey = ''
            }
        } catch (e) {
            showMsg('获取验证码失败', 'error')
            captchaUrl.value = `/auth/captcha?_t=${Date.now()}`
            form.account.captchaKey = ''
        }
    }

    // 全局弹窗消息
    function showMsg(text, color = 'success') {
        if (snackbar) {
            snackbar.value.text = text
            snackbar.value.color = color
            snackbar.value.show = true
        } else {
            alert(text)
        }
    }

    // 轮询扫码登录状态
    const startQrPolling = () => {
        if (form.qrcode.pollingTimer) clearInterval(form.qrcode.pollingTimer)
        form.qrcode.pollingTimer = setInterval(async () => {
            try {
                const res = await checkQrStatus(form.qrcode.token)
                if (res.data?.status === 'success') {
                    showMsg('扫码登录成功', 'success')
                    clearInterval(form.qrcode.pollingTimer)
                    form.qrcode.pollingTimer = null
                    await router.push('/portal')
                } else if (res.data?.status === 'expired') {
                    showMsg('二维码已过期，请刷新', 'error')
                    clearInterval(form.qrcode.pollingTimer)
                    form.qrcode.pollingTimer = null
                }
            } catch (e) {
                // 网络/后端错误仅打印不弹窗，避免刷屏
                console.error('轮询扫码状态失败', e)
            }
        }, 2000)
    }

    // 刷新二维码
    const refreshQrCode = async () => {
        try {
            if (form.qrcode.pollingTimer) clearInterval(form.qrcode.pollingTimer)
            const res = await generateQrCode()
            if (res.data?.imageUrl && res.data?.token) {
                form.qrcode.imageUrl = res.data.imageUrl
                form.qrcode.token = res.data.token
                startQrPolling()
            } else {
                showMsg('获取二维码失败', 'error')
            }
        } catch (e) {
            showMsg('获取二维码失败', 'error')
        }
    }

    // 手机号登录：发送短信验证码
    const sendSms = async () => {
        if (!/^1\d{10}$/.test(form.phone.mobile)) {
            showMsg('请输入正确的手机号', 'error')
            return
        }
        if (smsCountdown.value > 0) return // 避免重复点击

        try {
            loading.value = true
            await sendSmsCode(form.phone.mobile)
            showMsg('验证码已发送', 'success')
            smsCountdown.value = 60
            smsTimer = setInterval(() => {
                smsCountdown.value--
                if (smsCountdown.value <= 0) {
                    clearInterval(smsTimer)
                }
            }, 1000)
        } catch (e) {
            showMsg(e.response?.data?.message || '发送失败', 'error')
        } finally {
            loading.value = false
        }
    }

    // 登录逻辑
    const handleLogin = async () => {
        if (activeTab.value === 'account') {
            const valid = await formRef.value?.validate()
            if (valid) {
                loading.value = true
                try {
                    await loginByAccount({ ...form.account })
                    showMsg('登录成功', 'success')
                    resetAll()
                    router.push('/portal')
                } catch (e) {
                    showMsg(e.response?.data?.message || '登录失败', 'error')
                    refreshCaptcha()
                } finally {
                    loading.value = false
                }
            }
        } else if (activeTab.value === 'phone') {
            const valid = await phoneFormRef.value?.validate()
            if (valid) {
                loading.value = true
                try {
                    await loginByPhone({ ...form.phone })
                    showMsg('登录成功', 'success')
                    resetAll()
                    router.push('/portal')
                } catch (e) {
                    showMsg(e.response?.data?.message || '登录失败', 'error')
                } finally {
                    loading.value = false
                }
            }
        } else if (activeTab.value === 'qrcode') {
            showMsg('请扫码完成登录', 'info')
        }
    }

    // 切换Tab时清理定时器，防止资源泄露
    watch(activeTab, (val, oldVal) => {
        if (oldVal === 'qrcode' && form.qrcode.pollingTimer) {
            clearInterval(form.qrcode.pollingTimer)
            form.qrcode.pollingTimer = null
        }
        if (val === 'qrcode') {
            refreshQrCode()
        }
        // 切换其它Tab时清理输入
        if (val !== oldVal) {
            if (val === 'account') {
                form.account.password = ''
                form.account.captcha = ''
            } else if (val === 'phone') {
                form.phone.code = ''
            }
        }
    })

    // 登录后重置所有
    function resetAll() {
        form.account.username = ''
        form.account.password = ''
        form.account.captcha = ''
        form.account.captchaKey = ''
        form.phone.mobile = ''
        form.phone.code = ''
        if (form.qrcode.pollingTimer) {
            clearInterval(form.qrcode.pollingTimer)
            form.qrcode.pollingTimer = null
        }
        refreshCaptcha()
        refreshQrCode()
    }

    onMounted(() => {
        refreshCaptcha()
        refreshQrCode()
    })

    onUnmounted(() => {
        if (form.qrcode.pollingTimer) {
            clearInterval(form.qrcode.pollingTimer)
        }
        if (smsTimer) clearInterval(smsTimer)
    })

    return {
        activeTab,
        loading,
        form,
        formRef,
        phoneFormRef,
        captchaUrl,
        refreshCaptcha,
        handleLogin,
        refreshQrCode,
        validAccount,
        validPhone,
        showPassword,
        sendSms,
        smsCountdown,
    }
}
