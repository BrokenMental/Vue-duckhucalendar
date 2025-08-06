<template>
  <div class="calendar-page">
    <!-- 페이지 헤더 -->
    <header class="page-header">
      <h1>📅 Vue 스케줄 관리</h1>
      <nav class="page-nav">
        <RouterLink to="/" class="nav-link">캘린더</RouterLink>
        <RouterLink to="/settings" class="nav-link">설정</RouterLink>
      </nav>
    </header>

    <!-- 캘린더 컴포넌트 -->
    <Calendar />
  </div>
</template>

<script>
// 캘린더 컴포넌트 import
import Calendar from '@/components/Calendar.vue'

export default {
  name: 'CalendarView',
  components: {
    Calendar
  }
}
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.page-nav {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 5px;
  transition: background 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .page-header h1 {
    font-size: 24px;
  }
}
</style>
