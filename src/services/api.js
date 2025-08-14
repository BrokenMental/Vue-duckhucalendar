// apiClient에서 통합된 클라이언트 가져오기
import { apiClient } from './apiClient.js'

/**
 * 공휴일 관련 API (기존 api.js에서 통합된 holidayAPI)
 */
export const holidayAPI = {

  /**
   * 특정 연도의 모든 공휴일 조회
   * @param {number} year - 연도
   */
  async getHolidaysByYear(year) {
    try {
      const response = await apiClient.get(`/holidays/year/${year}`)
      return response.data
    } catch (error) {
      console.error('백엔드 공휴일 조회 실패:', error)
      // 실패 시 기본 한국 공휴일 반환
      return this.getDefaultKoreanHolidays(year)
    }
  },

  /**
   * 특정 날짜의 공휴일 조회
   * @param {string} date - 날짜 (YYYY-MM-DD 형식)
   */
  async getHolidaysByDate(date) {
    try {
      const response = await apiClient.get(`/holidays/date/${date}`)
      return response.data
    } catch (error) {
      console.error('날짜별 공휴일 조회 실패:', error)
      return {
        date: date,
        holidays: [],
        count: 0,
        isHoliday: false
      }
    }
  },

  /**
   * 특정 월의 공휴일 조회
   * @param {number} year - 연도
   * @param {number} month - 월 (1-12)
   */
  async getHolidaysByMonth(year, month) {
    try {
      const response = await apiClient.get(`/holidays/month/${year}/${month}`)
      return response.data
    } catch (error) {
      console.error('월별 공휴일 조회 실패:', error)
      return {
        year: year,
        month: month,
        holidays: [],
        count: 0
      }
    }
  },

  /**
   * 오늘의 공휴일 조회
   */
  async getTodayHolidays() {
    try {
      const response = await apiClient.get('/holidays/today')
      return response.data
    } catch (error) {
      console.error('오늘 공휴일 조회 실패:', error)
      return {
        date: new Date().toISOString().split('T')[0],
        holidays: [],
        count: 0,
        isHoliday: false
      }
    }
  },

  /**
   * API 실패 시 기본 한국 공휴일 반환
   * @param {number} year - 연도
   */
  getDefaultKoreanHolidays(year) {
    const defaultHolidays = [
      { name: '신정', month: 1, day: 1, description: '새해 첫날' },
      { name: '삼일절', month: 3, day: 1, description: '3·1운동 기념일' },
      { name: '어린이날', month: 5, day: 5, description: '어린이날' },
      { name: '현충일', month: 6, day: 6, description: '호국영령 추념일' },
      { name: '광복절', month: 8, day: 15, description: '일제강점기 해방 기념일' },
      { name: '개천절', month: 10, day: 3, description: '단군�검 건국 기념일' },
      { name: '한글날', month: 10, day: 9, description: '한글 창제 기념일' },
      { name: '크리스마스', month: 12, day: 25, description: '성탄절' }
    ]

    const holidays = defaultHolidays.map(holiday => ({
      id: `default-${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`,
      name: holiday.name,
      holidayDate: `${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`,
      countryCode: 'KR',
      holidayType: 'PUBLIC',
      description: holiday.description,
      isRecurring: true,
      color: '#FF6B6B'
    }))

    return {
      year: year,
      holidays: holidays,
      count: holidays.length
    }
  },

  /**
   * 캐시를 사용한 공휴일 조회 (성능 최적화)
   */
  holidayCache: new Map(),

  async getHolidaysByYearCached(year) {
    const cacheKey = `holidays-${year}`

    if (this.holidayCache.has(cacheKey)) {
      console.log(`📋 ${year}년 공휴일 캐시에서 로딩`)
      return this.holidayCache.get(cacheKey)
    }

    try {
      const holidays = await this.getHolidaysByYear(year)
      this.holidayCache.set(cacheKey, holidays)
      console.log(`🌐 ${year}년 공휴일 백엔드에서 로딩 후 캐시 저장`)
      return holidays
    } catch (error) {
      console.error('캐시된 공휴일 조회 실패:', error)
      return this.getDefaultKoreanHolidays(year)
    }
  }
}

/**
 * 향상된 일정 관련 API 함수들
 */
export const scheduleAPI = {

  /**
   * 모든 일정 조회 (재시도 로직 포함)
   */
  async getAllSchedules(sortBy = 'date') {
    try {
      const response = await apiClient.get('/schedules', {
        params: { sortBy }
      })
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 특정 일정 조회
   * @param {number} id - 일정 ID
   */
  async getScheduleById(id) {
    try {
      const response = await apiClient.get(`/schedules/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 정보를 불러오는데 실패했습니다.')
    }
  },

  /**
   * 새 일정 추가 (관리자 전용)
   * @param {Object} scheduleData - 일정 데이터
   */
  async createSchedule(scheduleData) {
    try {
      const response = await apiClient.post('/schedules', scheduleData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 추가에 실패했습니다.')
    }
  },

  /**
   * 일정 수정 (관리자 전용)
   * @param {number} id - 일정 ID
   * @param {Object} scheduleData - 수정할 일정 데이터
   */
  async updateSchedule(id, scheduleData) {
    try {
      const response = await apiClient.put(`/schedules/${id}`, scheduleData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 수정에 실패했습니다.')
    }
  },

  /**
   * 일정 삭제 (관리자 전용)
   * @param {number} id - 일정 ID
   */
  async deleteSchedule(id) {
    try {
      const response = await apiClient.delete(`/schedules/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 삭제에 실패했습니다.')
    }
  },

  /**
   * 특정 날짜의 일정 조회
   * @param {string} date - 날짜 (YYYY-MM-DD 형식)
   */
  async getSchedulesByDate(date) {
    try {
      const response = await apiClient.get(`/schedules/date/${date}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '해당 날짜의 일정을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 특정 월의 일정 조회
   * @param {string} year - 연도
   * @param {string} month - 월
   */
  async getSchedulesByMonth(year, month) {
    try {
      console.log(`📅 ${year}년 ${month}월 일정 조회 중...`);

      // PathVariable 방식 사용
      const response = await apiClient.get(`/schedules/month/${year}/${month}`);

      console.log(`✅ ${year}년 ${month}월 일정 ${response.data.count}개 조회 완료`);
      return response.data;

    } catch (error) {
      console.error('❌ 월별 일정 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 날짜 범위로 일정 조회
   * @param {Object} params - 파라미터 객체
   * @param {string} params.startDate - 시작 날짜 (YYYY-MM-DD)
   * @param {string} params.endDate - 종료 날짜 (YYYY-MM-DD)
   */
  async getSchedulesByDateRange(params) {
    try {
      console.log('API 호출 파라미터:', params) // 디버깅용

      const response = await apiClient.get('/schedules/range', {
        params: {
          start: params.startDate,
          end: params.endDate
        }
      })
      return response.data
    } catch (error) {
      console.error('날짜 범위 일정 조회 실패:', error)
      throw new Error(error.userMessage || '일정을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 다가오는 일정 조회
   * @param {number} days - 며칠 후까지 조회할지
   */
  async getUpcomingSchedules(days = 7) {
    try {
      const response = await apiClient.get(`/schedules/upcoming?days=${days}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '다가오는 일정을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 추천 이벤트 목록 조회
   * @param {number} limit - 최대 개수
   */
  async getFeaturedSchedules(limit = 10) {
    try {
      const response = await apiClient.get(`/schedules/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.userMessage || '추천 이벤트를 불러오는데 실패했습니다.');
    }
  },

  /**
   * 오늘의 일정 조회
   */
  async getTodaySchedules() {
    try {
      const response = await apiClient.get('/schedules/today')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '오늘 일정을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 일정 검색
   * @param {string} title - 검색할 제목
   */
  async searchSchedules(title) {
    try {
      const response = await apiClient.get(`/schedules/search?title=${encodeURIComponent(title)}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 검색에 실패했습니다.')
    }
  },

  /**
   * 일정 통계 조회 (관리자용)
   */
  async getScheduleStats() {
    try {
      const response = await apiClient.get('/schedules/stats')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 통계를 불러오는데 실패했습니다.')
    }
  },

  /**
   * 최근 추가된 일정 조회
   * @param {number} limit - 최대 개수
   */
  async getRecentSchedules(limit = 10) {
    try {
      const response = await apiClient.get(`/schedules/recent?limit=${limit}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '최근 일정을 불러오는데 실패했습니다.')
    }
  }
}

/**
 * 이메일 구독 관련 API
 */
export const emailSubscriptionAPI = {

  /**
   * 이메일 구독 등록
   * @param {Object} subscriptionData - 구독 정보
   * @param {string} subscriptionData.email - 이메일 주소
   * @param {string} subscriptionData.name - 구독자 이름
   * @param {Array} subscriptionData.preferences - 구독 설정
   */
  async subscribe(subscriptionData) {
    try {
      const response = await apiClient.post('/email-subscriptions', subscriptionData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이메일 구독 등록에 실패했습니다.')
    }
  },

  /**
   * 구독 확인 (이메일 토큰 인증)
   * @param {string} token - 인증 토큰
   */
  async confirmSubscription(token) {
    try {
      const response = await apiClient.post(`/email-subscriptions/confirm/${token}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '구독 확인에 실패했습니다.')
    }
  },

  /**
   * 이메일 구독 해지
   * @param {string} token - 구독 해지 토큰
   */
  async unsubscribe(token) {
    try {
      const response = await apiClient.post(`/email-subscriptions/unsubscribe/${token}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '구독 해지에 실패했습니다.')
    }
  },

  /**
   * 구독자 목록 조회 (관리자 전용)
   */
  async getSubscribers() {
    try {
      const response = await apiClient.get('/email-subscriptions/admin')
      return response.data
    } catch (error) {
      console.warn('구독자 API 호출 실패:', error)
      return { subscribers: [] }
    }
  },

  /**
   * 구독자 삭제 (관리자 전용)
   * @param {number} subscriberId - 구독자 ID
   */
  async deleteSubscriber(subscriberId) {
    try {
      const response = await apiClient.delete(`/email-subscriptions/${subscriberId}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '구독자 삭제에 실패했습니다.')
    }
  },

  /**
   * 구독 상태 변경 (관리자 전용)
   * @param {number} subscriberId - 구독자 ID
   * @param {boolean} isActive - 활성화 상태
   */
  async updateSubscriberStatus(id, isActive) {
    try {
      const response = await apiClient.patch(`/email-subscriptions/${id}/status`, {
        isActive
      })
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '구독자 상태 변경에 실패했습니다.')
    }
  },

  /**
   * 활성 구독자 목록 조회 (관리자 전용)
   */
  async getActiveSubscribers() {
    try {
      const response = await apiClient.get('/email-subscriptions/active')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '활성 구독자 목록을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 구독자 통계 조회 (관리자 전용)
   */
  async getSubscriptionStats() {
    try {
      const response = await apiClient.get('/email-subscriptions/stats')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '구독자 통계를 불러오는데 실패했습니다.')
    }
  }
}

/**
 * 관리자 인증 관련 API
 */
export const adminAPI = {
  /**
   * 임시 비밀번호 요청
   */
  async requestTempPassword(email) {
    try {
      const response = await apiClient.post('/admin/request-temp-password', { email })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '임시 비밀번호 요청에 실패했습니다.')
    }
  },

  /**
   * 관리자 로그인
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/admin/login', {
        email,
        tempPassword: password
      })

      // 토큰을 세션 스토리지에 저장
      if (response.data.token) {
        sessionStorage.setItem('admin-token', response.data.token)
        console.log('✅ 토큰 저장 완료')
      }

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '로그인에 실패했습니다.')
    }
  },

  /**
   * 토큰 검증
   */
  async checkAuth() {
    const token = sessionStorage.getItem('admin-token')
    if (!token) {
      throw new Error('토큰이 없습니다.')
    }

    try {
      const response = await apiClient.get('/admin/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      // 401 에러면 토큰 삭제
      if (error.response?.status === 401) {
        sessionStorage.removeItem('admin-token')
      }
      throw new Error('토큰 검증에 실패했습니다.')
    }
  },

  /**
   * 관리자 로그아웃
   */
  async logout() {
    try {
      // 서버에 로그아웃 요청 (선택사항)
      await apiClient.post('/admin/logout')
    } catch (error) {
      console.warn('로그아웃 API 호출 실패:', error)
    } finally {
      // 토큰 제거
      sessionStorage.removeItem('admin-token')
      console.log('✅ 로그아웃 완료')
    }
  }
}

/**
 * 파일 업로드 관련 API
 */
export const fileAPI = {

  /**
   * 이미지 파일 업로드
   * @param {File} file - 업로드할 파일
   * @param {Function} onProgress - 진행률 콜백
   */
  async uploadImage(file, onProgress = null) {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }

      // 진행률 콜백이 있으면 설정
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      }

      const response = await apiClient.post('/files/upload/image', formData, config)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이미지 업로드에 실패했습니다.')
    }
  },

  /**
   * 여러 이미지 파일 업로드
   * @param {FileList} files - 업로드할 파일들
   * @param {Function} onProgress - 진행률 콜백
   */
  async uploadMultipleImages(files, onProgress = null) {
    const uploadPromises = Array.from(files).map(file =>
      this.uploadImage(file, onProgress)
    )

    try {
      const results = await Promise.all(uploadPromises)
      return results
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      throw new Error('일부 이미지 업로드에 실패했습니다.')
    }
  },

  /**
   * 파일 삭제
   * @param {string} fileUrl - 삭제할 파일 URL
   */
  async deleteFile(fileUrl) {
    try {
      const response = await apiClient.delete('/files/delete', {
        data: { fileUrl }
      })
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '파일 삭제에 실패했습니다.')
    }
  }
}

/**
 * 이벤트 요청 관련 API
 */
export const eventRequestAPI = {

  /**
   * 이메일 인증 코드 전송
   * @param {string} email - 이메일 주소
   */
  async sendVerificationCode(email) {
    try {
      const response = await apiClient.post('/event-requests/send-verification', { email })
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '인증 코드 전송에 실패했습니다.')
    }
  },

  /**
   * 이메일 인증
   * @param {string} email - 이메일 주소
   * @param {string} code - 인증 코드
   */
  async verifyEmail(email, code) {
    try {
      const response = await apiClient.post('/event-requests/verify-email', { email, code })
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이메일 인증에 실패했습니다.')
    }
  },

  /**
   * 이벤트 요청 제출
   * @param {Object} requestData - 요청 데이터
   */
  async submitEventRequest(requestData) {
    try {
      const response = await apiClient.post('/event-requests', requestData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이벤트 요청 제출에 실패했습니다.')
    }
  },

  /**
   * 이벤트 요청 목록 조회 (관리자용)
   */
  async getEventRequests() {
    try {
      const response = await apiClient.get('/event-requests/admin/list')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이벤트 요청 목록을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 이벤트 요청 상세 조회 (관리자용)
   * @param {number} id - 요청 ID
   */
  async getEventRequestById(id) {
    try {
      const response = await apiClient.get(`/event-requests/admin/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이벤트 요청을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 이벤트 요청 상태 변경 (관리자용)
   * @param {number} id - 요청 ID
   * @param {string} status - 상태 (pending, approved, rejected)
   */
  async updateRequestStatus(id, status) {
    try {
      const response = await apiClient.patch(`/event-requests/admin/${id}/status`, { status })
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '요청 상태 변경에 실패했습니다.')
    }
  },

  /**
   * 이벤트 요청 삭제 (관리자용)
   * @param {number} id - 요청 ID
   */
  async deleteEventRequest(id) {
    try {
      const response = await apiClient.delete(`/event-requests/admin/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이벤트 요청 삭제에 실패했습니다.')
    }
  },

  /**
   * 이벤트 요청 승인 처리 (관리자용)
   * @param {number} id - 요청 ID
   * @param {Object} scheduleData - 일정 데이터
   */
  async approveEventRequest(id, scheduleData) {
    try {
      const response = await apiClient.post(`/event-requests/admin/${id}/approve`, scheduleData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '이벤트 요청 승인에 실패했습니다.')
    }
  }
}

/**
 * 서버 상태 확인 API
 */
export const healthAPI = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/schedules/health')
      return response.data
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      throw new Error('서버 연결을 확인할 수 없습니다.')
    }
  }
}

/**
 * 유틸리티 함수들
 */
export const apiUtils = {

  /**
   * 관리자 인증 상태 확인
   */
  isAdminAuthenticated() {
    return !!sessionStorage.getItem('admin-token')
  },

  /**
   * API 에러 메시지 추출
   * @param {Error} error - 에러 객체
   */
  getErrorMessage(error) {
    return error.userMessage || error.message || '알 수 없는 오류가 발생했습니다.'
  },

  /**
   * 파일 크기 검증
   * @param {File} file - 파일 객체
   * @param {number} maxSizeMB - 최대 크기 (MB)
   */
  validateFileSize(file, maxSizeMB = 5) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  },

  /**
   * 이미지 파일 타입 검증
   * @param {File} file - 파일 객체
   */
  validateImageType(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    return allowedTypes.includes(file.type)
  },

  /**
   * URL 유효성 검증
   * @param {string} url - 검증할 URL
   */
  validateURL(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

export { noticeAPI } from './noticeAPI.js'
export default apiClient
