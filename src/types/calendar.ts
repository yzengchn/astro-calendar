export type DateKey = `${number}-${string}-${string}`

export type AuspiciousLevel = 'good' | 'neutral' | 'bad'
export type HolidayType = 'holiday' | 'workday'
export type HolidayTag = '休' | '班'

export interface HolidayItem {
  dateKey: DateKey
  name: string
  type: HolidayType
  tag: HolidayTag
}

export interface HolidayMonth {
  year: number
  month?: number
  source: string
  updatedAt: string
  holidays: HolidayItem[]
}

export interface CalendarDay {
  date: Date
  dateKey: DateKey
  year: number
  month: number
  day: number
  weekday: number
  lunarLabel: string
  solarTerm?: string
  festival?: string
  holidayTag?: HolidayTag
  holidayName?: string
  holidayType?: HolidayType
  isToday: boolean
  isSelected: boolean
  isCurrentMonth: boolean
  luckyMarkColor?: string
}

export interface LunarDate {
  year: number
  month: number
  day: number
  isLeapMonth: boolean
  monthLabel: string
  dayLabel: string
}

export interface MonthCalendar {
  year: number
  month: number
  days: CalendarDay[]
}

export interface TimeBranch {
  id: number
  name: string
  range: string
  startHour: number
  endHour: number
}
