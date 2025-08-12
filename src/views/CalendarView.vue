<template>
  <div class="main-layout">
    <!-- 메인 컨테이너 -->
    <div class="layout-container">
      <!-- 캘린더 섹션 (좌측~중앙) -->
      <div class="calendar-section">
        <DuckHuCalendar />
      </div>

      <!-- 사이드바 섹션 (우측 5단) -->
      <div class="sidebar-section">
        <!-- 1. 메뉴 버튼 (최상단) -->
        <div class="sidebar-card menu-card">
          <div class="menu-button-container">
            <button class="inline-menu-button" @click="toggleMenu">
              <span class="menu-text">더쿠 캘린더 메뉴</span>
            </button>

            <!-- 드롭다운 메뉴 -->
            <transition name="dropdown">
              <div v-if="showMenu" class="dropdown-menu">
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

        <!-- 2. 공지사항 -->
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

        <!-- 3. 다가올 이벤트 -->
        <div class="sidebar-card">
          <h3>📅 다가올 이벤트</h3>
          <div class="upcoming-events">
            <div v-if="upcomingEvents.length > 0" class="event-list">
              <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
                <div class="event-date">{{ formatEventDate(event) }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-time" v-if="event.startTime">{{ event.startTime }}</div>
              </div>
            </div>
            <div v-else class="no-events">
              다가올 이벤트가 없습니다.
            </div>
          </div>
        </div>

        <!-- 4. 최신 추가된 이벤트 -->
        <div class="sidebar-card">
          <h3>✨ 최신 이벤트</h3>
          <div class="recent-events">
            <div v-if="recentEvents.length > 0" class="event-list">
              <div v-for="event in recentEvents" :key="event.id" class="event-item">
                <div class="event-date">{{ formatEventDate(event) }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-badge">NEW</div>
              </div>
            </div>
            <div v-else class="no-events">
              최근 추가된 이벤트가 없습니다.
            </div>
          </div>
        </div>

        <!-- 5. 광고 영역 (최하단) -->
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
    </div>
  </div>
</template>

<script>
import DuckHuCalendar from '@/components/DuckHuCalendar.vue'

export default {
  name: 'CalendarView',

  components: {
    DuckHuCalendar
  },

  data() {
    return {
      showMenu: false,

      // 더미 데이터 (실제로는 DuckHuCalendar에서 가져와야 함)
      upcomingEvents: [
        {
          id: 1,
          title: '팀 미팅',
          startDate: '2025-08-15',
          startTime: '10:00'
        },
        {
          id: 2,
          title: '프로젝트 발표',
          startDate: '2025-08-18',
          startTime: '14:00'
        }
      ],

      recentEvents: [
        {
          id: 3,
          title: '새로운 기능 개발',
          startDate: '2025-08-20',
          startTime: null
        }
      ]
    }
  },

  mounted() {
    // 외부 클릭 시 메뉴 닫기
    document.addEventListener('click', this.handleOutsideClick)
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
  },

  methods: {
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
      const menuContainer = event.target.closest('.menu-button-container')
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
     * 이벤트 날짜 형식 변환
     */
    formatEventDate(event) {
      const date = new Date(event.startDate + 'T00:00:00')
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}월 ${day}일`
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden; /* 스크롤 방지 */
}

/* 메인 레이아웃 컨테이너 */
.layout-container {
  display: flex;
  height: 100vh;
  padding: 20px;
  gap: 20px;
  position: relative;
  overflow: hidden; /* 스크롤 방지 */
}

/* 캘린더 섹션 */
.calendar-section {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden; /* 캘린더 자체 스크롤 방지 */
}

/* 사이드바 섹션 - 5단 구조 */
.sidebar-section {
  width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 8px;
  position: relative;
  z-index: 100;
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

/* 메뉴 카드 특별 스타일 */
.menu-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px;
  position: relative;
  z-index: 1000;
}

/* 메뉴 버튼 컨테이너 */
.menu-button-container {
  position: relative;
  z-index: 1001; /* 버튼 컨테이너도 높은 z-index */
}

.inline-menu-button {
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.inline-menu-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.menu-icon {
  transform: rotate(90deg);
  font-weight: bold;
  font-size: 18px;
}

.menu-text {
  font-size: 14px;
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
  max-height: 120px;
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

/* 드롭다운 메뉴 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(10px);
  z-index: 9999; /* 매우 높은 z-index로 설정 */
}

.dropdown-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
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

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .sidebar-section {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
    overflow-y: auto;
    height: auto;
    min-height: 100vh;
  }

  .calendar-section {
    height: 60vh;
    overflow: visible;
  }

  .sidebar-section {
    width: 100%;
    height: auto;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: visible;
    padding-bottom: 20px;
  }

  .sidebar-card {
    min-width: 250px;
    flex-shrink: 0;
  }

  .menu-card {
    min-width: 200px;
  }
}

/* 스크롤바 스타일 */
.sidebar-section::-webkit-scrollbar,
.event-list::-webkit-scrollbar {
  width: 4px;
}

.sidebar-section::-webkit-scrollbar-track,
.event-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.sidebar-section::-webkit-scrollbar-thumb,
.event-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.sidebar-section::-webkit-scrollbar-thumb:hover,
.event-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
