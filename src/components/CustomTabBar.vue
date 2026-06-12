<script setup lang="ts">
import { ref } from 'vue'
import { lightHaptic } from '@/services/platform'

interface TabItem {
  pagePath: string
  text: string
  icon: string
  isCenter?: boolean
}

const props = defineProps<{
  active: number
}>()

const tabs: TabItem[] = [
  { pagePath: '/pages/lucky-days/index', text: '择日', icon: '📆' },
  { pagePath: '/pages/blessing/index', text: '祈福', icon: '🏮' },
  { pagePath: '/pages/home/index', text: '日历', icon: '📅', isCenter: true },
  { pagePath: '/pages/zodiac/index', text: '八字', icon: '☯' },
  { pagePath: '/pages/fortune/index', text: '运势', icon: '✨' }
]

function switchTab(index: number) {
  if (index === props.active) return
  lightHaptic()
  const tab = tabs[index]
  uni.switchTab({ url: tab.pagePath })
}
</script>

<template>
  <view class="tabbar-container">
    <view class="tabbar">
      <view
        v-for="(tab, index) in tabs"
        :key="tab.pagePath"
        class="tab-item"
        :class="{ 'tab-item-center': tab.isCenter }"
        @tap="switchTab(index)"
      >
        <!-- Center raised tab -->
        <view v-if="tab.isCenter" class="tab-center-wrapper">
          <view class="tab-center-btn" :class="{ 'tab-center-active': active === index }">
            <text class="tab-center-icon" :class="{ 'tab-center-icon-active': active === index }">{{ tab.icon }}</text>
          </view>
          <text class="tab-label" :class="{ 'tab-label-active': active === index }">{{ tab.text }}</text>
        </view>
        <!-- Normal tab -->
        <view v-else class="tab-normal-wrapper">
          <text class="tab-icon" :class="{ 'tab-icon-active': active === index }">{{ tab.icon }}</text>
          <text class="tab-label" :class="{ 'tab-label-active': active === index }">{{ tab.text }}</text>
        </view>
      </view>
    </view>
    <view class="tabbar-safe-area" />
  </view>
</template>

<style scoped>
.tabbar-container {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
}

.tabbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 108rpx;
  padding: 0 12rpx;
  border-top: 1rpx solid var(--gs-line);
  background: rgba(255, 250, 240, 0.96);
  box-shadow: 0 -6rpx 24rpx rgba(67, 47, 25, 0.08);
}

.tab-item {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 14rpx;
}

.tab-item-center {
  position: relative;
}

/* Normal tab */
.tab-normal-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.tab-icon {
  font-size: 42rpx;
  line-height: 1;
  opacity: 0.55;
  transition: opacity 200ms ease;
}

.tab-icon-active {
  opacity: 1;
}

.tab-label {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.1;
  transition: color 200ms ease;
}

.tab-label-active {
  color: var(--gs-blue);
  font-weight: 800;
}

/* Center raised tab */
.tab-center-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  margin-top: -38rpx;
}

.tab-center-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110rpx;
  height: 110rpx;
  border: 4rpx solid var(--gs-line);
  border-radius: 50%;
  background: linear-gradient(145deg, #fffaf0, #efe0c8);
  box-shadow: 0 8rpx 28rpx rgba(67, 47, 25, 0.18);
  transition: background 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}

.tab-center-active {
  border-color: var(--gs-line);
  background: linear-gradient(145deg, #fffaf0, #efe0c8);
  box-shadow: 0 8rpx 28rpx rgba(67, 47, 25, 0.18);
}

.tab-center-icon {
  font-size: 46rpx;
  line-height: 1;
  opacity: 0.55;
  transition: opacity 200ms ease, transform 200ms ease;
}

.tab-center-icon-active {
  opacity: 1;
  transform: scale(1.08);
}

/* Safe area */
.tabbar-safe-area {
  height: env(safe-area-inset-bottom);
  background: rgba(255, 250, 240, 0.96);
}
</style>
