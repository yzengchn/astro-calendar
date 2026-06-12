<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { trackEvent } from '@/services/platform'

function getPlatform(): string {
  return (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform || 'unknown'
}

onLaunch(() => {
  trackEvent('app_launch', {
    launch_type: 'cold',
    platform: getPlatform()
  })
})

onShow(() => {
  trackEvent('app_show', {
    platform: getPlatform()
  })
})
</script>

<style>
page {
  min-height: 100%;
  background: #f7f1e7;
  color: #241f18;
  font-family: "Songti SC", "Noto Serif CJK SC", serif;
}

view,
text,
button {
  box-sizing: border-box;
}

button {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  line-height: 1;
}

button::after {
  border: none;
}
</style>
