<template>
  <div class="register-background">
    <v-card class="register-card" elevation="10">
      <div class="register-header">
        <img src="/vite.svg" alt="logo" class="logo" />
        <h2 class="title">注册新账号</h2>
      </div>

      <v-form ref="formRef" v-model="valid" class="register-form">
        <v-text-field
            v-model="form.email"
            label="邮箱"
            prepend-inner-icon="mdi-email"
            :rules="[
            v => !!v || '请输入邮箱',
            v => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/.test(v) || '邮箱格式错误'
          ]"
            required
            density="comfortable"
        />
        <div class="sms-box">
          <v-text-field
              v-model="form.code"
              label="邮箱验证码"
              prepend-inner-icon="mdi-email-fast"
              :rules="[v => !!v || '请输入验证码']"
              required
              class="sms-input"
              density="comfortable"
          />
          <v-btn
              variant="tonal"
              color="primary"
              :disabled="smsCountdown > 0 || loading"
              @click="handleSendEmailCode"
              class="sms-btn"
          >
            {{ smsCountdown > 0 ? smsCountdown + 's后重发' : '获取验证码' }}
          </v-btn>
        </div>
        <v-text-field
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            label="密码"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPassword = !showPassword"
            :rules="[
            v => !!v || '请输入密码',
            v => v.length >= 6 || '密码不能少于6位'
          ]"
            required
            density="comfortable"
        />
        <v-text-field
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            label="确认密码"
            prepend-inner-icon="mdi-lock-check"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
            :rules="[
            v => !!v || '请再次输入密码',
            v => v === form.password || '两次密码不一致'
          ]"
            required
            density="comfortable"
        />
      </v-form>

      <v-btn
          color="primary"
          block
          size="x-large"
          class="register-btn"
          :loading="loading"
          @click="handleRegister"
      >
        注册
      </v-btn>

      <div class="login-link">
        已有账号？<RouterLink to="/login" class="link">去登录</RouterLink>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { useRegister } from '@/composables/login/useRegister.js'
import { RouterLink } from 'vue-router'

const {
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
} = useRegister()
</script>

<style scoped>
/* 样式同前 */
.register-background {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}
.register-card {
  width: 420px;
  max-width: 95vw;
  padding: 40px 35px 30px 35px;
  border-radius: 32px;
  background: #fff;
  box-shadow: 0 14px 60px 0 rgba(80, 120, 200, 0.12), 0 1.5px 5px 0 rgba(80, 120, 200, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18px;
}
.logo {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 16px #c1cffc3d;
}
.title {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  color: #22253c;
  margin-bottom: 0;
  letter-spacing: 2px;
}
.register-form {
  width: 100%;
  margin-bottom: 18px;
}
.sms-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sms-input {
  flex: 1 1 120px;
  min-width: 0;
}
.sms-btn {
  min-width: 110px;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  letter-spacing: 1px;
}
.register-btn {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 2px;
  box-shadow: 0 2px 14px #94b8ff38;
}
.login-link {
  width: 100%;
  text-align: right;
  margin-top: 12px;
  font-size: 14.5px;
  color: #8596b6;
}
.link {
  color: #276ef1;
  font-weight: 500;
  text-decoration: none;
  margin-left: 6px;
  transition: color .17s;
}
.link:hover {
  color: #1a47a7;
  text-decoration: underline;
}
</style>
