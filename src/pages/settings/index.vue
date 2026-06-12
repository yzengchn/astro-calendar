<script setup lang="ts">
import { ref } from 'vue'
import { getStorage, lightHaptic, setStorage, trackEvent } from '@/services/platform'
import type { WeekFirstDay } from '@/services/calendar'

interface WeekFirstOption {
  value: WeekFirstDay
  label: string
  desc: string
}

interface LayoutModule {
  key: string
  label: string
  desc: string
  icon: string
}

interface TimeViewOption {
  value: string
  label: string
  icon: string
  desc: string
}

const WEEK_FIRST_OPTIONS: WeekFirstOption[] = [
  { value: 6, label: '星期六', desc: '中东地区习惯' },
  { value: 0, label: '星期日', desc: '中国、美国等' },
  { value: 1, label: '星期一', desc: 'ISO 8601 标准' }
]

const LAYOUT_MODULES: LayoutModule[] = [
  { key: 'season_info', label: '时令信息', desc: '月相、节气、七十二候、数九三伏', icon: '🌙' },
  { key: 'advice', label: '今日宜忌', desc: '传统宜忌与现代解读', icon: '✓' },
  { key: 'current_hour', label: '当前时辰', desc: '此刻时辰吉凶与指引', icon: '⏱' },
  { key: 'twelve_hours', label: '十二时辰', desc: '轮盘或列表查看全天时辰', icon: '◷' },
  { key: 'zodiac_entry', label: '星座运势', desc: '快捷进入星座运势页', icon: '⭐' }
]

const TIME_VIEW_OPTIONS: TimeViewOption[] = [
  { value: 'compass', label: '轮盘', icon: '⊚', desc: '罗盘式圆盘视图' },
  { value: 'timeline', label: '列表', icon: '☰', desc: '时间轴纵向列表' }
]

// --- State ---
const storedWeekFirst = getStorage<number>('week_first_day', 0)
const weekFirstDay = ref<WeekFirstDay>([0, 1, 6].includes(storedWeekFirst) ? (storedWeekFirst as WeekFirstDay) : 0)

const storedHolidayUpdate = getStorage<boolean>('holiday_auto_update', true)
const holidayAutoUpdate = ref(storedHolidayUpdate !== false)

// Layout: which modules are visible
const DEFAULT_VISIBLE = ['season_info', 'advice', 'current_hour', 'twelve_hours', 'zodiac_entry']
const storedLayout = getStorage<string[]>('home_layout_modules', DEFAULT_VISIBLE)
const layoutModules = ref<string[]>(Array.isArray(storedLayout) && storedLayout.length > 0 ? storedLayout : [...DEFAULT_VISIBLE])

// Time view preference
const storedTimeView = getStorage<string>('time_view_preference', 'timeline')
const timeViewPref = ref<string>(storedTimeView === 'compass' ? 'compass' : 'timeline')

// --- Actions ---
function setWeekFirstDay(value: WeekFirstDay): void {
  if (weekFirstDay.value === value) return
  weekFirstDay.value = value
  setStorage('week_first_day', value)
  lightHaptic()
  trackEvent('setting_week_first_day', { value })
}

function toggleHolidayUpdate(): void {
  holidayAutoUpdate.value = !holidayAutoUpdate.value
  setStorage('holiday_auto_update', holidayAutoUpdate.value)
  lightHaptic()
  trackEvent('setting_holiday_auto_update', { enabled: holidayAutoUpdate.value })
}

function toggleModule(key: string): void {
  const idx = layoutModules.value.indexOf(key)
  // Don't allow removing the last module
  if (idx >= 0 && layoutModules.value.length <= 1) return
  if (idx >= 0) {
    layoutModules.value.splice(idx, 1)
  } else {
    layoutModules.value.push(key)
  }
  setStorage('home_layout_modules', layoutModules.value)
  lightHaptic()
  trackEvent('setting_layout_module', { key, visible: idx < 0 })
}

function isModuleVisible(key: string): boolean {
  return layoutModules.value.includes(key)
}

function setTimeViewPref(value: string): void {
  if (timeViewPref.value === value) return
  timeViewPref.value = value
  setStorage('time_view_preference', value)
  lightHaptic()
  trackEvent('setting_time_view', { value })
}

function goBack(): void {
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<template>
  <view class="safe-page settings-page">
    <view class="topbar">
      <view class="topbar-back" @tap="goBack">
        <text class="topbar-back-arrow">‹</text>
      </view>
      <view class="topbar-title">
        <text class="topbar-title-main">设置</text>
      </view>
      <view class="topbar-placeholder"></view>
    </view>

    <!-- 每周第一天 -->
    <view class="settings-group">
      <view class="settings-group-header">
        <text class="settings-group-title">日历</text>
      </view>
      <view class="panel settings-card">
        <view class="settings-row">
          <view class="settings-row-left">
            <text class="settings-row-icon">📅</text>
            <view class="settings-row-copy">
              <text class="settings-row-label">每周第一天</text>
              <text class="settings-row-desc">日历网格的起始列</text>
            </view>
          </view>
        </view>
        <view class="settings-options">
          <view
            v-for="opt in WEEK_FIRST_OPTIONS"
            :key="opt.value"
            class="settings-option"
            :class="{ 'settings-option-active': weekFirstDay === opt.value }"
            role="button"
            @tap="setWeekFirstDay(opt.value)"
          >
            <text class="settings-option-label">{{ opt.label }}</text>
            <text class="settings-option-desc">{{ opt.desc }}</text>
            <view v-if="weekFirstDay === opt.value" class="settings-option-check">✓</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 首页布局 -->
    <view class="settings-group">
      <view class="settings-group-header">
        <text class="settings-group-title">首页布局</text>
      </view>
      <view class="panel settings-card">
        <view
          v-for="mod in LAYOUT_MODULES"
          :key="mod.key"
          class="settings-row settings-row-touchable"
          role="button"
          @tap="toggleModule(mod.key)"
        >
          <view class="settings-row-left">
            <text class="settings-row-icon">{{ mod.icon }}</text>
            <view class="settings-row-copy">
              <text class="settings-row-label">{{ mod.label }}</text>
              <text class="settings-row-desc">{{ mod.desc }}</text>
            </view>
          </view>
          <view class="settings-toggle" :class="{ 'settings-toggle-on': isModuleVisible(mod.key) }">
            <view class="settings-toggle-thumb"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 十二时辰展示方式 -->
    <view class="settings-group">
      <view class="settings-group-header">
        <text class="settings-group-title">时辰视图</text>
      </view>
      <view class="panel settings-card">
        <view class="settings-row">
          <view class="settings-row-left">
            <text class="settings-row-icon">◷</text>
            <view class="settings-row-copy">
              <text class="settings-row-label">默认展示方式</text>
              <text class="settings-row-desc">十二时辰的默认视图</text>
            </view>
          </view>
        </view>
        <view class="settings-options">
          <view
            v-for="opt in TIME_VIEW_OPTIONS"
            :key="opt.value"
            class="settings-option"
            :class="{ 'settings-option-active': timeViewPref === opt.value }"
            role="button"
            @tap="setTimeViewPref(opt.value)"
          >
            <text class="settings-option-icon">{{ opt.icon }}</text>
            <text class="settings-option-label">{{ opt.label }}</text>
            <text class="settings-option-desc">{{ opt.desc }}</text>
            <view v-if="timeViewPref === opt.value" class="settings-option-check">✓</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 假期更新 -->
    <view class="settings-group">
      <view class="settings-group-header">
        <text class="settings-group-title">数据</text>
      </view>
      <view class="panel settings-card">
        <view class="settings-row settings-row-touchable" role="button" @tap="toggleHolidayUpdate">
          <view class="settings-row-left">
            <text class="settings-row-icon">🗓</text>
            <view class="settings-row-copy">
              <text class="settings-row-label">自动更新假期日历</text>
              <text class="settings-row-desc">联网时自动获取最新法定假日与调休安排</text>
            </view>
          </view>
          <view class="settings-toggle" :class="{ 'settings-toggle-on': holidayAutoUpdate }">
            <view class="settings-toggle-thumb"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 关于 -->
    <view class="settings-group">
      <view class="settings-group-header">
        <text class="settings-group-title">关于</text>
      </view>
      <view class="panel settings-card">
        <view class="settings-row">
          <view class="settings-row-left">
            <text class="settings-row-icon">✦</text>
            <view class="settings-row-copy">
              <text class="settings-row-label">星运日历</text>
              <text class="settings-row-desc">观古今之时，悟禅意人生</text>
            </view>
          </view>
          <text class="settings-row-value">V1.0</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.settings-page {
  padding-bottom: 60rpx;
}

/* Topbar */
.topbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 24rpx 16rpx;
}

.topbar-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
}

.topbar-back-arrow {
  color: var(--gs-ink);
  font-size: 44rpx;
  font-weight: 300;
  line-height: 1;
}

.topbar-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.topbar-title-main {
  color: var(--gs-ink);
  font-size: 34rpx;
  font-weight: 900;
}

.topbar-placeholder {
  width: 64rpx;
}

/* Settings groups */
.settings-group {
  margin-bottom: 28rpx;
}

.settings-group-header {
  padding: 0 28rpx 12rpx;
}

.settings-group-title {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}

.settings-card {
  padding: 0;
}

/* Settings row */
.settings-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
}

.settings-row + .settings-row {
  border-top: 1rpx solid var(--gs-line);
}

.settings-row-touchable {
  cursor: pointer;
}

.settings-row-left {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14rpx;
  flex: 1;
  min-width: 0;
}

.settings-row-icon {
  font-size: 30rpx;
  line-height: 1;
  margin-top: 4rpx;
  width: 40rpx;
  text-align: center;
}

.settings-row-copy {
  display: flex;
  flex-direction: column;
  gap: 3rpx;
  flex: 1;
  min-width: 0;
}

.settings-row-label {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.3;
}

.settings-row-desc {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.35;
}

.settings-row-value {
  flex: none;
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 700;
}

/* Options list */
.settings-options {
  display: flex;
  flex-direction: column;
  border-top: 1rpx solid var(--gs-line);
}

.settings-option {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.settings-option:last-child {
  border-bottom: none;
}

.settings-option-icon {
  font-size: 26rpx;
  line-height: 1;
}

.settings-option-label {
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 800;
}

.settings-option-desc {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
  flex: 1;
}

.settings-option-check {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  color: #fff;
  background: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 900;
}

.settings-option-active {
  background: rgba(49, 93, 118, 0.04);
}

/* Toggle switch */
.settings-toggle {
  flex: none;
  width: 84rpx;
  height: 48rpx;
  border-radius: 999rpx;
  background: var(--gs-line);
  position: relative;
  transition: background 0.2s;
}

.settings-toggle-on {
  background: var(--gs-blue);
}

.settings-toggle-thumb {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.settings-toggle-on .settings-toggle-thumb {
  transform: translateX(36rpx);
}
</style>
