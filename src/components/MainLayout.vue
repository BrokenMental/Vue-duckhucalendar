<template>
  <div class="main-layout">
    <!-- 우측 상단 메뉴 버튼 -->
    <div class="menu-container">
      <button class="menu-button" @click="toggleMenu" ref="menuButton">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      <!-- 드롭다운 메뉴 -->
      <transition name="dropdown">
        <div v-if="showMenu" class="dropdown-menu" @click.stop>
          <div class="dropdown-item" @click="openEventRequestModal">
            <span class="dropdown-icon">📝</span>
            이벤트 추가/수정 요청
          </div>
          <div class="dropdown-item" @click="goToSettings">
            <span class="dropdown-icon">⚙️</span>
            설정
          </div>
          <div class="dropdown-item" @click="openEmailSubscription">
            <span class="dropdown-icon">📧</span>
            이메일로 알림받기
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="goToAdmin">
            <span class="dropdown-icon">👑</span>
            관리자 페이지
          </div>
        </div>
      </transition>
    </div>

    <div class="layout-container">
      <!-- 좌측 캘린더 영역 -->
      <div class="calendar-section">
        <EnhancedCalendar
          @schedule-selected="handleScheduleSelected"
          @schedule-updated="loadSidebarData"
        />
      </div>

      <!-- 우측 사이드바 -->
      <div class="sidebar-section">
        <!-- 상단: 다가오는 이벤트 -->
        <div class="sidebar-card upcoming-events">
          <h3 class="sidebar-title">
            <span class="title-icon">🗓️</span>
            다가오는 이벤트
          </h3>
          <div class="event-list">
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="event-item"
              @click="showEventDetail(event)"
            >
              <div class="event-date">
                {{ formatEventDate(event) }}
              </div>
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-time">{{ formatEventTime(event) }}</div>
              </div>
              <div class="event-color" :style="{ backgroundColor: event.color }"></div>
            </div>
            <div v-if="upcomingEvents.length === 0" class="no-events">
              예정된 이벤트가 없습니다
            </div>
          </div>
        </div>

        <!-- 중간: 최근 추가된 이벤트 -->
        <div class="sidebar-card recent-events">
          <h3 class="sidebar-title">
            <span class="title-icon">✨</span>
            최근 추가된 이벤트
          </h3>
          <div class="event-list">
            <div
              v-for="event in recentEvents"
              :key="event.id"
              class="event-item recent"
              @click="showEventDetail(event)"
            >
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-meta">
                  <span class="event-date">{{ formatEventDate(event) }}</span>
                  <span class="event-new">NEW</span>
                </div>
              </div>
              <div class="event-thumbnail" v-if="event.images && event.images.length > 0">
                <img :src="event.images[0]" :alt="event.title" />
              </div>
            </div>
            <div v-if="recentEvents.length === 0" class="no-events">
              최근 추가된 이벤트가 없습니다
            </div>
          </div>
        </div>

        <!-- 하단: 광고 영역 -->
        <div class="sidebar-card ad-section">
          <h3 class="sidebar-title">
            <span class="title-icon">📢</span>
            공지사항
          </h3>
          <div class="ad-content">
            <div class="ad-item">
              <h4>🎉 새로운 기능 업데이트!</h4>
              <p>이제 이벤트에 이미지와 링크를 추가할 수 있습니다.</p>
            </div>
            <div class="ad-item">
              <h4>📧 주간 이메일 알림</h4>
              <p>매주 일요일 이벤트 요약을 이메일로 받아보세요.</p>
              <button class="ad-button" @click="openEmailSubscription">
                구독하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이벤트 요청 모달 -->
    <EventRequestModal
      :show="showEventRequestModal"
      @close="closeEventRequestModal"
      @submitted="handleEventRequestSubmitted"
    />

    <!-- 이메일 구독 모달 -->
    <EmailSubscriptionModal
      :show="showEmailModal"
      @close="closeEmailModal"
      @subscribed="handleEmailSubscribed"
    />

    <!-- 이벤트 상세 모달 -->
    <EnhancedScheduleDetailModal
      :show="showDetailModal"
      :selected-schedules="selectedSchedules"
      @close="closeDetailModal"
    />
  </div>
</template>

<script>
import EnhancedCalendar from '@/components/EnhancedCalendar.vue'
import EventRequestModal from '@/components/EventRequestModal.vue'
import EmailSubscriptionModal from '@/components/EmailSubscriptionModal.vue'
import EnhancedScheduleDetailModal from '@/components/EnhancedScheduleDetailModal.vue'
import { scheduleAPI } from '@/services/api.js'

export default {
  name: 'MainLayout',

  components: {
    EnhancedCalendar,
    EventRequestModal,
    EmailSubscriptionModal,
    EnhancedScheduleDetailModal
  },

  data() {
    return {
      showMenu: false,
      showEventRequestModal: false,
      showEmailModal: false,
      showDetailModal: false,
      selectedSchedules: [],
      upcomingEvents: [],
      recentEvents: []
    }
  },

  mounted() {
    this.loadSidebarData()
    this.setupClickOutside()
  },

  beforeUnmount() {
    this.removeClickOutside()
  },

  methods: {
    // 메뉴 관련
    toggleMenu() {
      this.showMenu = !this.showMenu
    },

    closeMenu() {
      this.showMenu = false
    },

    // 이벤트 핸들링
    handleScheduleSelected(schedules) {
      this.selectedSchedules = schedules
      this.showDetailModal = true
    },

    showEventDetail(event) {
      this.selectedSchedules = [event]
      this.showDetailModal = true
    },

    closeDetailModal() {
      this.showDetailModal = false
      this.selectedSchedules = []
    },

    // 모달 관련
    openEventRequestModal() {
      this.showEventRequestModal = true
      this.closeMenu()
    },

    closeEventRequestModal() {
      this.showEventRequestModal = false
    },

    openEmailSubscription() {
      this.showEmailModal = true
      this.closeMenu()
    },

    closeEmailModal() {
      this.showEmailModal = false
    },

    // 네비게이션
    goToSettings() {
      this.$router.push('/settings')
      this.closeMenu()
    },

    goToAdmin() {
      this.$router.push('/admin')
      this.closeMenu()
    },

    // 데이터 로딩
    async loadSidebarData() {
      try {
        // 다가오는 이벤트 (오늘부터 7일간)
        const upcomingResponse = await scheduleAPI.getUpcomingSchedules(7)
        this.upcomingEvents = upcomingResponse.schedules || []

        // 최근 추가된 이벤트 (최근 10개)
        const allSchedules = await scheduleAPI.getAllSchedules()
        this.recentEvents = allSchedules
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)

      } catch (error) {
        console.error('사이드바 데이터 로딩 실패:', error)
      }
    },

    // 이벤트 처리
    handleEventRequestSubmitted() {
      this.closeEventRequestModal()
      // 성공 메시지 표시
      this.$nextTick(() => {
        alert('이벤트 요청이 성공적으로 제출되었습니다!')
      })
    },

    handleEmailSubscribed() {
      this.closeEmailModal()
      // 성공 메시지 표시
      this.$nextTick(() => {
        alert('이메일 구독이 완료되었습니다! 다음 주 일요일부터 알림을 받으실 수 있습니다.')
      })
    },

    // 유틸리티 함수
    formatEventDate(event) {
      const date = new Date(event.startDate)
      const today = new Date()
      const diffTime = date - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return '오늘'
      if (diffDays === 1) return '내일'
      if (diffDays === -1) return '어제'
      if (diffDays > 0) return `${diffDays}일 후`
      return `${Math.abs(diffDays)}일 전`
    },

    formatEventTime(event) {
      if (event.startTime && event.endTime) {
        return `${event.startTime} - ${event.endTime}`
      } else if (event.startTime) {
        return `${event.startTime}부터`
      }
      return '종일'
    },

    // 외부 클릭 감지
    setupClickOutside() {
      this.clickOutsideHandler = (event) => {
        if (this.showMenu && !this.$refs.menuButton?.contains(event.target)) {
          this.closeMenu()
        }
      }
      document.addEventListener('click', this.clickOutsideHandler)
    },

    removeClickOutside() {
      if (this.clickOutsideHandler) {
        document.removeEventListener('click', this.clickOutsideHandler)
      }
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 메뉴 버튼 */
.menu-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.menu-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.menu-button:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* 드롭다운 메뉴 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  min-width: 200px;
  backdrop-filter: blur(10px);
}

.dropdown-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-icon {
  font-size: 16px;
}

.dropdown-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

/* 드롭다운 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* 메인 레이아웃 */
.layout-container {
  display: flex;
  height: 100vh;
  padding: 20px;
  gap: 20px;
}

.calendar-section {
  flex: 1;
  min-width: 0;
}

.sidebar-section {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 사이드바 카드 */
.sidebar-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.sidebar-card:hover {
  transform: translateY(-2px);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.title-icon {
  font-size: 20px;
}

/* 이벤트 리스트 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.event-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.event-item.recent {
  border-left-color: #28a745;
}

.event-date {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.event-content {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  font-size: 12px;
  color: #666;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.event-new {
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.event-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.event-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-events {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 20px;
}

/* 광고 섹션 */
.ad-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ad-item {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.ad-item h4 {
  margin-bottom: 8px;
  font-size: 16px;
}

.ad-item p {
  font-size: 14px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.ad-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.ad-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .sidebar-section {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
    overflow-y: auto;
  }

  .calendar-section {
    height: 60vh;
  }

  .sidebar-section {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: visible;
    padding-bottom: 20px;
  }

  .sidebar-card {
    min-width: 250px;
    flex-shrink: 0;
  }
}

/* 스크롤바 스타일 */
.sidebar-section::-webkit-scrollbar {
  width: 6px;
}

.sidebar-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.sidebar-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.sidebar-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
