import type { CalendarDay, DateKey, LunarDate, MonthCalendar, TimeBranch } from '@/types/calendar'
import { getLocalHolidayByDate } from './holidays'
import { getLuckyMarkMap } from './lucky-marks'

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export type WeekFirstDay = 0 | 1 | 6 // 0=Sunday, 1=Monday, 6=Saturday

export function getWeekdayLabels(firstDay: WeekFirstDay): string[] {
  const order: number[] = []
  for (let i = 0; i < 7; i++) {
    order.push((firstDay + i) % 7)
  }
  return order.map(i => WEEKDAYS[i])
}

export const TIME_BRANCHES: TimeBranch[] = [
  { id: 0, name: '子时', range: '23:00-00:59', startHour: 23, endHour: 1 },
  { id: 1, name: '丑时', range: '01:00-02:59', startHour: 1, endHour: 3 },
  { id: 2, name: '寅时', range: '03:00-04:59', startHour: 3, endHour: 5 },
  { id: 3, name: '卯时', range: '05:00-06:59', startHour: 5, endHour: 7 },
  { id: 4, name: '辰时', range: '07:00-08:59', startHour: 7, endHour: 9 },
  { id: 5, name: '巳时', range: '09:00-10:59', startHour: 9, endHour: 11 },
  { id: 6, name: '午时', range: '11:00-12:59', startHour: 11, endHour: 13 },
  { id: 7, name: '未时', range: '13:00-14:59', startHour: 13, endHour: 15 },
  { id: 8, name: '申时', range: '15:00-16:59', startHour: 15, endHour: 17 },
  { id: 9, name: '酉时', range: '17:00-18:59', startHour: 17, endHour: 19 },
  { id: 10, name: '戌时', range: '19:00-20:59', startHour: 19, endHour: 21 },
  { id: 11, name: '亥时', range: '21:00-22:59', startHour: 21, endHour: 23 }
]

const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
const LUNAR_DAY_PREFIXES = ['初', '十', '廿', '卅']
const LUNAR_DAY_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const LUNAR_START_YEAR = 1900
const LUNAR_END_YEAR = 2100
const LUNAR_BASE_UTC = Date.UTC(1900, 0, 31)
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
]

const SOLAR_TERMS: Record<string, string> = {
  '01-05': '小寒',
  '01-20': '大寒',
  '02-04': '立春',
  '02-19': '雨水',
  '03-05': '惊蛰',
  '03-20': '春分',
  '04-04': '清明',
  '04-20': '谷雨',
  '05-05': '立夏',
  '05-21': '小满',
  '06-05': '芒种',
  '06-21': '夏至',
  '07-07': '小暑',
  '07-22': '大暑',
  '08-07': '立秋',
  '08-23': '处暑',
  '09-07': '白露',
  '09-23': '秋分',
  '10-08': '寒露',
  '10-23': '霜降',
  '11-07': '立冬',
  '11-22': '小雪',
  '12-07': '大雪',
  '12-21': '冬至'
}

const FESTIVALS: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '05-01': '劳动节',
  '06-01': '儿童节',
  '10-01': '国庆节',
  '12-25': '圣诞节'
}

const LUNAR_FESTIVALS: Record<string, string> = {
  '01-01': '春节',
  '01-15': '元宵',
  '02-02': '龙抬头',
  '05-05': '端午',
  '07-07': '七夕',
  '07-15': '中元',
  '08-15': '中秋',
  '09-09': '重阳',
  '12-08': '腊八',
  '12-23': '小年'
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` as DateKey
}

export function isDateKey(value: string): value is DateKey {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getTodayKey(): DateKey {
  return formatDateKey(new Date())
}

export function getMonthCalendar(year: number, month: number, selectedKey = getTodayKey(), weekFirstDay: WeekFirstDay = 1): MonthCalendar {
  const firstDay = new Date(year, month - 1, 1)
  const startOffset = (firstDay.getDay() - weekFirstDay + 7) % 7
  const startDate = new Date(year, month - 1, 1 - startOffset)
  const todayKey = getTodayKey()
  const luckyMarkMap = getLuckyMarkMap()
  const days: CalendarDay[] = []

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + index)
    const dateKey = formatDateKey(current)
    const monthDay = `${pad2(current.getMonth() + 1)}-${pad2(current.getDate())}`
    const lunarDate = getLunarDate(current)
    const holidayItem = getLocalHolidayByDate(dateKey)
    const luckyMark = luckyMarkMap[dateKey]
    days.push({
      date: current,
      dateKey,
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate(),
      weekday: current.getDay(),
      lunarLabel: getLunarLabel(current, lunarDate),
      solarTerm: SOLAR_TERMS[monthDay],
      festival: getCalendarFestivalText(current, lunarDate),
      holidayTag: holidayItem?.tag,
      holidayName: holidayItem?.name,
      holidayType: holidayItem?.type,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
      isCurrentMonth: current.getMonth() + 1 === month,
      luckyMarkColor: luckyMark ? (luckyMark.level === '大吉' ? 'var(--gs-gold)' : 'var(--gs-blue)') : undefined
    })
  }

  return {
    year,
    month,
    days
  }
}

export function getLunarDate(date: Date): LunarDate {
  const offset = getDateOffset(date)
  if (offset < 0) {
    return buildFallbackLunarDate(date)
  }

  let remainingDays = offset
  let lunarYear = LUNAR_START_YEAR
  while (lunarYear <= LUNAR_END_YEAR) {
    const daysInYear = getLunarYearDays(lunarYear)
    if (remainingDays < daysInYear) break
    remainingDays -= daysInYear
    lunarYear += 1
  }

  if (lunarYear > LUNAR_END_YEAR) {
    return buildFallbackLunarDate(date)
  }

  const leapMonth = getLeapMonth(lunarYear)
  let lunarMonth = 1
  let isLeapMonth = false

  while (lunarMonth <= 12) {
    const daysInMonth = isLeapMonth ? getLeapMonthDays(lunarYear) : getLunarMonthDays(lunarYear, lunarMonth)
    if (remainingDays < daysInMonth) break
    remainingDays -= daysInMonth

    if (leapMonth === lunarMonth && !isLeapMonth) {
      isLeapMonth = true
    } else {
      isLeapMonth = false
      lunarMonth += 1
    }
  }

  return buildLunarDate(lunarYear, lunarMonth, remainingDays + 1, isLeapMonth)
}

export function getLunarLabel(date: Date, lunarDate = getLunarDate(date)): string {
  return lunarDate.day === 1 ? lunarDate.monthLabel : lunarDate.dayLabel
}

export function getLunarMonthDayText(date: Date, lunarDate = getLunarDate(date)): string {
  return `${lunarDate.monthLabel}${lunarDate.dayLabel}`
}

export function getCalendarFestivalText(date: Date, lunarDate = getLunarDate(date)): string | undefined {
  const solarFestival = FESTIVALS[`${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`]
  const lunarFestival = getLunarFestival(lunarDate)
  const festivals = [solarFestival, lunarFestival].filter(Boolean)
  return festivals.length > 0 ? festivals.join(' · ') : undefined
}

export function getCurrentTimeBranchId(date = new Date()): number {
  const hour = date.getHours()
  if (hour >= 23 || hour < 1) return 0
  return Math.floor((hour + 1) / 2)
}

export function getWeekdayText(date: Date): string {
  return `星期${WEEKDAYS[date.getDay()]}`
}

function getDateOffset(date: Date): number {
  const targetUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((targetUtc - LUNAR_BASE_UTC) / ONE_DAY_MS)
}

function buildLunarDate(year: number, month: number, day: number, isLeapMonth: boolean): LunarDate {
  const monthLabel = `${isLeapMonth ? '闰' : ''}${LUNAR_MONTHS[month - 1] || `${month}月`}`
  return {
    year,
    month,
    day,
    isLeapMonth,
    monthLabel,
    dayLabel: formatLunarDay(day)
  }
}

function buildFallbackLunarDate(date: Date): LunarDate {
  return buildLunarDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), false)
}

function getLunarFestival(lunarDate: LunarDate): string | undefined {
  if (lunarDate.isLeapMonth) return undefined
  if (lunarDate.month === 12 && lunarDate.day === getLunarMonthDays(lunarDate.year, 12)) {
    return '除夕'
  }
  return LUNAR_FESTIVALS[`${pad2(lunarDate.month)}-${pad2(lunarDate.day)}`]
}

function formatLunarDay(day: number): string {
  if (day === 10) return '初十'
  if (day === 20) return '二十'
  if (day === 30) return '三十'
  return `${LUNAR_DAY_PREFIXES[Math.floor((day - 1) / 10)]}${LUNAR_DAY_NUMBERS[(day - 1) % 10]}`
}

function getLunarYearDays(year: number): number {
  let days = 348
  const info = getLunarInfo(year)
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (info & bit) days += 1
  }
  return days + getLeapMonthDays(year)
}

function getLeapMonth(year: number): number {
  return getLunarInfo(year) & 0xf
}

function getLeapMonthDays(year: number): number {
  if (!getLeapMonth(year)) return 0
  return getLunarInfo(year) & 0x10000 ? 30 : 29
}

function getLunarMonthDays(year: number, month: number): number {
  return getLunarInfo(year) & (0x10000 >> month) ? 30 : 29
}

function getLunarInfo(year: number): number {
  return LUNAR_INFO[year - LUNAR_START_YEAR] || 0
}
