<template>
  <div class="maintenance-mode">
    <div class="maintenance-content">
      <div class="icon">🔧</div>
      <h1>시스템 점검 중</h1>
      <p>더 나은 서비스를 제공하기 위해 시스템 점검을 진행하고 있습니다.</p>
      <p>잠시 후 다시 접속해주세요.</p>
      <div class="time">예상 완료 시간: 곧 완료됩니다</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaintenanceMode'
}
</script>

<style scoped>
.maintenance-mode {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.maintenance-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
}

.icon {
  font-size: 80px;
  margin-bottom: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 10px;
}

.time {
  margin-top: 20px;
  padding: 10px 20px;
  background: #f0f0f0;
  border-radius: 10px;
  color: #667eea;
  font-weight: bold;
}
</style>
