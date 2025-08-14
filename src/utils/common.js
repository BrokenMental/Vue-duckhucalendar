/**
 * 공통 유틸리티 함수들
 */

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
export function formatDate(date) {
  if (!date) return '-'

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return '-'

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 날짜와 시간 포맷팅 (YYYY-MM-DD HH:mm)
 */
export function formatDateTime(datetime) {
  if (!datetime) return '-'

  const dateObj = new Date(datetime)
  if (isNaN(dateObj.getTime())) return '-'

  const date = formatDate(dateObj)
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')

  return `${date} ${hours}:${minutes}`
}

/**
 * 상대 시간 표시 (오늘, 어제, 3일 전 등)
 */
export function formatRelativeDate(date) {
  if (!date) return ''

  const dateObj = new Date(date)
  const today = new Date()
  const diffTime = today - dateObj
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`

  return formatDate(date)
}

/**
 * 우선순위 텍스트 반환 (Schedule용)
 */
export function getPriorityText(priority) {
  const priorities = {
    1: '높음',
    2: '보통',
    3: '낮음'
  }
  return priorities[priority] || '보통'
}

/**
 * 우선순위 색상 반환 (Schedule용)
 */
export function getPriorityColor(priority) {
  const colors = {
    1: '#E74C3C', // 빨간색 (높음)
    2: '#F39C12', // 주황색 (보통)
    3: '#27AE60'  // 녹색 (낮음)
  }
  return colors[priority] || '#F39C12'
}

/**
 * 공지사항 우선순위 텍스트 반환
 */
export function getNoticePriorityText(priority) {
  const priorities = {
    0: '일반',
    1: '중요',
    2: '긴급'
  }
  return priorities[priority] || '일반'
}

/**
 * 공지사항 우선순위 색상 반환
 */
export function getNoticePriorityColor(priority) {
  const colors = {
    0: '#6c757d',  // 회색 (일반)
    1: '#ffc107',  // 노란색 (중요)
    2: '#dc3545'   // 빨간색 (긴급)
  }
  return colors[priority] || '#6c757d'
}

/**
 * 카테고리 색상 반환
 */
export function getCategoryColor(category) {
  const colors = {
    '공연': '#FF6B6B',
    '전시': '#4ECDC4',
    '페스티벌': '#45B7D1',
    '워크샵': '#96CEB4',
    '기타': '#FECA57'
  }
  return colors[category] || '#95A5A6'
}
