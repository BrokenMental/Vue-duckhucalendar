import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import SettingsView from '@/views/SettingsView.vue'
import AdminView from '@/views/AdminView.vue'

/**
 * 라우트 정의
 * MainLayout을 메인 페이지로 사용하고 관리자 페이지 추가
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainLayout,
    meta: {
      title: '이벤트 캘린더',
      description: '이벤트를 관리하는 캘린더 메인 페이지입니다',
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
      requiresAuth: true, // 관리자 인증 필요
      adminOnly: true
    }
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
router.beforeEach(async (to, from, next) => {
  // 페이지 제목 설정
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - Vue 이벤트 캘린더`
  } else {
    document.title = 'Vue 이벤트 캘린더'
  }

  // 관리자 페이지 접근 제어
  if (to.meta.requiresAuth && to.meta.adminOnly) {
    const adminToken = sessionStorage.getItem('admin-token') // localStorage → sessionStorage

    if (!adminToken) {
      console.log('관리자 인증이 필요합니다.')
      alert('관리자 로그인이 필요합니다.')
      next('/')
      return
    }

    try {
      const { adminAPI } = await import('@/services/api.js')
      await adminAPI.checkAuth()
      console.log('관리자 인증 성공')
      next()
    } catch (error) {
      console.error('관리자 인증 실패:', error)
      sessionStorage.removeItem('admin-token') // localStorage → sessionStorage
      alert('관리자 인증이 만료되었습니다. 다시 로그인해주세요.')
      next('/')
    }
  } else {
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
