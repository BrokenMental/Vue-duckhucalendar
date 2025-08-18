<template>
  <div v-if="show" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ isEditMode ? '이벤트 수정' : '새 이벤트 추가' }}</h2>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- 기본 정보 -->
          <div class="form-section">
            <h3>기본 정보</h3>

            <div class="form-group">
              <label for="title">제목 *</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                required
                placeholder="이벤트 제목을 입력하세요"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="category">카테고리</label>
                <select id="category" v-model="form.category">
                  <option value="">선택하세요</option>
                  <option value="MEETING">회의</option>
                  <option value="FESTIVAL">축제</option>
                  <option value="SPORTS">스포츠</option>
                  <option value="EXHIBITION">전시</option>
                  <option value="EDUCATION">교육</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>

              <div class="form-group">
                <label for="priority">우선순위</label>
                <select id="priority" v-model="form.priority">
                  <option :value="1">낮음</option>
                  <option :value="2">보통</option>
                  <option :value="3">높음</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 날짜/시간 정보 -->
          <div class="form-section">
            <h3>날짜 및 시간</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="startDate">시작일 *</label>
                <input
                  id="startDate"
                  v-model="form.startDate"
                  type="date"
                  required
                />
              </div>

              <div class="form-group">
                <label for="endDate">종료일 *</label>
                <input
                  id="endDate"
                  v-model="form.endDate"
                  type="date"
                  required
                  :min="form.startDate"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="startTime">시작 시간</label>
                <input
                  id="startTime"
                  v-model="form.startTime"
                  type="time"
                />
              </div>

              <div class="form-group">
                <label for="endTime">종료 시간</label>
                <input
                  id="endTime"
                  v-model="form.endTime"
                  type="time"
                />
              </div>
            </div>
          </div>

          <!-- 상세 정보 -->
          <div class="form-section">
            <h3>상세 정보</h3>

            <div class="form-group">
              <label for="description">설명</label>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                placeholder="이벤트에 대한 설명을 입력하세요"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="location">장소</label>
              <input
                id="location"
                v-model="form.location"
                type="text"
                placeholder="이벤트 장소를 입력하세요"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="color">색상</label>
                <input
                  id="color"
                  v-model="form.color"
                  type="color"
                />
              </div>

              <div class="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    v-model="form.isFeatured"
                  />
                  추천 이벤트로 설정
                </label>
              </div>
            </div>
          </div>

          <!-- 이미지 및 링크 -->
          <div class="form-section">
            <h3>이미지 및 링크 (선택)</h3>

            <div class="form-group">
              <label>이미지 URL (최대 3개)</label>
              <div v-for="(image, index) in form.images" :key="index" class="array-input">
                <input
                  v-model="form.images[index]"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                />
                <button type="button" @click="removeImage(index)" class="btn-remove">삭제</button>
              </div>
              <button
                v-if="form.images.length < 3"
                type="button"
                @click="addImage"
                class="btn-add"
              >
                + 이미지 추가
              </button>
            </div>

            <div class="form-group">
              <label>관련 링크 (최대 2개)</label>
              <div v-for="(link, index) in form.links" :key="index" class="link-input">
                <input
                  v-model="form.linkTitles[index]"
                  type="text"
                  placeholder="링크 제목"
                  class="link-title"
                />
                <input
                  v-model="form.links[index]"
                  type="url"
                  placeholder="https://example.com"
                  class="link-url"
                />
                <button type="button" @click="removeLink(index)" class="btn-remove">삭제</button>
              </div>
              <button
                v-if="form.links.length < 2"
                type="button"
                @click="addLink"
                class="btn-add"
              >
                + 링크 추가
              </button>
            </div>
          </div>

          <!-- 버튼 영역 -->
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              취소
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? '저장 중...' : (isEditMode ? '수정' : '추가') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { scheduleAPI } from '@/services/api.js'

export default {
  name: 'EventManagementModal',

  props: {
    show: {
      type: Boolean,
      default: false
    },
    event: {
      type: Object,
      default: null
    }
  },

  emits: ['close', 'saved'],

  data() {
    return {
      form: {
        title: '',
        category: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        description: '',
        location: '',
        priority: 2,
        color: '#667eea',
        isFeatured: false,
        images: [],
        links: [],
        linkTitles: []
      },
      isSubmitting: false
    }
  },

  computed: {
    isEditMode() {
      return !!this.event
    }
  },

  watch: {
    show(newVal) {
      if (newVal) {
        this.initializeForm()
      }
    },
    event() {
      if (this.show) {
        this.initializeForm()
      }
    }
  },

  methods: {
    initializeForm() {
      if (this.isEditMode && this.event) {
        // 수정 모드: 기존 데이터 로드
        this.form = {
          title: this.event.title || '',
          category: this.event.category || '',
          startDate: this.event.startDate || '',
          endDate: this.event.endDate || '',
          startTime: this.event.startTime || '',
          endTime: this.event.endTime || '',
          description: this.event.description || '',
          location: this.event.location || '',
          priority: this.event.priority || 2,
          color: this.event.color || '#667eea',
          isFeatured: this.event.isFeatured || false,
          images: this.event.images || [],
          links: this.event.links || [],
          linkTitles: this.event.linkTitles || []
        }
      } else {
        // 추가 모드: 폼 초기화
        this.resetForm()
      }
    },

    resetForm() {
      this.form = {
        title: '',
        category: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: '',
        location: '',
        priority: 2,
        color: '#667eea',
        isFeatured: false,
        images: [],
        links: [],
        linkTitles: []
      }
    },

    addImage() {
      if (this.form.images.length < 3) {
        this.form.images.push('')
      }
    },

    removeImage(index) {
      this.form.images.splice(index, 1)
    },

    addLink() {
      if (this.form.links.length < 2) {
        this.form.links.push('')
        this.form.linkTitles.push('')
      }
    },

    removeLink(index) {
      this.form.links.splice(index, 1)
      this.form.linkTitles.splice(index, 1)
    },

    async handleSubmit() {
      this.isSubmitting = true

      try {
        // 시간 데이터 형식 처리
        const formatTime = (time) => {
          if (!time) return null
          // HH:mm 형식 보장
          if (time.length === 5) {
            return time + ':00'  // HH:mm:ss 형식으로 변환
          }
          return time
        }

        // 빈 배열 요소 제거
        const cleanedForm = {
          ...this.form,
          startTime: formatTime(this.form.startTime),
          endTime: formatTime(this.form.endTime),
          images: this.form.images.filter(img => img.trim()),
          links: this.form.links.filter(link => link.trim()),
          linkTitles: this.form.linkTitles.filter(title => title.trim())
        }

        if (this.isEditMode) {
          // 수정
          await scheduleAPI.updateSchedule(this.event.id, cleanedForm)
          this.$emit('saved', { type: 'update', data: cleanedForm })
          alert('이벤트가 수정되었습니다.')
        } else {
          // 추가
          await scheduleAPI.createSchedule(cleanedForm)
          this.$emit('saved', { type: 'create', data: cleanedForm })
          alert('이벤트가 추가되었습니다.')
        }

        this.closeModal()
      } catch (error) {
        alert(error.message || '저장에 실패했습니다.')
      } finally {
        this.isSubmitting = false
      }
    },

    closeModal() {
      this.$emit('close')
      this.resetForm()
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="url"],
.form-group input[type="color"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-bottom: 0;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.array-input,
.link-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.link-input {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 10px;
}

.btn-remove {
  padding: 8px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-remove:hover {
  background: #c82333;
}

.btn-add {
  padding: 8px 16px;
  background: #f8f9fa;
  color: #333;
  border: 1px dashed #ddd;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #e9ecef;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .link-input {
    grid-template-columns: 1fr;
  }
}
</style>
