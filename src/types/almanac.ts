import type { AuspiciousLevel, DateKey, TimeBranch } from './calendar'

export interface ModernAdvice {
  suitable: string[]
  avoid: string[]
  keyword: string
  trait: string
}

export interface StarMapping {
  star: string
  level: AuspiciousLevel
  levelText: '吉' | '平' | '凶'
  advice: ModernAdvice
}

export interface HourAlmanac {
  branch: TimeBranch
  star: string
  level: AuspiciousLevel
  levelText: '吉' | '平' | '凶'
  suitable: string[]
  avoid: string[]
  traditional: string[]
  traditionalSuitable: string[]
  traditionalAvoid: string[]
  keyword: string
  guide: string
  isCurrent: boolean
}

export interface DayAlmanac {
  dateKey: DateKey
  title: string
  weekdayText: string
  lunarText: string
  festivalText?: string
  clash: string
  sexagenary: string
  pengzu: string
  luckyGods: string[]
  unluckyGods: string[]
  traditional: string[]
  traditionalSuitable: string[]
  traditionalAvoid: string[]
  suitable: string[]
  avoid: string[]
  highlightHour: HourAlmanac
  hours: HourAlmanac[]
}
