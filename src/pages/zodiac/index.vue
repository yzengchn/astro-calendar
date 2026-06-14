<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import ReadingCard from '@/components/cards/ReadingCard.vue'
import type { ReadingLayer } from '@/components/cards/ReadingCard.vue'
import {
  calculateBazi,
  clearBaziInfo,
  getBaziInfo,
  saveBaziInfo,
  getBaziAnalysis,
  getDaYunList,
  getChineseZodiacAnimal,
  getWuXingColor,
  getWuXingModern,
  getDayGanReading,
  getShiShenRole,
  getMingGongReading,
  getDaYunReading,
  CHINESE_ZODIAC_ANIMALS,
  type BaziInfo,
  type BaziAnalysis,
  type DaYunItem
} from '@/services/bazi'
import { lightHaptic, showToast, trackEvent } from '@/services/platform'

type PickerChangeEvent = {
  detail: {
    value: string | number
  }
}

const hasBazi = ref(false)
const baziInfo = ref<BaziInfo | null>(null)
const analysis = ref<BaziAnalysis | null>(null)
const daYunList = ref<DaYunItem[]>([])
const showDaYun = ref(false)

const formDate = ref('')
const formHour = ref(12)
const formGender = ref<'male' | 'female'>('male')

const hours = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}:00` }))

const zodiacAnimal = computed(() => {
  if (!baziInfo.value) return undefined
  return getChineseZodiacAnimal(baziInfo.value.zodiac)
})

// 日主解读
const dayMasterReading = computed(() => {
  if (!baziInfo.value) return null
  return getDayGanReading(baziInfo.value.dayGanZhi)
})

// 五行统计（wuXing 返回如"金火"，需拆字统计）
const wuXingCount = computed(() => {
  if (!analysis.value) return []
  const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
  const pillars = [analysis.value.pillars.year, analysis.value.pillars.month, analysis.value.pillars.day, analysis.value.pillars.hour]
  for (const p of pillars) {
    for (const ch of p.wuXing) {
      if (counts[ch] !== undefined) counts[ch]++
    }
  }
  const max = Math.max(...Object.values(counts), 1)
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    barWidth: Math.round(count / 8 * 100),
    color: getWuXingColor(name),
    ...getWuXingModern(name)
  }))
})

// 主导五行
const dominantWuXing = computed(() => {
  if (!wuXingCount.value.length) return null
  return wuXingCount.value.reduce((a, b) => a.count >= b.count ? a : b)
})

// 十神解读（取月柱十神）
const monthShiShen = computed(() => {
  if (!analysis.value) return []
  const roles = analysis.value.pillars.month.shiShenZhi.map(s => ({
    name: s,
    ...getShiShenRole(s)
  }))
  return roles.slice(0, 3)
})

// 命宫解读
const mingGongReading = computed(() => {
  if (!analysis.value) return ''
  return getMingGongReading(analysis.value.mingGong)
})

const currentDaYun = computed(() => daYunList.value.find(d => d.isCurrent))

// ReadingCard layer compositions
const dayMasterLayers = computed<ReadingLayer[]>(() => {
  if (!dayMasterReading.value) return []
  return [
    { label: '古', text: dayMasterReading.value.trait, type: 'ancient' },
    { label: '今', text: dayMasterReading.value.modern, type: 'modern' },
    { label: '悟', text: dayMasterReading.value.insight, type: 'insight' }
  ]
})
const wuXingLayers = computed<ReadingLayer[]>(() => {
  if (!dominantWuXing.value) return []
  return [
    { label: '今', text: dominantWuXing.value.modern, type: 'modern' },
    { label: '悟', text: dominantWuXing.value.insight, type: 'insight' }
  ]
})
const mingGongLayers = computed<ReadingLayer[]>(() => {
  if (!analysis.value) return []
  return [
    { label: '古', text: `${analysis.value.mingGong}（${analysis.value.mingGongNaYin}）`, type: 'ancient' },
    { label: '今', text: mingGongReading.value, type: 'modern' }
  ]
})
const daYunLayers = computed<ReadingLayer[]>(() => {
  if (!currentDaYun.value) return []
  const reading = getDaYunReading(currentDaYun.value.ganZhi)
  return [
    { label: '今', text: `${reading.phase} · 适合顺势调整人生节奏`, type: 'modern' },
    { label: '悟', text: reading.insight, type: 'insight' }
  ]
})

const pillarKeys = ['year', 'month', 'day', 'hour'] as const
const pillarLabels = ['年柱', '月柱', '日柱', '时柱']

function getPillar(key: typeof pillarKeys[number]) {
  if (!analysis.value) return undefined
  return analysis.value.pillars[key]
}

// 取天干五行（wuXing 为"金火"格式，取首字）
function pillarGanWuXing(key: typeof pillarKeys[number]): string {
  const wx = getPillar(key)?.wuXing || ''
  return wx.charAt(0) || '土'
}

onMounted(() => {
  loadBazi()
  trackEvent('bazi_page_view')
})

function loadBazi() {
  const saved = getBaziInfo()
  if (saved) {
    baziInfo.value = saved
    hasBazi.value = true
    refreshAnalysis()
  }
}

function refreshAnalysis() {
  if (!baziInfo.value) return
  analysis.value = getBaziAnalysis(baziInfo.value)
  daYunList.value = getDaYunList(baziInfo.value).filter(d => d.startAge > 0)
}

function handleSave() {
  if (!formDate.value) {
    showToast('请选择出生日期')
    return
  }
  const bazi = calculateBazi(formDate.value, formHour.value, formGender.value, '')
  saveBaziInfo(bazi)
  baziInfo.value = bazi
  hasBazi.value = true
  refreshAnalysis()
  lightHaptic()
  showToast('推算完成')
  trackEvent('bazi_save', { zodiac: bazi.zodiac })
}

function handleEdit() {
  formDate.value = baziInfo.value?.birthDate || ''
  formHour.value = baziInfo.value?.birthTime || 12
  formGender.value = baziInfo.value?.gender || 'male'
  hasBazi.value = false
}

function handleDelete() {
  uni.showModal({
    title: '提示',
    content: '确定要删除八字信息吗？',
    success: (res) => {
      if (res.confirm) {
        clearBaziInfo()
        baziInfo.value = null
        analysis.value = null
        daYunList.value = []
        hasBazi.value = false
        lightHaptic()
        showToast('已删除')
      }
    }
  })
}

function toggleDaYun() {
  lightHaptic()
  showDaYun.value = !showDaYun.value
}

function handleDateChange(event: PickerChangeEvent) {
  formDate.value = String(event.detail.value)
}

function handleHourChange(event: PickerChangeEvent) {
  const hour = Number(event.detail.value)
  formHour.value = Number.isFinite(hour) ? hour : 12
}
</script>

<template>
  <view class="safe-page bazi-page">
    <view class="topbar">
      <view class="topbar-title">
        <text class="topbar-title-main">八字·生肖</text>
        <text class="topbar-title-sub">观古今之时，悟命理人生</text>
      </view>
    </view>

    <!-- 已有八字 -->
    <view v-if="hasBazi && baziInfo" class="bazi-content">

      <!-- 四柱命盘 -->
      <view class="panel pillar-card">
        <view class="pillar-row">
          <view v-for="key in pillarKeys" :key="key" class="pillar">
            <text class="pillar-label">{{ pillarLabels[pillarKeys.indexOf(key)] }}</text>
            <view class="pillar-gz-row">
              <text class="pillar-gan" :style="{ color: getWuXingColor(pillarGanWuXing(key)) }">{{ getPillar(key)?.ganZhi.slice(0, 1) }}</text>
              <text class="pillar-zhi">{{ getPillar(key)?.ganZhi.slice(1) }}</text>
            </view>
            <view class="pillar-wx-tag" :style="{ background: getWuXingColor(pillarGanWuXing(key)), opacity: 0.12 }"></view>
            <text class="pillar-wx-text" :style="{ color: getWuXingColor(pillarGanWuXing(key)) }">{{ pillarGanWuXing(key) }}</text>
          </view>
        </view>
        <view class="pillar-meta">
          <text class="pillar-meta-item">{{ baziInfo.birthDate }}</text>
          <text class="pillar-meta-item">{{ baziInfo.birthTime }}:00</text>
          <text class="pillar-meta-item">{{ baziInfo.gender === 'male' ? '乾造' : '坤造' }}</text>
        </view>
      </view>

      <!-- 日主性格：古→今→悟 -->
      <ReadingCard
        v-if="dayMasterReading"
        :title="`日主 · ${baziInfo.dayGanZhi.slice(0, 1)}${getWuXingModern(pillarGanWuXing('day')).keyword}`"
        :layers="dayMasterLayers"
      />

      <!-- 五行格局 -->
      <view v-if="dominantWuXing" class="panel wuxing-panel">
        <ReadingCard
          :title="`五行格局 · ${dominantWuXing.name}${dominantWuXing.keyword}`"
          :layers="[]"
        />
        <view class="wuxing-chart">
          <view v-for="wx in wuXingCount" :key="wx.name" class="wuxing-row">
            <text class="wuxing-name" :style="{ color: wx.color }">{{ wx.name }}</text>
            <view class="wuxing-bar-bg">
              <view class="wuxing-bar" :style="{ width: wx.barWidth + '%', background: wx.color }"></view>
            </view>
            <text class="wuxing-count">{{ wx.count }}</text>
          </view>
        </view>
        <ReadingCard
          title=""
          :layers="wuXingLayers"
        />
      </view>

      <!-- 十神角色 -->
      <view v-if="monthShiShen.length" class="panel reading-card">
        <view class="reading-header">
          <text class="reading-title">命局角色</text>
        </view>
        <view class="shishen-list">
          <view v-for="s in monthShiShen" :key="s.name" class="shishen-item">
            <text class="shishen-name">{{ s.name }}</text>
            <text class="shishen-role">{{ s.role }}</text>
            <text class="shishen-advice">{{ s.advice }}</text>
          </view>
        </view>
      </view>

      <!-- 命宫 -->
      <ReadingCard
        v-if="analysis"
        :title="`命宫 · ${analysis.mingGong}`"
        :layers="mingGongLayers"
      />

      <!-- 生肖卡片 -->
      <view v-if="zodiacAnimal" class="panel reading-card">
        <view class="reading-header">
          <text class="reading-title">生肖 · {{ zodiacAnimal.name }}</text>
        </view>
        <view class="animal-row">
          <text class="animal-symbol">{{ zodiacAnimal.symbol }}</text>
          <view class="animal-brief">
            <text class="animal-trait">{{ zodiacAnimal.trait }}</text>
            <text class="animal-desc-compact">{{ zodiacAnimal.description }}</text>
          </view>
        </view>
        <view class="animal-lucky">
          <view class="lucky-item">
            <text class="lucky-label">幸运数</text>
            <text class="lucky-value">{{ zodiacAnimal.luckyNumbers }}</text>
          </view>
          <view class="lucky-item">
            <text class="lucky-label">幸运色</text>
            <text class="lucky-value">{{ zodiacAnimal.luckyColors }}</text>
          </view>
          <view class="lucky-item">
            <text class="lucky-label">幸运花</text>
            <text class="lucky-value">{{ zodiacAnimal.luckyFlowers }}</text>
          </view>
        </view>
      </view>

      <!-- 大运 -->
      <view v-if="daYunList.length" class="section-title">
        <text>大运</text>
        <view class="dayun-toggle" @tap="toggleDaYun">
          <text>{{ showDaYun ? '收起' : '展开' }}</text>
          <text class="dayun-toggle-arrow" :class="{ open: showDaYun }">›</text>
        </view>
      </view>
      <ReadingCard
        v-if="currentDaYun"
        :title="`当前大运 · ${currentDaYun.ganZhi}`"
        :subtitle="`${currentDaYun.startAge}-${currentDaYun.endAge}岁`"
        :layers="daYunLayers"
      />
      <view v-if="showDaYun" class="panel dayun-card">
        <view
          v-for="dy in daYunList"
          :key="dy.startAge"
          class="dayun-row"
          :class="{ current: dy.isCurrent }"
        >
          <text class="dayun-gz" :class="{ 'dayun-gz-current': dy.isCurrent }">{{ dy.ganZhi }}</text>
          <text class="dayun-phase">{{ getDaYunReading(dy.ganZhi).phase }}</text>
          <text class="dayun-age">{{ dy.startAge }}-{{ dy.endAge }}岁</text>
          <text class="dayun-yr">{{ dy.startYear }}-{{ dy.endYear }}</text>
        </view>
      </view>

      <!-- 操作 -->
      <view class="actions">
        <view class="btn btn-secondary" @tap="handleEdit"><text>修改信息</text></view>
        <view class="btn btn-danger" @tap="handleDelete"><text>删除</text></view>
      </view>
    </view>

    <!-- 未设置八字：输入表单 -->
    <view v-else class="bazi-form">
      <view class="panel form-card">
        <view class="form-row">
          <text class="form-row-label">出生日期</text>
          <picker mode="date" :value="formDate" start="1900-01-01" end="2030-12-31" @change="handleDateChange">
            <view class="form-row-value">
              <text v-if="formDate">{{ formDate }}</text>
              <text v-else class="placeholder">请选择</text>
              <text class="form-row-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-row-label">出生时辰</text>
          <picker mode="selector" :range="hours" range-key="label" :value="formHour" @change="handleHourChange">
            <view class="form-row-value">
              <text>{{ formHour }}:00</text>
              <text class="form-row-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-row-label">性别</text>
          <view class="gender-tags">
            <view class="gender-tag" :class="{ active: formGender === 'male' }" @tap="formGender = 'male'">
              <text>♂ 男</text>
            </view>
            <view class="gender-tag" :class="{ active: formGender === 'female' }" @tap="formGender = 'female'">
              <text>♀ 女</text>
            </view>
          </view>
        </view>
      </view>
      <view class="submit-bar">
        <view class="submit-btn" @tap="handleSave"><text>推算八字</text></view>
      </view>
      <view class="section-title">
        <text>十二生肖</text>
      </view>
      <view class="zodiac-grid">
        <view v-for="animal in CHINESE_ZODIAC_ANIMALS" :key="animal.id" class="panel zodiac-cell">
          <text class="zodiac-symbol">{{ animal.symbol }}</text>
          <text class="zodiac-name">{{ animal.name }}</text>
          <text class="zodiac-trait">{{ animal.trait }}</text>
        </view>
      </view>
    </view>

    <CustomTabBar :active="3" />
  </view>
</template>

<style scoped>
.bazi-page {
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

/* ===== Pillar card ===== */
.pillar-card {
  padding: 28rpx 20rpx 24rpx;
}

.pillar-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.pillar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  flex: 1;
  min-width: 0;
  position: relative;
}

.pillar-label {
  color: var(--gs-muted);
  font-size: 18rpx;
  font-weight: 700;
}

.pillar-gz-row {
  display: flex;
  flex-direction: row;
  gap: 2rpx;
}

.pillar-gan {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.1;
}

.pillar-zhi {
  color: var(--gs-ink);
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.1;
}

.pillar-wx-tag {
  position: absolute;
  bottom: 8rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
}

.pillar-wx-text {
  font-size: 16rpx;
  font-weight: 800;
  position: relative;
  z-index: 1;
}

.pillar-meta {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 20rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid var(--gs-line);
}

.pillar-meta-item {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

/* ===== WuXing chart ===== */
.wuxing-panel {
  padding: 0;
}
.wuxing-panel :deep(.reading-card) {
  border: none;
  box-shadow: none;
}
.wuxing-panel :deep(.reading-card:first-child) {
  padding-bottom: 0;
}
.wuxing-panel :deep(.reading-card:last-child) {
  padding-top: 0;
}
.wuxing-panel :deep(.reading-card:last-child .reading-header) {
  display: none;
}
.wuxing-chart {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.wuxing-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
}

.wuxing-name {
  flex: none;
  width: 36rpx;
  font-size: 20rpx;
  font-weight: 800;
}

.wuxing-bar-bg {
  flex: 1;
  height: 16rpx;
  border-radius: 999rpx;
  background: rgba(223, 210, 191, 0.3);
  overflow: hidden;
}

.wuxing-bar {
  height: 16rpx;
  border-radius: 999rpx;
  min-width: 8rpx;
}

.wuxing-count {
  flex: none;
  width: 28rpx;
  color: var(--gs-muted);
  font-size: 18rpx;
  font-weight: 700;
  text-align: right;
}

/* ===== ShiShen list ===== */
.shishen-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.shishen-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.shishen-name {
  flex: none;
  width: 64rpx;
  padding: 4rpx 0;
  border: 1rpx solid var(--gs-blue);
  border-radius: 999rpx;
  color: var(--gs-blue);
  font-size: 20rpx;
  font-weight: 800;
  text-align: center;
}

.shishen-role {
  color: var(--gs-ink);
  font-size: 22rpx;
  font-weight: 700;
}

.shishen-advice {
  flex: 1;
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
  text-align: right;
}

/* ===== Animal ===== */
.animal-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.animal-symbol {
  font-size: 48rpx;
  line-height: 1;
}

.animal-brief {
  flex: 1;
  min-width: 0;
}

.animal-trait {
  display: block;
  color: var(--gs-gold);
  font-size: 24rpx;
  font-weight: 800;
  margin-bottom: 6rpx;
}

.animal-desc-compact {
  display: block;
  color: var(--gs-muted);
  font-size: 22rpx;
  line-height: 1.5;
}

.animal-lucky {
  display: flex;
  flex-direction: row;
  gap: 8rpx;
}

.animal-lucky .lucky-item {
  flex: 1;
  padding: 10rpx 8rpx;
  border-radius: 10rpx;
  background: rgba(49, 93, 118, 0.06);
}

.animal-lucky .lucky-label {
  display: block;
  color: var(--gs-muted);
  font-size: 16rpx;
}

.animal-lucky .lucky-value {
  display: block;
  margin-top: 4rpx;
  color: var(--gs-ink);
  font-size: 20rpx;
  font-weight: 800;
}

/* ===== DaYun ===== */
.dayun-toggle {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
}

.dayun-toggle text:first-child {
  color: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 700;
}

.dayun-toggle-arrow {
  color: var(--gs-blue);
  font-size: 22rpx;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 200ms ease;
}

.dayun-toggle-arrow.open {
  transform: rotate(270deg);
}

.dayun-card {
  padding: 0;
  overflow: hidden;
}

.dayun-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 24rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.dayun-row:last-child {
  border-bottom: none;
}

.dayun-row.current {
  background: rgba(199, 141, 42, 0.06);
}

.dayun-gz {
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 800;
  width: 50rpx;
}

.dayun-gz-current {
  color: var(--gs-gold);
}

.dayun-phase {
  color: var(--gs-ink);
  font-size: 20rpx;
  font-weight: 700;
  width: 80rpx;
}

.dayun-age {
  color: var(--gs-ink);
  font-size: 20rpx;
  font-weight: 700;
  flex: 1;
}

.dayun-yr {
  color: var(--gs-muted);
  font-size: 18rpx;
  font-weight: 700;
}

/* ===== Actions ===== */
.actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 20rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  border: none;
}

.btn text {
  font-size: 22rpx;
  font-weight: 800;
}

.btn-secondary {
  background: rgba(223, 210, 191, 0.4);
}

.btn-secondary text {
  color: var(--gs-ink);
}

.btn-danger {
  background: rgba(184, 74, 63, 0.08);
}

.btn-danger text {
  color: var(--gs-red);
}

/* ===== Form ===== */
.form-card {
  padding: 0;
  overflow: hidden;
}

.form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.form-row:last-child {
  border-bottom: none;
}

.form-row-label {
  color: var(--gs-muted);
  font-size: 26rpx;
  font-weight: 700;
}

.form-row-value {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 700;
}

.form-row-arrow {
  color: var(--gs-muted);
  font-size: 26rpx;
  line-height: 1;
}

.placeholder {
  color: var(--gs-muted);
}

.gender-tags {
  display: flex;
  flex-direction: row;
  gap: 8rpx;
}

.gender-tag {
  padding: 6rpx 20rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  background: transparent;
}

.gender-tag text {
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 700;
}

.gender-tag.active {
  border-color: var(--gs-blue);
  background: rgba(49, 93, 118, 0.08);
}

.gender-tag.active text {
  color: var(--gs-blue);
  font-weight: 800;
}

.submit-bar {
  margin-top: 24rpx;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 22rpx 0;
  border-radius: 16rpx;
  background: var(--gs-blue);
}

.submit-btn text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
}

/* ===== Zodiac grid ===== */
.zodiac-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
}

.zodiac-cell {
  width: calc(25% - 9rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 8rpx;
}

.zodiac-symbol {
  display: block;
  font-size: 36rpx;
  line-height: 1;
}

.zodiac-name {
  display: block;
  margin-top: 6rpx;
  color: var(--gs-ink);
  font-size: 22rpx;
  font-weight: 800;
}

.zodiac-trait {
  display: block;
  margin-top: 4rpx;
  color: var(--gs-gold);
  font-size: 16rpx;
  font-weight: 700;
}
</style>
