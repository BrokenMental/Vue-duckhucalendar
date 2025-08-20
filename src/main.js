import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'

const app = createApp(App)

app.use(router)

// 공휴일 초기화 제거 - 필요할 때만 API 호출하도록 변경
app.mount('#app')
console.log('🎯 Vue 앱이 시작되었습니다.')
