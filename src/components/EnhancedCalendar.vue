<template>
  <div class="enhanced-calendar">
    <!-- 캘린더 컨테이너 -->
    <div class="calendar-container">
      <!-- 캘린더 헤더 (간소화) -->
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
               'has-events': getEventsForDay(day.fullDate).length > 0,
               'holiday': getHolidaysForDay(day.fullDate).length > 0
             }"
             @click="selectDate(day)">

          <div class="day-number">{{ day.date }}</div>

          <!-- 공휴일 표시 (추가된 부분) -->
          <div v-if="getHolidaysForDay(day.fullDate).length > 0" class="holiday-indicators">
            <!-- 단일 공휴일인 경우 -->
            <div v-if="getHolidaysForDay(day.fullDate).length === 1"
                 class="holiday-name"
                 :style="{ color: getHolidaysForDay(day.fullDate)[0].color }">
              {{ getHolidaysForDay(day.fullDate)[0].name }}
            </div>

            <!-- 여러 공휴일인 경우 -->
            <div v-else
                 class="holiday-multiple"
                 @click="showHolidayDetail(getHolidaysForDay(day.fullDate), $event)">
              <span class="holiday-first">{{ getHolidaysForDay(day.fullDate)[0].name }}</span>
              <span class="holiday-count">+{{ getHolidaysForDay(day.fullDate).length - 1 }}</span>
            </div>
          </div>

          <!-- 이벤트 표시 -->
          <div class="events-container">
            <div v-for="(event) in getEventsForDay(day.fullDate).slice(0, 3)"
                 :key="event.id"
                 class="event-bar"
                 :class="{
                   'rainbow': getEventsForDay(day.fullDate).length >= 4,
                   'featured': event.isFeatured
                 }"
                 :style="getEventStyle(event, getEventsForDay(day.fullDate).length)"
                 @click.stop="selectEvent(event)"
                 @mouseenter="showTooltip($event, event)"
                 @mouseleave="hideTooltip">

              <span class="event-title">{{ truncateText(event.title, 12) }}</span>

              <!-- 이벤트 추가 정보 배지들 -->
              <div class="event-badges">
                <span v-if="event.location" class="location-badge">📍</span>
                <span v-if="event.attachment" class="attachment-badge">📎</span>
                <span v-if="event.imageUrl" class="image-badge">🖼️</span>
                <span v-if="event.linkUrl" class="link-badge">🔗</span>
                <span v-if="event.isFeatured" class="featured-badge">⭐</span>
              </div>
            </div>

            <!-- 더 많은 이벤트가 있는 경우 -->
            <div v-if="getEventsForDay(day.fullDate).length > 3"
                 class="more-events"
                 @click.stop="selectDate(day)">
              +{{ getEventsForDay(day.fullDate).length - 3 }}개 더
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이벤트 상세 정보 모달 -->
    <EnhancedScheduleDetailModal
      v-if="showDetailModal"
      :schedules="selectedSchedules"
      @close="closeDetailModal"
      @schedule-updated="loadSchedules"
    />

    <!-- 툴팁 -->
    <div v-if="tooltip.show"
         class="enhanced-tooltip"
         :style="tooltipStyle">
      <div class="tooltip-date">{{ formatDateRange(tooltip.event) }}</div>
      <div class="tooltip-title">{{ tooltip.event.title }}</div>
      <div v-if="tooltip.event.description" class="tooltip-description">
        {{ truncateText(tooltip.event.description, 50) }}
      </div>
    </div>
  </div>
</template>

<script>
import EnhancedScheduleDetailModal from '@/components/EnhancedScheduleDetailModal.vue';
import { scheduleAPI, holidayAPI } from '@/services/api.js';

export default {
  name: 'EnhancedCalendar',

  components: {
    EnhancedScheduleDetailModal
  },

  emits: ['schedule-selected', 'schedule-updated'],

  data() {
    return {
      // 날짜 관련
      currentDate: new Date(),
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),
      cachedMonths: new Map(), // 캐시

      // 캘린더 데이터
      months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      calendarDays: [],

      // 이벤트 데이터
      schedules: [],

      // 모달 상태
      showDetailModal: false,
      selectedSchedules: [],

      // 툴팁
      tooltip: {
        show: false,
        x: 0,
        y: 0,
        event: null
      },

      // 공휴일 데이터
      holidays: [], // 공휴일 데이터
      holidaysByDate: {}, // 날짜별 공휴일 맵

      // 로딩 상태
      isLoading: false
    };
  },

  computed: {
    currentMonthYear() {
      return `${this.selectedYear}년 ${this.months[this.selectedMonth]}`;
    },

    availableYears() {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        years.push(i);
      }
      return years;
    },

    tooltipStyle() {
      return {
        left: this.tooltip.x + 'px',
        top: this.tooltip.y + 'px'
      };
    }
  },

  watch: {
    selectedYear() {
      this.generateCalendar();
      this.loadMonthSchedules(); // 월별 데이터
      this.loadHolidays(); // 연도 변경 시 공휴일 다시 로딩
    },
    selectedMonth() {
      this.generateCalendar();
      this.loadMonthSchedules(); // 월별 데이터
    }
  },

  mounted() {
    this.generateCalendar();
    this.loadMonthSchedules();
    this.loadHolidays(); // 공휴일 자동 로딩
    this.setupNotifications();
  },

  methods: {
    // === 캘린더 생성 관련 메서드 ===

    /**
     * 캘린더 그리드 생성
     */
    generateCalendar() {
      const year = this.selectedYear;
      const month = this.selectedMonth;
      const today = new Date();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

      const days = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        const isToday = current.toDateString() === today.toDateString();

        days.push({
          date: current.getDate(),
          fullDate: this.formatDate(current),
          isCurrentMonth: current.getMonth() === month,
          isToday: isToday,
          key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
        });
        current.setDate(current.getDate() + 1);
      }

      this.calendarDays = days;
    },

    // === 네비게이션 메서드 ===

    previousMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11;
        this.selectedYear--;
      } else {
        this.selectedMonth--;
      }
    },

    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0;
        this.selectedYear++;
      } else {
        this.selectedMonth++;
      }
    },

    goToToday() {
      const today = new Date();
      this.selectedYear = today.getFullYear();
      this.selectedMonth = today.getMonth();
    },

    // === 이벤트 관련 메서드 ===

    /**
     * 특정 날짜의 이벤트 조회 (기존 getEventsForDay를 대체)
     */
    getEventsForDay(date) {
      return this.schedules.filter(schedule => {
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);
        const currentDate = new Date(date);

        return currentDate >= startDate && currentDate <= endDate;
      }).sort((a, b) => {
        // 추천 이벤트를 먼저, 그 다음 우선순위순
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.priority || 2) - (b.priority || 2);
      });
    },

    getEventStyle(event, totalEvents) {
      if (totalEvents >= 4) {
        return {}; // 무지개 색상은 CSS로 처리
      }

      return {
        backgroundColor: event.color || '#007bff',
        borderLeft: event.isFeatured ? '3px solid #FFD700' : 'none'
      };
    },

    selectDate(day) {
      const events = this.getEventsForDay(day.fullDate);
      if (events.length > 0) {
        this.selectedSchedules = events;
        this.showDetailModal = true;
        this.$emit('schedule-selected', events);
      }
    },

    selectEvent(event) {
      // 조회수 증가
      this.incrementViewCount(event.id);

      this.selectedSchedules = [event];
      this.showDetailModal = true;
      this.$emit('schedule-selected', [event]);
    },

    closeDetailModal() {
      this.showDetailModal = false;
      this.selectedSchedules = [];
    },

    // === 공휴일 관련 메서드 ===

    /**
     * 공휴일 데이터 로딩 (자동 초기화 포함)
     */
    async loadHolidays() {
      try {
        const year = this.selectedYear;
        console.log(`📅 ${year}년 공휴일 로딩 중...`);

        // holidayAPI를 사용한 공휴일 조회
        const response = await holidayAPI.getHolidaysByYearCached(year);

        this.holidays = response.holidays || [];

        // 날짜별 공휴일 맵 생성
        this.holidaysByDate = {};
        this.holidays.forEach(holiday => {
          const date = holiday.holidayDate;
          if (!this.holidaysByDate[date]) {
            this.holidaysByDate[date] = [];
          }
          this.holidaysByDate[date].push(holiday);
        });

        console.log(`✅ ${year}년 공휴일 ${this.holidays.length}개 로딩 완료`);
      } catch (error) {
        console.error('❌ 공휴일 로딩 실패:', error);
        // 실패해도 계속 진행 (공휴일 없이)
        this.holidays = [];
        this.holidaysByDate = {};
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
      // 간단한 alert으로 표시 (나중에 모달로 개선 가능)
      const holidayNames = holidays.map(h => h.name).join(', ');
      alert(`📅 ${holidays[0].holidayDate}\n\n공휴일: ${holidayNames}`);
      event.stopPropagation();
    },

    // === 데이터 로딩 메서드 ===

    async loadMonthSchedules() {
      try {
        this.isLoading = true;

        const year = this.selectedYear;
        const month = this.selectedMonth + 1; // JavaScript는 0부터, API는 1부터
        const cacheKey = `${year}-${month}`;

        // 캐시 확인
        if (this.cachedMonths.has(cacheKey)) {
          console.log(`📦 캐시에서 ${year}년 ${month}월 데이터 로드`);
          this.schedules = this.cachedMonths.get(cacheKey);
          this.$emit('schedules-loaded', this.schedules);
          return;
        }

        console.log(`📡 서버에서 ${year}년 ${month}월 일정 로딩 중...`);

        const response = await scheduleAPI.getSchedulesByMonth(year, month);
        this.schedules = response.schedules || [];

        // 캐시에 저장 (5분간 유지)
        this.cachedMonths.set(cacheKey, this.schedules);
        setTimeout(() => {
          this.cachedMonths.delete(cacheKey);
        }, 5 * 60 * 1000);

        console.log(`✅ ${year}년 ${month}월 일정 ${this.schedules.length}개 로딩 완료`);

        // MainLayout의 사이드바 업데이트
        this.$emit('schedules-loaded', this.schedules);

      } catch (error) {
        console.error('❌ 월별 일정 로딩 실패:', error);
        this.schedules = [];
      } finally {
        this.isLoading = false;
      }
    },

    // 캐시 초기화 메서드 (일정 추가/수정/삭제 시 호출)
    clearCache() {
      this.cachedMonths.clear();
      this.loadMonthSchedules(); // 현재 월 다시 로드
    },

    // 인접 월 프리로딩 (선택적)
    async preloadAdjacentMonths() {
      const prevMonth = this.selectedMonth === 0 ? 12 : this.selectedMonth;
      const prevYear = this.selectedMonth === 0 ? this.selectedYear - 1 : this.selectedYear;
      const nextMonth = this.selectedMonth === 11 ? 1 : this.selectedMonth + 2;
      const nextYear = this.selectedMonth === 11 ? this.selectedYear + 1 : this.selectedYear;

      // 백그라운드에서 조용히 로드
      try {
        const [prevResponse, nextResponse] = await Promise.all([
          scheduleAPI.getSchedulesByMonth(prevYear, prevMonth),
          scheduleAPI.getSchedulesByMonth(nextYear, nextMonth)
        ]);

        this.cachedMonths.set(`${prevYear}-${prevMonth}`, prevResponse.schedules);
        this.cachedMonths.set(`${nextYear}-${nextMonth}`, nextResponse.schedules);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        console.log('인접 월 프리로딩 실패 (무시)');
      }
    },

    // 조회수 증가
    async incrementViewCount(scheduleId) {
      try {
        await scheduleAPI.incrementViewCount(scheduleId);
      } catch (error) {
        console.error('조회수 증가 실패:', error);
      }
    },

    // === 툴팁 관련 메서드 ===

    showTooltip(event, schedule) {
      this.tooltip = {
        show: true,
        x: event.clientX + 10,
        y: event.clientY - 10,
        event: schedule
      };
    },

    hideTooltip() {
      this.tooltip.show = false;
    },

    // === 알림 관련 메서드 ===

    /**
     * 브라우저 알림 권한 요청
     */
    setupNotifications() {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('알림 권한이 허용되었습니다.');
            } else {
              console.log('알림 권한이 거부되었습니다.');
            }
          });
        }
      } else {
        console.log('이 브라우저는 알림을 지원하지 않습니다.');
      }
    },

    /**
     * 일정 알림 스케줄링
     */
    scheduleNotifications() {
      // 기본적으로는 빈 구현 (필요시 확장)
      console.log('알림 스케줄링 완료');
    },

    /**
     * 브라우저 알림 표시
     */
    showNotification(schedule) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeStr = schedule.startTime ?
          ` (${schedule.startTime})` :
          ' (종일)';

        new Notification(`📅 ${schedule.title}`, {
          body: `${schedule.startDate}${timeStr}`,
          icon: '/favicon.ico',
          tag: `schedule-${schedule.id}`
        });
      }
    },

    // === 유틸리티 메서드 ===

    formatDate(date) {
      return date.toISOString().split('T')[0];
    },

    formatDateRange(schedule) {
      const start = new Date(schedule.startDate);
      const end = new Date(schedule.endDate);
      const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
      const endStr = `${end.getMonth() + 1}/${end.getDate()}`;

      let timeStr = '';
      if (schedule.startTime && schedule.endTime) {
        timeStr = ` ${schedule.startTime}-${schedule.endTime}`;
      } else if (schedule.startTime) {
        timeStr = ` ${schedule.startTime}~`;
      } else {
        timeStr = ' (종일)';
      }

      return schedule.startDate === schedule.endDate
        ? startStr + timeStr
        : `${startStr}-${endStr}${timeStr}`;
    },

    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text;
    }
  }
}
</script>

<style scoped>
.enhanced-calendar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
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

.nav-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
  font-weight: bold;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.month-year-display h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 빠른 네비게이션 */
.quick-nav {
  padding: 15px 20px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.today-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.month-year-selector {
  display: flex;
  gap: 10px;
}

.month-year-selector select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* 캘린더 그리드 */
.calendar-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  gap: 1px;
  background-color: #e0e0e0;
  overflow: hidden;
}

.day-header {
  background: #f8f9fa;
  padding: 12px;
  text-align: center;
  font-weight: 700;
  color: #495057;
  font-size: 14px;
  border-bottom: 2px solid #dee2e6;
}

.day-header:first-child {
  color: #dc3545; /* 일요일 */
}

.day-header:last-child {
  color: #007bff; /* 토요일 */
}

/* 날짜 셀 */
.day-cell {
  background: white;
  padding: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  min-height: 100px;
  display: flex;
  flex-direction: column;
}

.day-cell:hover {
  background: #f8f9fa;
  border-color: #007bff;
  transform: scale(1.02);
  z-index: 5;
}

.day-cell.other-month {
  background: #f8f9fa;
  color: #adb5bd;
}

.day-cell.today {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-color: #ffc107;
  font-weight: bold;
}

.day-cell.has-events {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.day-number {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  z-index: 1;
}

/* 이벤트 컨테이너 */
.events-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

/* 이벤트 바 */
.event-bar {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 18px;
  position: relative;
  overflow: hidden;
}

.event-bar:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.event-bar.featured {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.4);
}

.event-bar.rainbow {
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

.event-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-icon {
  font-size: 10px;
  opacity: 0.8;
}

.event-count {
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
  cursor: pointer;
  margin-top: auto;
  align-self: flex-end;
  transition: all 0.2s ease;
}

.event-count:hover {
  background: #495057;
  transform: scale(1.1);
}

/* 향상된 툴팁 */
.enhanced-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  padding: 12px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  max-width: 250px;
  min-width: 200px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.tooltip-header strong {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.tooltip-badges {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.featured-badge,
.image-badge,
.link-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.featured-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #333;
}

.tooltip-date {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 4px;
}

.tooltip-description {
  font-size: 12px;
  line-height: 1.4;
  color: #e0e0e0;
}

/* 공휴일이 있는 날짜 셀 */
.day-cell.holiday {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border: 1px solid #ffcccb;
}

/* 오늘이면서 공휴일인 경우 */
.day-cell.today.holiday {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 2px solid #ff6b6b;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
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
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(255, 107, 107, 0.15);
  color: #e53e3e;
  text-align: center;
  cursor: default;
  border: 1px solid rgba(255, 107, 107, 0.3);
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 다중 공휴일 표시 */
.holiday-multiple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(255, 107, 107, 0.15);
  color: #e53e3e;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 107, 107, 0.3);
  font-size: 9px;
}

.holiday-multiple:hover {
  background: rgba(255, 107, 107, 0.25);
  transform: scale(1.02);
  box-shadow: 0 1px 3px rgba(255, 107, 107, 0.3);
}

.holiday-first {
  font-weight: 600;
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}

.holiday-count {
  font-weight: 700;
  background: #e53e3e;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  min-width: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 공휴일 상세 팝업 (간단한 버전) */
.holiday-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  max-width: 300px;
  width: 90%;
}

.holiday-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.holiday-popup h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.holiday-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.holiday-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.holiday-list li:last-child {
  border-bottom: none;
}

.holiday-popup-close {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

/* 작은 화면에서 공휴일 표시 최적화 */
@media (max-width: 768px) {
  .holiday-name,
  .holiday-multiple {
    font-size: 8px;
    padding: 1px 2px;
  }

  .holiday-count {
    width: 14px;
    height: 14px;
    font-size: 7px;
    min-width: 14px;
  }

  .holiday-first {
    margin-right: 2px;
  }
}

/* 다크 테마 지원 */
[data-theme="dark"] .day-cell.holiday {
  background: linear-gradient(135deg, #2d1b1b 0%, #3d2020 100%);
  border-color: #4a2525;
}

[data-theme="dark"] .holiday-name,
[data-theme="dark"] .holiday-multiple {
  background: rgba(255, 107, 107, 0.2);
  color: #ff8a80;
  border-color: rgba(255, 107, 107, 0.4);
}

[data-theme="dark"] .holiday-popup {
  background: #2d2d2d;
  color: white;
}

[data-theme="dark"] .holiday-popup h3 {
  color: white;
}

[data-theme="dark"] .holiday-list li {
  color: #ccc;
  border-bottom-color: #444;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .calendar-header {
    padding: 15px;
  }

  .month-year-display h2 {
    font-size: 22px;
  }

  .quick-nav {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .day-cell {
    min-height: 80px;
    padding: 4px;
  }

  .day-number {
    font-size: 12px;
  }

  .event-bar {
    font-size: 10px;
    min-height: 16px;
    padding: 1px 4px;
  }

  .enhanced-tooltip {
    max-width: 200px;
    min-width: 150px;
    padding: 8px;
  }
}
</style>
