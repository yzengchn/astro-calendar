import type { AuspiciousLevel, DateKey, TimeBranch } from './calendar'

export interface ModernAdvice {
  suitable: string[]
  avoid: string[]
  keyword: string
  trait: string
}

export interface AlmanacDefaultAdvice extends ModernAdvice {
  guide: string
}

export interface AlmanacTermMapping extends AlmanacDefaultAdvice {
  term: string
  matched: boolean
  category?: string
  priority?: number
  updatedAt?: string
}

export interface ModernScenarioMapping {
  traditional: string[]
  suitable: string[]
  avoid: string[]
  keyword?: string
  trait: string
  summary: string
  category?: string
  priority?: number
}

export interface StarMapping {
  star: string
  level: AuspiciousLevel
  levelText: '吉' | '平' | '凶'
  advice: ModernAdvice
}

export interface AlmanacMappingConfig {
  version: string
  updatedAt: string
  modernScenarios: ModernScenarioMapping[]
  starMappings: StarMapping[]
  defaultAdvice: AlmanacDefaultAdvice
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
  trait: string
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
  keyword: string
  trait: string
  guide: string
  highlightHour: HourAlmanac
  hours: HourAlmanac[]
}
