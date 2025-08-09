<template>
  <div class="calendar-component">
    <!-- 캘린더 컨테이너 -->
    <div class="calendar-container">
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

        <button class="add-schedule-btn" @click="openAddScheduleModal">
          일정 추가
        </button>

        <button class="nav-button" @click="nextMonth">다음 ▶</button>
      </div>

      <!-- 캘린더 그리드 -->
      <div class="calendar-grid">
        <!-- 요일 헤더 -->
        <div v-for="day in weekdays" :key="day" class="day-header">
          {{ day }}
        </div>

        <!-- 날짜 셀 -->
        <div v-for="day in calendarDays" :key="day.key"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'holiday': getHolidaysForDay(day.fullDate).length > 0
            }"
            @click="selectDate(day)">

          <div class="day-number">{{ day.date }}</div>

          <!-- 공휴일 표시 -->
          <div v-if="getHolidaysForDay(day.fullDate).length > 0" class="holiday-indicators">
            <div v-if="getHolidaysForDay(day.fullDate).length === 1"
                class="holiday-name"
                :style="{ color: getHolidaysForDay(day.fullDate)[0].color }">
              {{ getHolidaysForDay(day.fullDate)[0].name }}
            </div>
            <div v-else class="holiday-multiple"
                @click="showHolidayDetail(getHolidaysForDay(day.fullDate), $event)">
              <span class="holiday-first">{{ getHolidaysForDay(day.fullDate)[0].name }}</span>
              <span class="holiday-count">+{{ getHolidaysForDay(day.fullDate).length - 1 }}</span>
            </div>
          </div>

          <!-- 기존 일정 바 표시 -->
          <div v-for="(schedule, index) in getSchedulesForDay(day.fullDate)"
              :key="schedule.id"
              v-show="index < 3"
              class="schedule-bar"
              :class="{ rainbow: getSchedulesForDay(day.fullDate).length >= 4 }"
              :style="{ backgroundColor: getSchedulesForDay(day.fullDate).length >= 4 ? '' : schedule.color }"
              @click.stop="openScheduleDetail(schedule, day.fullDate)">
            {{ schedule.title }}
          </div>
        </div>
      </div>
    </div>

    <!-- 일정 추가/수정 모달 -->
    <ScheduleModal
      :show="showScheduleModal"
      :editing-schedule="editingSchedule"
      @save="handleSaveSchedule"
      @close="closeScheduleModal"
    />

    <!-- 일정 상세보기 모달 -->
    <ScheduleDetailModal
      :show="showDetailModal"
      :selected-schedules="selectedSchedules"
      @edit="editSchedule"
      @delete="deleteSchedule"
      @view-single="viewSingleSchedule"
      @close="closeDetailModal"
    />

    <!-- 툴팁 -->
    <div v-if="tooltip.show" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <strong>{{ tooltip.schedule.title }}</strong><br>
      {{ formatDateRange(tooltip.schedule) }}
    </div>
  </div>
</template>

<script>
import ScheduleModal from '@/components/ScheduleModal.vue'
import ScheduleDetailModal from '@/components/ScheduleDetailModal.vue'
import { scheduleAPI } from '@/services/api.js'

export default {
  name: 'CalendarComponent', // 또는 'ScheduleCalendar', 'MainCalendar' 등

  components: {
    ScheduleModal,
    ScheduleDetailModal
  },

  data() {
    return {
      // 현재 날짜 정보
      currentDate: new Date(),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),
      holidays: [], // 공휴일 데이터
      holidaysByDate: {}, // 날짜별 공휴일 맵

      // 캘린더 기본 데이터
      months: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
      ],
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      calendarDays: [], // 캘린더에 표시될 날짜들

      // 일정 관련 데이터
      schedules: [], // 전체 일정 배열
      scheduleIdCounter: 1, // 일정 ID 자동 생성용

      // 모달 상태 관리
      showScheduleModal: false, // 일정 추가/수정 모달
      showDetailModal: false,   // 일정 상세보기 모달
      editingSchedule: null,    // 현재 수정 중인 일정
      selectedSchedules: [],    // 선택된 일정들
      selectedDate: null,       // 선택된 날짜

      // 툴팁 관리
      tooltip: {
        show: false,
        x: 0,
        y: 0,
        schedule: null
      },

      // 일정 색상 관리
      colors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#F4A460', '#87CEEB', '#98D8C8', '#FFB6C1',
        '#FFA07A', '#20B2AA', '#9370DB', '#3CB371', '#FF7F50'
      ],
      usedColors: new Set() // 사용 중인 색상 추적
    }
  },

  computed: {
    // 선택 가능한 연도 목록 (현재 연도 기준 ±10년)
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
    // 선택된 연도가 변경되면 캘린더 재생성
    selectedYear() {
      this.generateCalendar();
      this.loadHolidays(); // 연도 변경 시 공휴일 다시 로딩
    },

    // 선택된 월이 변경되면 캘린더 재생성
    selectedMonth() {
      this.generateCalendar();
    },

    // 일정 배열이 변경되면 자동 저장 및 알림 재설정
    schedules: {
      handler() {
        this.saveSchedules() // 로컬 스토리지에 저장
        this.scheduleNotifications() // 알림 재설정
      },
      deep: true // 배열 내부 객체의 변경도 감지
    }
  },

  mounted() {
    // 컴포넌트가 DOM에 마운트된 후 실행
    console.log('캘린더 컴포넌트가 로드되었습니다.')
    this.generateCalendar()     // 캘린더 생성
    this.loadSchedules()        // 저장된 일정 불러오기
    this.loadHolidays();        // 공휴일 로딩 추가
    this.setupNotifications()   // 브라우저 알림 권한 요청
  },

  methods: {
    // === 캘린더 관련 메서드 ===

    /**
     * 캘린더 그리드 생성
     */
    generateCalendar() {
      const year = this.selectedYear
      const month = this.selectedMonth

      // 해당 월의 첫째 날과 마지막 날
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // 캘린더 그리드 시작일 (첫 주의 일요일)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())

      // 캘린더 그리드 종료일 (마지막 주의 토요일)
      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

      // 날짜 배열 생성
      const days = []
      const current = new Date(startDate)

      while (current <= endDate) {
        days.push({
          date: current.getDate(),                    // 날짜 숫자
          fullDate: this.formatDate(current),        // YYYY-MM-DD 형식
          isCurrentMonth: current.getMonth() === month, // 현재 월 여부
          key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
        })
        current.setDate(current.getDate() + 1)
      }

      this.calendarDays = days
    },

    /**
     * 이전 월로 이동
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
     * 다음 월로 이동
     */
    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0
        this.selectedYear++
      } else {
        this.selectedMonth++
      }
    },

    // === 일정 관리 메서드 ===

    /**
     * 특정 날짜의 일정들을 가져오기
     */
    getSchedulesForDay(date) {
      return this.schedules.filter(schedule => {
        const startDate = new Date(schedule.startDate)
        const endDate = new Date(schedule.endDate)
        const currentDate = new Date(date)

        return currentDate >= startDate && currentDate <= endDate
      })
    },

    /**
     * 일정 저장 핸들러 (자식 컴포넌트에서 emit된 이벤트 처리)
     */
    async handleSaveSchedule(scheduleData) {
      try {
        if (this.editingSchedule) {
          // 기존 일정 수정 - API 호출
          const updatedSchedule = await scheduleAPI.updateSchedule(
            this.editingSchedule.id,
            scheduleData
          )

          // 로컬 배열 업데이트
          const index = this.schedules.findIndex(s => s.id === this.editingSchedule.id)
          if (index !== -1) {
            this.schedules[index] = updatedSchedule
          }

          console.log('일정이 수정되었습니다:', updatedSchedule.title)
        } else {
          // 새 일정 추가 - API 호출
          const newSchedule = {
            ...scheduleData,
            color: this.getAvailableColor()
          }

          const createdSchedule = await scheduleAPI.createSchedule(newSchedule)
          this.schedules.push(createdSchedule)

          console.log('새 일정이 추가되었습니다:', createdSchedule.title)
        }

        this.closeScheduleModal()
      } catch (error) {
        console.error('일정 저장 실패:', error)
        alert(error.message)
      }
    },

    /**
     * 일정 삭제
     */
    async deleteSchedule(schedule) {
      if (confirm(`"${schedule.title}" 일정을 정말로 삭제하시겠습니까?`)) {
        try {
          // API로 삭제 요청
          await scheduleAPI.deleteSchedule(schedule.id)

          // 로컬 배열에서 제거
          this.usedColors.delete(schedule.color)
          this.schedules = this.schedules.filter(s => s.id !== schedule.id)

          this.closeDetailModal()
          console.log(`일정 "${schedule.title}"이 삭제되었습니다.`)
        } catch (error) {
          console.error('일정 삭제 실패:', error)
          alert(error.message)
        }
      }
    },

    // === 모달 관리 메서드 ===

    /**
     * 날짜 선택 처리
     */
    selectDate(day) {
      this.selectedDate = day.fullDate
      const schedulesForDay = this.getSchedulesForDay(day.fullDate)

      if (schedulesForDay.length > 1) {
        // 여러 일정이 있으면 우선순위 순으로 정렬하여 리스트 표시
        this.selectedSchedules = schedulesForDay.sort((a, b) => a.priority - b.priority)
        this.showDetailModal = true
      } else if (schedulesForDay.length === 1) {
        // 단일 일정이면 바로 상세보기
        this.selectedSchedules = [schedulesForDay[0]]
        this.showDetailModal = true
      }
    },

    /**
     * 일정 추가 모달 열기
     */
    openAddScheduleModal() {
      this.editingSchedule = null
      this.showScheduleModal = true
    },

    /**
     * 일정 수정 모달 열기
     */
    editSchedule(schedule) {
      this.editingSchedule = schedule
      this.showDetailModal = false
      this.showScheduleModal = true
    },

    /**
     * 일정 상세보기 모달 열기
     */
    openScheduleDetail(schedule, date) {
      const schedulesForDay = this.getSchedulesForDay(date)

      if (schedulesForDay.length === 1) {
        this.selectedSchedules = [schedule]
      } else {
        // 여러 일정이 있으면 우선순위 순으로 정렬
        this.selectedSchedules = schedulesForDay.sort((a, b) => a.priority - b.priority)
      }

      this.showDetailModal = true
    },

    /**
     * 단일 일정 상세보기
     */
    viewSingleSchedule(schedule) {
      this.selectedSchedules = [schedule]
    },

    /**
     * 일정 추가/수정 모달 닫기
     */
    closeScheduleModal() {
      this.showScheduleModal = false
      this.editingSchedule = null
    },

    /**
     * 일정 상세보기 모달 닫기
     */
    closeDetailModal() {
      this.showDetailModal = false
      this.selectedSchedules = []
    },

    // === 유틸리티 메서드 ===

    /**
     * 사용 가능한 색상 가져오기
     */
    getAvailableColor() {
      // 미사용 색상 찾기
      for (const color of this.colors) {
        if (!this.usedColors.has(color)) {
          this.usedColors.add(color)
          return color
        }
      }

      // 모든 기본 색상이 사용중이면 랜덤 색상 생성
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      this.usedColors.add(randomColor)
      return randomColor
    },

    /**
     * Date 객체를 YYYY-MM-DD 형식으로 변환
     */
    formatDate(date) {
      return date.toISOString().split('T')[0]
    },

    /**
     * 일정의 날짜 범위를 읽기 쉬운 형식으로 포맷팅
     */
    formatDateRange(schedule) {
      const start = new Date(schedule.startDate)
      const end = new Date(schedule.endDate)
      const startStr = `${start.getMonth() + 1}/${start.getDate()}`
      const endStr = `${end.getMonth() + 1}/${end.getDate()}`

      let timeStr = ''
      if (schedule.startTime && schedule.endTime) {
        timeStr = ` ${schedule.startTime} - ${schedule.endTime}`
      } else if (schedule.startTime) {
        timeStr = ` ${schedule.startTime}부터`
      } else {
        timeStr = ' (종일)'
      }

      return schedule.startDate === schedule.endDate
        ? startStr + timeStr
        : `${startStr} - ${endStr}${timeStr}`
    },

    // === 툴팁 관리 메서드 ===

    /**
     * 툴팁 표시
     */
    showTooltip(event, schedule) {
      this.tooltip = {
        show: true,
        x: event.clientX + 10,
        y: event.clientY - 10,
        schedule: schedule
      }
    },

    /**
     * 툴팁 숨기기
     */
    hideTooltip() {
      this.tooltip.show = false
    },

    // === 데이터 저장/불러오기 메서드 ===

    /**
     * 서버에서 일정 불러오기
     */
    async loadSchedules() {
      try {
        console.log('서버에서 일정을 불러오는 중...')
        const schedulesFromServer = await scheduleAPI.getAllSchedules()

        // 서버 데이터 유효성 검사
        if (Array.isArray(schedulesFromServer)) {
          this.schedules = schedulesFromServer

          // ID 카운터 설정 (기존 ID 중 최댓값 + 1)
          if (this.schedules.length > 0) {
            this.scheduleIdCounter = Math.max(...this.schedules.map(s => s.id || 0)) + 1
          }

          // 사용 중인 색상 추적
          this.schedules.forEach(schedule => {
            if (schedule.color) {
              this.usedColors.add(schedule.color)
            }
          })

          console.log(`✅ ${this.schedules.length}개의 일정을 서버에서 불러왔습니다.`)
        }
      } catch (error) {
        console.error('❌ 서버에서 일정 불러오기 실패:', error)
        alert(`서버 연결 실패: ${error.message}\n로컬 저장소 데이터를 사용합니다.`)

        // 폴백: 로컬 스토리지에서 불러오기
        this.loadSchedulesFromLocalStorage()
      }
    },

    /**
     * 로컬 스토리지에서 일정 불러오기 (폴백)
     */
    loadSchedulesFromLocalStorage() {
      try {
        const saved = localStorage.getItem('vue-calendar-schedules')
        if (saved) {
          const parsedSchedules = JSON.parse(saved)

          if (Array.isArray(parsedSchedules)) {
            this.schedules = parsedSchedules

            if (this.schedules.length > 0) {
              this.scheduleIdCounter = Math.max(...this.schedules.map(s => s.id || 0)) + 1
            }

            this.schedules.forEach(schedule => {
              if (schedule.color) {
                this.usedColors.add(schedule.color)
              }
            })

            console.log(`📱 로컬 스토리지에서 ${this.schedules.length}개의 일정을 불러왔습니다.`)
          }
        }
      } catch (error) {
        console.error('로컬 스토리지 불러오기 실패:', error)
        this.schedules = []
      }
    },

    /**
     * 로컬 스토리지에 일정 저장
     */
    saveSchedules() {
      try {
        const dataToSave = JSON.stringify(this.schedules)
        localStorage.setItem('vue-calendar-schedules', dataToSave)
        console.log('일정이 저장되었습니다.')
      } catch (error) {
        console.error('일정 저장 실패:', error)
        alert('일정 저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.')
      }
    },

    // === 알림 관련 메서드 ===

    /**
     * 브라우저 알림 권한 설정
     */
    setupNotifications() {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('알림 권한이 허용되었습니다.')
            } else {
              console.log('알림 권한이 거부되었습니다.')
            }
          })
        }
      } else {
        console.log('이 브라우저는 알림을 지원하지 않습니다.')
      }
    },

    /**
     * 일정 알림 스케줄링
     */
    scheduleNotifications() {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // 오늘과 내일의 일정만 처리
      ;[today, tomorrow].forEach(date => {
        const dateStr = this.formatDate(date)
        const schedulesForDay = this.getSchedulesForDay(dateStr)
          .sort((a, b) => a.priority - b.priority)

        schedulesForDay.forEach(schedule => {
          // 알림 시간 계산
          const notificationTime = schedule.startTime ?
            new Date(`${schedule.startDate}T${schedule.startTime}`) :
            new Date(`${schedule.startDate}T09:00`)

          // 현재 시간보다 이후인 일정만 알림 설정
          if (notificationTime > new Date()) {
            const timeUntilNotification = notificationTime - new Date()

            // 24시간 이내의 일정만 알림 설정
            if (timeUntilNotification <= 24 * 60 * 60 * 1000) {
              setTimeout(() => {
                this.showNotification(schedule)
              }, timeUntilNotification)
            }
          }
        })
      })
    },

    /**
     * 브라우저 알림 표시
     */
    showNotification(schedule) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeStr = schedule.startTime ?
          `${schedule.startTime}` : '오전 9시'

        const notification = new Notification(`📅 일정 알림: ${schedule.title}`, {
          body: `${timeStr}에 시작하는 일정이 있습니다.`,
          icon: '/favicon.ico',
          tag: `schedule-${schedule.id}`,
          requireInteraction: true
        })

        // 알림 클릭 시 상세보기 모달 열기
        notification.onclick = () => {
          window.focus()
          this.selectedSchedules = [schedule]
          this.showDetailModal = true
          notification.close()
        }

        // 10초 후 자동으로 알림 닫기
        setTimeout(() => {
          notification.close()
        }, 10000)
      }
    },

    /**
     * 공휴일 데이터 로딩
     */
    async loadHolidays() {
      try {
        const year = this.selectedYear;
        // eslint-disable-next-line no-undef
        const response = await axios.get(`/api/holidays/year/${year}`);
        this.holidays = response.data.holidays || [];

        // 날짜별 공휴일 맵 생성
        this.holidaysByDate = {};
        this.holidays.forEach(holiday => {
          const date = holiday.holidayDate;
          if (!this.holidaysByDate[date]) {
            this.holidaysByDate[date] = [];
          }
          this.holidaysByDate[date].push(holiday);
        });
      } catch (error) {
        console.error('공휴일 로딩 실패:', error);
      }
    },

    /**
     * 특정 날짜의 공휴일 조회
     */
    getHolidaysForDay(date) {
      return this.holidaysByDate[date] || [];
    },

    /**
     * 공휴일 팝업 표시
     */
    showHolidayDetail(holidays, event) {
      // 공휴일 상세 정보 모달 표시
      this.selectedHolidays = holidays;
      this.showHolidayModal = true;
      event.stopPropagation();
    }
  }
}
</script>

<style scoped>
.calendar-component {
  padding: 20px;
}

/* 캘린더 컨테이너 */
.calendar-container {
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

/* 네비게이션 버튼 */
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

/* 월/년도 선택 드롭다운 */
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
  transition: box-shadow 0.3s ease;
}

.month-year-selector select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

/* 일정 추가 버튼 */
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
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 캘린더 그리드 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
}

/* 요일 헤더 */
.day-header {
  background: #f8f9fa;
  padding: 15px;
  text-align: center;
  font-weight: bold;
  color: #495057;
  font-size: 14px;
}

/* 일요일과 토요일 헤더 색상 */
.day-header:first-child {
  color: #dc3545; /* 일요일 - 빨간색 */
}

.day-header:last-child {
  color: #007bff; /* 토요일 - 파란색 */
}

/* 날짜 셀 */
.day-cell {
  background: white;
  min-height: 120px;
  padding: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.day-cell:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

/* 다른 월의 날짜 (회색 처리) */
.day-cell.other-month {
  background: #f8f9fa;
  color: #adb5bd;
}

.day-cell.other-month:hover {
  background: #e9ecef;
}

/* 날짜 숫자 */
.day-number {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
}

/* 일정 바 스타일 */
.schedule-bar {
  height: 18px;
  margin: 2px 0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: white;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  transition: all 0.2s ease;
}

.schedule-bar:hover {
  transform: scale(1.02);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 무지개 색상 (4개 이상 일정) */
.schedule-bar.rainbow {
  background: linear-gradient(90deg,
    #ff0000, #ff8000, #ffff00, #80ff00,
    #00ff00, #00ff80, #00ffff, #0080ff,
    #0000ff, #8000ff, #ff00ff, #ff0080
  );
  background-size: 400% 400%;
  animation: rainbow-slide 3s ease-in-out infinite;
}

@keyframes rainbow-slide {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 일정 개수 표시 */
.schedule-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 툴팁 스타일 */
.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

/* 공휴일이 있는 날짜 셀 */
.day-cell.holiday {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
}

/* 공휴일 표시 영역 */
.holiday-indicators {
  margin-bottom: 4px;
  font-size: 10px;
  line-height: 1.2;
}

/* 단일 공휴일 표시 */
.holiday-name {
  font-weight: 600;
  padding: 1px 3px;
  border-radius: 2px;
  background: rgba(255, 107, 107, 0.1);
  color: #e53e3e;
  text-align: center;
  cursor: default;
}

/* 다중 공휴일 표시 */
.holiday-multiple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1px 3px;
  border-radius: 2px;
  background: rgba(255, 107, 107, 0.1);
  color: #e53e3e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.holiday-multiple:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.05);
}

.holiday-first {
  font-weight: 600;
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.holiday-count {
  font-weight: 700;
  background: #e53e3e;
  color: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  margin-left: 2px;
}

/* 오늘이면서 공휴일인 경우 */
.day-cell.today.holiday {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-color: #ff6b6b;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .calendar-component {
    padding: 10px;
  }

  .calendar-header {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }

  .day-cell {
    min-height: 80px;
    padding: 4px;
  }

  .nav-button,
  .add-schedule-btn {
    min-width: auto;
    padding: 8px 12px;
    font-size: 14px;
  }

  .month-year-selector {
    flex-direction: column;
    gap: 5px;
  }

  .month-year-selector select {
    width: 100%;
  }
}
</style>
