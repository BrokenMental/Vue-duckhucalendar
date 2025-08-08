<template>
  <div class="modal" :class="{ show: show }">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="title-icon">📅</span>
          이벤트 상세정보
        </h2>
        <button class="close-btn" @click="$emit('close')" type="button">
          &times;
        </button>
      </div>

      <!-- 단일 이벤트 상세보기 -->
      <div v-if="selectedSchedules.length === 1" class="single-event">
        <div class="event-detail-card">
          <!-- 이벤트 헤더 -->
          <div class="event-header">
            <div class="header-content">
              <h3 class="event-title">{{ selectedSchedules[0].title }}</h3>
              <div class="event-badges">
                <span v-if="selectedSchedules[0].isFeatured" class="featured-badge">⭐ 추천</span>
                <span class="priority-badge" :class="getPriorityClass(selectedSchedules[0].priority)">
                  {{ getPriorityText(selectedSchedules[0].priority) }}
                </span>
                <div class="event-color-dot" :style="{ backgroundColor: selectedSchedules[0].color }"></div>
              </div>
            </div>
            <div class="event-meta">
              <span class="view-count">👁️ {{ selectedSchedules[0].viewCount || 0 }}회 조회</span>
            </div>
          </div>

          <!-- 기본 정보 -->
          <div class="event-info">
            <div class="info-section">
              <h4 class="section-title">📅 일정 정보</h4>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">기간</div>
                  <div class="info-value">{{ formatDateRange(selectedSchedules[0]) }}</div>
                </div>

                <div class="info-item" v-if="selectedSchedules[0].startTime || selectedSchedules[0].endTime">
                  <div class="info-label">시간</div>
                  <div class="info-value">{{ formatTimeOnly(selectedSchedules[0]) }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">우선순위</div>
                  <div class="info-value">
                    <span class="priority-badge" :class="getPriorityClass(selectedSchedules[0].priority)">
                      {{ getPriorityText(selectedSchedules[0].priority) }}
                    </span>
                  </div>
                </div>

                <div class="info-item" v-if="getDurationText(selectedSchedules[0])">
                  <div class="info-label">기간</div>
                  <div class="info-value">{{ getDurationText(selectedSchedules[0]) }}</div>
                </div>
              </div>
            </div>

            <!-- 상세 내용 -->
            <div v-if="selectedSchedules[0].description" class="info-section">
              <h4 class="section-title">📝 상세 내용</h4>
              <div class="description-content">
                {{ selectedSchedules[0].description }}
              </div>
            </div>

            <!-- 이미지 섹션 -->
            <div v-if="selectedSchedules[0].images && selectedSchedules[0].images.length > 0" class="info-section">
              <h4 class="section-title">📸 이미지 ({{ selectedSchedules[0].images.length }})</h4>
              <div class="image-gallery">
                <div
                  v-for="(image, index) in selectedSchedules[0].images"
                  :key="index"
                  class="image-item"
                  @click="openImageViewer(image, index)">
                  <img :src="image" :alt="`이벤트 이미지 ${index + 1}`" />
                  <div class="image-overlay">
                    <span class="zoom-icon">🔍</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 링크 섹션 -->
            <div v-if="selectedSchedules[0].links && selectedSchedules[0].links.length > 0" class="info-section">
              <h4 class="section-title">🔗 관련 링크 ({{ selectedSchedules[0].links.length }})</h4>
              <div class="links-container">
                <a
                  v-for="(link, index) in selectedSchedules[0].links"
                  :key="index"
                  :href="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link-item">
                  <span class="link-icon">🔗</span>
                  <span class="link-text">
                    {{ selectedSchedules[0].linkTitles?.[index] || `링크 ${index + 1}` }}
                  </span>
                  <span class="external-icon">↗</span>
                </a>
              </div>
            </div>
          </div>

          <!-- 액션 버튼들 (관리자 전용) -->
          <div class="event-actions" v-if="isAdmin">
            <button class="btn btn-primary" @click="editEvent">
              ✏️ 수정
            </button>
            <button class="btn btn-danger" @click="deleteEvent">
              🗑️ 삭제
            </button>
            <button class="btn btn-secondary" @click="toggleFeatured">
              {{ selectedSchedules[0].isFeatured ? '⭐ 추천 해제' : '⭐ 추천 설정' }}
            </button>
          </div>

          <!-- 일반 사용자 액션 -->
          <div class="user-actions" v-else>
            <button class="btn btn-secondary" @click="copyEventInfo">
              📋 정보 복사
            </button>
            <button class="btn btn-secondary" @click="shareEvent">
              📤 공유하기
            </button>
          </div>
        </div>
      </div>

      <!-- 다중 이벤트 리스트 -->
      <div v-else-if="selectedSchedules.length > 1" class="multiple-events">
        <div class="events-list-header">
          <p>이 날짜에 {{ selectedSchedules.length }}개의 이벤트가 있습니다.</p>
          <small>이벤트를 클릭하여 자세히 보세요.</small>
        </div>

        <div class="events-list">
          <div
            v-for="(event, index) in sortedSchedules"
            :key="event.id"
            class="event-list-item"
            :class="{
              'featured': event.isFeatured,
              'priority-high': event.priority === 1
            }"
            @click="viewSingleEvent(event)">

            <!-- 순서 및 상태 표시 -->
            <div class="item-status">
              <span class="item-number">{{ index + 1 }}</span>
              <div class="status-indicators">
                <span v-if="event.isFeatured" class="featured-star">⭐</span>
                <div class="event-color" :style="{ backgroundColor: event.color }"></div>
              </div>
            </div>

            <!-- 이벤트 내용 -->
            <div class="item-content">
              <div class="item-header">
                <h5 class="item-title">{{ event.title }}</h5>
                <div class="item-badges">
                  <span v-if="event.images?.length" class="mini-badge">📸{{ event.images.length }}</span>
                  <span v-if="event.links?.length" class="mini-badge">🔗{{ event.links.length }}</span>
                </div>
              </div>

              <div class="item-meta">
                <span class="item-time">{{ formatTimeOnly(event) }}</span>
                <span class="item-priority">{{ getPriorityText(event.priority) }}</span>
                <span class="item-views">👁️ {{ event.viewCount || 0 }}</span>
              </div>

              <div v-if="event.description" class="item-description">
                {{ truncateText(event.description, 80) }}
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

        <!-- 리스트 액션 -->
        <div class="list-actions">
          <button class="btn btn-secondary" @click="exportAllEvents">
            📤 모든 이벤트 내보내기
          </button>
        </div>
      </div>

      <!-- 이벤트가 없는 경우 -->
      <div v-else class="no-events">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>이벤트가 없습니다</h3>
          <p>이 날짜에는 등록된 이벤트가 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- 이미지 뷰어 모달 -->
    <div v-if="showImageViewer" class="image-viewer-modal" @click="closeImageViewer">
      <div class="image-viewer-content" @click.stop>
        <button class="image-close-btn" @click="closeImageViewer">&times;</button>
        <img :src="currentImage" :alt="'이벤트 이미지'" />
        <div class="image-navigation" v-if="currentEvent && currentEvent.images.length > 1">
          <button @click="previousImage" class="nav-btn">‹</button>
          <span class="image-counter">{{ currentImageIndex + 1 }} / {{ currentEvent.images.length }}</span>
          <button @click="nextImage" class="nav-btn">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EnhancedScheduleDetailModal',

  props: {
    show: {
      type: Boolean,
      default: false
    },
    selectedSchedules: {
      type: Array,
      default: () => []
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'edit', 'delete', 'view-single', 'schedule-updated'],

  data() {
    return {
      showImageViewer: false,
      currentImage: '',
      currentImageIndex: 0,
      currentEvent: null
    }
  },

  computed: {
    sortedSchedules() {
      return [...this.selectedSchedules].sort((a, b) => {
        // 1차: 추천 이벤트 우선
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1

        // 2차: 우선순위
        if (a.priority !== b.priority) {
          return (a.priority || 2) - (b.priority || 2)
        }

        // 3차: 시작 시간
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime)
        }

        // 4차: 제목 알파벳순
        return a.title.localeCompare(b.title)
      })
    }
  },

  methods: {
    // 이벤트 액션
    editEvent() {
      this.$emit('edit', this.selectedSchedules[0])
    },

    async deleteEvent() {
      const event = this.selectedSchedules[0]
      const isConfirmed = confirm(
        `"${event.title}" 이벤트를 정말로 삭제하시겠습니까?\n\n삭제된 이벤트는 복구할 수 없습니다.`
      )

      if (isConfirmed) {
        this.$emit('delete', event)
      }
    },

    async toggleFeatured() {
      const event = this.selectedSchedules[0]
      try {
        // API 호출로 추천 상태 토글
        await this.$emit('toggle-featured', event.id, !event.isFeatured)
        this.$emit('schedule-updated')
      } catch (error) {
        console.error('추천 설정 변경 실패:', error)
        alert('추천 설정 변경에 실패했습니다.')
      }
    },

    viewSingleEvent(event) {
      this.$emit('view-single', event)
    },

    // 사용자 액션
    copyEventInfo() {
      const event = this.selectedSchedules[0]
      const info = `
${event.title}
${this.formatDateRange(event)}
${event.description ? `\n${event.description}` : ''}
${event.links ? `\n링크: ${event.links.join(', ')}` : ''}
      `.trim()

      navigator.clipboard.writeText(info).then(() => {
        alert('이벤트 정보가 클립보드에 복사되었습니다!')
      }).catch(() => {
        alert('복사에 실패했습니다.')
      })
    },

    shareEvent() {
      const event = this.selectedSchedules[0]
      if (navigator.share) {
        navigator.share({
          title: event.title,
          text: `${event.title} - ${this.formatDateRange(event)}`,
          url: window.location.href
        })
      } else {
        this.copyEventInfo()
      }
    },

    exportAllEvents() {
      const data = this.selectedSchedules.map(event => ({
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        description: event.description || '',
        priority: this.getPriorityText(event.priority),
        isFeatured: event.isFeatured ? '예' : '아니오',
        viewCount: event.viewCount || 0,
        images: event.images || [],
        links: event.links || []
      }))

      const jsonData = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `events-${new Date().toISOString().split('T')[0]}.json`
      link.click()

      URL.revokeObjectURL(url)
    },

    // 이미지 뷰어
    openImageViewer(imageUrl, index) {
      this.currentImage = imageUrl
      this.currentImageIndex = index
      this.currentEvent = this.selectedSchedules[0]
      this.showImageViewer = true
    },

    closeImageViewer() {
      this.showImageViewer = false
      this.currentImage = ''
      this.currentImageIndex = 0
      this.currentEvent = null
    },

    previousImage() {
      if (this.currentEvent && this.currentImageIndex > 0) {
        this.currentImageIndex--
        this.currentImage = this.currentEvent.images[this.currentImageIndex]
      }
    },

    nextImage() {
      if (this.currentEvent && this.currentImageIndex < this.currentEvent.images.length - 1) {
        this.currentImageIndex++
        this.currentImage = this.currentEvent.images[this.currentImageIndex]
      }
    },

    // 포맷팅 유틸리티
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

    getPriorityText(priority) {
      const priorityMap = {
        1: '높음',
        2: '중간',
        3: '낮음'
      }
      return priorityMap[priority] || '중간'
    },

    getPriorityClass(priority) {
      const classMap = {
        1: 'priority-high',
        2: 'priority-medium',
        3: 'priority-low'
      }
      return classMap[priority] || 'priority-medium'
    },

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

/* 모달 컨텐츠 */
.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
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

/* 단일 이벤트 스타일 */
.single-event {
  padding: 30px;
}

.event-detail-card {
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

/* 이벤트 헤더 */
.event-header {
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
  margin-bottom: 25px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 15px;
}

.event-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.3;
}

.event-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.featured-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #333;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.priority-badge {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
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

.event-color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

/* 정보 섹션 */
.info-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 15px;
}

.description-content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #007bff;
  line-height: 1.6;
  color: #333;
}

/* 이미지 갤러리 */
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.image-item:hover {
  transform: scale(1.05);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.zoom-icon {
  font-size: 24px;
  color: white;
}

/* 링크 컨테이너 */
.links-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 10px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  border-left: 4px solid #007bff;
}

.link-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
  text-decoration: none;
  color: #333;
}

.link-icon {
  font-size: 16px;
  color: #007bff;
}

.link-text {
  flex: 1;
  font-weight: 500;
}

.external-icon {
  font-size: 14px;
  color: #666;
}

/* 액션 버튼들 */
.event-actions,
.user-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

/* 다중 이벤트 리스트 */
.multiple-events {
  padding: 30px;
}

.events-list-header {
  text-align: center;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.events-list-header p {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.events-list-header small {
  color: #666;
}

.events-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

/* 이벤트 리스트 아이템 */
.event-list-item {
  display: flex;
  align-items: center;
  padding: 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.event-list-item:hover {
  background: #f8f9fa;
  border-color: #007bff;
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.event-list-item.featured {
  border-left: 6px solid #FFD700;
  background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%);
}

.item-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 15px;
  gap: 8px;
}

.item-number {
  background: #007bff;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
}

.featured-star {
  font-size: 14px;
}

.event-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 10px;
}

.item-title {
  font-weight: 600;
  color: #333;
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
}

.item-badges {
  display: flex;
  gap: 4px;
}

.mini-badge {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.item-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
}

.item-description {
  color: #666;
  font-size: 13px;
  line-height: 1.4;
}

.item-arrow {
  color: #ccc;
  margin-left: 15px;
  transition: all 0.2s ease;
}

.event-list-item:hover .item-arrow {
  color: #007bff;
  transform: translateX(5px);
}

/* 리스트 액션 */
.list-actions {
  text-align: center;
  margin-top: 20px;
}

/* 빈 상태 */
.no-events {
  padding: 60px 30px;
  text-align: center;
}

.empty-state {
  animation: fadeInUp 0.4s ease;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.empty-state p {
  color: #666;
  font-size: 16px;
}

/* 이미지 뷰어 모달 */
.image-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.image-viewer-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-viewer-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.image-close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s ease;
}

.image-close-btn:hover {
  background: white;
  transform: scale(1.1);
}

.image-navigation {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  color: white;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.image-counter {
  font-size: 14px;
  font-weight: 500;
}

/* 버튼 스타일 */
.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333 0%, #a02622 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
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

  .single-event,
  .multiple-events {
    padding: 20px;
  }

  .event-title {
    font-size: 24px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .event-badges {
    width: 100%;
    justify-content: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .image-gallery {
    grid-template-columns: repeat(2, 1fr);
  }

  .event-actions,
  .user-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .event-list-item {
    padding: 15px;
  }

  .item-meta {
    flex-direction: column;
    gap: 4px;
  }

  .image-viewer-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .image-close-btn {
    top: -40px;
    right: -10px;
  }
}

/* 스크롤바 스타일 */
.modal-content::-webkit-scrollbar,
.events-list::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track,
.events-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb,
.events-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.events-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 접근성 개선 */
.btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.image-item:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.link-item:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* 애니메이션 최적화 */
@media (prefers-reduced-motion: reduce) {
  .modal,
  .modal-content,
  .event-detail-card,
  .image-viewer-modal {
    animation: none;
  }

  .event-list-item:hover,
  .image-item:hover,
  .btn:hover {
    transform: none;
  }
}
</style>
