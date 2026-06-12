// 择吉日标记服务 - 管理用户在日历上备注的吉日
import type { DateKey } from '@/types/calendar'
import type { OccasionType } from './lucky-days'
import { getStorage, setStorage } from './platform'

export interface LuckyMark {
  dateKey: DateKey
  occasion: OccasionType
  level: '大吉' | '吉'
  label: string // e.g. "嫁娶大吉"
  emoji: string
}

const LUCKY_MARKS_KEY = 'lucky_day_marks'

export function getLuckyMarks(): LuckyMark[] {
  return getStorage<LuckyMark[]>(LUCKY_MARKS_KEY, [])
}

export function getLuckyMarkMap(): Record<string, LuckyMark> {
  const marks = getLuckyMarks()
  const map: Record<string, LuckyMark> = {}
  for (const mark of marks) {
    map[mark.dateKey] = mark
  }
  return map
}

export function saveLuckyMark(mark: LuckyMark): void {
  const marks = getLuckyMarks()
  const existing = marks.findIndex(m => m.dateKey === mark.dateKey && m.occasion === mark.occasion)
  if (existing >= 0) {
    marks[existing] = mark
  } else {
    marks.push(mark)
  }
  // Keep max 200 marks
  if (marks.length > 200) marks.splice(0, marks.length - 200)
  setStorage(LUCKY_MARKS_KEY, marks)
}

export function removeLuckyMark(dateKey: DateKey, occasion?: OccasionType): void {
  const marks = getLuckyMarks()
  const filtered = occasion
    ? marks.filter(m => !(m.dateKey === dateKey && m.occasion === occasion))
    : marks.filter(m => m.dateKey !== dateKey)
  setStorage(LUCKY_MARKS_KEY, filtered)
}

export function toggleLuckyMark(mark: LuckyMark): boolean {
  const marks = getLuckyMarks()
  const existing = marks.findIndex(m => m.dateKey === mark.dateKey && m.occasion === mark.occasion)
  if (existing >= 0) {
    marks.splice(existing, 1)
    setStorage(LUCKY_MARKS_KEY, marks)
    return false
  } else {
    saveLuckyMark(mark)
    return true
  }
}

export function hasLuckyMark(dateKey: DateKey): boolean {
  const marks = getLuckyMarks()
  return marks.some(m => m.dateKey === dateKey)
}

export function getLuckyMarkForDate(dateKey: DateKey): LuckyMark | undefined {
  const marks = getLuckyMarks()
  return marks.find(m => m.dateKey === dateKey)
}
