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
        <div v-if="activeTab === 'events'" class="content-panel">
          <div class="content-header">
            <h2>이벤트 목록</h2>
            <button @click="openAddEventModal" class="btn btn-primary">
              새 이벤트 추가
            </button>
          </div>

          <div class="events-table">
            <table class="data-table">
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

        <!-- 공지사항 관리 탭 -->
        <div v-if="activeTab === 'notices'" class="content-panel">
          <div class="content-header">
            <h2>공지사항 관리</h2>
            <button class="btn btn-primary" @click="openNoticeModal()">
              + 새 공지사항
            </button>
          </div>

          <div class="notices-list">
            <div v-if="notices.length === 0" class="empty-state">
              <p>등록된 공지사항이 없습니다.</p>
            </div>

            <table v-else class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>제목</th>
                  <th>우선순위</th>
                  <th>상태</th>
                  <th>시작일</th>
                  <th>종료일</th>
                  <th>작성일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="notice in notices" :key="notice.id">
                  <td>{{ notice.id }}</td>
                  <td class="notice-title">{{ notice.title }}</td>
                  <td>
                    <span class="priority-badge" :style="{ backgroundColor: getNoticePriorityColor(notice.priority) }">
                      {{ getNoticePriorityText(notice.priority) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="notice.isActive ? 'active' : 'inactive'">
                      {{ notice.isActive ? '활성' : '비활성' }}
                    </span>
                  </td>
                  <td>{{ formatDate(notice.startDate) || '-' }}</td>
                  <td>{{ formatDate(notice.endDate) || '-' }}</td>
                  <td>{{ formatDate(notice.createdAt) }}</td>
                  <td class="actions">
                    <button class="btn-icon" @click="openNoticeModal(notice)" title="수정">
                      ✏️
                    </button>
                    <button class="btn-icon" @click="toggleNoticeStatus(notice.id)" title="상태 변경">
                      {{ notice.isActive ? '⏸️' : '▶️' }}
                    </button>
                    <button class="btn-icon" @click="deleteNotice(notice.id)" title="삭제">
                      🗑️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 공지사항 모달 -->
        <div v-if="showNoticeModal" class="modal-overlay" @click.self="showNoticeModal = false">
          <div class="modal-content notice-modal">
            <div class="modal-header">
              <h3>{{ noticeForm.id ? '공지사항 수정' : '새 공지사항' }}</h3>
              <button class="close-btn" @click="showNoticeModal = false">×</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>제목 *</label>
                <input
                  v-model="noticeForm.title"
                  type="text"
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>

              <div class="form-group">
                <label>내용 *</label>
                <textarea
                  v-model="noticeForm.content"
                  rows="6"
                  placeholder="공지사항 내용을 입력하세요"
                  required
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>우선순위</label>
                  <select v-model="noticeForm.priority">
                    <option :value="0">일반</option>
                    <option :value="1">중요</option>
                    <option :value="2">긴급</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>상태</label>
                  <select v-model="noticeForm.isActive">
                    <option :value="true">활성</option>
                    <option :value="false">비활성</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>시작일 (선택)</label>
                  <input
                    v-model="noticeForm.startDate"
                    type="datetime-local"
                  />
                </div>

                <div class="form-group">
                  <label>종료일 (선택)</label>
                  <input
                    v-model="noticeForm.endDate"
                    type="datetime-local"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showNoticeModal = false">
                취소
              </button>
              <button class="btn btn-primary" @click="saveNotice">
                {{ noticeForm.id ? '수정' : '생성' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 이벤트 요청 탭 -->
        <div v-if="activeTab === 'requests'" class="content-panel">
          <div class="content-header">
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
        <div v-if="activeTab === 'subscribers'" class="content-panel">
          <div class="content-header">
            <h2>구독자 관리</h2>
            <p class="subscriber-count">총 {{ subscribers.length }}명이 구독 중입니다.</p>
          </div>

          <div class="subscribers-table">
            <table class="data-table">
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
import {
  scheduleAPI,
  adminAPI,
  eventRequestAPI,
  emailSubscriptionAPI,
  noticeAPI,
  healthAPI
} from '@/services/api.js'
import EventManagementModal from '@/components/EventManagementModal.vue'
import {
  formatDate,
  formatDateTime,
  getPriorityText,
  getPriorityColor,
  getNoticePriorityText,
  getNoticePriorityColor,
  getCategoryColor
} from '@/utils/common.js'

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
        { id: 'notices', label: '공지사항 관리' },
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
      notices: [],

      // 필터
      requestFilter: 'all',

      // 모달
      showEventModal: false,
      selectedEvent: null,
      showNoticeModal: false,

      // 공지사항 폼
      noticeForm: {
        id: null,
        title: '',
        content: '',
        priority: 0,
        isActive: true,
        startDate: null,
        endDate: null
      },

      // 설정 (나중에 DB에서 관리)
      settings: {
        siteTitle: '더쿠 캘린더',
        siteDescription: '다양한 굿즈 이벤트를 확인하는 곳!',
        maintenanceMode: false,
        newsletterEnabled: true,
        newsletterDay: 0,
        newsletterTime: '09:00',
        weekStartDay: 0,
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
    const token = sessionStorage.getItem('admin-token')
    if (token) {
      this.isAuthenticated = true
      await this.loadDashboardData()
    }
  },

  methods: {
    // 유틸리티 함수들을 import해서 사용
    formatDate,
    formatDateTime,
    getPriorityText,
    getPriorityColor,
    getNoticePriorityText,
    getNoticePriorityColor,
    getCategoryColor,

    // 인증 관련
    async requestTempPassword() {
      if (!this.loginForm.email) {
        alert('이메일을 입력해주세요.')
        return
      }

      this.isLoading = true
      try {
        await adminAPI.requestTempPassword(this.loginForm.email)
        this.tempPasswordSent = true
        alert('임시 비밀번호가 이메일로 발송되었습니다.')
      } catch (error) {
        alert(error.message || '임시 비밀번호 발송에 실패했습니다.')
      } finally {
        this.isLoading = false
      }
    },

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

    // 데이터 로딩
    async loadDashboardData() {
      this.isLoading = true
      try {
        const results = await Promise.allSettled([
          scheduleAPI.getScheduleStats().catch(() => ({
            totalSchedules: 0,
            featuredSchedules: 0,
            todaySchedules: 0
          })),
          scheduleAPI.getAllSchedules().catch(() => ({ schedules: [] })),
          eventRequestAPI.getEventRequests().catch(() => []),
          emailSubscriptionAPI.getSubscribers().catch(() => ({ subscribers: [] }))
        ])

        this.stats = results[0].value
        this.events = results[1].value?.schedules || results[1].value || []
        this.eventRequests = results[2].value || []
        this.subscribers = results[3].value?.subscribers || results[3].value || []

        await this.loadNotices()

        console.log('✅ 대시보드 데이터 로딩 완료')
      } catch (error) {
        console.error('❌ 대시보드 데이터 로딩 실패:', error)
      } finally {
        this.isLoading = false
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

    async handleEventSaved() {
      await this.loadDashboardData()
      this.closeEventModal()
    },

    async deleteEvent(event) {
      if (!confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?`)) return

      try {
        await scheduleAPI.deleteSchedule(event.id)
        await this.loadDashboardData()
        alert('이벤트가 삭제되었습니다.')
      } catch (error) {
        alert('이벤트 삭제에 실패했습니다. ', error)
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
        alert('추천 상태 변경에 실패했습니다. ', error)
      }
    },

    // 공지사항 관리
    async loadNotices() {
      try {
        const response = await noticeAPI.getAllNotices()
        this.notices = response.notices || []
      } catch (error) {
        console.error('공지사항 로드 실패:', error)
        this.notices = []
      }
    },

    openNoticeModal(notice = null) {
      if (notice) {
        this.noticeForm = { ...notice }
      } else {
        this.noticeForm = {
          id: null,
          title: '',
          content: '',
          priority: 0,
          isActive: true,
          startDate: null,
          endDate: null
        }
      }
      this.showNoticeModal = true
    },

    async saveNotice() {
      try {
        if (this.noticeForm.id) {
          await noticeAPI.updateNotice(this.noticeForm.id, this.noticeForm)
          alert('공지사항이 수정되었습니다.')
        } else {
          await noticeAPI.createNotice(this.noticeForm)
          alert('공지사항이 생성되었습니다.')
        }
        this.showNoticeModal = false
        await this.loadNotices()
      } catch (error) {
        alert('공지사항 저장에 실패했습니다. ', error)
      }
    },

    async deleteNotice(id) {
      if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) return

      try {
        await noticeAPI.deleteNotice(id)
        alert('공지사항이 삭제되었습니다.')
        await this.loadNotices()
      } catch (error) {
        alert('공지사항 삭제에 실패했습니다. ', error)
      }
    },

    async toggleNoticeStatus(id) {
      try {
        await noticeAPI.toggleNoticeStatus(id)
        await this.loadNotices()
      } catch (error) {
        alert('상태 변경에 실패했습니다. ', error)
      }
    },

    // 이벤트 요청 관리
    async approveRequest(request) {
      try {
        await eventRequestAPI.updateRequestStatus(request.id, 'APPROVED')
        await this.loadDashboardData()
        alert('요청이 승인되었습니다.')
      } catch (error) {
        alert('요청 승인에 실패했습니다. ', error)
      }
    },

    async rejectRequest(request) {
      try {
        await eventRequestAPI.updateRequestStatus(request.id, 'REJECTED')
        await this.loadDashboardData()
        alert('요청이 거절되었습니다.')
      } catch (error) {
        alert('요청 거절에 실패했습니다. ', error)
      }
    },

    getStatusText(status) {
      const statusMap = {
        pending: '대기중',
        PENDING: '대기중',
        approved: '승인됨',
        APPROVED: '승인됨',
        rejected: '거절됨',
        REJECTED: '거절됨'
      }
      return statusMap[status] || status
    },

    // 구독자 관리
    async toggleSubscriberStatus(subscriber) {
      try {
        await emailSubscriptionAPI.updateSubscriberStatus(
          subscriber.id,
          !subscriber.isActive
        )
        await this.loadDashboardData()
      } catch (error) {
        alert('구독자 상태 변경에 실패했습니다. ', error)
      }
    },

    // 설정 관련
    async saveGeneralSettings() {
      // TODO: API 구현 후 연동
      console.log('일반 설정 저장:', this.settings)
      alert('일반 설정이 저장되었습니다.')
    },

    async saveNotificationSettings() {
      // TODO: API 구현 후 연동
      console.log('뉴스레터 설정 저장:', this.settings)
      alert('뉴스레터 설정이 저장되었습니다.')
    },

    // 시스템 체크
    async checkSystemHealth() {
      try {
        const health = await healthAPI.checkHealth()
        alert(`🟢 시스템 정상 작동중\n\n서버: ${health.status || '정상'}\nDB: ${health.database || '연결됨'}`)
      } catch (error) {
        alert(`🔴 시스템 상태 확인 실패\n\n${error.message}`)
      }
    }
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* ===== 로그인 섹션 ===== */
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 28px;
}

/* ===== 관리자 대시보드 ===== */
.admin-dashboard {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.admin-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

/* ===== 탭 네비게이션 ===== */
.tab-navigation {
  display: flex;
  background: white;
  border-radius: 12px;
  margin-bottom: 30px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  gap: 5px;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #64748b;
  font-size: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background-color: #f1f5f9;
  color: #475569;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* ===== 탭 콘텐츠 공통 스타일 ===== */
.tab-content {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 통계 카드 ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-card h3 {
  margin: 0 0 15px 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ===== 통일된 패널 스타일 ===== */
.content-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
}

.content-header h2 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

/* ===== 통일된 테이블 스타일 ===== */
.data-table {
  width: 100%;
  background: white;
}

.data-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.data-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #334155;
  vertical-align: middle;
}

.data-table tbody tr {
  transition: background-color 0.2s ease;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* ===== 배지 스타일 통일 ===== */
.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  text-align: center;
  min-width: 60px;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.badge-warning {
  background-color: #fed7aa;
  color: #92400e;
  border: 1px solid #fdba74;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge-info {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.badge-default {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

/* ===== 액션 버튼 통일 ===== */
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 18px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-icon:hover * {
  filter: brightness(0) invert(1);
}

/* ===== 버튼 스타일 통일 ===== */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover {
  background: #475569;
  transform: translateY(-2px);
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
  transform: translateY(-2px);
}

/* ===== 빈 상태 스타일 ===== */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 20px;
}

.empty-state .icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.3;
}

/* ===== 모달 스타일 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 25px;
  border-bottom: 2px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #94a3b8;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  padding: 25px;
  border-top: 2px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

/* ===== 폼 스타일 통일 ===== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ===== 반응형 디자인 ===== */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .tab-navigation {
    flex-wrap: wrap;
  }

  .data-table {
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 10px;
  }
}
</style>
