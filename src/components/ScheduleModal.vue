<template>
  <div class="modal" :class="{ show: show }">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          {{ editingSchedule ? '일정 수정' : '일정 추가' }}
        </h2>
        <button class="close-btn" @click="$emit('close')" type="button">
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSave">
        <!-- 제목 (필수) -->
        <div class="form-group">
          <label for="title">제목 *</label>
          <input
            type="text"
            id="title"
            v-model="form.title"
            required
            placeholder="일정 제목을 입력하세요"
            maxlength="50"
          >
          <span class="char-count">{{ form.title.length }}/50</span>
        </div>

        <!-- 날짜 입력 -->
        <div class="form-row">
          <div class="form-group">
            <label for="startDate">시작일 *</label>
            <input
              type="date"
              id="startDate"
              v-model="form.startDate"
              required
              :min="minDate"
            >
          </div>

          <div class="form-group">
            <label for="endDate">종료일 *</label>
            <input
              type="date"
              id="endDate"
              v-model="form.endDate"
              required
              :min="form.startDate || minDate"
            >
          </div>
        </div>

        <!-- 시간 입력 (선택사항) -->
        <div class="form-row">
          <div class="form-group">
            <label for="startTime">시작 시간</label>
            <input
              type="time"
              id="startTime"
              v-model="form.startTime"
              step="300"
            >
          </div>

          <div class="form-group">
            <label for="endTime">종료 시간</label>
            <input
              type="time"
              id="endTime"
              v-model="form.endTime"
              step="300"
              :disabled="!form.startTime"
            >
          </div>
        </div>

        <!-- 시간 입력 도움말 -->
        <div class="form-hint" v-if="!form.startTime && !form.endTime">
          💡 시간을 입력하지 않으면 종일 일정으로 등록됩니다.
        </div>

        <!-- 우선순위 -->
        <div class="form-group">
          <label for="priority">우선순위</label>
          <select id="priority" v-model="form.priority">
            <option value="1">🔴 높음</option>
            <option value="2">🟡 중간</option>
            <option value="3">🟢 낮음</option>
          </select>
          <span class="form-help">
            같은 날짜에 여러 일정이 있을 때 표시 순서를 결정합니다.
          </span>
        </div>

        <!-- 상세 내용 (선택사항) -->
        <div class="form-group">
          <label for="description">상세 내용</label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="일정에 대한 상세한 설명을 입력하세요 (선택사항)"
            maxlength="500"
          ></textarea>
          <span class="char-count">{{ form.description.length }}/500</span>
        </div>

        <!-- 미리보기 -->
        <div class="form-preview" v-if="form.title">
          <h4>미리보기:</h4>
          <div class="preview-card">
            <div class="preview-title">{{ form.title }}</div>
            <div class="preview-date">{{ formatPreviewDate() }}</div>
            <div class="preview-priority">우선순위: {{ getPriorityText() }}</div>
          </div>
        </div>

        <!-- 폼 액션 버튼 -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            취소
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
            {{ editingSchedule ? '수정 완료' : '일정 추가' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleModal',

  props: {
    show: {
      type: Boolean,
      default: false
    },
    editingSchedule: {
      type: Object,
      default: null
    }
  },

  emits: ['save', 'close'],

  data() {
    return {
      form: {
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        description: '',
        priority: 2
      }
    }
  },

  computed: {
    // 오늘 날짜 (최소 선택 가능한 날짜)
    minDate() {
      return new Date().toISOString().split('T')[0]
    },

    // 폼 유효성 검사
    isFormValid() {
      return this.form.title.trim() &&
             this.form.startDate &&
             this.form.endDate &&
             new Date(this.form.startDate) <= new Date(this.form.endDate)
    }
  },

  watch: {
    // 모달이 열릴 때마다 폼 초기화 또는 데이터 로드
    show(newVal) {
      if (newVal) {
        this.initializeForm()
      }
    },

    // 시작 시간이 변경되면 종료 시간 검증
    'form.startTime'(newVal) {
      if (newVal && this.form.endTime && newVal >= this.form.endTime) {
        this.form.endTime = ''
      }
    },

    // 시작일이 변경되면 종료일 조정
    'form.startDate'(newVal) {
      if (newVal && this.form.endDate && new Date(newVal) > new Date(this.form.endDate)) {
        this.form.endDate = newVal
      }
    }
  },

  methods: {
    /**
     * 폼 초기화 또는 편집 데이터 로드
     */
    initializeForm() {
      if (this.editingSchedule) {
        // 편집 모드: 기존 일정 데이터 로드
        this.form = {
          title: this.editingSchedule.title || '',
          startDate: this.editingSchedule.startDate || '',
          endDate: this.editingSchedule.endDate || '',
          startTime: this.editingSchedule.startTime || '',
          endTime: this.editingSchedule.endTime || '',
          description: this.editingSchedule.description || '',
          priority: this.editingSchedule.priority || 2
        }
      } else {
        // 새 일정 모드: 폼 초기화
        const today = new Date().toISOString().split('T')[0]
        this.form = {
          title: '',
          startDate: today,
          endDate: today,
          startTime: '',
          endTime: '',
          description: '',
          priority: 2
        }
      }
    },

    /**
     * 폼 저장 처리
     */
    handleSave() {
      // 추가 유효성 검사
      if (!this.validateForm()) {
        return
      }

      // 부모 컴포넌트에 저장 이벤트 전달
      this.$emit('save', { ...this.form })
    },

    /**
     * 폼 유효성 검사
     */
    validateForm() {
      // 제목 검사
      if (!this.form.title.trim()) {
        alert('제목을 입력해주세요.')
        return false
      }

      // 날짜 검사
      if (!this.form.startDate || !this.form.endDate) {
        alert('시작일과 종료일을 선택해주세요.')
        return false
      }

      // 날짜 순서 검사
      if (new Date(this.form.startDate) > new Date(this.form.endDate)) {
        alert('종료일은 시작일보다 늦어야 합니다.')
        return false
      }

      // 시간 검사 (같은 날인 경우)
      if (this.form.startDate === this.form.endDate &&
          this.form.startTime &&
          this.form.endTime &&
          this.form.startTime >= this.form.endTime) {
        alert('같은 날짜에서는 종료 시간이 시작 시간보다 늦어야 합니다.')
        return false
      }

      return true
    },

    /**
     * 미리보기용 날짜 포맷팅
     */
    formatPreviewDate() {
      if (!this.form.startDate || !this.form.endDate) {
        return '날짜를 선택해주세요'
      }

      const start = new Date(this.form.startDate)
      const end = new Date(this.form.endDate)
      const startStr = `${start.getMonth() + 1}/${start.getDate()}`
      const endStr = `${end.getMonth() + 1}/${end.getDate()}`

      let timeStr = ''
      if (this.form.startTime && this.form.endTime) {
        timeStr = ` ${this.form.startTime} - ${this.form.endTime}`
      } else if (this.form.startTime) {
        timeStr = ` ${this.form.startTime}부터`
      } else {
        timeStr = ' (종일)'
      }

      return this.form.startDate === this.form.endDate
        ? startStr + timeStr
        : `${startStr} - ${endStr}${timeStr}`
    },

    /**
     * 우선순위 텍스트 반환
     */
    getPriorityText() {
      const priorityMap = {
        1: '🔴 높음',
        2: '🟡 중간',
        3: '🟢 낮음'
      }
      return priorityMap[this.form.priority] || '🟡 중간'
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
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
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

/* 모달 컨텐츠 */
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
  transform: scale(1.1);
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

.form-group textarea {
  height: 100px;
  resize: vertical;
  min-height: 80px;
}

.form-group input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

/* 폼 행 (가로 배치) */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

/* 문자 수 카운터 */
.char-count {
  position: absolute;
  right: 10px;
  bottom: -20px;
  font-size: 12px;
  color: #666;
}

/* 폼 도움말 */
.form-hint {
  background: #e7f3ff;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 10px 15px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #31708f;
}

.form-help {
  display: block;
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}

/* 미리보기 */
.form-preview {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-preview h4 {
  margin-bottom: 10px;
  color: #333;
}

.preview-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #007bff;
}

.preview-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.preview-date {
  color: #666;
  font-size: 14px;
  margin-bottom: 3px;
}

.preview-priority {
  font-size: 12px;
  color: #666;
}

/* 폼 액션 버튼들 */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
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
  text-transform: none;
  min-width: 100px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
    padding: 20px;
    max-height: 95vh;
  }

  .modal-title {
    font-size: 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
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
</style>
