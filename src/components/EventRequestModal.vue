<template>
  <div class="modal" :class="{ show: show }">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="title-icon">📝</span>
          이벤트 요청
        </h2>
        <button class="close-btn" @click="$emit('close')" type="button">
          &times;
        </button>
      </div>

      <!-- 요청 단계별 진행 표시 -->
      <div class="progress-steps">
        <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-label">요청 유형</div>
        </div>
        <div class="step-connector" :class="{ completed: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-label">이메일 인증</div>
        </div>
        <div class="step-connector" :class="{ completed: currentStep > 2 }"></div>
        <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-label">요청 작성</div>
        </div>
      </div>

      <!-- 단계 1: 요청 유형 선택 -->
      <div v-if="currentStep === 1" class="step-content">
        <h3 class="section-title">요청 유형을 선택해주세요</h3>

        <div class="request-type-options">
          <div
            class="type-option"
            :class="{ selected: form.requestType === 'ADD' }"
            @click="selectRequestType('ADD')">
            <div class="option-icon">➕</div>
            <div class="option-content">
              <h4>이벤트 추가 요청</h4>
              <p>새로운 이벤트를 추가해달라고 요청합니다.</p>
            </div>
          </div>

          <div
            class="type-option"
            :class="{ selected: form.requestType === 'EDIT' }"
            @click="selectRequestType('EDIT')">
            <div class="option-icon">✏️</div>
            <div class="option-content">
              <h4>이벤트 수정 요청</h4>
              <p>기존 이벤트의 정보 수정을 요청합니다.</p>
            </div>
          </div>

          <div
            class="type-option"
            :class="{ selected: form.requestType === 'DELETE' }"
            @click="selectRequestType('DELETE')">
            <div class="option-icon">🗑️</div>
            <div class="option-content">
              <h4>이벤트 삭제 요청</h4>
              <p>잘못된 이벤트의 삭제를 요청합니다.</p>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button
            class="btn btn-primary"
            :disabled="!form.requestType"
            @click="nextStep">
            다음 단계
          </button>
        </div>
      </div>

      <!-- 단계 2: 이메일 인증 -->
      <div v-if="currentStep === 2" class="step-content">
        <h3 class="section-title">이메일 인증</h3>
        <p class="section-description">
          스팸 방지를 위해 이메일 인증이 필요합니다. 인증 후 요청을 작성할 수 있습니다.
        </p>

        <div v-if="!emailVerified" class="email-verification">
          <div class="form-group">
            <label for="email">이메일 주소 *</label>
            <input
              type="email"
              id="email"
              v-model="form.email"
              placeholder="example@email.com"
              required
              :disabled="emailSent"
              @keyup.enter="sendVerificationEmail"
            />
          </div>

          <div v-if="emailSent" class="verification-info">
            <div class="info-box success">
              <span class="info-icon">📧</span>
              <div class="info-content">
                <strong>인증 이메일이 전송되었습니다!</strong>
                <p>{{ form.email }}로 전송된 인증 코드를 입력해주세요.</p>
              </div>
            </div>

            <div class="form-group">
              <label for="verificationCode">인증 코드 *</label>
              <input
                type="text"
                id="verificationCode"
                v-model="form.verificationCode"
                placeholder="6자리 인증 코드를 입력하세요"
                maxlength="6"
                @keyup.enter="verifyEmail"
              />
            </div>

            <div class="verification-actions">
              <button
                class="btn btn-primary"
                :disabled="!form.verificationCode || form.verificationCode.length !== 6"
                @click="verifyEmail"
                :class="{ loading: verifying }">
                {{ verifying ? '인증 중...' : '인증 확인' }}
              </button>
              <button class="btn btn-secondary" @click="resendVerificationEmail">
                인증 코드 재전송
              </button>
            </div>
          </div>

          <div v-else class="email-actions">
            <button
              class="btn btn-primary"
              :disabled="!isValidEmail(form.email)"
              @click="sendVerificationEmail"
              :class="{ loading: sendingEmail }">
              {{ sendingEmail ? '전송 중...' : '인증 이메일 전송' }}
            </button>
          </div>
        </div>

        <div v-else class="verification-success">
          <div class="success-message">
            <span class="success-icon">✅</span>
            <h4>이메일 인증 완료!</h4>
            <p>{{ form.email }}이 성공적으로 인증되었습니다.</p>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary" @click="previousStep">
            이전 단계
          </button>
          <button
            class="btn btn-primary"
            :disabled="!emailVerified"
            @click="nextStep">
            다음 단계
          </button>
        </div>
      </div>

      <!-- 단계 3: 요청 작성 -->
      <div v-if="currentStep === 3" class="step-content">
        <h3 class="section-title">요청 내용 작성</h3>

        <div class="form-group">
          <label for="requesterName">작성자명</label>
          <input
            type="text"
            id="requesterName"
            v-model="form.requesterName"
            placeholder="본명 또는 닉네임을 입력하세요"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label for="requestTitle">요청 제목 *</label>
          <input
            type="text"
            id="requestTitle"
            v-model="form.title"
            :placeholder="getRequestTitlePlaceholder()"
            required
            maxlength="200"
          />
          <span class="char-count">{{ form.title.length }}/200</span>
        </div>

        <div v-if="form.requestType === 'EDIT' || form.requestType === 'DELETE'" class="form-group">
          <label for="targetEvent">대상 이벤트</label>
          <input
            type="text"
            id="targetEvent"
            v-model="form.targetEvent"
            placeholder="수정/삭제하려는 이벤트명을 입력하세요"
            maxlength="200"
          />
          <small class="form-help">
            정확한 이벤트명을 입력하면 처리가 더 빨라집니다.
          </small>
        </div>

        <div v-if="form.requestType === 'ADD'" class="form-group">
          <label for="proposedDate">희망 날짜</label>
          <input
            type="date"
            id="proposedDate"
            v-model="form.proposedDate"
            :min="minDate"
          />
        </div>

        <div class="form-group">
          <label for="category">카테고리</label>
          <select v-model="form.category">
            <option value="">카테고리 선택</option>
            <option value="HOLIDAY">공휴일/기념일</option>
            <option value="FESTIVAL">축제/행사</option>
            <option value="CONFERENCE">회의/세미나</option>
            <option value="EDUCATION">교육/워크샵</option>
            <option value="SPORTS">스포츠</option>
            <option value="CULTURE">문화/예술</option>
            <option value="BUSINESS">비즈니스</option>
            <option value="OTHER">기타</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">상세 요청 내용 *</label>
          <textarea
            id="description"
            v-model="form.description"
            :placeholder="getDescriptionPlaceholder()"
            required
            maxlength="1000"
            rows="6"
          ></textarea>
          <span class="char-count">{{ form.description.length }}/1000</span>
        </div>

        <!-- 요청 미리보기 -->
        <div class="request-preview">
          <h4 class="preview-title">요청 미리보기</h4>
          <div class="preview-card">
            <div class="preview-header">
              <span class="request-type-badge" :class="form.requestType.toLowerCase()">
                {{ getRequestTypeText() }}
              </span>
              <span class="category-badge" v-if="form.category">
                {{ getCategoryText() }}
              </span>
            </div>
            <h5 class="preview-request-title">{{ form.title || '제목을 입력하세요' }}</h5>
            <div class="preview-meta">
              <span>요청자: {{ form.requesterName || form.email }}</span>
              <span v-if="form.proposedDate">희망 날짜: {{ formatDate(form.proposedDate) }}</span>
            </div>
            <div class="preview-description">
              {{ form.description || '요청 내용을 입력하세요' }}
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary" @click="previousStep">
            이전 단계
          </button>
          <button
            class="btn btn-primary"
            :disabled="!isFormValid"
            @click="submitRequest"
            :class="{ loading: submitting }">
            {{ submitting ? '제출 중...' : '요청 제출' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { eventRequestAPI } from '@/services/api.js'

export default {
  name: 'EventRequestModal',

  props: {
    show: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'submitted'],

  data() {
    return {
      currentStep: 1,
      emailVerified: false,
      emailSent: false,
      sendingEmail: false,
      verifying: false,
      submitting: false,

      form: {
        requestType: '', // ADD, EDIT, DELETE
        email: '',
        verificationCode: '',
        requesterName: '',
        title: '',
        targetEvent: '',
        proposedDate: '',
        category: '',
        description: ''
      }
    }
  },

  computed: {
    minDate() {
      return new Date().toISOString().split('T')[0]
    },

    isFormValid() {
      return this.form.title.trim() &&
             this.form.description.trim() &&
             this.emailVerified
    }
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.resetForm()
      }
    }
  },

  methods: {
    // 단계 관리
    nextStep() {
      if (this.currentStep < 3) {
        this.currentStep++
      }
    },

    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },

    // 요청 유형 선택
    selectRequestType(type) {
      this.form.requestType = type
    },

    // 이메일 관련
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },

    async sendVerificationEmail() {
      if (!this.isValidEmail(this.form.email)) {
        alert('올바른 이메일 주소를 입력해주세요.')
        return
      }

      this.sendingEmail = true
      try {
        await eventRequestAPI.sendVerificationCode(this.form.email)
        this.emailSent = true
        console.log('인증 이메일 전송됨:', this.form.email)
      } catch (error) {
        console.error('이메일 전송 실패:', error)
        alert(error.message)
      } finally {
        this.sendingEmail = false
      }
    },

    async resendVerificationEmail() {
      this.form.verificationCode = ''
      await this.sendVerificationEmail()
    },

    async verifyEmail() {
      if (this.form.verificationCode.length !== 6) {
        alert('6자리 인증 코드를 입력해주세요.')
        return
      }

      this.verifying = true
      try {
        await eventRequestAPI.verifyEmail(this.form.email, this.form.verificationCode)
        this.emailVerified = true
        console.log('이메일 인증 완료')
      } catch (error) {
        console.error('이메일 인증 실패:', error)
        alert(error.message)
      } finally {
        this.verifying = false
      }
    },

    // 요청 제출
    async submitRequest() {
      if (!this.isFormValid) {
        alert('필수 항목을 모두 입력해주세요.')
        return
      }

      this.submitting = true
      try {
        const requestData = {
          requesterEmail: this.form.email,
          requesterName: this.form.requesterName || null,
          title: this.form.title,
          description: this.form.description,
          proposedDate: this.form.proposedDate || null,
          category: this.form.category || null,
          requestType: this.form.requestType,
          targetEvent: this.form.targetEvent || null
        }

        await eventRequestAPI.submitEventRequest(requestData)

        this.$emit('submitted')
        this.$emit('close')
      } catch (error) {
        console.error('요청 제출 실패:', error)
        alert(error.message || '요청 제출에 실패했습니다. 다시 시도해주세요.')
      } finally {
        this.submitting = false
      }
    },

    // 시뮬레이션 함수들 (실제 구현 시 제거)
    async simulateEmailSend() {
      return new Promise(resolve => setTimeout(resolve, 1500))
    },

    async simulateEmailVerification() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 간단한 시뮬레이션: 123456이면 성공
          if (this.form.verificationCode === '123456') {
            resolve()
          } else {
            reject(new Error('Invalid code'))
          }
        }, 1000)
      })
    },

    // 유틸리티 함수들
    resetForm() {
      this.currentStep = 1
      this.emailVerified = false
      this.emailSent = false
      this.sendingEmail = false
      this.verifying = false
      this.submitting = false

      this.form = {
        requestType: '',
        email: '',
        verificationCode: '',
        requesterName: '',
        title: '',
        targetEvent: '',
        proposedDate: '',
        category: '',
        description: ''
      }
    },

    getRequestTypeText() {
      const types = {
        ADD: '추가 요청',
        EDIT: '수정 요청',
        DELETE: '삭제 요청'
      }
      return types[this.form.requestType] || ''
    },

    getCategoryText() {
      const categories = {
        HOLIDAY: '공휴일/기념일',
        FESTIVAL: '축제/행사',
        CONFERENCE: '회의/세미나',
        EDUCATION: '교육/워크샵',
        SPORTS: '스포츠',
        CULTURE: '문화/예술',
        BUSINESS: '비즈니스',
        OTHER: '기타'
      }
      return categories[this.form.category] || ''
    },

    getRequestTitlePlaceholder() {
      const placeholders = {
        ADD: '예: 2024 벚꽃축제 일정 추가 요청',
        EDIT: '예: 독서모임 시간 변경 요청',
        DELETE: '예: 잘못 등록된 회의 일정 삭제 요청'
      }
      return placeholders[this.form.requestType] || '요청 제목을 입력하세요'
    },

    getDescriptionPlaceholder() {
      const placeholders = {
        ADD: '새로 추가할 이벤트의 상세 정보를 입력해주세요.\n- 날짜, 시간, 장소\n- 이벤트 설명\n- 참고 링크나 이미지 URL',
        EDIT: '수정이 필요한 부분과 수정 내용을 구체적으로 입력해주세요.\n- 현재 정보\n- 변경할 정보\n- 변경 사유',
        DELETE: '삭제가 필요한 이유를 설명해주세요.\n- 삭제 사유\n- 올바른 정보가 있다면 함께 제공'
      }
      return placeholders[this.form.requestType] || '요청 내용을 상세히 입력해주세요'
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
/* 모달 기본 스타일 */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
}

.modal.show {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 모달 헤더 */
.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px 30px;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.title-icon {
  font-size: 28px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* 진행 단계 표시 */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #007bff;
  color: white;
}

.step.completed .step-number {
  background: #28a745;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.step.active .step-label,
.step.completed .step-label {
  color: #333;
  font-weight: 600;
}

.step-connector {
  width: 60px;
  height: 2px;
  background: #e0e0e0;
  margin: 0 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.step-connector.completed {
  background: #28a745;
}

/* 단계 컨텐츠 */
.step-content {
  padding: 30px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.section-description {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

/* 요청 유형 선택 */
.request-type-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.type-option {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.type-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.type-option.selected {
  border-color: #007bff;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.option-icon {
  font-size: 32px;
  margin-right: 20px;
  width: 50px;
  text-align: center;
}

.option-content h4 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.option-content p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

/* 이메일 인증 */
.email-verification {
  margin-bottom: 30px;
}

.info-box {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  gap: 12px;
}

.info-box.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-content h4,
.info-content strong {
  margin-bottom: 5px;
  color: inherit;
}

.info-content p {
  margin: 0;
  font-size: 14px;
}

.verification-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.email-actions {
  display: flex;
  justify-content: center;
}

.verification-success {
  text-align: center;
  padding: 30px;
  background: #d4edda;
  border-radius: 12px;
  margin-bottom: 30px;
}

.success-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
}

.success-message h4 {
  color: #155724;
  margin-bottom: 8px;
}

.success-message p {
  color: #155724;
  margin: 0;
}

/* 폼 스타일 */
.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  transform: translateY(-1px);
}

.form-group input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: -20px;
  font-size: 12px;
  color: #666;
}

.form-help {
  display: block;
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}

/* 요청 미리보기 */
.request-preview {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.preview-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  border-left: 4px solid #007bff;
}

.preview-header {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.request-type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.request-type-badge.add {
  background: #d4edda;
  color: #155724;
}

.request-type-badge.edit {
  background: #fff3cd;
  color: #856404;
}

.request-type-badge.delete {
  background: #f8d7da;
  color: #721c24;
}

.category-badge {
  background: #e9ecef;
  color: #495057;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.preview-request-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.preview-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.preview-description {
  color: #333;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* 단계 액션 */
.step-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

/* 버튼 스타일 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn.loading {
  opacity: 0.8;
  cursor: wait;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-title {
    font-size: 20px;
  }

  .step-content {
    padding: 20px;
  }

  .progress-steps {
    padding: 20px;
  }

  .step-connector {
    width: 40px;
    margin: 0 10px;
  }

  .type-option {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }

  .option-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .verification-actions {
    flex-direction: column;
  }

  .step-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .preview-meta {
    flex-direction: column;
    gap: 5px;
  }

  .char-count {
    position: static;
    text-align: right;
    margin-top: 5px;
  }
}

/* 스크롤바 스타일 */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 접근성 개선 */
.btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.type-option:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* 애니메이션 최적화 */
@media (prefers-reduced-motion: reduce) {
  .modal,
  .modal-content,
  .btn,
  .type-option {
    animation: none;
    transition: none;
  }

  .btn:hover,
  .type-option:hover {
    transform: none;
  }
}
</style>
