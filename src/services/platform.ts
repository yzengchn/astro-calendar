type StorageValue = string | number | boolean | object | null
type NetworkType = 'wifi' | '2g' | '3g' | '4g' | '5g' | 'none' | 'unknown'

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const value = uni.getStorageSync(key)
    return value === '' || value === undefined || value === null ? fallback : (value as T)
  } catch (error) {
    console.warn(`[storage:get] ${key}`, error)
    return fallback
  }
}

export function setStorage<T extends StorageValue>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, value)
  } catch (error) {
    console.warn(`[storage:set] ${key}`, error)
  }
}

export function showToast(title: string): void {
  uni.showToast({
    title,
    icon: 'none',
    duration: 1600
  })
}

export function lightHaptic(): void {
  // #ifdef APP-PLUS
  uni.vibrateShort({ type: 'light' })
  // #endif
}

export function getNetworkType(): Promise<NetworkType> {
  return new Promise((resolve) => {
    try {
      uni.getNetworkType({
        success: (result) => resolve((result.networkType || 'unknown') as NetworkType),
        fail: () => resolve('unknown')
      })
    } catch (error) {
      console.warn('[network:type]', error)
      resolve('unknown')
    }
  })
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  const payload = {
    eventName,
    params,
    time: Date.now()
  }
  if (import.meta.env.DEV) {
    console.log('[track]', payload)
  }
}
