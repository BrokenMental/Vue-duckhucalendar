import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '@/views/CalendarView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AdminView from '@/views/AdminView.vue'

/**
 * 라우트 정의
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: CalendarView,
    meta: {
      title: '더쿠 캘린더',
      description: '더쿠 캘린더로 일정을 확인하세요',
      requiresAuth: false
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: {
      title: '설정',
      description: '캘린더 앱의 설정을 관리하는 페이지입니다',
      requiresAuth: false
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: {
      title: '관리자',
      description: '이벤트 관리 및 관리자 전용 기능 페이지입니다',
      requiresAuth: true,
      adminOnly: true
    }
  },
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: () => import('@/views/AdminLoginView.vue'),
    meta: {
      title: '관리자 로그인',
      description: '관리자 로그인 페이지입니다',
      requiresAuth: false
    }
  },
  // 기존 MainLayout으로의 리다이렉트 (호환성 유지)
  {
    path: '/main',
    redirect: '/'
  },
  // 기존 캘린더 뷰로 리다이렉트 (호환성 유지)
  {
    path: '/calendar',
    redirect: '/'
  },
  // 404 페이지 처리
  {
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
      return { top: 0, behavior: 'smooth' }
    }
  }
})

/**
 * 전역 네비게이션 가드
 * 페이지 이동 전에 실행되는 함수
 */
router.beforeEach((to, from, next) => {
  // 페이지 제목 설정
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - Vue 이벤트 캘린더`
  } else {
    document.title = 'Vue 이벤트 캘린더'
  }

  // 관리자 페이지 접근 제어
  if (to.meta.requiresAuth && to.meta.adminOnly) {
    const adminToken = sessionStorage.getItem('admin-token')

    if (!adminToken) {
      console.log('관리자 인증이 필요합니다.')

      // 관리자 로그인 페이지로 리다이렉트
      //alert('관리자 인증이 필요합니다. 로그인 페이지로 이동합니다.')
      next('/admin-login')
    } else {
      // 토큰이 있으면 인증 확인
      import('@/services/api.js').then(module => {
        const { adminAPI } = module

        adminAPI.checkAuth()
          .then(() => {
            console.log('관리자 인증 성공')
            next() // 인증 성공시 진행
          })
          .catch(error => {
            console.error('관리자 인증 실패:', error)
            sessionStorage.removeItem('admin-token')
            alert('관리자 인증이 만료되었습니다. 다시 로그인해주세요.')
            next('/admin-login') // 로그인 페이지로 리다이렉트
          })
      }).catch(error => {
        console.error('API 모듈 로드 실패:', error)
        next(false) // 네비게이션 취소
      })
    }
  } else {
    // 인증이 필요없는 페이지는 바로 진행
    next()
  }
})

/**
 * 페이지 이동 후 실행되는 함수
 */
router.afterEach((to, from) => {
  // 페이지 이동 로그 (개발 시 디버깅용)
  console.log(`📄 페이지 이동: ${from.path} → ${to.path}`)

  // Google Analytics 등 페이지 추적 코드 (gtag가 정의된 경우에만 실행)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: to.path,
    })
  }

  // 페이지 로드 완료 로그
  console.log(`✅ 페이지 로드 완료: ${to.path}`)
})

/**
 * 라우터 에러 핸들링
 */
router.onError((error) => {
  console.error('🚨 라우터 에러:', error)

  // 에러 페이지로 리다이렉트하거나 사용자에게 알림
  if (error.message.includes('Loading chunk')) {
    // 청크 로딩 실패 (배포 후 업데이트 시 발생할 수 있음)
    alert('페이지를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침합니다.')
    window.location.reload()
  }
})

export default router
