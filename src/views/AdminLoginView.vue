<template>
  <div class="admin-login-page">
    <div class="login-container">
      <div class="login-card">
        <h2 class="login-title">관리자 로그인</h2>

        <div v-if="step === 1" class="step-content">
          <div class="form-group">
            <label for="adminEmail">관리자 이메일</label>
            <input
              type="email"
              id="adminEmail"
              v-model="email"
              placeholder="관리자 이메일을 입력하세요"
              @keyup.enter="sendTempPassword"
            />
          </div>

          <button
            class="btn btn-primary"
            :disabled="!email || sending"
            @click="sendTempPassword"
          >
            {{ sending ? '전송 중...' : '임시 비밀번호 요청' }}
          </button>
        </div>

        <div v-if="step === 2" class="step-content">
          <div class="form-group">
            <label for="tempPassword">임시 비밀번호</label>
            <input
              type="password"
              id="tempPassword"
              v-model="password"
              placeholder="이메일로 받은 임시 비밀번호"
              @keyup.enter="login"
            />
          </div>

          <div class="button-group">
            <button class="btn btn-secondary" @click="step = 1">
              이전
            </button>
            <button
              class="btn btn-primary"
              :disabled="!password || logging"
              @click="login"
            >
              {{ logging ? '로그인 중...' : '로그인' }}
            </button>
          </div>
        </div>

        <div class="help-text">
          <p>관리자 이메일로 임시 비밀번호를 발송받아 로그인하세요.</p>
          <p>임시 비밀번호는 10분간 유효합니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { adminAPI } from '@/services/api.js'

export default {
  name: 'AdminLoginView',
  data() {
    return {
      step: 1,
      email: '',
      password: '',
      sending: false,
      logging: false
    }
  },

  methods: {
    async sendTempPassword() {
      if (!this.email) return

      this.sending = true
      try {
        await adminAPI.requestTempPassword(this.email)
        this.step = 2
      } catch (error) {
        alert(error.message)
      } finally {
        this.sending = false
      }
    },

    async login() {
      if (!this.password) {  // this.loginForm.tempPassword → this.password로 수정
        alert('비밀번호를 입력해주세요.')
        return
      }

      this.logging = true  // this.isLoading → this.logging으로 수정
      try {
        const response = await adminAPI.login(this.email, this.password)  // this.loginForm 제거
        sessionStorage.setItem('admin-token', response.token)

        // 관리자 페이지로 이동
        this.$router.push('/admin')

      } catch (error) {
        alert(error.message || '로그인에 실패했습니다.')
      } finally {
        this.logging = false  // this.isLoading → this.logging으로 수정
      }
    },
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 10px;
  padding: 40px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  margin-right: 10px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group .btn {
  flex: 1;
}

.help-text {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
