import type { DateKey, HolidayItem, HolidayMonth, MonthCalendar } from '@/types/calendar'
import { requestJson } from './api'

export const HOLIDAY_SOURCE = 'xingyun-2026-holiday-data'
export const HOLIDAY_UPDATED_AT = '2026-06-11'

const LOCAL_HOLIDAY_ITEMS: HolidayItem[] = [
  holiday('2026-01-01', '元旦假期'),
  holiday('2026-01-02', '元旦假期'),
  holiday('2026-01-03', '元旦假期'),
  workday('2026-01-04', '元旦调休上班'),
  workday('2026-02-14', '春节调休上班'),
  holiday('2026-02-15', '春节假期'),
  holiday('2026-02-16', '春节假期'),
  holiday('2026-02-17', '春节假期'),
  holiday('2026-02-18', '春节假期'),
  holiday('2026-02-19', '春节假期'),
  holiday('2026-02-20', '春节假期'),
  holiday('2026-02-21', '春节假期'),
  holiday('2026-02-22', '春节假期'),
  holiday('2026-02-23', '春节假期'),
  workday('2026-02-28', '春节调休上班'),
  holiday('2026-04-04', '清明节假期'),
  holiday('2026-04-05', '清明节假期'),
  holiday('2026-04-06', '清明节假期'),
  holiday('2026-05-01', '劳动节假期'),
  holiday('2026-05-02', '劳动节假期'),
  holiday('2026-05-03', '劳动节假期'),
  holiday('2026-05-04', '劳动节假期'),
  holiday('2026-05-05', '劳动节假期'),
  workday('2026-05-09', '劳动节调休上班'),
  holiday('2026-06-19', '端午节假期'),
  holiday('2026-06-20', '端午节假期'),
  holiday('2026-06-21', '端午节假期'),
  holiday('2026-09-25', '中秋节假期'),
  holiday('2026-09-26', '中秋节假期'),
  holiday('2026-09-27', '中秋节假期'),
  workday('2026-09-20', '国庆节调休上班'),
  holiday('2026-10-01', '国庆节假期'),
  holiday('2026-10-02', '国庆节假期'),
  holiday('2026-10-03', '国庆节假期'),
  holiday('2026-10-04', '国庆节假期'),
  holiday('2026-10-05', '国庆节假期'),
  holiday('2026-10-06', '国庆节假期'),
  holiday('2026-10-07', '国庆节假期'),
  workday('2026-10-10', '国庆节调休上班')
]

const LOCAL_HOLIDAY_MAP = new Map<string, HolidayItem>(LOCAL_HOLIDAY_ITEMS.map((item) => [item.dateKey, item]))

export function getLocalHolidayByDate(dateKey: DateKey): HolidayItem | undefined {
  return LOCAL_HOLIDAY_MAP.get(dateKey)
}

export function getLocalHolidayMonth(year: number, month?: number): HolidayMonth {
  return {
    year,
    month,
    source: HOLIDAY_SOURCE,
    updatedAt: HOLIDAY_UPDATED_AT,
    holidays: LOCAL_HOLIDAY_ITEMS.filter((item) => {
      const [itemYear, itemMonth] = item.dateKey.split('-').map(Number)
      return itemYear === year && (month === undefined || itemMonth === month)
    })
  }
}

export async function fetchHolidayMonth(year: number, month: number): Promise<HolidayMonth> {
  return requestJson<HolidayMonth>('/api/calendar/holidays', { year, month })
}

export function applyHolidayItems(calendar: MonthCalendar, holidays: HolidayItem[]): MonthCalendar {
  const holidayMap = new Map(holidays.map((item) => [item.dateKey, item]))

  return {
    ...calendar,
    days: calendar.days.map((day) => {
      const holidayItem = holidayMap.get(day.dateKey)
      if (!holidayItem) return day

      return {
        ...day,
        holidayTag: holidayItem.tag,
        holidayName: holidayItem.name,
        holidayType: holidayItem.type
      }
    })
  }
}

function holiday(dateKey: DateKey, name: string): HolidayItem {
  return {
    dateKey,
    name,
    type: 'holiday',
    tag: '休'
  }
}

function workday(dateKey: DateKey, name: string): HolidayItem {
  return {
    dateKey,
    name,
    type: 'workday',
    tag: '班'
  }
}
