import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerByEmail, sendEmailCode } from '@/api/auth'

export function useRegister() {
  const router = useRouter()
  const valid = ref(false)
  const formRef = ref()
  const form = reactive({
    email: '',
    code: '',
    password: '',
    confirmPassword: '',
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

  async function isFormValid() {
    const result = await formRef.value?.validate?.()
    if (typeof result === 'boolean') return result
    return !!result?.valid
  }

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
      smsTimer = window.setInterval(() => {
        smsCountdown.value -= 1
        if (smsCountdown.value <= 0) {
          window.clearInterval(smsTimer)
          smsTimer = null
        }
      }, 1000)
    } catch (error) {
      showMsg(error?.response?.data?.msg || error?.response?.data?.message || '发送失败', 'error')
    } finally {
      loading.value = false
    }
  }

  async function handleRegister() {
    if (!(await isFormValid())) return

    loading.value = true
    try {
      await registerByEmail({
        email: form.email,
        password: form.password,
        code: form.code,
      })
      showMsg('注册成功，即将跳转登录', 'success')
      window.setTimeout(() => {
        router.push('/login')
      }, 1200)
    } catch (error) {
      showMsg(error?.response?.data?.msg || error?.response?.data?.message || error.message || '注册失败', 'error')
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
