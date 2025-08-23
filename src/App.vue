<template>
  <div id="app">
    <!-- 유지보수 모드 체크 -->
    <MaintenanceMode v-if="isMaintenanceMode && !isAdmin" />
    <RouterView v-else />
  </div>
</template>

<script>
import MaintenanceMode from '@/components/MaintenanceMode.vue'

export default {
  name: 'App',
  components: {
    MaintenanceMode
  },
  data() {
    return {
      theme: localStorage.getItem("theme") || "unique" // 기본값 unique
    };
  },
  watch: {
    theme(newTheme) {
      document.body.className = ""; // 기존 테마 제거
      document.body.classList.add(`theme-${newTheme}`);
      localStorage.setItem("theme", newTheme); // 브라우저 저장
    }
  },
  mounted() {
    // 새로고침 시 body에 적용
    document.body.classList.add(`theme-${this.theme}`);
  },
}
</script>

<style>
/* 전역 스타일 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>
