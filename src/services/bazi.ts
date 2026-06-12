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

// ========== 观时·现代解读 ==========

// 五行现代含义
const WUXING_MODERN: Record<string, { keyword: string; modern: string; insight: string }> = {
  '金': { keyword: '决断', modern: '果决高效，擅长取舍与执行，适合管理、决策类工作', insight: '锋芒过刚易折，适时收剑方为上策' },
  '木': { keyword: '成长', modern: '创造力强，善于开拓与学习，适合策划、设计类工作', insight: '枝繁叶茂需扎根，厚积方能薄发' },
  '水': { keyword: '变通', modern: '灵活机敏，善于沟通与变通，适合谈判、咨询类工作', insight: '水利万物而不争，柔能克刚' },
  '火': { keyword: '热情', modern: '热情主动，感染力强，适合演讲、营销类工作', insight: '心火太旺易伤身，静心方能长久' },
  '土': { keyword: '稳重', modern: '踏实可靠，擅长统筹与保障，适合行政、财务类工作', insight: '大地承载万物，厚德方能载物' }
}

export function getWuXingModern(element: string) {
  return WUXING_MODERN[element] || { keyword: '平衡', modern: '五行均衡，适应力强', insight: '中庸之道，不偏不倚' }
}

// 日主（日干）性格解读
const DAY_GAN_READING: Record<string, { trait: string; modern: string; insight: string }> = {
  '甲': { trait: '参天大树', modern: '天性正直，有担当有领导力，但有时过于固执。适合做团队核心，引领方向', insight: '大树不为风折，却需懂得弯腰' },
  '乙': { trait: '柔藤攀木', modern: '灵活变通，善于合作与借力，情商高。适合做协调者，在关系中找到自己的位置', insight: '柔而不弱，顺势而为亦是智慧' },
  '丙': { trait: '太阳普照', modern: '热情开朗，感染力强，天生聚光灯体质。适合需要表达和展示的工作', insight: '光芒太盛亦会刺眼，留些温暖给身边人' },
  '丁': { trait: '灯烛之光', modern: '细腻专注，洞察力强，擅长时间深耕一个领域。适合研究、技术类工作', insight: '灯虽小而长明，细水方能长流' },
  '戊': { trait: '厚土载物', modern: '稳重可靠，格局大，能承载压力和责任。适合做组织的压舱石', insight: '泰山不拒细壤，故能成其大' },
  '己': { trait: '沃土育物', modern: '包容细心，善于培育和支持，是团队中不可或缺的幕后力量', insight: '甘为人梯亦是担当，成就他人即成就自己' },
  '庚': { trait: '利剑淬火', modern: '果断利落，执行力强，适合攻坚和改革类任务。需要学会刚柔并济', insight: '剑锋过锐易断，留一分柔和保全身' },
  '辛': { trait: '珠玉明鉴', modern: '精致敏锐，品味高，追求品质与细节。适合精品化、精细化方向的工作', insight: '瑕不掩瑜，追求完美也要接纳不完美' },
  '壬': { trait: '大海奔流', modern: '格局宏大，思维开阔，善于整合资源。适合战略规划和大局统筹', insight: '海纳百川有容乃大，但需有方向才不迷失' },
  '癸': { trait: '春雨润物', modern: '润物无声，善于潜移默化地影响他人，直觉敏锐。适合创意、顾问类工作', insight: '雨虽细可润万物，小处着手大处着眼' }
}

export function getDayGanReading(dayGan: string) {
  const gan = dayGan.charAt(0)
  return DAY_GAN_READING[gan] || { trait: '中立平和', modern: '性格平和，适应力强', insight: '守中致和，不偏不倚' }
}

// 十神现代角色
const SHISHEN_ROLES: Record<string, { role: string; advice: string }> = {
  '正官': { role: '规则意识强，尊重秩序', advice: '适合体制内或规范化管理岗位' },
  '偏官': { role: '果断有魄力，敢于突破', advice: '适合开拓型、变革型任务' },
  '正印': { role: '善于学习，重视精神成长', advice: '适合教育、研究、文化传播' },
  '偏印': { role: '思维独特，有创新视角', advice: '适合技术、设计、策略规划' },
  '正财': { role: '稳健务实，财运稳定', advice: '适合长期投资、稳定经营' },
  '偏财': { role: '投资直觉好，善于抓机会', advice: '适合创业、商务拓展' },
  '食神': { role: '创造力强，享受生活', advice: '适合内容创作、美食、生活方式' },
  '伤官': { role: '个性鲜明，善于表达', advice: '适合艺术、自媒体、独立创作' },
  '比肩': { role: '独立自主，竞争力强', advice: '适合个人品牌、独立发展' },
  '劫财': { role: '行动力强，敢于冒险', advice: '适合竞争型、高回报领域' }
}

export function getShiShenRole(term: string) {
  return SHISHEN_ROLES[term] || { role: '综合平衡', advice: '多元发展，审时度势' }
}

// 命宫解读
const MINGGONG_READING: Record<string, string> = {
  '子': '内心敏锐，善谋略，宜从事需要深思熟虑的工作',
  '丑': '踏实勤勉，耐力强，宜长期深耕一个领域',
  '寅': '志向远大，行动力强，宜开拓性事业',
  '卯': '温和聪慧，善社交，宜人际密集型工作',
  '辰': '格局大，善统筹，宜管理岗位',
  '巳': '思维深邃，直觉强，宜研究策划类',
  '午': '热情大方，感染力强，宜台前展示类',
  '未': '包容细腻，善培育，宜教育服务类',
  '申': '机变灵活，善应变，宜谈判商务类',
  '酉': '精致严谨，品质感强，宜技术专业类',
  '戌': '忠诚可靠，责任心强，宜组织保障类',
  '亥': '豁达通透，善谋全局，宜战略规划类'
}

export function getMingGongReading(mingGong: string): string {
  const zhi = mingGong.charAt(mingGong.length - 1)
  return MINGGONG_READING[zhi] || '命宫格局稳健，宜审时度势'
}

// 大运阶段解读
const DAYUN_PHASE: Record<string, { phase: string; insight: string }> = {
  '甲': { phase: '成长期', insight: '如树拔节，蓄力向上' },
  '乙': { phase: '合作期', insight: '借力而行，互利共生' },
  '丙': { phase: '高光期', insight: '光芒正盛，把握舞台' },
  '丁': { phase: '深耕期', insight: '灯明长夜，静心精进' },
  '戊': { phase: '稳固期', insight: '厚土承压，筑牢根基' },
  '己': { phase: '育成期', insight: '润物无声，收获在前' },
  '庚': { phase: '变革期', insight: '利刃出鞘，果断抉择' },
  '辛': { phase: '精修期', insight: '打磨细节，品质为王' },
  '壬': { phase: '拓展期', insight: '海阔天空，大格局行' },
  '癸': { phase: '沉淀期', insight: '细水长流，厚积薄发' }
}

export function getDaYunReading(ganZhi: string) {
  const gan = ganZhi.charAt(0)
  return DAYUN_PHASE[gan] || { phase: '平稳期', insight: '守正出奇，静待时机' }
}
