import axios from 'axios'

// API 기본 URL 설정 - 환경변수 이름 통일
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * 공통 API 클라이언트 생성
 * 모든 API 요청에서 공통으로 사용
 */
const createApiClient = (customConfig = {}) => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api`, // /api 경로 추가
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    ...customConfig
  })

  // 요청 인터셉터
  client.interceptors.request.use(
    (config) => {
      console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`)

      // 세션 스토리지에서 관리자 토큰 가져오기
      const adminToken = sessionStorage.getItem('admin-token')

      // 토큰이 있으면 Authorization 헤더에 추가
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`
        console.log('🔐 토큰 추가됨')
      }

      return config
    },
    (error) => {
      console.error('❌ API 요청 오류:', error)
      return Promise.reject(error)
    }
  )

  // 응답 인터셉터
  client.interceptors.response.use(
    (response) => {
      console.log(`✅ API 응답: ${response.config.method?.toUpperCase()} ${response.config.url}`)
      return response
    },
    (error) => {
      console.error('❌ API 응답 오류:', error)

      // 표준화된 에러 메시지
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          '알 수 없는 오류가 발생했습니다.'

      // 사용자 친화적 에러 메시지 설정
      if (error.response?.status === 401) {
        error.userMessage = '인증이 필요합니다. 다시 로그인해주세요.'
        // 관리자 토큰 제거
        sessionStorage.removeItem('admin-token')
      } else if (error.response?.status === 403) {
        error.userMessage = '접근 권한이 없습니다.'
      } else if (error.response?.status === 404) {
        error.userMessage = '요청한 리소스를 찾을 수 없습니다.'
      } else if (error.response?.status === 429) {
        error.userMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.response?.status >= 500) {
        error.userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        error.userMessage = '네트워크 연결을 확인해주세요.'
      } else {
        error.userMessage = errorMessage
      }

      return Promise.reject(error)
    }
  )

  return client
}

// 기본 API 클라이언트
export const apiClient = createApiClient()

// 특별한 설정이 필요한 경우를 위한 팩토리 함수
export const createSpecialApiClient = (config) => createApiClient(config)

// 편의를 위한 API URL export
export const API_BASE_URL_EXPORT = API_BASE_URL

export default apiClient
