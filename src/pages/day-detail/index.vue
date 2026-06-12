<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import HourAdviceCard from '@/components/HourAdviceCard.vue'
import TimeCompass from '@/components/TimeCompass.vue'
import TimelineView from '@/components/TimelineView.vue'
import type { DayAlmanac, HourAlmanac } from '@/types/almanac'
import { fetchDayAlmanac, getDayAlmanac } from '@/services/almanac'
import type { DateKey } from '@/types/calendar'
import { getTodayKey, isDateKey } from '@/services/calendar'
import { getZodiacById, getZodiacFortune } from '@/services/zodiac'
import { getStorage, lightHaptic, setStorage, trackEvent } from '@/services/platform'

type ViewMode = 'compass' | 'timeline'

const storedDateKey = getStorage<string>('selected_date', getTodayKey())
const dateKey = ref<DateKey>(isDateKey(storedDateKey) ? storedDateKey : getTodayKey())
const viewMode = ref<ViewMode>(getStorage('time_view_preference', 'compass') as ViewMode)
const isTraditionalOpen = ref(false)
const selectedHourId = ref(0)

const almanac = ref(getDayAlmanac(dateKey.value))
const zodiacId = computed(() => getStorage<string | null>('user_zodiac_sign', null))
const zodiacSign = computed(() => getZodiacById(zodiacId.value))
const zodiacFortunePreview = computed(() => {
  if (!zodiacId.value || !zodiacSign.value) return null
  return getZodiacFortune(zodiacId.value, dateKey.value)
})

let almanacRequestId = 0

onLoad((query) => {
  if (query?.date && typeof query.date === 'string' && isDateKey(query.date)) {
    dateKey.value = query.date
    setStorage('selected_date', query.date)
  }
})

watch(
  dateKey,
  (currentDateKey) => {
    void loadAlmanac(currentDateKey)
  },
  { immediate: true }
)

async function loadAlmanac(currentDateKey: DateKey): Promise<void> {
  const requestId = ++almanacRequestId
  const localAlmanac = getDayAlmanac(currentDateKey)
  almanac.value = localAlmanac
  selectedHourId.value = getDefaultHourId(localAlmanac)

  const loadedAlmanac = await fetchDayAlmanac(currentDateKey)
  if (requestId !== almanacRequestId || currentDateKey !== dateKey.value) return

  almanac.value = loadedAlmanac
  if (!loadedAlmanac.hours.some((hour) => hour.branch.id === selectedHourId.value)) {
    selectedHourId.value = getDefaultHourId(loadedAlmanac)
  }
}

function getDefaultHourId(dayAlmanac: DayAlmanac): number {
  return dayAlmanac.highlightHour.branch.id
}

function goBack(): void {
  uni.navigateBack()
}

function toggleTraditional(): void {
  isTraditionalOpen.value = !isTraditionalOpen.value
}

function setViewMode(mode: ViewMode): void {
  if (viewMode.value === mode) return
  const from = viewMode.value
  viewMode.value = mode
  setStorage('time_view_preference', mode)
  trackEvent('time_view_toggle', {
    from_view: from,
    to_view: mode
  })
}

function selectHour(hour: HourAlmanac, action: 'tap'): void {
  selectedHourId.value = hour.branch.id
  lightHaptic()
  trackEvent(viewMode.value === 'compass' ? 'compass_interact' : 'timeline_interact', {
    action,
    selected_hour: hour.branch.name
  })
  trackEvent('hour_detail_view', {
    selected_hour: hour.branch.name,
    view_type: viewMode.value
  })
}

function openZodiac(): void {
  trackEvent('zodiac_entry_click', {
    has_set_zodiac: Boolean(zodiacId.value)
  })
  uni.navigateTo({
    url: `/pages/zodiac/index?date=${dateKey.value}`
  })
}
</script>

<template>
  <view class="safe-page detail-page">
    <view class="topbar">
      <button class="icon-button" aria-label="返回" @tap="goBack">‹</button>
      <view class="detail-title">
        <text>{{ almanac.title }}</text>
        <text>{{ almanac.weekdayText }}</text>
      </view>
      <button class="icon-button" aria-label="星座" @tap="openZodiac">♒</button>
    </view>

    <view class="date-hero">
      <text class="hero-date">{{ almanac.title }} {{ almanac.weekdayText }}</text>
      <text class="hero-lunar">{{ almanac.lunarText }}</text>
      <text v-if="almanac.festivalText" class="hero-festival">{{ almanac.festivalText }}</text>
      <view class="hero-advice">
        <view class="hero-advice-line">
          <text class="daily-mark daily-good">宜</text>
          <view class="advice-dual">
            <text class="advice-traditional">{{ almanac.traditionalSuitable.join(' · ') }}</text>
            <text class="advice-modern">{{ almanac.suitable.join(' · ') }}</text>
          </view>
        </view>
        <view class="hero-advice-line">
          <text class="daily-mark daily-bad">忌</text>
          <view class="advice-dual">
            <text class="advice-traditional">{{ almanac.traditionalAvoid.join(' · ') }}</text>
            <text class="advice-modern">{{ almanac.avoid.join(' · ') }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="panel traditional-panel" @tap="toggleTraditional">
      <view class="traditional-row">
        <text class="traditional-label">冲煞</text>
        <text class="traditional-value">{{ almanac.clash }}</text>
        <text class="fold-mark">{{ isTraditionalOpen ? '⌃' : '⌄' }}</text>
      </view>
      <view v-if="isTraditionalOpen" class="traditional-more">
        <text>岁次：{{ almanac.sexagenary }}</text>
        <text>彭祖百忌：{{ almanac.pengzu }}</text>
        <text>吉神：{{ almanac.luckyGods.join('、') }}</text>
        <text>凶神：{{ almanac.unluckyGods.join('、') }}</text>
      </view>
    </view>

    <view class="section-title">
      <text>当前时辰</text>
      <text class="section-meta">{{ almanac.highlightHour.branch.name }} {{ almanac.highlightHour.branch.range }}</text>
    </view>
    <HourAdviceCard class="hour-detail" :hour="almanac.highlightHour" />

    <view class="section-title">
      <text>十二时辰宜忌</text>
      <view class="view-switch">
        <button class="view-tab" :class="{ 'view-tab-active': viewMode === 'compass' }" @tap="setViewMode('compass')">⊚</button>
        <button class="view-tab" :class="{ 'view-tab-active': viewMode === 'timeline' }" @tap="setViewMode('timeline')">☰</button>
      </view>
    </view>

    <view class="panel time-panel">
      <TimeCompass v-if="viewMode === 'compass'" :hours="almanac.hours" :selected-id="selectedHourId" @select="selectHour" />
      <TimelineView v-else :hours="almanac.hours" :selected-id="selectedHourId" @select="selectHour" />
    </view>

    <view class="panel zodiac-entry" @tap="openZodiac">
      <view class="zodiac-entry-head">
        <text class="zodiac-title">{{ zodiacSign ? `${zodiacSign.symbol} ${zodiacSign.name}今日指引` : '查看你的今日星座指引' }}</text>
        <text class="zodiac-link">{{ zodiacSign ? '完整运势' : '选择' }} ›</text>
      </view>
      <view v-if="zodiacFortunePreview" class="zodiac-preview">
        <view class="zodiac-score-row">
          <text class="zodiac-label">综合运势</text>
          <text class="zodiac-stars">{{ zodiacFortunePreview.stars }}</text>
          <text class="zodiac-score">{{ zodiacFortunePreview.score }}%</text>
        </view>
        <view class="zodiac-summary-block">
          <text class="zodiac-label">今日核心提示</text>
          <text class="zodiac-summary">{{ zodiacFortunePreview.summary }}</text>
        </view>
      </view>
      <text v-else class="zodiac-copy">选择星座后查看综合运势和今日核心提示</text>
    </view>
  </view>
</template>

<style scoped>
.detail-page {
  padding-bottom: 64rpx;
}

.detail-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1.35;
}

.date-hero {
  padding: 18rpx 0 28rpx;
}

.hero-date,
.hero-lunar,
.hero-festival {
  display: block;
}

.hero-date {
  color: var(--gs-ink);
  font-size: 48rpx;
  font-weight: 900;
}

.hero-lunar {
  margin-top: 12rpx;
  color: var(--gs-muted);
  font-size: 26rpx;
}

.hero-festival {
  margin-top: 12rpx;
  color: var(--gs-blue);
  font-size: 24rpx;
}

.hero-advice {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid var(--gs-line);
}

.hero-advice-line {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.45;
}

.advice-dual {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.advice-traditional {
  color: var(--gs-muted);
  font-size: 24rpx;
  opacity: 0.75;
}

.advice-modern {
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 500;
}

.traditional-panel {
  padding: 24rpx;
}

.traditional-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.traditional-label {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 26rpx;
  font-weight: 800;
}

.traditional-value {
  flex: 1;
  color: var(--gs-ink);
  font-size: 26rpx;
}

.fold-mark {
  color: var(--gs-gold);
  font-size: 30rpx;
}

.traditional-more {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--gs-line);
  color: var(--gs-muted);
  font-size: 24rpx;
  line-height: 1.45;
}

.daily-mark {
  flex: 0 0 auto;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 22rpx;
  line-height: 44rpx;
  text-align: center;
}

.daily-good {
  background: var(--gs-green);
}

.daily-bad {
  background: var(--gs-red);
}

.section-meta {
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 500;
}

.view-switch {
  display: flex;
  gap: 10rpx;
}

.view-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 50%;
  color: var(--gs-muted);
  background: rgba(255, 250, 240, 0.72);
  font-size: 30rpx;
}

.view-tab-active {
  color: #ffffff;
  background: var(--gs-blue);
}

.time-panel {
  padding: 14rpx;
}

.hour-detail {
  margin-top: 0;
}

.zodiac-entry {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 24rpx;
  padding: 26rpx;
}

.zodiac-entry-head,
.zodiac-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.zodiac-title {
  display: block;
  min-width: 0;
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.35;
}

.zodiac-link {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 24rpx;
  font-weight: 800;
}

.zodiac-preview {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.zodiac-label,
.zodiac-stars,
.zodiac-score,
.zodiac-summary,
.zodiac-copy {
  display: block;
}

.zodiac-label {
  flex: 0 0 auto;
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.zodiac-stars {
  flex: 1;
  color: var(--gs-gold);
  font-size: 26rpx;
  line-height: 1;
}

.zodiac-score {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 30rpx;
  font-weight: 900;
}

.zodiac-summary-block {
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(223, 210, 191, 0.82);
}

.zodiac-summary {
  margin-top: 8rpx;
  color: var(--gs-ink);
  font-size: 25rpx;
  line-height: 1.5;
}

.zodiac-copy {
  color: var(--gs-muted);
  font-size: 24rpx;
  line-height: 1.45;
}
</style>
