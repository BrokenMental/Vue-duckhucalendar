data() {
  return {
    // 기본 테마를 'light'로 변경
    currentTheme: localStorage.getItem('theme') || 'light'  // 'unique' → 'light'
  }
},

mounted() {
  // 초기 테마 적용
  this.applyTheme(this.currentTheme)
}
