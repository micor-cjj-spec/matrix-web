<template>
  <main class="auth-page">
    <section class="auth-visual" aria-label="Matrix 企业工作台">
      <img src="/assets/matrix-workbench-hero.png" alt="Matrix 企业工作台视觉" />
      <div class="visual-overlay"></div>
      <div class="visual-content">
        <div class="brand-chip">
          <span class="brand-mark">M</span>
          <span>Matrix</span>
        </div>
        <h1>统一进入企业财务、知识与协作系统</h1>
        <p>从个人工作台开始，连接每一个业务角色的日常处理、数据洞察和系统入口。</p>
        <div class="visual-metrics">
          <div>
            <strong>6</strong>
            <span>今日待办</span>
          </div>
          <div>
            <strong>82%</strong>
            <span>月结进度</span>
          </div>
          <div>
            <strong>1,280</strong>
            <span>本月凭证</span>
          </div>
        </div>
      </div>
    </section>

    <section class="auth-panel">
      <div class="panel-top">
        <div>
          <span class="overline">Welcome back</span>
          <h2>登录 Matrix</h2>
        </div>
        <RouterLink to="/register" class="ghost-link">创建账号</RouterLink>
      </div>

      <v-card class="auth-card" elevation="0">
        <v-tabs
          v-model="activeTab"
          class="auth-tabs"
          color="#0f8a6a"
          slider-color="#0f8a6a"
          density="comfortable"
          grow
        >
          <v-tab value="account">账号登录</v-tab>
          <v-tab value="phone">手机号登录</v-tab>
          <v-tab value="qrcode">扫码登录</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="auth-window">
          <v-window-item value="account">
            <v-form ref="formRef" v-model="validAccount" class="auth-form" @submit.prevent="handleLogin">
              <v-text-field
                v-model="form.account.username"
                label="用户名"
                placeholder="请输入用户名"
                :rules="[v => !!v || '请输入用户名']"
                clearable
                variant="outlined"
                density="comfortable"
                color="#0f8a6a"
              />
              <v-text-field
                v-model="form.account.password"
                :type="showPassword ? 'text' : 'password'"
                label="密码"
                placeholder="请输入密码"
                clearable
                variant="outlined"
                density="comfortable"
                color="#0f8a6a"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[v => !!v || '请输入密码']"
                @click:append-inner="showPassword = !showPassword"
              />
              <div v-if="needCaptcha" class="captcha-row">
                <v-text-field
                  v-model="form.account.captcha"
                  label="验证码"
                  placeholder="输入验证码"
                  clearable
                  variant="outlined"
                  density="comfortable"
                  color="#0f8a6a"
                  :rules="captchaRules"
                />
                <button type="button" class="captcha-image" title="刷新验证码" @click="refreshCaptcha">
                  <img :src="captchaUrl" alt="验证码" />
                </button>
              </div>
            </v-form>
          </v-window-item>

          <v-window-item value="phone">
            <v-form ref="phoneFormRef" v-model="validPhone" class="auth-form" @submit.prevent="handleLogin">
              <v-text-field
                v-model="form.phone.mobile"
                label="手机号"
                placeholder="请输入手机号"
                clearable
                variant="outlined"
                density="comfortable"
                color="#0f8a6a"
                :rules="[
                  v => !!v || '请输入手机号',
                  v => /^1\d{10}$/.test(v) || '手机号格式错误',
                ]"
              />
              <div class="code-row">
                <v-text-field
                  v-model="form.phone.code"
                  label="短信验证码"
                  placeholder="请输入验证码"
                  clearable
                  variant="outlined"
                  density="comfortable"
                  color="#0f8a6a"
                  :rules="[v => !!v || '请输入验证码']"
                />
                <v-btn
                  class="code-button"
                  variant="tonal"
                  color="#0f8a6a"
                  :disabled="smsCountdown > 0 || loading"
                  @click="sendSms"
                >
                  {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
                </v-btn>
              </div>
            </v-form>
          </v-window-item>

          <v-window-item value="qrcode">
            <div class="qrcode-login">
              <div class="qrcode-frame">
                <img :src="form.qrcode.imageUrl || '/qrcode-placeholder.png'" alt="登录二维码" />
              </div>
              <p>使用企业微信或钉钉扫码登录</p>
              <v-btn variant="tonal" color="#0f8a6a" @click="refreshQrCode">刷新二维码</v-btn>
            </div>
          </v-window-item>
        </v-window>

        <v-btn
          class="submit-button"
          color="#0f8a6a"
          size="large"
          block
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </v-btn>

        <div class="form-footer">
          <span>没有账号？</span>
          <RouterLink to="/register">立即注册</RouterLink>
        </div>
      </v-card>
    </section>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useLogin } from '../../composables/login/useLogin.js'

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
  needCaptcha,
  captchaRules,
} = useLogin(router, snackbar)
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
  background: #f4f7f8;
  color: #17202c;
}

.auth-visual {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

.auth-visual img,
.visual-overlay {
  position: absolute;
  inset: 0;
}

.auth-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-overlay {
  background:
    linear-gradient(90deg, rgba(8, 27, 33, 0.88) 0%, rgba(8, 27, 33, 0.58) 46%, rgba(8, 27, 33, 0.24) 100%),
    linear-gradient(180deg, rgba(8, 27, 33, 0.18) 0%, rgba(8, 27, 33, 0.68) 100%);
}

.visual-content {
  position: relative;
  z-index: 1;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 56px;
  color: #ffffff;
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  padding: 8px 12px 8px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  font-weight: 800;
}

.brand-mark {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #0f8a6a;
}

.visual-content h1 {
  max-width: 720px;
  margin: 28px 0 14px;
  font-size: 52px;
  line-height: 1.08;
  letter-spacing: 0;
}

.visual-content p {
  max-width: 620px;
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 17px;
  line-height: 1.8;
}

.visual-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 150px));
  gap: 12px;
  margin-top: 32px;
}

.visual-metrics div {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(8, 27, 33, 0.46);
  backdrop-filter: blur(14px);
}

.visual-metrics strong,
.visual-metrics span {
  display: block;
}

.visual-metrics strong {
  font-size: 26px;
  line-height: 1;
}

.visual-metrics span {
  margin-top: 6px;
  color: #b7ead8;
  font-size: 12px;
}

.auth-panel {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px clamp(34px, 5vw, 72px);
  background:
    radial-gradient(circle at 20% 12%, rgba(15, 138, 106, 0.1), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f4f7f8 100%);
}

.panel-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.overline {
  display: block;
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.panel-top h2 {
  margin: 4px 0 0;
  font-size: 34px;
  line-height: 1.2;
}

.ghost-link,
.form-footer a {
  color: #0d6c5a;
  font-weight: 800;
}

.ghost-link {
  white-space: nowrap;
}

.auth-card {
  width: 100%;
  max-width: 520px;
  padding: 22px;
  border-radius: 8px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 26px 70px rgba(34, 53, 73, 0.12);
}

.auth-tabs {
  margin-bottom: 20px;
  border-radius: 8px;
  background: #f3f7f6;
}

.auth-window {
  min-height: 214px;
}

.auth-form {
  display: grid;
  gap: 14px;
}

.captcha-row,
.code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.captcha-image,
.code-button {
  width: 128px;
  height: 48px;
  border-radius: 8px;
}

.captcha-image {
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(26, 42, 58, 0.12);
  background: #ffffff;
  cursor: pointer;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-login {
  min-height: 214px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  text-align: center;
}

.qrcode-frame {
  width: 148px;
  height: 148px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(26, 42, 58, 0.1);
  background: #ffffff;
}

.qrcode-frame img {
  width: 124px;
  height: 124px;
  object-fit: contain;
}

.qrcode-login p {
  margin: 0;
  color: #667482;
  font-size: 13px;
}

.submit-button {
  margin-top: 18px;
  min-height: 46px;
  border-radius: 8px;
  font-weight: 800;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 16px;
  color: #7a8794;
  font-size: 14px;
}

@media (max-width: 980px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    min-height: 360px;
  }

  .visual-content {
    padding: 32px;
  }

  .visual-content h1 {
    font-size: 36px;
  }

  .auth-panel {
    min-height: auto;
    padding: 34px 20px 44px;
  }

  .auth-card {
    max-width: none;
  }
}

@media (max-width: 560px) {
  .auth-visual {
    min-height: 280px;
  }

  .visual-content {
    padding: 24px 18px;
  }

  .visual-content h1 {
    font-size: 28px;
  }

  .visual-content p,
  .visual-metrics {
    display: none;
  }

  .panel-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-top h2 {
    font-size: 28px;
  }

  .auth-card {
    padding: 16px;
  }

  .captcha-row,
  .code-row {
    grid-template-columns: 1fr;
  }

  .captcha-image,
  .code-button {
    width: 100%;
  }
}
</style>
