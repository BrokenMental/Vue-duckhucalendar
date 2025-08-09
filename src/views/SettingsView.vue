<template>
  <div class="settings-page">
    <header class="settings-header">
      <button class="back-button" @click="goToCalendar">
        <span class="back-icon">←</span>
        캘린더로 돌아가기
      </button>
    </header>

    <div class="settings-content">
      <div class="setting-group">
        <h3>알림 설정</h3>
        <div class="settings-card">
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="settings.enableNotifications" />
              브라우저 알림 사용
            </label>
            <p class="setting-description">
              일정 시간에 브라우저 알림을 받습니다.
            </p>
          </div>

          <div class="setting-item">
            <label>기본 알림 시간:</label>
            <select v-model="settings.defaultNotificationTime">
              <option value="09:00">오전 9시</option>
              <option value="10:00">오전 10시</option>
              <option value="11:00">오전 11시</option>
              <option value="14:00">오후 2시</option>
            </select>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3>화면 설정</h3>
        <div class="settings-card">
          <div class="setting-item">
            <label>주 시작일:</label>
            <select v-model="settings.weekStartDay">
              <option value="0">일요일</option>
              <option value="1">월요일</option>
            </select>
          </div>

          <div class="setting-item">
            <label>테마:</label>
            <select v-model="settings.theme">
              <option value="light">라이트</option>
              <option value="dark">다크</option>
              <option value="auto">시스템 설정</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button @click="saveSettings" class="btn btn-primary">
          💾 설정 저장
        </button>
        <button @click="resetSettings" class="btn btn-secondary">
          🔄 기본값 복원
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  data() {
    return {
      settings: {
        enableNotifications: true,
        defaultNotificationTime: '09:00',
        weekStartDay: 0, // 0: 일요일, 1: 월요일
        theme: 'light'
      }
    }
  },

  mounted() {
    this.loadSettings()
  },

  methods: {
    loadSettings() {
      const saved = localStorage.getItem('calendar-settings')
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) }
        } catch (error) {
          console.error('설정 로드 실패:', error)
        }
      }
    },

    saveSettings() {
      localStorage.setItem('calendar-settings', JSON.stringify(this.settings))
      alert('설정이 저장되었습니다!')
    },

    resetSettings() {
      if (confirm('설정을 기본값으로 복원하시겠습니까?')) {
        this.settings = {
          enableNotifications: true,
          defaultNotificationTime: '09:00',
          weekStartDay: 0,
          theme: 'light'
        }
        this.saveSettings()
      }
    },

    goToCalendar() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: #f5f5f5;
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

.settings-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.settings-card {
  background: white;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.settings-card h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.setting-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.setting-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.setting-description {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.settings-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.settings-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.back-icon {
  font-size: 18px;
  font-weight: bold;
}

.settings-content {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.setting-group {
  background: white;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.setting-group h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .settings-container {
    margin: 20px auto;
    padding: 0 15px;
  }

  .settings-card {
    padding: 20px;
  }

  .settings-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
