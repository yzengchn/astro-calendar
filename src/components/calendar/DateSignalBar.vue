<script setup lang="ts">
defineProps<{
  text: string | null | undefined
}>()
</script>

<template>
  <view v-if="text" class="day-signal">
    <text>{{ text }}</text>
  </view>
</template>

<style scoped>
.day-signal {
  margin: 8rpx 0 0;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(199, 141, 42, 0.14);
  color: var(--gs-gold);
  font-size: 22rpx;
  font-weight: 700;
  text-align: center;
}
</style>
