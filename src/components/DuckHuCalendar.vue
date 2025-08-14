<template>
  <div class="duckhu-calendar">
    <!-- 캘린더 헤더 -->
    <div class="calendar-header">
      <!-- 데스크톱 버전 헤더 -->
      <div class="desktop-header">
        <button class="nav-button" @click="previousMonth">◀ 이전</button>

        <div class="month-year-selector">
          <select v-model="selectedYear">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
          <select v-model="selectedMonth">
            <option v-for="(month, index) in months" :key="index" :value="index">
              {{ month }}
            </option>
          </select>
        </div>

        <button class="nav-button" @click="nextMonth">다음 ▶</button>
      </div>

      <!-- 모바일 버전 헤더 -->
      <div class="mobile-header">
        <div class="mobile-nav-row">
          <button class="mobile-nav-button" @click="previousMonth">◀ 이전</button>

          <select v-model="selectedYear" class="mobile-select">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>

          <select v-model="selectedMonth" class="mobile-select">
            <option v-for="(month, index) in months" :key="index" :value="index">
              {{ month }}
            </option>
          </select>

          <button class="mobile-nav-button" @click="nextMonth">다음 ▶</button>
        </div>
      </div>
    </div>

    <!-- 캘린더 컨테이너 -->
    <div class="calendar-container" ref="duckHuCalendarContainer">
      <!-- 요일 헤더 -->
      <div class="weekday-header">
        <div v-for="day in weekdays" :key="day" class="weekday-cell">
          {{ day }}
        </div>
      </div>

      <!-- 캘린더 본체 -->
      <div class="calendar-body" ref="duckHuCalendarBody">
        <!-- 날짜 그리드 -->
        <div class="date-grid">
          <div class="week-row" v-for="(week, weekIndex) in duckHuCalendarWeeks" :key="weekIndex">
            <div
              v-for="(day, dayIndex) in week"
              :key="day.fullDate"
              class="date-cell"
              :class="{
                'today': isDuckHuToday(new Date(day.fullDate + 'T00:00:00')),
                'other-month': day.isOtherMonth,
                'weekend': dayIndex === 0 || dayIndex === 6,
                'has-holiday': getHolidaysForDay(day.fullDate).length > 0
              }"
              @click="showDuckHuDaySchedules(day.fullDate)"
            >
              <!-- 날짜 숫자 -->
              <div class="date-number">
                {{ day.dateNumber }}
              </div>

              <!-- 공휴일 표시 -->
              <div v-if="holidaysByDate[day.fullDate] && holidaysByDate[day.fullDate].length > 0"
                  class="holiday-info">
                <div class="holiday-main">
                  <span class="holiday-name">{{ holidaysByDate[day.fullDate][0].name }}</span>
                  <span v-if="holidaysByDate[day.fullDate].length > 1"
                        class="holiday-count"
                        @click.stop="showHolidayDetail(day.fullDate, $event)">
                    +{{ holidaysByDate[day.fullDate].length - 1 }}
                  </span>
                </div>
              </div>

              <!-- 이벤트 컨테이너 - 하루짜리 일정만 표시 -->
              <div class="date-events">
                <!-- 하루짜리 일정만 모바일에서 표시 (여러 날 걸친 일정은 제외) -->
                <div
                  v-for="(schedule, eventIndex) in getSingleDaySchedulesForDay(day.fullDate).slice(0, 2)"
                  :key="eventIndex"
                  class="mobile-event"
                  :style="{ backgroundColor: schedule.color || '#3498db' }"
                  @click.stop="openDuckHuScheduleDetail(schedule)"
                  @mouseenter="showDuckHuEventTooltip(schedule, $event)"
                  @mouseleave="hideDuckHuTooltip"
                >
                  <span class="event-text">{{ schedule.title }}</span>
                </div>

                <!-- 더 많은 일정이 있을 때 -->
                <div
                  v-if="getDuckHuScheduleCountForDay(day.fullDate) > 2"
                  class="more-events"
                  @click.stop="showDuckHuDaySchedules(day.fullDate)"
                >
                  +{{ getDuckHuScheduleCountForDay(day.fullDate) - 2 }}개
                </div>
              </div>

              <!-- 일정 개수 표시 (하단에) -->
              <div v-if="getDuckHuScheduleCountForDay(day.fullDate) > 0"
                  class="schedule-count">
                📅 {{ getDuckHuScheduleCountForDay(day.fullDate) }}개
              </div>
            </div>
          </div>
        </div>

        <!-- 일정 표시 레이어 -->
        <div class="events-layer">
          <div v-for="(week, weekIndex) in duckHuCalendarWeeks" :key="`events-week-${weekIndex}`" class="events-week">
            <div
              v-for="event in getDuckHuEventsForWeek(week, weekIndex)"
              :key="`event-${event.schedule.id}-${event.weekIndex}-${event.rowIndex}`"
              class="event-item"
              :style="getDuckHuEventStyle(event, weekIndex)"
              @click="openDuckHuScheduleDetail(event.schedule)"
              @mouseenter="showDuckHuEventTooltip(event.schedule, $event)"
              @mouseleave="hideDuckHuTooltip"
            >
              <!-- 시작 부분이면 시간과 제목을 모두 표시 -->
              <span v-if="event.isStart" class="event-content">
                <span v-if="event.schedule.startTime" class="event-time">{{ event.schedule.startTime }}</span>
                <span class="event-title" :class="{ 'with-time': event.schedule.startTime }">{{ event.schedule.title }}</span>
              </span>
              <!-- 중간 부분이면 제목만 표시 -->
              <span v-else class="event-title">{{ event.schedule.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 일정 상세보기 모달 -->
    <ScheduleDetailModal
      :show="showDuckHuDetailModal"
      :selected-schedules="selectedDuckHuSchedules"
      @close="closeDuckHuDetailModal"
    />

    <!-- 공휴일 상세보기 모달 -->
    <div v-if="showHolidayDetailModal" class="modal-overlay" @click="closeHolidayDetailModal">
      <div class="holiday-modal" @click.stop>
        <div class="holiday-modal-header">
          <h3>{{ formatDateForDisplay(selectedHolidayDate) }} 공휴일</h3>
          <button class="close-btn" @click="closeHolidayDetailModal">×</button>
        </div>
        <div class="holiday-modal-body">
          <div v-for="holiday in selectedDateHolidays" :key="holiday.id" class="holiday-item">
            <div class="holiday-badge" :style="{ backgroundColor: holiday.color }">
              {{ getHolidayTypeDisplayName(holiday.holidayType) }}
            </div>
            <div class="holiday-details">
              <div class="holiday-title">{{ holiday.name }}</div>
              <div v-if="holiday.description" class="holiday-description">{{ holiday.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 툴팁 -->
    <div v-if="duckHuTooltip.show" class="event-tooltip" :style="{ left: duckHuTooltip.x + 'px', top: duckHuTooltip.y + 'px' }">
      <div class="tooltip-title">{{ duckHuTooltip.schedule.title }}</div>
      <div class="tooltip-date">{{ formatDuckHuDateRange(duckHuTooltip.schedule) }}</div>
      <div v-if="duckHuTooltip.schedule.startTime" class="tooltip-time">
        {{ duckHuTooltip.schedule.startTime }} - {{ duckHuTooltip.schedule.endTime || '종료시간 미정' }}
      </div>
    </div>
  </div>
</template>

<script>
import ScheduleDetailModal from '@/components/ScheduleDetailModal.vue'
import { scheduleAPI } from '@/services/api.js'
import { holidayAPI, holidayUtils } from '@/services/holidayAPI.js'
//import { holidayInitUtils } from '@/services/holidayInitializer.js'

export default {
  name: 'DuckHuCalendar',

  components: {
    ScheduleDetailModal
  },

  data() {
    return {
      // DuckHu 캘린더 설정
      DUCKHU_CELL_HEIGHT: 120,
      DUCKHU_CELL_WIDTH: 0,
      DUCKHU_EVENT_HEIGHT: 20,
      DUCKHU_EVENT_MARGIN: 2,
      DUCKHU_MAX_EVENTS_PER_ROW: 4,

      // 날짜 관련
      currentDate: new Date(),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),
      months: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
      ],
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      duckHuCalendarWeeks: [],

      // 일정 관련 (API 연동)
      duckHuSchedules: [],
      loading: false,
      error: null,

      // 공휴일 관련
      holidays: [],
      holidaysByDate: {},
      holidayLoading: false,

      // 모달 상태
      showDuckHuDetailModal: false,
      selectedDuckHuSchedules: [],

      // 공휴일 상세보기 모달
      showHolidayDetailModal: false,
      selectedHolidayDate: null,
      selectedDateHolidays: [],

      // 툴팁
      duckHuTooltip: {
        show: false,
        x: 0,
        y: 0,
        schedule: null
      },

      // 알림 관리
      duckHuNotificationTimers: []
    }
  },

  computed: {
    availableYears() {
      const currentYear = new Date().getFullYear()
      const years = []
      for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i)
      }
      return years
    }
  },

  watch: {
    selectedYear() {
      this.generateDuckHuCalendar()
      this.loadDuckHuSchedules() // 연도 변경 시 일정 다시 로드
      this.loadHolidays() // 공휴일도 다시 로드
    },
    selectedMonth() {
      this.generateDuckHuCalendar()
      this.loadDuckHuSchedules() // 월 변경 시 일정 다시 로드
      this.loadHolidays() // 공휴일도 다시 로드
    }
  },

  async mounted() {
    this.generateDuckHuCalendar()
    await Promise.all([
      this.loadDuckHuSchedules(),
      this.loadHolidays()
    ])
    this.calculateDuckHuCellWidth()
    this.setupDuckHuNotifications()
    this.scheduleDuckHuNotifications()

    window.addEventListener('resize', this.calculateDuckHuCellWidth)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.calculateDuckHuCellWidth)

    if (this.duckHuNotificationTimers) {
      this.duckHuNotificationTimers.forEach(timer => clearTimeout(timer))
    }
  },

  methods: {
    /**
     * DuckHu 캘린더 생성 (주별로 구성)
     */
    generateDuckHuCalendar() {
      const year = this.selectedYear
      const month = this.selectedMonth

      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())

      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

      const weeks = []
      let currentWeekStart = new Date(startDate)

      while (currentWeekStart <= endDate) {
        const week = []
        for (let i = 0; i < 7; i++) {
          const current = new Date(currentWeekStart)
          current.setDate(current.getDate() + i)

          week.push({
            dateNumber: current.getDate(), // 날짜 숫자만 (표시용)
            dateObject: new Date(current), // 완전한 Date 객체 (계산용)
            fullDate: this.formatDuckHuDate(current),
            isCurrentMonth: current.getFullYear() === year && current.getMonth() === month,
            isOtherMonth: current.getFullYear() !== year || current.getMonth() !== month, // 추가
            isToday: this.isDuckHuToday(current),
            key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
          })
        }
        weeks.push(week)
        currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      }

      this.duckHuCalendarWeeks = weeks
    },

    /**
     * DuckHu 셀 너비 계산
     */
    calculateDuckHuCellWidth() {
      this.$nextTick(() => {
        const container = this.$refs.duckHuCalendarContainer
        if (container) {
          this.DUCKHU_CELL_WIDTH = container.offsetWidth / 7
        }
      })
    },

    /**
     * 공휴일 데이터 로드
     */
    async loadHolidays() {
      if (this.holidayLoading) return

      this.holidayLoading = true

      try {
        // 현재 월의 시작일과 끝일 계산
        const startDate = new Date(this.selectedYear, this.selectedMonth, 1)
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, 0)

        // 캘린더 그리드 범위로 확장 (이전/다음 월 일부 포함)
        const calendarStart = new Date(startDate)
        calendarStart.setDate(calendarStart.getDate() - startDate.getDay())

        const calendarEnd = new Date(endDate)
        calendarEnd.setDate(calendarEnd.getDate() + (6 - endDate.getDay()))

        // 날짜를 문자열로 변환
        const startDateStr = this.formatDuckHuDate(calendarStart)
        const endDateStr = this.formatDuckHuDate(calendarEnd)

        console.log('공휴일 데이터 로드 범위:', startDateStr, '~', endDateStr)

        // 공휴일 API 직접 호출 (초기화 과정 생략)
        const response = await holidayAPI.getHolidaysByDateRange(startDateStr, endDateStr)

        // API 응답에서 holidays 배열 추출
        let holidays = []
        if (response && response.holidays && Array.isArray(response.holidays)) {
          holidays = response.holidays
        } else if (Array.isArray(response)) {
          holidays = response
        }

        // 날짜별 그룹화
        this.holidaysByDate = holidayUtils.groupHolidaysByDate(holidays)

        console.log(`✅ ${holidays.length}개의 공휴일을 로드했습니다.`)

      } catch (error) {
        console.error('❌ 공휴일 로드 실패:', error)
        this.holidaysByDate = {}

        // 사용자에게 친화적인 에러 메시지 표시
        console.warn('⚠️ 공휴일 정보를 불러올 수 없어 기본 정보로 표시됩니다.')
      } finally {
        this.holidayLoading = false
      }
    },

    /**
     * 특정 날짜의 공휴일 목록 반환
     */
    getHolidaysForDay(date) {
      return this.holidaysByDate[date] || []
    },

    /**
     * 공휴일 타입별 표시 이름 반환
     */
    getHolidayTypeDisplayName(holidayType) {
      return holidayUtils.getHolidayTypeName(holidayType)
    },

    /**
     * 공휴일 상세보기 모달 열기
     */
    showHolidayDetail(date, event) {
      event.preventDefault()
      event.stopPropagation()

      const holidays = this.getHolidaysForDay(date)
      if (holidays.length > 0) {
        this.selectedHolidayDate = date
        this.selectedDateHolidays = holidays
        this.showHolidayDetailModal = true
      }
    },

    /**
     * 공휴일 상세보기 모달 닫기
     */
    closeHolidayDetailModal() {
      this.showHolidayDetailModal = false
      this.selectedHolidayDate = null
      this.selectedDateHolidays = []
    },

    /**
     * 날짜 표시용 포맷팅
     */
    formatDateForDisplay(dateStr) {
      const date = new Date(dateStr + 'T00:00:00')
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    },

    /**
     * DuckHu 일정 로드 (API 연동)
     */
    async loadDuckHuSchedules() {
      this.loading = true
      this.error = null

      try {
        // 현재 월의 시작일과 끝일 계산
        const startDate = new Date(this.selectedYear, this.selectedMonth, 1)
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, 0)

        // 캘린더 그리드 범위로 확장 (이전/다음 월 일부 포함)
        const calendarStart = new Date(startDate)
        calendarStart.setDate(calendarStart.getDate() - startDate.getDay())

        const calendarEnd = new Date(endDate)
        calendarEnd.setDate(calendarEnd.getDate() + (6 - endDate.getDay()))

        // 날짜를 문자열로 변환
        const startDateStr = this.formatDuckHuDate(calendarStart)
        const endDateStr = this.formatDuckHuDate(calendarEnd)

        console.log('DuckHu 캘린더 날짜 범위:', startDateStr, '~', endDateStr)

        // API 호출 - 파라미터 구조 수정
        const response = await scheduleAPI.getSchedulesByDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        })

        // 응답 데이터 처리
        this.duckHuSchedules = response.schedules || response || []

        console.log(`✅ ${this.duckHuSchedules.length}개의 일정을 로드했습니다.`)

        // 알림 재설정
        this.scheduleDuckHuNotifications()

      } catch (error) {
        console.error('❌ 일정 로드 실패:', error)
        this.error = '일정을 불러오는데 실패했습니다.'
        // 에러 시 빈 배열로 설정
        this.duckHuSchedules = []
      } finally {
        this.loading = false
      }
    },

    /**
     * 특정 날짜의 일정 개수 반환
     */
    getDuckHuScheduleCountForDay(date) {
      const count = this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= date && schedule.endDate >= date
      }).length

      // 4개 이상이면 특별 표시
      return count >= 4 ? `${count}🌈` : count
    },

    /**
     * 특정 날짜의 모든 일정 표시
     */
    showDuckHuDaySchedules(date) {
      const daySchedules = this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= date && schedule.endDate >= date
      })

      if (daySchedules.length > 0) {
        this.selectedDuckHuSchedules = daySchedules
        this.showDuckHuDetailModal = true
      }
    },

    /**
     * DuckHu 날짜 형식 변환
     */
    formatDuckHuDate(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    /**
     * 오늘 날짜인지 확인
     */
    isDuckHuToday(date) {
      const today = new Date()
      return date.getFullYear() === today.getFullYear() &&
             date.getMonth() === today.getMonth() &&
             date.getDate() === today.getDate()
    },

    /**
     * DuckHu 날짜 범위 형식 변환
     */
    formatDuckHuDateRange(schedule) {
      const start = new Date(schedule.startDate + 'T00:00:00')
      const end = new Date(schedule.endDate + 'T00:00:00')

      if (schedule.startDate === schedule.endDate) {
        return `${start.getMonth() + 1}월 ${start.getDate()}일`
      } else {
        return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`
      }
    },

    /**
     * 이전 월
     */
    previousMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11
        this.selectedYear--
      } else {
        this.selectedMonth--
      }
    },

    /**
     * 다음 월
     */
    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0
        this.selectedYear++
      } else {
        this.selectedMonth++
      }
    },

    /**
     * DuckHu 일정 상세보기
     */
    openDuckHuScheduleDetail(schedule) {
      this.selectedDuckHuSchedules = [schedule]
      this.showDuckHuDetailModal = true
    },

    /**
     * DuckHu 상세보기 모달 닫기
     */
    closeDuckHuDetailModal() {
      this.showDuckHuDetailModal = false
      this.selectedDuckHuSchedules = []
    },

    /**
     * DuckHu 툴팁 표시
     */
    showDuckHuEventTooltip(schedule, event) {
      this.duckHuTooltip = {
        show: true,
        x: event.clientX + 10,
        y: event.clientY - 30,
        schedule: schedule
      }
    },

    /**
     * DuckHu 툴팁 숨기기
     */
    hideDuckHuTooltip() {
      this.duckHuTooltip.show = false
    },

    /**
     * DuckHu 브라우저 알림 권한 요청
     */
    setupDuckHuNotifications() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('DuckHu 캘린더 알림 권한이 허용되었습니다.')
          } else {
            console.log('DuckHu 캘린더 알림 권한이 거부되었습니다.')
          }
        })
      }
    },

    /**
     * DuckHu 알림 예약
     */
    scheduleDuckHuNotifications() {
      // 기존 알림 제거
      if (this.duckHuNotificationTimers) {
        this.duckHuNotificationTimers.forEach(timer => clearTimeout(timer))
        this.duckHuNotificationTimers = []
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        const now = new Date()

        this.duckHuSchedules.forEach(schedule => {
          if (schedule.startTime) {
            const scheduleDateTime = new Date(`${schedule.startDate}T${schedule.startTime}`)
            const notificationTime = new Date(scheduleDateTime.getTime() - 10 * 60 * 1000) // 10분 전

            if (notificationTime > now) {
              const timeout = notificationTime.getTime() - now.getTime()

              const timer = setTimeout(() => {
                new Notification(`📅 일정 알림`, {
                  body: `${schedule.title}\n10분 후 시작됩니다.`,
                  icon: '/favicon.ico',
                  tag: `schedule-${schedule.id}`
                })
              }, timeout)

              this.duckHuNotificationTimers.push(timer)
            }
          }
        })
      }
    },

    /**
     * 특정 날짜의 일정들 반환 (우선순위 정렬 포함)
     */
    getDuckHuSchedulesForDay(date) {
      return this.duckHuSchedules
        .filter(schedule => {
          return schedule.startDate <= date && schedule.endDate >= date
        })
        .sort((a, b) => {
          // 1차: 우선순위 순
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }
          // 2차: 시작일 순
          if (a.startDate !== b.startDate) {
            return a.startDate.localeCompare(b.startDate)
          }
          // 3차: 시작시간 순 (있는 경우)
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime)
          }
          return 0
        })
    },

    /**
     * 모바일에서 사용할 축약된 이벤트 제목
     */
    getMobileEventTitle(title, maxLength = 8) {
      if (!title) return ''
      return title.length > maxLength
        ? title.substring(0, maxLength) + '...'
        : title
    },

    /**
     * 디바이스가 모바일인지 확인
     */
    isMobile() {
      return window.innerWidth <= 768
    },

    /**
     * 특정 날짜의 하루짜리 일정들만 반환 (여러 날 걸친 일정 제외)
     */
    getSingleDaySchedulesForDay(date) {
      return this.duckHuSchedules
        .filter(schedule => {
          // 해당 날짜에 포함되면서 하루짜리 일정인 것만
          return schedule.startDate <= date &&
                schedule.endDate >= date &&
                schedule.startDate === schedule.endDate // 하루짜리 일정만
        })
        .sort((a, b) => {
          // 우선순위 순으로 정렬
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime)
          }
          return 0
        })
    },

    /**
     * 특정 날짜의 여러 날 걸친 일정들만 반환
     */
    getMultiDaySchedulesForDay(date) {
      return this.duckHuSchedules
        .filter(schedule => {
          // 해당 날짜에 포함되면서 여러 날 걸친 일정인 것만
          return schedule.startDate <= date &&
                schedule.endDate >= date &&
                schedule.startDate !== schedule.endDate // 여러 날 걸친 일정만
        })
        .sort((a, b) => {
          // 우선순위 순으로 정렬
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }
          return a.startDate.localeCompare(b.startDate)
        })
    },

    /**
     * 특정 주에 해당하는 이벤트들 반환 (여러 날 걸친 일정만 처리)
     */
    getDuckHuEventsForWeek(week, weekIndex) {
      const weekStart = week[0].fullDate
      const weekEnd = week[6].fullDate
      const events = []

      // 여러 날에 걸친 일정만 필터링
      const multiDaySchedules = this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= weekEnd &&
              schedule.endDate >= weekStart &&
              schedule.startDate !== schedule.endDate // 여러 날 걸친 일정만
      })

      // 우선순위와 시작일로 정렬
      multiDaySchedules.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        return a.startDate.localeCompare(b.startDate)
      })

      // 일정별로 적절한 행(row) 배치
      const rowAssignments = []

      multiDaySchedules.forEach((schedule) => {
        const eventStartDate = schedule.startDate > weekStart ? schedule.startDate : weekStart
        const eventEndDate = schedule.endDate < weekEnd ? schedule.endDate : weekEnd

        const startDayIndex = week.findIndex(day => day.fullDate === eventStartDate)
        const endDayIndex = week.findIndex(day => day.fullDate === eventEndDate)

        if (startDayIndex !== -1 && endDayIndex !== -1) {
          // 겹치지 않는 행 찾기
          let assignedRow = this.findAvailableRow(rowAssignments, startDayIndex, endDayIndex)

          // 행 정보 저장
          rowAssignments.push({
            schedule: schedule,
            startDay: startDayIndex,
            endDay: endDayIndex,
            row: assignedRow
          })

          // 4개 이상 겹치는 경우 무지개 색상 적용
          const overlappingCount = this.getOverlappingCount(schedule, multiDaySchedules, eventStartDate, eventEndDate)
          const isRainbow = overlappingCount >= 4

          events.push({
            schedule: schedule,
            weekIndex: weekIndex,
            rowIndex: assignedRow,
            startDayIndex: startDayIndex,
            endDayIndex: endDayIndex,
            isStart: schedule.startDate === eventStartDate,
            isEnd: schedule.endDate === eventEndDate,
            showTitle: schedule.startDate === eventStartDate,
            isRainbow: isRainbow,
            overlappingCount: overlappingCount
          })
        }
      })

      return events
    },

    /**
     * 사용 가능한 행(row) 찾기 - 겹치지 않는 위치 결정
     */
    findAvailableRow(rowAssignments, startDay, endDay) {
      let row = 0

      while (true) {
        // 현재 행에서 겹치는 일정이 있는지 확인
        const hasConflict = rowAssignments.some(assignment =>
          assignment.row === row &&
          !(endDay < assignment.startDay || startDay > assignment.endDay)
        )

        if (!hasConflict) {
          return row
        }

        row++

        // 최대 4개 행까지만 허용
        if (row >= 4) {
          return 3
        }
      }
    },

    /**
     * 특정 일정과 겹치는 일정 개수 계산
     */
    getOverlappingCount(targetSchedule, allSchedules, eventStartDate, eventEndDate) {
      return allSchedules.filter(schedule => {
        if (schedule.id === targetSchedule.id) return false

        const scheduleStart = schedule.startDate > eventStartDate ? schedule.startDate : eventStartDate
        const scheduleEnd = schedule.endDate < eventEndDate ? schedule.endDate : eventEndDate

        return !(scheduleEnd < eventStartDate || scheduleStart > eventEndDate)
      }).length + 1 // 자기 자신 포함
    },

    /**
     * DuckHu 이벤트 스타일 계산 (겹침 처리 개선)
     */
    getDuckHuEventStyle(event, weekIndex) {
      const baseMargin = 2
      const rowHeight = this.DUCKHU_EVENT_HEIGHT + baseMargin + 2

      const top = weekIndex * this.DUCKHU_CELL_HEIGHT + 35 + (event.rowIndex * rowHeight)
      const left = event.startDayIndex * this.DUCKHU_CELL_WIDTH + 2
      const width = (event.endDayIndex - event.startDayIndex + 1) * this.DUCKHU_CELL_WIDTH - 6

      let backgroundColor = event.schedule.color || '#3498db'
      let animation = 'none'

      // 4개 이상 겹치는 경우 무지개 색상
      if (event.isRainbow) {
        backgroundColor = 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #dda0dd)'
        animation = 'rainbow-flow 3s ease-in-out infinite'
      }
      // 우선순위가 높은 일정은 시각적으로 강조
      else if (event.schedule.priority === 1) {
        backgroundColor = 'linear-gradient(45deg, #ff6b6b, #ff8e53)'
        animation = 'shimmer 2s ease-in-out infinite'
      }

      return {
        position: 'absolute',
        top: top + 'px',
        left: left + 'px',
        width: width + 'px',
        height: this.DUCKHU_EVENT_HEIGHT + 'px',
        backgroundColor: backgroundColor,
        color: 'white',
        fontSize: '11px',
        fontWeight: '500',
        textAlign: 'left',
        backgroundSize: event.isRainbow ? '200% 100%' : (event.schedule.priority === 1 ? '400% 400%' : 'auto'),
        animation: animation,
        borderRadius: event.isStart && event.isEnd ? '4px' :
                    event.isStart ? '4px 0 0 4px' :
                    event.isEnd ? '0 4px 4px 0' : '0',
        zIndex: 10 + event.rowIndex,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: event.isStart ? '6px' : '2px',
        paddingRight: event.isEnd ? '6px' : '2px',
        overflow: 'hidden',
        border: event.isRainbow ? '2px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: event.isRainbow ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease'
      }
    }
  }
}
</script>

<style scoped>
/* 전체 캘린더 컨테이너 */
.duckhu-calendar {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  margin: 20px auto;
  max-width: 1200px;
}

/* 캘린더 헤더 */
.calendar-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.desktop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-header {
  display: none;
}

.month-year-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.month-year-selector select {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  background: white;
  font-size: 16px;
  cursor: pointer;
}

.nav-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  min-width: 80px;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 캘린더 컨테이너 */
.calendar-container {
  position: relative;
  background: white;
}

/* 요일 헤더 */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
}

.weekday-cell {
  padding: 15px;
  text-align: center;
  font-weight: bold;
  color: #495057;
  font-size: 14px;
  border-right: 1px solid #e9ecef;
}

.weekday-cell:first-child {
  color: #dc3545; /* 일요일 */
}

.weekday-cell:last-child {
  color: #007bff; /* 토요일 */
  border-right: none;
}

/* 캘린더 본체 */
.calendar-body {
  position: relative;
  min-height: 600px;
}

/* 날짜 그리드 */
.date-grid {
  position: relative;
  z-index: 1;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #e9ecef;
}

.date-cell {
  height: 120px;
  padding: 8px;
  border-right: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.date-cell:last-child {
  border-right: none;
}

.date-cell:hover {
  background-color: #f8f9fa;
}

.date-cell.today {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.date-cell.other-month {
  background: #f8f9fa;
  color: #adb5bd;
}

/* 일요일 스타일 */
.date-cell.sunday .date-number {
  color: #dc3545;
  font-weight: bold;
}

/* 토요일 스타일 */
.date-cell.saturday .date-number {
  color: #007bff;
  font-weight: bold;
}

/* 공휴일이 있는 날짜 스타일 */
.date-cell.has-holiday {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

/* 날짜 숫자 */
.date-number {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  flex-shrink: 0;
}

/* 공휴일 정보 표시 */
.holiday-info {
  margin-bottom: 4px;
  flex-shrink: 0;
}

.holiday-main {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.holiday-name {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
}

.holiday-count {
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.holiday-count:hover {
  background: #e55656;
  transform: scale(1.1);
}

/* 일정 개수 표시 */
.schedule-count {
  font-size: 11px;
  color: #6c757d;
  margin-top: auto;
  text-align: center;
  background: rgba(108, 117, 125, 0.1);
  border-radius: 4px;
  padding: 2px 4px;
}

/* 일정 표시 레이어 */
.events-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.events-week {
  position: relative;
}

/* 이벤트 아이템 스타일 */
.event-item {
  position: absolute;
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  z-index: 10;
  cursor: pointer;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  pointer-events: auto;
}

.event-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

/* 이벤트 텍스트 */
.event-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
  flex: 1;
}

/* 이벤트 시간 표시 */
.event-time {
  font-size: 10px;
  opacity: 0.9;
  margin-right: 4px;
  white-space: nowrap;
}

/* 이벤트 제목 */
.event-title {
  font-size: 11px;
  font-weight: 500;
}

.event-title.with-time {
  font-size: 10px;
}

/* 4개 이상 겹치는 일정 무지개 효과 */
.event-item.rainbow-event {
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #dda0dd) !important;
  background-size: 200% 100% !important;
  animation: rainbow-flow 3s ease-in-out infinite !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  font-weight: 600;
}

/* 우선순위 높은 일정 스타일 */
.event-item.high-priority {
  background: linear-gradient(45deg, #ff6b6b, #ff8e53) !important;
  background-size: 400% 400% !important;
  animation: shimmer 2s ease-in-out infinite !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  font-weight: 600;
}

/* 모바일에서 이벤트 표시 */
.mobile-event {
  position: relative;
  margin-bottom: 1px;
  height: 14px;
  font-size: 10px;
  border-radius: 2px;
  padding: 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-event:hover {
  transform: scale(1.05);
  z-index: 10;
}

/* 더 많은 이벤트가 있을 때 표시 */
.more-events {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;
  z-index: 10;
  cursor: pointer;
  transition: background 0.2s ease;
}

.more-events:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* 날짜 이벤트 컨테이너 */
.date-events {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 2px;
  max-height: calc(100% - 20px);
  overflow: hidden;
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #6c757d;
}

/* 에러 상태 */
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #dc3545;
  text-align: center;
  padding: 20px;
}

/* 공휴일 모달 */
.holiday-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.holiday-modal-content {
  background: white;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.holiday-modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.holiday-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.holiday-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.holiday-modal-body {
  padding: 20px;
}

.holiday-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  gap: 12px;
}

.holiday-type {
  background: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.holiday-details {
  flex: 1;
}

.holiday-title {
  font-size: 16px;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 4px;
}

.holiday-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.4;
}

/* 툴팁 */
.event-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1001;
  pointer-events: none;
  max-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-date,
.tooltip-time {
  font-size: 11px;
  opacity: 0.9;
}

/* 애니메이션 */
@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes rainbow-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .desktop-header {
    display: none;
  }

  .mobile-header {
    display: block;
  }

  .mobile-nav-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .mobile-nav-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    flex: 0 0 auto;
  }

  .mobile-select {
    padding: 6px 8px;
    border: none;
    border-radius: 5px;
    background: white;
    font-size: 14px;
    cursor: pointer;
    flex: 1;
  }

  .duckhu-calendar {
    margin: 10px;
    border-radius: 8px;
  }

  .calendar-header {
    padding: 15px;
  }

  .weekday-cell {
    padding: 10px 4px;
    font-size: 12px;
  }

  .date-cell {
    height: 80px !important;
    padding: 4px !important;
    font-size: 12px;
  }

  /* 모바일에서 이벤트 표시 최적화 */
  .duckhu-event {
    height: 16px !important;
    font-size: 10px !important;
    padding: 0 4px !important;
    line-height: 16px !important;
    border-radius: 2px !important;
    margin-bottom: 1px !important;
  }

  .duckhu-event-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    display: block;
  }

  /* 모바일에서 주간 행 간격 조정 */
  .week-row {
    border-bottom: 1px solid #e9ecef;
    min-height: 80px;
  }

  /* 날짜 숫자 표시 개선 */
  .date-number {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 2px;
    position: sticky;
    top: 2px;
    z-index: 5;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 1px 4px;
    display: inline-block;
    line-height: 1.2;
  }

  /* 이벤트 컨테이너 */
  .date-events {
    position: relative;
    height: calc(100% - 20px);
    overflow: hidden;
  }

  /* 더 많은 이벤트가 있을 때 표시 */
  .more-events {
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 2px;
    z-index: 10;
  }

  /* 오늘 날짜 하이라이트 */
  .date-cell.today {
    background-color: rgba(102, 126, 234, 0.1);
  }

  .date-cell.today .date-number {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  /* 다른 달 날짜 */
  .date-cell.other-month {
    opacity: 0.3;
  }

  .holiday-name {
    font-size: 10px;
    max-width: 50px;
  }

  .holiday-count {
    font-size: 9px;
    padding: 1px 3px;
  }

  .schedule-count {
    font-size: 10px;
  }

  .event-item {
    font-size: 11px;
  }

  .event-time {
    font-size: 10px;
  }

  .event-title {
    font-size: 10px;
  }

  .event-title.with-time {
    font-size: 9px;
  }

  .holiday-modal {
    width: 95%;
    margin: 10px;
  }

  .holiday-modal-header {
    padding: 15px;
  }

  .holiday-modal-body {
    padding: 15px;
  }
}

/* 초소형 모바일 (480px 이하) */
@media (max-width: 480px) {
  .date-cell {
    height: 60px !important;
    padding: 2px !important;
  }

  .duckhu-event {
    height: 14px !important;
    font-size: 9px !important;
    padding: 0 2px !important;
    line-height: 14px !important;
  }

  .date-number {
    font-size: 10px;
  }

  /* 캘린더 헤더 조정 */
  .weekday-cell {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>
