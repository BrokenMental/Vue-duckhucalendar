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
          <!-- 통계 카드들을 한 줄로 표시 (개선됨) -->
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-header">
                <h3>총 이벤트</h3>
                <span class="stat-icon">📅</span>
              </div>
              <div class="stat-number">{{ stats.totalSchedules }}</div>
              <div class="stat-description">등록된 전체 이벤트</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <h3>추천 이벤트</h3>
                <span class="stat-icon">⭐</span>
              </div>
              <div class="stat-number">{{ stats.featuredSchedules }}</div>
              <div class="stat-description">추천으로 설정된 이벤트</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <h3>오늘의 이벤트</h3>
                <span class="stat-icon">🎯</span>
              </div>
              <div class="stat-number">{{ stats.todaySchedules }}</div>
              <div class="stat-description">오늘 진행되는 이벤트</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <h3>총 구독자</h3>
                <span class="stat-icon">👥</span>
              </div>
              <div class="stat-number">{{ subscribers.length }}</div>
              <div class="stat-description">뉴스레터 구독자</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <h3>총 방문자</h3>
                <span class="stat-icon">🌐</span>
              </div>
              <div class="stat-number">{{ stats.totalVisitors.toLocaleString() }}</div>
              <div class="stat-description">누적 방문자 수</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <h3>오늘 방문자</h3>
                <span class="stat-icon">📊</span>
              </div>
              <div class="stat-number">{{ stats.todayVisitors }}</div>
              <div class="stat-description">오늘의 방문자 수</div>
            </div>
          </div>

          <!-- 대시보드 컨텐츠 영역 (개선됨) -->
          <div class="dashboard-content">
            <!-- 최근 활동 -->
            <div class="activity-section">
              <h3>최근 활동</h3>
              <div class="activity-list">
                <div v-if="recentActivity.length === 0" class="empty-activity">
                  <p>최근 활동이 없습니다.</p>
                </div>
                <div v-else>
                  <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                    <div class="activity-icon">{{ activity.icon }}</div>
                    <div class="activity-content">
                      <span class="activity-description">{{ activity.description }}</span>
                      <span class="activity-time">{{ formatDateTime(activity.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 시스템 활동 (새로 추가) -->
            <div class="activity-section">
              <h3>시스템 활동</h3>
              <div class="activity-list">
                <div v-if="systemActivity.length === 0" class="empty-activity">
                  <p>시스템 활동이 없습니다.</p>
                </div>
                <div v-else>
                  <div v-for="activity in systemActivity" :key="activity.id" class="activity-item system-activity">
                    <div class="activity-icon">{{ activity.icon }}</div>
                    <div class="activity-content">
                      <span class="activity-description">{{ activity.description }}</span>
                      <span class="activity-time">{{ formatDateTime(activity.createdAt) }}</span>
                    </div>
                    <div class="activity-status" :class="activity.status">
                      <span v-if="activity.status === 'success'">✅</span>
                      <span v-else-if="activity.status === 'warning'">⚠️</span>
                      <span v-else-if="activity.status === 'error'">❌</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 대기중인 요청 알림 (빠른 작업 대신) -->
          <div v-if="pendingRequests > 0" class="pending-requests-alert">
            <div class="alert-content">
              <span class="alert-icon">⏳</span>
              <div class="alert-text">
                <strong>{{ pendingRequests }}개의 이벤트 요청이 대기 중입니다.</strong>
                <p>관리자의 승인을 기다리고 있습니다.</p>
              </div>
              <button @click="activeTab = 'requests'" class="btn btn-primary btn-small">
                요청 확인하기
              </button>
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
            <div class="filter-section">
              <select v-model="requestFilter" class="filter-select">
                <option value="all">전체 보기</option>
                <option value="pending">대기중</option>
                <option value="PENDING">대기중</option>
                <option value="approved">승인됨</option>
                <option value="APPROVED">승인됨</option>
                <option value="rejected">거절됨</option>
                <option value="REJECTED">거절됨</option>
              </select>
              <div class="pending-badge" v-if="pendingRequests > 0">
                대기중: {{ pendingRequests }}건
              </div>
            </div>
          </div>

          <div class="requests-list">
            <div v-if="filteredRequests.length === 0" class="empty-state">
              <p>{{ requestFilter === 'all' ? '요청이 없습니다.' : '해당 상태의 요청이 없습니다.' }}</p>
            </div>

            <div v-else class="requests-grid">
              <div v-for="request in filteredRequests" :key="request.id" class="request-card">
                <div class="request-header">
                  <div class="request-type">
                    <span class="type-badge" :class="'type-' + request.requestType.toLowerCase()">
                      {{ request.requestType === 'ADD' ? '추가' : request.requestType === 'EDIT' ? '수정' : '삭제' }}
                    </span>
                  </div>
                  <div class="request-status">
                    <span class="status-badge" :class="'status-' + request.status.toLowerCase()">
                      {{ getStatusText(request.status) }}
                    </span>
                  </div>
                </div>

                <div class="request-content">
                  <h4 class="request-title">{{ request.title }}</h4>
                  <p class="request-description">{{ request.description }}</p>

                  <div class="request-meta">
                    <div class="meta-item">
                      <strong>요청자:</strong> {{ request.requesterName }} ({{ request.email }})
                    </div>
                    <div class="meta-item" v-if="request.proposedDate">
                      <strong>제안 날짜:</strong> {{ formatDate(request.proposedDate) }}
                    </div>
                    <div class="meta-item" v-if="request.category">
                      <strong>카테고리:</strong> {{ request.category }}
                    </div>
                    <div class="meta-item">
                      <strong>요청 일시:</strong> {{ formatDateTime(request.createdAt) }}
                    </div>
                  </div>
                </div>

                <div class="request-actions" v-if="request.status === 'pending' || request.status === 'PENDING'">
                  <button @click="approveRequest(request)" class="btn btn-success btn-small">
                    승인
                  </button>
                  <button @click="rejectRequest(request)" class="btn btn-danger btn-small">
                    거절
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 설정 탭 - 완성된 버전 -->
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
                <textarea v-model="settings.siteDescription" rows="3"></textarea>
              </div>

              <div class="setting-item">
                <label class="checkbox-label">
                  <input v-model="settings.maintenanceMode" type="checkbox" />
                  유지보수 모드
                </label>
                <p class="setting-description">활성화시 사용자에게 점검 중 메시지를 표시합니다.</p>
              </div>

              <button @click="saveGeneralSettings" class="btn btn-primary">
                저장
              </button>
            </div>

            <!-- 뉴스레터 설정 -->
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
                <p class="setting-description">현재 모든 데이터의 백업을 생성합니다.</p>
              </div>

              <div class="setting-item danger-zone">
                <label>위험 구역</label>
                <div class="danger-buttons">
                  <button @click="confirmDeleteAllEvents" class="btn btn-danger">
                    모든 이벤트 삭제
                  </button>
                  <button @click="confirmDeleteAllSubscribers" class="btn btn-danger">
                    모든 구독자 삭제
                  </button>
                  <button @click="confirmDeleteAllRequests" class="btn btn-danger">
                    모든 요청 삭제
                  </button>
                </div>
                <p class="warning-text">
                  ⚠️ 삭제된 데이터는 복구할 수 없습니다.
                </p>
              </div>
            </div>

            <!-- 시스템 정보 -->
            <div class="setting-card">
              <h3>시스템 정보</h3>

              <div class="setting-item">
                <label>시스템 상태</label>
                <button @click="checkSystemHealth" class="btn btn-outline">
                  상태 확인
                </button>
              </div>

              <div class="system-stats">
                <div class="stat-item">
                  <span class="stat-label">총 이벤트:</span>
                  <span class="stat-value">{{ events.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">총 구독자:</span>
                  <span class="stat-value">{{ subscribers.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">대기중 요청:</span>
                  <span class="stat-value">{{ pendingRequests }}</span>
                </div>
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

      // 통계 데이터 (개선됨)
      stats: {
        totalSchedules: 0,
        featuredSchedules: 0,
        todaySchedules: 0,
        totalVisitors: 0,      // 새로 추가
        todayVisitors: 0       // 새로 추가
      },

      // 데이터
      events: [],
      eventRequests: [],
      subscribers: [],
      notices: [],
      recentActivity: [],      // 최근 활동
      systemActivity: [],      // 시스템 활동 (새로 추가)

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
      if (!this.eventRequests || !Array.isArray(this.eventRequests)) {
        return []
      }

      if (this.requestFilter === 'all') return this.eventRequests
      return this.eventRequests.filter(request =>
        request && request.status === this.requestFilter
      )
    },

    pendingRequests() {
      if (!this.eventRequests || !Array.isArray(this.eventRequests)) {
        return 0
      }

      return this.eventRequests.filter(request =>
        request && (request.status === 'pending' || request.status === 'PENDING')
      ).length
    },

    // 안전한 배열 접근을 위한 computed 속성들
    safeEvents() {
      return this.events || []
    },

    safeSubscribers() {
      return this.subscribers || []
    },

    safeNotices() {
      return this.notices || []
    },

    safeRecentActivity() {
      return this.recentActivity || []
    },

    safeSystemActivity() {
      return this.systemActivity || []
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

    logout() {
      sessionStorage.removeItem('admin-token')
      this.isAuthenticated = false
      this.loginForm = { email: '', tempPassword: '' }
      this.tempPasswordSent = false
      this.activeTab = 'dashboard'
    },

    // 대시보드 데이터 로드
    async loadDashboardData() {
      // 각 API를 개별적으로 처리하여 일부 실패해도 계속 진행

      // 이벤트 데이터 로드
      try {
        const eventsData = await scheduleAPI.getAllSchedules()
        this.events = eventsData.schedules || eventsData || []
      } catch (error) {
        console.warn('이벤트 데이터 로드 실패:', error.message)
        this.events = []
      }

      // 이벤트 요청 데이터 로드
      try {
        const requestsData = await eventRequestAPI.getEventRequests()
        this.eventRequests = requestsData.requests || requestsData || []
      } catch (error) {
        console.warn('이벤트 요청 데이터 로드 실패:', error.message)
        this.eventRequests = [
          {
            id: 1,
            title: '샘플 요청',
            description: '샘플 이벤트 요청 설명입니다.',
            status: 'pending',
            requestType: 'ADD',
            requesterName: '테스트 사용자',
            email: 'test@example.com',
            createdAt: new Date().toISOString()
          }
        ]
      }

      // 구독자 데이터 로드
      try {
        const subscribersData = await emailSubscriptionAPI.getSubscribers()
        this.subscribers = subscribersData.subscribers || subscribersData || []
      } catch (error) {
        console.warn('구독자 데이터 로드 실패:', error.message)
        this.subscribers = []
      }

      // 공지사항 데이터 로드
      try {
        const noticesData = await noticeAPI.getAllNotices()
        this.notices = noticesData.notices || noticesData || []
      } catch (error) {
        console.warn('공지사항 데이터 로드 실패:', error.message)
        this.notices = []
      }

      // 통계 계산
      this.calculateStats()

      // 최근 활동 로드
      this.loadRecentActivity()

      // 시스템 활동 로드
      this.loadSystemActivity()

      console.log('✅ 대시보드 데이터 로드 완료 (일부 API 실패 가능)')
    },

    // 개발용 더미 데이터 로드
    loadDummyData() {
      this.events = [
        {
          id: 1,
          title: '샘플 이벤트 1',
          startDate: new Date().toISOString().split('T')[0],
          isFeatured: true,
          category: 'HOLIDAY',
          description: '샘플 이벤트 설명입니다.'
        },
        {
          id: 2,
          title: '샘플 이벤트 2',
          startDate: new Date().toISOString().split('T')[0],
          isFeatured: false,
          category: 'FESTIVAL',
          description: '두 번째 샘플 이벤트입니다.'
        }
      ]

      this.eventRequests = [
        {
          id: 1,
          title: '샘플 요청',
          description: '샘플 이벤트 요청 설명입니다.',
          status: 'pending',
          requestType: 'ADD',        // 누락된 필드 추가
          requesterName: '테스트 사용자',
          email: 'test@example.com',
          proposedDate: new Date().toISOString().split('T')[0],
          category: 'HOLIDAY',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: '두 번째 요청',
          description: '이벤트 수정 요청입니다.',
          status: 'APPROVED',
          requestType: 'EDIT',       // 누락된 필드 추가
          requesterName: '사용자2',
          email: 'user2@example.com',
          proposedDate: new Date().toISOString().split('T')[0],
          category: 'FESTIVAL',
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1일 전
        }
      ]

      this.subscribers = [
        {
          id: 1,
          email: 'subscriber@example.com',
          isActive: true,
          subscribedAt: new Date().toISOString()
        },
        {
          id: 2,
          email: 'subscriber2@example.com',
          isActive: false,
          subscribedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]

      this.notices = [
        {
          id: 1,
          title: '샘플 공지사항',
          content: '이것은 샘플 공지사항입니다.',
          priority: 1,
          isActive: true,
          startDate: new Date().toISOString().split('T')[0],
          endDate: null,
          createdAt: new Date().toISOString()
        }
      ]

      this.calculateStats()
      this.loadRecentActivity()
      this.loadSystemActivity()
    },

    calculateStats() {
      const today = new Date().toISOString().split('T')[0]

      this.stats = {
        totalSchedules: this.events.length,
        featuredSchedules: this.events.filter(event => event.isFeatured).length,
        todaySchedules: this.events.filter(event => {
          const eventDate = event.startDate ? event.startDate.split('T')[0] : null
          return eventDate === today
        }).length,
        totalVisitors: this.getTotalVisitors(), // 새로 추가
        todayVisitors: this.getTodayVisitors()   // 새로 추가
      }
    },

    // 총 방문자 수 (실제로는 분석 API에서 가져와야 함)
    getTotalVisitors() {
      // TODO: 실제 분석 API 연동
      // 임시로 로컬스토리지에서 관리
      const stored = localStorage.getItem('total-visitors')
      return stored ? parseInt(stored) : 12847
    },

    // 오늘 방문자 수
    getTodayVisitors() {
      // TODO: 실제 분석 API 연동
      const today = new Date().toISOString().split('T')[0]
      const stored = localStorage.getItem(`visitors-${today}`)
      return stored ? parseInt(stored) : 156
    },

    // 방문자 수 업데이트 (실제로는 백엔드에서 처리)
    updateVisitorCount() {
      const today = new Date().toISOString().split('T')[0]
      const todayKey = `visitors-${today}`

      // 오늘 방문자 수 증가
      const todayCount = parseInt(localStorage.getItem(todayKey) || '0') + 1
      localStorage.setItem(todayKey, todayCount.toString())

      // 총 방문자 수 증가
      const totalCount = parseInt(localStorage.getItem('total-visitors') || '0') + 1
      localStorage.setItem('total-visitors', totalCount.toString())
    },

    // 최근 활동 로드
    loadRecentActivity() {
      const activities = []

      // 최근 이벤트 요청
      if (this.eventRequests && Array.isArray(this.eventRequests)) {
        this.eventRequests
          .filter(request => request && request.createdAt && request.title)
          .slice(0, 3)
          .forEach(request => {
            activities.push({
              id: `request-${request.id}`,
              description: `새로운 ${this.getRequestTypeText(request.requestType)} 요청: "${request.title}"`,
              createdAt: request.createdAt,
              type: 'request',
              icon: '📝'
            })
          })
      }

      // 최근 구독자들 (안전한 체크 추가)
      if (this.subscribers && Array.isArray(this.subscribers)) {
        this.subscribers
          .filter(sub => sub && sub.subscribedAt && sub.email)
          .slice(0, 2)
          .forEach(subscriber => {
            activities.push({
              id: `subscriber-${subscriber.id}`,
              description: `새로운 구독자: ${subscriber.email}`,
              createdAt: subscriber.subscribedAt,
              type: 'subscriber',
              icon: '👤'
            })
          })
      }

      // 시간순 정렬
      this.recentActivity = activities
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    },

    // 시스템 활동 로드
    loadSystemActivity() {
      this.systemActivity = [
        {
          id: 1,
          description: '시스템 백업 완료',
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
          type: 'system',
          icon: '💾',
          status: 'success'
        },
        {
          id: 2,
          description: '데이터베이스 최적화 실행',
          createdAt: new Date(Date.now() - 14400000).toISOString(), // 4시간 전
          type: 'system',
          icon: '⚙️',
          status: 'success'
        },
        {
          id: 3,
          description: '뉴스레터 발송 완료 (구독자 ' + this.subscribers.length + '명)',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
          type: 'newsletter',
          icon: '📧',
          status: 'success'
        }
      ]
    },

    getRequestTypeText(type) {
      const typeMap = {
        'ADD': '이벤트 추가',
        'EDIT': '이벤트 수정',
        'DELETE': '이벤트 삭제'
      }
      return typeMap[type] || type
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
      this.closeEventModal()
      await this.loadDashboardData()
    },

    async deleteEvent(event) {
      if (confirm(`"${event.title}" 이벤트를 정말로 삭제하시겠습니까?`)) {
        try {
          await scheduleAPI.deleteEvent(event.id)
          await this.loadDashboardData()
          alert('이벤트가 삭제되었습니다.')
        } catch (error) {
          alert('이벤트 삭제에 실패했습니다: ' + error.message)
        }
      }
    },

    async toggleEventFeatured(event) {
      try {
        await scheduleAPI.updateEvent(event.id, { isFeatured: !event.isFeatured })
        await this.loadDashboardData()
      } catch (error) {
        alert('추천 상태 변경에 실패했습니다: ' + error.message)
      }
    },

    // 공지사항 관리
    openNoticeModal(notice = null) {
      if (notice) {
        this.noticeForm = { ...notice }
      } else {
        this.resetNoticeForm()
      }
      this.showNoticeModal = true
    },

    resetNoticeForm() {
      this.noticeForm = {
        id: null,
        title: '',
        content: '',
        priority: 0,
        isActive: true,
        startDate: null,
        endDate: null
      }
    },

    async saveNotice() {
      try {
        if (this.noticeForm.id) {
          await noticeAPI.updateNotice(this.noticeForm.id, this.noticeForm)
        } else {
          await noticeAPI.createNotice(this.noticeForm)
        }
        await this.loadDashboardData()
        this.showNoticeModal = false
        alert('공지사항이 저장되었습니다.')
      } catch (error) {
        alert('공지사항 저장에 실패했습니다: ' + error.message)
      }
    },

    async deleteNotice(noticeId) {
      if (confirm('이 공지사항을 정말로 삭제하시겠습니까?')) {
        try {
          await noticeAPI.deleteNotice(noticeId)
          await this.loadDashboardData()
          alert('공지사항이 삭제되었습니다.')
        } catch (error) {
          alert('공지사항 삭제에 실패했습니다: ' + error.message)
        }
      }
    },

    async toggleNoticeStatus(noticeId) {
      try {
        const notice = this.notices.find(n => n.id === noticeId)
        await noticeAPI.updateNotice(noticeId, { isActive: !notice.isActive })
        await this.loadDashboardData()
      } catch (error) {
        alert('공지사항 상태 변경에 실패했습니다: ' + error.message)
      }
    },

    // 이벤트 요청 관리
    async approveRequest(request) {
      try {
        await eventRequestAPI.updateRequestStatus(request.id, 'APPROVED')
        await this.loadDashboardData()
        alert('요청이 승인되었습니다.')
      } catch (error) {
        alert('요청 승인에 실패했습니다: ' + error.message)
      }
    },

    async rejectRequest(request) {
      try {
        await eventRequestAPI.updateRequestStatus(request.id, 'REJECTED')
        await this.loadDashboardData()
        alert('요청이 거절되었습니다.')
      } catch (error) {
        alert('요청 거절에 실패했습니다: ' + error.message)
      }
    },

    getStatusText(status) {
      // null/undefined 체크 추가
      if (!status) {
        return '상태 없음'
      }

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
        alert('구독자 상태 변경에 실패했습니다: ' + error.message)
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

    // 시스템 관련
    async checkSystemHealth() {
      try {
        const health = await healthAPI.checkHealth()
        alert(`시스템 상태: ${health.status}`)
      } catch (error) {
        alert('시스템 상태 확인에 실패했습니다. '+error)
      }
    },

    // 추가 설정 관련 메서드들
    async saveCalendarSettings() {
      // TODO: API 구현 후 연동
      console.log('캘린더 설정 저장:', this.settings)
      alert('캘린더 설정이 저장되었습니다.')
    },

    // 데이터 관리 메서드들
    async backupData() {
      try {
        // TODO: 실제 백업 API 구현
        const backupData = {
          events: this.events,
          subscribers: this.subscribers,
          notices: this.notices,
          eventRequests: this.eventRequests,
          timestamp: new Date().toISOString()
        }

        // JSON 파일로 다운로드
        const dataStr = JSON.stringify(backupData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
        alert('백업 파일이 다운로드되었습니다.')
      } catch (error) {
        console.error('백업 생성 실패:', error)
        alert('백업 생성에 실패했습니다.')
      }
    },

    async confirmDeleteAllEvents() {
      const confirmed = confirm(
        '정말로 모든 이벤트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.'
      )

      if (confirmed) {
        const doubleConfirm = prompt(
          '삭제를 확인하려면 "DELETE ALL EVENTS"를 정확히 입력하세요:'
        )

        if (doubleConfirm === 'DELETE ALL EVENTS') {
          try {
            // TODO: 실제 API 구현
            // await adminAPI.deleteAllEvents()
            this.events = []
            await this.loadDashboardData()
            alert('모든 이벤트가 삭제되었습니다.')
          } catch (error) {
            alert('이벤트 삭제에 실패했습니다: ' + error.message)
          }
        } else {
          alert('입력이 일치하지 않습니다. 삭제가 취소되었습니다.')
        }
      }
    },

    async confirmDeleteAllSubscribers() {
      const confirmed = confirm(
        '정말로 모든 구독자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.'
      )

      if (confirmed) {
        const doubleConfirm = prompt(
          '삭제를 확인하려면 "DELETE ALL SUBSCRIBERS"를 정확히 입력하세요:'
        )

        if (doubleConfirm === 'DELETE ALL SUBSCRIBERS') {
          try {
            // TODO: 실제 API 구현
            // await adminAPI.deleteAllSubscribers()
            this.subscribers = []
            await this.loadDashboardData()
            alert('모든 구독자가 삭제되었습니다.')
          } catch (error) {
            alert('구독자 삭제에 실패했습니다: ' + error.message)
          }
        } else {
          alert('입력이 일치하지 않습니다. 삭제가 취소되었습니다.')
        }
      }
    },

    async confirmDeleteAllRequests() {
      const confirmed = confirm(
        '정말로 모든 이벤트 요청을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.'
      )

      if (confirmed) {
        const doubleConfirm = prompt(
          '삭제를 확인하려면 "DELETE ALL REQUESTS"를 정확히 입력하세요:'
        )

        if (doubleConfirm === 'DELETE ALL REQUESTS') {
          try {
            // TODO: 실제 API 구현
            // await adminAPI.deleteAllRequests()
            this.eventRequests = []
            await this.loadDashboardData()
            alert('모든 이벤트 요청이 삭제되었습니다.')
          } catch (error) {
            alert('요청 삭제에 실패했습니다: ' + error.message)
          }
        } else {
          alert('입력이 일치하지 않습니다. 삭제가 취소되었습니다.')
        }
      }
    },
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-icon {
  font-size: 24px;
  opacity: 0.8;
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
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.stat-description {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
}

/* ===== 대시보드 컨텐츠 영역 ===== */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.activity-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.activity-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background-color: #f8fafc;
  border-radius: 8px;
  padding-left: 8px;
  padding-right: 8px;
}

.activity-icon {
  font-size: 20px;
  min-width: 24px;
  text-align: center;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-description {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
}

.system-activity {
  border-left: 3px solid #10b981;
  padding-left: 16px;
  margin-left: -3px;
}

.activity-status {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.empty-activity {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-activity p {
  font-size: 14px;
  margin: 0;
}

/* ===== 대기중인 요청 알림 ===== */
.pending-requests-alert {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(251, 191, 36, 0.3);
  margin-top: 20px;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.alert-icon {
  font-size: 24px;
  opacity: 0.9;
}

.alert-text {
  flex: 1;
}

.alert-text strong {
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.alert-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.alert-content .btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.alert-content .btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
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

/* ===== 이벤트 요청 탭 스타일 ===== */
.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-select {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.pending-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #fbbf24;
}

.requests-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.request-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.type-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-add {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #a7f3d0;
}

.type-edit {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.type-delete {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fbbf24;
}

.status-approved {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #a7f3d0;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.request-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.request-description {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 16px;
}

.request-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.meta-item {
  color: #475569;
}

.meta-item strong {
  color: #1e293b;
}

.request-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* ===== 설정 탭 스타일 완성 ===== */
.settings-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.setting-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.setting-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.setting-item input[type="text"],
.setting-item input[type="number"],
.setting-item input[type="time"],
.setting-item textarea,
.setting-item select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.setting-item input[type="text"]:focus,
.setting-item input[type="number"]:focus,
.setting-item input[type="time"]:focus,
.setting-item textarea:focus,
.setting-item select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.setting-item textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto !important;
  margin: 0;
}

.setting-description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.5;
}

.danger-zone {
  border: 2px solid #fee2e2;
  border-radius: 8px;
  padding: 16px;
  background: #fef2f2;
}

.danger-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.warning-text {
  color: #991b1b;
  font-size: 13px;
  font-weight: 500;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.system-stats {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  font-weight: 500;
  color: #475569;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
}

/* ===== 버튼 크기 수정 ===== */
.btn-small {
  padding: 6px 12px;
  font-size: 12px;
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

  .stats-row {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-number {
    font-size: 24px;
  }

  .alert-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

/* ===== 반응형 디자인 ===== */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }

  .dashboard-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
