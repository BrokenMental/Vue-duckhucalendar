<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 설정 헤더 -->
      <div class="settings-header">
        <h1>설정</h1>
        <div class="header-actions">
          <button @click="exportSettings" class="btn btn-outline">
            설정 내보내기
          </button>
          <button @click="showImportModal = true" class="btn btn-outline">
            설정 가져오기
          </button>
          <button @click="resetAllSettings" class="btn btn-danger">
            초기화
          </button>
        </div>
      </div>

      <!-- 설정 카테고리 -->
      <div class="settings-content">
        <!-- 일반 설정 -->
        <div class="setting-section">
          <h2>📌 일반 설정</h2>
          <div class="setting-grid">
            <div class="setting-item">
              <label for="siteTitle">사이트 제목</label>
              <input
                id="siteTitle"
                v-model="localSettings.siteTitle"
                type="text"
                @blur="updateSetting('siteTitle', localSettings.siteTitle)"
              />
              <small>브라우저 탭에 표시되는 제목입니다.</small>
            </div>

            <div class="setting-item">
              <label for="siteDescription">사이트 설명</label>
              <textarea
                id="siteDescription"
                v-model="localSettings.siteDescription"
                @blur="updateSetting('siteDescription', localSettings.siteDescription)"
                rows="3"
              ></textarea>
              <small>사이트에 대한 간단한 설명입니다.</small>
            </div>

            <div class="setting-item">
              <label for="theme">테마</label>
              <select
                id="theme"
                v-model="localSettings.theme"
                @change="changeTheme(localSettings.theme)"
              >
                <option value="light">라이트 모드</option>
                <option value="dark">다크 모드</option>
              </select>
              <small>사이트의 전체적인 색상 테마를 설정합니다.</small>
            </div>

            <div class="setting-item">
              <label for="language">언어</label>
              <select
                id="language"
                v-model="localSettings.language"
                @change="updateSetting('language', localSettings.language)"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <small>인터페이스 언어를 설정합니다.</small>
            </div>
          </div>
        </div>

        <!-- 캘린더 설정 -->
        <div class="setting-section">
          <h2>📅 캘린더 설정</h2>
          <div class="setting-grid">
            <div class="setting-item">
              <label for="weekStartDay">주 시작일</label>
              <select
                id="weekStartDay"
                v-model.number="localSettings.weekStartDay"
                @change="updateSetting('weekStartDay', localSettings.weekStartDay)"
              >
                <option :value="0">일요일</option>
                <option :value="1">월요일</option>
              </select>
              <small>캘린더에서 주의 시작 요일을 설정합니다.</small>
            </div>

            <div class="setting-item">
              <label for="defaultView">기본 보기</label>
              <select
                id="defaultView"
                v-model="localSettings.defaultView"
                @change="updateSetting('defaultView', localSettings.defaultView)"
              >
                <option value="month">월간 보기</option>
                <option value="week">주간 보기</option>
                <option value="day">일간 보기</option>
              </select>
              <small>캘린더 로딩시 기본으로 표시될 보기 형태입니다.</small>
            </div>

            <div class="setting-item">
              <label for="eventsPerPage">페이지당 이벤트 수</label>
              <input
                id="eventsPerPage"
                v-model.number="localSettings.eventsPerPage"
                type="number"
                min="10"
                max="100"
                step="5"
                @blur="updateSetting('eventsPerPage', localSettings.eventsPerPage)"
              />
              <small>한 페이지에 표시할 이벤트의 최대 개수입니다. (10-100)</small>
            </div>

            <div class="setting-item checkbox-item">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="localSettings.showWeekNumbers"
                  @change="updateSetting('showWeekNumbers', localSettings.showWeekNumbers)"
                />
                <span class="checkmark"></span>
                주 번호 표시
              </label>
              <small>캘린더 좌측에 주 번호를 표시합니다.</small>
              <div v-if="localSettings.showWeekNumbers" class="preview-box">
                <div class="week-number-preview">
                  <div class="week-num">{{ getCurrentWeekNumber() }}</div>
                  <span>← 이렇게 표시됩니다</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 뉴스레터 설정 -->
        <div class="setting-section">
          <h2>📧 뉴스레터 설정</h2>
          <div class="setting-grid">
            <div class="setting-item checkbox-item">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="localSettings.newsletterEnabled"
                  @change="updateSetting('newsletterEnabled', localSettings.newsletterEnabled)"
                />
                <span class="checkmark"></span>
                뉴스레터 발송 활성화
              </label>
              <small>주간 이벤트 요약 메일을 발송합니다.</small>
            </div>

            <div v-if="localSettings.newsletterEnabled" class="setting-sub-group">
              <div class="setting-item">
                <label for="newsletterDay">발송 요일</label>
                <select
                  id="newsletterDay"
                  v-model.number="localSettings.newsletterDay"
                  @change="updateSetting('newsletterDay', localSettings.newsletterDay)"
                >
                  <option :value="0">일요일</option>
                  <option :value="1">월요일</option>
                  <option :value="2">화요일</option>
                  <option :value="3">수요일</option>
                  <option :value="4">목요일</option>
                  <option :value="5">금요일</option>
                  <option :value="6">토요일</option>
                </select>
                <small>뉴스레터가 발송될 요일을 선택합니다.</small>
              </div>

              <div class="setting-item">
                <label for="newsletterTime">발송 시간</label>
                <input
                  id="newsletterTime"
                  v-model="localSettings.newsletterTime"
                  type="time"
                  @change="updateSetting('newsletterTime', localSettings.newsletterTime)"
                />
                <small>뉴스레터가 발송될 시간을 설정합니다.</small>
              </div>

              <div class="newsletter-preview">
                <h4>📮 뉴스레터 발송 일정</h4>
                <div class="schedule-info">
                  <span class="schedule-day">{{ getWeekdayName(localSettings.newsletterDay) }}</span>
                  <span class="schedule-time">{{ formatTime(localSettings.newsletterTime) }}</span>
                  <span class="schedule-next">다음 발송: {{ getNextNewsletterDate() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 알림 설정 -->
        <div class="setting-section">
          <h2>🔔 알림 설정</h2>
          <div class="setting-grid">
            <div class="setting-item checkbox-item">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="localSettings.notificationsEnabled"
                  @change="updateSetting('notificationsEnabled', localSettings.notificationsEnabled)"
                />
                <span class="checkmark"></span>
                브라우저 알림 활성화
              </label>
              <small>이벤트 시작 전에 브라우저 알림을 표시합니다.</small>
            </div>

            <div v-if="localSettings.notificationsEnabled" class="setting-sub-group">
              <div class="setting-item">
                <label for="notificationTime">알림 시간</label>
                <select
                  id="notificationTime"
                  v-model.number="localSettings.notificationTime"
                  @change="updateSetting('notificationTime', localSettings.notificationTime)"
                >
                  <option :value="5">5분 전</option>
                  <option :value="10">10분 전</option>
                  <option :value="15">15분 전</option>
                  <option :value="30">30분 전</option>
                  <option :value="60">1시간 전</option>
                  <option :value="1440">1일 전</option>
                </select>
                <small>이벤트 시작 전 알림을 받을 시간을 설정합니다.</small>
              </div>

              <div class="setting-item checkbox-item">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="localSettings.emailNotifications"
                    @change="updateSetting('emailNotifications', localSettings.emailNotifications)"
                  />
                  <span class="checkmark"></span>
                  이메일 알림
                </label>
                <small>브라우저 알림과 함께 이메일 알림도 받습니다.</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 고급 설정 -->
        <div class="setting-section">
          <h2>⚙️ 고급 설정</h2>
          <div class="setting-grid">
            <div class="setting-item">
              <label for="primaryColor">메인 색상</label>
              <div class="color-picker-group">
                <input
                  id="primaryColor"
                  v-model="localSettings.primaryColor"
                  type="color"
                  @change="updateSetting('primaryColor', localSettings.primaryColor)"
                />
                <span class="color-code">{{ localSettings.primaryColor }}</span>
              </div>
              <small>사이트의 메인 색상을 설정합니다.</small>
            </div>

            <div class="setting-item checkbox-item">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="localSettings.maintenanceMode"
                  @change="updateSetting('maintenanceMode', localSettings.maintenanceMode)"
                />
                <span class="checkmark"></span>
                유지보수 모드
              </label>
              <small>사이트를 유지보수 모드로 전환합니다.</small>
              <div v-if="localSettings.maintenanceMode" class="warning-box">
                ⚠️ 유지보수 모드가 활성화되어 있습니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 설정 저장 확인 -->
      <div v-if="showSaveMessage" class="save-message">
        ✅ 설정이 저장되었습니다.
      </div>
    </div>

    <!-- 설정 가져오기 모달 -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal-content" @click.stop>
        <h3>설정 가져오기</h3>
        <textarea
          v-model="importData"
          placeholder="내보낸 설정 데이터를 여기에 붙여넣으세요..."
          rows="10"
        ></textarea>
        <div class="modal-actions">
          <button @click="importSettings" class="btn btn-primary">가져오기</button>
          <button @click="showImportModal = false" class="btn btn-secondary">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore.js'

export default {
  name: 'EnhancedSettingsView',

  setup() {
    const settingsStore = useSettingsStore()
    const localSettings = reactive({ ...settingsStore.settings })

    // 모달 상태
    const showImportModal = ref(false)
    const showSaveMessage = ref(false)
    const importData = ref('')

    // 설정 업데이트
    const updateSetting = (key, value) => {
      settingsStore.updateSetting(key, value)
      localSettings[key] = value
      showSaveNotification()
    }

    // 테마 변경
    const changeTheme = (theme) => {
      settingsStore.changeTheme(theme)
      localSettings.theme = theme
      showSaveNotification()
    }

    // 저장 알림 표시
    const showSaveNotification = () => {
      showSaveMessage.value = true
      setTimeout(() => {
        showSaveMessage.value = false
      }, 2000)
    }

    // 설정 내보내기
    const exportSettings = () => {
      const data = settingsStore.exportSettings()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `calendar-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 설정 가져오기
    const importSettings = () => {
      if (settingsStore.importSettings(importData.value)) {
        Object.assign(localSettings, settingsStore.settings)
        showImportModal.value = false
        importData.value = ''
        alert('설정을 성공적으로 가져왔습니다.')
      } else {
        alert('설정 가져오기에 실패했습니다. 올바른 형식인지 확인해주세요.')
      }
    }

    // 설정 초기화
    const resetAllSettings = () => {
      if (confirm('모든 설정을 초기값으로 되돌리시겠습니까?')) {
        settingsStore.resetSettings()
        Object.assign(localSettings, settingsStore.settings)
        alert('설정이 초기화되었습니다.')
      }
    }

    // 현재 주 번호 가져오기
    const getCurrentWeekNumber = () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      const days = Math.floor((now - start) / (24 * 60 * 60 * 1000))
      return Math.ceil((days + start.getDay() + 1) / 7)
    }

    // 요일 이름 가져오기
    const getWeekdayName = (day) => {
      const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
      return weekdays[day] || '일요일'
    }

    // 시간 포맷팅
    const formatTime = (time) => {
      const [hour, minute] = time.split(':')
      const h = parseInt(hour)
      const period = h < 12 ? '오전' : '오후'
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
      return `${period} ${displayHour}:${minute}`
    }

    // 다음 뉴스레터 발송일 계산
    const getNextNewsletterDate = () => {
      const today = new Date()
      const targetDay = localSettings.newsletterDay
      const daysUntil = (targetDay - today.getDay() + 7) % 7
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + (daysUntil === 0 ? 7 : daysUntil))

      return nextDate.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }

    onMounted(() => {
      // 설정 로드
      settingsStore.loadSettings()
      Object.assign(localSettings, settingsStore.settings)
    })

    return {
      localSettings,
      showImportModal,
      showSaveMessage,
      importData,
      updateSetting,
      changeTheme,
      exportSettings,
      importSettings,
      resetAllSettings,
      getCurrentWeekNumber,
      getWeekdayName,
      formatTime,
      getNextNewsletterDate
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
}

.settings-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 설정 헤더 */
.settings-header {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 설정 섹션 */
.setting-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 25px;
  overflow: hidden;
}

.setting-section h2 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: 0;
  padding: 20px 30px;
  font-size: 20px;
  font-weight: 600;
}

.setting-grid {
  padding: 30px;
  display: grid;
  gap: 25px;
}

/* 설정 항목 */
.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 5px;
}

.setting-item input,
.setting-item select,
.setting-item textarea {
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.setting-item input:focus,
.setting-item select:focus,
.setting-item textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.setting-item small {
  color: #6c757d;
  font-size: 12px;
  line-height: 1.4;
}

/* 체크박스 스타일 */
.checkbox-item {
  align-items: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 5px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
}

.checkmark {
  position: relative;
}

/* 설정 서브 그룹 */
.setting-sub-group {
  margin-left: 30px;
  padding-left: 20px;
  border-left: 3px solid #e9ecef;
  display: grid;
  gap: 20px;
}

/* 색상 선택기 */
.color-picker-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker-group input[type="color"] {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.color-code {
  font-family: monospace;
  font-weight: bold;
  color: #495057;
}

/* 프리뷰 박스 */
.preview-box {
  margin-top: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.week-number-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.week-num {
  width: 30px;
  height: 30px;
  background: #6c757d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* 뉴스레터 프리뷰 */
.newsletter-preview {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 8px;
  border: 1px solid #2196f3;
}

.newsletter-preview h4 {
  margin: 0 0 15px 0;
  color: #1976d2;
  font-size: 16px;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schedule-day {
  font-weight: bold;
  color: #1976d2;
  font-size: 18px;
}

.schedule-time {
  color: #424242;
  font-size: 16px;
}

.schedule-next {
  color: #666;
  font-size: 14px;
  font-style: italic;
}

/* 경고 박스 */
.warning-box {
  margin-top: 10px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  color: #856404;
  font-weight: 500;
}

/* 저장 메시지 */
.save-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #28a745;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.modal-content textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 버튼 스타일 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

/* 다크 테마 */
:global(.dark-theme) .settings-page {
  background: #1a1a1a;
  color: #e0e0e0;
}

:global(.dark-theme) .setting-section,
:global(.dark-theme) .settings-header {
  background: #2d2d2d;
  color: #e0e0e0;
}

:global(.dark-theme) .setting-item input,
:global(.dark-theme) .setting-item select,
:global(.dark-theme) .setting-item textarea {
  background: #3d3d3d;
  border-color: #555;
  color: #e0e0e0;
}

:global(.dark-theme) .setting-item input:focus,
:global(.dark-theme) .setting-item select:focus,
:global(.dark-theme) .setting-item textarea:focus {
  border-color: #667eea;
}

:global(.dark-theme) .preview-box {
  background: #3d3d3d;
  border-color: #555;
}

:global(.dark-theme) .modal-content {
  background: #2d2d2d;
  color: #e0e0e0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .settings-page {
    padding: 10px;
  }

  .settings-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px;
  }

  .settings-header h1 {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .setting-grid {
    padding: 20px;
    gap: 20px;
  }

  .setting-section h2 {
    padding: 15px 20px;
    font-size: 18px;
  }

  .setting-sub-group {
    margin-left: 15px;
    padding-left: 15px;
  }

  .schedule-info {
    text-align: center;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .color-picker-group {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .settings-header {
    padding: 15px;
  }

  .settings-header h1 {
    font-size: 20px;
  }

  .setting-grid {
    padding: 15px;
  }

  .header-actions {
    gap: 8px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
