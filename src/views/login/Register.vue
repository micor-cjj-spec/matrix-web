<template>
  <main class="auth-page register-page">
    <section class="auth-visual" aria-label="Matrix 注册">
      <img src="/assets/matrix-workbench-hero.png" alt="Matrix 企业工作台视觉" />
      <div class="visual-overlay"></div>
      <div class="visual-content">
        <div class="brand-chip">
          <span class="brand-mark">M</span>
          <span>Matrix</span>
        </div>
        <h1>为新的企业成员创建统一入口</h1>
        <p>账号创建后，可进入个人工作台，并从那里访问财务系统与后续扩展的业务系统。</p>
      </div>
    </section>

    <section class="auth-panel">
      <div class="panel-top">
        <div>
          <span class="overline">Create account</span>
          <h2>注册 Matrix</h2>
        </div>
        <RouterLink to="/login" class="ghost-link">返回登录</RouterLink>
      </div>

      <v-card class="auth-card" elevation="0">
        <v-form ref="formRef" v-model="valid" class="auth-form" @submit.prevent="handleRegister">
          <v-text-field
            v-model="form.email"
            label="邮箱"
            placeholder="请输入企业邮箱"
            variant="outlined"
            density="comfortable"
            color="#0f8a6a"
            :rules="[
              v => !!v || '请输入邮箱',
              v => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v) || '邮箱格式错误',
            ]"
            required
          />
          <div class="code-row">
            <v-text-field
              v-model="form.code"
              label="邮箱验证码"
              placeholder="请输入验证码"
              variant="outlined"
              density="comfortable"
              color="#0f8a6a"
              :rules="[v => !!v || '请输入验证码']"
              required
            />
            <v-btn
              class="code-button"
              variant="tonal"
              color="#0f8a6a"
              :disabled="smsCountdown > 0 || loading"
              @click="handleSendEmailCode"
            >
              {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
            </v-btn>
          </div>
          <v-text-field
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            label="密码"
            placeholder="至少 6 位"
            variant="outlined"
            density="comfortable"
            color="#0f8a6a"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="[
              v => !!v || '请输入密码',
              v => v.length >= 6 || '密码不能少于 6 位',
            ]"
            required
            @click:append-inner="showPassword = !showPassword"
          />
          <v-text-field
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            label="确认密码"
            placeholder="请再次输入密码"
            variant="outlined"
            density="comfortable"
            color="#0f8a6a"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="[
              v => !!v || '请再次输入密码',
              v => v === form.password || '两次密码不一致',
            ]"
            required
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />
        </v-form>

        <v-btn
          class="submit-button"
          color="#0f8a6a"
          size="large"
          block
          :loading="loading"
          @click="handleRegister"
        >
          注册
        </v-btn>

        <div class="form-footer">
          <span>已有账号？</span>
          <RouterLink to="/login">去登录</RouterLink>
        </div>
      </v-card>
    </section>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useRegister } from '@/composables/login/useRegister.js'

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
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.88fr);
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
    linear-gradient(90deg, rgba(8, 27, 33, 0.9) 0%, rgba(8, 27, 33, 0.56) 52%, rgba(8, 27, 33, 0.26) 100%),
    linear-gradient(180deg, rgba(8, 27, 33, 0.16) 0%, rgba(8, 27, 33, 0.66) 100%);
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
  max-width: 650px;
  margin: 28px 0 14px;
  font-size: 50px;
  line-height: 1.08;
  letter-spacing: 0;
}

.visual-content p {
  max-width: 560px;
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 17px;
  line-height: 1.8;
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

.auth-form {
  display: grid;
  gap: 14px;
}

.code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.code-button {
  width: 128px;
  height: 48px;
  border-radius: 8px;
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
    min-height: 320px;
  }

  .visual-content {
    padding: 32px;
  }

  .visual-content h1 {
    font-size: 34px;
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
    min-height: 260px;
  }

  .visual-content {
    padding: 24px 18px;
  }

  .visual-content h1 {
    font-size: 28px;
  }

  .visual-content p {
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

  .code-row {
    grid-template-columns: 1fr;
  }

  .code-button {
    width: 100%;
  }
}
</style>
