import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  checkQrStatus,
  generateQrCode,
  getCaptcha,
  loginByAccount,
  loginByPhone,
  sendSmsCode,
} from '@/api/auth.js'
import { saveToken } from '@/utils/auth'

export function useLogin(router, snackbar) {
  const activeTab = ref('account')
  const loading = ref(false)
  const showPassword = ref(false)

  const formRef = ref()
  const phoneFormRef = ref()
  const validAccount = ref(false)
  const validPhone = ref(false)
  const needCaptcha = ref(false)
  const captchaUrl = ref('')
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

  function showMsg(text, color = 'success') {
    if (snackbar?.value) {
      snackbar.value.text = text
      snackbar.value.color = color
      snackbar.value.show = true
      return
    }
    window.alert(text)
  }

  async function isFormValid(targetRef) {
    const result = await targetRef.value?.validate?.()
    if (typeof result === 'boolean') return result
    return !!result?.valid
  }

  async function refreshCaptcha() {
    try {
      const res = await getCaptcha()
      if (res.data?.img && res.data?.captchaKey) {
        captchaUrl.value = res.data.img
        form.account.captchaKey = res.data.captchaKey
        return
      }
      captchaUrl.value = `/auth/captcha?_t=${Date.now()}`
      form.account.captchaKey = ''
    } catch (error) {
      captchaUrl.value = `/auth/captcha?_t=${Date.now()}`
      form.account.captchaKey = ''
    }
  }

  function stopQrPolling() {
    if (form.qrcode.pollingTimer) {
      window.clearInterval(form.qrcode.pollingTimer)
      form.qrcode.pollingTimer = null
    }
  }

  function startQrPolling() {
    stopQrPolling()
    form.qrcode.pollingTimer = window.setInterval(async () => {
      try {
        const res = await checkQrStatus(form.qrcode.token)
        if (res.data?.status === 'success') {
          const token = res.data?.token
          if (token) saveToken(token)
          showMsg('扫码登录成功', 'success')
          stopQrPolling()
          await router.push('/portal')
        } else if (res.data?.status === 'expired') {
          showMsg('二维码已过期，请刷新', 'error')
          stopQrPolling()
        }
      } catch (error) {
        console.error('轮询扫码状态失败', error)
      }
    }, 2000)
  }

  async function refreshQrCode() {
    try {
      stopQrPolling()
      const res = await generateQrCode()
      if (res.data?.imageUrl && res.data?.token) {
        form.qrcode.imageUrl = res.data.imageUrl
        form.qrcode.token = res.data.token
        startQrPolling()
        return
      }
      showMsg('获取二维码失败', 'error')
    } catch (error) {
      showMsg('获取二维码失败', 'error')
    }
  }

  async function sendSms() {
    if (!/^1\d{10}$/.test(form.phone.mobile)) {
      showMsg('请输入正确的手机号', 'error')
      return
    }
    if (smsCountdown.value > 0) return

    try {
      loading.value = true
      await sendSmsCode(form.phone.mobile)
      showMsg('验证码已发送', 'success')
      smsCountdown.value = 60
      smsTimer = window.setInterval(() => {
        smsCountdown.value -= 1
        if (smsCountdown.value <= 0) {
          window.clearInterval(smsTimer)
          smsTimer = null
        }
      }, 1000)
    } catch (error) {
      showMsg(error.response?.data?.message || '发送失败', 'error')
    } finally {
      loading.value = false
    }
  }

  const captchaRules = [
    (v) => !needCaptcha.value || !!v || '请输入验证码',
  ]

  async function handleLogin() {
    if (activeTab.value === 'account') {
      if (!(await isFormValid(formRef))) return

      loading.value = true
      try {
        const res = await loginByAccount({ ...form.account })
        const token = res?.token || res?.data?.token
        if (token) saveToken(token)
        showMsg('登录成功', 'success')
        resetAll()
        await router.push('/portal')
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data?.msg || '登录失败'
        if (msg.includes('验证码') || msg.includes('3次')) {
          needCaptcha.value = true
          refreshCaptcha()
        }
        showMsg(msg, 'error')
      } finally {
        loading.value = false
      }
      return
    }

    if (activeTab.value === 'phone') {
      if (!(await isFormValid(phoneFormRef))) return

      loading.value = true
      try {
        const res = await loginByPhone({ ...form.phone })
        const token = res?.token || res?.data?.token
        if (token) saveToken(token)
        showMsg('登录成功', 'success')
        resetAll()
        await router.push('/portal')
      } catch (error) {
        showMsg(error.response?.data?.message || '登录失败', 'error')
      } finally {
        loading.value = false
      }
      return
    }

    showMsg('请扫码完成登录', 'info')
  }

  watch(activeTab, (value, oldValue) => {
    if (oldValue === 'qrcode') stopQrPolling()
    if (value === 'qrcode') refreshQrCode()
    if (value === 'account') {
      form.account.password = ''
      form.account.captcha = ''
    }
    if (value === 'phone') {
      form.phone.code = ''
    }
  })

  function resetAll() {
    form.account.username = ''
    form.account.password = ''
    form.account.captcha = ''
    form.account.captchaKey = ''
    form.phone.mobile = ''
    form.phone.code = ''
    needCaptcha.value = false
    stopQrPolling()
  }

  onMounted(() => {
    refreshCaptcha()
  })

  onUnmounted(() => {
    stopQrPolling()
    if (smsTimer) {
      window.clearInterval(smsTimer)
    }
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
    needCaptcha,
    captchaRules,
  }
}
