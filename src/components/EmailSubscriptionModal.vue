<template>
  <div class="modal" :class="{ show: show }">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="title-icon">📧</span>
          이메일 알림 구독
        </h2>
        <button class="close-btn" @click="$emit('close')" type="button">
          &times;
        </button>
      </div>

      <div class="modal-body">
        <!-- 구독 안내 -->
        <div class="subscription-intro">
          <div class="intro-icon">📅</div>
          <h3>주간 이벤트 알림을 받아보세요!</h3>
          <p>매주 일요일 오전 9시에 해당 주의 모든 이벤트 정보를 이메일로 받아보실 수 있습니다.</p>
        </div>

        <!-- 구독 혜택 -->
        <div class="benefits-section">
          <h4 class="benefits-title">구독 혜택</h4>
          <div class="benefits-list">
            <div class="benefit-item">
              <span class="benefit-icon">✨</span>
              <div class="benefit-content">
                <strong>주간 이벤트 요약</strong>
                <p>매주 예정된 모든 이벤트를 한눈에 확인</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎯</span>
              <div class="benefit-content">
                <strong>맞춤형 알림</strong>
                <p>관심 카테고리별 이벤트 우선 표시</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📱</span>
              <div class="benefit-content">
                <strong>모바일 최적화</strong>
                <p>스마트폰에서도 깔끔하게 보이는 이메일</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🔒</span>
              <div class="benefit-content">
                <strong>개인정보 보호</strong>
                <p>언제든지 쉽게 구독 해지 가능</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 구독 폼 -->
        <div class="subscription-form">
          <h4 class="form-title">구독 정보 입력</h4>

          <div class="form-group">
            <label for="subscriberEmail">이메일 주소 *</label>
            <input
              type="email"
              id="subscriberEmail"
              v-model="form.email"
              placeholder="example@email.com"
              required
              :disabled="isSubmitting"
              @keyup.enter="subscribe"
            />
            <small class="form-help">
              매주 일요일 오전 9시에 이 이메일로 알림을 보내드립니다.
            </small>
          </div>

          <div class="form-group">
            <label for="subscriberName">이름 (선택)</label>
            <input
              type="text"
              id="subscriberName"
              v-model="form.name"
              placeholder="홍길동"
              maxlength="50"
              :disabled="isSubmitting"
            />
            <small class="form-help">
              이름을 입력하시면 개인화된 인사말을 받으실 수 있습니다.
            </small>
          </div>

          <!-- 관심 카테고리 선택 -->
          <div class="form-group">
            <label class="category-label">관심 카테고리 (선택)</label>
            <div class="category-grid">
              <label
                v-for="category in categories"
                :key="category.value"
                class="category-option">
                <input
                  type="checkbox"
                  :value="category.value"
                  v-model="form.interests"
                  :disabled="isSubmitting"
                />
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-text">{{ category.label }}</span>
              </label>
            </div>
            <small class="form-help">
              선택한 카테고리의 이벤트를 우선적으로 표시합니다.
            </small>
          </div>

          <!-- 개인정보 동의 -->
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="form.agreeToPrivacy"
                :disabled="isSubmitting"
                required
              />
              <span class="checkmark"></span>
              <span class="checkbox-text">
                개인정보 수집 및 이용에 동의합니다.
                <button type="button" class="privacy-link" @click="showPrivacyPolicy">
                  (자세히 보기)
                </button>
              </span>
            </label>
          </div>

          <!-- 마케팅 동의 -->
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="form.agreeToMarketing"
                :disabled="isSubmitting"
              />
              <span class="checkmark"></span>
              <span class="checkbox-text">
                이벤트 관련 마케팅 정보 수신에 동의합니다. (선택)
              </span>
            </label>
          </div>
        </div>

        <!-- 구독 시작 안내 -->
        <div class="start-info">
          <div class="info-card">
            <div class="info-header">
              <span class="info-icon">📅</span>
              <strong>구독 시작 안내</strong>
            </div>
            <div class="info-content">
              <p>
                구독을 완료하시면 <strong>다음 주 일요일</strong>부터
                주간 이벤트 알림 메일을 받으실 수 있습니다.
              </p>
              <div class="next-email-date">
                다음 발송 예정일: {{ getNextEmailDate() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 액션 버튼들 -->
        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            @click="$emit('close')"
            :disabled="isSubmitting">
            취소
          </button>
          <button
            class="btn btn-primary"
            :disabled="!isFormValid || isSubmitting"
            @click="subscribe"
            :class="{ loading: isSubmitting }">
            {{ isSubmitting ? '구독 중...' : '구독 시작' }}
          </button>
        </div>
      </div>

      <!-- 개인정보 정책 모달 -->
      <div v-if="showPrivacy" class="privacy-modal" @click="hidePrivacyPolicy">
        <div class="privacy-content" @click.stop>
          <div class="privacy-header">
            <h3>개인정보 처리방침</h3>
            <button class="privacy-close" @click="hidePrivacyPolicy">&times;</button>
          </div>
          <div class="privacy-body">
            <div class="privacy-section">
              <h4>1. 개인정보 수집 목적</h4>
              <p>주간 이벤트 알림 이메일 발송 및 서비스 개선을 위해 개인정보를 수집합니다.</p>
            </div>
            <div class="privacy-section">
              <h4>2. 수집하는 개인정보 항목</h4>
              <ul>
                <li>필수: 이메일 주소</li>
                <li>선택: 이름, 관심 카테고리</li>
              </ul>
            </div>
            <div class="privacy-section">
              <h4>3. 개인정보 보유 및 이용기간</h4>
              <p>구독 해지 시까지 보관하며, 해지 즉시 삭제됩니다.</p>
            </div>
            <div class="privacy-section">
              <h4>4. 개인정보 제3자 제공</h4>
              <p>수집된 개인정보는 제3자에게 제공되지 않습니다.</p>
            </div>
            <div class="privacy-section">
              <h4>5. 구독 해지</h4>
              <p>이메일 하단의 '구독 해지' 링크를 통해 언제든지 구독을 해지할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { emailSubscriptionAPI } from '@/services/api.js'

export default {
  name: 'EmailSubscriptionModal',

  props: {
    show: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'subscribed'],

  data() {
    return {
      isSubmitting: false,
      showPrivacy: false,

      form: {
        email: '',
        name: '',
        interests: [],
        agreeToPrivacy: false,
        agreeToMarketing: false
      },

      categories: [
        { value: 'HOLIDAY', label: '공휴일/기념일', icon: '🎉' },
        { value: 'FESTIVAL', label: '축제/행사', icon: '🎪' },
        { value: 'CONFERENCE', label: '회의/세미나', icon: '💼' },
        { value: 'EDUCATION', label: '교육/워크샵', icon: '📚' },
        { value: 'SPORTS', label: '스포츠', icon: '⚽' },
        { value: 'CULTURE', label: '문화/예술', icon: '🎨' },
        { value: 'BUSINESS', label: '비즈니스', icon: '💰' },
        { value: 'OTHER', label: '기타', icon: '📌' }
      ]
    }
  },

  computed: {
    isFormValid() {
      return this.isValidEmail(this.form.email) &&
             this.form.agreeToPrivacy
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
    // 폼 유효성 검사
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },

    // 구독 처리
    async subscribe() {
      if (!this.isFormValid) {
        alert('필수 항목을 모두 입력하고 개인정보 처리방침에 동의해주세요.')
        return
      }

      this.isSubmitting = true
      try {
        const subscriptionData = {
          email: this.form.email,
          name: this.form.name || null,
          interests: this.form.interests.length > 0 ? this.form.interests : null,
          agreeToMarketing: this.form.agreeToMarketing
        }

        await emailSubscriptionAPI.subscribe(subscriptionData)

        console.log('이메일 구독 완료:', subscriptionData)
        this.$emit('subscribed')
        this.$emit('close')
      } catch (error) {
        console.error('구독 실패:', error)

        if (error.message.includes('already exists') || error.message.includes('이미')) {
          alert('이미 구독된 이메일 주소입니다.')
        } else {
          alert(error.message || '구독 신청에 실패했습니다. 다시 시도해주세요.')
        }
      } finally {
        this.isSubmitting = false
      }
    },

    // 다음 이메일 발송일 계산
    getNextEmailDate() {
      const today = new Date()
      const dayOfWeek = today.getDay() // 0: 일요일, 1: 월요일, ...
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek

      const nextSunday = new Date(today)
      nextSunday.setDate(today.getDate() + daysUntilSunday)

      return nextSunday.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }) + ' 오전 9시'
    },

    // 개인정보 정책
    showPrivacyPolicy() {
      this.showPrivacy = true
    },

    hidePrivacyPolicy() {
      this.showPrivacy = false
    },

    // 폼 리셋
    resetForm() {
      this.form = {
        email: '',
        name: '',
        interests: [],
        agreeToPrivacy: false,
        agreeToMarketing: false
      }
      this.isSubmitting = false
      this.showPrivacy = false
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
  position: relative;
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

/* 모달 바디 */
.modal-body {
  padding: 30px;
}

/* 구독 안내 */
.subscription-intro {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 15px;
}

.intro-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.subscription-intro h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.subscription-intro p {
  color: #666;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

/* 구독 혜택 */
.benefits-section {
  margin-bottom: 30px;
}

.benefits-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.benefits-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.benefit-item:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
}

.benefit-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.benefit-content strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.benefit-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* 구독 폼 */
.subscription-form {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 25px;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.form-group input[type="text"],
.form-group input[type="email"] {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-group input[type="text"]:focus,
.form-group input[type="email"]:focus {
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

.form-help {
  display: block;
  font-size: 13px;
  color: #666;
  margin-top: 5px;
  line-height: 1.4;
}

/* 카테고리 선택 */
.category-label {
  display: block;
  margin-bottom: 15px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.category-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  text-align: center;
  position: relative;
}

.category-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.category-option input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.category-option input[type="checkbox"]:checked + .category-icon + .category-text {
  color: #007bff;
  font-weight: 600;
}

.category-option:has(input[type="checkbox"]:checked) {
  border-color: #007bff;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.category-icon {
  font-size: 24px;
  margin-bottom: 5px;
  display: block;
}

.category-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* 체크박스 스타일 */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  flex-shrink: 0;
  transition: all 0.3s ease;
  background: white;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #007bff;
  border-color: #007bff;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-text {
  color: #333;
}

.privacy-link {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
  padding: 0;
}

.privacy-link:hover {
  color: #0056b3;
}

/* 구독 시작 안내 */
.start-info {
  margin-bottom: 30px;
}

.info-card {
  background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
  border: 1px solid #c3e6cb;
  border-radius: 12px;
  padding: 20px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.info-icon {
  font-size: 20px;
}

.info-header strong {
  color: #155724;
  font-size: 16px;
}

.info-content p {
  color: #155724;
  margin-bottom: 10px;
  line-height: 1.5;
}

.next-email-date {
  background: rgba(21, 87, 36, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: 600;
  color: #155724;
  text-align: center;
}

/* 액션 버튼들 */
.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
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
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

/* 개인정보 정책 모달 */
.privacy-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

.privacy-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.privacy-header {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 15px 15px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.privacy-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.privacy-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.privacy-close:hover {
  background: #e9ecef;
  color: #333;
}

.privacy-body {
  padding: 25px;
}

.privacy-section {
  margin-bottom: 20px;
}

.privacy-section h4 {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.privacy-section p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

.privacy-section ul {
  margin-left: 20px;
  color: #666;
}

.privacy-section li {
  margin-bottom: 4px;
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

  .modal-body {
    padding: 20px;
  }

  .subscription-intro {
    padding: 20px;
  }

  .subscription-intro h3 {
    font-size: 20px;
  }

  .benefits-list {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .privacy-content {
    width: 95%;
    max-height: 90vh;
  }

  .privacy-header {
    padding: 15px;
  }

  .privacy-body {
    padding: 20px;
  }
}

/* 스크롤바 스타일 */
.modal-content::-webkit-scrollbar,
.privacy-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track,
.privacy-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb,
.privacy-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.privacy-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 접근성 개선 */
.btn:focus,
.category-option:focus,
.checkbox-label:focus-within {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* 애니메이션 최적화 */
@media (prefers-reduced-motion: reduce) {
  .modal,
  .modal-content,
  .privacy-modal,
  .benefit-item,
  .btn {
    animation: none;
    transition: none;
  }

  .benefit-item:hover,
  .btn:hover {
    transform: none;
  }
}
</style>
