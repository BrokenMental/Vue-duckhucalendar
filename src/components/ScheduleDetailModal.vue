<template>
  <div class="modal" :class="{ show: show }">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">📅 일정 상세</h2>
        <button class="close-btn" @click="$emit('close')" type="button">
          &times;
        </button>
      </div>

      <!-- 단일 일정 상세보기 -->
      <div v-if="selectedSchedules.length === 1" class="single-schedule">
        <div class="schedule-detail-card">
          <!-- 일정 헤더 -->
          <div class="schedule-header">
            <h3 class="schedule-title">{{ selectedSchedules[0].title }}</h3>
            <div class="schedule-color-dot" :style="{ backgroundColor: selectedSchedules[0].color }"></div>
          </div>

          <!-- 일정 정보 -->
          <div class="schedule-info">
            <div class="info-item">
              <div class="info-label">📅 기간</div>
              <div class="info-value">{{ formatDateRange(selectedSchedules[0]) }}</div>
            </div>

            <div class="info-item" v-if="selectedSchedules[0].startTime || selectedSchedules[0].endTime">
              <div class="info-label">⏰ 시간</div>
              <div class="info-value">
                <span v-if="selectedSchedules[0].startTime && selectedSchedules[0].endTime">
                  {{ selectedSchedules[0].startTime }} - {{ selectedSchedules[0].endTime }}
                </span>
                <span v-else-if="selectedSchedules[0].startTime">
                  {{ selectedSchedules[0].startTime }}부터
                </span>
                <span v-else>
                  {{ selectedSchedules[0].endTime }}까지
                </span>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">📊 우선순위</div>
              <div class="info-value">
                <span class="priority-badge" :class="getPriorityClass(selectedSchedules[0].priority)">
                  {{ getPriorityText(selectedSchedules[0].priority) }}
                </span>
              </div>
            </div>

            <div class="info-item" v-if="getDurationText(selectedSchedules[0])">
              <div class="info-label">⏱️ 기간</div>
              <div class="info-value">{{ getDurationText(selectedSchedules[0]) }}</div>
            </div>

            <div class="info-item" v-if="selectedSchedules[0].description">
              <div class="info-label">📝 상세 내용</div>
              <div class="info-value description">
                {{ selectedSchedules[0].description }}
              </div>
            </div>
          </div>

          <!-- 액션 버튼들 -->
          <div class="schedule-actions">
            <button class="btn btn-primary" @click="$emit('edit', selectedSchedules[0])">
              ✏️ 수정
            </button>
            <button class="btn btn-danger" @click="handleDelete(selectedSchedules[0])">
              🗑️ 삭제
            </button>
            <button class="btn btn-secondary" @click="copyScheduleInfo">
              📋 복사
            </button>
          </div>
        </div>
      </div>

      <!-- 다중 일정 리스트 -->
      <div v-else-if="selectedSchedules.length > 1" class="multiple-schedules">
        <div class="schedule-list-header">
          <p>이 날짜에 {{ selectedSchedules.length }}개의 일정이 있습니다.</p>
          <small>일정을 클릭하여 자세히 보세요.</small>
        </div>

        <div class="schedule-list">
          <div
            v-for="(schedule, index) in sortedSchedules"
            :key="schedule.id"
            class="schedule-item"
            :class="{ 'priority-high': schedule.priority === 1 }"
            @click="$emit('view-single', schedule)">

            <!-- 우선순위 표시 -->
            <div class="item-priority">
              <span class="priority-number">{{ index + 1 }}</span>
              <div class="priority-color" :style="{ backgroundColor: schedule.color }"></div>
            </div>

            <!-- 일정 정보 -->
            <div class="item-content">
              <div class="item-title">{{ schedule.title }}</div>
              <div class="item-meta">
                <span class="item-time">{{ formatTimeOnly(schedule) }}</span>
                <span class="item-priority-text">{{ getPriorityText(schedule.priority) }}</span>
              </div>
              <div v-if="schedule.description" class="item-description">
                {{ truncateText(schedule.description, 50) }}
              </div>
            </div>

            <!-- 화살표 -->
            <div class="item-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 전체 일정 액션 -->
        <div class="list-actions">
          <button class="btn btn-secondary" @click="exportAllSchedules">
            📤 모든 일정 내보내기
          </button>
        </div>
      </div>

      <!-- 일정이 없는 경우 -->
      <div v-else class="no-schedules">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>일정이 없습니다</h3>
          <p>이 날짜에는 등록된 일정이 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleDetailModal',

  props: {
    show: {
      type: Boolean,
      default: false
    },
    selectedSchedules: {
      type: Array,
      default: () => []
    }
  },

  emits: ['edit', 'delete', 'view-single', 'close'],

  computed: {
    // 우선순위순으로 정렬된 일정 목록
    sortedSchedules() {
      return [...this.selectedSchedules].sort((a, b) => {
        // 1차 정렬: 우선순위 (숫자가 작을수록 높은 우선순위)
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }

        // 2차 정렬: 시작 시간 (시간이 있는 경우)
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime)
        }

        // 3차 정렬: 제목 알파벳순
        return a.title.localeCompare(b.title)
      })
    }
  },

  methods: {
    /**
     * 일정 삭제 확인
     */
    handleDelete(schedule) {
      const isConfirmed = confirm(
        `"${schedule.title}" 일정을 정말로 삭제하시겠습니까?\n\n` +
        `삭제된 일정은 복구할 수 없습니다.`
      )

      if (isConfirmed) {
        this.$emit('delete', schedule)
      }
    },

    /**
     * 모든 일정 데이터 내보내기
     */
    exportAllSchedules() {
      const data = this.selectedSchedules.map(schedule => ({
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        description: schedule.description || '',
        priority: this.getPriorityText(schedule.priority)
      }))

      const jsonData = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `schedules-${new Date().toISOString().split('T')[0]}.json`
      link.click()

      URL.revokeObjectURL(url)
    },

    /**
     * 날짜 범위 포맷팅
     */
    formatDateRange(schedule) {
      const start = new Date(schedule.startDate)
      const end = new Date(schedule.endDate)

      const startStr = start.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })

      const endStr = end.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })

      return schedule.startDate === schedule.endDate
        ? startStr
        : `${startStr} - ${endStr}`
    },

    /**
     * 시간만 포맷팅 (리스트용)
     */
    formatTimeOnly(schedule) {
      if (schedule.startTime && schedule.endTime) {
        return `${schedule.startTime} - ${schedule.endTime}`
      } else if (schedule.startTime) {
        return `${schedule.startTime}부터`
      } else if (schedule.endTime) {
        return `${schedule.endTime}까지`
      }
      return '종일'
    },

    /**
     * 우선순위 텍스트 반환
     */
    getPriorityText(priority) {
      const priorityMap = {
        1: '높음',
        2: '중간',
        3: '낮음'
      }
      return priorityMap[priority] || '중간'
    },

    /**
     * 우선순위 CSS 클래스 반환
     */
    getPriorityClass(priority) {
      const classMap = {
        1: 'priority-high',
        2: 'priority-medium',
        3: 'priority-low'
      }
      return classMap[priority] || 'priority-medium'
    },

    /**
     * 일정 기간 계산
     */
    getDurationText(schedule) {
      const start = new Date(schedule.startDate)
      const end = new Date(schedule.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return '당일'
      } else if (diffDays === 1) {
        return '1일'
      } else {
        return `${diffDays + 1}일간`
      }
    },

    /**
     * 텍스트 말줄임표 처리
     */
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text
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
  max-height: 80vh;
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
  font-size: 24px;
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

/* 단일 일정 상세보기 */
.single-schedule {
  animation: fadeInUp 0.4s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.schedule-detail-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

/* 일정 헤더 */
.schedule-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.schedule-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.schedule-color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 일정 정보 */
.schedule-info {
  padding: 20px;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #555;
  min-width: 100px;
  margin-right: 15px;
  font-size: 14px;
}

.info-value {
  flex: 1;
  color: #333;
  font-size: 16px;
  line-height: 1.4;
}

.info-value.description {
  white-space: pre-wrap;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #007bff;
}

/* 우선순위 뱃지 */
.priority-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-badge.priority-high {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.priority-badge.priority-medium {
  background: #fff8e1;
  color: #f57c00;
  border: 1px solid #ffb74d;
}

.priority-badge.priority-low {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #66bb6a;
}

/* 일정 액션 버튼들 */
.schedule-actions {
  padding: 20px;
  background: #f8f9fa;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 다중 일정 리스트 */
.multiple-schedules {
  animation: fadeInUp 0.4s ease;
}

.schedule-list-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.schedule-list-header p {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.schedule-list-header small {
  color: #666;
}

.schedule-list {
  max-height: 400px;
  overflow-y: auto;
}

/* 일정 아이템 */
.schedule-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.schedule-item:hover {
  background: #f8f9fa;
  border-color: #007bff;
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.schedule-item.priority-high {
  border-left: 4px solid #dc3545;
}

/* 아이템 우선순위 표시 */
.item-priority {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.priority-number {
  background: #007bff;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
}

.priority-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 아이템 컨텐츠 */
.item-content {
  flex: 1;
}

.item-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  font-size: 16px;
}

.item-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 5px;
}

.item-time {
  color: #007bff;
  font-size: 14px;
  font-weight: 500;
}

.item-priority-text {
  color: #666;
  font-size: 12px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-description {
  color: #666;
  font-size: 13px;
  line-height: 1.3;
}

/* 아이템 화살표 */
.item-arrow {
  color: #ccc;
  margin-left: 10px;
  transition: all 0.2s ease;
}

.schedule-item:hover .item-arrow {
  color: #007bff;
  transform: translateX(3px);
}

/* 리스트 액션 */
.list-actions {
  margin-top: 20px;
  text-align: center;
}

/* 빈 상태 */
.no-schedules {
  text-align: center;
  padding: 40px 20px;
}

.empty-state {
  animation: fadeInUp 0.4s ease;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
}

/* 버튼 스타일 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
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
  }

  .schedule-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    margin-bottom: 5px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-label {
    margin-bottom: 5px;
    min-width: auto;
  }

  .schedule-item {
    padding: 12px;
  }

  .item-meta {
    flex-direction: column;
    gap: 5px;
  }
}

/* 스크롤바 스타일 */
.modal-content::-webkit-scrollbar,
.schedule-list::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track,
.schedule-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb,
.schedule-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.schedule-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
