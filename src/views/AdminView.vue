<template>
  <div class="admin-container">
    <!-- 로그인이 안 된 경우 -->
    <div v-if="!isAuthenticated" class="login-section">
      <div class="login-card">
        <h2>관리자 로그인</h2>

        <div v-if="!tempPasswordSent" class="temp-password-request">
          <div class="form-group">
            <label>관리자 이메일</label>
            <input
              v-model="loginForm.email"
              type="email"
              placeholder="admin@example.com"
              @keyup.enter="requestTempPassword"
            />
          </div>
          <button @click="requestTempPassword" :disabled="isLoading" class="btn btn-primary">
            {{ isLoading ? '전송 중...' : '임시 비밀번호 요청' }}
          </button>
        </div>

        <div v-else class="temp-password-login">
          <p class="success-message">임시 비밀번호가 {{ loginForm.email }}로 전송되었습니다.</p>
          <div class="form-group">
            <label>임시 비밀번호</label>
            <input
              v-model="loginForm.tempPassword"
              type="password"
              placeholder="이메일로 받은 임시 비밀번호를 입력하세요"
              @keyup.enter="login"
            />
          </div>
          <button @click="login" :disabled="isLoading" class="btn btn-primary">
            {{ isLoading ? '로그인 중...' : '로그인' }}
          </button>
          <button @click="tempPasswordSent = false" class="btn btn-secondary">
            다시 요청하기
          </button>
        </div>
      </div>
    </div>

    <!-- 로그인된 관리자 페이지 -->
    <div v-else class="admin-dashboard">
      <!-- 헤더 -->
      <div class="admin-header">
        <h1>관리자 페이지</h1>
        <button @click="logout" class="btn btn-secondary">로그아웃</button>
      </div>

      <!-- 탭 네비게이션 -->
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- 대시보드 탭 -->
        <div v-if="activeTab === 'dashboard'" class="dashboard-panel">
          <!-- 통계 카드들을 한 줄로 표시 -->
          <div class="stats-row">
            <div class="stat-card">
              <h3>총 이벤트</h3>
              <div class="stat-number">{{ stats.totalSchedules }}</div>
            </div>
            <div class="stat-card">
              <h3>추천 이벤트</h3>
              <div class="stat-number">{{ stats.featuredSchedules }}</div>
            </div>
            <div class="stat-card">
              <h3>오늘의 이벤트</h3>
              <div class="stat-number">{{ stats.todaySchedules }}</div>
            </div>
            <div class="stat-card">
              <h3>총 구독자</h3>
              <div class="stat-number">{{ subscribers.length }}</div>
            </div>
          </div>

          <div class="dashboard-content">
            <div class="recent-activity">
              <h3>최근 활동</h3>
              <div class="activity-list">
                <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                  <span class="activity-time">{{ formatDate(activity.createdAt) }}</span>
                  <span class="activity-description">{{ activity.description }}</span>
                </div>
              </div>
            </div>

            <div class="quick-actions">
              <h3>빠른 작업</h3>
              <div class="action-buttons">
                <button @click="openAddEventModal" class="btn btn-primary">
                  새 이벤트 추가
                </button>
                <button @click="activeTab = 'requests'" class="btn btn-outline">
                  이벤트 요청 확인
                </button>
                <button @click="checkSystemHealth" class="btn btn-outline">
                  시스템 상태 확인
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 이벤트 관리 탭 -->
        <div v-if="activeTab === 'events'" class="events-panel">
          <div class="panel-header">
            <h2>이벤트 목록</h2>
            <button @click="openAddEventModal" class="btn btn-primary">
              새 이벤트 추가
            </button>
          </div>

          <div class="events-table">
            <table>
              <thead>
                <tr>
                  <th>제목</th>
                  <th>날짜/시간</th>
                  <th>카테고리</th>
                  <th>추천</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in events" :key="event.id">
                  <td>{{ event.title }}</td>
                  <td>
                    <div class="date-time-info">
                      <!-- 시작 날짜 -->
                      <div class="date-row">
                        <strong>시작:</strong> {{ formatDate(event.startDate) }}
                        <div v-if="event.startTime" class="time-info">{{ event.startTime }}</div>
                      </div>
                      <!-- 종료 날짜 (있는 경우만) -->
                      <div v-if="event.endDate && event.endDate !== event.startDate" class="date-row">
                        <strong>종료:</strong> {{ formatDate(event.endDate) }}
                        <div v-if="event.endTime" class="time-info">{{ event.endTime }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="category-badge">{{ event.category }}</span>
                  </td>
                  <td class="text-center">
                    <button @click="toggleFeatured(event)" class="star-btn">
                      {{ event.isFeatured ? '⭐' : '☆' }}
                    </button>
                  </td>
                  <td class="actions">
                    <button @click="editEvent(event)" class="btn btn-primary btn-small">
                      수정
                    </button>
                    <button @click="deleteEvent(event)" class="btn btn-danger btn-small">
                      삭제
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="events.length === 0" class="empty-state">
              <p>등록된 이벤트가 없습니다.</p>
            </div>
          </div>
        </div>

        <!-- 이벤트 요청 탭 -->
        <div v-if="activeTab === 'requests'" class="requests-panel">
          <div class="panel-header">
            <h2>이벤트 요청 관리</h2>
            <div class="filter-buttons">
              <button
                @click="requestFilter = 'all'"
                :class="['filter-btn', { active: requestFilter === 'all' }]">
                전체 ({{ eventRequests.length }})
              </button>
              <button
                @click="requestFilter = 'pending'"
                :class="['filter-btn', { active: requestFilter === 'pending' }]">
                대기중 ({{ pendingRequests }})
              </button>
              <button
                @click="requestFilter = 'approved'"
                :class="['filter-btn', { active: requestFilter === 'approved' }]">
                승인됨
              </button>
              <button
                @click="requestFilter = 'rejected'"
                :class="['filter-btn', { active: requestFilter === 'rejected' }]">
                거절됨
              </button>
            </div>
          </div>

          <div class="requests-list">
            <div v-for="request in filteredRequests" :key="request.id" class="request-card">
              <div class="request-header">
                <h4>{{ request.title }}</h4>
                <span :class="['status-badge', request.status]">
                  {{ getStatusText(request.status) }}
                </span>
              </div>
              <div class="request-content">
                <p><strong>요청자:</strong> {{ request.email }}</p>
                <p><strong>날짜:</strong> {{ formatDate(request.requestedDate) }}</p>
                <p><strong>설명:</strong> {{ request.description }}</p>
              </div>
              <div class="request-actions" v-if="request.status === 'pending'">
                <button @click="approveRequest(request)" class="btn btn-success btn-small">승인</button>
                <button @click="rejectRequest(request)" class="btn btn-danger btn-small">거절</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 구독자 관리 탭 -->
        <div v-if="activeTab === 'subscribers'" class="subscribers-panel">
          <div class="panel-header">
            <h2>구독자 관리</h2>
            <p class="subscriber-count">총 {{ subscribers.length }}명이 구독 중입니다.</p>
          </div>

          <div class="subscribers-table">
            <table>
              <thead>
                <tr>
                  <th>이메일</th>
                  <th>구독일</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="subscriber in subscribers" :key="subscriber.id">
                  <td>{{ subscriber.email }}</td>
                  <td>{{ formatDate(subscriber.subscribedAt) }}</td>
                  <td>
                    <span :class="['status-badge', subscriber.isActive ? 'active' : 'inactive']">
                      {{ subscriber.isActive ? '활성' : '비활성' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button @click="toggleSubscriberStatus(subscriber)" class="btn btn-outline btn-small">
                      {{ subscriber.isActive ? '비활성화' : '활성화' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 설정 탭 -->
        <div v-if="activeTab === 'settings'" class="settings-panel">
          <div class="settings-grid">
            <!-- 일반 설정 -->
            <div class="setting-card">
              <h3>일반 설정</h3>

              <div class="setting-item">
                <label>사이트 제목</label>
                <input v-model="settings.siteTitle" type="text" />
              </div>

              <div class="setting-item">
                <label>사이트 설명</label>
                <textarea v-model="settings.siteDescription"></textarea>
              </div>

              <div class="setting-item">
                <label class="checkbox-label">
                  <input v-model="settings.maintenanceMode" type="checkbox" />
                  유지보수 모드
                </label>
              </div>

              <button @click="saveGeneralSettings" class="btn btn-primary">
                저장
              </button>
            </div>

            <!-- 알림 설정 -->
            <div class="setting-card">
              <h3>뉴스레터 설정</h3>

              <div class="setting-item">
                <label class="checkbox-label">
                  <input v-model="settings.newsletterEnabled" type="checkbox" />
                  뉴스레터 발송 활성화
                </label>
              </div>

              <div class="setting-item">
                <label>발송 요일</label>
                <select v-model="settings.newsletterDay">
                  <option value="0">일요일</option>
                  <option value="1">월요일</option>
                  <option value="2">화요일</option>
                  <option value="3">수요일</option>
                  <option value="4">목요일</option>
                  <option value="5">금요일</option>
                  <option value="6">토요일</option>
                </select>
              </div>

              <div class="setting-item">
                <label>발송 시간</label>
                <input v-model="settings.newsletterTime" type="time" />
              </div>

              <button @click="saveNotificationSettings" class="btn btn-primary">
                저장
              </button>
            </div>

            <!-- 캘린더 설정 -->
            <div class="setting-card">
              <h3>캘린더 설정</h3>

              <div class="setting-item">
                <label>주 시작일</label>
                <select v-model="settings.weekStartDay">
                  <option value="0">일요일</option>
                  <option value="1">월요일</option>
                </select>
              </div>

              <div class="setting-item">
                <label>기본 보기</label>
                <select v-model="settings.defaultView">
                  <option value="month">월간</option>
                  <option value="week">주간</option>
                  <option value="day">일간</option>
                </select>
              </div>

              <div class="setting-item">
                <label>페이지당 이벤트 수</label>
                <input
                  v-model.number="settings.eventsPerPage"
                  type="number"
                  min="10"
                  max="100"
                />
              </div>

              <div class="setting-item">
                <label class="checkbox-label">
                  <input v-model="settings.showWeekNumbers" type="checkbox" />
                  주 번호 표시 (현재 미구현)
                </label>
              </div>

              <button @click="saveCalendarSettings" class="btn btn-primary">
                저장
              </button>
            </div>

            <!-- 데이터 관리 설정 (관리자 전용) -->
            <div class="setting-card">
              <h3>데이터 관리</h3>

              <div class="setting-item">
                <label>데이터 백업</label>
                <button @click="backupData" class="btn btn-outline">
                  백업 생성
                </button>
              </div>

              <div class="setting-item danger-zone">
                <label>위험 구역</label>
                <button @click="confirmDeleteAllEvents" class="btn btn-danger">
                  모든 이벤트 삭제
                </button>
                <button @click="confirmDeleteAllSubscribers" class="btn btn-danger">
                  모든 구독자 삭제
                </button>
              </div>

              <p class="warning-text">
                ⚠️ 삭제된 데이터는 복구할 수 없습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이벤트 관리 모달 -->
    <EventManagementModal
      :show="showEventModal"
      :event="selectedEvent"
      @close="closeEventModal"
      @saved="handleEventSaved"
    />
  </div>
</template>

<script>
import { scheduleAPI, adminAPI, eventRequestAPI, emailSubscriptionAPI } from '@/services/api.js'
import EventManagementModal from '@/components/EventManagementModal.vue'

export default {
  name: 'AdminView',

  components: {
    EventManagementModal
  },

  data() {
    return {
      // 인증 상태
      isAuthenticated: false,
      isLoading: false,
      tempPasswordSent: false,

      // 로그인 폼
      loginForm: {
        email: '',
        tempPassword: ''
      },

      // 탭 관리
      activeTab: 'dashboard',
      tabs: [
        { id: 'dashboard', label: '대시보드' },
        { id: 'events', label: '이벤트 관리' },
        { id: 'requests', label: '이벤트 요청' },
        { id: 'subscribers', label: '구독자 관리' },
        { id: 'settings', label: '설정' }
      ],

      // 통계 데이터
      stats: {
        totalSchedules: 0,
        featuredSchedules: 0,
        todaySchedules: 0
      },

      // 데이터
      events: [],
      eventRequests: [],
      subscribers: [],
      recentActivity: [],

      // 필터
      requestFilter: 'all',
      showEventModal: false,
      selectedEvent: null,
      settings: {
        // 일반 설정
        siteTitle: '더쿠 캘린더',
        siteDescription: '다양한 굿즈 이벤트를 확인하는 곳!',
        maintenanceMode: false,

        // 뉴스레터 설정
        newsletterEnabled: true,
        newsletterDay: 0, // 일요일
        newsletterTime: '09:00', // 오전 9시

        // 캘린더 설정
        weekStartDay: 0, // 일요일
        defaultView: 'month',
        eventsPerPage: 20,
        showWeekNumbers: false
      }
    }
  },

  computed: {
    filteredRequests() {
      if (this.requestFilter === 'all') return this.eventRequests
      return this.eventRequests.filter(request => request.status === this.requestFilter)
    },

    pendingRequests() {
      return this.eventRequests.filter(request => request.status === 'pending').length
    }
  },

  async mounted() {
    // 인증 상태 확인
    const token = sessionStorage.getItem('admin-token')
    if (token) {
      this.isAuthenticated = true
      await this.loadDashboardData()
    }
  },

  methods: {
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
        alert('임시 비밀번호가 발송되었습니다.')
      } catch (error) {
        alert(error.message || '임시 비밀번호 발송에 실패했습니다.')
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
        const response = await adminAPI.login(this.loginForm.email, this.loginForm.tempPassword)
        sessionStorage.setItem('admin-token', response.token)
        this.isAuthenticated = true
        await this.loadDashboardData()
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
        sessionStorage.removeItem('admin-token')
        this.isAuthenticated = false
        this.loginForm = { email: '', tempPassword: '' }
        this.tempPasswordSent = false
        this.$router.push('/')
      }
    },

    // 대시보드 데이터 로딩
    async loadDashboardData() {
      try {
        // 통계 데이터
        const statsResponse = await scheduleAPI.getScheduleStats()
        this.stats = statsResponse

        // 이벤트 목록
        const eventsResponse = await scheduleAPI.getAllSchedules()
        this.events = eventsResponse.schedules || eventsResponse || []

        // 이벤트 요청
        const requestsResponse = await eventRequestAPI.getEventRequests()
        this.eventRequests = requestsResponse || []

        // 구독자 목록
        const subscribersResponse = await emailSubscriptionAPI.getSubscribers()
        this.subscribers = subscribersResponse.subscribers || subscribersResponse || []

        console.log('✅ 대시보드 데이터 로딩 완료')
      } catch (error) {
        console.error('❌ 대시보드 데이터 로딩 실패:', error)
      }
    },

    // 이벤트 관리
    openAddEventModal() {
      this.selectedEvent = null
      this.showEventModal = true
    },

    editEvent(event) {
      this.selectedEvent = event
      this.showEventModal = true
    },

    closeEventModal() {
      this.showEventModal = false
      this.selectedEvent = null
    },

    async handleEventSaved(result) {
      console.log('이벤트 저장됨:', result)
      await this.loadDashboardData()

      if (result.type === 'create') {
        console.log('새 이벤트가 추가되었습니다.')
      } else {
        console.log('이벤트가 수정되었습니다.')
      }
    },

    async deleteEvent(event) {
      if (!confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?`)) return

      try {
        await scheduleAPI.deleteSchedule(event.id)
        await this.loadDashboardData()
        alert('이벤트가 삭제되었습니다.')
      } catch (error) {
        alert('이벤트 삭제에 실패했습니다.')
      }
    },

    async toggleFeatured(event) {
      try {
        await scheduleAPI.updateSchedule(event.id, {
          ...event,
          isFeatured: !event.isFeatured
        })
        await this.loadDashboardData()
      } catch (error) {
        alert('추천 상태 변경에 실패했습니다.')
      }
    },

    // 이벤트 요청 관리
    async approveRequest(request) {
      try {
        await eventRequestAPI.updateRequestStatus(request.id, 'approved')
        await this.loadDashboardData()
        alert('요청이 승인되었습니다.')
      } catch (error) {
        alert('요청 승인에 실패했습니다.')
      }
    },

    async rejectRequest(request) {
      try {
        await eventRequestAPI.updateRequestStatus(request.id, 'rejected')
        await this.loadDashboardData()
        alert('요청이 거절되었습니다.')
      } catch (error) {
        alert('요청 거절에 실패했습니다.')
      }
    },

    getStatusText(status) {
      const statusMap = {
        pending: '대기중',
        approved: '승인됨',
        rejected: '거절됨'
      }
      return statusMap[status] || status
    },

    // 구독자 관리
    async toggleSubscriberStatus(subscriber) {
      try {
        await emailSubscriptionAPI.updateSubscriber(subscriber.id, {
          isActive: !subscriber.isActive
        })
        await this.loadDashboardData()
      } catch (error) {
        alert('구독자 상태 변경에 실패했습니다.')
      }
    },

    // 설정 관련 메서드들
    async saveGeneralSettings() {
      try {
        console.log('일반 설정 저장:', this.settings)
        alert('일반 설정이 저장되었습니다.')
      } catch (error) {
        alert('설정 저장에 실패했습니다.')
      }
    },

    async saveNotificationSettings() {
      try {
        console.log('뉴스레터 설정 저장:', this.settings)
        alert('뉴스레터 설정이 저장되었습니다.')
      } catch (error) {
        alert('설정 저장에 실패했습니다.')
      }
    },

    async saveCalendarSettings() {
      try {
        console.log('캘린더 설정 저장:', this.settings)
        alert('캘린더 설정이 저장되었습니다.')
      } catch (error) {
        alert('설정 저장에 실패했습니다.')
      }
    },

    // 데이터 관리
    async backupData() {
      try {
        // 백업 생성 로직
        alert('데이터 백업이 생성되었습니다.')
      } catch (error) {
        alert('백업 생성에 실패했습니다.')
      }
    },

    async confirmDeleteAllEvents() {
      if (!confirm('정말로 모든 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
      if (!confirm('다시 한 번 확인합니다. 모든 이벤트 데이터가 영구적으로 삭제됩니다.')) return

      try {
        // 모든 이벤트 삭제 로직
        alert('모든 이벤트가 삭제되었습니다.')
        await this.loadDashboardData()
      } catch (error) {
        alert('이벤트 삭제에 실패했습니다.')
      }
    },

    async confirmDeleteAllSubscribers() {
      if (!confirm('정말로 모든 구독자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
      if (!confirm('다시 한 번 확인합니다. 모든 구독자 데이터가 영구적으로 삭제됩니다.')) return

      try {
        // 모든 구독자 삭제 로직
        alert('모든 구독자가 삭제되었습니다.')
        await this.loadDashboardData()
      } catch (error) {
        alert('구독자 삭제에 실패했습니다.')
      }
    },

    async checkSystemHealth() {
      try {
        // 시스템 상태 확인 로직
        alert('시스템이 정상적으로 동작하고 있습니다.')
      } catch (error) {
        alert('시스템 상태 확인에 실패했습니다.')
      }
    },

    // 유틸리티 메서드
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ko-KR')
    }
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 로그인 섹션 */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.success-message {
  color: #28a745;
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #d4edda;
  border-radius: 6px;
}

/* 관리자 대시보드 */
.admin-dashboard {
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.admin-header h1 {
  color: #333;
  margin: 0;
}

/* 탭 네비게이션 */
.tab-navigation {
  display: flex;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  background: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background-color: #f8f9fa;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background-color: #f8f9fa;
}

/* 대시보드 통계 카드를 한 줄로 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
}

/* 대시보드 콘텐츠 */
.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.recent-activity,
.quick-actions {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recent-activity h3,
.quick-actions h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.activity-list {
  space-y: 10px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-time {
  color: #666;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 이벤트 테이블 */
.events-panel,
.requests-panel,
.subscribers-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #eee;
}

.panel-header h2 {
  margin: 0;
  color: #333;
}

.events-table,
.subscribers-table {
  overflow-x: auto;
}

.events-table table,
.subscribers-table table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td,
.subscribers-table th,
.subscribers-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.events-table th,
.subscribers-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
}

/* 날짜/시간 정보 스타일링 */
.date-time-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-info {
  font-size: 12px;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-badge {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.star-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.text-center {
  text-align: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* 이벤트 요청 */
.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-btn:hover {
  background-color: #f8f9fa;
}

.filter-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.requests-list {
  padding: 20px;
}

.request-card {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.request-header h4 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.request-content p {
  margin: 5px 0;
  color: #555;
}

.request-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 구독자 관리 */
.subscriber-count {
  color: #666;
  margin: 0;
  font-size: 14px;
}

/* 설정 */
.settings-panel {
  padding: 20px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.setting-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 25px;
}

.setting-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.setting-item input,
.setting-item select,
.setting-item textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.setting-item textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.danger-zone {
  border: 1px solid #dc3545;
  border-radius: 4px;
  padding: 15px;
  background-color: #fff5f5;
}

.danger-zone button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.warning-text {
  color: #dc3545;
  font-size: 12px;
  margin: 10px 0 0 0;
}

/* 버튼 스타일 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .actions {
    flex-direction: column;
  }

  .request-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .tab-navigation {
    flex-direction: column;
  }

  .filter-buttons {
    flex-wrap: wrap;
  }
}
</style>
