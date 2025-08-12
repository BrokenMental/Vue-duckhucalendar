import axios from 'axios'

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VUE_APP_API_URL || 'http://localhost:8080'

// Axios 인스턴스 생성
const holidayAxios = axios.create({
  baseURL: `${API_BASE_URL}/holidays`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 (인증 토큰 등 추가 가능)
holidayAxios.interceptors.request.use(
  (config) => {
    // 필요시 인증 토큰 추가
    // const token = localStorage.getItem('authToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    console.log('공휴일 API 요청:', config.method?.toUpperCase(), config.url, config.params)
    return config
  },
  (error) => {
    console.error('공휴일 API 요청 오류:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터
holidayAxios.interceptors.response.use(
  (response) => {
    console.log('공휴일 API 응답:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('공휴일 API 응답 오류:', error.response?.status, error.response?.data || error.message)
    return Promise.reject(error)
  }
)

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
   * @returns {Promise<Array>} 공휴일 목록
   */
  async getHolidaysByDateRange(startDate, endDate, countryCode = 'KR') {
    const cacheKey = `range-${startDate}-${endDate}-${countryCode}`

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 캐시에서 공휴일 조회:', cacheKey)
        return cached.data
      }
    }

    try {
      const response = await holidayAxios.get('/range', {
        params: {
          start: startDate,
          end: endDate,
          countryCode
        }
      })

      const holidays = response.data.holidays || []

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: holidays,
        timestamp: Date.now()
      })

      console.log(`✅ ${holidays.length}개 공휴일 조회 성공 (${startDate} ~ ${endDate})`)
      return holidays

    } catch (error) {
      console.error('날짜 범위별 공휴일 조회 실패:', error)

      // 에러 시 기본 공휴일 반환
      const fallbackHolidays = this.getFallbackHolidays(startDate, endDate)
      console.warn('기본 공휴일 데이터 사용:', fallbackHolidays.length + '개')

      return fallbackHolidays
    }
  },

  /**
   * 특정 날짜의 공휴일 조회
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @param {string} countryCode - 국가 코드 (기본값: KR)
   * @returns {Promise<Array>} 해당 날짜의 공휴일 목록
   */
  async getHolidaysByDate(date, countryCode = 'KR') {
    try {
      const response = await holidayAxios.get(`/date/${date}`, {
        params: { countryCode }
      })

      return response.data || []
    } catch (error) {
      console.error('특정 날짜 공휴일 조회 실패:', error)
      return []
    }
  },

  /**
   * 연도별 공휴일 조회 (공공데이터 자동 동기화)
   * @param {number} year - 연도
   * @param {string} countryCode - 국가 코드 (기본값: KR)
   * @returns {Promise<Array>} 해당 연도의 공휴일 목록
   */
  async getHolidaysByYear(year, countryCode = 'KR') {
    const cacheKey = `year-${year}-${countryCode}`

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 캐시에서 연도별 공휴일 조회:', year)
        return cached.data
      }
    }

    try {
      const response = await holidayAxios.get(`/year/${year}`, {
        params: { countryCode }
      })

      let holidays = response.data || []

      // 공휴일이 적으면 공공데이터 동기화 시도
      if (holidays.length < 5 && countryCode === 'KR') {
        console.log(`${year}년 공휴일이 부족합니다. 공공데이터 동기화를 시도합니다.`)
        await this.syncHolidaysFromPublicAPI(year)

        // 동기화 후 다시 조회
        const retryResponse = await holidayAxios.get(`/year/${year}`, {
          params: { countryCode }
        })
        holidays = retryResponse.data || holidays
      }

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: holidays,
        timestamp: Date.now()
      })

      console.log(`✅ ${year}년 공휴일 ${holidays.length}개 조회 성공`)
      return holidays

    } catch (error) {
      console.error('연도별 공휴일 조회 실패:', error)

      // 에러 시 기본 공휴일 반환
      const fallbackHolidays = this.getDefaultKoreanHolidays(year)
      console.warn(`${year}년 기본 공휴일 데이터 사용:`, fallbackHolidays.length + '개')

      return fallbackHolidays
    }
  },

  /**
   * 공공데이터 API 동기화 요청
   * @param {number} year - 연도
   */
  async syncHolidaysFromPublicAPI(year) {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/holidays/sync/${year}`)
      console.log(`✅ ${year}년 공공데이터 동기화 성공:`, response.data.message)

      // 캐시 무효화
      this.clearCacheForYear(year)

      return response.data
    } catch (error) {
      console.error(`❌ ${year}년 공공데이터 동기화 실패:`, error)
      throw new Error(`공공데이터 동기화 실패: ${error.response?.data?.message || error.message}`)
    }
  },

  /**
   * 현재 연도 공휴일 동기화
   */
  async syncCurrentYearHolidays() {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/holidays/sync/current`)
      console.log('✅ 현재 연도 공휴일 동기화 성공:', response.data.message)

      // 관련 캐시 무효화
      const currentYear = new Date().getFullYear()
      this.clearCacheForYear(currentYear)
      this.clearCacheForYear(currentYear + 1)

      return response.data
    } catch (error) {
      console.error('❌ 현재 연도 공휴일 동기화 실패:', error)
      throw new Error(`현재 연도 동기화 실패: ${error.response?.data?.message || error.message}`)
    }
  },

  /**
   * 특정 연도 캐시 무효화
   * @param {number} year - 연도
   */
  clearCacheForYear(year) {
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.includes(`year-${year}`) || key.includes(`${year}-`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      console.log('🗑️ 캐시 삭제:', key)
    })
  },

  /**
   * 전체 캐시 무효화
   */
  clearAllCache() {
    this.cache.clear()
    console.log('🗑️ 모든 공휴일 캐시 삭제')
  },

  /**
   * API 실패 시 기본 한국 공휴일 반환
   * @param {number} year - 연도
   */
  getDefaultKoreanHolidays(year) {
    const defaultHolidays = [
      { name: '신정', month: 1, day: 1, type: 'PUBLIC', description: '새해 첫날', color: '#FF6B6B' },
      { name: '삼일절', month: 3, day: 1, type: 'NATIONAL', description: '3·1 독립운동 기념일', color: '#4285F4' },
      { name: '어린이날', month: 5, day: 5, type: 'PUBLIC', description: '어린이날', color: '#FF6B6B' },
      { name: '현충일', month: 6, day: 6, type: 'MEMORIAL', description: '호국영령을 추모하는 날', color: '#9C27B0' },
      { name: '광복절', month: 8, day: 15, type: 'NATIONAL', description: '일제강점기 해방 기념일', color: '#4285F4' },
      { name: '개천절', month: 10, day: 3, type: 'NATIONAL', description: '단군왕검이 고조선을 건국한 날', color: '#4285F4' },
      { name: '한글날', month: 10, day: 9, type: 'NATIONAL', description: '한글 창제를 기념하는 날', color: '#4285F4' },
      { name: '크리스마스', month: 12, day: 25, type: 'PUBLIC', description: '예수 그리스도의 탄생을 기념하는 날', color: '#FF6B6B' }
    ]

    return defaultHolidays.map(holiday => ({
      id: `default-${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`,
      name: holiday.name,
      holidayDate: `${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`,
      countryCode: 'KR',
      holidayType: holiday.type,
      description: holiday.description,
      isRecurring: true,
      color: holiday.color
    }))
  },

  /**
   * 날짜 범위의 기본 공휴일 반환
   * @param {string} startDate - 시작 날짜
   * @param {string} endDate - 종료 날짜
   */
  getFallbackHolidays(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const holidays = []

    // 시작년도부터 종료년도까지의 기본 공휴일 생성
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      const yearHolidays = this.getDefaultKoreanHolidays(year)

      // 날짜 범위 내의 공휴일만 필터링
      const filteredHolidays = yearHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.holidayDate)
        return holidayDate >= start && holidayDate <= end
      })

      holidays.push(...filteredHolidays)
    }

    return holidays
  },

  /**
   * 공휴일 등록
   * @param {Object} holidayData - 공휴일 데이터
   * @returns {Promise<Object>} 등록된 공휴일 정보
   */
  async createHoliday(holidayData) {
    try {
      const response = await holidayAxios.post('', holidayData)

      // 캐시 무효화
      this.clearAllCache()

      return response.data
    } catch (error) {
      console.error('공휴일 등록 실패:', error)

      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || '잘못된 공휴일 정보입니다.')
      }

      throw new Error('공휴일 등록에 실패했습니다.')
    }
  },

  /**
   * 공휴일 수정
   * @param {number} id - 공휴일 ID
   * @param {Object} holidayData - 수정할 공휴일 데이터
   * @returns {Promise<Object>} 수정된 공휴일 정보
   */
  async updateHoliday(id, holidayData) {
    try {
      const response = await holidayAxios.put(`/${id}`, holidayData)

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
   * 공휴일 삭제
   * @param {number} id - 공휴일 ID
   * @returns {Promise<void>}
   */
  async deleteHoliday(id) {
    try {
      await holidayAxios.delete(`/${id}`)

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
      const response = await holidayAxios.get('/today')
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
   * 공휴일 통계 조회
   * @param {number} year - 연도
   */
  async getHolidayStatistics(year) {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/holidays/stats/${year}`)
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
   * 공공데이터 API 연결 테스트
   * @param {number} year - 테스트할 연도
   */
  async testPublicApiConnection(year = new Date().getFullYear()) {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/holidays/test-connection/${year}`)
      return response.data
    } catch (error) {
      console.error('공공데이터 API 연결 테스트 실패:', error)
      throw new Error(`API 연결 테스트 실패: ${error.response?.data?.message || error.message}`)
    }
  }
}

/**
 * 공휴일 유틸리티 함수들
 */
export const holidayUtils = {
  /**
   * 공휴일 타입별 우선순위 반환
   * @param {string} holidayType - 공휴일 타입
   * @returns {number} 우선순위 (낮을수록 높은 우선순위)
   */
  getHolidayPriority(holidayType) {
    const priorities = {
      'NATIONAL': 1,    // 국경일
      'PUBLIC': 2,      // 공휴일
      'SUBSTITUTE': 3,  // 대체공휴일
      'MEMORIAL': 4,    // 기념일
      'ANNIVERSARY': 5  // 기타
    }

    return priorities[holidayType] || 999
  },

  /**
   * 공휴일 타입별 한글 이름 반환
   * @param {string} holidayType - 공휴일 타입
   * @returns {string} 한글 이름
   */
  getHolidayTypeName(holidayType) {
    const typeNames = {
      'NATIONAL': '국경일',
      'PUBLIC': '공휴일',
      'SUBSTITUTE': '대체공휴일',
      'MEMORIAL': '기념일',
      'ANNIVERSARY': '기타'
    }

    return typeNames[holidayType] || '기타'
  },

  /**
   * 공휴일 타입별 기본 색상 반환
   * @param {string} holidayType - 공휴일 타입
   * @returns {string} 색상 코드
   */
  getHolidayColor(holidayType) {
    const colors = {
      'NATIONAL': '#4285F4',    // 파란색 (국경일)
      'PUBLIC': '#FF6B6B',      // 빨간색 (공휴일)
      'SUBSTITUTE': '#FF9800',  // 주황색 (대체공휴일)
      'MEMORIAL': '#9C27B0',    // 보라색 (기념일)
      'ANNIVERSARY': '#607D8B'  // 회색 (기타)
    }

    return colors[holidayType] || '#FF6B6B'
  },

  /**
   * 날짜별 공휴일 그룹화
   * @param {Array} holidays - 공휴일 목록
   * @returns {Object} 날짜별로 그룹화된 공휴일
   */
  groupHolidaysByDate(holidays) {
    const grouped = {}

    holidays.forEach(holiday => {
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
   * @returns {string} 요일 타입
   */
  getDayType(date) {
    const dayOfWeek = date.getDay()

    if (dayOfWeek === 0) return 'sunday'    // 일요일
    if (dayOfWeek === 6) return 'saturday'  // 토요일
    return 'weekday'                        // 평일
  },

  /**
   * 공휴일 캐시 상태 확인
   */
  getCacheStatus() {
    return {
      size: holidayAPI.cache.size,
      keys: Array.from(holidayAPI.cache.keys()),
      timeout: holidayAPI.cacheTimeout
    }
  },

  /**
   * 공휴일 데이터 유효성 검사
   * @param {Object} holidayData - 공휴일 데이터
   * @returns {Object} 검증 결과
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
  }
}
