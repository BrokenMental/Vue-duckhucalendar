/**
 * 설정 관리 스토어
 * 캘린더 설정, 알림 설정 등을 관리
 */

import { reactive, watch } from 'vue'

// 기본 설정값
const DEFAULT_SETTINGS = {
  // 일반 설정
  siteTitle: '이벤트 캘린더',
  siteDescription: '다양한 이벤트를 확인하고 참여하세요',
  maintenanceMode: false,

  // 뉴스레터 설정
  newsletterEnabled: true,
  newsletterDay: 0, // 0: 일요일, 1: 월요일, ...
  newsletterTime: '09:00',

  // 캘린더 설정
  weekStartDay: 0, // 0: 일요일, 1: 월요일
  defaultView: 'month', // month, week, day
  eventsPerPage: 20,
  showWeekNumbers: false,

  // 테마 설정
  theme: 'light', // light, dark
  primaryColor: '#007bff',

  // 알림 설정
  notificationsEnabled: true,
  notificationTime: 15, // 15분 전 알림
  emailNotifications: false,

  // 언어 설정
  language: 'ko'
}

// 설정 저장소 키
const STORAGE_KEY = 'calendar-settings'

// 반응형 설정 객체
const settings = reactive({
  ...DEFAULT_SETTINGS
})

/**
 * 로컬 스토리지에서 설정 로드
 */
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY)
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      // 기존 설정과 병합 (새로운 설정 항목 추가 대응)
      Object.assign(settings, { ...DEFAULT_SETTINGS, ...parsed })
      console.log('✅ 설정 로드 완료:', settings)
    }
  } catch (error) {
    console.error('❌ 설정 로드 실패:', error)
    resetSettings()
  }
}

/**
 * 로컬 스토리지에 설정 저장
 */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    console.log('💾 설정 저장 완료')
  } catch (error) {
    console.error('❌ 설정 저장 실패:', error)
  }
}

/**
 * 설정 초기화
 */
function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS)
  saveSettings()
  console.log('🔄 설정 초기화 완료')
}

/**
 * 특정 설정 업데이트
 */
function updateSetting(key, value) {
  if (key in settings) {
    settings[key] = value
    console.log(`⚙️ 설정 업데이트: ${key} = ${value}`)
  } else {
    console.warn(`⚠️ 알 수 없는 설정 키: ${key}`)
  }
}

/**
 * 여러 설정 한번에 업데이트
 */
function updateSettings(newSettings) {
  Object.keys(newSettings).forEach(key => {
    if (key in settings) {
      settings[key] = newSettings[key]
    }
  })
  console.log('⚙️ 설정 일괄 업데이트 완료')
}

/**
 * 설정 내보내기 (백업용)
 */
function exportSettings() {
  return JSON.stringify(settings, null, 2)
}

/**
 * 설정 가져오기 (복원용)
 */
function importSettings(settingsJson) {
  try {
    const imported = JSON.parse(settingsJson)
    Object.assign(settings, { ...DEFAULT_SETTINGS, ...imported })
    saveSettings()
    console.log('📥 설정 가져오기 완료')
    return true
  } catch (error) {
    console.error('❌ 설정 가져오기 실패:', error)
    return false
  }
}

/**
 * 주 번호 표시 토글
 */
function toggleWeekNumbers() {
  settings.showWeekNumbers = !settings.showWeekNumbers
  console.log(`📅 주 번호 표시: ${settings.showWeekNumbers ? '활성화' : '비활성화'}`)
}

/**
 * 테마 변경
 */
function changeTheme(theme) {
  if (['light', 'dark'].includes(theme)) {
    settings.theme = theme
    applyTheme(theme)
    console.log(`🎨 테마 변경: ${theme}`)
  }
}

/**
 * 테마 적용
 */
function applyTheme(theme) {
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark-theme')
  } else {
    root.classList.remove('dark-theme')
  }
}

/**
 * 뉴스레터 설정 유효성 검사
 */
function validateNewsletterSettings() {
  const { newsletterDay, newsletterTime } = settings

  // 요일 검증 (0-6)
  if (newsletterDay < 0 || newsletterDay > 6) {
    console.warn('⚠️ 잘못된 뉴스레터 요일 설정')
    settings.newsletterDay = 0
  }

  // 시간 검증 (HH:MM 형식)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(newsletterTime)) {
    console.warn('⚠️ 잘못된 뉴스레터 시간 설정')
    settings.newsletterTime = '09:00'
  }
}

/**
 * 캘린더 설정 유효성 검사
 */
function validateCalendarSettings() {
  const { weekStartDay, defaultView, eventsPerPage } = settings

  // 주 시작일 검증
  if (![0, 1].includes(weekStartDay)) {
    console.warn('⚠️ 잘못된 주 시작일 설정')
    settings.weekStartDay = 0
  }

  // 기본 보기 검증
  if (!['month', 'week', 'day'].includes(defaultView)) {
    console.warn('⚠️ 잘못된 기본 보기 설정')
    settings.defaultView = 'month'
  }

  // 페이지당 이벤트 수 검증
  if (eventsPerPage < 10 || eventsPerPage > 100) {
    console.warn('⚠️ 잘못된 페이지당 이벤트 수 설정')
    settings.eventsPerPage = 20
  }
}

/**
 * 모든 설정 유효성 검사
 */
function validateAllSettings() {
  validateNewsletterSettings()
  validateCalendarSettings()
}

// 설정 변경 감시 및 자동 저장
watch(settings, () => {
  validateAllSettings()
  saveSettings()
}, { deep: true })

// 초기 설정 로드
loadSettings()

// 초기 테마 적용
applyTheme(settings.theme)

/**
 * 설정 스토어 내보내기
 */
export const useSettingsStore = () => {
  return {
    // 설정 객체
    settings,

    // 설정 관리 함수들
    loadSettings,
    saveSettings,
    resetSettings,
    updateSetting,
    updateSettings,
    exportSettings,
    importSettings,

    // 특수 기능들
    toggleWeekNumbers,
    changeTheme,
    validateAllSettings,

    // 유틸리티
    getWeekdayName: (day) => {
      const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
      return weekdays[day] || '일요일'
    },

    getThemeClass: () => {
      return settings.theme === 'dark' ? 'dark-theme' : 'light-theme'
    },

    isWeekNumbersEnabled: () => settings.showWeekNumbers,

    getNewsletterSchedule: () => {
      return {
        day: settings.newsletterDay,
        time: settings.newsletterTime,
        dayName: useSettingsStore().getWeekdayName(settings.newsletterDay)
      }
    }
  }
}
