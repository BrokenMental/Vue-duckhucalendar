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
        <div v-for="(day, index) in weekdays" :key="day"
             class="weekday-cell"
             :class="{
               'sunday-header': index === 0,
               'saturday-header': index === 6
             }">
          {{ day }}
        </div>
      </div>

      <!-- 캘린더 본체 -->
      <div class="calendar-body" ref="duckHuCalendarBody">
        <!-- 날짜 그리드 -->
        <div class="date-grid">
          <div class="week-row" v-for="(week, weekIndex) in duckHuCalendarWeeks" :key="weekIndex">
            <!-- 날짜 셀들만 -->
            <div
              v-for="(day, dayIndex) in week"
              :key="day.fullDate"
              class="date-cell"
              :data-date="day.fullDate"
              :class="{
                'today': isDuckHuToday(new Date(day.fullDate + 'T00:00:00')),
                'other-month': day.isOtherMonth,
                'current-month': day.isCurrentMonth,
                'sunday': dayIndex === 0,
                'saturday': dayIndex === 6,
                'has-holiday': getHolidaysForDay(day.fullDate).length > 0,
                'highlighted': day.fullDate === highlightedDate,
                'blink-animation': day.fullDate === highlightedDate && highlightAnimation
              }"
              @click="handleDateCellClick(day)"
            >
              <!-- 주차 표시 - 매주 첫번째 날(일요일)에만 표시 -->
              <div v-if="dayIndex === 0 && getWeekNumberOfMonth(weekIndex) > 0" class="week-indicator"
                  :class="{ 'has-events': getTotalWeekScheduleCount(weekIndex) > 0 }">
                <span class="week-number">{{ getWeekNumberOfMonth(weekIndex) }}주차</span>
                <span v-if="getTotalWeekScheduleCount(weekIndex) > 0"
                      class="event-count">{{ getTotalWeekScheduleCount(weekIndex) }}개</span>
              </div>

              <!-- 날짜 숫자와 일정 개수를 한 줄에 -->
              <div class="date-header">
                <div class="date-number"
                    :class="{
                      'sunday-text': dayIndex === 0,
                      'saturday-text': dayIndex === 6,
                      'holiday-text': getHolidaysForDay(day.fullDate).length > 0,
                      'other-month-text': day.isOtherMonth
                    }">
                  {{ day.dateNumber }}
                </div>

                <!-- 일정 개수 표시를 일자 옆으로 이동 -->
                <div v-if="getTotalScheduleCountForDay(day.fullDate, weekIndex) > 0" class="schedule-count-inline">
                  {{ getTotalScheduleCountForDay(day.fullDate, weekIndex) }} 개
                </div>
              </div>

              <!-- Today 라벨 -->
              <div v-if="isDuckHuToday(new Date(day.fullDate + 'T00:00:00'))" class="today-label">
                Today
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
              <div class="date-events" :style="getDateEventsStyle(weekIndex, dayIndex, day.fullDate)">
                <!-- 표시 가능한 단기 일정만 표시 -->
                <div
                  v-for="(schedule, eventIndex) in getDisplayableSingleDaySchedules(day.fullDate, weekIndex)"
                  :key="eventIndex"
                  class="mobile-event"
                  :style="{ backgroundColor: schedule.color || '#3498db' }"
                  @click.stop="openDuckHuScheduleDetail(schedule)"
                  @mouseenter="showDuckHuEventTooltip(schedule, $event)"
                  @mouseleave="hideDuckHuTooltip"
                >
                  <span class="event-text">{{ schedule.title }}</span>
                </div>

                <!-- 더 많은 일정이 있을 때 - 총 일정 개수 기준 -->
                <div
                  v-if="getTotalScheduleCountForDay(day.fullDate, weekIndex) > 2"
                  class="more-events"
                  @click.stop="showDuckHuDaySchedules(day.fullDate)"
                >
                  +{{ getTotalScheduleCountForDay(day.fullDate, weekIndex) - 2 }}개
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 전체 캘린더에 대한 이벤트 레이어 -->
        <div class="global-events-layer">
          <div
            v-for="(events, weekIndex) in allWeekEvents"
            :key="`week-${weekIndex}`"
            class="week-events-container"
            :style="getWeekContainerStyle(weekIndex)"
          >
            <!-- 주차 표시 기능을 제거 - 이제 date-cell 안에 있음 -->

            <div
              v-for="event in events"
              :key="event.key"
              class="event-item"
              :style="getDuckHuEventStyle(event)"
              :data-event-id="event.schedule.id"
              :data-week="weekIndex"
              :data-row="event.rowIndex"
              @click="openDuckHuScheduleDetail(event.schedule)"
              @mouseenter="showDuckHuEventTooltip(event.schedule, $event)"
              @mouseleave="hideDuckHuTooltip"
            >
              <div class="event-content">
                <span v-if="event.isStart && event.schedule.startTime" class="event-time">
                  {{ event.schedule.startTime }}
                </span>
                <span class="event-title" :class="{ 'with-time': event.isStart && event.schedule.startTime }">
                  {{ event.isRainbow ? `${getEventCountText(event.eventCount)}` : event.schedule.title }}
                </span>
              </div>
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
    <div v-if="showHolidayDetailModal" class="holiday-modal-backdrop" @click.self="closeHolidayDetailModal">
      <div class="holiday-modal">
        <div class="holiday-modal-header">
          <h3>{{ formatDateForDisplay(selectedHolidayDate) }} 공휴일</h3>
          <button @click="closeHolidayDetailModal" class="modal-close-btn">&times;</button>
        </div>
        <div class="holiday-modal-body">
          <div v-for="holiday in selectedDateHolidays" :key="holiday.id" class="holiday-detail-item">
            <div class="holiday-detail-header">
              <span class="holiday-detail-name">{{ holiday.name }}</span>
              <span class="holiday-detail-type">{{ getHolidayTypeDisplayName(holiday.holidayType) }}</span>
            </div>
            <div v-if="holiday.description" class="holiday-description">{{ holiday.description }}</div>
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
      duckHuNotificationTimers: [],

      // 리사이즈 핸들러
      resizeHandler: null,

      // 주차별 이벤트 캐시
      cachedWeekEvents: null,

      // 하이라이트 관련
      highlightedDate: null,
      highlightAnimation: false,
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
    },

    /**
     * 모든 주차의 이벤트를 computed로 관리 (반응성 최적화)
     */
    allWeekEvents() {
      if (!this.cachedWeekEvents || !this.duckHuSchedules.length) {
        return {}
      }
      return this.cachedWeekEvents
    },

    /**
     * 각 주차별 최대 이벤트 행 수 계산
     */
    maxEventRowsByWeek() {
      const maxRows = {}

      Object.keys(this.allWeekEvents).forEach(weekIndex => {
        const events = this.allWeekEvents[weekIndex] || []
        const maxRow = events.reduce((max, event) => {
          return Math.max(max, event.rowIndex)
        }, -1)

        // 행 인덱스는 0부터 시작하므로 실제 행 수는 +1
        maxRows[weekIndex] = maxRow >= 0 ? maxRow + 1 : 0
      })

      return maxRows
    }
  },

  watch: {
    selectedYear() {
      this.generateDuckHuCalendar()
      this.loadDuckHuSchedules()
      this.loadHolidays()
      // 연도 변경 후 셀 너비 재계산
      setTimeout(() => {
        this.calculateDuckHuCellWidth()
      }, 100)
    },
    selectedMonth() {
      this.generateDuckHuCalendar()
      this.loadDuckHuSchedules()
      this.loadHolidays()
      // 월 변경 후 셀 너비 재계산
      setTimeout(() => {
        this.calculateDuckHuCellWidth()
      }, 100)
    },
    // 일정 배열 길이 변경 감지 (성능 최적화)
    'duckHuSchedules.length'() {
      if (this.duckHuSchedules.length >= 0) {
        this.$nextTick(() => {
          this.updateEventCache()
        })
      }
    }
  },

  async mounted() {
    console.log('🚀 DuckHu 캘린더 초기화 시작')

    this.generateDuckHuCalendar()
    await Promise.all([
      this.loadDuckHuSchedules(),
      this.loadHolidays()
    ])

    // 일정 로드 완료 후 캐시 생성
    this.$nextTick(() => {
      this.updateEventCache()
      console.log('✅ 캘린더 초기화 완료')
    })

    // 셀 너비 계산을 여러 번 시도하여 DOM이 완전히 렌더링된 후 실행
    const calculateCellWidthWithRetry = () => {
      this.calculateDuckHuCellWidth()
      // 셀 너비가 제대로 계산되지 않은 경우 재시도
      if (!this.DUCKHU_CELL_WIDTH || this.DUCKHU_CELL_WIDTH === 0) {
        setTimeout(calculateCellWidthWithRetry, 100)
      }
    }

    setTimeout(calculateCellWidthWithRetry, 100)

    this.setupDuckHuNotifications()
    this.scheduleDuckHuNotifications()

    // 리사이즈 이벤트 핸들러 등록
    this.resizeHandler = () => {
      setTimeout(() => {
        this.calculateDuckHuCellWidth()
      }, 100) // 리사이즈 후 약간의 딜레이
    }
    window.addEventListener('resize', this.resizeHandler)
  },

  beforeUnmount() {
    // 리사이즈 이벤트 핸들러 제거
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }

    // 알림 타이머 정리
    if (this.duckHuNotificationTimers) {
      this.duckHuNotificationTimers.forEach(timer => clearTimeout(timer))
    }
  },

  methods: {
    /**
     * 날짜 셀 클릭 핸들러 (이전/다음달 날짜 클릭시 해당 달로 이동)
     */
    handleDateCellClick(day) {
      // 다른 달의 날짜를 클릭한 경우 해당 달로 이동
      if (day.isOtherMonth) {
        const clickedDate = new Date(day.fullDate + 'T00:00:00')
        this.selectedYear = clickedDate.getFullYear()
        this.selectedMonth = clickedDate.getMonth()
        return
      }

      // 현재 달의 날짜를 클릭한 경우 일정 목록 표시
      this.showDuckHuDaySchedules(day.fullDate)
    },

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
            dateNumber: current.getDate(),
            dateObject: new Date(current),
            fullDate: this.formatDuckHuDate(current),
            isCurrentMonth: current.getFullYear() === year && current.getMonth() === month,
            isOtherMonth: current.getFullYear() !== year || current.getMonth() !== month,
            isToday: this.isDuckHuToday(current),
            key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
          })
        }
        weeks.push(week)
        currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      }

      this.duckHuCalendarWeeks = weeks

      // 캘린더 구조가 변경되었으므로 이벤트 캐시 무효화
      this.cachedWeekEvents = null
    },

    /**
     * 현재 화면 크기에 따른 셀 높이 반환
     */
    getCurrentCellHeight() {
      if (window.innerWidth <= 480) {
        return 75
      } else if (window.innerWidth <= 768) {
        return 90
      } else {
        return 120
      }
    },

    /**
     * 캘린더 셀 너비 계산 개선
     */
    calculateDuckHuCellWidth() {
      this.$nextTick(() => {
        const container = this.$refs.duckHuCalendarContainer
        if (container) {
          const containerWidth = container.clientWidth
          this.DUCKHU_CELL_WIDTH = containerWidth / 7
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
        const startDate = new Date(this.selectedYear, this.selectedMonth, 1)
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, 0)

        const calendarStart = new Date(startDate)
        calendarStart.setDate(calendarStart.getDate() - startDate.getDay())

        const calendarEnd = new Date(endDate)
        calendarEnd.setDate(calendarEnd.getDate() + (6 - endDate.getDay()))

        const startDateStr = this.formatDuckHuDate(calendarStart)
        const endDateStr = this.formatDuckHuDate(calendarEnd)

        const response = await holidayAPI.getHolidaysByDateRange(startDateStr, endDateStr)

        let holidays = []
        if (response && response.holidays && Array.isArray(response.holidays)) {
          holidays = response.holidays
        } else if (Array.isArray(response)) {
          holidays = response
        }

        this.holidaysByDate = holidayUtils.groupHolidaysByDate(holidays)

        console.log(`✅ ${holidays.length}개의 공휴일을 로드했습니다.`)

      } catch (error) {
        console.error('❌ 공휴일 로드 실패:', error)
        this.holidaysByDate = {}
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
        const startDate = new Date(this.selectedYear, this.selectedMonth, 1)
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, 0)

        const calendarStart = new Date(startDate)
        calendarStart.setDate(calendarStart.getDate() - startDate.getDay())

        const calendarEnd = new Date(endDate)
        calendarEnd.setDate(calendarEnd.getDate() + (6 - endDate.getDay()))

        const startDateStr = this.formatDuckHuDate(calendarStart)
        const endDateStr = this.formatDuckHuDate(calendarEnd)

        const response = await scheduleAPI.getSchedulesByDateRange({
          startDate: startDateStr,
          endDate: endDateStr
        })

        this.duckHuSchedules = response.schedules || response || []

        console.log(`✅ ${this.duckHuSchedules.length}개의 일정을 로드했습니다.`)

        this.scheduleDuckHuNotifications()

      } catch (error) {
        console.error('❌ 일정 로드 실패:', error)
        this.error = '일정을 불러오는데 실패했습니다.'
        this.duckHuSchedules = []
      } finally {
        this.loading = false
      }
    },

    /**
     * 특정 날짜의 일정 개수 반환
     */
    getDuckHuScheduleCountForDay(date) {
      return this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= date && schedule.endDate >= date
      }).length
    },

    /**
     * 단일 날짜 일정만 반환 (모바일 표시용)
     */
    getSingleDaySchedulesForDay(date) {
      return this.duckHuSchedules.filter(schedule => {
        return schedule.startDate === date && schedule.endDate === date
      })
    },

    /**
     * 무지개 색상 텍스트 반환
     */
    getDuckHuRainbowText(count) {
      return count > 4 ? `${count}🌈` : count
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
          }
        })
      }
    },

    /**
     * DuckHu 알림 스케줄링
     */
    scheduleDuckHuNotifications() {
      // 기존 타이머 제거
      if (this.duckHuNotificationTimers) {
        this.duckHuNotificationTimers.forEach(timer => clearTimeout(timer))
      }
      this.duckHuNotificationTimers = []

      const now = new Date()

      this.duckHuSchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.startDate + 'T00:00:00')

        // 오늘과 내일 일정만 알림 설정
        if (scheduleDate >= now && scheduleDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
          let notificationTime

          if (schedule.startTime) {
            // 시작 시간이 있으면 그 시간에 알림
            const [hours, minutes] = schedule.startTime.split(':')
            notificationTime = new Date(scheduleDate)
            notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          } else {
            // 시작 시간이 없으면 오전 9시에 알림
            notificationTime = new Date(scheduleDate)
            notificationTime.setHours(9, 0, 0, 0)
          }

          const timeUntilNotification = notificationTime.getTime() - now.getTime()

          if (timeUntilNotification > 0) {
            const timer = setTimeout(() => {
              this.showDuckHuNotification(schedule)
            }, timeUntilNotification)

            this.duckHuNotificationTimers.push(timer)
          }
        }
      })
    },

    /**
     * DuckHu 알림 표시
     */
    showDuckHuNotification(schedule) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeText = schedule.startTime ? `${schedule.startTime}` : '종일'

        new Notification(`📅 ${schedule.title}`, {
          body: `${this.formatDuckHuDateRange(schedule)} ${timeText}`,
          icon: '/favicon.ico',
          tag: `schedule-${schedule.id}`
        })
      }
    },

    /**
     * 이벤트 캐시 업데이트
     */
    updateEventCache() {
      this.cachedWeekEvents = this.calculateAllWeekEvents()
      console.log('🎯 이벤트 캐시 업데이트 완료')
    },

    /**
    * 모든 주차의 이벤트를 미리 계산
    */
    calculateAllWeekEvents() {
      const allWeekEvents = {}

      // 1. 먼저 모든 장기 일정을 수집하고 전역 행 번호 할당
      const globalRowAssignments = this.assignGlobalRows()

      // 2. 각 주차별로 이벤트 배치
      this.duckHuCalendarWeeks.forEach((week, weekIndex) => {
        allWeekEvents[weekIndex] = this.calculateEventsForWeek(week, weekIndex, globalRowAssignments)
      })

      return allWeekEvents
    },

    /**
     * 모든 장기 일정에 전역 행 번호 할당
     */
    assignGlobalRows() {
      const globalRowAssignments = new Map() // scheduleId -> rowIndex
      const allLongSchedules = this.duckHuSchedules.filter(schedule =>
        schedule.startDate !== schedule.endDate
      )

      // 시작일 기준으로 정렬
      allLongSchedules.sort((a, b) => {
        const dateCompare = a.startDate.localeCompare(b.startDate)
        if (dateCompare !== 0) return dateCompare

        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        return a.title.localeCompare(b.title)
      })

      const usedRows = [] // 각 행별로 사용 중인 기간 저장

      allLongSchedules.forEach(schedule => {
        let assignedRow = 0

        // 겹치지 않는 행 찾기
        while (assignedRow < 10) {
          const hasConflict = usedRows[assignedRow] && usedRows[assignedRow].some(period => {
            return !(schedule.endDate < period.start || schedule.startDate > period.end)
          })

          if (!hasConflict) {
            // 해당 행에 일정 기간 추가
            if (!usedRows[assignedRow]) {
              usedRows[assignedRow] = []
            }
            usedRows[assignedRow].push({
              start: schedule.startDate,
              end: schedule.endDate,
              scheduleId: schedule.id
            })

            globalRowAssignments.set(schedule.id, assignedRow)
            break
          }

          assignedRow++
        }

        if (assignedRow >= 10) {
          globalRowAssignments.set(schedule.id, 9)
        }
      })

      return globalRowAssignments
    },

    /**
     * 특정 주의 이벤트만 계산하는 순수 함수 (전역 행 정보 사용)
     */
    calculateEventsForWeek(week, weekIndex, globalRowAssignments) {
      const weekStart = week[0].fullDate
      const weekEnd = week[6].fullDate
      const events = []

      // 이 주차에 걸쳐있는 여러 날 일정들만 필터링
      const weekMultiDaySchedules = this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= weekEnd &&
              schedule.endDate >= weekStart &&
              schedule.startDate !== schedule.endDate
      })

      weekMultiDaySchedules.forEach((schedule) => {
        // 이 주차에서 보여질 이벤트의 시작일과 종료일
        const eventStartDate = schedule.startDate > weekStart ? schedule.startDate : weekStart
        const eventEndDate = schedule.endDate < weekEnd ? schedule.endDate : weekEnd

        const startDayIndex = week.findIndex(day => day.fullDate === eventStartDate)
        const endDayIndex = week.findIndex(day => day.fullDate === eventEndDate)

        if (startDayIndex !== -1 && endDayIndex !== -1) {
          // 전역 행 번호 사용
          const assignedRow = globalRowAssignments.get(schedule.id) || 0

          // 겹치는 일정 개수 계산
          const overlappingCount = this.getOverlappingCount(schedule, weekMultiDaySchedules, eventStartDate, eventEndDate)
          const isRainbow = overlappingCount >= 4

          // 실제 이벤트 시작/종료 여부 확인
          const isActualStart = schedule.startDate === eventStartDate
          const isActualEnd = schedule.endDate === eventEndDate

          events.push({
            schedule: schedule,
            weekIndex: weekIndex,
            rowIndex: assignedRow,
            startDayIndex: startDayIndex,
            endDayIndex: endDayIndex,
            isStart: isActualStart,
            isEnd: isActualEnd,
            showTitle: isActualStart,
            isRainbow: isRainbow,
            overlappingCount: overlappingCount,
            eventCount: overlappingCount,
            key: `${schedule.id}-week${weekIndex}-row${assignedRow}`
          })
        }
      })

      return events
    },

    /**
     * 특정 주에 해당하는 이벤트들 반환 (캐시된 결과 사용 - 백업용)
     */
    getDuckHuEventsForWeek(week, weekIndex) {
      // computed 속성 사용으로 이 함수는 백업용으로만 사용
      if (this.allWeekEvents && this.allWeekEvents[weekIndex]) {
        return this.allWeekEvents[weekIndex]
      }

      // 캐시가 없으면 빈 배열 반환
      return []
    },

    /**
     * 사용 가능한 행(row) 찾기 - 겹치지 않는 위치 결정
     */
    findAvailableRow(rowAssignments, startDay, endDay) {
      let row = 0

      while (row < 10) { // 최대 10개 행까지 허용
        // 현재 행에서 겹치는 일정이 있는지 정확하게 확인
        const hasConflict = rowAssignments.some(assignment => {
          if (assignment.row !== row) return false

          // 겹침 조건을 더 엄격하게: 하루라도 겹치면 안됨
          // startDay <= assignment.endDay && endDay >= assignment.startDay 이면 겹침
          return !(endDay < assignment.startDay || startDay > assignment.endDay)
        })

        if (!hasConflict) {
          return row
        } else {
          console.log(`❌ 행 ${row} 겹침: ${startDay}-${endDay}`)
        }

        row++
      }

      console.log(`⚠️ 최대 행 수 초과, 마지막 행 사용: ${startDay}-${endDay}`)
      return 9
    },

    /**
     * 특정 일정과 겹치는 일정 개수 계산
     */
    getOverlappingCount(targetSchedule, allSchedules, eventStartDate, eventEndDate) {
      return allSchedules.filter(schedule => {
        if (schedule.id === targetSchedule.id) return false

        const scheduleStart = schedule.startDate > eventStartDate ? schedule.startDate : eventStartDate
        const scheduleEnd = schedule.endDate < eventEndDate ? schedule.endDate : eventEndDate

        return !(scheduleEnd < scheduleStart)
      }).length + 1
    },

    /**
     * 주차별 컨테이너 위치 스타일 계산
     */
    getWeekContainerStyle(weekIndex) {
      let cellHeight
      if (window.innerWidth <= 480) {
        cellHeight = 75 // 초소형 모바일
      } else if (window.innerWidth <= 768) {
        cellHeight = 90 // 모바일
      } else {
        cellHeight = 120 // PC
      }

      // ✅ 핵심 수정: border-bottom 1px 누적 고려
      const borderOffset = weekIndex * 1 // 각 week-row마다 border-bottom 1px씩 누적
      const top = (weekIndex * cellHeight) + borderOffset

      return {
        position: 'absolute',
        top: `${top}px`,
        left: '0',
        right: '0',
        height: `${cellHeight}px`,
        width: '100%',
        pointerEvents: 'none',
        zIndex: 2
      }
    },

    /**
     * 실제 date-events 영역의 DOM 위치 계산
     */
    getActualDateEventsPosition(weekIndex, dayIndex) {
      try {
        // 해당 셀의 date-events 요소를 찾기
        const weekRow = document.querySelectorAll('.week-row')[weekIndex]
        if (!weekRow) return 54 // 기본값

        const dateCell = weekRow.querySelectorAll('.date-cell')[dayIndex]
        if (!dateCell) return 54 // 기본값

        const dateEvents = dateCell.querySelector('.date-events')
        if (!dateEvents) return 54 // 기본값

        // 부모 date-cell 대비 date-events의 상대 위치 계산
        const cellRect = dateCell.getBoundingClientRect()
        const eventsRect = dateEvents.getBoundingClientRect()

        const relativeTop = eventsRect.top - cellRect.top

        return relativeTop
      } catch (error) {
        console.warn('DOM 위치 계산 실패:', error)
        // 실패시 기본값
        return window.innerWidth <= 768 ? 54 : 66
      }
    },

    /**
     * 이벤트 스타일 가져오기 - 주차별 상대 위치 계산
     */
    getDuckHuEventStyle(event) {
      // 셀 너비 계산 - 실시간으로 정확한 값 사용
      let cellWidth = this.DUCKHU_CELL_WIDTH
      if (!cellWidth || cellWidth === 0) {
        // 백업 계산
        const container = this.$refs.duckHuCalendarContainer
        if (container) {
          cellWidth = container.clientWidth / 7
        } else {
          cellWidth = window.innerWidth <= 768 ? (window.innerWidth - 40) / 7 : 150
        }
      }

      // 480px 이하에서 다른 이벤트 높이와 간격 사용
      const eventHeight = window.innerWidth <= 480 ? 14 :
                        window.innerWidth <= 768 ? 16 : 20;
      const eventMargin = window.innerWidth <= 480 ? 1 :
                        window.innerWidth <= 768 ? 1 : 2;

      // 이벤트의 위치와 크기 계산
      const left = event.startDayIndex * cellWidth
      const width = (event.endDayIndex - event.startDayIndex + 1) * cellWidth

      // ✅ 수정: PC에서는 모든 주차에 동일한 기준점 사용
      let baseTop = 0

      if (window.innerWidth > 768) {
        // PC 화면: 모든 주차에 일관된 기준점 사용
        baseTop += 16 // 주차 표시 높이
        baseTop += 16 // 공휴일 표시 높이
        baseTop += 4  // 기본 여백

      } else if (window.innerWidth > 480) {
        // 태블릿/모바일 (481-768px)
        baseTop += 12 // 주차 표시 높이
        baseTop += 14 // 공휴일 표시 높이
        baseTop += 2  // 기본 여백

      } else {
        // ✅ 초소형 모바일 (480px 이하) - 더 작은 값 사용
        baseTop += 8  // 주차 표시 높이 (작게)
        baseTop += 10 // 공휴일 표시 높이 (작게)
        baseTop += 1  // 기본 여백 (최소화)
      }

      const top = baseTop + (event.rowIndex * (eventHeight + eventMargin))

      // 무지개 색상 배경 설정
      const backgroundColor = event.isRainbow
        ? 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #fab1a0, #fd79a8)'
        : event.schedule.color || '#3498db'

      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(width - 2, 20)}px`,
        height: `${eventHeight}px`,
        background: backgroundColor,
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
        transition: 'all 0.2s ease',
        color: 'white',
        fontSize: window.innerWidth <= 768 ? '10px' : '12px',
        fontWeight: '500'
      }
    },

    /**
    * 월 내에서의 주차 번호 계산
    */
    getWeekNumberOfMonth(weekIndex) {
      const week = this.duckHuCalendarWeeks[weekIndex];
      if (!week) return 0;

      // 해당 주차에 현재 월의 일자가 있는지 확인
      const hasCurrentMonthDays = week.some(day => day.isCurrentMonth);

      // 현재 월 일자가 없으면 0주차 (이전/다음월)
      if (!hasCurrentMonthDays) {
        return 0;
      }

      // 현재 월의 주차 번호 계산
      let monthWeekNumber = 0;
      for (let i = 0; i <= weekIndex; i++) {
        const weekToCheck = this.duckHuCalendarWeeks[i];
        if (weekToCheck && weekToCheck.some(day => day.isCurrentMonth)) {
          monthWeekNumber++;
          if (i === weekIndex) return monthWeekNumber;
        }
      }

      return monthWeekNumber;
    },

    /**
     * 특정 일자에 지나가는 장기 일정 개수 계산
     */
    getLongEventCountForDay(date, weekIndex) {
      if (!this.allWeekEvents[weekIndex]) return 0

      return this.allWeekEvents[weekIndex].filter(event => {
        const week = this.duckHuCalendarWeeks[weekIndex]
        const dayIndex = week.findIndex(day => day.fullDate === date)

        // 해당 일자에 장기 일정이 지나가는지 확인
        return dayIndex >= event.startDayIndex && dayIndex <= event.endDayIndex
      }).length
    },

    /**
     * 특정 일자의 총 일정 개수 (장기 + 단기)
     */
    getTotalScheduleCountForDay(date, weekIndex) {
      const longEvents = this.getLongEventCountForDay(date, weekIndex)
      const singleDayEvents = this.getSingleDaySchedulesForDay(date).length

      return longEvents + singleDayEvents
    },

    /**
     * 표시할 단기 일정 목록 계산 (장기 일정 개수 고려)
     */
    getDisplayableSingleDaySchedules(date, weekIndex) {
      const longEventCount = this.getLongEventCountForDay(date, weekIndex)
      const singleDaySchedules = this.getSingleDaySchedulesForDay(date)

      // 총 2개까지만 표시 가능하므로, 장기 일정이 있으면 그만큼 빼기
      const maxDisplayable = Math.max(0, 2 - longEventCount)

      return singleDaySchedules.slice(0, maxDisplayable)
    },

    /**
     * date-events 영역의 동적 스타일 계산
     */
    getDateEventsStyle(weekIndex, dayIndex, date) {
      // 해당 일자에 실제로 지나가는 장기 일정 개수만 계산
      const longEventCount = this.getLongEventCountForDay(date, weekIndex)

      // 장기 일정이 없으면 marginTop 없음
      if (longEventCount === 0) {
        return {
          position: 'relative',
          zIndex: 20
        }
      }

      // PC/모바일별 이벤트 높이와 간격
      const eventHeight = window.innerWidth <= 768 ? 16 : 20
      const eventMargin = window.innerWidth <= 768 ? 1 : 2

      // 해당 일자의 장기 일정이 차지하는 총 높이 계산
      const longEventsTotalHeight = longEventCount * (eventHeight + eventMargin)

      // 기본 여백 + 해당 일자의 장기 일정 높이만큼 아래로 밀어내기
      const baseMarginTop = window.innerWidth <= 768 ? 8 : 12
      const marginTop = baseMarginTop + longEventsTotalHeight

      return {
        marginTop: `${marginTop}px`,
        position: 'relative',
        zIndex: 20
      }
    },

    /**
     * 특정 주차의 총 일정 개수 계산 (장기 + 단일 일정 모두 포함)
     */
    getTotalWeekScheduleCount(weekIndex) {
      if (!this.duckHuCalendarWeeks[weekIndex]) return 0

      const week = this.duckHuCalendarWeeks[weekIndex]
      const weekStart = week[0].fullDate
      const weekEnd = week[6].fullDate

      // 장기 일정 개수 (기존 allWeekEvents의 개수)
      const longEventCount = this.allWeekEvents[weekIndex] ? this.allWeekEvents[weekIndex].length : 0

      // 단일 일정 개수 (해당 주차에 있는 하루짜리 일정들)
      const singleDayEventCount = this.duckHuSchedules.filter(schedule => {
        return schedule.startDate >= weekStart &&
              schedule.endDate <= weekEnd &&
              schedule.startDate === schedule.endDate // 하루짜리 일정만
      }).length

      const totalCount = longEventCount + singleDayEventCount

      return totalCount
    },

    /**
     * 특정 날짜로 이동 및 하이라이트
     */
    goToDate(dateString) {
      const targetDate = new Date(dateString + 'T00:00:00')

      // 해당 월로 이동
      this.selectedYear = targetDate.getFullYear()
      this.selectedMonth = targetDate.getMonth()

      // 캘린더 다시 생성
      this.$nextTick(() => {
        // 날짜 하이라이트
        this.highlightedDate = dateString
        this.highlightAnimation = true

        // 해당 날짜로 스크롤
        const dateElement = document.querySelector(`[data-date="${dateString}"]`)
        if (dateElement) {
          dateElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }

        // 3초 후 하이라이트 제거
        setTimeout(() => {
          this.highlightedDate = null
          this.highlightAnimation = false
        }, 3000)
      })
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

/* 일요일 헤더 스타일 */
.weekday-cell.sunday-header {
  color: #dc3545;
}

/* 토요일 헤더 스타일 */
.weekday-cell.saturday-header {
  color: #007bff;
}

.weekday-cell:last-child {
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
  background: white; /* 배경 색상 제거 */
}

.date-cell.other-month {
  background: #f8f9fa;
  opacity: 0.6;
}

.date-cell.current-month {
  background: white;
}

/* 공휴일이 있는 날짜 스타일 */
.date-cell.has-holiday {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

/* 주차 표시 기능 - 이제 date-cell 안에 위치 */
.week-indicator {
  position: absolute;
  top: -6px;
  left: 2px;
  font-size: 8px;
  font-weight: 600;
  z-index: 50;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1px 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(3px);
  transition: all 0.3s ease;
  max-width: 45px;
  font-family: 'Arial', sans-serif;
}

.week-indicator.has-events {
  background: rgba(102, 126, 234, 0.15);
  border-color: #667eea;
  color: #667eea;
}

.week-indicator .week-number {
  color: #666;
  font-size: 7px;
  white-space: nowrap;
}

.week-indicator.has-events .week-number {
  color: #667eea;
  font-weight: 700;
}

.week-indicator .event-count {
  color: #667eea;
  font-size: 7px;
  border-radius: 6px;
  font-weight: 600;
  min-width: 10px;
  text-align: center;
}

/* 날짜 헤더 영역 - 일자와 일정 개수를 한 줄에 */
.date-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

/* 날짜 숫자 */
.date-number {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  color: #333;
  position: relative;
  z-index: 15;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-block;
  line-height: 1.2;
}

/* 일정 개수 표시 - 일자 옆에 작게 */
.schedule-count-inline {
  font-size: 10px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  padding: 1px 4px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.today-label {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  color: #667eea;
  font-weight: 700;
  background: rgba(102, 126, 234, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.3);
  padding: 1px 3px;
  border-radius: 3px;
  z-index: 25;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 일요일 텍스트 스타일 */
.date-number.sunday-text {
  color: #dc3545 !important;
  font-weight: bold;
}

/* 토요일 텍스트 스타일 */
.date-number.saturday-text {
  color: #007bff !important;
  font-weight: bold;
}

/* 공휴일 텍스트 스타일 */
.date-number.holiday-text {
  color: #dc3545 !important;
  font-weight: bold;
}

/* 다른 달 텍스트 스타일 */
.date-number.other-month-text {
  color: #adb5bd !important;
  font-weight: normal;
}

/* 공휴일 정보 표시 */
.holiday-info {
  margin-bottom: 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 8;
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
  color: #dc3545;
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

/* 모바일 이벤트 컨테이너 개선 */
.date-events {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  min-height: 0;
  z-index: 20
}

/* 모바일 이벤트 아이템 스타일 개선 */
.mobile-event {
  background: #3498db;
  color: white;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  min-height: 16px;
  overflow: hidden;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 21;
}

.mobile-event:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.event-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  line-height: 1;
}

/* 더 많은 이벤트 표시 */
.more-events {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  text-align: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;
  z-index: 21;
}

.more-events:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* 이벤트 레이어 조정 */
.global-events-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  padding-top: 0;
}

.week-events-container {
  position: absolute;
  pointer-events: none;
  /* JavaScript에서 정확한 크기 설정됨 */
  overflow: hidden; /* 넘치는 부분 숨김 */
}

.week-events-container .event-item {
  pointer-events: all;
}

.events-week {
  position: relative;
  width: 100%;
}

/* 이벤트 아이템 스타일 */
.event-item {
  position: absolute;
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  pointer-events: all;
  min-height: 20px;
  line-height: 20px;
  z-index: 10;
}

.event-content {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  overflow: hidden;
}

.event-time {
  font-size: 10px;
  opacity: 0.9;
  flex-shrink: 0;
}

.event-title {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.event-title.with-time {
  font-size: 10px;
}

/* 공휴일 모달 스타일 */
.holiday-modal-backdrop {
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

.holiday-modal {
  background: white;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.holiday-modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.holiday-modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  color: #333;
}

.holiday-modal-body {
  padding: 20px;
}

.holiday-detail-item {
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.holiday-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.holiday-detail-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.holiday-detail-type {
  background: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.holiday-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

/* 툴팁 스타일 */
.event-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-date, .tooltip-time {
  font-size: 11px;
  opacity: 0.9;
}

/* 하이라이트 애니메이션 */
.date-cell.highlighted {
  background: #fff3cd !important;
  border: 2px solid #ffc107 !important;
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.4);
  z-index: 10;
}

.date-cell.blink-animation {
  animation: blinkEffect 0.5s ease-in-out 6;
}

@keyframes blinkEffect {
  0%, 100% {
    background: #fff3cd;
    transform: scale(1);
    box-shadow: 0 0 15px rgba(255, 193, 7, 0.4);
  }
  50% {
    background: #ffe69c;
    transform: scale(1.03);
    box-shadow: 0 0 25px rgba(255, 193, 7, 0.6);
  }
}

/* 모바일 반응형 디자인 수정 */
@media (max-width: 768px) {
  .duckhu-calendar {
    margin: 10px;
    border-radius: 8px;
  }

  .calendar-header {
    padding: 15px;
  }

  /* 데스크톱 헤더 숨김 */
  .desktop-header {
    display: none;
  }

  .date-header {
    gap: 4px;
  }

  /* 모바일 헤더 표시 */
  .mobile-header {
    display: block;
  }

  .mobile-nav-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
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
    flex-shrink: 0;
  }

  .mobile-nav-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .mobile-select {
    background: white;
    border: none;
    border-radius: 5px;
    padding: 6px 8px;
    font-size: 14px;
    cursor: pointer;
    flex: 1;
    max-width: 80px;
  }

  /* 요일 헤더 모바일 최적화 */
  .weekday-cell {
    padding: 8px 4px;
    font-size: 12px;
  }

  /* 모바일에서 주간 행 간격 조정 */
  .week-row {
    border-bottom: 1px solid #e9ecef;
    min-height: 90px;
  }

  /* 날짜 셀 모바일 최적화 */
  .date-cell {
    height: 90px !important;
    padding: 6px !important;
  }

  /* 주차 표시 모바일 최적화 */
  .week-indicator {
    top: -4px;
    left: 1px;
    font-size: 7px;
    padding: 1px 3px;
    border-radius: 3px;
    gap: 1px;
    max-width: 40px;
  }

  .week-indicator .week-number {
    font-size: 6px;
  }

  .week-indicator .event-count {
    font-size: 5px;
    padding: 1px 2px;
    border-radius: 4px;
    min-width: 8px;
  }

  .date-number {
    font-size: 12px;
    padding: 2px 4px;
  }

  .schedule-count-inline {
    font-size: 8px;
    padding: 1px 3px;
    min-width: 12px;
  }

  .today-label {
    font-size: 6px;
    padding: 1px;
    bottom: 0;
    right: 2px;
    border-radius: 1px;
  }

  /* 공휴일 모바일 최적화 */
  .holiday-name {
    font-size: 9px;
    max-width: 35px;
    color: #dc3545;
  }

  .holiday-count {
    font-size: 8px;
    padding: 1px 3px;
    background: #ff6b6b;
  }

  /* 모바일 이벤트 컨테이너 */
  .date-events {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
    min-height: 0;
    margin-top: 0;
  }

  /* 모바일 이벤트 아이템 크기 */
  .mobile-event {
    font-size: 8px !important;
    padding: 1px 2px !important;
    min-height: 12px !important;
    line-height: 1 !important;
    margin-bottom: 1px;
  }

  /* 더 많은 이벤트가 있을 때 표시 */
  .more-events {
    font-size: 7px;
    padding: 1px 2px;
  }

  /* 오늘 날짜 배경 제거 */
  .date-cell.today {
    background: white;
  }

  .date-cell.today .date-number {
    background: rgba(255, 255, 255, 0.95);
    color: #333;
  }

  /* 다른 달 날짜 */
  .date-cell.other-month {
    opacity: 0.3;
  }

  .event-item {
    min-height: 16px;
    line-height: 16px;
    font-size: 10px;
  }

  .event-time {
    font-size: 8px;
  }

  .event-title {
    font-size: 8px;
  }

  .event-title.with-time {
    font-size: 7px;
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
    height: 75px !important;
    padding: 4px !important;
  }

  .week-row {
    min-height: 75px;
  }

  .week-indicator {
    top: -5px;
    left: 1px;
    font-size: 6px;
    padding: 1px 2px;
    max-width: 30px;
  }

  .week-indicator .week-number {
    font-size: 5px;
  }

  .week-indicator .event-count {
    font-size: 4px;
    padding: 1px;
    min-width: 6px;
  }

  .date-header {
    gap: 2px;
  }

  .date-number {
    font-size: 10px;
    padding: 1px 3px;
  }

  .schedule-count-inline {
    font-size: 7px;
    padding: 1px 2px;
    min-width: 10px;
  }

  .today-label {
    padding: 0;
    min-width: 20px;
  }

  .mobile-event {
    height: 10px !important;
    font-size: 6px !important;
    padding: 0 1px !important;
    line-height: 8px !important;
  }

  .more-events {
    font-size: 6px;
    padding: 1px;
  }

  /* 캘린더 헤더 조정 */
  .weekday-cell {
    padding: 6px 2px;
    font-size: 11px;
  }

  .mobile-nav-button {
    padding: 6px 8px;
    font-size: 12px;
  }

  .mobile-select {
    padding: 4px 6px;
    font-size: 12px;
  }

  .holiday-name {
    font-size: 8px;
    max-width: 25px;
  }

  .holiday-count {
    font-size: 7px;
    padding: 1px 2px;
  }

  .event-item {
    min-height: 14px;
    line-height: 14px;
    font-size: 9px;
  }

  .event-time {
    font-size: 7px;
  }

  .event-title {
    font-size: 7px;
  }

  .event-title.with-time {
    font-size: 6px;
  }
}
</style>
