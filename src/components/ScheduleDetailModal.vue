<template>
  <div class="modal" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h2 class="modal-title">
          {{ selectedSchedules.length === 1 ? '일정 상세보기' : `${selectedSchedules.length}개의 일정` }}
        </h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- 단일 일정 상세보기 -->
      <div v-if="selectedSchedules.length === 1" class="single-schedule">
        <div class="schedule-detail-card">
          <!-- 일정 헤더 -->
          <div class="schedule-header">
            <div class="schedule-title">{{ selectedSchedules[0].title }}</div>
            <div class="schedule-color-dot" :style="{ backgroundColor: selectedSchedules[0].color }"></div>
          </div>

          <!-- 일정 정보 -->
          <div class="schedule-info">
            <div class="info-item">
              <span class="info-label">📅 기간</span>
              <span class="info-value">{{ formatDateRange(selectedSchedules[0]) }}</span>
            </div>

            <div v-if="selectedSchedules[0].startTime" class="info-item">
              <span class="info-label">⏰ 시간</span>
              <span class="info-value">
                {{ selectedSchedules[0].startTime }} - {{ selectedSchedules[0].endTime || '종료시간 미정' }}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">⭐ 우선순위</span>
              <span class="info-value">
                <span class="priority-badge" :class="`priority-${getPriorityClass(selectedSchedules[0].priority)}`">
                  {{ getPriorityText(selectedSchedules[0].priority) }}
                </span>
              </span>
            </div>

            <div v-if="selectedSchedules[0].description" class="info-item">
              <span class="info-label">📝 설명</span>
              <span class="info-value description">{{ selectedSchedules[0].description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 다중 일정 리스트 -->
      <div v-else class="multiple-schedules">
        <div class="schedule-list-header">
          <p>{{ formatSelectedDate() }}의 일정</p>
          <small>{{ selectedSchedules.length }}개의 일정이 있습니다</small>
        </div>

        <div class="schedule-list">
          <div v-for="(schedule, index) in sortedSchedules"
               :key="schedule.id"
               class="schedule-item"
               @click="viewSingleSchedule(schedule)">

            <div class="item-priority">
              <div class="priority-number">{{ index + 1 }}</div>
              <div class="priority-color" :style="{ backgroundColor: schedule.color }"></div>
            </div>

            <div class="item-content">
              <div class="item-title">{{ schedule.title }}</div>
              <div class="item-meta">
                <span v-if="schedule.startTime" class="item-time">
                  {{ schedule.startTime }} - {{ schedule.endTime || '종료시간 미정' }}
                </span>
                <span class="item-priority-text">{{ getPriorityText(schedule.priority) }}</span>
              </div>
              <div v-if="schedule.description" class="item-description">
                {{ truncateText(schedule.description, 50) }}
              </div>
            </div>

            <div class="item-arrow">▶</div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="selectedSchedules.length === 0" class="no-schedules">
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>선택된 일정이 없습니다</h3>
          <p>일정을 선택해서 상세 정보를 확인하세요.</p>
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

  emits: ['close'],

  computed: {
    sortedSchedules() {
      return [...this.selectedSchedules].sort((a, b) => {
        // 우선순위순으로 정렬 (1=높음, 2=중간, 3=낮음)
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        // 같은 우선순위면 시간순
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime)
        }
        return 0
      })
    }
  },

  methods: {
    /**
     * 단일 일정 보기
     */
    viewSingleSchedule(schedule) {
      this.$emit('close')
      // 잠시 후 단일 일정으로 다시 열기
      setTimeout(() => {
        this.$emit('view-single', schedule)
      }, 300)
    },

    /**
     * 날짜 범위 형식 변환
     */
    formatDateRange(schedule) {
      const start = new Date(schedule.startDate + 'T00:00:00')
      const end = new Date(schedule.endDate + 'T00:00:00')

      if (schedule.startDate === schedule.endDate) {
        return `${start.getMonth() + 1}월 ${start.getDate()}일`
      } else {
        return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`
      }
    },

    /**
     * 선택된 날짜 형식 변환
     */
    formatSelectedDate() {
      if (this.selectedSchedules.length === 0) return ''
      const date = new Date(this.selectedSchedules[0].startDate + 'T00:00:00')
      return `${date.getMonth() + 1}월 ${date.getDate()}일`
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
        1: 'high',
        2: 'medium',
        3: 'low'
      }
      return classMap[priority] || 'medium'
    },

    /**
     * 텍스트 자르기
     */
    truncateText(text, maxLength = 100) {
      return text && text.length > maxLength
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

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
    padding: 20px;
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
