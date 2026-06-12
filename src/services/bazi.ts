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

export interface PillarDetail {
  ganZhi: string
  wuXing: string
  naYin: string
  shiShenGan: string
  shiShenZhi: string[]
  hideGan: string[]
  xun: string
  xunKong: string
}

export interface BaziAnalysis {
  pillars: {
    year: PillarDetail
    month: PillarDetail
    day: PillarDetail
    hour: PillarDetail
  }
  taiYuan: string        // 胎元
  taiYuanNaYin: string
  taiXi: string          // 胎息
  taiXiNaYin: string
  mingGong: string       // 命宫
  mingGongNaYin: string
  shenGong: string       // 身宫
  shenGongNaYin: string
  chong: string          // 日冲
  chongShengXiao: string // 冲生肖
  sha: string            // 煞
  pengZuGan: string      // 彭祖干
  pengZuZhi: string      // 彭祖支
  jiShen: string[]       // 吉神宜趋
  dayYi: string[]        // 日宜
  dayJi: string[]        // 日忌
}

export interface DaYunItem {
  ganZhi: string
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  isCurrent: boolean
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

  return {
    name,
    birthDate,
    birthTime: birthHour,
    gender,
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    hourGanZhi: lunar.getTimeInGanZhi(),
    zodiac: lunar.getYearShengXiao()
  }
}

function buildPillarDetail(ec: InstanceType<typeof import('lunar-typescript').EightChar>, key: 'year' | 'month' | 'day' | 'hour'): PillarDetail {
  if (key === 'year') {
    return {
      ganZhi: ec.getYear(), wuXing: ec.getYearWuXing(), naYin: ec.getYearNaYin(),
      shiShenGan: ec.getYearShiShenGan(), shiShenZhi: ec.getYearShiShenZhi(),
      hideGan: ec.getYearHideGan(), xun: ec.getYearXun(), xunKong: ec.getYearXunKong()
    }
  }
  if (key === 'month') {
    return {
      ganZhi: ec.getMonth(), wuXing: ec.getMonthWuXing(), naYin: ec.getMonthNaYin(),
      shiShenGan: ec.getMonthShiShenGan(), shiShenZhi: ec.getMonthShiShenZhi(),
      hideGan: ec.getMonthHideGan(), xun: ec.getMonthXun(), xunKong: ec.getMonthXunKong()
    }
  }
  if (key === 'day') {
    return {
      ganZhi: ec.getDay(), wuXing: ec.getDayWuXing(), naYin: ec.getDayNaYin(),
      shiShenGan: ec.getDayShiShenGan(), shiShenZhi: ec.getDayShiShenZhi(),
      hideGan: ec.getDayHideGan(), xun: ec.getDayXun(), xunKong: ec.getDayXunKong()
    }
  }
  return {
    ganZhi: ec.getTime(), wuXing: ec.getTimeWuXing(), naYin: ec.getTimeNaYin(),
    shiShenGan: ec.getTimeShiShenGan(), shiShenZhi: ec.getTimeShiShenZhi(),
    hideGan: ec.getTimeHideGan(), xun: ec.getTimeXun(), xunKong: ec.getTimeXunKong()
  }
}

export function getBaziAnalysis(bazi: BaziInfo): BaziAnalysis {
  const [year, month, day] = bazi.birthDate.split('-').map(Number)
  const solar = Solar.fromYmdHms(year, month, day, bazi.birthTime, 0, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  return {
    pillars: {
      year: buildPillarDetail(ec, 'year'),
      month: buildPillarDetail(ec, 'month'),
      day: buildPillarDetail(ec, 'day'),
      hour: buildPillarDetail(ec, 'hour')
    },
    taiYuan: ec.getTaiYuan(),
    taiYuanNaYin: ec.getTaiYuanNaYin(),
    taiXi: ec.getTaiXi(),
    taiXiNaYin: ec.getTaiXiNaYin(),
    mingGong: ec.getMingGong(),
    mingGongNaYin: ec.getMingGongNaYin(),
    shenGong: ec.getShenGong(),
    shenGongNaYin: ec.getShenGongNaYin(),
    chong: lunar.getChong(),
    chongShengXiao: lunar.getChongShengXiao(),
    sha: lunar.getSha(),
    pengZuGan: lunar.getPengZuGan(),
    pengZuZhi: lunar.getPengZuZhi(),
    jiShen: lunar.getDayJiShen(),
    dayYi: lunar.getDayYi(),
    dayJi: lunar.getDayJi()
  }
}

export function getDaYunList(bazi: BaziInfo): DaYunItem[] {
  const [year, month, day] = bazi.birthDate.split('-').map(Number)
  const solar = Solar.fromYmdHms(year, month, day, bazi.birthTime, 0, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const genderNum = bazi.gender === 'male' ? 1 : 0
  const yun = ec.getYun(genderNum)
  const daYunList = yun.getDaYun()
  const currentYear = new Date().getFullYear()

  return daYunList.map(dy => ({
    ganZhi: dy.getGanZhi(),
    startAge: dy.getStartAge(),
    endAge: dy.getEndAge(),
    startYear: dy.getStartYear(),
    endYear: dy.getEndYear(),
    isCurrent: currentYear >= dy.getStartYear() && currentYear <= dy.getEndYear()
  }))
}

export interface ChineseZodiacAnimal {
  id: string
  name: string
  symbol: string
  element: string
  trait: string
  luckyNumbers: string
  luckyColors: string
  luckyFlowers: string
  description: string
}

export const CHINESE_ZODIAC_ANIMALS: ChineseZodiacAnimal[] = [
  { id: '鼠', name: '子鼠', symbol: '🐀', element: '水', trait: '机智灵活', luckyNumbers: '2、3', luckyColors: '蓝、金、绿', luckyFlowers: '百合、非洲紫罗兰', description: '属鼠之人直觉敏锐，善于发现机遇。应变能力强，能在复杂局面中找到突破口。' },
  { id: '牛', name: '丑牛', symbol: '🐂', element: '土', trait: '勤勉踏实', luckyNumbers: '1、4', luckyColors: '白、金、绿', luckyFlowers: '郁金香、万年青', description: '属牛之人意志坚定，做事有始有终。责任心强，是值得信赖的伙伴。' },
  { id: '虎', name: '寅虎', symbol: '🐅', element: '木', trait: '勇敢果断', luckyNumbers: '1、3', luckyColors: '橙、灰、蓝', luckyFlowers: '菊花', description: '属虎之人天生领袖气质，敢想敢为。自信且富有正义感，勇于挑战困难。' },
  { id: '兔', name: '卯兔', symbol: '🐇', element: '木', trait: '温和聪慧', luckyNumbers: '3、4', luckyColors: '红、粉、紫', luckyFlowers: '兰花、仙人掌', description: '属兔之人心思细腻，善解人意。审美品位高，追求和谐安宁的生活。' },
  { id: '龙', name: '辰龙', symbol: '🐉', element: '土', trait: '气度非凡', luckyNumbers: '1、6', luckyColors: '金、银、灰白', luckyFlowers: '龙爪花、虎尾兰', description: '属龙之人精力充沛，志向远大。天生的魅力与气场，容易成为众人焦点。' },
  { id: '蛇', name: '巳蛇', symbol: '🐍', element: '火', trait: '深谋远虑', luckyNumbers: '2、8', luckyColors: '红、浅黄、黑', luckyFlowers: '兰花、仙人掌', description: '属蛇之人洞察力极强，善于思考。直觉准确，在关键时刻常有独到判断。' },
  { id: '马', name: '午马', symbol: '🐴', element: '火', trait: '自由奔放', luckyNumbers: '2、3', luckyColors: '黄、绿、红', luckyFlowers: '茉莉、牡丹', description: '属马之人热情开朗，行动力强。崇尚自由，不愿被束缚，追求效率与速度。' },
  { id: '羊', name: '未羊', symbol: '🐑', element: '土', trait: '温雅善良', luckyNumbers: '2、7', luckyColors: '绿、红、紫', luckyFlowers: '报春花、茉莉', description: '属羊之人内心柔软，富有同理心。艺术天赋突出，追求生活中的美好事物。' },
  { id: '猴', name: '申猴', symbol: '🐒', element: '金', trait: '聪慧机变', luckyNumbers: '4、9', luckyColors: '白、蓝、金', luckyFlowers: '菊花、兰花', description: '属猴之人思维活跃，学习能力出众。幽默风趣，善于化解尴尬局面。' },
  { id: '鸡', name: '酉鸡', symbol: '🐓', element: '金', trait: '精明勤勉', luckyNumbers: '5、7', luckyColors: '金、棕、黄', luckyFlowers: '剑兰、凤仙花', description: '属鸡之人观察细致，做事讲究条理。直言不讳，对品质有高标准。' },
  { id: '狗', name: '戌狗', symbol: '🐕', element: '土', trait: '忠诚正义', luckyNumbers: '3、4', luckyColors: '红、绿、紫', luckyFlowers: '玫瑰、兰花', description: '属狗之人正直忠厚，重情重义。有强烈的责任心，是可靠的朋友和伙伴。' },
  { id: '猪', name: '亥猪', symbol: '🐖', element: '水', trait: '宽厚豁达', luckyNumbers: '2、5', luckyColors: '黄、灰、棕', luckyFlowers: '绣球花、猪笼草', description: '属猪之人豁达乐观，待人真诚。享受生活的能力很强，容易获得满足感。' }
]

export function getChineseZodiacAnimal(zodiacName: string): ChineseZodiacAnimal | undefined {
  const char = zodiacName.charAt(0)
  return CHINESE_ZODIAC_ANIMALS.find(a => a.id === char)
}

export function getBaziDescription(bazi: BaziInfo): string {
  return `${bazi.yearGanZhi}年 ${bazi.monthGanZhi}月 ${bazi.dayGanZhi}日 ${bazi.hourGanZhi}时`
}

// 五行颜色映射
const WUXING_COLORS: Record<string, string> = {
  '金': '#c78d2a',
  '木': '#55745a',
  '水': '#315d76',
  '火': '#b84a3f',
  '土': '#786d60'
}

export function getWuXingColor(element: string): string {
  return WUXING_COLORS[element] || '#786d60'
}
