<template>
  <div id="app">
    <!-- Vue Router 사용 시 다른 페이지들이 여기에 렌더링됩니다 -->
    <RouterView />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 전역 스타일 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>
