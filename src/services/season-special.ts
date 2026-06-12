// 数九（冬至后81天）与 数伏（夏季三伏天）- 古今融合
import type { DateKey } from '@/types/calendar'

export interface CountNineDay {
  name: string
  day: number
  total: 81
  ancient: string
  modern: string
  insight: string
}

export interface DogDay {
  period: '初伏' | '中伏' | '末伏'
  day: number
  totalDays: number
  ancient: string
  modern: string
  insight: string
}

export type SeasonSpecial =
  | { type: 'countNine'; data: CountNineDay }
  | { type: 'dogDays'; data: DogDay }

const COUNT_NINE_WISDOM = [
  { name: '一九', ancient: '一九二九不出手', modern: '岁末年关，收尾工作要做好', insight: '善始善终，不留遗憾' },
  { name: '二九', ancient: '三九四九冰上走', modern: '最艰难时刻，坚持就是胜利', insight: '黎明前最黑暗，咬牙挺过去' },
  { name: '三九', ancient: '三九四九冰上走', modern: '寒冬深处，正是修炼内功时', insight: '冬练三九，夏练三伏' },
  { name: '四九', ancient: '三九四九冰上走', modern: '寒冬将尽，曙光在前', insight: '否极泰来，春天不远了' },
  { name: '五九', ancient: '五九六九沿河看柳', modern: '春的气息，新机遇萌芽', insight: '静待花开，时机已到' },
  { name: '六九', ancient: '五九六九沿河看柳', modern: '万象更新，主动出击好时机', insight: '春江水暖鸭先知' },
  { name: '七九', ancient: '七九河开', modern: '破冰前行，突破瓶颈', insight: '冰雪消融，障碍自除' },
  { name: '八九', ancient: '八九燕来', modern: '喜讯频传，好事成双', insight: '燕归春满，福至心灵' },
  { name: '九九', ancient: '九九加一九，耕牛遍地走', modern: '春耕开始，播种希望', insight: '一年之计在于春' }
]

const DOG_DAYS_WISDOM = {
  初伏: { ancient: '头伏饺子二伏面', modern: '年中调整期，休养生息', insight: '欲速则不达，稳扎稳打' },
  中伏: { ancient: '中伏最难熬', modern: '压力最大时，保持冷静理性', insight: '心静自然凉，稳住心态' },
  末伏: { ancient: '末伏秋老虎', modern: '最后冲刺，咬牙坚持', insight: '行百里者半九十' }
}

export function getCountNineDay(date: Date): CountNineDay | null {
  const year = date.getFullYear()
  const dongzhi = new Date(year, 11, 21) // 冬至约12月21日

  if (date < dongzhi) {
    const lastYearDongzhi = new Date(year - 1, 11, 21)
    const daysSince = Math.floor((date.getTime() - lastYearDongzhi.getTime()) / (24 * 60 * 60 * 1000))

    if (daysSince >= 0 && daysSince < 81) {
      return buildCountNineDay(daysSince)
    }
  } else {
    const daysSince = Math.floor((date.getTime() - dongzhi.getTime()) / (24 * 60 * 60 * 1000))

    if (daysSince >= 0 && daysSince < 81) {
      return buildCountNineDay(daysSince)
    }
  }

  return null
}

function buildCountNineDay(daysSince: number): CountNineDay {
  const nineIndex = Math.floor(daysSince / 9)
  const dayInNine = (daysSince % 9) + 1
  const wisdom = COUNT_NINE_WISDOM[nineIndex]

  return {
    name: `${wisdom.name}第${dayInNine}天`,
    day: daysSince + 1,
    total: 81,
    ancient: wisdom.ancient,
    modern: wisdom.modern,
    insight: wisdom.insight
  }
}

export function getDogDay(date: Date): DogDay | null {
  const year = date.getFullYear()
  // 夏至约6月21日，夏至后第三个庚日入伏
  const xiazhi = new Date(year, 5, 21)
  const chufu = new Date(year, 6, 11) // 初伏约7月11日
  const zhongfu = new Date(year, 6, 21) // 中伏约7月21日
  const mofu = new Date(year, 7, 10) // 末伏约8月10日
  const chuqiu = new Date(year, 7, 20) // 出伏约8月20日

  if (date >= chufu && date < zhongfu) {
    const day = Math.floor((date.getTime() - chufu.getTime()) / (24 * 60 * 60 * 1000)) + 1
    return {
      period: '初伏',
      day,
      totalDays: 10,
      ...DOG_DAYS_WISDOM.初伏
    }
  }

  if (date >= zhongfu && date < mofu) {
    const day = Math.floor((date.getTime() - zhongfu.getTime()) / (24 * 60 * 60 * 1000)) + 1
    const totalDays = Math.floor((mofu.getTime() - zhongfu.getTime()) / (24 * 60 * 60 * 1000))
    return {
      period: '中伏',
      day,
      totalDays,
      ...DOG_DAYS_WISDOM.中伏
    }
  }

  if (date >= mofu && date < chuqiu) {
    const day = Math.floor((date.getTime() - mofu.getTime()) / (24 * 60 * 60 * 1000)) + 1
    return {
      period: '末伏',
      day,
      totalDays: 10,
      ...DOG_DAYS_WISDOM.末伏
    }
  }

  return null
}

export function getSeasonSpecial(date: Date): SeasonSpecial | null {
  const countNine = getCountNineDay(date)
  if (countNine) {
    return { type: 'countNine', data: countNine }
  }

  const dogDay = getDogDay(date)
  if (dogDay) {
    return { type: 'dogDays', data: dogDay }
  }

  return null
}
