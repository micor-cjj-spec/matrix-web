<template>
  <div class="login-background">
    <div class="bubble-wrapper"></div>
    <v-card class="login-card" elevation="16">
      <div class="login-header">
        <img src="/vite.svg" class="logo" alt="logo" />
        <h2 class="title">BizFi 企业管理平台</h2>
      </div>

      <v-tabs
          v-model="activeTab"
          grow
          class="login-tabs"
          bg-color="white"
          color="primary"
          slider-color="primary"
      >
        <v-tab value="account">账号登录</v-tab>
        <v-tab value="phone">手机号登录</v-tab>
        <v-tab value="qrcode">扫码登录</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="login-tab-content">
        <!-- 账号登录 -->
        <v-window-item value="account">
          <v-form ref="formRef" v-model="validAccount" class="login-form">
            <v-text-field
                v-model="form.account.username"
                label="用户名"
                :rules="[v => !!v || '请输入用户名']"
                clearable
                prepend-inner-icon="mdi-account"
                class="login-input"
                density="comfortable"
            />
            <v-text-field
                v-model="form.account.password"
                :type="showPassword ? 'text' : 'password'"
                label="密码"
                clearable
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[v => !!v || '请输入密码']"
                class="login-input"
                density="comfortable"
            />
            <div class="captcha-box">
              <v-text-field
                  v-model="form.account.captcha"
                  label="验证码"
                  clearable
                  class="captcha-input"
                  prepend-inner-icon="mdi-shield-key"
                  :rules="[v => !!v || '请输入验证码']"
                  density="comfortable"
              />
              <img :src="captchaUrl" class="captcha-img" @click="refreshCaptcha" alt="验证码" />
            </div>
          </v-form>
        </v-window-item>

        <!-- 手机号登录（含验证码按钮） -->
        <v-window-item value="phone">
          <v-form ref="phoneFormRef" v-model="validPhone" class="login-form">
            <v-text-field
                v-model="form.phone.mobile"
                label="手机号"
                clearable
                prepend-inner-icon="mdi-cellphone"
                :rules="[
                v => !!v || '请输入手机号',
                v => /^1\\d{10}$/.test(v) || '手机号格式错误'
              ]"
                class="login-input"
                density="comfortable"
            />
            <div class="sms-box">
              <v-text-field
                  v-model="form.phone.code"
                  label="短信验证码"
                  clearable
                  prepend-inner-icon="mdi-message-bulleted"
                  :rules="[v => !!v || '请输入验证码']"
                  class="sms-input"
                  density="comfortable"
              />
              <v-btn
                  variant="tonal"
                  color="primary"
                  :disabled="smsCountdown > 0 || loading"
                  @click="sendSms"
                  class="sms-btn"
              >
                {{ smsCountdown > 0 ? smsCountdown + 's后重发' : '获取验证码' }}
              </v-btn>
            </div>
          </v-form>
        </v-window-item>

        <!-- 扫码登录 -->
        <v-window-item value="qrcode">
          <div class="qrcode-login">
            <div class="qrcode-box">
              <img :src="form.qrcode.imageUrl || '/qrcode-placeholder.png'" alt="二维码" class="qrcode-img"/>
              <p class="qrcode-tip">请使用企业微信 / 钉钉扫码登录</p>
              <v-btn class="mt-2" variant="tonal" color="primary" @click="refreshQrCode">
                刷新二维码
              </v-btn>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <v-btn
          color="primary"
          class="login-btn"
          :loading="loading"
          size="x-large"
          block
          @click="handleLogin"
      >
        登录
      </v-btn>

      <div class="register-line">
        没有账号？
        <RouterLink to="/register" class="register-link">立即注册</RouterLink>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLogin } from '../../composables/login/useLogin.js'
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
})

const {
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
} = useLogin(router, snackbar)
</script>

<style scoped>
.login-background {
  position: relative;
  height: 100vh;
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.bubble-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.login-card {
  position: relative;
  z-index: 2;
  width: 420px;
  max-width: 95vw;
  padding: 44px 38px 36px 38px;
  border-radius: 36px;
  background: linear-gradient(120deg, #fff, #e9eefe 100%);
  box-shadow: 0 14px 60px 0 rgba(80, 120, 200, 0.12), 0 1.5px 5px 0 rgba(80, 120, 200, 0.06);
  border: 1.5px solid rgba(255,255,255,0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18px;
}

.logo {
  width: 52px;
  height: 52px;
  margin-bottom: 7px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 16px #c1cffc3d;
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #22253c;
  letter-spacing: 2px;
  margin-bottom: 0;
}

.login-tabs {
  margin-top: 2px;
  margin-bottom: 16px;
  position: static !important;
  z-index: auto !important;
}

.v-tab {
  font-size: 17px !important;
  min-width: 108px !important;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 0 12px;
}

.login-tab-content {
  width: 100%;
  min-height: 220px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 10px;
  margin-bottom: 12px;
}

.login-input {
  font-size: 18px;
}

.captcha-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: -8px;
}

.captcha-input {
  max-width: 140px;
}

.captcha-img {
  height: 38px;
  width: 92px;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 1px 8px #e0eaff50;
  object-fit: cover;
  transition: filter .15s;
}
.captcha-img:hover {
  filter: brightness(1.08);
}

/* 手机号+验证码一行展示 */
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

.qrcode-login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 180px;
  flex-direction: column;
  width: 100%;
}
.qrcode-box {
  text-align: center;
  width: 100%;
}
.qrcode-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 10px #ccd9fa50;
  background: #f4f7fd;
  border: 1px solid #e3eafc;
}
.qrcode-tip {
  color: #6078a8;
  font-size: 15px;
  margin-bottom: 7px;
  margin-top: 2px;
}

.login-btn {
  margin-top: 14px;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 2px;
  box-shadow: 0 2px 14px #94b8ff38;
}

.register-line {
  width: 100%;
  text-align: right;
  font-size: 14.5px;
  margin-top: 2px;
  color: #8596b6;
}

.register-link {
  color: #276ef1;
  font-weight: 500;
  text-decoration: none;
  margin-left: 6px;
  transition: color .17s;
}
.register-link:hover {
  color: #1a47a7;
  text-decoration: underline;
}
</style>
