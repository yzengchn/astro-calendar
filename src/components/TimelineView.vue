<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import type { HourAlmanac } from '@/types/almanac'

const props = defineProps<{
  hours: HourAlmanac[]
  selectedId: number
}>()

const emit = defineEmits<{
  select: [hour: HourAlmanac, action: 'tap']
}>()

const instance = getCurrentInstance()
const timelineScrollTop = ref(0)
const currentScrollTop = ref(0)

let centerRequestId = 0

watch(
  () => [props.selectedId, props.hours.map((hour) => hour.branch.id).join(',')],
  () => {
    void centerSelectedHour()
  },
  { immediate: true, flush: 'post' }
)

onMounted(() => {
  void centerSelectedHour()
})

function levelClass(level: HourAlmanac['level']): string {
  if (level === 'good') return 'tag-good'
  if (level === 'bad') return 'tag-bad'
  return 'tag-neutral'
}

function handleScroll(event: { detail?: { scrollTop?: number } }): void {
  currentScrollTop.value = Number(event.detail?.scrollTop || 0)
}

async function centerSelectedHour(): Promise<void> {
  const requestId = ++centerRequestId
  const targetId = props.hours.some((hour) => hour.branch.id === props.selectedId)
    ? props.selectedId
    : props.hours.find((hour) => hour.isCurrent)?.branch.id

  if (typeof targetId !== 'number' || !instance?.proxy) return

  await nextTick()
  if (requestId !== centerRequestId) return

  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select('.timeline').boundingClientRect()
  query.select(`#timeline-hour-${targetId}`).boundingClientRect()
  query.exec((rects) => {
    const container = rects?.[0]
    const target = rects?.[1]

    if (!container || !target || typeof container.top !== 'number' || typeof target.top !== 'number') return
    if (typeof container.height !== 'number' || typeof target.height !== 'number') return

    const offsetTop = target.top - container.top
    const centeredTop = currentScrollTop.value + offsetTop - (container.height - target.height) / 2
    timelineScrollTop.value = Math.max(0, Math.round(centeredTop))
  })
}
</script>

<template>
  <scroll-view
    class="timeline"
    scroll-y
    scroll-with-animation
    :scroll-top="timelineScrollTop"
    @scroll="handleScroll"
  >
    <view class="timeline-list">
      <button
        v-for="hour in hours"
        :id="`timeline-hour-${hour.branch.id}`"
        :key="hour.branch.id"
        class="timeline-row"
        :class="{ 'timeline-row-selected': hour.branch.id === selectedId, 'timeline-row-current': hour.isCurrent }"
        @tap="emit('select', hour, 'tap')"
      >
        <view class="node-line">
          <view class="node" />
        </view>
        <view class="timeline-content">
          <view class="timeline-info">
            <text class="timeline-title">{{ hour.branch.name }} {{ hour.branch.range }}</text>
            <view class="timeline-advice-row">
              <view class="timeline-mark timeline-mark-good">宜</view>
              <text class="timeline-text">{{ hour.traditionalSuitable.join('·') }}</text>
            </view>
            <view class="timeline-advice-row">
              <view class="timeline-mark timeline-mark-bad">忌</view>
              <text class="timeline-text">{{ hour.traditionalAvoid.join('·') }}</text>
            </view>
            <text class="timeline-star">星宿：{{ hour.star }} · {{ hour.keyword }}</text>
            <text class="timeline-guide" :class="`timeline-guide-${hour.level}`">{{ hour.guide }}</text>
          </view>
          <text class="tag" :class="levelClass(hour.level)">{{ hour.levelText }}</text>
        </view>
      </button>
    </view>
  </scroll-view>
</template>

<style scoped>
.timeline {
  max-height: 760rpx;
}

.timeline-list {
  padding: 4rpx 0;
}

.timeline-row {
  display: flex;
  width: 100%;
  min-height: 112rpx;
  padding: 0;
  color: var(--gs-ink);
  text-align: left;
}

.timeline-row-selected .timeline-content {
  border-color: rgba(199, 141, 42, 0.54);
  background: rgba(255, 248, 225, 0.8);
}

.timeline-row-current .node {
  background: var(--gs-gold);
  box-shadow: 0 0 0 8rpx rgba(199, 141, 42, 0.16);
}

.node-line {
  position: relative;
  flex: 0 0 38rpx;
  display: flex;
  justify-content: center;
}

.node-line::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2rpx;
  background: var(--gs-line);
}

.node {
  position: relative;
  z-index: 1;
  width: 14rpx;
  height: 14rpx;
  margin-top: 44rpx;
  border-radius: 50%;
  background: #d7c8b2;
}

.timeline-content {
  position: relative;
  flex: 1;
  margin-bottom: 14rpx;
  padding: 20rpx;
  border: 1rpx solid transparent;
  border-radius: 14rpx;
  background: rgba(255, 250, 240, 0.72);
}

.timeline-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.timeline-title {
  font-size: 28rpx;
  font-weight: 800;
  line-height: 40rpx;
}

.timeline-advice-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-height: 40rpx;
}

.timeline-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  font-size: 20rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.timeline-mark-good {
  color: #fff;
  background: var(--gs-green);
}

.timeline-mark-bad {
  color: #fff;
  background: var(--gs-red);
}

.timeline-text {
  font-size: 22rpx;
  color: var(--gs-ink);
  line-height: 40rpx;
}

.timeline-star {
  color: var(--gs-blue);
  font-size: 22rpx;
  line-height: 40rpx;
}

.timeline-modern {
  color: var(--gs-muted);
  font-size: 23rpx;
  line-height: 40rpx;
}

.timeline-guide {
  font-size: 24rpx;
  line-height: 40rpx;
}

.timeline-guide-good {
  color: var(--gs-green);
}

.timeline-guide-neutral {
  color: var(--gs-muted);
}

.timeline-guide-bad {
  color: var(--gs-red);
}

.timeline-expand {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid var(--gs-line);
  color: #725019;
  font-size: 24rpx;
  line-height: 1.45;
}

.tag {
  position: absolute;
  top: 50%;
  right: 20rpx;
  transform: translateY(-50%);
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 600;
}

.tag-good {
  color: var(--gs-green);
  background: rgba(52, 168, 83, 0.08);
}

.tag-bad {
  color: var(--gs-red);
  background: rgba(234, 67, 53, 0.08);
}

.tag-neutral {
  color: var(--gs-muted);
  background: rgba(0, 0, 0, 0.04);
}
</style>
