<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { calculateBazi, clearBaziInfo, getBaziInfo, saveBaziInfo, type BaziInfo } from '@/services/bazi'
import { lightHaptic, showToast } from '@/services/platform'

type PickerChangeEvent = {
  detail: {
    value: string | number
  }
}

const hasBazi = ref(false)
const baziInfo = ref<BaziInfo | null>(null)

const formName = ref('')
const formDate = ref('')
const formHour = ref(12)
const formGender = ref<'male' | 'female'>('male')

const hours = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}:00` }))

onMounted(() => {
  loadBazi()
})

function loadBazi() {
  const saved = getBaziInfo()
  if (saved) {
    baziInfo.value = saved
    hasBazi.value = true
  }
}

function handleSave() {
  if (!formName.value.trim()) {
    showToast('请输入姓名')
    return
  }
  if (!formDate.value) {
    showToast('请选择出生日期')
    return
  }

  const bazi = calculateBazi(formDate.value, formHour.value, formGender.value, formName.value)
  saveBaziInfo(bazi)
  baziInfo.value = bazi
  hasBazi.value = true
  lightHaptic()
  showToast('保存成功')
}

function handleEdit() {
  formName.value = baziInfo.value?.name || ''
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
        hasBazi.value = false
        lightHaptic()
        showToast('已删除')
      }
    }
  })
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
  <view class="bazi-page">
    <view class="header">
      <text class="title">个人八字</text>
      <text class="subtitle">根据生辰推算专属运势</text>
    </view>

    <view v-if="hasBazi && baziInfo" class="bazi-display">
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">姓名</text>
          <text class="info-value">{{ baziInfo.name }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">生辰</text>
          <text class="info-value">{{ baziInfo.birthDate }} {{ baziInfo.birthTime }}:00</text>
        </view>
        <view class="info-row">
          <text class="info-label">性别</text>
          <text class="info-value">{{ baziInfo.gender === 'male' ? '男' : '女' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">生肖</text>
          <text class="info-value">{{ baziInfo.zodiac }}</text>
        </view>
      </view>

      <view class="bazi-card">
        <text class="bazi-title">八字命盘</text>
        <view class="bazi-pillars">
          <view class="pillar">
            <text class="pillar-label">年柱</text>
            <text class="pillar-value">{{ baziInfo.yearGanZhi }}</text>
          </view>
          <view class="pillar">
            <text class="pillar-label">月柱</text>
            <text class="pillar-value">{{ baziInfo.monthGanZhi }}</text>
          </view>
          <view class="pillar">
            <text class="pillar-label">日柱</text>
            <text class="pillar-value">{{ baziInfo.dayGanZhi }}</text>
          </view>
          <view class="pillar">
            <text class="pillar-label">时柱</text>
            <text class="pillar-value">{{ baziInfo.hourGanZhi }}</text>
          </view>
        </view>
      </view>

      <view class="actions">
        <button class="btn btn-secondary" @tap="handleEdit">修改</button>
        <button class="btn btn-danger" @tap="handleDelete">删除</button>
      </view>
    </view>

    <view v-else class="bazi-form">
      <view class="form-group">
        <text class="form-label">姓名</text>
        <input class="form-input" v-model="formName" placeholder="请输入姓名" />
      </view>

      <view class="form-group">
        <text class="form-label">出生日期</text>
        <picker mode="date" :value="formDate" @change="handleDateChange">
          <view class="form-picker">
            <text v-if="formDate">{{ formDate }}</text>
            <text v-else class="placeholder">请选择日期</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="form-label">出生时辰</text>
        <picker mode="selector" :range="hours" range-key="label" :value="formHour" @change="handleHourChange">
          <view class="form-picker">
            <text>{{ formHour }}:00</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="form-label">性别</text>
        <view class="gender-group">
          <button
            class="gender-btn"
            :class="{ active: formGender === 'male' }"
            @tap="formGender = 'male'"
          >
            男
          </button>
          <button
            class="gender-btn"
            :class="{ active: formGender === 'female' }"
            @tap="formGender = 'female'"
          >
            女
          </button>
        </view>
      </view>

      <button class="btn btn-primary btn-block" @tap="handleSave">保存八字</button>
    </view>
  </view>
</template>

<style scoped>
.bazi-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.header {
  background: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  display: block;
}

.bazi-display, .bazi-form {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-card, .bazi-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.bazi-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.bazi-pillars {
  display: flex;
  justify-content: space-around;
}

.pillar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.pillar-label {
  font-size: 22rpx;
  color: #999;
}

.pillar-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.actions {
  display: flex;
  gap: 12rpx;
}

.form-group {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.form-input, .form-picker {
  width: 100%;
  padding: 16rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.placeholder {
  color: #999;
}

.gender-group {
  display: flex;
  gap: 12rpx;
}

.gender-btn {
  flex: 1;
  padding: 16rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  background: #fff;
  font-size: 28rpx;
  color: #666;
}

.gender-btn.active {
  border-color: #007aff;
  background: #f0f7ff;
  color: #007aff;
  font-weight: 600;
}

.btn {
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.btn-primary {
  background: #007aff;
  color: #fff;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
  flex: 1;
}

.btn-danger {
  background: #ff3b30;
  color: #fff;
  flex: 1;
}

.btn-block {
  width: 100%;
}
</style>
