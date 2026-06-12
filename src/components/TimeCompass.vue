<script setup lang="ts">
import { computed } from 'vue'
import type { HourAlmanac } from '@/types/almanac'

const props = defineProps<{
  hours: HourAlmanac[]
  selectedId: number
}>()

const emit = defineEmits<{
  select: [hour: HourAlmanac, action: 'tap']
}>()

const BRANCH_COUNT = 12
const BRANCH_RADIUS = 42.5
const positions = Array.from({ length: BRANCH_COUNT }, (_, index) => {
  const angle = ((-90 + index * 30) * Math.PI) / 180
  return {
    x: 50 + Math.cos(angle) * BRANCH_RADIUS,
    y: 50 + Math.sin(angle) * BRANCH_RADIUS
  }
})

const selectedHour = computed(() => props.hours.find((hour) => hour.branch.id === props.selectedId) || props.hours[0])
const selectedIndex = computed(() => Math.max(0, props.hours.findIndex((hour) => hour.branch.id === props.selectedId)))
const selectedRotation = computed(() => selectedIndex.value * 30)
const pointerStyle = computed(() => ({ transform: `rotate(${selectedRotation.value}deg)` }))
const sectorStyle = computed(() => ({ transform: `rotate(${selectedRotation.value}deg)` }))
const centerSuitable = computed(() => selectedHour.value.suitable[0] || '顺势安排')
const centerAvoid = computed(() => selectedHour.value.avoid[0] || '急躁推进')

function levelClass(level: HourAlmanac['level']): string {
  if (level === 'good') return 'compass-good'
  if (level === 'bad') return 'compass-bad'
  return 'compass-neutral'
}

function levelToneClass(level: HourAlmanac['level']): string {
  if (level === 'good') return 'level-good'
  if (level === 'bad') return 'level-bad'
  return 'level-neutral'
}

function getBranchStyle(index: number): { left: string; top: string } {
  const position = positions[index % positions.length]
  return {
    left: `${position.x}%`,
    top: `${position.y}%`
  }
}
</script>

<template>
  <view class="compass-wrap">
    <view class="compass-ring" :class="levelClass(selectedHour.level)">
      <view class="compass-sector" :style="sectorStyle"></view>
      <view class="compass-track compass-track-outer"></view>
      <view class="compass-track compass-track-middle"></view>
      <view class="compass-track compass-track-inner"></view>
      <view class="compass-pointer" :style="pointerStyle"></view>

      <button
        v-for="(hour, index) in hours"
        :key="hour.branch.id"
        class="branch-dot"
        :class="{
          'branch-dot-selected': hour.branch.id === selectedId,
          'branch-dot-current': hour.isCurrent
        }"
        :style="getBranchStyle(index)"
        @tap="emit('select', hour, 'tap')"
      >
        <text class="branch-level" :class="levelToneClass(hour.level)">{{ hour.levelText }}</text>
        <text class="branch-name">{{ hour.branch.name.replace('时', '') }}</text>
        <text class="branch-range">{{ hour.branch.range.split('-')[0] }}</text>
      </button>

      <view class="compass-center">
        <view class="center-head">
          <text class="center-level" :class="levelToneClass(selectedHour.level)">{{ selectedHour.levelText }}</text>
          <view class="center-title">
            <text class="center-name">{{ selectedHour.branch.name }}</text>
            <text class="center-range">{{ selectedHour.branch.range }}</text>
          </view>
        </view>
        <text class="center-star">{{ selectedHour.keyword }} · {{ selectedHour.star }}</text>
        <view class="center-advice">
          <text class="center-advice-line center-advice-good">宜 {{ centerSuitable }}</text>
          <text class="center-advice-line center-advice-bad">忌 {{ centerAvoid }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.compass-wrap {
  display: flex;
  justify-content: center;
  padding: 10rpx 0 6rpx;
}

.compass-ring {
  position: relative;
  width: 626rpx;
  height: 626rpx;
  max-width: 100%;
  box-sizing: border-box;
  border: 2rpx solid rgba(36, 31, 24, 0.16);
  border-radius: 50%;
  background:
    radial-gradient(circle at center, rgba(255, 250, 240, 0.96) 0 25%, rgba(255, 250, 240, 0.54) 26% 48%, transparent 49%),
    repeating-conic-gradient(from -90deg, rgba(36, 31, 24, 0.12) 0 1deg, transparent 1deg 30deg),
    conic-gradient(from -15deg, rgba(199, 141, 42, 0.18), rgba(49, 93, 118, 0.14), rgba(85, 116, 90, 0.16), rgba(184, 74, 63, 0.12), rgba(199, 141, 42, 0.18));
  box-shadow: inset 0 0 0 12rpx rgba(255, 250, 240, 0.5), 0 18rpx 42rpx var(--gs-shadow);
  overflow: visible;
}

.compass-good {
  box-shadow: inset 0 0 0 12rpx rgba(245, 215, 110, 0.2), 0 18rpx 42rpx var(--gs-shadow);
}

.compass-neutral {
  box-shadow: inset 0 0 0 12rpx rgba(240, 230, 211, 0.42), 0 18rpx 42rpx var(--gs-shadow);
}

.compass-bad {
  box-shadow: inset 0 0 0 12rpx rgba(231, 76, 60, 0.08), 0 18rpx 42rpx var(--gs-shadow);
}

.compass-sector {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  bottom: 30rpx;
  left: 30rpx;
  z-index: 0;
  border-radius: 50%;
  background: conic-gradient(from -15deg, rgba(49, 93, 118, 0.2) 0 30deg, transparent 30deg 360deg);
  opacity: 0.9;
  transition: transform 180ms ease;
  pointer-events: none;
}

.compass-track {
  position: absolute;
  z-index: 1;
  border-radius: 50%;
  pointer-events: none;
}

.compass-track-outer {
  top: 42rpx;
  right: 42rpx;
  bottom: 42rpx;
  left: 42rpx;
  border: 1rpx solid rgba(36, 31, 24, 0.12);
}

.compass-track-middle {
  top: 104rpx;
  right: 104rpx;
  bottom: 104rpx;
  left: 104rpx;
  border: 1rpx dashed rgba(36, 31, 24, 0.14);
}

.compass-track-inner {
  top: 128rpx;
  right: 128rpx;
  bottom: 128rpx;
  left: 128rpx;
  border: 1rpx solid rgba(199, 141, 42, 0.26);
}

.compass-pointer {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: 3rpx;
  height: 214rpx;
  margin-left: -1.5rpx;
  margin-top: -214rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, rgba(184, 74, 63, 0.84), rgba(49, 93, 118, 0.16) 58%, rgba(49, 93, 118, 0));
  transform-origin: 50% 100%;
  transition: transform 180ms ease;
  pointer-events: none;
}

.branch-dot {
  position: absolute;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 82rpx;
  height: 66rpx;
  margin-left: -41rpx;
  margin-top: -33rpx;
  padding: 0;
  border: 1rpx solid rgba(36, 31, 24, 0.08);
  border-radius: 22rpx;
  color: var(--gs-muted);
  background: rgba(255, 250, 240, 0.9);
  box-shadow: 0 8rpx 18rpx rgba(36, 31, 24, 0.08);
  line-height: 1;
  overflow: visible;
  transition: transform 160ms ease, background-color 160ms ease, color 160ms ease;
}

.branch-dot::after {
  border: 0;
}

.branch-dot-selected {
  color: #ffffff;
  background: var(--gs-blue);
  border-color: rgba(49, 93, 118, 0.24);
  transform: scale(1.08);
  box-shadow: 0 10rpx 26rpx rgba(49, 93, 118, 0.26);
}

.branch-dot-current {
  border: 2rpx solid var(--gs-gold);
}

.branch-dot-current::before {
  content: "";
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--gs-gold);
}

.branch-level {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  border: 1rpx solid currentColor;
  border-radius: 50%;
  background: rgba(255, 250, 240, 0.96);
  font-size: 18rpx;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 4rpx 10rpx rgba(36, 31, 24, 0.1);
}

.branch-name {
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.1;
}

.branch-range {
  margin-top: 5rpx;
  font-size: 17rpx;
  line-height: 1;
}

.branch-dot-selected .branch-range {
  color: rgba(255, 255, 255, 0.82);
}

.branch-dot-selected .branch-level {
  background: rgba(255, 255, 255, 0.96);
}

.compass-center {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 252rpx;
  min-height: 214rpx;
  padding: 18rpx 18rpx 16rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 24rpx;
  background: rgba(255, 250, 240, 0.96);
  box-shadow: 0 12rpx 28rpx rgba(36, 31, 24, 0.1);
  text-align: center;
  transform: translate(-50%, -50%);
}

.center-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
}

.center-title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.center-level,
.center-name,
.center-range,
.center-star,
.center-advice-line {
  display: block;
}

.center-level {
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1;
}

.level-good {
  color: var(--gs-green);
}

.level-neutral {
  color: var(--gs-gold);
}

.level-bad {
  color: var(--gs-red);
}

.center-name {
  color: var(--gs-ink);
  font-size: 27rpx;
  font-weight: 800;
  line-height: 1.1;
}

.center-range,
.center-star {
  max-width: 100%;
  overflow: hidden;
  color: var(--gs-muted);
  font-size: 19rpx;
  line-height: 1.18;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center-star {
  margin-top: 10rpx;
}

.center-advice {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
  width: 100%;
  margin-top: 10rpx;
  padding-top: 9rpx;
  border-top: 1rpx solid var(--gs-line);
  text-align: left;
}

.center-advice-line {
  overflow: hidden;
  color: var(--gs-ink);
  font-size: 19rpx;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center-advice-good {
  color: var(--gs-green);
}

.center-advice-bad {
  color: var(--gs-red);
}
</style>
