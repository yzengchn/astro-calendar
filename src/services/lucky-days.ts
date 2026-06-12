// 择吉日功能 - 基于黄历算法的场景化择日
import { Lunar } from 'lunar-typescript'
import type { DateKey } from '@/types/calendar'
import { formatDateKey, getLunarDate, getLunarMonthDayText, getWeekdayText, parseDateKey } from './calendar'
import { getHourAlmanacs } from './almanac'

export type OccasionType = 'wedding' | 'moving' | 'opening' | 'signing' | 'travel' | 'interview'
export type RangeDays = 30 | 60 | 90
export type RangeMode = 'days' | 'month'
export interface MonthRange {
  year: number
  month: number // 1-12
}

export interface Occasion {
  id: OccasionType
  label: string
  emoji: string
  description: string
  traditionalMapping: string[]
}

export interface LuckyDay {
  date: DateKey
  score: number
  level: '大吉' | '吉' | '平'
  reason: string
  suitable: string[]
  avoid: string[]
  weekday: string
  lunarText: string
  ganzhi: string
  clashZodiac: string
  bestHours: string[]
}

export const OCCASIONS: Occasion[] = [
  {
    id: 'wedding',
    label: '嫁娶',
    emoji: '💍',
    description: '结婚、订婚、领证',
    traditionalMapping: ['嫁娶', '纳采', '订盟']
  },
  {
    id: 'moving',
    label: '搬家',
    emoji: '🏠',
    description: '搬迁、入宅、乔迁',
    traditionalMapping: ['移徙', '入宅', '安床']
  },
  {
    id: 'opening',
    label: '开业',
    emoji: '🧧',
    description: '开业、开市、开工',
    traditionalMapping: ['开市', '立券', '交易']
  },
  {
    id: 'signing',
    label: '签约',
    emoji: '📝',
    description: '签合同、签协议',
    traditionalMapping: ['订盟', '立券', '交易', '纳财']
  },
  {
    id: 'travel',
    label: '出行',
    emoji: '🧳',
    description: '出差、旅游、远行',
    traditionalMapping: ['出行', '远回']
  },
  {
    id: 'interview',
    label: '面试',
    emoji: '💼',
    description: '求职面试、重要会议',
    traditionalMapping: ['会亲友', '纳采', '求嗣']
  }
]

const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

function calculateScore(date: Date, occasion: Occasion): number {
  const lunar = Lunar.fromDate(date)
  const suitable = lunar.getDayYi()
  const avoid = lunar.getDayJi()

  let score = 50

  // 匹配宜项
  const matchedSuitable = occasion.traditionalMapping.filter(term => suitable.includes(term))
  score += matchedSuitable.length * 20

  // 匹配忌项（减分）
  const matchedAvoid = occasion.traditionalMapping.filter(term => avoid.includes(term))
  score -= matchedAvoid.length * 15

  // 周末加分
  if (date.getDay() === 0 || date.getDay() === 6) {
    score += 5
  }

  return Math.max(0, Math.min(100, score))
}

function getLevelFromScore(score: number): '大吉' | '吉' | '平' {
  if (score >= 80) return '大吉'
  if (score >= 60) return '吉'
  return '平'
}

function getBestHours(dateKey: DateKey): string[] {
  try {
    const hours = getHourAlmanacs(dateKey)
    const goodHours = hours.filter(h => h.level === 'good')
    return goodHours.slice(0, 3).map(h => `${h.branch.name} ${h.branch.range.split('-')[0]}-${h.branch.range.split('-')[1]}`)
  } catch {
    return []
  }
}

function buildReason(occasion: Occasion, lunar: Lunar, score: number): string {
  const level = getLevelFromScore(score)
  const suitable = lunar.getDayYi()
  const matchedTerms = occasion.traditionalMapping.filter(t => suitable.includes(t))

  if (matchedTerms.length > 0) {
    return `${matchedTerms.slice(0, 3).join('·')}${level}`
  }

  return `${occasion.label}${level}日`
}

export function findLuckyDays(occasionId: OccasionType, startDate: Date, rangeDays: number = 60): LuckyDay[] {
  const occasion = OCCASIONS.find(o => o.id === occasionId)
  if (!occasion) return []

  const results: LuckyDay[] = []
  const current = new Date(startDate)

  for (let i = 0; i < rangeDays; i++) {
    const score = calculateScore(current, occasion)

    if (score >= 60) {
      const lunar = Lunar.fromDate(current)
      const lunarDate = getLunarDate(current)
      const dateKey = formatDateKey(current)
      const level = getLevelFromScore(score)

      results.push({
        date: dateKey,
        score,
        level,
        reason: buildReason(occasion, lunar, score),
        suitable: lunar.getDayYi().slice(0, 4),
        avoid: lunar.getDayJi().slice(0, 3),
        weekday: getWeekdayText(current),
        lunarText: getLunarMonthDayText(current, lunarDate),
        ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
        clashZodiac: `冲${ZODIACS[(lunarDate.day + 6) % 12]}煞东`,
        bestHours: getBestHours(dateKey)
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return results.sort((a, b) => b.score - a.score)
}

export function findLuckyDaysForMonth(occasionId: OccasionType, monthRange: MonthRange): LuckyDay[] {
  const occasion = OCCASIONS.find(o => o.id === occasionId)
  if (!occasion) return []

  const year = monthRange.year
  const month = monthRange.month
  const daysInMonth = new Date(year, month, 0).getDate()
  const results: LuckyDay[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const current = new Date(year, month - 1, day)
    const score = calculateScore(current, occasion)

    if (score >= 60) {
      const lunar = Lunar.fromDate(current)
      const lunarDate = getLunarDate(current)
      const dateKey = formatDateKey(current)
      const level = getLevelFromScore(score)

      results.push({
        date: dateKey,
        score,
        level,
        reason: buildReason(occasion, lunar, score),
        suitable: lunar.getDayYi().slice(0, 4),
        avoid: lunar.getDayJi().slice(0, 3),
        weekday: getWeekdayText(current),
        lunarText: getLunarMonthDayText(current, lunarDate),
        ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
        clashZodiac: `冲${ZODIACS[(lunarDate.day + 6) % 12]}煞东`,
        bestHours: getBestHours(dateKey)
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

export function checkDayLucky(date: Date, occasionId: OccasionType): LuckyDay | null {
  const occasion = OCCASIONS.find(o => o.id === occasionId)
  if (!occasion) return null

  const score = calculateScore(date, occasion)
  const level = getLevelFromScore(score)

  if (score < 60) return null

  const lunar = Lunar.fromDate(date)
  const lunarDate = getLunarDate(date)
  const dateKey = formatDateKey(date)

  return {
    date: dateKey,
    score,
    level,
    reason: buildReason(occasion, lunar, score),
    suitable: lunar.getDayYi().slice(0, 4),
    avoid: lunar.getDayJi().slice(0, 3),
    weekday: getWeekdayText(date),
    lunarText: getLunarMonthDayText(date, lunarDate),
    ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    clashZodiac: `冲${ZODIACS[(lunarDate.day + 6) % 12]}煞东`,
    bestHours: getBestHours(dateKey)
  }
}
