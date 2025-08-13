import axios from 'axios'

// API 기본 설정 (Vite 환경)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('admin-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 오류 시 토큰 제거
      sessionStorage.removeItem('admin-token')
    }

    const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.'
    error.userMessage = errorMessage

    return Promise.reject(error)
  }
)

/**
 * 공지사항 관련 API
 */
export const noticeAPI = {
  /**
   * 활성화된 공지사항 목록 조회 (사용자용)
   * @param {number} limit - 조회할 개수 (기본값: 2)
   */
  async getActiveNotices(limit = 2) {
    try {
      const response = await apiClient.get(`/notices/active?limit=${limit}`)
      return response.data
    } catch (error) {
      // 더 구체적인 에러 정보 제공
      if (error.response?.status === 400) {
        throw new Error('잘못된 요청입니다. 서버에 공지사항 API가 구현되지 않았을 수 있습니다.')
      } else if (error.response?.status === 404) {
        throw new Error('공지사항 API를 찾을 수 없습니다.')
      } else if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        throw new Error('CORS 설정 문제로 공지사항을 불러올 수 없습니다.')
      }
      throw new Error(error.userMessage || '공지사항을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 모든 공지사항 목록 조회 (관리자용)
   */
  async getAllNotices() {
    try {
      const response = await apiClient.get('/notices/admin/all')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '공지사항 목록을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 공지사항 상세 조회
   * @param {number} id - 공지사항 ID
   */
  async getNoticeById(id) {
    try {
      const response = await apiClient.get(`/notices/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '공지사항을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 공지사항 생성 (관리자용)
   * @param {Object} noticeData - 공지사항 데이터
   */
  async createNotice(noticeData) {
    try {
      const response = await apiClient.post('/notices/admin', noticeData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '공지사항 생성에 실패했습니다.')
    }
  },

  /**
   * 공지사항 수정 (관리자용)
   * @param {number} id - 공지사항 ID
   * @param {Object} noticeData - 수정할 데이터
   */
  async updateNotice(id, noticeData) {
    try {
      const response = await apiClient.put(`/notices/admin/${id}`, noticeData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '공지사항 수정에 실패했습니다.')
    }
  },

  /**
   * 공지사항 삭제 (관리자용)
   * @param {number} id - 공지사항 ID
   */
  async deleteNotice(id) {
    try {
      const response = await apiClient.delete(`/notices/admin/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '공지사항 삭제에 실패했습니다.')
    }
  },

  /**
   * 공지사항 상태 토글 (관리자용)
   * @param {number} id - 공지사항 ID
   */
  async toggleNoticeStatus(id) {
    try {
      const response = await apiClient.patch(`/notices/admin/${id}/toggle`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '공지사항 상태 변경에 실패했습니다.')
    }
  }
}

export default noticeAPI
