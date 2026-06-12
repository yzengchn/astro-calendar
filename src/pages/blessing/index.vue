<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { lightHaptic, trackEvent } from '@/services/platform'
import { getDayAlmanac } from '@/services/almanac'
import type { DateKey } from '@/types/calendar'
import { getTodayKey } from '@/services/calendar'

type BlessingType = 'health' | 'career' | 'love' | 'family' | 'wealth' | 'study'

interface BlessingTypeConfig {
  id: BlessingType
  label: string
  lampEmoji: string
  flameColor: string
  description: string
}

interface BlessingRecord {
  type: BlessingType
  wish: string
  dateKey: DateKey
  hourName: string
  createdAt: number
  verse: string
  isGoldHour: boolean
}

const BLESSING_TYPES: BlessingTypeConfig[] = [
  { id: 'health', label: '安康', lampEmoji: '🪷', flameColor: '#55745a', description: '祈福安康，无病无忧' },
  { id: 'career', label: '前程', lampEmoji: '🏯', flameColor: '#c78d2a', description: '祈福前程，步步高升' },
  { id: 'love',   label: '良缘', lampEmoji: '🏮', flameColor: '#b84a3f', description: '祈福良缘，喜结连理' },
  { id: 'family', label: '家宅', lampEmoji: '🏠', flameColor: '#315d76', description: '祈福家宅，和睦平安' },
  { id: 'wealth', label: '财运', lampEmoji: '💰', flameColor: '#c78d2a', description: '祈福财运，财源广进' },
  { id: 'study',  label: '学业', lampEmoji: '📖', flameColor: '#786d60', description: '祈福学业，金榜题名' }
]

const BLESSING_VERSES: Record<BlessingType, string[]> = {
  health: ['心诚则灵，身健如松', '百病不侵，四季安康', '养身先养心，心宁体自安', '顺天时调作息，健康自然来'],
  career: ['鹏程万里，大展宏图', '贵人相助，事半功倍', '厚积薄发，终有大成', '稳步前行，功成名就'],
  love:   ['有情人终成眷属', '缘来缘至，喜结良缘', '以诚相待，情路自开', '珍惜眼前人，不负有情人'],
  family: ['家和万事兴', '平安是福，知足常乐', '上慈下孝，家和业兴', '同心同德，幸福长存'],
  wealth: ['财源广进，日进斗金', '勤勉持家，财运亨通', '开源节流，积少成多', '聚沙成塔，厚积薄发'],
  study:  ['金榜题名，学业有成', '勤学苦练，终有所成', '书山有路勤为径', '学海无涯，日日精进']
}

const todayKey = getTodayKey()
const wishText = ref('')
const isLighting = ref(false)
const lightingType = ref<BlessingType | null>(null)
const blessingResult = ref<BlessingRecord | null>(null)
const recentBlessings = ref<BlessingRecord[]>([])
const litTypes = ref<Set<BlessingType>>(new Set())
const currentHourName = ref('')
const isGoldHour = ref(false)

onMounted(() => {
  loadRecentBlessings()
  updateCurrentHour()
  restoreLitTypes()
})

function updateCurrentHour() {
  const almanac = getDayAlmanac(todayKey)
  currentHourName.value = almanac.highlightHour.branch.name
  isGoldHour.value = almanac.highlightHour.level === 'good'
}

function loadRecentBlessings() {
  try {
    const raw = uni.getStorageSync('blessing_records')
    if (raw) {
      const all = JSON.parse(raw) as BlessingRecord[]
      recentBlessings.value = all.slice(-5).reverse()
    }
  } catch {
    recentBlessings.value = []
  }
}

function restoreLitTypes() {
  try {
    const raw = uni.getStorageSync('blessing_records')
    if (!raw) return
    const all = JSON.parse(raw) as BlessingRecord[]
    const today = all.filter(b => b.dateKey === todayKey)
    litTypes.value = new Set(today.map(b => b.type))
  } catch {
    litTypes.value = new Set()
  }
}

const todayBlessingCount = computed(() => litTypes.value.size)
const wishPreview = computed(() => wishText.value.trim() || '一切顺利')
const displayBlessingType = computed(() => {
  if (isLighting.value && lightingType.value) return getBlessingType(lightingType.value)
  if (blessingResult.value) return getBlessingType(blessingResult.value.type)
  return BLESSING_TYPES.find((type) => litTypes.value.has(type.id)) || BLESSING_TYPES[2]
})
const lightingTypeConfig = computed(() => lightingType.value ? getBlessingType(lightingType.value) : null)
const resultTypeConfig = computed(() => blessingResult.value ? getBlessingType(blessingResult.value.type) : null)

function lightLamp(type: BlessingType) {
  if (isLighting.value) return
  blessingResult.value = null
  lightingType.value = type
  isLighting.value = true

  lightHaptic()
  trackEvent('blessing_lamp_light', { type })

  setTimeout(() => {
    finishBlessing(type)
  }, 2800)
}

function finishBlessing(type: BlessingType) {
  const verses = BLESSING_VERSES[type]
  const verse = verses[Math.floor(Math.random() * verses.length)]

  const record: BlessingRecord = {
    type,
    wish: wishText.value.trim() || '一切顺利',
    dateKey: todayKey,
    hourName: currentHourName.value,
    createdAt: Date.now(),
    verse,
    isGoldHour: isGoldHour.value
  }

  blessingResult.value = record
  isLighting.value = false
  lightingType.value = null
  litTypes.value.add(type)
  lightHaptic()

  try {
    const raw = uni.getStorageSync('blessing_records')
    const all: BlessingRecord[] = raw ? JSON.parse(raw) : []
    all.push(record)
    if (all.length > 100) all.splice(0, all.length - 100)
    uni.setStorageSync('blessing_records', JSON.stringify(all))
  } catch {
    // ignore
  }

  loadRecentBlessings()
  trackEvent('blessing_complete', { type: record.type, is_gold_hour: record.isGoldHour })
}

function dismissResult() {
  blessingResult.value = null
  wishText.value = ''
}

function getBlessingType(type: BlessingType): BlessingTypeConfig {
  return BLESSING_TYPES.find((item) => item.id === type) || BLESSING_TYPES[0]
}

function getLampStyle(type: BlessingTypeConfig): Record<string, string> {
  return { '--lamp-color': type.flameColor }
}

function getRecordStyle(record: BlessingRecord): Record<string, string> {
  return { '--lamp-color': getBlessingType(record.type).flameColor }
}
</script>

<template>
  <view class="safe-page blessing-page">
    <view class="blessing-backdrop">
      <text class="sky-mark sky-mark-a">✦</text>
      <text class="sky-mark sky-mark-b">✧</text>
      <text class="sky-mark sky-mark-c">✦</text>
      <view class="temple-shadow"></view>
    </view>

    <view class="blessing-content">
      <view class="blessing-topbar">
        <view class="topbar-title">
          <text class="topbar-title-sub">星运日历</text>
          <text class="topbar-title-main">祈福点灯</text>
        </view>
        <view class="topbar-seal">
          <text>灯</text>
        </view>
      </view>

      <view class="altar-hero" :style="getLampStyle(displayBlessingType)">
        <view class="hero-status-row">
          <view class="hour-chip" :class="{ 'hour-chip-gold': isGoldHour }">
            <text class="hour-chip-dot"></text>
            <text>{{ isGoldHour ? '吉时' : '当前' }} {{ currentHourName }}</text>
          </view>
          <view class="lamp-count">
            <text class="lamp-count-number">{{ todayBlessingCount }}</text>
            <text class="lamp-count-unit">盏</text>
          </view>
        </view>

        <view class="altar-stage">
          <view class="star-track">
            <text>甲</text>
            <text>乙</text>
            <text>丙</text>
            <text>丁</text>
          </view>
          <view
            class="main-lantern"
            :class="{ 'main-lantern-lit': todayBlessingCount > 0 || isLighting }"
          >
            <view class="lantern-glow"></view>
            <view class="lantern-string"></view>
            <view class="lantern-cap"></view>
            <view class="lantern-body">
              <view class="lantern-rib lantern-rib-left"></view>
              <view class="lantern-rib lantern-rib-right"></view>
              <text class="lantern-symbol">{{ displayBlessingType.lampEmoji }}</text>
              <view class="lantern-flame">
                <view class="flame-core"></view>
              </view>
            </view>
            <view class="lantern-tail"></view>
          </view>
          <view class="altar-steps">
            <view class="altar-step altar-step-top"></view>
            <view class="altar-step altar-step-bottom"></view>
          </view>
        </view>

        <view class="hero-copy">
          <text class="hero-kicker">{{ isGoldHour ? '吉时加持' : '日常祈愿' }}</text>
          <text class="hero-title">{{ displayBlessingType.label }}愿灯</text>
          <text class="hero-desc">{{ displayBlessingType.description }}</text>
        </view>
      </view>

      <view class="wish-board">
        <view class="wish-board-head">
          <text class="wish-label">心愿签</text>
          <text class="wish-count">{{ wishText.length }}/50</text>
        </view>
        <input
          v-model="wishText"
          class="wish-input"
          placeholder="一切顺利"
          maxlength="50"
        />
      </view>

      <view class="lamp-section">
        <view class="section-head">
          <text class="section-title">愿灯</text>
          <text class="section-meta">今日 {{ todayBlessingCount }}/6</text>
        </view>
        <view class="lamp-token-grid">
          <view
            v-for="bt in BLESSING_TYPES"
            :key="bt.id"
            class="lamp-token"
            :class="{
              'lamp-token-lit': litTypes.has(bt.id),
              'lamp-token-lighting': isLighting && lightingType === bt.id
            }"
            :style="getLampStyle(bt)"
            role="button"
            @tap="lightLamp(bt.id)"
          >
            <view class="token-lamp">
              <view class="token-flame">
                <view class="flame-core"></view>
              </view>
              <text class="token-emoji">{{ bt.lampEmoji }}</text>
            </view>
            <view class="token-copy">
              <text class="token-label">{{ bt.label }}</text>
              <text class="token-desc">{{ bt.description }}</text>
            </view>
            <text class="token-action">{{ litTypes.has(bt.id) ? '再燃' : '点亮' }}</text>
          </view>
        </view>
      </view>

      <view v-if="recentBlessings.length" class="recent-section">
        <view class="section-head">
          <text class="section-title">祈福灯签</text>
          <text class="section-meta">近 {{ recentBlessings.length }} 条</text>
        </view>
        <view class="recent-scroll">
          <view
            v-for="b in recentBlessings"
            :key="b.createdAt"
            class="wish-slip"
            :style="getRecordStyle(b)"
          >
            <view class="slip-pin"></view>
            <text class="slip-wish">{{ b.wish }}</text>
            <view class="slip-foot">
              <text>{{ b.hourName }} · {{ getBlessingType(b.type).label }}</text>
              <text v-if="b.isGoldHour" class="slip-gold">吉时</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="isLighting && lightingTypeConfig" class="ritual-overlay" :style="getLampStyle(lightingTypeConfig)">
      <view class="ritual-center">
        <view class="ritual-ring">
          <view class="ritual-lamp">
            <text>{{ lightingTypeConfig.lampEmoji }}</text>
            <view class="ritual-flame">
              <view class="flame-core"></view>
            </view>
          </view>
        </view>
        <text class="ritual-title">{{ lightingTypeConfig.label }}愿灯</text>
        <text class="ritual-text">{{ wishPreview }}</text>
        <text class="ritual-hour">{{ currentHourName }} · 灯火已起</text>
      </view>
    </view>

    <view v-if="blessingResult && resultTypeConfig" class="result-overlay" @tap="dismissResult">
      <view class="result-card" :style="getLampStyle(resultTypeConfig)" @tap.stop>
        <view class="result-lamp-mark">
          <text>{{ resultTypeConfig.lampEmoji }}</text>
          <view class="result-flame">
            <view class="flame-core"></view>
          </view>
        </view>
        <text class="result-title">灯火已燃</text>
        <text class="result-verse">{{ blessingResult.verse }}</text>
        <view v-if="blessingResult.wish !== '一切顺利'" class="result-wish">
          <text class="result-wish-label">心愿</text>
          <text class="result-wish-text">{{ blessingResult.wish }}</text>
        </view>
        <view v-if="blessingResult.isGoldHour" class="result-gold">
          <text>吉时点灯</text>
          <text>功效加倍</text>
        </view>
        <view class="result-action" role="button" @tap="dismissResult">继续祈福</view>
      </view>
    </view>

    <CustomTabBar :active="1" />
  </view>
</template>

<style scoped>
/* Ritual redesign */
.blessing-page {
  position: relative;
  min-height: 100vh;
  padding: 0 24rpx 196rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 130rpx, rgba(199, 141, 42, 0.16) 0, rgba(199, 141, 42, 0) 280rpx),
    radial-gradient(circle at 92% 260rpx, rgba(49, 93, 118, 0.12) 0, rgba(49, 93, 118, 0) 260rpx),
    linear-gradient(180deg, rgba(255, 250, 240, 0.94), rgba(247, 241, 231, 0.98)),
    repeating-linear-gradient(90deg, rgba(36, 31, 24, 0.03) 0 1rpx, transparent 1rpx 18rpx);
  color: var(--gs-ink);
}

.blessing-backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.sky-mark {
  position: absolute;
  color: rgba(199, 141, 42, 0.36);
  font-size: 28rpx;
  line-height: 1;
  animation: star-breath 3s ease-in-out infinite;
}

.sky-mark-a {
  top: 132rpx;
  left: 86rpx;
}

.sky-mark-b {
  top: 258rpx;
  right: 124rpx;
  font-size: 36rpx;
  animation-delay: 650ms;
}

.sky-mark-c {
  top: 460rpx;
  left: 630rpx;
  font-size: 22rpx;
  animation-delay: 1.2s;
}

.temple-shadow {
  position: absolute;
  right: -72rpx;
  bottom: 118rpx;
  width: 430rpx;
  height: 230rpx;
  opacity: 0.32;
  background:
    linear-gradient(180deg, transparent 0 52rpx, rgba(67, 47, 25, 0.18) 52rpx 100%),
    repeating-linear-gradient(90deg, rgba(67, 47, 25, 0) 0 34rpx, rgba(67, 47, 25, 0.2) 34rpx 46rpx);
  clip-path: polygon(50% 0, 100% 40%, 88% 40%, 88% 100%, 12% 100%, 12% 40%, 0 40%);
}

.blessing-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.blessing-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 132rpx;
  padding-top: 44rpx;
}

.topbar-title {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.topbar-title-sub {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.topbar-title-main {
  color: var(--gs-ink);
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1;
}

.topbar-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 2rpx solid rgba(199, 141, 42, 0.42);
  border-radius: 12rpx;
  color: var(--gs-red);
  background: rgba(255, 250, 240, 0.86);
  box-shadow: inset 0 0 0 6rpx rgba(199, 141, 42, 0.08), 0 14rpx 34rpx var(--gs-shadow);
  transform: rotate(6deg);
}

.topbar-seal text {
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1;
}

.altar-hero {
  position: relative;
  min-height: 610rpx;
  padding: 26rpx 26rpx 30rpx;
  overflow: hidden;
  border: 1rpx solid rgba(223, 210, 191, 0.96);
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 50% 210rpx, rgba(245, 215, 110, 0.32) 0, rgba(245, 215, 110, 0) 260rpx),
    radial-gradient(circle at 88% 70rpx, rgba(49, 93, 118, 0.1) 0, rgba(49, 93, 118, 0) 220rpx),
    linear-gradient(180deg, rgba(255, 250, 240, 0.96), rgba(239, 224, 200, 0.9));
  box-shadow: 0 22rpx 56rpx var(--gs-shadow), inset 0 0 0 1rpx rgba(255, 255, 255, 0.58);
}

.hero-status-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hour-chip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-height: 54rpx;
  padding: 0 18rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  color: var(--gs-ink);
  background: rgba(255, 250, 240, 0.82);
  font-size: 23rpx;
  font-weight: 800;
}

.hour-chip-gold {
  color: #6f4510;
  border-color: rgba(199, 141, 42, 0.36);
  background: rgba(245, 215, 110, 0.28);
}

.hour-chip-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--lamp-color);
  box-shadow: 0 0 20rpx var(--lamp-color);
}

.lamp-count {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  color: var(--gs-muted);
}

.lamp-count-number {
  color: var(--gs-gold);
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1;
}

.lamp-count-unit {
  font-size: 22rpx;
  font-weight: 800;
}

.altar-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 412rpx;
  margin-top: 8rpx;
}

.star-track {
  position: absolute;
  top: 24rpx;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 460rpx;
  height: 84rpx;
  margin-left: -230rpx;
  padding: 0 26rpx;
  border-top: 1rpx solid rgba(199, 141, 42, 0.2);
  border-bottom: 1rpx solid rgba(49, 93, 118, 0.08);
  color: rgba(120, 109, 96, 0.34);
  font-size: 22rpx;
  font-weight: 800;
}

.main-lantern {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 260rpx;
  transform-origin: 50% 0;
  animation: lantern-sway 4.8s ease-in-out infinite;
}

.lantern-glow {
  position: absolute;
  top: 82rpx;
  left: 50%;
  width: 330rpx;
  height: 330rpx;
  margin-left: -165rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 215, 110, 0.42) 0, rgba(245, 215, 110, 0.18) 42%, rgba(245, 215, 110, 0) 72%);
  opacity: 0.34;
  transform: scale(0.84);
  transition: opacity 220ms ease, transform 220ms ease;
}

.main-lantern-lit .lantern-glow,
.main-lantern-lighting .lantern-glow {
  opacity: 0.76;
  transform: scale(1);
}

.lantern-string {
  width: 2rpx;
  height: 84rpx;
  background: linear-gradient(180deg, rgba(199, 141, 42, 0), rgba(199, 141, 42, 0.58));
}

.lantern-cap {
  position: relative;
  z-index: 2;
  width: 136rpx;
  height: 26rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #f5d76e, #b84a3f);
  box-shadow: 0 8rpx 22rpx rgba(67, 47, 25, 0.18);
}

.lantern-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 202rpx;
  height: 232rpx;
  margin-top: -2rpx;
  overflow: hidden;
  border: 4rpx solid rgba(199, 141, 42, 0.36);
  border-radius: 96rpx 96rpx 82rpx 82rpx;
  background:
    radial-gradient(circle at 50% 45%, rgba(255, 250, 240, 0.72) 0, rgba(245, 215, 110, 0.34) 32%, rgba(184, 74, 63, 0.34) 72%),
    linear-gradient(90deg, rgba(184, 74, 63, 0.72), var(--lamp-color), rgba(199, 141, 42, 0.72));
  box-shadow: inset 0 -28rpx 48rpx rgba(67, 47, 25, 0.18), 0 18rpx 44rpx rgba(67, 47, 25, 0.2);
}

.lantern-rib {
  position: absolute;
  top: -10rpx;
  width: 44rpx;
  height: 254rpx;
  border: 2rpx solid rgba(255, 250, 240, 0.34);
  border-top: 0;
  border-bottom: 0;
  border-radius: 50%;
}

.lantern-rib-left {
  left: 36rpx;
}

.lantern-rib-right {
  right: 36rpx;
}

.lantern-symbol {
  position: relative;
  z-index: 2;
  font-size: 76rpx;
  line-height: 1;
  text-shadow: 0 6rpx 18rpx rgba(67, 47, 25, 0.16);
}

.lantern-flame {
  position: absolute;
  right: 34rpx;
  bottom: 34rpx;
  width: 38rpx;
  height: 50rpx;
}

.lantern-tail {
  position: relative;
  z-index: 2;
  width: 74rpx;
  height: 46rpx;
  border-radius: 0 0 999rpx 999rpx;
  background: linear-gradient(180deg, #b84a3f, #7d362e);
}

.altar-steps {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.altar-step {
  border: 1rpx solid rgba(223, 210, 191, 0.9);
  border-radius: 999rpx;
  background: linear-gradient(180deg, rgba(239, 224, 200, 0.92), rgba(223, 210, 191, 0.86));
}

.altar-step-top {
  width: 420rpx;
  height: 26rpx;
}

.altar-step-bottom {
  width: 560rpx;
  height: 36rpx;
}

.hero-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  margin-top: -8rpx;
  text-align: center;
}

.hero-kicker {
  color: var(--gs-gold);
  font-size: 22rpx;
  font-weight: 800;
}

.hero-title {
  color: var(--gs-ink);
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.1;
}

.hero-desc {
  max-width: 520rpx;
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.5;
}

.wish-board,
.lamp-section,
.recent-section {
  position: relative;
  z-index: 1;
  border: 1rpx solid var(--gs-line);
  border-radius: 24rpx;
  background: rgba(255, 250, 240, 0.86);
  box-shadow: 0 16rpx 40rpx var(--gs-shadow), inset 0 0 0 1rpx rgba(255, 255, 255, 0.52);
}

.wish-board {
  padding: 24rpx;
}

.wish-board-head,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.wish-label,
.section-title {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.2;
}

.wish-count,
.section-meta {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 800;
}

.wish-input {
  width: 100%;
  height: 84rpx;
  min-height: 84rpx;
  padding: 0 24rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 16rpx;
  color: var(--gs-ink);
  background: rgba(247, 241, 231, 0.72);
  font-size: 28rpx;
  font-weight: 800;
}

.lamp-section,
.recent-section {
  padding: 24rpx;
}

.lamp-token-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.lamp-token {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 206rpx;
  padding: 20rpx 18rpx 18rpx;
  overflow: hidden;
  border: 1rpx solid var(--gs-line);
  border-radius: 20rpx;
  background:
    linear-gradient(180deg, rgba(255, 250, 240, 0.94), rgba(247, 241, 231, 0.82));
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.5);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.lamp-token-lit {
  border-color: var(--lamp-color);
  background:
    radial-gradient(circle at 28% 20%, rgba(245, 215, 110, 0.3), rgba(245, 215, 110, 0) 134rpx),
    linear-gradient(180deg, rgba(255, 250, 240, 0.98), rgba(239, 224, 200, 0.88));
}

.lamp-token-lighting {
  transform: translateY(-4rpx);
  border-color: var(--gs-gold);
}

.token-lamp {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid rgba(223, 210, 191, 0.94);
  border-radius: 18rpx;
  background: rgba(255, 250, 240, 0.86);
}

.token-flame {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  width: 24rpx;
  height: 32rpx;
  opacity: 0;
}

.lamp-token-lit .token-flame,
.lamp-token-lighting .token-flame {
  opacity: 1;
}

.token-emoji {
  font-size: 42rpx;
  line-height: 1;
}

.token-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.token-label {
  color: var(--gs-ink);
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.1;
}

.token-desc {
  color: var(--gs-muted);
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.42;
}

.token-action {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  min-width: 66rpx;
  height: 38rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  color: #fffaf0;
  background: var(--gs-blue);
  font-size: 20rpx;
  font-weight: 900;
  line-height: 38rpx;
  text-align: center;
}

.lamp-token-lit .token-action {
  color: #6f4510;
  background: rgba(245, 215, 110, 0.68);
}

.recent-scroll {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.wish-slip {
  position: relative;
  padding: 20rpx 22rpx 18rpx 34rpx;
  overflow: hidden;
  border: 1rpx solid rgba(223, 210, 191, 0.9);
  border-radius: 18rpx;
  background:
    linear-gradient(90deg, rgba(255, 250, 240, 0.92), rgba(247, 241, 231, 0.72)),
    rgba(255, 250, 240, 0.8);
}

.slip-pin {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 10rpx;
  background: var(--lamp-color);
  opacity: 0.82;
}

.slip-wish {
  display: block;
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1.45;
}

.slip-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 12rpx;
  color: var(--gs-muted);
  font-size: 21rpx;
  font-weight: 700;
}

.slip-gold {
  flex: 0 0 auto;
  min-width: 54rpx;
  height: 32rpx;
  padding: 0 12rpx;
  border-radius: 999rpx;
  color: #6f4510;
  background: rgba(245, 215, 110, 0.58);
  font-size: 19rpx;
  font-weight: 900;
  line-height: 32rpx;
  text-align: center;
}

.flame-core {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20rpx;
  height: 32rpx;
  border-radius: 50% 50% 48% 48% / 62% 62% 40% 40%;
  background:
    radial-gradient(circle at 50% 68%, #fff4bd 0 22%, rgba(255, 244, 189, 0) 24%),
    linear-gradient(180deg, #fff0a6 0%, #ffb256 48%, var(--lamp-color) 100%);
  box-shadow: 0 0 24rpx var(--lamp-color), 0 0 44rpx rgba(255, 183, 82, 0.28);
  transform-origin: 50% 100%;
  animation: flame-flicker 880ms ease-in-out infinite alternate;
}

.ritual-overlay,
.result-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 34rpx;
  background:
    radial-gradient(circle at 50% 42%, rgba(245, 215, 110, 0.22) 0, rgba(245, 215, 110, 0) 320rpx),
    rgba(36, 31, 24, 0.56);
  animation: overlay-enter 240ms ease-out;
}

.ritual-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26rpx;
  width: 100%;
  max-width: 620rpx;
  text-align: center;
}

.ritual-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 328rpx;
  height: 328rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.32);
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 250, 240, 0.32) 0, rgba(245, 215, 110, 0.12) 50%, rgba(245, 215, 110, 0) 70%),
    repeating-conic-gradient(from 0deg, rgba(199, 141, 42, 0.2) 0deg 8deg, rgba(199, 141, 42, 0) 8deg 18deg);
  box-shadow: 0 0 90rpx rgba(199, 141, 42, 0.18);
  animation: ritual-spin 7s linear infinite;
}

.ritual-lamp {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 170rpx;
  height: 170rpx;
  border: 2rpx solid rgba(199, 141, 42, 0.34);
  border-radius: 42rpx;
  background: rgba(255, 250, 240, 0.92);
  box-shadow: inset 0 0 0 8rpx rgba(199, 141, 42, 0.08), 0 24rpx 60rpx rgba(67, 47, 25, 0.24);
  animation: ritual-counter-spin 7s linear infinite;
}

.ritual-lamp text {
  font-size: 86rpx;
  line-height: 1;
}

.ritual-flame {
  position: absolute;
  right: 32rpx;
  bottom: 30rpx;
  width: 42rpx;
  height: 58rpx;
}

.ritual-flame .flame-core {
  width: 32rpx;
  height: 50rpx;
}

.ritual-title {
  color: #fffaf0;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.15;
}

.ritual-text {
  max-width: 560rpx;
  color: #f5d76e;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.45;
}

.ritual-hour {
  color: rgba(255, 250, 240, 0.72);
  font-size: 24rpx;
  font-weight: 800;
}

.result-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  width: 624rpx;
  max-width: 92vw;
  padding: 44rpx 38rpx 36rpx;
  overflow: hidden;
  border: 1rpx solid rgba(223, 210, 191, 0.96);
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 50% 0, rgba(245, 215, 110, 0.28), rgba(245, 215, 110, 0) 270rpx),
    linear-gradient(180deg, rgba(255, 250, 240, 0.98), rgba(239, 224, 200, 0.96));
  box-shadow: 0 32rpx 100rpx rgba(67, 47, 25, 0.28);
  text-align: center;
}

.result-lamp-mark {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  border: 1rpx solid rgba(88, 44, 31, 0.14);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.34);
  box-shadow: inset 0 0 0 8rpx rgba(199, 141, 42, 0.08);
}

.result-lamp-mark text {
  font-size: 64rpx;
  line-height: 1;
}

.result-flame {
  position: absolute;
  right: 20rpx;
  bottom: 18rpx;
  width: 30rpx;
  height: 42rpx;
}

.result-title {
  color: #241f18;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.15;
}

.result-verse {
  color: var(--gs-red);
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.5;
}

.result-wish {
  width: 100%;
  padding: 18rpx 20rpx;
  border: 1rpx solid rgba(103, 69, 33, 0.12);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.34);
}

.result-wish-label {
  display: block;
  margin-bottom: 8rpx;
  color: #786d60;
  font-size: 21rpx;
  font-weight: 900;
}

.result-wish-text {
  display: block;
  color: #241f18;
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1.45;
}

.result-gold {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  min-height: 48rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  color: #6f4510;
  background: rgba(199, 141, 42, 0.16);
  font-size: 22rpx;
  font-weight: 900;
}

.result-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 76rpx;
  margin-top: 4rpx;
  border-radius: 16rpx;
  color: #fffaf0;
  background: linear-gradient(90deg, var(--gs-blue), var(--gs-gold));
  font-size: 26rpx;
  font-weight: 900;
}

@keyframes flame-flicker {
  0% {
    transform: scaleX(0.92) scaleY(1.02) rotate(-2deg);
    opacity: 0.86;
  }
  50% {
    transform: scaleX(1.08) scaleY(0.96) rotate(2deg);
    opacity: 1;
  }
  100% {
    transform: scaleX(0.98) scaleY(1.08) rotate(-1deg);
    opacity: 0.92;
  }
}

@keyframes lantern-sway {
  0%, 100% {
    transform: rotate(-1.4deg);
  }
  50% {
    transform: rotate(1.4deg);
  }
}

@keyframes star-breath {
  0%, 100% {
    opacity: 0.38;
    transform: scale(0.88);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes overlay-enter {
  from {
    opacity: 0;
    transform: scale(1.02);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ritual-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ritual-counter-spin {
  to {
    transform: rotate(-360deg);
  }
}
</style>
