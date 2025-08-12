import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { holidayInitUtils } from '@/services/holidayInitializer.js'

const app = createApp(App)

app.use(router)

// 앱 마운트 전에 공휴일 초기화
holidayInitUtils.initializeForVueApp().then(() => {
  app.mount('#app')
  console.log('🎯 Vue 앱이 공휴일 데이터와 함께 시작되었습니다.')
}).catch((error) => {
  console.warn('⚠️ 공휴일 초기화 실패하지만 앱은 계속 실행됩니다:', error)
  app.mount('#app')
})
