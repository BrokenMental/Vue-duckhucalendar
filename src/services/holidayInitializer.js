import { holidayAPI, holidayUtils } from './holidayAPI.js'

/**
 * 공휴일 데이터 초기화 관리자
 */
export class HolidayInitializer {
  constructor() {
    this.isInitialized = false
    this.initializationPromise = null
    this.requiredYears = this.getRequiredYears()
  }

  /**
   * 필요한 연도 목록 반환 (현재 연도 기준 전후 2년)
   */
  getRequiredYears() {
    const currentYear = new Date().getFullYear()
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
  }

  /**
   * 공휴일 데이터 초기화
   */
  async initialize() {
    if (this.isInitialized) {
      return true
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._performInitialization()
    return this.initializationPromise
  }

  /**
   * 실제 초기화 수행
   */
  async _performInitialization() {
    console.log('🚀 공휴일 데이터 초기화 시작')

    try {
      const initResults = []

      // 각 연도별로 공휴일 데이터 확인 및 초기화
      for (const year of this.requiredYears) {
        const result = await this.initializeYear(year)
        initResults.push({ year, ...result })
      }

      // 결과 요약
      const successCount = initResults.filter(r => r.success).length
      const totalCount = initResults.length

      console.log(`✅ 공휴일 초기화 완료: ${successCount}/${totalCount}개 연도 성공`)

      // 부분적으로라도 성공했으면 초기화 완료로 간주
      if (successCount > 0) {
        this.isInitialized = true
        this._schedulePeriodicSync()
        return true
      } else {
        throw new Error('모든 연도의 공휴일 초기화에 실패했습니다.')
      }

    } catch (error) {
      console.error('❌ 공휴일 초기화 실패:', error)
      this.isInitialized = false
      throw error
    } finally {
      this.initializationPromise = null
    }
  }

  /**
   * 특정 연도 초기화
   */
  async initializeYear(year) {
    console.log(`📅 ${year}년 공휴일 데이터 확인 중...`)

    try {
      // 1. 현재 저장된 공휴일 확인
      const existingHolidays = await holidayAPI.getHolidaysByYear(year)

      if (existingHolidays.length >= 5) {
        console.log(`✅ ${year}년 공휴일 데이터 충분함 (${existingHolidays.length}개)`)
        return {
          success: true,
          source: 'existing',
          count: existingHolidays.length,
          message: '기존 데이터 사용'
        }
      }

      console.log(`⚠️ ${year}년 공휴일 데이터 부족 (${existingHolidays.length}개) - 동기화 시도`)

      // 2. 공공데이터 동기화 시도
      try {
        await holidayAPI.syncHolidaysFromPublicAPI(year)

        // 동기화 후 다시 확인
        const syncedHolidays = await holidayAPI.getHolidaysByYear(year)

        console.log(`✅ ${year}년 공공데이터 동기화 성공 (${syncedHolidays.length}개)`)
        return {
          success: true,
          source: 'public_api',
          count: syncedHolidays.length,
          message: '공공데이터 동기화 성공'
        }

      } catch (syncError) {
        console.warn(`⚠️ ${year}년 공공데이터 동기화 실패:`, syncError.message)

        // 3. 기본 데이터 사용
        const defaultHolidays = holidayAPI.getDefaultKoreanHolidays(year)

        console.log(`📋 ${year}년 기본 공휴일 데이터 사용 (${defaultHolidays.length}개)`)
        return {
          success: true,
          source: 'default',
          count: defaultHolidays.length,
          message: '기본 데이터 사용'
        }
      }

    } catch (error) {
      console.error(`❌ ${year}년 공휴일 초기화 실패:`, error)
      return {
        success: false,
        source: 'error',
        count: 0,
        message: error.message
      }
    }
  }

  /**
   * 주기적 동기화 스케줄링 (하루에 한 번)
   */
  _schedulePeriodicSync() {
    const syncInterval = 24 * 60 * 60 * 1000 // 24시간

    setInterval(async () => {
      console.log('🔄 주기적 공휴일 동기화 시작')

      try {
        await holidayAPI.syncCurrentYearHolidays()
        console.log('✅ 주기적 동기화 완료')
      } catch (error) {
        console.warn('⚠️ 주기적 동기화 실패:', error.message)
      }
    }, syncInterval)

    console.log('⏰ 주기적 공휴일 동기화 스케줄링 완료 (24시간 간격)')
  }

  /**
   * 강제 재초기화
   */
  async forceReinitialize() {
    console.log('🔄 공휴일 데이터 강제 재초기화')

    // 캐시 초기화
    holidayAPI.clearAllCache()

    // 초기화 상태 리셋
    this.isInitialized = false
    this.initializationPromise = null

    // 다시 초기화
    return this.initialize()
  }

  /**
   * 초기화 상태 확인
   */
  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.initializationPromise !== null,
      requiredYears: this.requiredYears,
      cacheStatus: holidayUtils.getCacheStatus()
    }
  }

  /**
   * 특정 연도 공휴일 강제 동기화
   */
  async syncYear(year) {
    console.log(`🔄 ${year}년 공휴일 강제 동기화`)

    try {
      await holidayAPI.syncHolidaysFromPublicAPI(year)
      console.log(`✅ ${year}년 동기화 완료`)
      return true
    } catch (error) {
      console.error(`❌ ${year}년 동기화 실패:`, error)
      throw error
    }
  }

  /**
   * 공휴일 데이터 상태 점검
   */
  async checkHolidayDataHealth() {
    console.log('🔍 공휴일 데이터 상태 점검')

    const healthReport = {
      overallHealth: 'good',
      yearReports: [],
      recommendations: []
    }

    for (const year of this.requiredYears) {
      try {
        const holidays = await holidayAPI.getHolidaysByYear(year)
        const stats = await holidayAPI.getHolidayStatistics(year)

        const yearReport = {
          year,
          holidayCount: holidays.length,
          status: holidays.length >= 5 ? 'good' : 'insufficient',
          lastSync: this._getLastSyncTime(year),
          statistics: stats
        }

        if (holidays.length < 5) {
          healthReport.overallHealth = 'warning'
          healthReport.recommendations.push(`${year}년 공휴일 데이터가 부족합니다. 동기화를 권장합니다.`)
        }

        healthReport.yearReports.push(yearReport)

      } catch (error) {
        healthReport.overallHealth = 'error'
        healthReport.yearReports.push({
          year,
          status: 'error',
          error: error.message
        })
        healthReport.recommendations.push(`${year}년 공휴일 데이터 조회에 실패했습니다.`)
      }
    }

    return healthReport
  }

  /**
   * 마지막 동기화 시간 추정 (캐시 기반)
   */
  _getLastSyncTime(year) {
    const cacheStatus = holidayUtils.getCacheStatus()
    const yearCacheKey = cacheStatus.keys.find(key => key.includes(`year-${year}`))

    if (yearCacheKey) {
      // 캐시가 있으면 최근에 동기화된 것으로 추정
      return 'Recent (cached)'
    }

    return 'Unknown'
  }
}

/**
 * 전역 공휴일 초기화 관리자 인스턴스
 */
export const holidayInitializer = new HolidayInitializer()

/**
 * Vue 앱에서 사용하기 위한 편의 함수들
 */
export const holidayInitUtils = {
  /**
   * Vue 앱 시작 시 공휴일 초기화
   */
  async initializeForVueApp() {
    try {
      console.log('🎯 Vue 앱용 공휴일 초기화 시작')

      const success = await holidayInitializer.initialize()

      if (success) {
        console.log('✅ Vue 앱 공휴일 초기화 완료')
        return true
      } else {
        throw new Error('초기화 실패')
      }

    } catch (error) {
      console.error('❌ Vue 앱 공휴일 초기화 실패:', error)

      // 초기화 실패해도 앱은 동작하도록 함
      console.warn('⚠️ 기본 공휴일 데이터로 계속 진행합니다.')
      return false
    }
  },

  /**
   * 컴포넌트에서 공휴일 데이터 준비 상태 확인
   */
  async waitForHolidayData(maxWaitTime = 10000) {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      if (holidayInitializer.isInitialized) {
        return true
      }

      // 100ms 대기
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.warn('⚠️ 공휴일 데이터 대기 시간 초과')
    return false
  },

  /**
   * 관리자 페이지용 상세 상태 조회
   */
  async getDetailedStatus() {
    const initStatus = holidayInitializer.getInitializationStatus()
    const healthReport = await holidayInitializer.checkHolidayDataHealth()

    return {
      initialization: initStatus,
      health: healthReport,
      actions: {
        forceReinitialize: () => holidayInitializer.forceReinitialize(),
        syncYear: (year) => holidayInitializer.syncYear(year),
        testConnection: () => holidayAPI.testPublicApiConnection(),
        clearCache: () => holidayAPI.clearAllCache()
      }
    }
  },

  /**
   * 캘린더 컴포넌트용 간단한 공휴일 조회
   */
  async getHolidaysForCalendar(startDate, endDate) {
    try {
      // 초기화 대기 (최대 3초)
      await this.waitForHolidayData(3000)

      // 공휴일 조회
      const holidays = await holidayAPI.getHolidaysByDateRange(startDate, endDate)

      // 날짜별 그룹화
      const groupedHolidays = holidayUtils.groupHolidaysByDate(holidays)

      return {
        success: true,
        holidays: groupedHolidays,
        totalCount: holidays.length
      }

    } catch (error) {
      console.error('캘린더용 공휴일 조회 실패:', error)

      // 에러 시 기본 데이터 반환
      const fallbackHolidays = holidayAPI.getFallbackHolidays(startDate, endDate)
      const groupedFallback = holidayUtils.groupHolidaysByDate(fallbackHolidays)

      return {
        success: false,
        holidays: groupedFallback,
        totalCount: fallbackHolidays.length,
        error: error.message,
        fallback: true
      }
    }
  },

  /**
   * 에러 상황에서의 사용자 친화적 메시지
   */
  getErrorMessage(error) {
    if (error.message.includes('네트워크')) {
      return '인터넷 연결을 확인해주세요. 기본 공휴일 정보로 표시됩니다.'
    } else if (error.message.includes('서비스 키')) {
      return '공공데이터 서비스에 문제가 있습니다. 기본 공휴일 정보로 표시됩니다.'
    } else if (error.message.includes('API')) {
      return '공휴일 정보 서비스가 일시적으로 불안정합니다. 기본 정보로 표시됩니다.'
    } else {
      return '공휴일 정보를 불러오는 중 문제가 발생했습니다. 기본 정보로 표시됩니다.'
    }
  }
}
