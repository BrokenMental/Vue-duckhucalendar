<template>
  <div class="theme-selector">
    <label for="theme-select">테마 선택:</label>
    <select id="theme-select" v-model="currentTheme" @change="changeTheme">
      <option value="light">라이트</option>
      <option value="dark">다크</option>
      <option value="unique">유니크</option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'ThemeSelector',

  data() {
    return {
      // 기본 테마를 'light'로 설정
      currentTheme: localStorage.getItem('theme') || 'light'
    }
  },

  mounted() {
    // 초기 테마 적용
    this.applyTheme(this.currentTheme)
  },

  methods: {
    changeTheme() {
      this.applyTheme(this.currentTheme)
    },

    applyTheme(theme) {
      // localStorage에 저장
      localStorage.setItem('theme', theme)

      // body 클래스 변경
      document.body.className = `theme-${theme}`

      // 테마 변경 이벤트 발생 (필요시 다른 컴포넌트에서 사용)
      this.$emit('theme-changed', theme)
    }
  }
}
</script>

<style scoped>
.theme-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.theme-selector label {
  font-weight: 500;
  color: var(--text-color, #333);
}

.theme-selector select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
}

.theme-selector select:hover {
  border-color: #999;
}

.theme-selector select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
</style>
