<template>
  <div class="admin-page">
    <!-- 페이지 헤더 -->
    <header class="admin-header">
      <h1>👑 관리자 페이지</h1>
      <nav class="admin-nav">
        <RouterLink to="/" class="nav-link">캘린더로 돌아가기</RouterLink>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </nav>
    </header>

    <div class="admin-container">
      <!-- 관리자 로그인이 필요한 경우 -->
      <div v-if="!isAuthenticated" class="login-section">
        <div class="login-card">
          <h2>관리자 인증</h2>
          <p>관리자 이메일을 입력하면 임시 비밀번호를 전송해드립니다.</p>

          <div class="login-form">
            <div class="form-group">
              <label for="adminEmail">관리자 이메일</label>
              <input
                type="email"
                id="adminEmail"
                v-model="loginForm.email"
                placeholder="admin@example.com"
                @keyup.enter="requestTempPassword"
              />
            </div>

            <div v-if="tempPasswordSent" class="form-group">
              <label for="tempPassword">임시 비밀번호</label>
              <input
                type="password"
                id="tempPassword"
                v-model="loginForm.tempPassword"
                placeholder="이메일로 받은 임시 비밀번호를 입력하세요"
                @keyup.enter="login"
              />
            </div>

            <div class="form-actions">
              <button
                v-if="!tempPasswordSent"
                @click="requestTempPassword"
                :disabled="!loginForm.email || isLoading"
                class="btn btn-primary">
                {{ isLoading ? '전송 중...' : '임시 비밀번호 요청' }}
              </button>

              <button
                v-else
                @click="login"
                :disabled="!loginForm.tempPassword || isLoading"
                class="btn btn-primary">
                {{ isLoading ? '로그인 중...' : '로그인' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 관리자 대시보드 -->
      <div v-else class="admin-dashboard">
        <!-- 통계 카드들 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>전체 이벤트</h3>
              <p class="stat-number">{{ stats.totalSchedules || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <h3>추천 이벤트</h3>
              <p class="stat-number">{{ stats.featuredSchedules || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">👁️</div>
            <div class="stat-content">
              <h3>총 조회수</h3>
              <p class="stat-number">{{ stats.totalViews || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📧</div>
            <div class="stat-content">
              <h3>구독자</h3>
              <p class="stat-number">{{ stats.totalSubscribers || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- 관리 탭들 -->
        <div class="admin-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]">
            {{ tab.label }}
          </button>
        </div>

        <!-- 탭 컨텐츠 -->
        <div class="tab-content">
          <!-- 이벤트 관리 -->
          <div v-if="activeTab === 'events'" class="tab-panel">
            <div class="panel-header">
              <h3>이벤트 관리</h3>
              <button @click="openAddEventModal" class="btn btn-primary">
                새 이벤트 추가
              </button>
            </div>

            <div class="events-table">
              <div class="table-header">
                <div>제목</div>
                <div>날짜</div>
                <div>상태</div>
                <div>조회수</div>
                <div>액션</div>
              </div>

              <div v-for="event in events" :key="event.id" class="table-row">
                <div class="event-title">
                  <span :class="{ featured: event.isFeatured }">{{ event.title }}</span>
                  <span v-if="event.isFeatured" class="featured-badge">⭐</span>
                </div>
                <div>{{ formatDate(event.startDate) }}</div>
                <div>
                  <span :class="['status-badge', getEventStatus(event)]">
                    {{ getEventStatusText(event) }}
                  </span>
                </div>
                <div>{{ event.viewCount || 0 }}</div>
                <div class="actions">
                  <button @click="editEvent(event)" class="btn-small btn-edit">수정</button>
                  <button @click="toggleFeatured(event)" class="btn-small btn-star">
                    {{ event.isFeatured ? '⭐' : '☆' }}
                  </button>
                  <button @click="deleteEvent(event)" class="btn-small btn-delete">삭제</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 이벤트 요청 관리 -->
          <div v-if="activeTab === 'requests'" class="tab-panel">
            <h3>이벤트 요청 관리</h3>
            <p class="text-muted">사용자들의 이벤트 추가/수정 요청을 관리합니다.</p>
            <div class="coming-soon">
              🚧 개발 중입니다...
            </div>
          </div>

          <!-- 구독자 관리 -->
          <div v-if="activeTab === 'subscribers'" class="tab-panel">
            <h3>구독자 관리</h3>
            <p class="text-muted">이메일 구독자들을 관리하고 뉴스레터를 발송합니다.</p>
            <div class="coming-soon">
              🚧 개발 중입니다...
            </div>
          </div>

          <!-- 설정 -->
          <div v-if="activeTab === 'settings'" class="tab-panel">
            <h3>시스템 설정</h3>
            <div class="settings-grid">
              <div class="setting-card">
                <h4>데이터 관리</h4>
                <div class="setting-actions">
                  <button @click="exportAllData" class="btn btn-secondary">
                    📤 전체 데이터 내보내기
                  </button>
                  <button @click="clearAllData" class="btn btn-danger">
                    🗑️ 모든 데이터 삭제
                  </button>
                </div>
              </div>

              <div class="setting-card">
                <h4>시스템 정보</h4>
                <div class="system-info">
                  <p>API 버전: 2.0.0</p>
                  <p>데이터베이스: PostgreSQL</p>
                  <p>마지막 업데이트: {{ new Date().toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { adminAPI, scheduleAPI } from '@/services/api.js'

export default {
  name: 'AdminView',

  data() {
    return {
      isAuthenticated: false,
      isLoading: false,
      tempPasswordSent: false,

      loginForm: {
        email: '',
        tempPassword: ''
      },

      activeTab: 'events',

      tabs: [
        { id: 'events', label: '이벤트 관리' },
        { id: 'requests', label: '이벤트 요청' },
        { id: 'subscribers', label: '구독자 관리' },
        { id: 'settings', label: '설정' }
      ],

      stats: {},
      events: []
    }
  },

  mounted() {
    this.checkAuthentication()
  },

  methods: {
    // 인증 확인
    async checkAuthentication() {
      try {
        await adminAPI.checkAuth()
        this.isAuthenticated = true
        this.loadDashboardData()
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        this.isAuthenticated = false
      }
    },

    // 임시 비밀번호 요청
    async requestTempPassword() {
      if (!this.loginForm.email) {
        alert('이메일을 입력해주세요.')
        return
      }

      this.isLoading = true
      try {
        await adminAPI.requestTempPassword(this.loginForm.email)
        this.tempPasswordSent = true
        alert('임시 비밀번호가 이메일로 전송되었습니다.')
      } catch (error) {
        alert(error.message || '임시 비밀번호 요청에 실패했습니다.')
      } finally {
        this.isLoading = false
      }
    },

    // 로그인
    async login() {
      if (!this.loginForm.tempPassword) {
        alert('임시 비밀번호를 입력해주세요.')
        return
      }

      this.isLoading = true
      try {
        await adminAPI.loginWithTempPassword(this.loginForm.email, this.loginForm.tempPassword)
        this.isAuthenticated = true
        this.loadDashboardData()
      } catch (error) {
        alert(error.message || '로그인에 실패했습니다.')
      } finally {
        this.isLoading = false
      }
    },

    // 로그아웃
    async logout() {
      try {
        await adminAPI.logout()
      } catch (error) {
        console.error('로그아웃 오류:', error)
      } finally {
        this.isAuthenticated = false
        this.loginForm = { email: '', tempPassword: '' }
        this.tempPasswordSent = false
        this.$router.push('/')
      }
    },

    // 대시보드 데이터 로딩
    async loadDashboardData() {
      try {
        // 통계 데이터 로딩
        this.stats = await scheduleAPI.getScheduleStats()

        // 이벤트 목록 로딩
        const response = await scheduleAPI.getAllSchedules()
        this.events = response.schedules || response || []
      } catch (error) {
        console.error('대시보드 데이터 로딩 실패:', error)
      }
    },

    // 이벤트 관리
    openAddEventModal() {
      alert('이벤트 추가 모달을 구현해야 합니다.')
    },

    editEvent(event) {
      alert(`"${event.title}" 이벤트 수정 기능을 구현해야 합니다.`)
    },

    async toggleFeatured(event) {
      try {
        await scheduleAPI.toggleFeatured(event.id, !event.isFeatured)
        event.isFeatured = !event.isFeatured
        alert(event.isFeatured ? '추천 이벤트로 설정되었습니다.' : '추천에서 해제되었습니다.')
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert('추천 설정 변경에 실패했습니다.')
      }
    },

    async deleteEvent(event) {
      if (confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?`)) {
        try {
          await scheduleAPI.deleteSchedule(event.id)
          this.events = this.events.filter(e => e.id !== event.id)
          alert('이벤트가 삭제되었습니다.')
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
          alert('이벤트 삭제에 실패했습니다.')
        }
      }
    },

    // 설정
    exportAllData() {
      alert('데이터 내보내기 기능을 구현해야 합니다.')
    },

    clearAllData() {
      if (confirm('정말로 모든 데이터를 삭제하시겠습니까?')) {
        if (confirm('이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?')) {
          alert('데이터 삭제 기능을 구현해야 합니다.')
        }
      }
    },

    // 유틸리티
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ko-KR')
    },

    getEventStatus(event) {
      const today = new Date().toISOString().split('T')[0]
      if (event.startDate > today) return 'upcoming'
      if (event.endDate < today) return 'completed'
      return 'ongoing'
    },

    getEventStatusText(event) {
      const status = this.getEventStatus(event)
      const statusMap = {
        upcoming: '예정',
        ongoing: '진행중',
        completed: '완료'
      }
      return statusMap[status]
    }
  }
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.admin-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.admin-nav {
  display: flex;
  gap: 15px;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 5px;
  transition: background 0.3s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* 로그인 섹션 */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.login-card h2 {
  margin-bottom: 10px;
  color: #333;
}

.login-card p {
  color: #666;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

/* 대시보드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
}

.stat-content h3 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* 탭 */
.admin-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 20px;
  background: #e9ecef;
  border-radius: 10px;
  padding: 4px;
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 테이블 */
.events-table {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  background: #f8f9fa;
  padding: 15px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.table-row:hover {
  background: #f8f9fa;
}

.event-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-title .featured {
  font-weight: 600;
  color: #667eea;
}

.featured-badge {
  font-size: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.upcoming {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.ongoing {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.completed {
  background: #f3e5f5;
  color: #7b1fa2;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #17a2b8;
  color: white;
}

.btn-star {
  background: #ffc107;
  color: #333;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-small:hover {
  transform: translateY(-1px);
}

/* 설정 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.setting-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
}

.setting-card h4 {
  margin-bottom: 15px;
  color: #333;
}

.setting-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.system-info p {
  margin: 5px 0;
  color: #666;
}

/* 버튼 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.form-actions {
  text-align: center;
  margin-top: 20px;
}

.coming-soon {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 18px;
}

.text-muted {
  color: #666;
  margin-bottom: 20px;
}

/* 반응형 */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .admin-tabs {
    flex-wrap: wrap;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .panel-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .actions {
    justify-content: center;
  }
}
</style>
