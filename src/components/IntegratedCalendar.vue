<template>
  <div class="integrated-calendar" :class="themeClass">
    <!-- 캘린더 컨테이너 -->
    <div class="calendar-wrapper">
      <!-- 설정 적용된 향상된 캘린더 -->
      <EnhancedCalendar
        :show-week-numbers="settings.showWeekNumbers"
        :week-start-day="settings.weekStartDay"
        :events-per-page="settings.eventsPerPage"
        :default-view="settings.defaultView"
        @event-selected="handleEventSelected"
        @schedule-updated="handleScheduleUpdated"
      />
    </div>
  </div>
</template>

<script>
import { computed, onMounted, provide, watch } from 'vue'
import EnhancedCalendar from '@/components/EnhancedCalendar.vue'
import { useSettingsStore } from '@/stores/settingsStore.js'

export default {
  name: 'IntegratedCalendar',

  components: {
    EnhancedCalendar
  },

  setup() {
    const settingsStore = useSettingsStore()

    // 설정 반응성
    const settings = computed(() => settingsStore.settings)

    // 테마 클래스
    const themeClass = computed(() => {
      return settingsStore.getThemeClass()
    })

    // 설정을 하위 컴포넌트에 제공
    provide('calendarSettings', settings)

    // 이벤트 핸들러
    const handleEventSelected = (event) => {
      console.log('이벤트 선택됨:', event)
      // 이벤트 상세보기 로직
    }

    const handleScheduleUpdated = () => {
      console.log('스케줄 업데이트됨')
      // 업데이트 후 처리 로직
    }

    // CSS 커스텀 속성 적용
    const applyCSSCustomProperties = () => {
      const root = document.documentElement
      root.style.setProperty('--primary-color', settings.value.primaryColor)
      root.style.setProperty('--week-start-day', settings.value.weekStartDay)
    }

    // 설정 변경 감시 및 자동 CSS 적용
    watch(settings, () => {
      applyCSSCustomProperties()

      // 페이지 제목 동적 업데이트
      if (settings.value.siteTitle) {
        document.title = settings.value.siteTitle
      }
    }, { deep: true })

    onMounted(() => {
      // 초기 CSS 적용
      applyCSSCustomProperties()

      // 페이지 제목 적용
      if (settings.value.siteTitle) {
        document.title = settings.value.siteTitle
      }

      // 메타 설명 적용
      if (settings.value.siteDescription) {
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
          metaDescription.setAttribute('content', settings.value.siteDescription)
        }
      }
    })

    return {
      settings,
      themeClass,
      handleEventSelected,
      handleScheduleUpdated
    }
  }
}
</script>

<style scoped>
.integrated-calendar {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

.calendar-wrapper {
  width: 100%;
  height: 100%;
}

/* 테마별 스타일 */
.light-theme {
  background: #ffffff;
  color: #333333;
}

.dark-theme {
  background: #1a1a1a;
  color: #e0e0e0;
}

/* CSS 커스텀 속성 활용 */
:deep(.calendar-container) {
  --primary: var(--primary-color, #007bff);
  --week-start: var(--week-start-day, 0);
}

/* 주 번호 표시 여부에 따른 레이아웃 조정 */
:deep(.calendar-grid.with-week-numbers) {
  grid-template-columns: 50px repeat(7, 1fr);
}

:deep(.calendar-grid:not(.with-week-numbers)) {
  grid-template-columns: repeat(7, 1fr);
}

/* 메인 색상 적용 */
:deep(.nav-button),
:deep(.today-btn),
:deep(.btn-primary) {
  background-color: var(--primary);
}

:deep(.nav-button:hover),
:deep(.today-btn:hover),
:deep(.btn-primary:hover) {
  background-color: var(--primary);
  filter: brightness(0.9);
}

/* 다크 테마 전용 스타일 */
.dark-theme :deep(.calendar-container) {
  background: #2d2d2d;
  border: 1px solid #404040;
}

.dark-theme :deep(.day-cell) {
  background: #363636;
  border-color: #404040;
}

.dark-theme :deep(.day-cell:hover) {
  background: #404040;
}

.dark-theme :deep(.day-cell.today) {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-color: var(--primary);
}

.dark-theme :deep(.day-header) {
  background: #404040;
  color: #e0e0e0;
}

.dark-theme :deep(.event-bar) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .integrated-calendar {
    padding: 10px;
  }

  /* 모바일에서는 주 번호 숨김 */
  :deep(.week-numbers-column) {
    display: none;
  }

  :deep(.calendar-grid) {
    grid-template-columns: repeat(7, 1fr) !important;
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .integrated-calendar,
  :deep(*) {
    transition: none !important;
    animation: none !important;
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .integrated-calendar {
    --primary-color: #0000ff;
  }

  :deep(.day-cell) {
    border: 2px solid #000000;
  }

  :deep(.event-bar) {
    border: 1px solid #000000;
    font-weight: bold;
  }
}

/* 프린트 스타일 */
@media print {
  .integrated-calendar {
    background: white !important;
    color: black !important;
  }

  :deep(.nav-button),
  :deep(.today-btn),
  :deep(.quick-nav) {
    display: none !important;
  }

  :deep(.calendar-container) {
    box-shadow: none !important;
    border: 1px solid #000000;
  }

  :deep(.day-cell) {
    border: 1px solid #cccccc;
    background: white !important;
  }

  :deep(.event-bar) {
    background: white !important;
    color: black !important;
    border: 1px solid #000000;
  }
}
</style>
