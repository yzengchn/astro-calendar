// 个人八字管理服务
import { Lunar, Solar } from 'lunar-typescript'
import { getStorage, setStorage } from './platform'

export interface BaziInfo {
  name: string
  birthDate: string // YYYY-MM-DD
  birthTime: number // 0-23 hour
  gender: 'male' | 'female'
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string
  hourGanZhi: string
  zodiac: string
}

export function saveBaziInfo(info: BaziInfo): void {
  setStorage('user_bazi', info)
}

export function getBaziInfo(): BaziInfo | null {
  return getStorage<BaziInfo | null>('user_bazi', null)
}

export function clearBaziInfo(): void {
  setStorage('user_bazi', null)
}

export function calculateBazi(birthDate: string, birthHour: number, gender: 'male' | 'female', name: string): BaziInfo {
  const [year, month, day] = birthDate.split('-').map(Number)
  const solar = Solar.fromYmdHms(year, month, day, birthHour, 0, 0)
  const lunar = solar.getLunar()

  const lunarHour = lunar.getTimeInGanZhi()

  return {
    name,
    birthDate,
    birthTime: birthHour,
    gender,
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    hourGanZhi: lunarHour,
    zodiac: lunar.getYearShengXiao()
  }
}

export function getBaziDescription(bazi: BaziInfo): string {
  return `${bazi.yearGanZhi}年 ${bazi.monthGanZhi}月 ${bazi.dayGanZhi}日 ${bazi.hourGanZhi}时`
}
