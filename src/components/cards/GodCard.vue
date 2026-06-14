<script setup lang="ts">
defineProps<{
  luckyGods: string[]
  unluckyGods: string[]
  luckyKeywords?: string
  unluckyKeywords?: string
  luckyTraits?: string
  unluckyTraits?: string
}>()
</script>

<template>
  <view class="panel god-card">
    <view class="god-row">
      <text class="god-label god-good">吉神</text>
      <view class="god-content">
        <text class="god-ancient">{{ luckyGods.join(' · ') }}</text>
        <text v-if="luckyKeywords" class="god-modern">{{ luckyKeywords }}</text>
        <text v-if="luckyTraits" class="god-trait">{{ luckyTraits }}</text>
      </view>
    </view>
    <view class="god-row">
      <text class="god-label god-bad">凶神</text>
      <view class="god-content">
        <text class="god-ancient">{{ unluckyGods.join(' · ') }}</text>
        <text v-if="unluckyKeywords" class="god-modern">{{ unluckyKeywords }}</text>
        <text v-if="unluckyTraits" class="god-trait">{{ unluckyTraits }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.god-card {
  padding: 24rpx;
}

.god-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14rpx;
  margin-bottom: 16rpx;
}

.god-row:last-child {
  margin-bottom: 0;
}

.god-label {
  flex: none;
  width: 56rpx;
  height: 36rpx;
  border-radius: 8rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 36rpx;
  text-align: center;
}

.god-good {
  background: var(--gs-green);
}

.god-bad {
  background: var(--gs-red);
}

.god-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.god-ancient {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.4;
}

.god-modern {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}

.god-trait {
  color: var(--gs-blue);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.3;
}
</style>
