<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { getDayAlmanac } from '@/services/almanac'
import type { DateKey } from '@/types/calendar'
import { getTodayKey, parseDateKey } from '@/services/calendar'
import type { DayAlmanac } from '@/types/almanac'
import type { ZodiacFortuneCache, ZodiacFortuneResult, ZodiacId } from '@/types/zodiac'
import {
  createZodiacFortuneCache,
  fetchZodiacFortune,
  getZodiacByBirthday,
  getZodiacById,
  getZodiacCacheKey,
  isZodiacFortuneCache,
  resolveZodiacFortune,
  ZODIAC_SIGNS
} from '@/services/zodiac'
import { getNetworkType, getStorage, setStorage, showToast, trackEvent } from '@/services/platform'
import { getPeriodByDate } from '@/services/seventy-two-periods'
import { getSeasonSpecial } from '@/services/season-special'
import { getMoonPhase } from '@/services/moon-phase'

interface FortuneDetailItem {
  id: string
  title: string
  copy: string
  score: number
}

interface LuckyItem {
  label: string
  value: string
}

const todayKey = getTodayKey()
const dateKey = ref<DateKey>(todayKey)
const dayAlmanac = ref<DayAlmanac>(getDayAlmanac(todayKey))

// Zodiac state
const selectedZodiacId = ref<string | null>(getStorage('user_zodiac_sign', null))
const birthday = ref(getStorage('user_birthday', ''))
const isChoosing = ref(!selectedZodiacId.value)
const isOffline = ref(false)
const isLoading = ref(false)
const errorText = ref('')
const fortuneState = ref<ZodiacFortuneResult | null>(null)

const selectedSign = computed(() => getZodiacById(selectedZodiacId.value))
const fortune = computed(() => fortuneState.value?.fortune || null)

// Almanac sections
const currentDate = computed(() => parseDateKey(dateKey.value))
const currentMonthDay = computed(() => {
  const date = currentDate.value
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})
const moonPhase = computed(() => getMoonPhase(currentDate.value))
const periodData = computed(() => getPeriodByDate(currentMonthDay.value))
const seasonSpecial = computed(() => getSeasonSpecial(currentDate.value))
const todayInsight = computed(() => moonPhase.value?.insight || periodData.value?.insight || seasonSpecial.value?.data.insight || '')
const goodHours = computed(() => dayAlmanac.value.hours.filter(h => h.level === 'good'))
const badHours = computed(() => dayAlmanac.value.hours.filter(h => h.level === 'bad'))

// Zodiac sections
const birthdayPickerValue = computed(() => birthday.value || '2000-01-01')
const birthdayText = computed(() => (birthday.value ? birthday.value : '用生日自动匹配星座'))
const dateText = computed(() => {
  if (!fortune.value) return dateKey.value
  return fortune.value.dateKey === getTodayKey() ? '今日' : fortune.value.dateKey
})
const cacheStatusText = computed(() => {
  if (!fortuneState.value) return ''
  if (fortuneState.value.source === 'fallback') return isOffline.value ? '离线本地内容' : '本地兜底内容'
  if (fortuneState.value.source === 'stale-cache') {
    return fortuneState.value.isDateMismatch ? `${fortuneState.value.fortune.dateKey} 缓存内容` : '缓存已过期'
  }
  if (isOffline.value && fortuneState.value.source === 'fresh') return '离线本地内容'
  if (fortuneState.value.source === 'cache') return `缓存至 ${formatTime(fortuneState.value.expiresAt)}`
  return `已更新 ${formatTime(fortuneState.value.cachedAt)}`
})
const cacheStatusClass = computed(() => {
  if (!fortuneState.value) return ''
  if (fortuneState.value.source === 'stale-cache' || fortuneState.value.source === 'fallback' || isOffline.value) return 'cache-pill-warn'
  if (fortuneState.value.source === 'cache') return 'cache-pill-soft'
  return 'cache-pill-fresh'
})
const fortuneDetails = computed<FortuneDetailItem[]>(() => {
  if (!fortune.value) return []
  return [
    { id: 'love', title: '爱情运', copy: fortune.value.love, score: clampScore(fortune.value.loveScore) },
    { id: 'career', title: '事业运', copy: fortune.value.career, score: clampScore(fortune.value.careerScore) },
    { id: 'wealth', title: '财富运', copy: fortune.value.wealth, score: clampScore(fortune.value.wealthScore) },
    { id: 'social', title: '社交运', copy: fortune.value.social, score: clampScore(fortune.value.socialScore) },
    { id: 'health', title: '健康运', copy: fortune.value.health, score: clampScore(fortune.value.healthScore) }
  ]
})
const luckyItems = computed<LuckyItem[]>(() => {
  if (!fortune.value) return []
  return [
    { label: '幸运色', value: fortune.value.luckyColor },
    { label: '幸运数', value: String(fortune.value.luckyNumber) },
    { label: '方位', value: fortune.value.luckyDirection },
    { label: '时段', value: fortune.value.bestTime }
  ]
})

onMounted(() => {
  trackEvent('fortune_page_view', { has_zodiac: Boolean(selectedZodiacId.value) })
  if (selectedZodiacId.value) {
    void loadFortune()
  }
})

function selectZodiac(id: ZodiacId): void {
  selectedZodiacId.value = id
  isChoosing.value = false
  setStorage('user_zodiac_sign', id)
  setStorage('zodiac_last_view_date', dateKey.value)
  void loadFortune({ forceRefresh: true })
  trackEvent('zodiac_sign_select', { selected_zodiac: id })
}

function toggleChooser(): void {
  isChoosing.value = true
}

async function refreshFortune(): Promise<void> {
  await loadFortune({ forceRefresh: true })
  const source = fortuneState.value?.source
  if (source === 'fresh') {
    showToast('已更新运势')
  } else if (source === 'fallback') {
    showToast(isOffline.value ? '当前离线，已显示本地内容' : '后端暂不可用，已显示本地内容')
  } else {
    showToast('已显示缓存运势')
  }
  trackEvent('zodiac_cache_refresh', {
    zodiac_sign: selectedZodiacId.value,
    source
  })
}

async function loadFortune(options: { forceRefresh?: boolean } = {}): Promise<void> {
  if (!selectedZodiacId.value) return
  isLoading.value = true
  errorText.value = ''

  try {
    const networkType = await getNetworkType()
    isOffline.value = networkType === 'none'
    const cache = readFortuneCache(selectedZodiacId.value)

    if (!options.forceRefresh) {
      const cachedState = resolveZodiacFortune(selectedZodiacId.value, dateKey.value, cache)
      if (cachedState.source === 'cache') {
        fortuneState.value = cachedState
        return
      }
    }

    if (!isOffline.value) {
      try {
        const remoteFortune = await fetchZodiacFortune(selectedZodiacId.value, dateKey.value)
        const now = Date.now()
        const remoteCache = createZodiacFortuneCache(remoteFortune.sign.id, remoteFortune.dateKey, now, remoteFortune)
        fortuneState.value = {
          fortune: remoteFortune,
          source: 'fresh',
          cachedAt: remoteCache.cachedAt,
          expiresAt: remoteCache.expiresAt,
          isExpired: false,
          isDateMismatch: false,
          cache: remoteCache
        }
        setStorage(getZodiacCacheKey(remoteCache.signId), remoteCache)
        return
      } catch (error) {
        errorText.value = '后端暂不可用，展示本地兜底运势'
        if (import.meta.env.DEV) {
          console.warn('[fortune:fetch]', error)
        }
      }
    }

    const localState = resolveZodiacFortune(selectedZodiacId.value, dateKey.value, cache, {
      preferCache: true
    })
    const state: ZodiacFortuneResult =
      localState.source === 'fresh'
        ? { ...localState, source: 'fallback' }
        : localState
    fortuneState.value = state
    if (state.source === 'fallback') {
      errorText.value = isOffline.value ? '当前离线，展示本地兜底运势' : errorText.value
    }
    if (state.cache) {
      setStorage(getZodiacCacheKey(state.cache.signId), state.cache)
    }
  } finally {
    isLoading.value = false
  }
}

function readFortuneCache(signId: string): ZodiacFortuneCache | null {
  const value = getStorage<unknown>(getZodiacCacheKey(signId), null)
  return isZodiacFortuneCache(value) ? value : null
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function onBirthdayChange(event: { detail?: { value?: string } }): void {
  const value = event.detail?.value
  if (!value) return

  birthday.value = value
  setStorage('user_birthday', value)
  const sign = getZodiacByBirthday(value)
  if (!sign) {
    showToast('生日日期无效')
    return
  }

  selectZodiac(sign.id)
  showToast(`已匹配${sign.name}`)
  trackEvent('zodiac_birthday_set', { zodiac_sign: sign.id })
}
</script>

<template>
  <view class="safe-page fortune-page">
    <view class="topbar">
      <view class="topbar-title">
        <text class="topbar-title-main">今日运势</text>
        <text class="topbar-title-sub">{{ dayAlmanac.title }}</text>
      </view>
    </view>

    <!-- 今日总览 -->
    <view class="panel overview-panel">
      <view class="overview-row">
        <text class="overview-label">今日关键词</text>
        <text class="overview-keyword">{{ dayAlmanac.keyword }}</text>
      </view>
      <view class="overview-row">
        <text class="overview-label">今日特质</text>
        <text class="overview-value">{{ dayAlmanac.trait }}</text>
      </view>
      <view class="overview-row">
        <text class="overview-label">今日指引</text>
        <text class="overview-guide">{{ dayAlmanac.guide }}</text>
      </view>
    </view>

    <!-- 宜忌概要 -->
    <view class="panel advice-panel">
      <view class="advice-row">
        <text class="advice-mark advice-good">宜</text>
        <text class="advice-text">{{ dayAlmanac.suitable.join(' · ') }}</text>
      </view>
      <view class="advice-row">
        <text class="advice-mark advice-bad">忌</text>
        <text class="advice-text">{{ dayAlmanac.avoid.join(' · ') }}</text>
      </view>
    </view>

    <!-- 吉凶时辰 -->
    <view class="section-title">
      <text>时辰吉凶</text>
    </view>
    <view class="hour-tags">
      <view v-for="h in goodHours" :key="h.branch.id" class="hour-tag hour-tag-good">
        <text>{{ h.branch.name }}</text>
      </view>
      <view v-for="h in badHours" :key="h.branch.id" class="hour-tag hour-tag-bad">
        <text>{{ h.branch.name }}</text>
      </view>
    </view>

    <!-- 星座运势分割线 -->
    <view class="section-title section-divider">
      <text>{{ selectedSign ? selectedSign.name + '运势' : '星座运势' }}</text>
      <button v-if="selectedSign && !isChoosing" class="switch-sign-btn" @tap="toggleChooser">切换</button>
    </view>

    <!-- 星座选择器 -->
    <view v-if="isChoosing" class="sign-grid">
      <picker
        class="birthday-picker sign-picker"
        mode="date"
        :value="birthdayPickerValue"
        start="1900-01-01"
        :end="todayKey"
        @change="onBirthdayChange"
      >
        <view class="panel birthday-picker-inner">
          <view>
            <text class="birthday-picker-label">生日匹配</text>
            <text class="birthday-picker-value">{{ birthdayText }}</text>
          </view>
          <text class="birthday-picker-arrow">›</text>
        </view>
      </picker>

      <button v-for="sign in ZODIAC_SIGNS" :key="sign.id" class="panel sign-cell" @tap="selectZodiac(sign.id)">
        <text class="sign-symbol">{{ sign.symbol }}</text>
        <text class="sign-name">{{ sign.name.replace('座', '') }}</text>
        <text class="sign-range">{{ sign.range }}</text>
      </button>
    </view>

    <!-- 星座运势展示 -->
    <view v-else-if="fortune" class="fortune-wrap">
      <view class="fortune-hero">
        <view class="fortune-symbol-wrap">
          <text class="fortune-symbol">{{ fortune.sign.symbol }}</text>
        </view>
        <text class="fortune-date">{{ dateText }}</text>
        <text class="fortune-name">{{ fortune.sign.name }}</text>
        <text class="fortune-range">{{ fortune.sign.range }}</text>
        <view class="keyword-chip">
          <text>关键词</text>
          <text>{{ fortune.keyword }}</text>
        </view>
      </view>

      <view class="fortune-meta">
        <text class="cache-pill" :class="cacheStatusClass">{{ isLoading ? '更新中...' : cacheStatusText }}</text>
        <button class="refresh-button" @tap="refreshFortune">刷新</button>
      </view>

      <view v-if="errorText" class="error-banner">
        <text>{{ errorText }}</text>
      </view>

      <view class="panel score-panel">
        <view>
          <text class="score-label">综合运势</text>
          <text class="score-stars">{{ fortune.stars }}</text>
        </view>
        <text class="score-number">{{ fortune.score }}%</text>
      </view>

      <view class="panel summary-panel">
        <text class="summary-title">今日核心提示</text>
        <text class="summary-copy">{{ fortune.summary }}</text>
      </view>

      <view class="fortune-list">
        <view v-for="item in fortuneDetails" :key="item.id" class="fortune-item">
          <view class="fortune-item-head">
            <text class="fortune-item-title">{{ item.title }}</text>
            <text class="fortune-item-score">{{ item.score }}%</text>
          </view>
          <view class="fortune-meter">
            <view class="fortune-meter-fill" :style="{ width: `${item.score}%` }"></view>
          </view>
          <text class="fortune-item-copy">{{ item.copy }}</text>
        </view>
      </view>

      <view class="panel lucky-panel">
        <view v-for="item in luckyItems" :key="item.label" class="lucky-item">
          <text class="lucky-label">{{ item.label }}</text>
          <text class="lucky-value">{{ item.value }}</text>
        </view>
      </view>

      <view class="panel caution-panel">
        <text class="caution-label">今日提醒</text>
        <text class="caution-copy">{{ fortune.caution }}</text>
      </view>

      <view v-if="todayInsight" class="panel insight-panel">
        <text class="insight-label">今日一悟</text>
        <text class="insight-copy">{{ todayInsight }}</text>
      </view>

      <picker
        class="birthday-picker"
        mode="date"
        :value="birthdayPickerValue"
        start="1900-01-01"
        :end="todayKey"
        @change="onBirthdayChange"
      >
        <view class="panel birthday-picker-inner">
          <view>
            <text class="birthday-picker-label">生日匹配</text>
            <text class="birthday-picker-value">{{ birthdayText }}</text>
          </view>
          <text class="birthday-picker-arrow">›</text>
        </view>
      </picker>
    </view>

    <!-- 未选择星座 -->
    <view v-else class="panel zodiac-empty">
      <text class="zodiac-empty-icon">✦</text>
      <text class="zodiac-empty-text">选择星座，查看专属运势</text>
    </view>

    <CustomTabBar :active="4" />
  </view>
</template>

<style scoped>
.fortune-page {
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

/* Overview */
.overview-panel {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
}

.overview-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.overview-label {
  flex: 0 0 auto;
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 800;
  min-width: 140rpx;
}

.overview-keyword {
  color: var(--gs-gold);
  font-size: 28rpx;
  font-weight: 900;
}

.overview-value {
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 700;
}

.overview-guide {
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.5;
}

/* Advice */
.advice-panel {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
}

.advice-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.advice-mark {
  flex: 0 0 auto;
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

.advice-text {
  flex: 1;
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.5;
}

/* Hour tags */
.hour-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.hour-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80rpx;
  height: 56rpx;
  padding: 0 16rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 800;
}

.hour-tag-good {
  color: #3d5e3f;
  background: rgba(85, 116, 90, 0.14);
  border: 1rpx solid rgba(85, 116, 90, 0.24);
}

.hour-tag-bad {
  color: #8f2e28;
  background: rgba(184, 74, 63, 0.1);
  border: 1rpx solid rgba(184, 74, 63, 0.18);
}

/* Section divider */
.section-divider {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-sign-btn {
  padding: 6rpx 20rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  color: var(--gs-blue);
  background: transparent;
  font-size: 22rpx;
  font-weight: 700;
}

/* Sign grid */
.sign-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.sign-picker {
  grid-column: 1 / -1;
}

.sign-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 188rpx;
  padding: 18rpx 10rpx;
  color: var(--gs-ink);
}

.sign-symbol,
.sign-name,
.sign-range {
  display: block;
}

.sign-symbol {
  color: var(--gs-gold);
  font-size: 48rpx;
  line-height: 1;
}

.sign-name {
  margin-top: 12rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.sign-range {
  margin-top: 8rpx;
  color: var(--gs-muted);
  font-size: 18rpx;
  line-height: 1.25;
  text-align: center;
}

/* Fortune display */
.fortune-wrap {
  padding-top: 10rpx;
}

.fortune-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 28rpx;
}

.fortune-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 18rpx;
}

.cache-pill {
  display: inline-flex;
  align-items: center;
  min-height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 48rpx;
}

.cache-pill-fresh {
  color: #315d76;
  background: rgba(49, 93, 118, 0.12);
}

.cache-pill-soft {
  color: #6f4510;
  background: rgba(199, 141, 42, 0.14);
}

.cache-pill-warn {
  color: #8f2e28;
  background: rgba(184, 74, 63, 0.12);
}

.refresh-button {
  flex: 0 0 auto;
  min-width: 112rpx;
  min-height: 52rpx;
  padding: 0 22rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  color: var(--gs-blue);
  background: rgba(255, 250, 240, 0.82);
  font-size: 22rpx;
  line-height: 52rpx;
}

.fortune-symbol,
.fortune-date,
.fortune-name,
.fortune-range {
  display: block;
}

.fortune-symbol-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.28);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 250, 240, 0.95), rgba(245, 222, 182, 0.54)),
    linear-gradient(180deg, rgba(199, 141, 42, 0.16), rgba(49, 93, 118, 0.06));
}

.fortune-symbol {
  color: var(--gs-gold);
  font-size: 78rpx;
  line-height: 1;
}

.fortune-date {
  margin-top: 16rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.fortune-name {
  margin-top: 8rpx;
  color: var(--gs-ink);
  font-size: 40rpx;
  font-weight: 900;
}

.fortune-range {
  margin-top: 8rpx;
  color: var(--gs-muted);
  font-size: 24rpx;
}

.keyword-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-height: 50rpx;
  margin-top: 18rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.28);
  border-radius: 999rpx;
  color: #6f4510;
  background: rgba(245, 215, 110, 0.24);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 50rpx;
}

.error-banner {
  margin-bottom: 18rpx;
  padding: 18rpx 22rpx;
  border: 1rpx solid rgba(184, 74, 63, 0.18);
  border-radius: 14rpx;
  color: #8f2e28;
  background: rgba(184, 74, 63, 0.08);
  font-size: 23rpx;
  line-height: 1.45;
}

.score-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}

.score-label,
.score-stars,
.score-number {
  display: block;
}

.score-label {
  color: var(--gs-muted);
  font-size: 24rpx;
}

.score-stars {
  margin-top: 8rpx;
  color: var(--gs-gold);
  font-size: 34rpx;
}

.score-number {
  color: var(--gs-blue);
  font-size: 48rpx;
  font-weight: 900;
}

.summary-panel {
  margin-top: 20rpx;
  padding: 28rpx;
}

.summary-title,
.summary-copy {
  display: block;
}

.summary-title {
  color: var(--gs-blue);
  font-size: 26rpx;
  font-weight: 800;
}

.summary-copy {
  margin-top: 14rpx;
  color: var(--gs-ink);
  font-size: 28rpx;
  line-height: 1.55;
}

.fortune-list {
  margin-top: 28rpx;
}

.fortune-item {
  padding: 24rpx 4rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.fortune-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.fortune-item-title,
.fortune-item-score,
.fortune-item-copy {
  display: block;
}

.fortune-item-title {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 800;
}

.fortune-item-score {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 24rpx;
  font-weight: 900;
}

.fortune-meter {
  height: 10rpx;
  margin-top: 16rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(223, 210, 191, 0.7);
}

.fortune-meter-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gs-gold), var(--gs-blue));
}

.fortune-item-copy {
  margin-top: 14rpx;
  color: var(--gs-muted);
  font-size: 25rpx;
  line-height: 1.5;
}

.lucky-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx 12rpx;
  margin-top: 28rpx;
  padding: 24rpx;
}

.lucky-item {
  min-width: 0;
}

.lucky-label,
.lucky-value,
.caution-label,
.caution-copy,
.insight-label,
.insight-copy,
.birthday-picker-label,
.birthday-picker-value {
  display: block;
}

.lucky-label {
  color: var(--gs-muted);
  font-size: 22rpx;
}

.lucky-value {
  margin-top: 8rpx;
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.25;
}

.caution-panel {
  margin-top: 20rpx;
  padding: 24rpx;
}

.caution-label {
  color: var(--gs-red);
  font-size: 24rpx;
  font-weight: 900;
}

.caution-copy {
  margin-top: 10rpx;
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.55;
}

.insight-panel {
  margin-top: 20rpx;
  padding: 24rpx;
}

.insight-label {
  color: var(--gs-blue);
  font-size: 24rpx;
  font-weight: 900;
}

.insight-copy {
  margin-top: 12rpx;
  padding: 18rpx 20rpx;
  border-left: 4rpx solid var(--gs-gold);
  border-radius: 0 12rpx 12rpx 0;
  color: var(--gs-ink);
  background: rgba(199, 141, 42, 0.08);
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.6;
}

.birthday-picker {
  display: block;
  margin-top: 26rpx;
}

.birthday-picker-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 24rpx 26rpx;
  color: var(--gs-blue);
  text-align: left;
}

.birthday-picker-label {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.birthday-picker-value {
  margin-top: 6rpx;
  color: var(--gs-blue);
  font-size: 27rpx;
  font-weight: 900;
}

.birthday-picker-arrow {
  color: var(--gs-blue);
  font-size: 36rpx;
  line-height: 1;
}

/* Empty zodiac */
.zodiac-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  padding: 48rpx 36rpx;
}

.zodiac-empty-icon {
  font-size: 52rpx;
  color: var(--gs-gold);
}

.zodiac-empty-text {
  color: var(--gs-muted);
  font-size: 26rpx;
}
</style>
