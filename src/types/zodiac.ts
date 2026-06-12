export type ZodiacId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export interface ZodiacSign {
  id: ZodiacId
  name: string
  symbol: string
  range: string
}

export interface ZodiacFortune {
  sign: ZodiacSign
  dateKey: string
  score: number
  stars: string
  keyword: string
  summary: string
  love: string
  loveScore: number
  career: string
  careerScore: number
  health: string
  healthScore: number
  wealth: string
  wealthScore: number
  social: string
  socialScore: number
  luckyColor: string
  luckyNumber: number
  luckyDirection: string
  bestTime: string
  caution: string
}

export type ZodiacFortuneSource = 'fresh' | 'cache' | 'stale-cache' | 'fallback'

export interface ZodiacFortuneCache {
  signId: ZodiacId
  dateKey: string
  cachedAt: number
  expiresAt: number
  fortune: ZodiacFortune
}

export interface ZodiacFortuneResult {
  fortune: ZodiacFortune
  source: ZodiacFortuneSource
  cachedAt: number
  expiresAt: number
  isExpired: boolean
  isDateMismatch: boolean
  cache?: ZodiacFortuneCache
}
