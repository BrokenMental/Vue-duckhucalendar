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
            <div class="sidebar-header">
              <h3>📢 공지사항</h3>
              <button v-if="!loadingSidebar" @click="refreshData" class="refresh-btn" title="새로고침">
                🔄
              </button>
            </div>

            <!-- 로딩 상태 -->
            <div v-if="loadingSidebar" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">로딩 중...</div>
            </div>

            <!-- 공지사항 목록 -->
            <div v-else-if="notices.length > 0" class="notice-list">
              <div
                v-for="notice in notices"
                :key="notice.id"
                class="notice-item"
                @click="showNoticeDetail(notice)"
              >
                <div class="notice-content">
                  <div class="notice-title">{{ notice.title }}</div>
                  <div class="notice-date">{{ formatNoticeDate(notice) }}</div>
                </div>
                <div class="notice-priority" v-if="notice.priority > 0">
                  <span class="priority-badge">중요</span>
                </div>
              </div>
            </div>

            <!-- 공지사항 없음 -->
            <div v-else class="no-content">
              현재 공지사항이 없습니다
            </div>
          </div>

          <!-- 2. 다가올 이벤트 (개선된 버전) -->
          <div class="sidebar-card">
            <div class="sidebar-header">
              <h3>📅 다가올 이벤트</h3>
              <button v-if="!loadingSidebar" @click="refreshData" class="refresh-btn" title="새로고침">
                🔄
              </button>
            </div>
            <div class="upcoming-events">
              <!-- 로딩 상태 -->
              <div v-if="loadingSidebar" class="loading-state">
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
                <div class="event-item upcoming"
                  v-for="event in upcomingEvents"
                  :key="event.id"
                  @click="handleSidebarEventClick(event)">
                  <div class="event-date">{{ formatEventDate(event) }}</div>
                  <div class="event-content">
                    <div class="event-title">{{ event.title }}</div>
                    <div class="event-time">{{ formatEventTime(event) }}</div>
                  </div>
                  <div class="event-color" :style="{ backgroundColor: event.color || '#007bff' }"></div>
                  <div v-if="event.isFeatured" class="featured-badge">⭐</div>
                </div>
              </div>
              <!-- 빈 상태 -->
              <div v-else class="no-content">
                예정된 이벤트가 없습니다
              </div>
            </div>
          </div>

          <!-- 3. 최신 추가된 이벤트 (개선된 버전) -->
          <div class="sidebar-card">
            <h3>✨ 최신 추가 이벤트</h3>
            <div class="recent-events">
              <!-- 로딩 상태 -->
              <div v-if="loadingSidebar" class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">로딩 중...</div>
              </div>
              <!-- 정상 데이터 -->
              <div v-else-if="recentEvents.length > 0" class="event-list">
                <div class="event-item recent"
                  v-for="event in recentEvents"
                  :key="event.id"
                  @click="handleSidebarEventClick(event)">
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
                  <div v-else class="event-color" :style="{ backgroundColor: event.color || '#28a745' }"></div>
                </div>
              </div>
              <!-- 빈 상태 -->
              <div v-else class="no-content">
                최근 추가된 이벤트가 없습니다
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

  <!-- 공지사항 상세 모달 -->
  <div v-if="showNoticeModal" class="notice-modal-overlay" @click.self="closeNoticeModal">
    <div class="notice-modal-content">
      <div class="notice-modal-header">
        <h2>📢 공지사항</h2>
        <button class="modal-close-btn" @click="closeNoticeModal">✕</button>
      </div>

      <div v-if="selectedNotice" class="notice-modal-body">
        <h3 class="notice-title">{{ selectedNotice.title }}</h3>
        <div class="notice-meta">
          <span class="notice-date">작성일: {{ formatNoticeDate(selectedNotice) }}</span>
          <span v-if="selectedNotice.priority" class="notice-priority">
            중요도: {{ selectedNotice.priority }}
          </span>
        </div>
        <div class="notice-content">
          {{ selectedNotice.content || '내용이 없습니다.' }}
        </div>
      </div>

      <div class="notice-modal-footer">
        <button class="btn btn-primary" @click="closeNoticeModal">확인</button>
      </div>
    </div>
  </div>
</template>

<script>
import DuckHuCalendar from '@/components/DuckHuCalendar.vue'
import { scheduleAPI } from '@/services/api.js'
import { noticeAPI } from '@/services/noticeAPI.js'

export default {
  name: 'CalendarView',

  components: {
    DuckHuCalendar
  },

  data() {
    return {
      showMenu: false,

      // 사이드바 데이터
      upcomingEvents: [],
      recentEvents: [],
      notices: [], // 공지사항 추가
      loading: false,
      loadingSidebar: false, // 사이드바 전용 로딩
      error: null,

      // 공지사항 모달 관련
      showNoticeModal: false,
      selectedNotice: null,

      // 이벤트 하이라이트 관련
      highlightedDate: null,
      highlightedEventId: null,
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
     * 사이드바 데이터 로딩 개선
     */
    async loadSidebarData() {
      if (this.loadingSidebar) return

      this.loadingSidebar = true
      this.error = null

      try {
        // 병렬로 모든 데이터 로드
        const [upcomingData, recentData, noticesData] = await Promise.allSettled([
          this.loadUpcomingEvents(),
          this.loadRecentEvents(),
          this.loadNotices()
        ])

        // 다가오는 이벤트 처리
        if (upcomingData.status === 'fulfilled') {
          this.upcomingEvents = upcomingData.value
        } else {
          console.error('다가오는 이벤트 로드 실패:', upcomingData.reason)
          this.upcomingEvents = []
        }

        // 최근 이벤트 처리
        if (recentData.status === 'fulfilled') {
          this.recentEvents = recentData.value
        } else {
          console.error('최근 이벤트 로드 실패:', recentData.reason)
          this.recentEvents = []
        }

        // 공지사항 처리
        if (noticesData.status === 'fulfilled') {
          this.notices = noticesData.value
        } else {
          console.error('공지사항 로드 실패:', noticesData.reason)
          this.notices = []
        }

        console.log('✅ 사이드바 데이터 로드 완료')

      } catch (error) {
        console.error('❌ 사이드바 데이터 로딩 중 오류:', error)
        this.error = '데이터를 불러오는데 실패했습니다.'
      } finally {
        this.loadingSidebar = false
      }
    },

    /**
     * 다가오는 이벤트 로드 (최대 2개)
     */
    async loadUpcomingEvents() {
      try {
        const today = new Date()
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + 30) // 30일 후까지

        const startDateStr = this.formatDate(today)
        const endDateStr = this.formatDate(futureDate)

        console.log('다가오는 이벤트 날짜 범위:', startDateStr, '~', endDateStr)

        const response = await scheduleAPI.getSchedulesByDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        })

        // 오늘 이후의 일정만 필터링하고 정렬
        const upcomingEvents = (response.schedules || response || [])
          .filter(schedule => {
            const scheduleDate = new Date(schedule.startDate)
            return scheduleDate >= today
          })
          .sort((a, b) => {
            // 1차: 날짜순
            const dateCompare = a.startDate.localeCompare(b.startDate)
            if (dateCompare !== 0) return dateCompare

            // 2차: 우선순위순 (높은 순)
            if (a.priority !== b.priority) {
              return (a.priority || 3) - (b.priority || 3)
            }

            // 3차: 시간순
            if (a.startTime && b.startTime) {
              return a.startTime.localeCompare(b.startTime)
            }

            return 0
          })
          .slice(0, 2) // 최대 2개만

        console.log(`📅 다가오는 이벤트 ${upcomingEvents.length}개 로드`)
        return upcomingEvents

      } catch (error) {
        console.error('다가오는 이벤트 로드 실패:', error)
        return []
      }
    },

    /**
     * 최근 추가된 이벤트 로드 (최대 2개)
     */
    async loadRecentEvents() {
      try {
        // 최근 생성된 일정 조회
        let response
        try {
          response = await scheduleAPI.getRecentSchedules(10) // 10개 조회 후 필터링
        // eslint-disable-next-line no-unused-vars
        } catch (apiError) {
          console.log('최신 일정 API 없음, 대체 방법 사용')

          // 대체 방법: 최근 30일 데이터에서 추출
          const today = new Date()
          const thirtyDaysAgo = new Date(today)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const startDateStr = this.formatDate(thirtyDaysAgo)
          const endDateStr = this.formatDate(today)

          response = await scheduleAPI.getSchedulesByDateRange({
            startDate: startDateStr,
            endDate: endDateStr
          })
        }

        // 최신 이벤트 정렬 및 필터링
        const recentEvents = (response.schedules || response || [])
          .sort((a, b) => {
            // 생성일순 정렬 (최신순)
            const createdAtA = new Date(a.createdAt || a.startDate)
            const createdAtB = new Date(b.createdAt || b.startDate)
            return createdAtB - createdAtA
          })
          .slice(0, 2) // 최대 2개만

        console.log(`✨ 최신 이벤트 ${recentEvents.length}개 로드`)
        return recentEvents

      } catch (error) {
        console.error('최신 이벤트 로드 실패:', error)
        return []
      }
    },

    /**
     * 공지사항 로드 (최대 2개)
     */
    async loadNotices() {
      try {
        const response = await noticeAPI.getActiveNotices(2)
        const notices = response.notices || []

        console.log(`📢 공지사항 ${notices.length}개 로드`)
        return notices

      } catch (error) {
        console.error('공지사항 로드 실패:', error)

        // 공지사항 API가 구현되지 않은 경우 기본 공지사항 반환
        if (error.message.includes('400') ||
            error.message.includes('404') ||
            error.message.includes('CORS') ||
            error.message.includes('잘못된 요청') ||
            error.message.includes('서버에 공지사항 API가 구현되지 않았을')) {

          console.log('📢 공지사항 API 연결 실패, 기본 공지사항 사용')
          return [
            {
              id: 1,
              title: '🎉 DuckHu Calendar에 오신 것을 환영합니다!',
              content: '새로운 일정 관리 시스템이 시작되었습니다.',
              createdAt: new Date().toISOString(),
              priority: 1,
              isActive: true
            },
            {
              id: 2,
              title: '📅 새로운 기능이 추가되었습니다',
              content: '이제 이벤트에 이미지와 링크를 추가할 수 있습니다.',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 어제
              priority: 0,
              isActive: true
            }
          ]
        }

        return []
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
     * 이벤트 상세보기
     */
    showEventDetail(event) {
      // TODO: 이벤트 상세 모달 구현
      alert(`📅 ${event.title}\n\n날짜: ${this.formatEventDate(event)}\n시간: ${this.formatEventTime(event)}`)
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
     * 이벤트 시간 포맷팅
     */
    formatEventTime(event) {
      if (!event.startTime) {
        return '종일'
      }

      if (event.endTime) {
        return `${event.startTime} - ${event.endTime}`
      }

      return event.startTime
    },

    /**
     * 공지사항 날짜 포맷팅
     */
    formatNoticeDate(notice) {
      const date = new Date(notice.createdAt)
      const today = new Date()

      // 오늘 날짜인지 확인
      if (date.toDateString() === today.toDateString()) {
        return '오늘'
      }

      // 어제 날짜인지 확인
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        return '어제'
      }

      // 올해인지 확인
      if (date.getFullYear() === today.getFullYear()) {
        return `${date.getMonth() + 1}.${date.getDate()}`
      }

      return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
    },

    /**
     * 데이터 새로고침
     */
    async refreshData() {
      await this.loadSidebarData()
    },

    /**
     * 공지사항 상세보기 모달
     */
    showNoticeDetail(notice) {
      this.selectedNotice = notice
      this.showNoticeModal = true
    },

    /**
     * 공지사항 모달 닫기
     */
    closeNoticeModal() {
      this.showNoticeModal = false
      this.selectedNotice = null
    },

    /**
     * 이벤트 클릭 시 해당 날짜로 이동
     */
    goToEventDate(event) {
      // 날짜 파싱
      const eventDate = new Date(event.startDate + 'T00:00:00')

      // 해당 월로 이동
      this.selectedYear = eventDate.getFullYear()
      this.selectedMonth = eventDate.getMonth()

      // 캘린더 다시 그리기
      this.$nextTick(() => {
        // 해당 날짜 하이라이트
        this.highlightedDate = event.startDate
        this.highlightedEventId = event.id

        // 해당 날짜 요소로 스크롤
        const dateElement = document.querySelector(`[data-date="${event.startDate}"]`)
        if (dateElement) {
          dateElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

          // 깜빡임 효과
          dateElement.classList.add('blink-animation')

          // 3초 후 깜빡임 제거
          setTimeout(() => {
            this.highlightedDate = null
            this.highlightedEventId = null
            dateElement.classList.remove('blink-animation')
          }, 3000)
        }
      })
    },

    /**
     * 사이드바 이벤트 클릭 처리
     */
    handleSidebarEventClick(event) {
      this.goToEventDate(event)
    },
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

/* 이벤트 아이템 */
.event-item {
  cursor: pointer;
  position: relative;
}

.event-item.upcoming {
  border-left-color: #007bff;
}

.event-item.recent {
  border-left-color: #28a745;
}

.featured-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
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

.event-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
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

/* 빈 상태 */
.no-content {
  text-align: center;
  color: #666;
  font-size: 12px;
  padding: 16px;
  font-style: italic;
  opacity: 0.8;
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

.notice-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.notice-modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.notice-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.notice-modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.notice-modal-body {
  padding: 24px;
  max-height: 50vh;
  overflow-y: auto;
}

.notice-title {
  font-size: 24px;
  margin: 0 0 16px 0;
  color: #333;
}

.notice-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.notice-date,
.notice-priority {
  font-size: 14px;
  color: #666;
}

.notice-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.notice-modal-footer {
  padding: 16px 24px;
  background: #f5f5f5;
  display: flex;
  justify-content: flex-end;
}

/* 날짜 하이라이트 및 깜빡임 애니메이션 */
.date-cell.highlighted {
  background: #fff3cd !important;
  border: 2px solid #ffc107 !important;
}

.blink-animation {
  animation: blink 0.6s ease-in-out 5;
}

@keyframes blink {
  0%, 100% {
    background: #fff3cd;
    transform: scale(1);
  }
  50% {
    background: #ffe69c;
    transform: scale(1.02);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 사이드바 이벤트 아이템 커서 */
.event-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
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

/* 사이드바 헤더 */
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
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.refresh-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
  transform: rotate(180deg);
}

/* 공지사항 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid #f39c12;
}

.notice-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(4px);
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-date {
  font-size: 10px;
  color: #666;
}

.notice-priority {
  flex-shrink: 0;
}

.priority-badge {
  background: #dc3545;
  color: white;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
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
