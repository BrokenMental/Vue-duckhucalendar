import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '@/views/CalendarView.vue'
import SettingsView from '@/views/SettingsView.vue'

/**
 * 라우트 정의
 * 각 라우트는 컴포넌트와 매핑됩니다
 */
const routes = [
  {
    path: '/',                    // URL 경로
    name: 'Calendar',             // 라우트 이름
    component: CalendarView,      // 렌더링할 컴포넌트
    meta: {
      title: '캘린더',            // 페이지 제목
      description: '일정을 관리하는 캘린더 페이지입니다'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: '설정',
      description: '캘린더 앱의 설정을 관리하는 페이지입니다'
    }
  },
  {
    // 잘못된 경로로 접근했을 때 메인 페이지로 리다이렉트
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

/**
 * 라우터 인스턴스 생성
 */
const router = createRouter({
  // HTML5 History 모드 사용 (해시(#) 없는 깔끔한 URL)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,

  // 페이지 전환 시 스크롤을 맨 위로 이동
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * 전역 네비게이션 가드
 * 페이지 이동 전에 실행되는 함수
 */
router.beforeEach((to, from, next) => {
  // 페이지 제목 동적 설정
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - Vue 캘린더`
  } else {
    document.title = 'Vue 캘린더'
  }

  // 페이지 이동 로그 (개발 시 디버깅용)
  console.log(`페이지 이동: ${from.path} → ${to.path}`)

  // 네비게이션 계속 진행
  next()
})

/**
 * 페이지 이동 후 실행되는 함수
 */
router.afterEach((to) => {
  // Google Analytics 등 페이지 추적 코드를 여기에 추가할 수 있습니다
  console.log(`페이지 로드 완료: ${to.path}`)
})

export default router
