<script setup lang="ts">
defineProps<{
  emoji: string
  label: string
}>()
</script>

<template>
  <view class="hero-lucky">
    <text class="hero-lucky-emoji">{{ emoji }}</text>
    <text class="hero-lucky-label">{{ label }}</text>
  </view>
</template>

<style scoped>
.hero-lucky {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6rpx;
  margin-top: 8rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(199, 141, 42, 0.14);
}

.hero-lucky-emoji {
  font-size: 22rpx;
}

.hero-lucky-label {
  color: var(--gs-gold);
  font-size: 20rpx;
  font-weight: 700;
}
</style>
