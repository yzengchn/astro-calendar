<script setup lang="ts">
defineProps<{
  suitable: string[]
  avoid: string[]
  suitableModern?: string[]
  avoidModern?: string[]
}>()
</script>

<template>
  <view class="panel advice-card">
    <view class="advice-section">
      <view class="advice-row">
        <text class="advice-mark advice-good">宜</text>
        <view class="advice-content">
          <text class="advice-traditional">{{ suitable.join(' · ') }}</text>
          <text v-if="suitableModern" class="advice-modern">{{ suitableModern.join(' · ') }}</text>
        </view>
      </view>
      <view class="advice-row">
        <text class="advice-mark advice-bad">忌</text>
        <view class="advice-content">
          <text class="advice-traditional">{{ avoid.join(' · ') }}</text>
          <text v-if="avoidModern" class="advice-modern">{{ avoidModern.join(' · ') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.advice-card {
  padding: 24rpx;
}

.advice-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.advice-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14rpx;
}

.advice-mark {
  flex: none;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 22rpx;
  line-height: 44rpx;
  text-align: center;
}

.advice-good {
  background: var(--gs-green);
}

.advice-bad {
  background: var(--gs-red);
}

.advice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.advice-traditional {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.4;
}

.advice-modern {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}
</style>
