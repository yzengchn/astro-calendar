<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import {
  calculateBazi,
  clearBaziInfo,
  getBaziInfo,
  saveBaziInfo,
  getBaziAnalysis,
  getDaYunList,
  getChineseZodiacAnimal,
  CHINESE_ZODIAC_ANIMALS,
  getWuXingColor,
  type BaziInfo,
  type BaziAnalysis,
  type DaYunItem,
  type PillarDetail
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

const pillarKeys = ['year', 'month', 'day', 'hour'] as const
const pillarLabels = ['年柱', '月柱', '日柱', '时柱']

function getPillar(key: typeof pillarKeys[number]): PillarDetail | undefined {
  if (!analysis.value) return undefined
  return analysis.value.pillars[key]
}

function getPillarMeta(key: typeof pillarKeys[number]): { label: string; sub: string } {
  if (!baziInfo.value) return { label: '', sub: '' }
  if (key === 'year') return { label: '年柱', sub: `${baziInfo.value.zodiac}年` }
  if (key === 'day') return { label: '日柱', sub: '日元' }
  if (key === 'month') return { label: '月柱', sub: '' }
  return { label: '时柱', sub: '' }
}

const currentDaYun = computed(() => daYunList.value.find(d => d.isCurrent))

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
        <text class="topbar-title-sub">本命格局与生肖特质</text>
      </view>
    </view>

    <!-- 已有八字：展示命盘 + 生肖 -->
    <view v-if="hasBazi && baziInfo" class="bazi-content">
      <!-- 生肖卡片 -->
      <view v-if="zodiacAnimal" class="panel animal-card">
        <view class="animal-header">
          <text class="animal-symbol">{{ zodiacAnimal.symbol }}</text>
          <view class="animal-info">
            <text class="animal-name">{{ zodiacAnimal.name }}</text>
            <text class="animal-trait">{{ zodiacAnimal.trait }}</text>
          </view>
          <view class="animal-element">
            <text class="animal-element-label">五行</text>
            <text class="animal-element-value" :style="{ color: getWuXingColor(zodiacAnimal.element) }">{{ zodiacAnimal.element }}</text>
          </view>
        </view>
        <text class="animal-desc">{{ zodiacAnimal.description }}</text>
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

      <!-- 八字命盘 -->
      <view class="section-title">
        <text>八字命盘</text>
      </view>
      <view class="panel pillar-card">
        <view class="pillar-row">
          <view v-for="key in pillarKeys" :key="key" class="pillar">
            <text class="pillar-label">{{ getPillarMeta(key).label }}</text>
            <text class="pillar-gan">{{ getPillar(key)?.ganZhi.slice(0, 1) }}</text>
            <text class="pillar-zhi">{{ getPillar(key)?.ganZhi.slice(1) }}</text>
            <view class="pillar-wuxing" :style="{ borderColor: getWuXingColor(getPillar(key)?.wuXing || '') }">
              <text :style="{ color: getWuXingColor(getPillar(key)?.wuXing || '') }">{{ getPillar(key)?.wuXing }}</text>
            </view>
          </view>
        </view>
        <view class="pillar-meta">
          <text class="pillar-meta-item">{{ baziInfo.birthDate }}</text>
          <text class="pillar-meta-item">{{ baziInfo.birthTime }}:00</text>
          <text class="pillar-meta-item">{{ baziInfo.gender === 'male' ? '乾造' : '坤造' }}</text>
        </view>
      </view>

      <!-- 命盘详情 -->
      <view v-if="analysis" class="section-title">
        <text>命盘详解</text>
      </view>
      <view v-if="analysis" class="panel detail-card">
        <!-- 纳音 -->
        <view class="detail-row">
          <text class="detail-label">纳音</text>
          <text class="detail-value">{{ analysis.pillars.year.naYin }} · {{ analysis.pillars.month.naYin }} · {{ analysis.pillars.day.naYin }} · {{ analysis.pillars.hour.naYin }}</text>
        </view>
        <!-- 十神 -->
        <view class="detail-row">
          <text class="detail-label">十神</text>
          <view class="detail-tags">
            <text class="detail-tag" v-for="s in analysis.pillars.month.shiShenZhi" :key="s">{{ s }}</text>
          </view>
        </view>
        <!-- 藏干 -->
        <view class="detail-row">
          <text class="detail-label">日支藏干</text>
          <view class="detail-tags">
            <text class="detail-tag" v-for="g in analysis.pillars.day.hideGan" :key="g">{{ g }}</text>
          </view>
        </view>
        <!-- 命宫 身宫 -->
        <view class="detail-row">
          <text class="detail-label">命宫</text>
          <text class="detail-value">{{ analysis.mingGong }}（{{ analysis.mingGongNaYin }}）</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">身宫</text>
          <text class="detail-value">{{ analysis.shenGong }}（{{ analysis.shenGongNaYin }}）</text>
        </view>
        <!-- 胎元 胎息 -->
        <view class="detail-row">
          <text class="detail-label">胎元</text>
          <text class="detail-value">{{ analysis.taiYuan }}（{{ analysis.taiYuanNaYin }}）</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">胎息</text>
          <text class="detail-value">{{ analysis.taiXi }}（{{ analysis.taiXiNaYin }}）</text>
        </view>
        <!-- 冲煞 -->
        <view class="detail-row">
          <text class="detail-label">冲煞</text>
          <text class="detail-value detail-clash">冲{{ analysis.chongShengXiao }}（{{ analysis.chong }}）煞{{ analysis.sha }}</text>
        </view>
        <!-- 彭祖 -->
        <view class="detail-row">
          <text class="detail-label">彭祖</text>
          <text class="detail-value">{{ analysis.pengZuGan }}；{{ analysis.pengZuZhi }}</text>
        </view>
        <!-- 吉神 -->
        <view v-if="analysis.jiShen.length" class="detail-row">
          <text class="detail-label">吉神</text>
          <view class="detail-tags">
            <text class="detail-tag tag-good" v-for="s in analysis.jiShen.slice(0, 5)" :key="s">{{ s }}</text>
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
      <!-- 当前大运摘要 -->
      <view v-if="currentDaYun && !showDaYun" class="panel dayun-current">
        <view class="dayun-current-row">
          <text class="dayun-current-gz">{{ currentDaYun.ganZhi }}</text>
          <text class="dayun-current-age">{{ currentDaYun.startAge }}-{{ currentDaYun.endAge }}岁</text>
          <text class="dayun-current-yr">{{ currentDaYun.startYear }}-{{ currentDaYun.endYear }}年</text>
        </view>
      </view>
      <!-- 大运列表 -->
      <view v-if="showDaYun" class="panel dayun-card">
        <view
          v-for="dy in daYunList"
          :key="dy.startAge"
          class="dayun-row"
          :class="{ current: dy.isCurrent }"
        >
          <text class="dayun-gz" :class="{ 'dayun-gz-current': dy.isCurrent }">{{ dy.ganZhi }}</text>
          <text class="dayun-age">{{ dy.startAge }}-{{ dy.endAge }}岁</text>
          <text class="dayun-yr">{{ dy.startYear }}-{{ dy.endYear }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <view class="btn btn-secondary" @tap="handleEdit"><text>修改信息</text></view>
        <view class="btn btn-danger" @tap="handleDelete"><text>删除</text></view>
      </view>
    </view>

    <!-- 未设置八字：输入表单 -->
    <view v-else class="bazi-form">
      <view class="panel form-card">
        <!-- 日期行 -->
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

        <!-- 时辰行 -->
        <view class="form-row">
          <text class="form-row-label">出生时辰</text>
          <picker mode="selector" :range="hours" range-key="label" :value="formHour" @change="handleHourChange">
            <view class="form-row-value">
              <text>{{ formHour }}:00</text>
              <text class="form-row-arrow">›</text>
            </view>
          </picker>
        </view>

        <!-- 性别行 -->
        <view class="form-row">
          <text class="form-row-label">性别</text>
          <view class="gender-tags">
            <view
              class="gender-tag"
              :class="{ active: formGender === 'male' }"
              @tap="formGender = 'male'"
            >
              <text>♂ 男</text>
            </view>
            <view
              class="gender-tag"
              :class="{ active: formGender === 'female' }"
              @tap="formGender = 'female'"
            >
              <text>♀ 女</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 推算按钮 -->
      <view class="submit-bar">
        <view class="submit-btn" @tap="handleSave"><text>推算八字</text></view>
      </view>

      <!-- 十二生肖概览 -->
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

/* Animal card */
.animal-card {
  padding: 24rpx;
}

.animal-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.animal-symbol {
  font-size: 60rpx;
  line-height: 1;
}

.animal-info {
  flex: 1;
  min-width: 0;
}

.animal-name {
  display: block;
  color: var(--gs-ink);
  font-size: 32rpx;
  font-weight: 900;
}

.animal-trait {
  display: block;
  margin-top: 4rpx;
  color: var(--gs-gold);
  font-size: 24rpx;
  font-weight: 800;
}

.animal-element {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 16rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.28);
  border-radius: 14rpx;
  background: rgba(245, 215, 110, 0.12);
}

.animal-element-label {
  color: var(--gs-muted);
  font-size: 18rpx;
}

.animal-element-value {
  font-size: 26rpx;
  font-weight: 900;
}

.animal-desc {
  display: block;
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.55;
  margin-bottom: 16rpx;
}

.animal-lucky {
  display: flex;
  flex-direction: row;
  gap: 8rpx;
}

.animal-lucky .lucky-item {
  flex: 1;
  padding: 12rpx 10rpx;
  border-radius: 12rpx;
  background: rgba(49, 93, 118, 0.06);
}

.animal-lucky .lucky-label {
  display: block;
  color: var(--gs-muted);
  font-size: 18rpx;
}

.animal-lucky .lucky-value {
  display: block;
  margin-top: 4rpx;
  color: var(--gs-ink);
  font-size: 22rpx;
  font-weight: 800;
}

/* Pillar card */
.pillar-card {
  padding: 24rpx 16rpx;
}

.pillar-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 4rpx;
}

.pillar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}

.pillar-label {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

.pillar-gan {
  color: var(--gs-ink);
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.1;
}

.pillar-zhi {
  color: var(--gs-ink);
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.1;
}

.pillar-wuxing {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rpx 12rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  margin-top: 4rpx;
}

.pillar-wuxing text {
  font-size: 18rpx;
  font-weight: 800;
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

/* Detail card */
.detail-card {
  padding: 0;
  overflow: hidden;
}

.detail-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 18rpx 24rpx;
  border-bottom: 1rpx solid var(--gs-line);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  flex: none;
  width: 100rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
  padding-top: 2rpx;
}

.detail-value {
  flex: 1;
  color: var(--gs-ink);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.5;
}

.detail-clash {
  color: var(--gs-red);
}

.detail-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8rpx;
}

.detail-tag {
  padding: 4rpx 14rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 999rpx;
  color: var(--gs-ink);
  font-size: 20rpx;
  font-weight: 700;
  background: rgba(49, 93, 118, 0.04);
}

.detail-tag.tag-good {
  border-color: rgba(199, 141, 42, 0.28);
  color: var(--gs-gold);
  background: rgba(199, 141, 42, 0.08);
}

/* DaYun */
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

.dayun-current {
  padding: 18rpx 24rpx;
}

.dayun-current-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.dayun-current-gz {
  color: var(--gs-gold);
  font-size: 32rpx;
  font-weight: 900;
}

.dayun-current-age {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 800;
}

.dayun-current-yr {
  color: var(--gs-muted);
  font-size: 22rpx;
  font-weight: 700;
}

.dayun-card {
  padding: 0;
  overflow: hidden;
}

.dayun-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
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
  font-size: 26rpx;
  font-weight: 800;
  width: 60rpx;
}

.dayun-gz-current {
  color: var(--gs-gold);
}

.dayun-age {
  color: var(--gs-ink);
  font-size: 22rpx;
  font-weight: 700;
  flex: 1;
}

.dayun-yr {
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
}

/* Actions */
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

.btn-primary text {
  color: #fff;
}

.btn-primary {
  background: var(--gs-blue);
}

.btn-secondary text {
  color: var(--gs-ink);
}

.btn-secondary {
  background: rgba(223, 210, 191, 0.4);
}

.btn-danger text {
  color: var(--gs-red);
}

.btn-danger {
  background: rgba(184, 74, 63, 0.08);
}

/* Form */
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

/* Gender tags */
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

/* Submit bar */
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

/* Zodiac grid */
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
