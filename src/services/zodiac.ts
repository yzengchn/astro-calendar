import type { ZodiacFortune, ZodiacFortuneCache, ZodiacFortuneResult, ZodiacId, ZodiacSign } from '@/types/zodiac'
import { getDateSeed } from './almanac'
import { requestJson } from './api'

export const ZODIAC_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { id: 'aries', name: '白羊座', symbol: '♈', range: '3月21日 - 4月19日' },
  { id: 'taurus', name: '金牛座', symbol: '♉', range: '4月20日 - 5月20日' },
  { id: 'gemini', name: '双子座', symbol: '♊', range: '5月21日 - 6月21日' },
  { id: 'cancer', name: '巨蟹座', symbol: '♋', range: '6月22日 - 7月22日' },
  { id: 'leo', name: '狮子座', symbol: '♌', range: '7月23日 - 8月22日' },
  { id: 'virgo', name: '处女座', symbol: '♍', range: '8月23日 - 9月22日' },
  { id: 'libra', name: '天秤座', symbol: '♎', range: '9月23日 - 10月23日' },
  { id: 'scorpio', name: '天蝎座', symbol: '♏', range: '10月24日 - 11月22日' },
  { id: 'sagittarius', name: '射手座', symbol: '♐', range: '11月23日 - 12月21日' },
  { id: 'capricorn', name: '摩羯座', symbol: '♑', range: '12月22日 - 1月19日' },
  { id: 'aquarius', name: '水瓶座', symbol: '♒', range: '1月20日 - 2月18日' },
  { id: 'pisces', name: '双鱼座', symbol: '♓', range: '2月19日 - 3月20日' }
]

interface ZodiacTrait {
  tempo: string
  color: string
  direction: string
}

const SIGN_TRAITS: Record<ZodiacId, ZodiacTrait> = {
  aries: { tempo: '先行动再修正会比反复观望更有效。', color: '朱砂红', direction: '正东' },
  taurus: { tempo: '稳住预算和节奏，慢一点反而更容易拿到结果。', color: '松石绿', direction: '东北' },
  gemini: { tempo: '信息流动很关键，适合把零散线索重新整理。', color: '浅金色', direction: '东南' },
  cancer: { tempo: '情绪和安全感需要被照顾，别把所有感受都压住。', color: '月白色', direction: '正北' },
  leo: { tempo: '表达力在线，但要把舞台留给真正重要的事项。', color: '琥珀金', direction: '正南' },
  virgo: { tempo: '适合清理细节、修正流程，把秩序感找回来。', color: '竹青色', direction: '西北' },
  libra: { tempo: '关系里的平衡感变重要，适合用协商替代硬碰硬。', color: '淡藕粉', direction: '正西' },
  scorpio: { tempo: '洞察力增强，适合处理深层问题，但别过度试探。', color: '石榴红', direction: '西南' },
  sagittarius: { tempo: '视野打开，适合学习、出行和确认新的可能性。', color: '靛蓝色', direction: '正南' },
  capricorn: { tempo: '长期目标比即时反馈更重要，今天适合补基础。', color: '岩灰色', direction: '东北' },
  aquarius: { tempo: '新的想法会冒出来，先记录，再决定是否推进。', color: '湖蓝色', direction: '正东' },
  pisces: { tempo: '直觉敏锐，但需要用事实给灵感落地。', color: '海盐蓝', direction: '东南' }
}

const KEYWORDS = ['确认', '推进', '留白', '协作', '复盘', '表达', '收束', '重启']
const BEST_TIMES = ['09:00-11:00', '11:00-13:00', '15:00-17:00', '19:00-21:00']
const CAUTIONS = [
  '避免在情绪最高点做不可逆决定。',
  '重要信息先二次确认，再推进下一步。',
  '别同时开启太多任务，保留一个主线。',
  '沟通时少用暗示，直接说清楚边界。'
]

export function getZodiacById(id: ZodiacId | string | null): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((sign) => sign.id === id)
}

export function getZodiacByBirthday(dateValue: string): ZodiacSign | undefined {
  const [, monthText, dayText] = dateValue.split('-')
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isInteger(month) || !Number.isInteger(day)) return undefined

  const value = month * 100 + day
  if (value >= 321 && value <= 419) return getZodiacById('aries')
  if (value >= 420 && value <= 520) return getZodiacById('taurus')
  if (value >= 521 && value <= 621) return getZodiacById('gemini')
  if (value >= 622 && value <= 722) return getZodiacById('cancer')
  if (value >= 723 && value <= 822) return getZodiacById('leo')
  if (value >= 823 && value <= 922) return getZodiacById('virgo')
  if (value >= 923 && value <= 1023) return getZodiacById('libra')
  if (value >= 1024 && value <= 1122) return getZodiacById('scorpio')
  if (value >= 1123 && value <= 1221) return getZodiacById('sagittarius')
  if (value >= 1222 || value <= 119) return getZodiacById('capricorn')
  if (value >= 120 && value <= 218) return getZodiacById('aquarius')
  if (value >= 219 && value <= 320) return getZodiacById('pisces')
  return undefined
}

export function getZodiacCacheKey(signId: ZodiacId | string): string {
  const sign = getZodiacById(signId) || ZODIAC_SIGNS[0]
  return `zodiac_fortune_cache_${sign.id}`
}

export function fetchZodiacFortune(signId: ZodiacId | string, dateKey: string): Promise<ZodiacFortune> {
  const sign = getZodiacById(signId) || ZODIAC_SIGNS[0]
  return requestJson<ZodiacFortune>('/api/zodiac/fortune', {
    sign: sign.id,
    date: dateKey
  })
}

export function getZodiacFortune(signId: ZodiacId | string, dateKey: string): ZodiacFortune {
  const sign = getZodiacById(signId) || ZODIAC_SIGNS[0]
  const seed = getDateSeed(`${dateKey}-${sign.id}`)
  const score = 68 + (seed % 25)
  const stars = buildStars(score)
  const trait = SIGN_TRAITS[sign.id]
  const keyword = KEYWORDS[(seed + sign.id.length) % KEYWORDS.length]
  const loveScore = buildDimensionScore(seed, 1)
  const careerScore = buildDimensionScore(seed, 2)
  const healthScore = buildDimensionScore(seed, 3)
  const wealthScore = buildDimensionScore(seed, 4)
  const socialScore = buildDimensionScore(seed, 5)

  return {
    sign,
    dateKey,
    score,
    stars,
    keyword,
    summary: `${sign.name}今天的关键词是「${keyword}」。${trait.tempo}`,
    love: loveScore >= 80 ? '关系里的正向回应更明显，适合主动表达关心。' : '先观察对方节奏，不急着用结论定义关系。',
    loveScore,
    career: careerScore >= 80 ? '工作推进感增强，适合争取资源、提交方案或确认排期。' : '先完成确定性任务，把风险点拆小再处理。',
    careerScore,
    health: healthScore >= 80 ? '精力恢复较快，适合轻运动和规律作息。' : '注意肩颈、睡眠和用眼疲劳，不要硬扛。',
    healthScore,
    wealth: wealthScore >= 80 ? '适合梳理预算和长期配置，小额机会可以谨慎评估。' : '不宜冲动消费，先把必要支出和现金流看清楚。',
    wealthScore,
    social: socialScore >= 80 ? '容易遇到有效信息，适合约见、讨论和恢复联系。' : '社交能量有限，保留必要沟通即可。',
    socialScore,
    luckyColor: trait.color,
    luckyNumber: (seed % 9) + 1,
    luckyDirection: trait.direction,
    bestTime: BEST_TIMES[seed % BEST_TIMES.length],
    caution: CAUTIONS[(seed + score) % CAUTIONS.length]
  }
}

export function createZodiacFortuneCache(
  signId: ZodiacId | string,
  dateKey: string,
  now = Date.now(),
  fortune = getZodiacFortune(signId, dateKey)
): ZodiacFortuneCache {
  return {
    signId: fortune.sign.id,
    dateKey,
    cachedAt: now,
    expiresAt: now + ZODIAC_CACHE_TTL_MS,
    fortune
  }
}

export function resolveZodiacFortune(
  signId: ZodiacId | string,
  dateKey: string,
  cached: ZodiacFortuneCache | null,
  options: {
    forceRefresh?: boolean
    preferCache?: boolean
    now?: number
  } = {}
): ZodiacFortuneResult {
  const now = options.now ?? Date.now()
  const sign = getZodiacById(signId) || ZODIAC_SIGNS[0]
  const cacheMatchesSign = cached?.signId === sign.id
  const cacheMatchesDate = cached?.dateKey === dateKey
  const isCacheExpired = Boolean(cached && cached.expiresAt <= now)

  if (!options.forceRefresh && cacheMatchesSign) {
    if (cacheMatchesDate && !isCacheExpired) {
      return {
        fortune: cached.fortune,
        source: 'cache',
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
        isExpired: false,
        isDateMismatch: false
      }
    }

    if (options.preferCache) {
      return {
        fortune: cached.fortune,
        source: 'stale-cache',
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
        isExpired: isCacheExpired,
        isDateMismatch: !cacheMatchesDate
      }
    }
  }

  const nextCache = createZodiacFortuneCache(sign.id, dateKey, now)
  return {
    fortune: nextCache.fortune,
    source: 'fresh',
    cachedAt: nextCache.cachedAt,
    expiresAt: nextCache.expiresAt,
    isExpired: false,
    isDateMismatch: false,
    cache: nextCache
  }
}

export function isZodiacFortuneCache(value: unknown): value is ZodiacFortuneCache {
  if (!value || typeof value !== 'object') return false
  const cache = value as Partial<ZodiacFortuneCache>
  const fortune = cache.fortune as Partial<ZodiacFortune> | undefined
  return (
    typeof cache.signId === 'string' &&
    typeof cache.dateKey === 'string' &&
    typeof cache.cachedAt === 'number' &&
    typeof cache.expiresAt === 'number' &&
    Boolean(fortune) &&
    typeof fortune?.keyword === 'string' &&
    typeof fortune?.summary === 'string' &&
    typeof fortune?.wealth === 'string' &&
    typeof fortune?.social === 'string' &&
    typeof fortune?.loveScore === 'number' &&
    typeof fortune?.careerScore === 'number' &&
    typeof fortune?.healthScore === 'number' &&
    typeof fortune?.wealthScore === 'number' &&
    typeof fortune?.socialScore === 'number' &&
    getZodiacById(cache.signId) !== undefined
  )
}

function buildDimensionScore(seed: number, offset: number): number {
  return 58 + ((Math.floor(seed / (offset * 7 + 3)) + offset * 13) % 39)
}

function buildStars(score: number): string {
  const filled = Math.max(1, Math.min(5, Math.round(score / 20)))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}
