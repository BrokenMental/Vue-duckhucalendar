<template>
  <div class="duckhu-calendar">
    <!-- 캘린더 헤더 -->
    <div class="calendar-header">
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

      <button class="add-schedule-btn" @click="openDuckHuScheduleModal">
        일정 추가
      </button>

      <button class="nav-button" @click="nextMonth">다음 ▶</button>
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
          <div v-for="(week, weekIndex) in duckHuCalendarWeeks" :key="`week-${weekIndex}`" class="week-row">
            <div v-for="(day, dayIndex) in week" :key="`day-${day.key}`"
                 class="date-cell"
                 :class="{
                   'other-month': !day.isCurrentMonth,
                   'today': day.isToday,
                   'weekend': dayIndex === 0 || dayIndex === 6
                 }"
                 @click="selectDuckHuDate(day)">
              <div class="date-number">{{ day.date }}</div>

              <!-- 일정 개수 표시 (4개 이상일 때) -->
              <div v-if="getDuckHuScheduleCountForDay(day.fullDate) >= 4"
                   class="event-count-badge"
                   @click.stop="showDuckHuDaySchedules(day.fullDate)">
                {{ getDuckHuScheduleCountForDay(day.fullDate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 이벤트 레이어 -->
        <div class="events-layer" ref="duckHuEventsLayer">
          <!-- 각 주별로 이벤트 렌더링 -->
          <div v-for="(week, weekIndex) in duckHuCalendarWeeks" :key="`events-week-${weekIndex}`"
               class="week-events"
               :style="{ top: `${weekIndex * DUCKHU_CELL_HEIGHT}px`, height: `${DUCKHU_CELL_HEIGHT}px` }">

            <!-- 해당 주의 이벤트들 -->
            <div v-for="(event) in getDuckHuEventsForWeek(week, weekIndex)"
                 :key="`event-${event.id}-${weekIndex}`"
                 class="event-bar"
                 :class="{
                   'event-start': event.isStart,
                   'event-end': event.isEnd,
                   'event-continues': !event.isStart && !event.isEnd
                 }"
                 :style="getDuckHuEventStyle(event, week)"
                 @click.stop="openDuckHuScheduleDetail(event.schedule)"
                 @mouseenter="showDuckHuEventTooltip(event.schedule, $event)"
                 @mouseleave="hideDuckHuTooltip">

              <!-- 이벤트 제목 (시작 부분에만 표시) -->
              <span v-if="event.isStart" class="event-title">{{ event.schedule.title }}</span>
              <span v-else-if="event.showTitle" class="event-title">{{ event.schedule.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 일정 추가/수정 모달 -->
    <ScheduleModal
      :show="showDuckHuScheduleModal"
      :editing-schedule="editingDuckHuSchedule"
      @save="handleSaveDuckHuSchedule"
      @close="closeDuckHuScheduleModal"
    />

    <!-- 일정 상세보기 모달 -->
    <ScheduleDetailModal
      :show="showDuckHuDetailModal"
      :selected-schedules="selectedDuckHuSchedules"
      @edit="editDuckHuSchedule"
      @delete="deleteDuckHuSchedule"
      @close="closeDuckHuDetailModal"
    />

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
import ScheduleModal from '@/components/ScheduleModal.vue'
import ScheduleDetailModal from '@/components/ScheduleDetailModal.vue'

export default {
  name: 'DuckHuCalendar',

  components: {
    ScheduleModal,
    ScheduleDetailModal
  },

  data() {
    return {
      // DuckHu 캘린더 설정
      DUCKHU_CELL_HEIGHT: 120, // 각 주의 높이 (px)
      DUCKHU_CELL_WIDTH: 0,    // 각 날짜 셀의 너비 (계산됨)
      DUCKHU_EVENT_HEIGHT: 20, // 이벤트 바의 높이
      DUCKHU_EVENT_MARGIN: 2,  // 이벤트 바 간격
      DUCKHU_MAX_EVENTS_PER_ROW: 4, // 한 주에 표시할 수 있는 최대 이벤트 수

      // 날짜 관련
      currentDate: new Date(),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),
      months: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
      ],
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      duckHuCalendarWeeks: [], // 주별로 구성된 캘린더 데이터

      // 일정 관련
      duckHuSchedules: [], // 전체 일정 배열
      duckHuScheduleIdCounter: 1,

      // 모달 상태
      showDuckHuScheduleModal: false,
      showDuckHuDetailModal: false,
      editingDuckHuSchedule: null,
      selectedDuckHuSchedules: [],
      selectedDuckHuDate: null,

      // 툴팁
      duckHuTooltip: {
        show: false,
        x: 0,
        y: 0,
        schedule: null
      },

      // 색상 관리
      duckHuColors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#F4A460', '#87CEEB', '#98D8C8', '#FFB6C1',
        '#FFA07A', '#20B2AA', '#9370DB', '#3CB371', '#FF7F50'
      ],
      duckHuUsedColors: new Set(),

      // 알림 관리
      duckHuNotificationTimers: [] // 알림 타이머들을 저장하는 배열
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
    },
    selectedMonth() {
      this.generateDuckHuCalendar()
    },
    duckHuSchedules: {
      handler() {
        this.saveDuckHuSchedules()
        this.scheduleDuckHuNotifications() // 일정 변경 시 알림 재설정
      },
      deep: true
    }
  },

  mounted() {
    this.generateDuckHuCalendar()
    this.loadDuckHuSchedules()
    this.calculateDuckHuCellWidth()
    this.setupDuckHuNotifications() // 알림 권한 요청
    this.scheduleDuckHuNotifications() // 알림 스케줄링

    // 창 크기 변경 시 셀 너비 재계산
    window.addEventListener('resize', this.calculateDuckHuCellWidth)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.calculateDuckHuCellWidth)

    // 알림 타이머들 정리
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

      // 해당 월의 첫째 날과 마지막 날
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // 캘린더 시작일 (첫 주의 일요일)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())

      // 캘린더 종료일 (마지막 주의 토요일)
      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

      // 주별로 날짜 구성
      const weeks = []
      let currentWeekStart = new Date(startDate)

      while (currentWeekStart <= endDate) {
        const week = []
        for (let i = 0; i < 7; i++) {
          const current = new Date(currentWeekStart)
          current.setDate(current.getDate() + i)

          week.push({
            date: current.getDate(),
            fullDate: this.formatDuckHuDate(current),
            isCurrentMonth: current.getMonth() === month,
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
     * 특정 날짜의 일정 개수 반환
     */
    getDuckHuScheduleCountForDay(date) {
      return this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= date && schedule.endDate >= date
      }).length
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
     * 특정 주에 해당하는 이벤트들 반환
     */
    getDuckHuEventsForWeek(week, weekIndex) {
      const weekStart = week[0].fullDate
      const weekEnd = week[6].fullDate
      const events = []

      // 해당 주와 겹치는 일정들 찾기
      const overlappingSchedules = this.duckHuSchedules.filter(schedule => {
        return schedule.startDate <= weekEnd && schedule.endDate >= weekStart
      })

      // 우선순위별로 정렬 (우선순위가 높을수록 위에 표시)
      overlappingSchedules.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority // 1(높음) -> 2(중간) -> 3(낮음) 순서
        }
        return a.startDate.localeCompare(b.startDate) // 같은 우선순위면 시작일순
      })

      // 각 일정을 이벤트 객체로 변환
      overlappingSchedules.forEach((schedule, index) => {
        const eventStartDate = schedule.startDate > weekStart ? schedule.startDate : weekStart
        const eventEndDate = schedule.endDate < weekEnd ? schedule.endDate : weekEnd

        const startDayIndex = week.findIndex(day => day.fullDate === eventStartDate)
        const endDayIndex = week.findIndex(day => day.fullDate === eventEndDate)

        if (startDayIndex !== -1 && endDayIndex !== -1) {
          events.push({
            id: `${schedule.id}-${weekIndex}`,
            schedule: schedule,
            startDayIndex: startDayIndex,
            endDayIndex: endDayIndex,
            isStart: schedule.startDate === eventStartDate,
            isEnd: schedule.endDate === eventEndDate,
            showTitle: schedule.startDate === eventStartDate || startDayIndex === 0,
            row: Math.min(index, this.DUCKHU_MAX_EVENTS_PER_ROW - 1) // 최대 행 수 제한
          })
        }
      })

      return events
    },

    /**
     * DuckHu 이벤트 스타일 계산
     */
    getDuckHuEventStyle(event, week) {
      const weekEvents = this.getDuckHuEventsForWeek(week, 0)
      const eventCount = weekEvents.length

      const left = event.startDayIndex * (100 / 7)
      const width = (event.endDayIndex - event.startDayIndex + 1) * (100 / 7)
      const top = 25 + (event.row * (this.DUCKHU_EVENT_HEIGHT + this.DUCKHU_EVENT_MARGIN))

      let backgroundColor = event.schedule.color
      let backgroundImage = 'none'
      let animation = 'none'

      // 4개 이상일 때 무지개 색상
      if (eventCount >= 4) {
        backgroundColor = 'transparent'
        backgroundImage = 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)'
        animation = 'duckhu-rainbow-slide 3s ease-in-out infinite'
      }

      return {
        position: 'absolute',
        left: `${left}%`,
        width: `${width}%`,
        top: `${top}px`,
        height: `${this.DUCKHU_EVENT_HEIGHT}px`,
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage,
        backgroundSize: eventCount >= 4 ? '400% 400%' : 'auto',
        animation: animation,
        borderRadius: event.isStart && event.isEnd ? '4px' :
                    event.isStart ? '4px 0 0 4px' :
                    event.isEnd ? '0 4px 4px 0' : '0',
        zIndex: 10,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: event.isStart ? '6px' : '2px',
        paddingRight: event.isEnd ? '6px' : '2px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.3)'
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
     * DuckHu 날짜 선택
     */
    selectDuckHuDate(day) {
      this.selectedDuckHuDate = day.fullDate
      this.openDuckHuScheduleModal()
    },

    /**
     * DuckHu 일정 추가 모달 열기
     */
    openDuckHuScheduleModal() {
      this.editingDuckHuSchedule = null
      this.showDuckHuScheduleModal = true
    },

    /**
     * DuckHu 일정 모달 닫기
     */
    closeDuckHuScheduleModal() {
      this.showDuckHuScheduleModal = false
      this.editingDuckHuSchedule = null
      this.selectedDuckHuDate = null
    },

    /**
     * DuckHu 일정 저장 처리
     */
    handleSaveDuckHuSchedule(scheduleData) {
      if (this.editingDuckHuSchedule) {
        // 수정
        const index = this.duckHuSchedules.findIndex(s => s.id === this.editingDuckHuSchedule.id)
        if (index !== -1) {
          this.duckHuSchedules[index] = { ...scheduleData, id: this.editingDuckHuSchedule.id }
        }
      } else {
        // 신규 추가
        const newSchedule = {
          ...scheduleData,
          id: this.duckHuScheduleIdCounter++,
          color: this.getDuckHuUniqueColor()
        }

        // 선택된 날짜가 있으면 기본값으로 설정
        if (this.selectedDuckHuDate && !scheduleData.startDate) {
          newSchedule.startDate = this.selectedDuckHuDate
          newSchedule.endDate = this.selectedDuckHuDate
        }

        this.duckHuSchedules.push(newSchedule)
      }

      this.closeDuckHuScheduleModal()
    },

    /**
     * DuckHu 고유 색상 할당
     */
    getDuckHuUniqueColor() {
      const availableColors = this.duckHuColors.filter(color => !this.duckHuUsedColors.has(color))

      if (availableColors.length > 0) {
        const selectedColor = availableColors[0]
        this.duckHuUsedColors.add(selectedColor)
        return selectedColor
      } else {
        // 모든 색상이 사용된 경우 랜덤 선택
        return this.duckHuColors[Math.floor(Math.random() * this.duckHuColors.length)]
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
     * DuckHu 일정 수정
     */
    editDuckHuSchedule(schedule) {
      this.editingDuckHuSchedule = schedule
      this.closeDuckHuDetailModal()
      this.showDuckHuScheduleModal = true
    },

    /**
     * DuckHu 일정 삭제
     */
    deleteDuckHuSchedule(schedule) {
      const index = this.duckHuSchedules.findIndex(s => s.id === schedule.id)
      if (index !== -1) {
        // 사용된 색상에서 제거
        this.duckHuUsedColors.delete(schedule.color)
        this.duckHuSchedules.splice(index, 1)
      }
      this.closeDuckHuDetailModal()
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
     * DuckHu 일정 알림 스케줄링
     */
    scheduleDuckHuNotifications() {
      // 기존 타이머들 클리어
      if (this.duckHuNotificationTimers) {
        this.duckHuNotificationTimers.forEach(timer => clearTimeout(timer))
      }
      this.duckHuNotificationTimers = []

      const now = new Date()

      this.duckHuSchedules.forEach(schedule => {
        let notificationTime

        // 시작 시간이 있으면 해당 시간에, 없으면 오전 9시에 알림
        if (schedule.startTime) {
          const [hours, minutes] = schedule.startTime.split(':')
          notificationTime = new Date(schedule.startDate + `T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`)
        } else {
          notificationTime = new Date(schedule.startDate + 'T09:00:00')
        }

        // 알림 시간이 현재보다 미래인 경우에만 스케줄링
        if (notificationTime > now) {
          const delay = notificationTime.getTime() - now.getTime()

          const timer = setTimeout(() => {
            this.showDuckHuNotification(schedule)
          }, delay)

          this.duckHuNotificationTimers.push(timer)
        }
      })
    },

    /**
     * DuckHu 알림 표시
     */
    showDuckHuNotification(schedule) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeStr = schedule.startTime ?
          `${schedule.startTime}` : '오전 9시'

        const notification = new Notification(`🦆 DuckHu 일정 알림: ${schedule.title}`, {
          body: `${timeStr}에 시작하는 일정이 있습니다.`,
          icon: '/favicon.ico',
          tag: `duckhu-schedule-${schedule.id}`,
          requireInteraction: true
        })

        // 알림 클릭 시 상세보기 모달 열기
        notification.onclick = () => {
          window.focus()
          this.selectedDuckHuSchedules = [schedule]
          this.showDuckHuDetailModal = true
          notification.close()
        }

        // 10초 후 자동으로 알림 닫기
        setTimeout(() => {
          notification.close()
        }, 10000)
      }
    },

    /**
     * DuckHu 일정 저장 (로컬 스토리지)
     */
    saveDuckHuSchedules() {
      try {
        localStorage.setItem('duckhu-calendar-schedules', JSON.stringify(this.duckHuSchedules))
        localStorage.setItem('duckhu-calendar-used-colors', JSON.stringify([...this.duckHuUsedColors]))
        localStorage.setItem('duckhu-calendar-id-counter', this.duckHuScheduleIdCounter.toString())
        console.log('DuckHu 캘린더 일정이 저장되었습니다.')
      } catch (error) {
        console.error('DuckHu 캘린더 일정 저장 실패:', error)
      }
    },
    /**
     * 테스트용 샘플 데이터 추가
     */
    addSampleData() {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3)

      this.duckHuSchedules = [
        {
          id: 1,
          title: '프로젝트 회의',
          startDate: this.formatDuckHuDate(today),
          endDate: this.formatDuckHuDate(tomorrow),
          startTime: '10:00',
          endTime: '12:00',
          description: '새로운 프로젝트에 대한 회의입니다.',
          priority: 1,
          color: '#FF6B6B'
        },
        {
          id: 2,
          title: '휴가',
          startDate: this.formatDuckHuDate(tomorrow),
          endDate: this.formatDuckHuDate(dayAfterTomorrow),
          startTime: null,
          endTime: null,
          description: '여름휴가입니다.',
          priority: 2,
          color: '#4ECDC4'
        }
      ]

      this.duckHuUsedColors.add('#FF6B6B')
      this.duckHuUsedColors.add('#4ECDC4')
      this.duckHuScheduleIdCounter = 3
    },

    /**
     * DuckHu 일정 불러오기 (로컬 스토리지)
     */
    loadDuckHuSchedules() {
      try {
        const savedSchedules = localStorage.getItem('duckhu-calendar-schedules')
        const savedColors = localStorage.getItem('duckhu-calendar-used-colors')
        const savedCounter = localStorage.getItem('duckhu-calendar-id-counter')

        if (savedSchedules) {
          this.duckHuSchedules = JSON.parse(savedSchedules)
        } else {
          // 테스트용 샘플 데이터 추가
          this.addSampleData()
        }

        if (savedColors) {
          this.duckHuUsedColors = new Set(JSON.parse(savedColors))
        }

        if (savedCounter) {
          this.duckHuScheduleIdCounter = parseInt(savedCounter)
        }

        console.log('DuckHu 캘린더 일정이 불러와졌습니다.')
      } catch (error) {
        console.error('DuckHu 캘린더 일정 불러오기 실패:', error)
      }
    }
  }
}
</script>

<style scoped>
.duckhu-calendar {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  flex-wrap: wrap;
  gap: 15px;
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

.add-schedule-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  font-weight: 600;
}

.add-schedule-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
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
  opacity: 0.6;
}

.date-cell.weekend .date-number {
  color: #dc3545;
}

.date-number {
  font-size: 14px;
  font-weight: bold;
  color: #495057;
}

.date-cell.other-month .date-number {
  color: #adb5bd;
}

/* 이벤트 레이어 */
.events-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
}

.week-events {
  position: absolute;
  left: 0;
  right: 0;
}

/* 이벤트 바 */
.event-bar {
  pointer-events: auto;
  color: white;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.event-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  z-index: 20;
}

.event-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}

/* 연속 이벤트 스타일 */
.event-bar.event-continues {
  border-left: 2px dashed rgba(255, 255, 255, 0.5);
  border-right: 2px dashed rgba(255, 255, 255, 0.5);
}

.event-bar.event-start.event-continues {
  border-right: 2px dashed rgba(255, 255, 255, 0.5);
}

.event-bar.event-end.event-continues {
  border-left: 2px dashed rgba(255, 255, 255, 0.5);
}

/* DuckHu 무지개 이벤트 애니메이션 */
@keyframes duckhu-rainbow-slide {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.duckhu-rainbow-event {
  background: linear-gradient(90deg,
    #ff0000, #ff8000, #ffff00, #80ff00,
    #00ff00, #00ff80, #00ffff, #0080ff,
    #0000ff, #8000ff, #ff00ff, #ff0080
  ) !important;
  background-size: 400% 400% !important;
  animation: duckhu-rainbow-slide 3s ease-in-out infinite !important;
}

/* 일정 개수 표시 */
.event-count-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  z-index: 15;
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-count-badge:hover {
  background: #495057;
  transform: scale(1.1);
}

/* 툴팁 */
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
  max-width: 200px;
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-date {
  color: #ccc;
  margin-bottom: 2px;
}

.tooltip-time {
  color: #ccc;
  font-size: 11px;
}

/* 반응형 */
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    gap: 10px;
  }

  .month-year-selector {
    order: -1;
  }

  .date-cell {
    height: 80px;
    padding: 4px;
  }

  .event-bar {
    font-size: 10px;
    height: 16px;
  }

  .event-count-badge {
    width: 16px;
    height: 16px;
    font-size: 9px;
  }

  .duckhu-calendar {
    margin: 10px;
    border-radius: 8px;
  }
}

/* 프린트 스타일 */
@media print {
  .duckhu-calendar {
    background: white !important;
    color: black !important;
  }

  .nav-button,
  .add-schedule-btn {
    display: none !important;
  }

  .calendar-container {
    box-shadow: none !important;
    border: 1px solid #000000;
  }

  .date-cell {
    border: 1px solid #cccccc;
    background: white !important;
  }

  .event-bar {
    background: white !important;
    color: black !important;
    border: 1px solid #000000;
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .duckhu-calendar *,
  .event-bar,
  .nav-button,
  .add-schedule-btn,
  .event-count-badge {
    transition: none !important;
    animation: none !important;
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .date-cell {
    border: 2px solid #000000;
  }

  .event-bar {
    border: 2px solid #000000;
    font-weight: bold;
  }

  .event-count-badge {
    border: 2px solid #000000;
  }
}
</style>
