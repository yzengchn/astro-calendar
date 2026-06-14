<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  subtitle: string
  summary: string
  actionable?: boolean
  active?: boolean
  actionText?: string
}>()

defineEmits<{ tap: [] }>()
</script>

<template>
  <view
    class="info-card"
    :class="{
      'info-card-action': actionable,
      'info-card-active': active
    }"
    @tap="$emit('tap')"
  >
    <view class="info-card-head">
      <text class="info-icon">{{ icon }}</text>
      <view class="info-copy">
        <text class="info-title">{{ title }}</text>
        <text class="info-subtitle">{{ subtitle }}</text>
      </view>
      <text v-if="actionable" class="info-action">{{ actionText || (active ? '收起' : '详情') }}</text>
    </view>
    <text class="info-summary">{{ summary }}</text>
  </view>
</template>

<style scoped>
.info-card {
  border: 1rpx solid var(--gs-line);
  border-radius: 16rpx;
  background: rgba(255, 250, 240, 0.86);
  padding: 20rpx;
}

.info-card-action {
  cursor: pointer;
  transition: background 120ms ease;
}

.info-card-active {
  background: var(--gs-panel-strong);
}

.info-card-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14rpx;
}

.info-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  color: var(--gs-gold);
  font-size: 28rpx;
  font-weight: 900;
  line-height: 56rpx;
  text-align: center;
  background: rgba(199, 141, 42, 0.16);
}

.info-copy {
  flex: 1;
  min-width: 0;
}

.info-title {
  display: block;
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 700;
}

.info-subtitle {
  display: block;
  margin-top: 2rpx;
  color: var(--gs-muted);
  font-size: 20rpx;
}

.info-action {
  flex: none;
  color: var(--gs-gold);
  font-size: 22rpx;
  font-weight: 700;
}

.info-summary {
  display: block;
  margin-top: 10rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
  line-height: 1.4;
}
</style>
