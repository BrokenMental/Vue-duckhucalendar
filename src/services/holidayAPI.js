// apiClient에서 통합된 클라이언트 가져오기
import { apiClient } from './apiClient.js'

/**
 * 공휴일 API 서비스 (공공데이터 연동)
 */
export const holidayAPI = {
  // 캐시 저장소
  cache: new Map(),
  cacheTimeout: 1000 * 60 * 30, // 30분 캐시

  /**
   * 날짜 범위별 공휴일 조회
   * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
   * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
   * @param {string} countryCode - 국가 코드 (기본값: KR)
   */
  async getHolidaysByDateRange(startDate, endDate, countryCode = 'KR') {
    const cacheKey = `holidays-range-${startDate}-${endDate}-${countryCode}`

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📋 공휴일 캐시에서 로딩: ${startDate} ~ ${endDate}`)
        return cached.data
      }
      this.cache.delete(cacheKey)
    }

    try {
      console.log(`🌐 공휴일 API 호출: ${startDate} ~ ${endDate}`)

      const response = await apiClient.get('/holidays/range', {
        params: {
          startDate,
          endDate,
          countryCode
        }
      })

      // 캐시에 저장
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })

      console.log(`✅ 공휴일 ${response.data.count}개 조회 완료`)
      return response.data

    } catch (error) {
      console.error('공휴일 조회 실패:', error)

      // 백엔드 실패 시 기본 공휴일 반환
      const defaultHolidays = this.getDefaultKoreanHolidaysForRange(startDate, endDate)
      console.log('📅 기본 공휴일 데이터 사용')
      return defaultHolidays
    }
  },

  /**
   * 특정 연도의 모든 공휴일 조회
   * @param {number} year - 연도
   * @param {string} countryCode - 국가 코드
   */
  async getHolidaysByYear(year, countryCode = 'KR') {
    const cacheKey = `holidays-year-${year}-${countryCode}`

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📋 ${year}년 공휴일 캐시에서 로딩`)
        return cached.data
      }
      this.cache.delete(cacheKey)
    }

    try {
      console.log(`🌐 ${year}년 공휴일 API 호출`)

      const response = await apiClient.get(`/holidays/year/${year}`, {
        params: { countryCode }
      })

      // 캐시에 저장
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })

      console.log(`✅ ${year}년 공휴일 ${response.data.count}개 조회 완료`)
      return response.data

    } catch (error) {
      console.error(`${year}년 공휴일 조회 실패:`, error)

      // 백엔드 실패 시 기본 공휴일 반환
      const defaultHolidays = this.getDefaultKoreanHolidays(year)
      console.log(`📅 ${year}년 기본 공휴일 데이터 사용`)
      return defaultHolidays
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
   * 공휴일 추가 (관리자용)
   * @param {Object} holidayData - 공휴일 데이터
   */
  async createHoliday(holidayData) {
    try {
      const response = await apiClient.post('/holidays', holidayData)

      // 캐시 무효화
      this.clearAllCache()

      return response.data
    } catch (error) {
      console.error('공휴일 추가 실패:', error)

      if (error.response?.status === 409) {
        throw new Error('이미 존재하는 공휴일입니다.')
      }

      throw new Error('공휴일 추가에 실패했습니다.')
    }
  },

  /**
   * 공휴일 수정 (관리자용)
   * @param {number} id - 공휴일 ID
   * @param {Object} holidayData - 수정할 데이터
   */
  async updateHoliday(id, holidayData) {
    try {
      const response = await apiClient.put(`/holidays/${id}`, holidayData)

      // 캐시 무효화
      this.clearAllCache()

      return response.data
    } catch (error) {
      console.error('공휴일 수정 실패:', error)

      if (error.response?.status === 404) {
        throw new Error('존재하지 않는 공휴일입니다.')
      }

      throw new Error('공휴일 수정에 실패했습니다.')
    }
  },

  /**
   * 공휴일 삭제 (관리자용)
   * @param {number} id - 공휴일 ID
   */
  async deleteHoliday(id) {
    try {
      await apiClient.delete(`/holidays/${id}`)

      // 캐시 무효화
      this.clearAllCache()

    } catch (error) {
      console.error('공휴일 삭제 실패:', error)

      if (error.response?.status === 404) {
        throw new Error('존재하지 않는 공휴일입니다.')
      }

      throw new Error('공휴일 삭제에 실패했습니다.')
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
   * 공휴일 통계 조회 (관리자용)
   * @param {number} year - 연도
   */
  async getHolidayStatistics(year) {
    try {
      const response = await apiClient.get(`/admin/holidays/stats/${year}`)
      return response.data.data || response.data
    } catch (error) {
      console.error('공휴일 통계 조회 실패:', error)
      return {
        year: year,
        totalCount: 0,
        typeStatistics: {},
        monthStatistics: {}
      }
    }
  },

  /**
   * 공공데이터 API 연결 테스트 (관리자용)
   * @param {number} year - 테스트할 연도
   */
  async testPublicApiConnection(year = new Date().getFullYear()) {
    try {
      const response = await apiClient.get(`/admin/holidays/test-connection/${year}`)
      return response.data
    } catch (error) {
      console.error('공공데이터 API 연결 테스트 실패:', error)
      throw new Error(`API 연결 테스트 실패: ${error.response?.data?.message || error.message}`)
    }
  },

  /**
   * 기본 한국 공휴일 반환 (백엔드 실패시 사용)
   * @param {number} year - 연도
   */
  getDefaultKoreanHolidays(year) {
    const defaultHolidays = [
      { name: '신정', month: 1, day: 1, description: '새해 첫날' },
      { name: '삼일절', month: 3, day: 1, description: '3·1운동 기념일' },
      { name: '어린이날', month: 5, day: 5, description: '어린이날' },
      { name: '현충일', month: 6, day: 6, description: '호국영령 추념일' },
      { name: '광복절', month: 8, day: 15, description: '일제강점기 해방 기념일' },
      { name: '개천절', month: 10, day: 3, description: '단군왕검 건국 기념일' },
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
   * 날짜 범위에 대한 기본 한국 공휴일 반환
   * @param {string} startDate - 시작 날짜
   * @param {string} endDate - 종료 날짜
   */
  getDefaultKoreanHolidaysForRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const years = []

    // 해당 범위의 모든 연도 추출
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      years.push(year)
    }

    const allHolidays = []
    years.forEach(year => {
      const yearHolidays = this.getDefaultKoreanHolidays(year)
      allHolidays.push(...yearHolidays.holidays)
    })

    // 날짜 범위에 맞는 공휴일만 필터링
    const filteredHolidays = allHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.holidayDate)
      return holidayDate >= start && holidayDate <= end
    })

    return {
      startDate: startDate,
      endDate: endDate,
      holidays: filteredHolidays,
      count: filteredHolidays.length
    }
  },

  /**
   * 모든 캐시 클리어
   */
  clearAllCache() {
    this.cache.clear()
    console.log('🗑️ 공휴일 캐시 모두 삭제됨')
  },

  /**
   * 특정 캐시 키 삭제
   * @param {string} key - 캐시 키
   */
  clearCache(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
      console.log(`🗑️ 캐시 삭제: ${key}`)
    }
  },

  /**
   * 캐시 상태 확인
   */
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    }
  },

  /**
   * 공공데이터 API와 동기화 (누락된 메서드 추가)
   * @param {number} year - 동기화할 연도
   */
  async syncHolidaysFromPublicAPI(year) {
    try {
      const response = await apiClient.post(`/admin/holidays/sync/${year}`)

      // 캐시 무효화
      this.clearAllCache()

      return response.data
    } catch (error) {
      console.error(`${year}년 공휴일 동기화 실패:`, error)
      throw new Error(`${year}년 공휴일 동기화에 실패했습니다.`)
    }
  },

  /**
   * 폴백 공휴일 데이터 반환 (누락된 메서드 추가)
   * @param {string} startDate - 시작 날짜
   * @param {string} endDate - 종료 날짜
   */
  getFallbackHolidays(startDate, endDate) {
    return this.getDefaultKoreanHolidaysForRange(startDate, endDate)
  }
}

/**
 * 공휴일 유틸리티 함수들
 */
export const holidayUtils = {
  /**
   * 공휴일 타입별 우선순위 반환
   * @param {string} holidayType - 공휴일 타입
   */
  getHolidayPriority(holidayType) {
    const priorities = {
      'NATIONAL': 1,    // 국경일
      'PUBLIC': 2,      // 공휴일
      'SUBSTITUTE': 3,  // 대체공휴일
      'MEMORIAL': 4,    // 기념일
      'ANNIVERSARY': 5  // 기타 기념일
    }
    return priorities[holidayType] || 99
  },

  /**
   * 공휴일을 날짜별로 그룹화
   * @param {Array} holidays - 공휴일 배열
   */
  groupHolidaysByDate(holidays) {
    const grouped = {}

    // 배열이 아니거나 비어있으면 빈 객체 반환
    if (!Array.isArray(holidays) || holidays.length === 0) {
      console.warn('공휴일 데이터가 배열이 아니거나 비어있습니다:', holidays)
      return grouped
    }

    holidays.forEach(holiday => {
      if (!holiday || !holiday.holidayDate) {
        console.warn('잘못된 공휴일 데이터:', holiday)
        return
      }

      const date = holiday.holidayDate

      if (!grouped[date]) {
        grouped[date] = []
      }

      grouped[date].push(holiday)
    })

    // 각 날짜별로 우선순위 정렬 (국경일 우선)
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const priorityA = this.getHolidayPriority(a.holidayType)
        const priorityB = this.getHolidayPriority(b.holidayType)
        return priorityA - priorityB
      })
    })

    return grouped
  },

  /**
   * 요일 타입 반환 (일요일/토요일/평일)
   * @param {Date} date - 날짜 객체
   */
  getDayType(date) {
    const dayOfWeek = date.getDay()

    if (dayOfWeek === 0) return 'sunday'    // 일요일
    if (dayOfWeek === 6) return 'saturday'  // 토요일
    return 'weekday'                        // 평일
  },

  /**
   * 공휴일 데이터 유효성 검사
   * @param {Object} holidayData - 공휴일 데이터
   */
  validateHolidayData(holidayData) {
    const errors = []

    if (!holidayData.name || holidayData.name.trim() === '') {
      errors.push('공휴일 이름은 필수입니다.')
    }

    if (!holidayData.holidayDate) {
      errors.push('공휴일 날짜는 필수입니다.')
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayData.holidayDate)) {
      errors.push('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)')
    }

    const validTypes = ['NATIONAL', 'PUBLIC', 'SUBSTITUTE', 'MEMORIAL', 'ANNIVERSARY']
    if (!holidayData.holidayType || !validTypes.includes(holidayData.holidayType)) {
      errors.push('올바른 공휴일 타입을 선택해주세요.')
    }

    if (holidayData.color && !/^#[0-9A-Fa-f]{6}$/.test(holidayData.color)) {
      errors.push('색상 코드 형식이 올바르지 않습니다.')
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    }
  },

  /**
   * 공휴일 타입별 한글 이름 반환
   * @param {string} holidayType - 공휴일 타입
   */
  getHolidayTypeName(holidayType) {
    if (!holidayType) {
      return '기타';
    }

    const typeNames = {
      'NATIONAL': '국경일',
      'PUBLIC': '공휴일',
      'SUBSTITUTE': '대체공휴일',
      'MEMORIAL': '기념일',
      'ANNIVERSARY': '기타'
    };

    return typeNames[holidayType] || '기타';
  },
}

export default holidayAPI
