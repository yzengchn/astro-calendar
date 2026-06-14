<script setup lang="ts">
export interface ReadingLayer {
  label: string
  text: string
  type: 'ancient' | 'modern' | 'insight' | 'caution'
}

defineProps<{
  title: string
  subtitle?: string
  layers: ReadingLayer[]
}>()
</script>

<template>
  <view class="panel reading-card">
    <view class="reading-header">
      <text class="reading-title">{{ title }}</text>
      <text v-if="subtitle" class="reading-sub">{{ subtitle }}</text>
    </view>
    <view class="reading-body">
      <view v-for="(layer, i) in layers" :key="i" class="reading-layer">
        <text class="reading-label" :class="`reading-label-${layer.type}`">{{ layer.label }}</text>
        <text class="reading-text" :class="`reading-text-${layer.type}`">{{ layer.text }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
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

.reading-label {
  flex: none;
  width: 40rpx;
  padding: 2rpx 0;
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
}

.reading-label-ancient {
  color: var(--gs-muted);
  border-bottom: 2rpx solid var(--gs-line);
}

.reading-label-modern {
  color: var(--gs-blue);
  border-bottom: 2rpx solid var(--gs-blue);
}

.reading-label-insight {
  color: var(--gs-gold);
  border-bottom: 2rpx solid var(--gs-gold);
}

.reading-label-caution {
  color: var(--gs-red);
  border-bottom: 2rpx solid var(--gs-red);
}

.reading-text {
  font-weight: 700;
  line-height: 1.5;
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

.reading-text-caution {
  color: var(--gs-red);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.5;
}
</style>
