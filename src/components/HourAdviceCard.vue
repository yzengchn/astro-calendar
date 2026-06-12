<script setup lang="ts">
import type { HourAlmanac } from '@/types/almanac'

defineProps<{
  hour: HourAlmanac
}>()

function levelClass(level: HourAlmanac['level']): string {
  if (level === 'good') return 'tag-good'
  if (level === 'bad') return 'tag-bad'
  return 'tag-neutral'
}
</script>

<template>
  <view class="panel hour-card">
    <view class="hour-card-header">
      <view>
        <text class="hour-title">{{ hour.branch.name }} {{ hour.branch.range }}</text>
        <text class="hour-star">{{ hour.star }} · {{ hour.keyword }}</text>
      </view>
      <text class="tag" :class="levelClass(hour.level)">{{ hour.levelText }}</text>
    </view>

    <view class="divider" />

    <view class="advice-block">
      <text class="block-title">适宜行事</text>
      <text v-for="item in hour.suitable" :key="item" class="bullet">● {{ item }}</text>
    </view>

    <view class="advice-block">
      <text class="block-title">尽量避免</text>
      <text v-for="item in hour.avoid" :key="item" class="bullet">● {{ item }}</text>
    </view>

    <view class="guide-text">{{ hour.guide }}</view>
  </view>
</template>

<style scoped>
.hour-card {
  padding: 28rpx;
}

.hour-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.hour-title,
.hour-star,
.block-title,
.bullet,
.guide-text {
  display: block;
}

.hour-title {
  color: var(--gs-ink);
  font-size: 32rpx;
  font-weight: 800;
}

.hour-star {
  margin-top: 10rpx;
  color: var(--gs-muted);
  font-size: 24rpx;
}

.divider {
  height: 1rpx;
  margin: 24rpx 0;
  background: var(--gs-line);
}

.advice-block {
  margin-top: 20rpx;
}

.block-title {
  margin-bottom: 12rpx;
  color: var(--gs-blue);
  font-size: 26rpx;
  font-weight: 800;
}

.bullet {
  margin-top: 8rpx;
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.5;
}

.guide-text {
  margin-top: 26rpx;
  padding: 20rpx;
  border-left: 6rpx solid var(--gs-gold);
  border-radius: 10rpx;
  background: rgba(199, 141, 42, 0.12);
  color: #725019;
  font-size: 26rpx;
  line-height: 1.55;
}
</style>
