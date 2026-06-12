<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/CustomTabBar.vue'
import type { DateKey } from '@/types/calendar'
import { getTodayKey, parseDateKey } from '@/services/calendar'
import { OCCASIONS, findLuckyDays, findLuckyDaysForMonth, type LuckyDay, type OccasionType, type RangeDays, type RangeMode, type MonthRange } from '@/services/lucky-days'
import { toggleLuckyMark, hasLuckyMark as checkHasLuckyMark, type LuckyMark } from '@/services/lucky-marks'
import { lightHaptic, showToast, trackEvent } from '@/services/platform'

const todayKey = getTodayKey()
const selectedOccasion = ref<OccasionType>('wedding')
const rangeMode = ref<RangeMode>('days')
const selectedRange = ref<RangeDays>(60)
const selectedMonth = ref<MonthRange>({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
const luckyDays = ref<LuckyDay[]>([])
const expandedDate = ref<DateKey | null>(null)
const markedDates = ref<Set<string>>(new Set())

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 30, label: '近30天' },
  { value: 60, label: '近60天' },
  { value: 90, label: '近90天' }
]

const monthPickerValue = computed(() => `${selectedMonth.value.year}-${String(selectedMonth.value.month).padStart(2, '0')}`)

function formatMonthLabel(m: MonthRange): string {
  return `${m.year}年${m.month}月`
}

function handleMonthPick(e: { detail: { value: string } }) {
  const [year, month] = e.detail.value.split('-').map(Number)
  selectedMonth.value = { year, month }
  rangeMode.value = 'month'
  expandedDate.value = null
  calculateLuckyDays()
}

onLoad((options) => {
  if (options?.occasion && OCCASIONS.some(o => o.id === options.occasion)) {
    selectedOccasion.value = options.occasion as OccasionType
  }
})

onMounted(() => {
  calculateLuckyDays()
  trackEvent('lucky_days_page_view')
})

function calculateLuckyDays() {
  if (rangeMode.value === 'month') {
    luckyDays.value = findLuckyDaysForMonth(selectedOccasion.value, selectedMonth.value)
  } else {
    const baseDate = parseDateKey(todayKey)
    luckyDays.value = findLuckyDays(selectedOccasion.value, baseDate, selectedRange.value)
  }
  refreshMarkedDates()
}

function refreshMarkedDates() {
  markedDates.value = new Set(luckyDays.value.filter(d => checkHasLuckyMark(d.date)).map(d => d.date))
}

function selectOccasion(id: OccasionType) {
  if (id === selectedOccasion.value) return
  lightHaptic()
  selectedOccasion.value = id
  expandedDate.value = null
  calculateLuckyDays()
  trackEvent('lucky_days_occasion_select', { occasion: id })
}

function selectRange(range: RangeDays) {
  if (rangeMode.value === 'days' && range === selectedRange.value) return
  lightHaptic()
  selectedRange.value = range
  rangeMode.value = 'days'
  expandedDate.value = null
  calculateLuckyDays()
}

function toggleExpand(dateKey: DateKey) {
  lightHaptic()
  expandedDate.value = expandedDate.value === dateKey ? null : dateKey
}

function goToCalendar(dateKey: DateKey) {
  uni.switchTab({ url: '/pages/home/index' })
  setTimeout(() => {
    uni.$emit('select-date', dateKey)
  }, 200)
}

function toggleBookmark(day: LuckyDay) {
  const occasion = OCCASIONS.find(o => o.id === selectedOccasion.value)
  const mark: LuckyMark = {
    dateKey: day.date,
    occasion: selectedOccasion.value,
    level: day.level === '大吉' ? '大吉' : '吉',
    label: `${occasion?.emoji || ''} ${occasion?.label || ''}${day.level}`,
    emoji: occasion?.emoji || '📅'
  }
  const added = toggleLuckyMark(mark)
  lightHaptic()
  if (added) {
    markedDates.value.add(day.date)
    showToast('已标记到日历')
  } else {
    markedDates.value.delete(day.date)
    showToast('已取消标记')
  }
  trackEvent('lucky_days_toggle_mark', { date: day.date, added })
}

function getLevelColor(level: LuckyDay['level']): string {
  if (level === '大吉') return 'level-daji'
  if (level === '吉') return 'level-ji'
  return 'level-ping'
}

function getRankBadge(index: number): string {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return String(index + 1)
}

const currentOccasion = computed(() => OCCASIONS.find(o => o.id === selectedOccasion.value))
</script>

<template>
  <view class="safe-page lucky-page">
    <view class="topbar">
      <view class="topbar-title">
        <text class="topbar-title-main">择吉日</text>
        <text class="topbar-title-sub">为重要事项择良辰吉日</text>
      </view>
    </view>

    <!-- 场景选择 -->
    <scroll-view class="occasion-scroll" scroll-x>
      <view class="occasion-pills">
        <view
          v-for="occasion in OCCASIONS"
          :key="occasion.id"
          class="occasion-pill"
          :class="{ active: selectedOccasion === occasion.id }"
          @tap="selectOccasion(occasion.id)"
        >
          <text class="pill-emoji">{{ occasion.emoji }}</text>
          <text class="pill-label">{{ occasion.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 当前场景说明 + 范围选择 -->
    <view class="filter-row">
      <text class="filter-desc">{{ currentOccasion?.description }}</text>
    </view>

    <!-- 范围选择 -->
    <view class="range-row">
      <view class="range-pills">
        <view
          v-for="opt in RANGE_OPTIONS"
          :key="opt.value"
          class="range-pill"
          :class="{ active: rangeMode === 'days' && selectedRange === opt.value }"
          @tap="selectRange(opt.value)"
        >
          <text>{{ opt.label }}</text>
        </view>
        <picker mode="date" fields="month" :value="monthPickerValue" start="2020-01" end="2030-12" @change="handleMonthPick">
          <view class="range-pill" :class="{ active: rangeMode === 'month' }">
            <text>{{ formatMonthLabel(selectedMonth) }}</text>
            <text class="range-pill-arrow">▾</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 结果统计 -->
    <view class="stat-bar">
      <text class="stat-text">共 {{ luckyDays.length }} 个吉日</text>
      <view v-if="luckyDays.length" class="stat-levels">
        <text class="stat-dot stat-dot-daji"></text>
        <text class="stat-level">大吉 {{ luckyDays.filter(d => d.level === '大吉').length }}</text>
        <text class="stat-dot stat-dot-ji"></text>
        <text class="stat-level">吉 {{ luckyDays.filter(d => d.level === '吉').length }}</text>
      </view>
    </view>

    <!-- 吉日列表 -->
    <view v-if="luckyDays.length" class="day-list">
      <view
        v-for="(day, index) in luckyDays"
        :key="day.date"
        class="day-card panel"
        :class="getLevelColor(day.level)"
        @tap="toggleExpand(day.date)"
      >
        <view class="card-main">
          <view class="card-left">
            <text class="card-rank">{{ getRankBadge(index) }}</text>
          </view>
          <view class="card-center">
            <view class="card-date-row">
              <text class="card-date">{{ day.date }}</text>
              <text class="card-weekday">{{ day.weekday }}</text>
            </view>
            <text class="card-lunar">{{ day.lunarText }} · {{ day.ganzhi }}</text>
            <view class="card-tags">
              <text class="card-tag tag-suitable">宜：{{ day.suitable.slice(0, 3).join('·') }}</text>
              <text class="card-tag tag-avoid">忌：{{ day.avoid.slice(0, 2).join('·') }}</text>
            </view>
          </view>
          <view class="card-right">
            <view class="card-right-top">
              <text v-if="markedDates.has(day.date)" class="card-bookmark">🔖</text>
              <text class="card-level" :class="getLevelColor(day.level)">{{ day.level }}</text>
              <text class="card-score">{{ day.score }}</text>
            </view>
            <view class="card-expand" :class="{ 'card-expand-open': expandedDate === day.date }">
              <text class="card-expand-text">{{ expandedDate === day.date ? '收起' : '展开' }}</text>
              <text class="card-expand-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 展开详情 -->
        <view v-if="expandedDate === day.date" class="card-detail">
          <view class="detail-row">
            <text class="detail-label">冲煞</text>
            <text class="detail-value">{{ day.clashZodiac }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">缘由</text>
            <text class="detail-value">{{ day.reason }}</text>
          </view>
          <view v-if="day.bestHours.length" class="detail-row">
            <text class="detail-label">最佳吉时</text>
            <view class="detail-hours">
              <text v-for="h in day.bestHours" :key="h" class="hour-chip">{{ h }}</text>
            </view>
          </view>
          <view class="detail-row">
            <text class="detail-label">宜</text>
            <text class="detail-value tag-suitable">{{ day.suitable.join('、') }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">忌</text>
            <text class="detail-value tag-avoid">{{ day.avoid.join('、') }}</text>
          </view>
          <view class="detail-actions">
            <view class="detail-btn detail-btn-mark" :class="{ marked: markedDates.has(day.date) }" @tap.stop="toggleBookmark(day)">
              <text>{{ markedDates.has(day.date) ? '取消标记' : '标记到日历' }}</text>
            </view>
            <view class="detail-btn" @tap.stop="goToCalendar(day.date)">
              <text>查看日历</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 无结果 -->
    <view v-else class="empty-panel panel">
      <text class="empty-icon">🔍</text>
      <text class="empty-text">近期暂无合适的吉日</text>
      <text class="empty-hint">可尝试扩大搜索范围或切换场景</text>
    </view>

    <CustomTabBar :active="0" />
  </view>
</template>

<style scoped>
.lucky-page {
  padding-bottom: 180rpx;
}

.topbar-title {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.topbar-title-main {
  color: var(--gs-ink);
  font-size: 34rpx;
  font-weight: 900;
}

.topbar-title-sub {
  color: var(--gs-muted);
  font-size: 22rpx;
}

/* Occasion pills */
.occasion-scroll {
  margin-bottom: 16rpx;
  white-space: nowrap;
  width: 100%;
}

.occasion-pills {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
  padding: 4rpx 0;
}

.occasion-pill {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 22rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  background: transparent;
  transition: border-color 200ms ease, background 200ms ease;
}

.occasion-pill.active {
  border-color: var(--gs-blue);
  background: rgba(49, 93, 118, 0.08);
}

.pill-emoji {
  font-size: 28rpx;
  line-height: 1;
}

.pill-label {
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 700;
}

.occasion-pill.active .pill-label {
  color: var(--gs-blue);
  font-weight: 800;
}

/* Filter row */
.filter-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.filter-desc {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

/* Range row */
.range-row {
  margin-bottom: 14rpx;
}

.range-pills {
  display: flex;
  flex-direction: row;
  gap: 8rpx;
  align-items: center;
  flex-wrap: wrap;
}

.range-pill {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 6rpx 16rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  background: transparent;
}

.range-pill text {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

.range-pill.active {
  border-color: var(--gs-blue);
  background: rgba(49, 93, 118, 0.08);
}

.range-pill.active text {
  color: var(--gs-blue);
  font-weight: 800;
}

.range-pill-arrow {
  font-size: 18rpx;
  line-height: 1;
}

/* Stat bar */
.stat-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
}

.stat-text {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.stat-levels {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.stat-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}

.stat-dot-daji {
  background: var(--gs-gold);
}

.stat-dot-ji {
  background: var(--gs-blue);
}

.stat-level {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

/* Day list */
.day-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.day-card {
  border-left: 6rpx solid var(--gs-line);
  padding: 22rpx 24rpx;
  transition: border-color 200ms ease;
}

.day-card:active {
  background: rgba(49, 93, 118, 0.06);
}

.day-card.level-daji {
  border-left-color: var(--gs-gold);
}

.day-card.level-ji {
  border-left-color: var(--gs-blue);
}

.day-card.level-ping {
  border-left-color: var(--gs-muted);
}

.card-main {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16rpx;
}

.card-left {
  flex: none;
  width: 50rpx;
  padding-top: 2rpx;
}

.card-rank {
  font-size: 30rpx;
  line-height: 1;
}

.card-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.card-date-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10rpx;
}

.card-date {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 900;
}

.card-weekday {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.card-lunar {
  color: var(--gs-muted);
  font-size: 22rpx;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.card-tag {
  font-size: 22rpx;
  line-height: 1.4;
}

.tag-suitable {
  color: var(--gs-green);
}

.tag-avoid {
  color: var(--gs-red);
}

.card-right {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  align-self: stretch;
  min-width: 120rpx;
}

.card-right-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6rpx;
}

.card-bookmark {
  font-size: 22rpx;
  line-height: 1;
}

.card-level {
  font-size: 22rpx;
  font-weight: 900;
}

.card-level.level-daji {
  color: var(--gs-gold);
}

.card-level.level-ji {
  color: var(--gs-blue);
}

.card-level.level-ping {
  color: var(--gs-muted);
}

.card-score {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

.card-expand {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
  padding: 4rpx 12rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  background: rgba(49, 93, 118, 0.04);
}

.card-expand-text {
  color: var(--gs-blue);
  font-size: 18rpx;
  font-weight: 700;
}

.card-expand-arrow {
  color: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 200ms ease;
}

.card-expand-open {
  border-color: var(--gs-muted);
  background: transparent;
}

.card-expand-open .card-expand-text {
  color: var(--gs-muted);
}

.card-expand-open .card-expand-arrow {
  color: var(--gs-muted);
  transform: rotate(270deg);
}

/* Expanded detail */
.card-detail {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--gs-line);
}

.detail-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14rpx;
}

.detail-label {
  flex: none;
  width: 120rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.detail-value {
  flex: 1;
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 700;
}

.detail-hours {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8rpx;
}

.hour-chip {
  padding: 6rpx 16rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.28);
  border-radius: 999rpx;
  background: rgba(199, 141, 42, 0.1);
  color: #6f4510;
  font-size: 22rpx;
  font-weight: 700;
}

.detail-actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 4rpx;
}

.detail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 22rpx;
  border: 1rpx solid var(--gs-blue);
  border-radius: 999rpx;
  background: transparent;
}

.detail-btn text {
  color: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 800;
}

.detail-btn-mark {
  border-color: var(--gs-gold);
}

.detail-btn-mark text {
  color: #6f4510;
}

.detail-btn-mark.marked {
  border-color: var(--gs-muted);
}

.detail-btn-mark.marked text {
  color: var(--gs-muted);
}

/* Empty */
.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 60rpx 36rpx;
}

.empty-icon {
  font-size: 52rpx;
}

.empty-text {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 800;
}

.empty-hint {
  color: var(--gs-muted);
  font-size: 22rpx;
}
</style>
