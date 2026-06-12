// 择吉日功能 - 基于黄历算法的场景化择日
import { Lunar } from 'lunar-typescript'
import type { DateKey } from '@/types/calendar'
import { formatDateKey } from './calendar'

export type OccasionType = 'wedding' | 'moving' | 'opening' | 'signing' | 'travel' | 'interview'

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
}

export const OCCASIONS: Occasion[] = [
  {
    id: 'wedding',
    label: '嫁娶',
    emoji: '💒',
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
    emoji: '🎊',
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
    emoji: '✈️',
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

export function findLuckyDays(occasionId: OccasionType, startDate: Date, days: number = 90): LuckyDay[] {
  const occasion = OCCASIONS.find(o => o.id === occasionId)
  if (!occasion) return []

  const results: LuckyDay[] = []
  const current = new Date(startDate)

  for (let i = 0; i < days; i++) {
    const score = calculateScore(current, occasion)
    const level = getLevelFromScore(score)

    if (score >= 60) {
      const lunar = Lunar.fromDate(current)
      const suitable = lunar.getDayYi()
      const avoid = lunar.getDayJi()

      results.push({
        date: formatDateKey(current),
        score,
        level,
        reason: `${occasion.label}${level}日`,
        suitable: suitable.slice(0, 3),
        avoid: avoid.slice(0, 3)
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20)
}

export function checkDayLucky(date: Date, occasionId: OccasionType): LuckyDay | null {
  const occasion = OCCASIONS.find(o => o.id === occasionId)
  if (!occasion) return null

  const score = calculateScore(date, occasion)
  const level = getLevelFromScore(score)

  if (score < 60) return null

  const lunar = Lunar.fromDate(date)
  const suitable = lunar.getDayYi()
  const avoid = lunar.getDayJi()

  return {
    date: formatDateKey(date),
    score,
    level,
    reason: `${occasion.label}${level}日`,
    suitable: suitable.slice(0, 3),
    avoid: avoid.slice(0, 3)
  }
}
