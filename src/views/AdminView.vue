<!-- src/views/AdminView.vue -->
<template>
  <div class="admin-page">
    <!-- 페이지 헤더 -->
    <header class="admin-header">
      <h1>👑 관리자 대시보드</h1>
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
                :disabled="tempPasswordSent"
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
            <div class="stat-icon">📌</div>
            <div class="stat-content">
              <h3>오늘 일정</h3>
              <p class="stat-number">{{ stats.todaySchedules || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <h3>이벤트 요청</h3>
              <p class="stat-number">{{ pendingRequests }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📧</div>
            <div class="stat-content">
              <h3>활성 구독자</h3>
              <p class="stat-number">{{ activeSubscribers }}</p>
            </div>
          </div>
        </div>

        <!-- 탭 네비게이션 -->
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
          <!-- 대시보드 탭 -->
          <div v-if="activeTab === 'dashboard'" class="dashboard-panel">
            <h2>최근 활동</h2>
            <div class="activity-feed">
              <div class="activity-item" v-if="recentActivity.length === 0">
                <p>시스템이 정상적으로 운영되고 있습니다.</p>
                <small>마지막 업데이트: {{ new Date().toLocaleString('ko-KR') }}</small>
              </div>
            </div>
          </div>

          <!-- 이벤트 관리 탭 -->
          <div v-if="activeTab === 'events'" class="events-panel">
            <div class="panel-header">
              <h2>이벤트 목록</h2>
              <button @click="openAddEventModal" class="btn btn-primary">
                + 새 이벤트 추가
              </button>
            </div>

            <div class="events-table">
              <table>
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>날짜</th>
                    <th>카테고리</th>
                    <th>추천</th>
                    <th>조회수</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in events" :key="event.id">
                    <td>{{ event.title }}</td>
                    <td>{{ formatDate(event.startDate) }}</td>
                    <td>
                      <span class="category-badge">{{ event.category }}</span>
                    </td>
                    <td class="text-center">
                      <button @click="toggleFeatured(event)" class="star-btn">
                        {{ event.isFeatured ? '⭐' : '☆' }}
                      </button>
                    </td>
                    <td class="text-center">{{ event.viewCount || 0 }}</td>
                    <td class="actions">
                      <button @click="editEvent(event)" class="btn-small btn-edit">수정</button>
                      <button @click="deleteEvent(event)" class="btn-small btn-delete">삭제</button>
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
              <div
                v-for="request in filteredRequests"
                :key="request.id"
                class="request-card">
                <div class="request-header">
                  <div class="request-badges">
                    <span :class="['request-type', request.requestType.toLowerCase()]">
                      {{ getRequestTypeLabel(request.requestType) }}
                    </span>
                    <span :class="['request-status', request.status.toLowerCase()]">
                      {{ getRequestStatusLabel(request.status) }}
                    </span>
                  </div>
                  <div class="request-date">
                    {{ formatDate(request.createdAt) }}
                  </div>
                </div>

                <div class="request-body">
                  <h3>{{ getRequestTitle(request) }}</h3>
                  <p class="requester">요청자: {{ request.requesterEmail }}</p>

                  <div v-if="request.eventData" class="event-details">
                    <div v-if="request.eventData.date">
                      <strong>예정일:</strong> {{ request.eventData.date }}
                    </div>
                    <div v-if="request.eventData.description">
                      <strong>설명:</strong> {{ request.eventData.description }}
                    </div>
                    <div v-if="request.eventData.location">
                      <strong>장소:</strong> {{ request.eventData.location }}
                    </div>
                  </div>
                </div>

                <div v-if="request.status === 'PENDING'" class="request-actions">
                  <button
                    @click="handleRequestAction(request.id, 'APPROVED')"
                    class="btn btn-approve">
                    승인
                  </button>
                  <button
                    @click="handleRequestAction(request.id, 'REJECTED')"
                    class="btn btn-reject">
                    거절
                  </button>
                </div>
              </div>

              <div v-if="filteredRequests.length === 0" class="empty-state">
                <p>{{ getEmptyRequestMessage() }}</p>
              </div>
            </div>
          </div>

          <!-- 구독자 관리 탭 -->
          <div v-if="activeTab === 'subscribers'" class="subscribers-panel">
            <div class="panel-header">
              <h2>구독자 목록</h2>
              <div class="subscriber-stats">
                <span>총 구독자: {{ subscribers.length }}명</span>
                <span>활성: {{ activeSubscribers }}명</span>
              </div>
            </div>

            <div class="subscribers-table">
              <table>
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>구독일</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="subscriber in subscribers" :key="subscriber.id">
                    <td>{{ subscriber.email }}</td>
                    <td>{{ subscriber.subscriberName || '-' }}</td>
                    <td>{{ formatDate(subscriber.subscribedAt) }}</td>
                    <td>
                      <span :class="['status-badge', subscriber.isActive ? 'active' : 'inactive']">
                        {{ subscriber.isActive ? '활성' : '비활성' }}
                      </span>
                    </td>
                    <td class="actions">
                      <button
                        v-if="subscriber.isActive"
                        @click="toggleSubscriberStatus(subscriber)"
                        class="btn-small btn-warning">
                        비활성화
                      </button>
                      <button
                        v-else
                        @click="toggleSubscriberStatus(subscriber)"
                        class="btn-small btn-success">
                        활성화
                      </button>
                      <button
                        @click="removeSubscriber(subscriber)"
                        class="btn-small btn-delete">
                        삭제
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-if="subscribers.length === 0" class="empty-state">
                <p>구독자가 없습니다.</p>
              </div>
            </div>
          </div>

          <!-- 설정 탭 -->
          <div v-if="activeTab === 'settings'" class="settings-panel">
            <h2>시스템 설정</h2>
            <div class="coming-soon">
              <p>설정 기능은 준비 중입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { scheduleAPI, adminAPI, eventRequestAPI, emailSubscriptionAPI } from '@/services/api.js'

export default {
  name: 'AdminView',

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
        totalViews: 0,
        todaySchedules: 0
      },

      // 데이터
      events: [],
      eventRequests: [],
      subscribers: [],
      recentActivity: [],

      // 필터
      requestFilter: 'all'
    }
  },

  computed: {
    pendingRequests() {
      return this.eventRequests.filter(r => r.status === 'PENDING').length
    },

    activeSubscribers() {
      return this.subscribers.filter(s => s.isActive).length
    },

    filteredRequests() {
      if (this.requestFilter === 'all') return this.eventRequests
      return this.eventRequests.filter(r =>
        r.status.toLowerCase() === this.requestFilter
      )
    }
  },

  mounted() {
    this.checkAuthentication()
  },

  methods: {
    // 인증 확인
    async checkAuthentication() {
      const token = sessionStorage.getItem('admin-token')
      if (token) {
        try {
          await adminAPI.checkAuth()
          this.isAuthenticated = true
          await this.loadDashboardData()
        } catch (error) {
          console.error('인증 확인 실패:', error)
          sessionStorage.removeItem('admin-token')
          this.isAuthenticated = false
        }
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
      alert('이벤트 추가 기능을 구현해야 합니다.')
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

    // 이벤트 요청 처리
    async handleRequestAction(requestId, action) {
      const actionText = action === 'APPROVED' ? '승인' : '거절'
      if (!confirm(`이 요청을 ${actionText}하시겠습니까?`)) return

      try {
        await eventRequestAPI.updateRequestStatus(requestId, action)

        // 상태 업데이트
        const request = this.eventRequests.find(r => r.id === requestId)
        if (request) request.status = action

        alert(`요청이 ${actionText}되었습니다.`)

        // 승인된 경우 이벤트 목록 새로고침
        if (action === 'APPROVED') {
          await this.loadDashboardData()
        }
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert(`요청 ${actionText}에 실패했습니다.`)
      }
    },

    // 구독자 관리
    async toggleSubscriberStatus(subscriber) {
      try {
        await emailSubscriptionAPI.updateSubscriberStatus(
          subscriber.id,
          !subscriber.isActive
        )
        subscriber.isActive = !subscriber.isActive
        alert(`구독자 상태가 ${subscriber.isActive ? '활성화' : '비활성화'}되었습니다.`)
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert('구독자 상태 변경에 실패했습니다.')
      }
    },

    async removeSubscriber(subscriber) {
      if (!confirm(`${subscriber.email} 구독자를 삭제하시겠습니까?`)) return

      try {
        await emailSubscriptionAPI.deleteSubscriber(subscriber.id)
        this.subscribers = this.subscribers.filter(s => s.id !== subscriber.id)
        alert('구독자가 삭제되었습니다.')
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert('구독자 삭제에 실패했습니다.')
      }
    },

    // 유틸리티
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('ko-KR')
    },

    getRequestTypeLabel(type) {
      const labels = {
        'ADD': '추가 요청',
        'MODIFY': '수정 요청',
        'DELETE': '삭제 요청'
      }
      return labels[type] || type
    },

    getRequestStatusLabel(status) {
      const labels = {
        'PENDING': '대기중',
        'APPROVED': '승인됨',
        'REJECTED': '거절됨'
      }
      return labels[status] || status
    },

    getRequestTitle(request) {
      try {
        const data = typeof request.eventData === 'string'
          ? JSON.parse(request.eventData)
          : request.eventData
        return data.title || '제목 없음'
      } catch {
        return '제목 없음'
      }
    },

    getEmptyRequestMessage() {
      if (this.requestFilter === 'pending') return '처리할 요청이 없습니다.'
      if (this.requestFilter === 'approved') return '승인된 요청이 없습니다.'
      if (this.requestFilter === 'rejected') return '거절된 요청이 없습니다.'
      return '요청이 없습니다.'
    }
  }
}
</script>

<style scoped>
/* 기본 스타일은 이미 제공된 것과 동일 */
/* 추가 스타일 */

.request-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.request-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.request-badges {
  display: flex;
  gap: 10px;
}

.request-type,
.request-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.request-type.add { background: #d4edda; color: #155724; }
.request-type.modify { background: #fff3cd; color: #856404; }
.request-type.delete { background: #f8d7da; color: #721c24; }

.request-status.pending { background: #e2e3e5; color: #383d41; }
.request-status.approved { background: #cce5ff; color: #004085; }
.request-status.rejected { background: #f8d7da; color: #721c24; }

.request-body h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.requester {
  color: #666;
  margin-bottom: 10px;
}

.event-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.event-details div {
  margin-bottom: 8px;
}

.event-details strong {
  color: #333;
  margin-right: 8px;
}

.request-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-approve {
  background: #28a745;
  color: white;
}

.btn-approve:hover {
  background: #218838;
}

.btn-reject {
  background: #dc3545;
  color: white;
}

.btn-reject:hover {
  background: #c82333;
}

.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.subscriber-stats {
  display: flex;
  gap: 20px;
  color: #666;
}

.subscriber-stats span {
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #e2e3e5;
  color: #383d41;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-success {
  background: #28a745;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}
</style>
