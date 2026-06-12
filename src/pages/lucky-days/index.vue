<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { DateKey } from '@/types/calendar'
import { getTodayKey, parseDateKey } from '@/services/calendar'
import { OCCASIONS, findLuckyDays, type LuckyDay, type OccasionType } from '@/services/lucky-days'
import { lightHaptic } from '@/services/platform'

const todayKey = getTodayKey()
const selectedDateKey = ref<DateKey>(todayKey)
const selectedOccasion = ref<OccasionType>('wedding')
const luckyDays = ref<LuckyDay[]>([])

onLoad((options) => {
  if (options?.date) {
    selectedDateKey.value = options.date as DateKey
  }
})

onMounted(() => {
  calculateLuckyDays()
})

function calculateLuckyDays() {
  const baseDate = parseDateKey(selectedDateKey.value)
  luckyDays.value = findLuckyDays(selectedOccasion.value, baseDate, 60)
}

function selectOccasion(id: OccasionType) {
  lightHaptic()
  selectedOccasion.value = id
  calculateLuckyDays()
}

function selectDate(dateKey: DateKey) {
  lightHaptic()
  uni.navigateBack()
  uni.$emit('select-date', dateKey)
}
</script>

<template>
  <view class="lucky-days-page">
    <view class="header">
      <text class="title">择吉日</text>
      <text class="subtitle">为重要事项挑选良辰吉日</text>
    </view>

    <view class="occasion-tabs">
      <button
        v-for="occasion in OCCASIONS"
        :key="occasion.id"
        class="occasion-tab"
        :class="{ active: selectedOccasion === occasion.id }"
        @tap="selectOccasion(occasion.id)"
      >
        <text class="occasion-icon">{{ occasion.emoji }}</text>
        <text class="occasion-label">{{ occasion.label }}</text>
      </button>
    </view>

    <view class="lucky-list">
      <view
        v-for="(day, index) in luckyDays"
        :key="day.date"
        class="lucky-item"
        @tap="selectDate(day.date)"
      >
        <view class="rank">
          <text class="rank-number">{{ index + 1 }}</text>
        </view>
        <view class="day-info">
          <text class="date">{{ day.date }}</text>
          <text class="reason">{{ day.reason }}</text>
          <view class="tags">
            <text class="tag tag-suitable">宜：{{ day.suitable.join('·') }}</text>
            <text class="tag tag-avoid">忌：{{ day.avoid.join('·') }}</text>
          </view>
        </view>
        <view class="score">
          <text class="score-value">{{ day.score }}</text>
          <text class="score-label">{{ day.level }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.lucky-days-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.header {
  background: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  display: block;
}

.occasion-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.occasion-tab {
  flex: 0 0 calc(33.333% - 8rpx);
  background: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.occasion-tab.active {
  border-color: #007aff;
  background: #f0f7ff;
}

.occasion-icon {
  font-size: 32rpx;
}

.occasion-label {
  font-size: 24rpx;
  color: #666;
}

.occasion-tab.active .occasion-label {
  color: #007aff;
  font-weight: 600;
}

.lucky-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.lucky-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.rank {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-number {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.day-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.date {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.reason {
  font-size: 24rpx;
  color: #999;
}

.tags {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-top: 4rpx;
}

.tag {
  font-size: 22rpx;
  line-height: 1.5;
}

.tag-suitable {
  color: #52c41a;
}

.tag-avoid {
  color: #ff4d4f;
}

.score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.score-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #007aff;
}

.score-label {
  font-size: 20rpx;
  color: #007aff;
  margin-top: 2rpx;
}
</style>
