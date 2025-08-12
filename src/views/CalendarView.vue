<template>
  <div class="main-layout">
    <!-- 메인 컨테이너 -->
    <div class="layout-container">
      <!-- 캘린더 섹션 (좌측~중앙) -->
      <div class="calendar-section">
        <DuckHuCalendar />
      </div>

      <!-- 사이드바 섹션 (우측) -->
      <div class="sidebar-section">
        <!-- 데스크톱 사이드바 -->
        <div class="desktop-sidebar">
          <!-- 1. 공지사항 -->
          <div class="sidebar-card notice-card">
            <h3>📢 공지사항</h3>
            <div class="notice-content">
              <div class="notice-item">
                <div class="notice-text">🎉 DuckHu Calendar에 오신 것을 환영합니다!</div>
                <div class="notice-date">2025.08.12</div>
              </div>
              <div class="notice-item">
                <div class="notice-text">새로운 연속 일정 표시 기능이 추가되었습니다.</div>
                <div class="notice-date">2025.08.10</div>
              </div>
            </div>
          </div>

          <!-- 2. 다가올 이벤트 -->
          <div class="sidebar-card">
            <div class="sidebar-header">
              <h3>📅 다가올 이벤트</h3>
              <button v-if="!loading" @click="refreshData" class="refresh-btn" title="새로고침">
                🔄
              </button>
            </div>
            <div class="upcoming-events">
              <!-- 로딩 상태 -->
              <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">로딩 중...</div>
              </div>
              <!-- 에러 상태 -->
              <div v-else-if="error" class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-text">{{ error }}</div>
                <button @click="refreshData" class="retry-btn">다시 시도</button>
              </div>
              <!-- 정상 데이터 -->
              <div v-else-if="upcomingEvents.length > 0" class="event-list">
                <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
                  <div class="event-date">{{ formatEventDate(event) }}</div>
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-time" v-if="event.startTime">{{ event.startTime }}</div>
                </div>
              </div>
              <!-- 빈 상태 -->
              <div v-else class="no-events">
                다가올 이벤트가 없습니다.
              </div>
            </div>
          </div>

          <!-- 3. 최신 추가된 이벤트 -->
          <div class="sidebar-card">
            <h3>✨ 최신 이벤트</h3>
            <div class="recent-events">
              <!-- 로딩 상태 -->
              <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">로딩 중...</div>
              </div>
              <!-- 정상 데이터 -->
              <div v-else-if="recentEvents.length > 0" class="event-list">
                <div v-for="event in recentEvents" :key="event.id" class="event-item">
                  <div class="event-date">{{ formatEventDate(event) }}</div>
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-badge">NEW</div>
                </div>
              </div>
              <!-- 빈 상태 -->
              <div v-else class="no-events">
                최근 추가된 이벤트가 없습니다.
              </div>
            </div>
          </div>

          <!-- 4. 광고 영역 (최하단) -->
          <div class="sidebar-card">
            <h3>📢 광고</h3>
            <div class="ad-content">
              <div class="ad-item">
                <h4>DuckHu 프리미엄</h4>
                <p>더 많은 기능과 무제한 일정 관리를 경험해보세요!</p>
                <button class="ad-button">자세히 보기</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 모바일 사이드바 -->
        <div class="mobile-sidebar">
          <!-- 모바일 상단: 공지사항 + 광고 (한 줄에 배치) -->
          <div class="mobile-top-section">
            <!-- 공지사항 (모바일 - 압축 버전) -->
            <div class="sidebar-card notice-card mobile-card">
              <h3>📢 공지사항</h3>
              <div class="notice-content">
                <div class="notice-item">
                  <div class="notice-text">🎉 DuckHu Calendar 신규 오픈!</div>
                </div>
              </div>
            </div>

            <!-- 광고 (모바일 - 압축 버전) -->
            <div class="sidebar-card mobile-card">
              <h3>📢 광고</h3>
              <div class="ad-content">
                <div class="ad-item">
                  <h4>DuckHu 프리미엄</h4>
                  <p>더 많은 기능을 경험해보세요!</p>
                  <button class="ad-button">자세히 보기</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 플로팅 메뉴 버튼 (PC/모바일 공통, 우측 하단) -->
    <div class="floating-menu">
      <button class="floating-menu-button" @click="toggleMenu">
        <span class="floating-menu-icon">⋮</span>
      </button>

      <!-- 드롭다운 메뉴 -->
      <transition name="dropdown">
        <div v-if="showMenu" class="floating-dropdown-menu">
          <div class="dropdown-item" @click="openEventRequest">
            <span class="dropdown-icon">📝</span>
            이벤트 추가/수정 요청
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="goToSettings">
            <span class="dropdown-icon">⚙️</span>
            설정
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="openEmailSubscription">
            <span class="dropdown-icon">📧</span>
            이메일로 알림받기
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import DuckHuCalendar from '@/components/DuckHuCalendar.vue'
import { scheduleAPI } from '@/services/api.js'

export default {
  name: 'CalendarView',

  components: {
    DuckHuCalendar
  },

  data() {
    return {
      showMenu: false,

      // 실제 데이터로 변경
      upcomingEvents: [],
      recentEvents: [],
      loading: false,
      error: null
    }
  },

  async mounted() {
    document.addEventListener('click', this.handleOutsideClick)
    await this.loadSidebarData()
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
  },

  methods: {
    /**
     * 사이드바 데이터 로드
     */
    async loadSidebarData() {
      this.loading = true
      this.error = null

      try {
        // 병렬로 데이터 로드
        await Promise.all([
          this.loadUpcomingEvents(),
          this.loadRecentEvents()
        ])

        console.log('✅ 사이드바 데이터 로드 완료')
      } catch (error) {
        console.error('❌ 사이드바 데이터 로드 실패:', error)
        this.error = '데이터를 불러오는데 실패했습니다.'
      } finally {
        this.loading = false
      }
    },

    /**
     * 다가올 이벤트 로드
     */
    async loadUpcomingEvents() {
      try {
        const today = new Date()
        const nextMonth = new Date(today)
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        // 날짜를 문자열로 변환
        const startDateStr = this.formatDate(today)
        const endDateStr = this.formatDate(nextMonth)

        console.log('다가올 이벤트 날짜 범위:', startDateStr, '~', endDateStr)

        const response = await scheduleAPI.getSchedulesByDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        })

        // 오늘 이후의 일정만 필터링하고 시작일순 정렬
        this.upcomingEvents = (response.schedules || response || [])
          .filter(schedule => schedule.startDate >= startDateStr)
          .sort((a, b) => {
            // 시작일순 정렬
            const dateCompare = a.startDate.localeCompare(b.startDate)
            if (dateCompare !== 0) return dateCompare

            // 같은 날이면 우선순위순
            if (a.priority !== b.priority) {
              return a.priority - b.priority
            }

            // 시간순 (시간이 있는 경우)
            if (a.startTime && b.startTime) {
              return a.startTime.localeCompare(b.startTime)
            }

            return 0
          })
          .slice(0, 5) // 최대 5개까지만

        console.log(`📅 다가올 이벤트 ${this.upcomingEvents.length}개 로드`)
      } catch (error) {
        console.error('다가올 이벤트 로드 실패:', error)
        this.upcomingEvents = []
      }
    },

    /**
     * 최신 이벤트 로드
     */
    async loadRecentEvents() {
      try {
        // 최근 생성된 일정 조회 API가 있는지 확인
        let response
        try {
          response = await scheduleAPI.getRecentSchedules(5)
        // eslint-disable-next-line no-unused-vars
        } catch (recentApiError) {
          console.log('최신 일정 API 없음, 대체 방법 사용')

          // 최신 일정 API가 없는 경우 최근 1개월 데이터에서 추출
          const today = new Date()
          const oneMonthAgo = new Date(today)
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

          const startDateStr = this.formatDate(oneMonthAgo)
          const endDateStr = this.formatDate(today)

          console.log('최신 이벤트 대체 날짜 범위:', startDateStr, '~', endDateStr)

          response = await scheduleAPI.getSchedulesByDateRange({
            startDate: startDateStr,
            endDate: endDateStr
          })
        }

        this.recentEvents = (response.schedules || response || [])
          .sort((a, b) => {
            // 생성일순 정렬 (최신순)
            const createdAtA = new Date(a.createdAt || a.startDate)
            const createdAtB = new Date(b.createdAt || b.startDate)
            return createdAtB - createdAtA
          })
          .slice(0, 3) // 최대 3개까지만

        console.log(`✨ 최신 이벤트 ${this.recentEvents.length}개 로드`)
      } catch (error) {
        console.error('최신 이벤트 로드 실패:', error)
        this.recentEvents = []
      }
    },

    /**
     * 메뉴 토글
     */
    toggleMenu() {
      this.showMenu = !this.showMenu
    },

    /**
     * 외부 클릭 감지
     */
    handleOutsideClick(event) {
      const menuContainer = event.target.closest('.floating-menu')
      if (!menuContainer) {
        this.showMenu = false
      }
    },

    /**
     * 이벤트 요청 모달 열기
     */
    openEventRequest() {
      this.showMenu = false
      // TODO: 이벤트 요청 모달 구현
      alert('이벤트 추가/수정 요청 기능은 곧 구현됩니다!')
    },

    /**
     * 설정 페이지로 이동
     */
    goToSettings() {
      this.showMenu = false
      this.$router.push('/settings')
    },

    /**
     * 이메일 구독 모달 열기
     */
    openEmailSubscription() {
      this.showMenu = false
      // TODO: 이메일 구독 모달 구현
      alert('이메일 구독 기능은 곧 구현됩니다!')
    },

    /**
     * 날짜 형식 변환 (YYYY-MM-DD)
     */
    formatDate(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    /**
     * 이벤트 날짜 형식 변환 (표시용)
     */
    formatEventDate(event) {
      const date = new Date(event.startDate + 'T00:00:00')
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const eventDateString = this.formatDate(date)
      const todayString = this.formatDate(today)
      const tomorrowString = this.formatDate(tomorrow)

      // 오늘, 내일인지 확인
      if (eventDateString === todayString) {
        return '오늘'
      } else if (eventDateString === tomorrowString) {
        return '내일'
      }

      // 일반적인 날짜 형식
      const month = date.getMonth() + 1
      const day = date.getDate()

      // 올해인지 확인
      if (date.getFullYear() === today.getFullYear()) {
        return `${month}월 ${day}일`
      } else {
        return `${date.getFullYear()}년 ${month}월 ${day}일`
      }
    },

    /**
     * 데이터 새로고침
     */
    async refreshData() {
      await this.loadSidebarData()
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden; /* 데스크톱에서는 스크롤 방지 */
}

/* 메인 레이아웃 컨테이너 */
.layout-container {
  display: flex;
  height: 100vh;
  padding: 20px;
  gap: 20px;
  position: relative;
  overflow: hidden; /* 데스크톱에서는 스크롤 방지 */
}

/* 캘린더 섹션 */
.calendar-section {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden; /* 데스크톱에서는 캘린더 자체 스크롤 방지 */
}

/* 사이드바 섹션 */
.sidebar-section {
  width: 320px;
  height: 100%;
  position: relative;
}

/* 데스크톱 사이드바 */
.desktop-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

/* 모바일 사이드바 */
.mobile-sidebar {
  display: none;
}

/* 사이드바 카드 */
.sidebar-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.sidebar-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 6px;
}

/* 공지사항 카드 특별 스타일 */
.notice-card {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffeaa7;
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-item {
  padding: 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  border-left: 3px solid #f39c12;
}

.notice-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  margin-bottom: 2px;
  line-height: 1.3;
}

.notice-date {
  font-size: 10px;
  color: #666;
}

/* 이벤트 리스트 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
}

.event-item {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
  position: relative;
  transition: all 0.2s ease;
}

.event-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.event-date {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
  font-weight: 500;
}

.event-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  line-height: 1.2;
}

.event-time {
  font-size: 10px;
  color: #007bff;
  font-weight: 500;
}

.event-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #28a745;
  color: white;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: 600;
}

.no-events {
  text-align: center;
  color: #666;
  font-size: 12px;
  padding: 16px;
  font-style: italic;
}

/* 광고 영역 */
.ad-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ad-item {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.ad-item h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
}

.ad-item p {
  font-size: 12px;
  margin: 0 0 8px 0;
  opacity: 0.9;
  line-height: 1.3;
}

.ad-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.ad-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 플로팅 메뉴 (PC/모바일 공통) */
.floating-menu {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.floating-menu-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-menu-button:hover {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.floating-menu-button:active {
  transform: translateY(-1px) scale(1.05);
}

.floating-menu-icon {
  transform: rotate(90deg);
  font-weight: bold;
}

/* 플로팅 드롭다운 메뉴 */
.floating-dropdown-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  min-width: 220px;
  backdrop-filter: blur(10px);
}

.dropdown-item {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-icon {
  font-size: 18px;
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
  transform: translateY(10px) scale(0.9);
}

/* 모바일 반응형 디자인 */
@media (max-width: 768px) {
  .main-layout {
    overflow-y: auto; /* 모바일에서는 스크롤 허용 */
    height: auto;
    min-height: 100vh;
  }

  .layout-container {
    flex-direction: column;
    overflow-y: auto; /* 모바일에서는 스크롤 허용 */
    height: auto;
    min-height: 100vh;
    padding: 10px;
    gap: 10px;
  }

  .calendar-section {
    height: 60vh;
    overflow: visible; /* 모바일에서는 캘린더 스크롤 허용 */
    order: 2; /* 캘린더를 두 번째로 */
  }

  .sidebar-section {
    width: 100%;
    height: auto;
    order: 1; /* 사이드바를 첫 번째로 */
  }

  /* 데스크톱 사이드바 숨김 */
  .desktop-sidebar {
    display: none;
  }

  /* 모바일 사이드바 표시 */
  .mobile-sidebar {
    display: block;
  }

  /* 모바일 상단 섹션 (공지사항 + 광고만) */
  .mobile-top-section {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  /* 모바일 카드 (크기 최적화) */
  .mobile-card {
    flex: 1; /* 공지사항과 광고가 동일한 크기로 */
    padding: 10px;
    min-height: 120px;
  }

  .mobile-card h3 {
    font-size: 11px;
    margin-bottom: 6px;
    padding-bottom: 4px;
  }

  .mobile-card .notice-text {
    font-size: 10px;
    line-height: 1.2;
  }

  .mobile-card .notice-item {
    padding: 6px;
  }

  .mobile-card .notice-date {
    display: none; /* 모바일에서는 날짜 숨김 */
  }

  .mobile-card .ad-item {
    padding: 8px;
  }

  .mobile-card .ad-item h4 {
    font-size: 11px;
    margin-bottom: 4px;
  }

  .mobile-card .ad-item p {
    font-size: 9px;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .mobile-card .ad-button {
    padding: 4px 8px;
    font-size: 10px;
  }

  /* 플로팅 메뉴 모바일 최적화 */
  .floating-menu {
    bottom: 20px;
    right: 20px;
  }

  .floating-menu-button {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .floating-dropdown-menu {
    bottom: 60px;
    min-width: 200px;
  }

  .dropdown-item {
    padding: 12px 16px;
    font-size: 13px;
  }

  .dropdown-icon {
    font-size: 16px;
  }
}

/* 스크롤바 스타일 */
.desktop-sidebar::-webkit-scrollbar,
.event-list::-webkit-scrollbar {
  width: 4px;
}

.desktop-sidebar::-webkit-scrollbar-track,
.event-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.desktop-sidebar::-webkit-scrollbar-thumb,
.event-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.desktop-sidebar::-webkit-scrollbar-thumb:hover,
.event-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 사이드바 헤더 (새로고침 버튼 포함) */
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #f0f0f0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.refresh-btn:hover {
  background: #f0f0f0;
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 8px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 11px;
  color: #666;
}

/* 에러 상태 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  gap: 6px;
}

.error-icon {
  font-size: 16px;
}

.error-text {
  font-size: 11px;
  color: #dc3545;
  text-align: center;
  line-height: 1.3;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #c82333;
}
</style>
