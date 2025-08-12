<template>
  <div class="enhanced-calendar">
    <!-- 캘린더 컨테이너 -->
    <div class="calendar-container">
      <!-- 캘린더 헤더 -->
      <div class="calendar-header">
        <button class="nav-button" @click="previousMonth">◀</button>

        <div class="month-year-display">
          <h2>{{ currentMonthYear }}</h2>
        </div>

        <button class="nav-button" @click="nextMonth">▶</button>
      </div>

      <!-- 빠른 네비게이션 -->
      <div class="quick-nav">
        <button @click="goToToday" class="today-btn">오늘</button>
        <div class="month-year-selector">
          <select v-model="selectedYear" @change="generateCalendar">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
          <select v-model="selectedMonth" @change="generateCalendar">
            <option v-for="(month, index) in months" :key="index" :value="index">
              {{ month }}
            </option>
          </select>
        </div>
      </div>

      <!-- 캘린더 그리드 -->
      <div class="calendar-grid">
        <!-- 주 번호 표시 컬럼 (설정에 따라) -->
        <div v-if="showWeekNumbers" class="week-numbers-column">
          <div class="week-header">주</div>
          <div v-for="weekNum in weekNumbers" :key="weekNum" class="week-number">
            {{ weekNum }}
          </div>
        </div>

        <!-- 메인 캘린더 영역 -->
        <div class="main-calendar" :class="{ 'with-week-numbers': showWeekNumbers }">
          <!-- 요일 헤더 -->
          <div v-for="day in weekdays" :key="day" class="day-header">
            {{ day }}
          </div>

          <!-- 날짜 셀 -->
          <div v-for="(day, dayIndex) in calendarDays" :key="day.key"
               class="day-cell"
               :class="{
                 'other-month': !day.isCurrentMonth,
                 'today': day.isToday,
                 'has-events': getEventsForDay(day.fullDate).length > 0,
                 'holiday': day.isHoliday
               }"
               @click="selectDate(day)">

            <div class="day-number">{{ day.date }}</div>

            <!-- 공휴일 표시 -->
            <div v-if="day.isHoliday" class="holiday-indicator">
              {{ day.holidayName }}
            </div>

            <!-- 연속 이벤트 바 표시 -->
            <div class="event-bars">
              <!-- 각 이벤트 행(row)을 처리 -->
              <div v-for="(eventRow, rowIndex) in getEventBarsForDay(dayIndex)"
                   :key="`row-${rowIndex}`"
                   class="event-row">
                <!-- 연속 이벤트 바 -->
                <div v-if="eventRow.event"
                     class="event-bar spanning-event"
                     :class="{
                       'event-start': eventRow.isStart,
                       'event-end': eventRow.isEnd,
                       'event-middle': !eventRow.isStart && !eventRow.isEnd,
                       'multi-day': eventRow.event.isMultiDay
                     }"
                     :style="{
                       backgroundColor: eventRow.event.color,
                       gridColumn: eventRow.isStart ? `span ${eventRow.span}` : 'unset',
                       display: eventRow.isStart ? 'block' : 'none'
                     }"
                     @click.stop="openEventDetail(eventRow.event)">
                  <span class="event-title">{{ eventRow.event.title }}</span>
                  <span v-if="eventRow.isStart && eventRow.event.startTime" class="event-time">
                    {{ eventRow.event.startTime }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 단일날 이벤트 표시 -->
            <div class="single-day-events">
              <div v-for="event in getSingleDayEventsForDay(day.fullDate)"
                   :key="event.id"
                   class="event-bar single-day"
                   :style="{ backgroundColor: event.color }"
                   @click.stop="openEventDetail(event)">
                <span class="event-title">{{ event.title }}</span>
                <span v-if="event.startTime" class="event-time">{{ event.startTime }}</span>
              </div>
            </div>

            <!-- 이벤트 개수 표시 (많을 때) -->
            <div v-if="getTotalEventsForDay(day.fullDate) > 4"
                 class="more-events"
                 @click.stop="showMoreEvents(day.fullDate)">
              +{{ getTotalEventsForDay(day.fullDate) - 4 }}개 더보기
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 기존 스케줄 상세보기 모달 사용 -->
    <ScheduleDetailModal
      :show="showDetailModal"
      :selected-schedules="selectedSchedules"
      @edit="editEvent"
      @delete="deleteEvent"
      @view-single="viewSingleSchedule"
      @close="closeDetailModal"
    />
  </div>
</template>

<script>
import ScheduleDetailModal from '@/components/ScheduleDetailModal.vue'
import { scheduleAPI } from '@/services/api.js'

export default {
  name: 'EnhancedCalendar',

  components: {
    ScheduleDetailModal
  },

  props: {
    // 주 번호 표시 여부 (설정에서 전달)
    showWeekNumbers: {
      type: Boolean,
      default: false
    },
    // 주 시작일 (0: 일요일, 1: 월요일)
    weekStartDay: {
      type: Number,
      default: 0
    },
    // 이벤트 표시 개수 제한
    eventsPerPage: {
      type: Number,
      default: 20
    }
  },

  data() {
    return {
      // 현재 날짜 정보
      currentDate: new Date(),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),

      // 캘린더 기본 데이터
      months: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
      ],
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      calendarDays: [],
      weekNumbers: [],

      // 이벤트 데이터
      events: [],
      processedEvents: [], // 연속 이벤트 처리된 데이터

      // 모달 상태 (기존 ScheduleDetailModal 형식에 맞춤)
      showDetailModal: false,
      selectedSchedules: [], // 배열 형태로 전달
      selectedDate: null
    }
  },

  computed: {
    currentMonthYear() {
      return `${this.selectedYear}년 ${this.months[this.selectedMonth]}`
    },

    availableYears() {
      const currentYear = new Date().getFullYear()
      const years = []
      for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i)
      }
      return years
    }
  },

  async mounted() {
    await this.loadEvents()
    this.generateCalendar()
  },

  watch: {
    selectedYear() {
      this.generateCalendar()
    },
    selectedMonth() {
      this.generateCalendar()
    },
    showWeekNumbers() {
      this.generateCalendar()
    },
    weekStartDay() {
      this.generateCalendar()
    }
  },

  methods: {
    // === 이벤트 로딩 ===
    async loadEvents() {
      try {
        const response = await scheduleAPI.getAllSchedules()
        this.events = response.schedules || response || []
        this.processEventsForSpanning()
      } catch (error) {
        console.error('이벤트 로딩 실패:', error)
        this.events = []
      }
    },

    // === 캘린더 생성 ===
    generateCalendar() {
      const year = this.selectedYear
      const month = this.selectedMonth

      // 해당 월의 첫째 날과 마지막 날
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // 캘린더 그리드 시작일과 종료일 계산 (주 시작일 고려)
      const startDate = new Date(firstDay)
      const daysToSubtract = (firstDay.getDay() - this.weekStartDay + 7) % 7
      startDate.setDate(startDate.getDate() - daysToSubtract)

      const endDate = new Date(lastDay)
      const daysToAdd = (this.weekStartDay + 6 - lastDay.getDay()) % 7
      endDate.setDate(endDate.getDate() + daysToAdd)

      // 날짜 배열 생성
      const days = []
      const weekNums = []
      const current = new Date(startDate)

      while (current <= endDate) {
        const isToday = this.isSameDate(current, new Date())
        const isCurrentMonth = current.getMonth() === month

        days.push({
          date: current.getDate(),
          fullDate: this.formatDate(current),
          isCurrentMonth: isCurrentMonth,
          isToday: isToday,
          isHoliday: this.isHoliday(current),
          holidayName: this.getHolidayName(current),
          key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
        })

        // 주 번호 계산 (일요일마다)
        if (current.getDay() === 0) {
          weekNums.push(this.getWeekNumber(current))
        }

        current.setDate(current.getDate() + 1)
      }

      this.calendarDays = days
      this.weekNumbers = weekNums
      this.processEventsForSpanning()
    },

    // === 이벤트 연속 표시 처리 ===
    processEventsForSpanning() {
      this.processedEvents = this.events.map(event => {
        const startDate = new Date(event.startDate)
        const endDate = new Date(event.endDate || event.startDate)

        // 2일 이상인지 확인
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        const isMultiDay = daysDiff >= 1

        return {
          ...event,
          isMultiDay,
          daysDiff: daysDiff + 1, // 시작일 포함
          startDateObj: startDate,
          endDateObj: endDate
        }
      })
    },

    // === 특정 날짜의 이벤트 바 계산 ===
    getEventBarsForDay(dayIndex) {
      const day = this.calendarDays[dayIndex]
      const dayDate = new Date(day.fullDate)

      // 해당 날짜의 연속 이벤트들 찾기
      const multiDayEvents = this.processedEvents.filter(event => {
        return event.isMultiDay &&
               dayDate >= event.startDateObj &&
               dayDate <= event.endDateObj
      })

      const eventRows = []

      multiDayEvents.forEach(event => {
        const isStart = this.isSameDate(dayDate, event.startDateObj)
        const isEnd = this.isSameDate(dayDate, event.endDateObj)

        // 시작일인 경우 span 계산
        let span = 1
        if (isStart) {
          // 현재 주에서 이벤트가 몇 칸을 차지하는지 계산
          const currentWeekStart = dayIndex - (dayIndex % 7)
          const currentWeekEnd = currentWeekStart + 6

          for (let i = dayIndex; i <= currentWeekEnd; i++) {
            if (i >= this.calendarDays.length) break
            const checkDate = new Date(this.calendarDays[i].fullDate)
            if (checkDate <= event.endDateObj) {
              span = i - dayIndex + 1
            } else {
              break
            }
          }
        }

        eventRows.push({
          event,
          isStart,
          isEnd,
          span
        })
      })

      return eventRows
    },

    // === 특정 날짜의 단일날 이벤트 ===
    getSingleDayEventsForDay(date) {
      return this.processedEvents.filter(event => {
        return !event.isMultiDay && event.startDate === date
      }).slice(0, 4) // 최대 4개만 표시
    },

    // === 특정 날짜의 모든 이벤트 ===
    getEventsForDay(date) {
      return this.processedEvents.filter(event => {
        const dayDate = new Date(date)
        return dayDate >= event.startDateObj && dayDate <= event.endDateObj
      })
    },

    // === 특정 날짜의 총 이벤트 수 ===
    getTotalEventsForDay(date) {
      return this.getEventsForDay(date).length
    },

    // === 네비게이션 ===
    previousMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11
        this.selectedYear--
      } else {
        this.selectedMonth--
      }
    },

    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0
        this.selectedYear++
      } else {
        this.selectedMonth++
      }
    },

    goToToday() {
      const today = new Date()
      this.selectedYear = today.getFullYear()
      this.selectedMonth = today.getMonth()
    },

    // === 이벤트 핸들링 ===
    selectDate(day) {
      this.selectedDate = day.fullDate
      const events = this.getEventsForDay(day.fullDate)

      if (events.length >= 1) {
        // 기존 ScheduleDetailModal은 배열 형태로 이벤트를 받음
        this.selectedSchedules = events
        this.showDetailModal = true
      }
    },

    openEventDetail(event) {
      // 단일 이벤트도 배열 형태로 전달
      this.selectedSchedules = [event]
      this.showDetailModal = true
    },

    closeDetailModal() {
      this.showDetailModal = false
      this.selectedSchedules = []
    },

    showMoreEvents(date) {
      // 더보기도 기존 모달로 처리
      const events = this.getEventsForDay(date)
      this.selectedSchedules = events
      this.showDetailModal = true
    },

    // === 기존 ScheduleDetailModal 이벤트 핸들러들 ===
    editEvent(event) {
      // 이벤트 수정 로직
      this.$emit('event-edit', event)
      console.log('이벤트 수정:', event)
    },

    async deleteEvent(event) {
      if (!confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?`)) return

      try {
        await scheduleAPI.deleteSchedule(event.id)
        await this.loadEvents()
        this.closeDetailModal()
        this.$emit('schedule-updated')
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert('이벤트 삭제에 실패했습니다.')
      }
    },

    viewSingleSchedule(event) {
      // 단일 이벤트 상세보기
      this.selectedSchedules = [event]
    },

    // === 유틸리티 메서드 ===
    formatDate(date) {
      return date.toISOString().split('T')[0]
    },

    isSameDate(date1, date2) {
      return date1.toDateString() === date2.toDateString()
    },

    getWeekNumber(date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    },

    isHoliday(date) {
      // 공휴일 판별 로직 (간단한 예시)
      const day = date.getDay()
      return day === 0 || day === 6 // 주말을 공휴일로 처리
    },

    getHolidayName(date) {
      const day = date.getDay()
      if (day === 0) return '일요일'
      if (day === 6) return '토요일'
      return ''
    }
  }
}
</script>

<style scoped>
.enhanced-calendar {
  width: 100%;
  height: 100%;
}

.calendar-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 캘린더 헤더 */
.calendar-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.month-year-display h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

/* 빠른 네비게이션 */
.quick-nav {
  padding: 15px 20px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
}

.today-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.month-year-selector {
  display: flex;
  gap: 10px;
}

.month-year-selector select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
}

/* 캘린더 그리드 */
.calendar-grid {
  display: flex;
}

.week-numbers-column {
  width: 50px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
}

.week-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
  border-bottom: 1px solid #dee2e6;
}

.week-number {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  border-bottom: 1px solid #dee2e6;
}

.main-calendar {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e9ecef;
}

/* 요일 헤더 */
.day-header {
  background: #495057;
  color: white;
  padding: 12px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.day-header:first-child {
  color: #ff6b6b; /* 일요일 */
}

.day-header:last-child {
  color: #74c0fc; /* 토요일 */
}

/* 날짜 셀 */
.day-cell {
  background: white;
  min-height: 120px;
  padding: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.day-cell:hover {
  background-color: #f8f9fa;
}

.day-cell.today {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
}

.day-cell.other-month {
  background: #f8f9fa;
  opacity: 0.6;
}

.day-cell.other-month .day-number {
  color: #adb5bd;
}

.day-number {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #495057;
}

/* 공휴일 */
.holiday-indicator {
  font-size: 10px;
  color: #dc3545;
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
  background: rgba(220, 53, 69, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

/* 이벤트 바 컨테이너 */
.event-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.event-row {
  display: flex;
  height: 20px;
}

/* 연속 이벤트 바 */
.event-bar {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.event-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 연속 이벤트 특별 스타일 */
.spanning-event {
  position: relative;
}

.spanning-event.event-start {
  border-radius: 3px 0 0 3px;
}

.spanning-event.event-end {
  border-radius: 0 3px 3px 0;
}

.spanning-event.event-middle {
  border-radius: 0;
}

.spanning-event.multi-day::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 0 2px 2px 0;
}

/* 단일날 이벤트 */
.single-day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.single-day {
  width: 100%;
  border-radius: 3px;
}

/* 이벤트 제목과 시간 */
.event-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  font-size: 9px;
  opacity: 0.9;
  margin-left: 4px;
}

/* 더보기 버튼 */
.more-events {
  margin-top: auto;
  padding: 4px;
  background: #6c757d;
  color: white;
  text-align: center;
  font-size: 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.more-events:hover {
  background: #5a6268;
}

/* 버튼 스타일 */
.nav-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .quick-nav {
    flex-direction: column;
    gap: 10px;
  }

  .day-cell {
    min-height: 80px;
    padding: 4px;
  }

  .event-bar {
    font-size: 10px;
    padding: 1px 4px;
    height: 16px;
  }

  .week-numbers-column {
    display: none;
  }
}
</style>
