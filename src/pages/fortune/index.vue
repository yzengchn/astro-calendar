<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { getDayAlmanac, getGodKeyword, getGodTrait } from '@/services/almanac'
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
const todayAncient = computed(() => moonPhase.value?.ancient || periodData.value?.ancient || seasonSpecial.value?.data.ancient || '')
const todayModern = computed(() => moonPhase.value?.modern || periodData.value?.modern || seasonSpecial.value?.data.modern || '')

// 时辰
const currentHour = computed(() => dayAlmanac.value.hours.find(h => h.isCurrent))

// 宜忌拆分：古文 vs 现代
const traditionalSuitable = computed(() => dayAlmanac.value.traditionalSuitable.slice(0, 4))
const traditionalAvoid = computed(() => dayAlmanac.value.traditionalAvoid.slice(0, 3))
const modernSuitable = computed(() => dayAlmanac.value.suitable.slice(0, 3))
const modernAvoid = computed(() => dayAlmanac.value.avoid.slice(0, 2))

// 吉神凶神现代解读
const luckyGodsModern = computed(() => dayAlmanac.value.luckyGods.map(g => getGodKeyword(g)).join(' · '))
const unluckyGodsModern = computed(() => dayAlmanac.value.unluckyGods.map(g => getGodKeyword(g)).join(' · '))
const luckyGodsTrait = computed(() => dayAlmanac.value.luckyGods.map(g => getGodTrait(g)).join(' · '))
const unluckyGodsTrait = computed(() => dayAlmanac.value.unluckyGods.map(g => getGodTrait(g)).join(' · '))

// 数九三伏标题
const seasonTitle = computed(() => {
  if (!seasonSpecial.value) return ''
  return seasonSpecial.value.type === 'countNine' ? `数九 · ${(seasonSpecial.value.data as { name: string }).name}` : `三伏 · ${(seasonSpecial.value.data as { period: string }).period}`
})

// Zodiac sections
const birthdayPickerValue = computed(() => birthday.value || '2000-01-01')
const birthdayText = computed(() => (birthday.value ? birthday.value : '用生日自动匹配星座'))
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
        <text class="topbar-title-sub">观古今之时，悟日常之道</text>
      </view>
    </view>

    <!-- 日期信息条 -->
    <view class="date-info-bar">
      <view class="date-info-item">
        <text class="date-info-label">日干支</text>
        <text class="date-info-value">{{ dayAlmanac.sexagenary }}</text>
      </view>
      <view class="date-info-item">
        <text class="date-info-label">农历</text>
        <text class="date-info-value date-info-lunar">{{ dayAlmanac.lunarText }}</text>
      </view>
      <view class="date-info-item">
        <text class="date-info-label">冲煞</text>
        <text class="date-info-value date-info-clash">{{ dayAlmanac.clash }}</text>
      </view>
    </view>

    <!-- 黄历日运：今→悟 -->
    <view class="panel reading-card">
      <view class="reading-header">
        <text class="reading-title">今日 · {{ dayAlmanac.keyword }}</text>
        <text class="reading-sub">{{ dayAlmanac.trait }}</text>
      </view>
      <view class="reading-body">
        <view class="reading-layer">
          <text class="reading-label-modern">今</text>
          <text class="reading-text-modern">{{ dayAlmanac.guide }}</text>
        </view>
        <view v-if="todayInsight" class="reading-layer">
          <text class="reading-label-insight">悟</text>
          <text class="reading-text-insight">{{ todayInsight }}</text>
        </view>
      </view>
    </view>

    <!-- 宜忌：左古右今 -->
    <view class="panel advice-card">
      <view class="advice-section">
        <view class="advice-row">
          <text class="advice-mark advice-good">宜</text>
          <view class="advice-content">
            <text class="advice-ancient">{{ traditionalSuitable.join(' · ') }}</text>
            <view class="advice-arrow">↓ 现代解读 ↓</view>
            <text class="advice-modern">{{ modernSuitable.join(' · ') }}</text>
          </view>
        </view>
        <view class="advice-row">
          <text class="advice-mark advice-bad">忌</text>
          <view class="advice-content">
            <text class="advice-ancient">{{ traditionalAvoid.join(' · ') }}</text>
            <view class="advice-arrow">↓ 现代解读 ↓</view>
            <text class="advice-modern">{{ modernAvoid.join(' · ') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 吉神凶神：左古右今 -->
    <view class="panel god-card">
      <view class="god-row">
        <text class="god-label god-good">吉神</text>
        <view class="god-content">
          <text class="god-ancient">{{ dayAlmanac.luckyGods.join(' · ') }}</text>
          <text class="god-modern">{{ luckyGodsModern }}</text>
          <text class="god-trait">{{ luckyGodsTrait }}</text>
        </view>
      </view>
      <view class="god-row">
        <text class="god-label god-bad">凶神</text>
        <view class="god-content">
          <text class="god-ancient">{{ dayAlmanac.unluckyGods.join(' · ') }}</text>
          <text class="god-modern">{{ unluckyGodsModern }}</text>
          <text class="god-trait">{{ unluckyGodsTrait }}</text>
        </view>
      </view>
    </view>

    <!-- 当前时辰高亮 -->
    <view v-if="currentHour" class="panel current-hour-card">
      <view class="current-hour-head">
        <view class="current-hour-left">
          <text class="current-hour-name">{{ currentHour.branch.name }}</text>
          <text class="current-hour-time">{{ currentHour.branch.range }}</text>
        </view>
        <view class="current-hour-right">
          <text class="current-hour-star">{{ currentHour.star }}</text>
          <text class="current-hour-level" :class="currentHour.level === 'good' ? 'level-good' : currentHour.level === 'bad' ? 'level-bad' : 'level-neutral'">{{ currentHour.levelText }}</text>
        </view>
      </view>
      <view class="current-hour-keyword">
        <text class="current-hour-kw-text">{{ currentHour.keyword }}</text>
        <text class="current-hour-trait-text">{{ currentHour.trait }}</text>
      </view>
      <view class="reading-body">
        <view class="reading-layer">
          <text class="reading-label-modern">今</text>
          <text class="reading-text-modern">{{ currentHour.guide }}</text>
        </view>
      </view>
    </view>

    <!-- 时辰一览 -->
    <view class="section-title">
      <text>时辰吉凶</text>
    </view>
    <view class="hour-tags">
      <view v-for="h in dayAlmanac.hours" :key="h.branch.id" class="hour-tag" :class="h.level === 'good' ? 'hour-tag-good' : h.level === 'bad' ? 'hour-tag-bad' : 'hour-tag-neutral'" @tap="">
        <text class="hour-tag-name">{{ h.branch.name }}</text>
        <text class="hour-tag-star">{{ h.star }}</text>
      </view>
    </view>

    <!-- 七十二候 -->
    <view v-if="periodData" class="panel reading-card">
      <view class="reading-header">
        <text class="reading-title">七十二候 · {{ periodData.name }}</text>
        <text class="reading-sub">{{ periodData.solarTerm }}</text>
      </view>
      <view class="reading-body">
        <view class="reading-layer">
          <text class="reading-label-ancient">古</text>
          <text class="reading-text-ancient">{{ periodData.ancient }}</text>
        </view>
        <view class="reading-layer">
          <text class="reading-label-modern">今</text>
          <text class="reading-text-modern">{{ periodData.modern }}</text>
        </view>
        <view class="reading-layer">
          <text class="reading-label-insight">悟</text>
          <text class="reading-text-insight">{{ periodData.insight }}</text>
        </view>
      </view>
    </view>

    <!-- 月相禅意 -->
    <view v-if="moonPhase" class="panel reading-card">
      <view class="reading-header">
        <text class="reading-title">月相 · {{ moonPhase.phaseEmoji }} {{ moonPhase.phaseName }}</text>
        <text class="reading-sub">亮度 {{ moonPhase.illumination }}%</text>
      </view>
      <view class="reading-body">
        <view class="reading-layer">
          <text class="reading-label-ancient">古</text>
          <text class="reading-text-ancient">{{ todayAncient }}</text>
        </view>
        <view class="reading-layer">
          <text class="reading-label-modern">今</text>
          <text class="reading-text-modern">{{ todayModern }}</text>
        </view>
        <view class="reading-layer">
          <text class="reading-label-insight">悟</text>
          <text class="reading-text-insight">{{ todayInsight }}</text>
        </view>
      </view>
      <!-- 月相宜忌 -->
      <view class="moon-suitable">
        <view class="moon-suit-row">
          <text class="moon-suit-label">适宜</text>
          <text class="moon-suit-text moon-suit-good">{{ moonPhase.suitable.join(' · ') }}</text>
        </view>
        <view class="moon-suit-row">
          <text class="moon-suit-label">避免</text>
          <text class="moon-suit-text moon-suit-bad">{{ moonPhase.avoid.join(' · ') }}</text>
        </view>
      </view>
    </view>

    <!-- 数九三伏 -->
    <view v-if="seasonSpecial" class="panel reading-card">
      <view class="reading-header">
        <text class="reading-title">{{ seasonTitle }}</text>
      </view>
      <view class="reading-body">
        <view class="reading-layer">
          <text class="reading-label-ancient">古</text>
          <text class="reading-text-ancient">{{ seasonSpecial.data.ancient }}</text>
        </view>
        <view class="reading-layer">
          <text class="reading-label-modern">今</text>
          <text class="reading-text-modern">{{ seasonSpecial.data.modern }}</text>
        </view>
        <view class="reading-layer">
          <text class="reading-label-insight">悟</text>
          <text class="reading-text-insight">{{ seasonSpecial.data.insight }}</text>
        </view>
      </view>
    </view>

    <!-- 彭祖百忌 -->
    <view class="panel pengzu-card">
      <view class="reading-header">
        <text class="reading-title">彭祖百忌</text>
      </view>
      <view class="pengzu-body">
        <text class="pengzu-text">{{ dayAlmanac.pengzu }}</text>
      </view>
    </view>

    <!-- 星座运势分割线 -->
    <view class="section-title section-divider">
      <text>{{ selectedSign ? selectedSign.name + '运势' : '星座运势' }}</text>
      <view v-if="selectedSign && !isChoosing" class="switch-sign-btn" @tap="toggleChooser">
        <text>切换</text>
      </view>
    </view>

    <!-- 星座选择器 -->
    <view v-if="isChoosing" class="zodiac-choose">
      <picker
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

      <view class="sign-grid">
        <view v-for="sign in ZODIAC_SIGNS" :key="sign.id" class="panel sign-cell" @tap="selectZodiac(sign.id)">
          <text class="sign-symbol">{{ sign.symbol }}</text>
          <text class="sign-name">{{ sign.name.replace('座', '') }}</text>
          <text class="sign-range">{{ sign.range }}</text>
        </view>
      </view>
    </view>

    <!-- 星座运势展示 -->
    <view v-else-if="fortune" class="fortune-wrap">
      <view class="fortune-hero">
        <view class="fortune-symbol-wrap">
          <text class="fortune-symbol">{{ fortune.sign.symbol }}</text>
        </view>
        <text class="fortune-name">{{ fortune.sign.name }}</text>
        <text class="fortune-range">{{ fortune.sign.range }}</text>
        <view class="keyword-chip">
          <text>{{ fortune.keyword }}</text>
        </view>
      </view>

      <view class="fortune-meta">
        <text class="cache-pill" :class="cacheStatusClass">{{ isLoading ? '更新中...' : cacheStatusText }}</text>
        <view class="refresh-btn" @tap="refreshFortune"><text>刷新</text></view>
      </view>

      <view v-if="errorText" class="error-banner">
        <text>{{ errorText }}</text>
      </view>

      <!-- 综合运势 -->
      <view class="panel score-card">
        <view class="score-left">
          <text class="score-label">综合运势</text>
          <text class="score-stars">{{ fortune.stars }}</text>
        </view>
        <text class="score-number">{{ fortune.score }}%</text>
      </view>

      <!-- 今日核心提示：今→忌 -->
      <view class="panel reading-card">
        <view class="reading-header">
          <text class="reading-title">今日提示</text>
        </view>
        <view class="reading-body">
          <view class="reading-layer">
            <text class="reading-label-modern">今</text>
            <text class="reading-text-modern">{{ fortune.summary }}</text>
          </view>
          <view v-if="fortune.caution" class="reading-layer">
            <text class="reading-label-ancient">忌</text>
            <text class="reading-text-ancient">{{ fortune.caution }}</text>
          </view>
        </view>
      </view>

      <!-- 五项运势 -->
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

      <!-- 幸运信息 -->
      <view class="panel lucky-card">
        <view v-for="item in luckyItems" :key="item.label" class="lucky-item">
          <text class="lucky-label">{{ item.label }}</text>
          <text class="lucky-value">{{ item.value }}</text>
        </view>
      </view>

      <picker
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

/* ===== Date info bar ===== */
.date-info-bar {
  display: flex;
  flex-direction: row;
  gap: 0;
  margin-bottom: 20rpx;
  padding: 0 4rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.date-info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 16rpx 0;
  border-right: 1rpx solid var(--gs-line);
}

.date-info-item:last-child {
  border-right: none;
}

.date-info-label {
  color: var(--gs-muted);
  font-size: 18rpx;
  font-weight: 700;
}

.date-info-value {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 900;
}

.date-info-lunar {
  font-size: 20rpx;
  text-align: center;
  line-height: 1.3;
}

.date-info-clash {
  color: var(--gs-red);
  font-size: 20rpx;
}

/* ===== Reading card (古→今→悟) ===== */
.reading-card {
  padding: 24rpx;
}

.reading-header {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.reading-title {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 900;
}

.reading-sub {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.reading-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reading-layer {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12rpx;
}

.reading-label-ancient {
  flex: none;
  width: 40rpx;
  padding: 2rpx 0;
  color: var(--gs-muted);
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
  border-bottom: 2rpx solid var(--gs-line);
}

.reading-label-modern {
  flex: none;
  width: 40rpx;
  padding: 2rpx 0;
  color: var(--gs-blue);
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
  border-bottom: 2rpx solid var(--gs-blue);
}

.reading-label-insight {
  flex: none;
  width: 40rpx;
  padding: 2rpx 0;
  color: var(--gs-gold);
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
  border-bottom: 2rpx solid var(--gs-gold);
}

.reading-text-ancient {
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.5;
}

.reading-text-modern {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.5;
}

.reading-text-insight {
  color: var(--gs-gold);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.5;
}

/* ===== Advice card (左古右今) ===== */
.advice-card {
  padding: 24rpx;
}

.advice-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.advice-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14rpx;
}

.advice-mark {
  flex: none;
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

.advice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.advice-ancient {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.4;
}

.advice-arrow {
  color: var(--gs-line);
  font-size: 18rpx;
  font-weight: 700;
}

.advice-modern {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}

/* ===== God card (吉神凶神) ===== */
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

/* ===== Current hour card ===== */
.current-hour-card {
  padding: 24rpx;
  border-left: 6rpx solid var(--gs-gold);
}

.current-hour-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.current-hour-left {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 12rpx;
}

.current-hour-name {
  color: var(--gs-ink);
  font-size: 36rpx;
  font-weight: 900;
}

.current-hour-time {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.current-hour-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
}

.current-hour-star {
  color: var(--gs-gold);
  font-size: 22rpx;
  font-weight: 800;
}

.current-hour-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40rpx;
  height: 36rpx;
  padding: 0 12rpx;
  border-radius: 8rpx;
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
}

.level-good {
  background: var(--gs-green);
}

.level-bad {
  background: var(--gs-red);
}

.level-neutral {
  background: var(--gs-muted);
}

.current-hour-keyword {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
  padding: 10rpx 16rpx;
  border-radius: 10rpx;
  background: rgba(199, 141, 42, 0.08);
}

.current-hour-kw-text {
  color: var(--gs-gold);
  font-size: 24rpx;
  font-weight: 900;
}

.current-hour-trait-text {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

/* ===== Hour tags ===== */
.hour-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.hour-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 76rpx;
  padding: 8rpx 10rpx;
  border-radius: 12rpx;
  gap: 2rpx;
}

.hour-tag-name {
  font-size: 22rpx;
  font-weight: 800;
}

.hour-tag-star {
  font-size: 14rpx;
  font-weight: 700;
  opacity: 0.72;
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

.hour-tag-neutral {
  color: var(--gs-muted);
  background: rgba(120, 109, 96, 0.08);
  border: 1rpx solid var(--gs-line);
}

/* ===== Moon suitable ===== */
.moon-suitable {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid var(--gs-line);
}

.moon-suit-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12rpx;
}

.moon-suit-label {
  flex: none;
  width: 56rpx;
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

.moon-suit-text {
  flex: 1;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.4;
}

.moon-suit-good {
  color: var(--gs-green);
}

.moon-suit-bad {
  color: var(--gs-red);
}

/* ===== Pengzu card ===== */
.pengzu-card {
  padding: 24rpx;
}

.pengzu-body {
  padding: 14rpx 16rpx;
  border-radius: 10rpx;
  background: rgba(120, 109, 96, 0.06);
}

.pengzu-text {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.6;
}

/* Section divider */
.section-divider {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.switch-sign-btn {
  padding: 6rpx 20rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  background: transparent;
}

.switch-sign-btn text {
  color: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 700;
}

/* Zodiac choose */
.zodiac-choose {
  margin-bottom: 24rpx;
}

.sign-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.sign-cell {
  width: calc(25% - 9rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 8rpx;
}

.sign-symbol {
  display: block;
  color: var(--gs-gold);
  font-size: 40rpx;
  line-height: 1;
}

.sign-name {
  display: block;
  margin-top: 8rpx;
  color: var(--gs-ink);
  font-size: 22rpx;
  font-weight: 800;
}

.sign-range {
  display: block;
  margin-top: 4rpx;
  color: var(--gs-muted);
  font-size: 16rpx;
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
  padding: 16rpx 0 24rpx;
}

.fortune-symbol-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.28);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 38%, rgba(255, 250, 240, 0.95), rgba(245, 222, 182, 0.54)),
    linear-gradient(180deg, rgba(199, 141, 42, 0.16), rgba(49, 93, 118, 0.06));
}

.fortune-symbol {
  color: var(--gs-gold);
  font-size: 68rpx;
  line-height: 1;
}

.fortune-name {
  display: block;
  margin-top: 12rpx;
  color: var(--gs-ink);
  font-size: 36rpx;
  font-weight: 900;
}

.fortune-range {
  display: block;
  margin-top: 6rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
}

.keyword-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 44rpx;
  margin-top: 14rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.28);
  border-radius: 999rpx;
  color: #6f4510;
  background: rgba(245, 215, 110, 0.24);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 44rpx;
}

.fortune-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 16rpx;
}

.cache-pill {
  display: inline-flex;
  align-items: center;
  min-height: 44rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  line-height: 44rpx;
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

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44rpx;
  padding: 0 18rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  background: transparent;
}

.refresh-btn text {
  color: var(--gs-blue);
  font-size: 20rpx;
  font-weight: 700;
}

.error-banner {
  margin-bottom: 16rpx;
  padding: 16rpx 20rpx;
  border: 1rpx solid rgba(184, 74, 63, 0.18);
  border-radius: 14rpx;
  color: #8f2e28;
  background: rgba(184, 74, 63, 0.08);
  font-size: 22rpx;
  line-height: 1.45;
}

.score-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
}

.score-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.score-label {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.score-stars {
  color: var(--gs-gold);
  font-size: 32rpx;
}

.score-number {
  color: var(--gs-blue);
  font-size: 44rpx;
  font-weight: 900;
}

.fortune-list {
  margin-top: 20rpx;
}

.fortune-item {
  padding: 20rpx 4rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.fortune-item-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.fortune-item-title {
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 800;
}

.fortune-item-score {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 900;
}

.fortune-meter {
  height: 8rpx;
  margin-top: 12rpx;
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
  display: block;
  margin-top: 10rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
  line-height: 1.5;
}

.lucky-card {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx 12rpx;
  margin-top: 20rpx;
  padding: 20rpx;
}

.lucky-item {
  width: calc(50% - 6rpx);
  min-width: 0;
}

.lucky-label {
  display: block;
  color: var(--gs-muted);
  font-size: 20rpx;
}

.lucky-value {
  display: block;
  margin-top: 6rpx;
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 900;
  line-height: 1.25;
}

.birthday-picker-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 22rpx 24rpx;
  color: var(--gs-blue);
  text-align: left;
}

.birthday-picker-label {
  display: block;
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.birthday-picker-value {
  display: block;
  margin-top: 4rpx;
  color: var(--gs-blue);
  font-size: 26rpx;
  font-weight: 900;
}

.birthday-picker-arrow {
  color: var(--gs-blue);
  font-size: 32rpx;
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
