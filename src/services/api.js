import axios from 'axios'

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 (로딩, 토큰 등 추가 가능)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API 요청 오류:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API 응답: ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API 응답 오류:', error)

    // 에러 메시지 표준화
    const errorMessage = error.response?.data?.error ||
                        error.response?.data?.message ||
                        error.message ||
                        '알 수 없는 오류가 발생했습니다.'

    // 사용자 친화적 에러 메시지
    if (error.response?.status === 404) {
      error.userMessage = '요청한 리소스를 찾을 수 없습니다.'
    } else if (error.response?.status === 500) {
      error.userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    } else if (error.code === 'NETWORK_ERROR') {
      error.userMessage = '네트워크 연결을 확인해주세요.'
    } else {
      error.userMessage = errorMessage
    }

    return Promise.reject(error)
  }
)

/**
 * 일정 관련 API 함수들
 */
export const scheduleAPI = {

  /**
   * 모든 일정 조회
   */
  async getAllSchedules() {
    try {
      const response = await apiClient.get('/schedules')
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정을 불러오는데 실패했습니다.')
    }
  },

  /**
   * 새 일정 추가
   * @param {Object} scheduleData - 일정 데이터
   */
  async createSchedule(scheduleData) {
    try {
      const response = await apiClient.post('/schedules', scheduleData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 추가에 실패했습니다.')
    }
  },

  /**
   * 일정 수정
   * @param {number} id - 일정 ID
   * @param {Object} scheduleData - 수정할 일정 데이터
   */
  async updateSchedule(id, scheduleData) {
    try {
      const response = await apiClient.put(`/schedules/${id}`, scheduleData)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 수정에 실패했습니다.')
    }
  },

  /**
   * 일정 삭제
   * @param {number} id - 일정 ID
   */
  async deleteSchedule(id) {
    try {
      const response = await apiClient.delete(`/schedules/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '일정 삭제에 실패했습니다.')
    }
  },

  /**
   * 특정 날짜의 일정 조회
   * @param {string} date - 날짜 (YYYY-MM-DD 형식)
   */
  async getSchedulesByDate(date) {
    try {
      const response = await apiClient.get(`/schedules/date/${date}`)
      return response.data
    } catch (error) {
      throw new Error(error.userMessage || '해당 날짜의 일정을 불러오는데 실패했습니다.')
    }
  }
}

/**
 * 서버 상태 확인
 */
export const healthAPI = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/health')
      return response.data
    } catch (error) {
      throw new Error('서버 연결을 확인할 수 없습니다.')
    }
  }
}

// 기본 API 클라이언트도 export (필요한 경우)
export default apiClient
