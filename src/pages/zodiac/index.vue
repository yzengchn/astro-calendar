<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { ZodiacFortuneCache, ZodiacFortuneResult, ZodiacId } from '@/types/zodiac'
import type { DateKey } from '@/types/calendar'
import { getTodayKey, isDateKey } from '@/services/calendar'
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

const dateKey = ref<DateKey>(getTodayKey())
const todayDateValue = getTodayKey()
const selectedZodiacId = ref<string | null>(getStorage('user_zodiac_sign', null))
const birthday = ref(getStorage('user_birthday', ''))
const isChoosing = ref(!selectedZodiacId.value)
const isOffline = ref(false)
const isLoading = ref(false)
const errorText = ref('')
const fortuneState = ref<ZodiacFortuneResult | null>(null)

const selectedSign = computed(() => getZodiacById(selectedZodiacId.value))
const fortune = computed(() => fortuneState.value?.fortune || null)
const pageTitle = computed(() => (selectedSign.value ? `${selectedSign.value.name}运势` : '选择你的星座'))
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

onLoad((query) => {
  if (query?.date && typeof query.date === 'string' && isDateKey(query.date)) {
    dateKey.value = query.date
  }
  if (selectedZodiacId.value) {
    void loadFortune()
    trackEvent('zodiac_page_view', {
      zodiac_sign: selectedZodiacId.value
    })
  }
})

function goBack(): void {
  uni.navigateBack()
}

function selectZodiac(id: ZodiacId): void {
  selectedZodiacId.value = id
  isChoosing.value = false
  setStorage('user_zodiac_sign', id)
  setStorage('zodiac_last_view_date', dateKey.value)
  void loadFortune({ forceRefresh: true })
  trackEvent('zodiac_sign_select', {
    selected_zodiac: id
  })
  trackEvent('zodiac_page_view', {
    zodiac_sign: id
  })
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
          console.warn('[zodiac:fetch]', error)
        }
      }
    }

    const localState = resolveZodiacFortune(selectedZodiacId.value, dateKey.value, cache, {
      preferCache: true
    })
    const state: ZodiacFortuneResult =
      localState.source === 'fresh'
        ? {
            ...localState,
            source: 'fallback'
          }
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
  trackEvent('zodiac_birthday_set', {
    zodiac_sign: sign.id
  })
}
</script>

<template>
  <view class="safe-page zodiac-page">
    <view class="topbar">
      <button class="icon-button" aria-label="返回" @tap="goBack">‹</button>
      <view class="zodiac-nav-title">
        <text>{{ pageTitle }}</text>
      </view>
      <button class="icon-button" aria-label="切换星座" @tap="toggleChooser">☉</button>
    </view>

    <view v-if="isChoosing" class="sign-grid">
      <picker
        class="birthday-picker sign-picker"
        mode="date"
        :value="birthdayPickerValue"
        start="1900-01-01"
        :end="todayDateValue"
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

      <picker
        class="birthday-picker"
        mode="date"
        :value="birthdayPickerValue"
        start="1900-01-01"
        :end="todayDateValue"
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

    <view v-else class="panel loading-panel">
      <text class="loading-title">{{ isLoading ? '正在加载运势' : '暂未获取运势' }}</text>
      <text v-if="errorText" class="loading-copy">{{ errorText }}</text>
    </view>
  </view>
</template>

<style scoped>
.zodiac-page {
  padding-bottom: 64rpx;
}

.zodiac-nav-title {
  flex: 1;
  padding: 0 18rpx;
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
}

.sign-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  padding-top: 18rpx;
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
.birthday-picker-label,
.birthday-picker-value,
.loading-title,
.loading-copy {
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

.loading-panel {
  margin-top: 22rpx;
  padding: 34rpx 28rpx;
}

.loading-title {
  color: var(--gs-ink);
  font-size: 30rpx;
  font-weight: 900;
}

.loading-copy {
  margin-top: 12rpx;
  color: var(--gs-muted);
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
