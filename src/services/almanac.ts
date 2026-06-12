import { Lunar } from 'lunar-typescript'
import type {
  AlmanacDefaultAdvice,
  AlmanacMappingConfig,
  AlmanacTermMapping,
  DayAlmanac,
  HourAlmanac,
  ModernAdvice,
  ModernScenarioMapping,
  StarMapping
} from '@/types/almanac'
import type { DateKey, TimeBranch } from '@/types/calendar'
import {
  formatDateKey,
  getCalendarFestivalText,
  getCurrentTimeBranchId,
  getLunarDate,
  getLunarMonthDayText,
  getWeekdayText,
  parseDateKey,
  TIME_BRANCHES
} from './calendar'
import { requestJson } from './api'
import { getStorage, setStorage } from './platform'

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const ALMANAC_TERM_MAPPINGS_CACHE_KEY = 'almanac_term_mappings_v1'

const DEFAULT_ADVICE: AlmanacDefaultAdvice = {
  suitable: ['处理日常事务', '整理环境'],
  avoid: ['过度计划', '追求完美'],
  keyword: '顺其自然',
  trait: '节奏平稳',
  guide: '今日平平淡淡，顺其自然即可'
}

const DEFAULT_STAR_MAPPINGS: StarMapping[] = [
  {
    star: '天乙贵人',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['约见重要客户', '向上级汇报工作', '寻求合作支持', '签署合作协议'],
      avoid: ['独自硬扛', '拒绝帮助', '闭门造车'],
      keyword: '贵人相助',
      trait: '人脉顺畅'
    }
  },
  {
    star: '文昌',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['写作创作', '学习备考', '方案策划', '深度阅读'],
      avoid: ['分散注意力', '浅尝辄止', '死记硬背'],
      keyword: '文思泉涌',
      trait: '头脑清晰'
    }
  },
  {
    star: '驿马',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['外出拜访', '商务出差', '提交方案', '运动健身'],
      avoid: ['宅家不动', '拖延行程', '原地踏步'],
      keyword: '主动出击',
      trait: '行动有力'
    }
  },
  {
    star: '六合',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['团队协作', '商务谈判', '朋友聚会', '求助他人'],
      avoid: ['单打独斗', '制造对立', '孤军奋战'],
      keyword: '合作共赢',
      trait: '关系和顺'
    }
  },
  {
    star: '明堂',
    level: 'neutral',
    levelText: '平',
    advice: {
      suitable: ['处理日常事务', '整理环境', '常规会议'],
      avoid: ['过度计划', '追求完美'],
      keyword: '顺其自然',
      trait: '节奏平稳'
    }
  },
  {
    star: '太乙',
    level: 'neutral',
    levelText: '平',
    advice: {
      suitable: ['复盘整理', '修正计划', '补齐文档'],
      avoid: ['仓促定案', '临时变卦'],
      keyword: '稳中求进',
      trait: '适合修整'
    }
  },
  {
    star: '青龙',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['开启新任务', '展示成果', '推进合作'],
      avoid: ['隐藏想法', '错过窗口'],
      keyword: '顺势推进',
      trait: '气势渐开'
    }
  },
  {
    star: '金匮',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['预算规划', '整理账目', '确认资源'],
      avoid: ['冲动消费', '模糊承诺'],
      keyword: '资源入库',
      trait: '适合盘点'
    }
  },
  {
    star: '劫煞',
    level: 'bad',
    levelText: '凶',
    advice: {
      suitable: ['核对细节', '审慎决策'],
      avoid: ['冲动消费', '大额投资', '签署不明条款'],
      keyword: '谨言慎行',
      trait: '风险较高'
    }
  },
  {
    star: '五鬼',
    level: 'bad',
    levelText: '凶',
    advice: {
      suitable: ['保持警惕', '暂缓决策'],
      avoid: ['轻信他人', '夜间远行', '涉足陌生领域'],
      keyword: '保持警惕',
      trait: '宜静不宜动'
    }
  },
  {
    star: '大耗',
    level: 'bad',
    levelText: '凶',
    advice: {
      suitable: ['收缩开支', '检查账单'],
      avoid: ['高风险投资', '盲目囤货', '情绪消费'],
      keyword: '守住边界',
      trait: '容易耗散'
    }
  },
  {
    star: '天德',
    level: 'good',
    levelText: '吉',
    advice: {
      suitable: ['坦诚沟通', '修复关系', '处理难题'],
      avoid: ['压住情绪', '拖延回应'],
      keyword: '化解阻力',
      trait: '缓和有度'
    }
  }
]

const DEFAULT_MODERN_SCENARIOS: ModernScenarioMapping[] = [
  {
    traditional: ['嫁娶', '纳采', '订盟', '会亲友'],
    suitable: ['面试求职', '签署合同', '提交方案', '开启新项目'],
    avoid: ['拖延决策', '回避沟通', '独自硬扛'],
    keyword: '积极主动',
    trait: '积极主动',
    summary: '今日宜开启新事物，主动出击会有好结果'
  },
  {
    traditional: ['入学', '习艺', '求嗣', '祈福'],
    suitable: ['学习充电', '考试备考', '撰写文档', '策划方案'],
    avoid: ['分散注意力', '浅尝辄止', '死记硬背'],
    keyword: '专注深入',
    trait: '专注深入',
    summary: '今日适合深度思考，学习效率高涨'
  },
  {
    traditional: ['出行', '移徙', '纳财', '开市'],
    suitable: ['商务出差', '拜访客户', '团队协作', '社交聚会'],
    avoid: ['宅家不动', '拒绝邀约', '单打独斗'],
    keyword: '人际顺畅',
    trait: '人际顺畅',
    summary: '今日人缘佳，外出社交会有意外收获'
  },
  {
    traditional: ['纳财', '开仓', '栽种', '修造'],
    suitable: ['整理收纳', '复盘总结', '修正计划', '常规会议'],
    avoid: ['冲动决策', '仓促定案', '高风险投资'],
    keyword: '稳扎稳打',
    trait: '稳扎稳打',
    summary: '今日宜守不宜攻，稳定推进即可'
  },
  {
    traditional: ['嫁娶', '纳采', '会亲友', '祭祀'],
    suitable: ['表白告白', '修复关系', '坦诚沟通', '化解矛盾'],
    avoid: ['压抑情绪', '冷战逃避', '情绪争论'],
    keyword: '情感通透',
    trait: '情感通透',
    summary: '今日感情运佳，真诚表达能打动人心'
  },
  {
    traditional: ['出行', '沐浴', '剃头', '整手足甲'],
    suitable: ['运动健身', '户外活动', '突破舒适区', '勇敢尝试'],
    avoid: ['过度懒散', '畏首畏尾', '原地踏步'],
    keyword: '活力充沛',
    trait: '活力充沛',
    summary: '今日精力旺盛，适合挑战和突破'
  },
  {
    traditional: ['纳财', '开市', '立券', '交易'],
    suitable: ['理财规划', '预算审核', '整理账单', '确认资源'],
    avoid: ['冲动消费', '盲目投资', '模糊承诺'],
    keyword: '理性务实',
    trait: '理性务实',
    summary: '今日适合做财务规划，理性分析助力决策'
  },
  {
    traditional: ['裁衣', '作染', '雕刻', '造车器'],
    suitable: ['创意设计', '头脑风暴', '艺术创作', '灵感捕捉'],
    avoid: ['墨守成规', '自我设限', '过度计划'],
    keyword: '灵感涌现',
    trait: '灵感涌现',
    summary: '今日创意爆棚，放飞想象力会有惊喜'
  },
  {
    traditional: ['动土', '破土', '拆卸', '坏垣'],
    suitable: ['重构代码', '调整架构', '变革流程', '大胆改革'],
    avoid: ['维持现状', '抗拒改变', '畏惧风险'],
    keyword: '破旧立新',
    trait: '破旧立新',
    summary: '今日宜突破创新，勇于打破陈规'
  },
  {
    traditional: ['安葬', '启攒', '除服', '成服'],
    suitable: ['归档整理', '结束项目', '清理冗余', '放下过去'],
    avoid: ['拖泥带水', '不舍放手', '执念不放'],
    keyword: '断舍离',
    trait: '断舍离',
    summary: '今日宜告别过往，轻装前行'
  },
  {
    traditional: ['祭祀', '祈福', '求嗣', '酬神'],
    suitable: ['冥想放松', '感恩总结', '调整心态', '自我反思'],
    avoid: ['焦虑担忧', '负能量', '自怨自艾'],
    keyword: '内心安宁',
    trait: '内心安宁',
    summary: '此时静心思考，内心更加平静'
  },
  {
    traditional: ['立券', '交易', '纳财', '开市'],
    suitable: ['签署协议', '确定合作', '达成共识', '商务谈判'],
    avoid: ['模糊承诺', '口头约定', '忽略细节'],
    keyword: '白纸黑字',
    trait: '白纸黑字',
    summary: '今日宜确认协议，避免口说无凭'
  },
  {
    traditional: ['栽种', '牧养', '纳畜', '畋猎'],
    suitable: ['布局未来', '投资学习', '建立习惯', '培养关系'],
    avoid: ['短视近利', '急功近求', '不做准备'],
    keyword: '长远布局',
    trait: '长远布局',
    summary: '今日宜着眼长远，为未来播种'
  },
  {
    traditional: ['修造', '动土', '竖柱', '上梁'],
    suitable: ['优化改进', '修复Bug', '完善细节', '补齐文档'],
    avoid: ['粗制滥造', '敷衍了事', '忽略细节'],
    keyword: '精益求精',
    trait: '精益求精',
    summary: '此时适合完善优化，提升质量'
  },
  {
    traditional: ['移徙', '入宅', '安床', '解除'],
    suitable: ['换工作', '调整方向', '变换环境', '搬家迁居'],
    avoid: ['固守原地', '抗拒改变', '安于现状'],
    keyword: '顺应变化',
    trait: '顺应变化',
    summary: '今日适合顺势而为，拥抱改变'
  }
]

const DEFAULT_ALMANAC_MAPPINGS: AlmanacMappingConfig = {
  version: 'local-2026-06-12',
  updatedAt: '2026-06-12T00:00:00.000Z',
  modernScenarios: DEFAULT_MODERN_SCENARIOS,
  starMappings: DEFAULT_STAR_MAPPINGS,
  defaultAdvice: DEFAULT_ADVICE
}

// 吉神凶神现代解读
const GOD_MODERN: Record<string, { keyword: string; trait: string }> = {
  // 吉神
  '天德': { keyword: '天时护佑', trait: '逢凶化吉' },
  '月德': { keyword: '贵人和合', trait: '人际和谐' },
  '天恩': { keyword: '意外之喜', trait: '好事将近' },
  '母仓': { keyword: '根基稳固', trait: '后勤有力' },
  '生气': { keyword: '生机勃发', trait: '适合创新' },
  '益后': { keyword: '后劲充足', trait: '长远有利' },
  '青龙': { keyword: '气势正旺', trait: '适合展示' },
  '福德': { keyword: '福泽深厚', trait: '适合祈福' },
  '驿马': { keyword: '主动出击', trait: '行动有力' },
  '金匮': { keyword: '资源入库', trait: '适合盘点' },
  '明堂': { keyword: '光明正大', trait: '公开推进' },
  '三合': { keyword: '合作共赢', trait: '关系和顺' },
  '天喜': { keyword: '喜事临门', trait: '心情愉悦' },
  '司命': { keyword: '秩序井然', trait: '适合管理' },
  '天贵': { keyword: '贵人提携', trait: '上运亨通' },
  '天愿': { keyword: '心愿可期', trait: '所求易成' },
  '敬安': { keyword: '安定祥和', trait: '宜守不宜攻' },
  '吉期': { keyword: '吉时已到', trait: '适合决策' },
  '五合': { keyword: '多方契合', trait: '适合合作' },
  '时德': { keyword: '时运正佳', trait: '把握当下' },
  '阳德': { keyword: '阳气充沛', trait: '适合开创' },
  '福生': { keyword: '福气生发', trait: '适合积德' },
  '四相': { keyword: '四方可依', trait: '助力充足' },
  '续世': { keyword: '延续发展', trait: '适合深耕' },
  '六仪': { keyword: '礼仪得当', trait: '适合正式场合' },
  '不将': { keyword: '事无阻碍', trait: '推进顺利' },
  '天乙贵人': { keyword: '贵人相助', trait: '人脉顺畅' },
  '文昌': { keyword: '文思泉涌', trait: '头脑清晰' },
  // 凶神
  '五鬼': { keyword: '保持警惕', trait: '宜静不宜动' },
  '大耗': { keyword: '守住边界', trait: '容易耗散' },
  '劫煞': { keyword: '谨言慎行', trait: '风险较高' },
  '天火': { keyword: '情绪管控', trait: '避免冲突' },
  '月煞': { keyword: '人际缓和', trait: '避免争执' },
  '血支': { keyword: '注意安全', trait: '小心外伤' },
  '归忌': { keyword: '暂缓变动', trait: '守近为宜' },
  '月建': { keyword: '基础动摇', trait: '稳守为上' },
  '土府': { keyword: '根基受阻', trait: '不宜动土' },
  '小耗': { keyword: '微有损耗', trait: '注意细节' },
  '往亡': { keyword: '不宜远行', trait: '守近为宜' },
  '死气': { keyword: '缺乏活力', trait: '宜静养' },
  '天罡': { keyword: '压力较大', trait: '谨慎应对' },
  '游祸': { keyword: '意外风险', trait: '多留缓冲' },
  '天贼': { keyword: '谨防损失', trait: '看好财物' },
  '血忌': { keyword: '健康注意', trait: '不宜手术' },
  '地火': { keyword: '暗藏冲突', trait: '避免争执' },
  '河魁': { keyword: '暗流涌动', trait: '小心行事' }
}

export function getGodKeyword(god: string): string {
  return GOD_MODERN[god]?.keyword || god
}

export function getGodTrait(god: string): string {
  return GOD_MODERN[god]?.trait || '审时度势'
}

let activeMappingConfig = DEFAULT_ALMANAC_MAPPINGS
let hasHydratedMappingCache = false
let termMappingCache: Record<string, ModernScenarioMapping> = {}
let missingTermCache = new Set<string>()
let termMappingRequests = new Map<string, Promise<void>>()

export function getActiveAlmanacMappings(): AlmanacMappingConfig {
  hydrateAlmanacMappingCache()
  return activeMappingConfig
}

export async function loadAlmanacMappings(terms: string[] = []): Promise<AlmanacMappingConfig> {
  hydrateAlmanacMappingCache()

  const normalizedTerms = Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)))
  const termsToLoad = normalizedTerms.filter((term) => !termMappingCache[term] && !missingTermCache.has(term))

  if (termsToLoad.length === 0) {
    return activeMappingConfig
  }

  await Promise.all(termsToLoad.map((term) => loadAlmanacTermMapping(term)))
  rebuildActiveMappingConfig()
  return activeMappingConfig
}

function hydrateAlmanacMappingCache(): void {
  if (hasHydratedMappingCache) return
  hasHydratedMappingCache = true

  const cached = getStorage<Record<string, unknown> | null>(ALMANAC_TERM_MAPPINGS_CACHE_KEY, null)
  if (!isRecord(cached)) {
    return
  }

  Object.entries(cached).forEach(([term, value]) => {
    const mapping = normalizeTermMapping(value, term)
    if (mapping) {
      termMappingCache[term] = mapping
    }
  })
  rebuildActiveMappingConfig()
}

function loadAlmanacTermMapping(term: string): Promise<void> {
  const pending = termMappingRequests.get(term)
  if (pending) {
    return pending
  }

  const request = requestJson<Partial<AlmanacTermMapping>>('/api/almanac/mappings', { term })
    .then((remote) => {
      const mapping = normalizeTermMapping(remote, term)
      if (mapping) {
        termMappingCache[term] = mapping
        setStorage(ALMANAC_TERM_MAPPINGS_CACHE_KEY, termMappingCache)
        return
      }
      missingTermCache.add(term)
    })
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.warn('[almanac:mappings]', term, error)
      }
    })
    .finally(() => {
      termMappingRequests.delete(term)
    })

  termMappingRequests.set(term, request)
  return request
}

function rebuildActiveMappingConfig(): void {
  activeMappingConfig = {
    ...DEFAULT_ALMANAC_MAPPINGS,
    modernScenarios: [...Object.values(termMappingCache), ...DEFAULT_MODERN_SCENARIOS]
  }
}

export function getDayAlmanac(input: Date | string = new Date()): DayAlmanac {
  const date = typeof input === 'string' ? parseDateKey(input) : input
  const dateKey = formatDateKey(date)
  const lunar = Lunar.fromDate(date)
  const currentHourId = getCurrentTimeBranchId()
  const lunarDate = getLunarDate(date)
  const mappingConfig = getActiveAlmanacMappings()

  const traditionalSuitable = lunar.getDayYi()
  const traditionalAvoid = lunar.getDayJi()
  const modernAdvice = getModernAdvice(traditionalSuitable, mappingConfig)

  const hours = getHourAlmanacs(dateKey, currentHourId, mappingConfig)
  const highlightHour = hours.find((hour) => hour.isCurrent) || hours[0]

  return {
    dateKey,
    title: `${date.getMonth() + 1}月${date.getDate()}日`,
    weekdayText: getWeekdayText(date),
    lunarText: `${getSexagenaryYear(lunarDate.year)}年 ${getLunarMonthDayText(date, lunarDate)}`,
    festivalText: getCalendarFestivalText(date, lunarDate),
    clash: `冲${lunar.getChongShengXiao()} 煞${lunar.getSha()}`,
    sexagenary: lunar.getDayInGanZhi(),
    pengzu: `${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`,
    luckyGods: lunar.getDayJiShen().slice(0, 6),
    unluckyGods: ['五鬼', '大耗'],
    traditional: traditionalSuitable,
    traditionalSuitable,
    traditionalAvoid,
    suitable: modernAdvice.suitable,
    avoid: modernAdvice.avoid,
    keyword: modernAdvice.keyword,
    trait: modernAdvice.trait,
    guide: modernAdvice.guide,
    highlightHour,
    hours
  }
}

function getModernAdvice(
  traditionalTerms: string[],
  mappingConfig = getActiveAlmanacMappings()
): ModernAdvice & { guide: string } {
  const defaultAdvice = mappingConfig.defaultAdvice

  if (!traditionalTerms || traditionalTerms.length === 0) {
    return defaultAdvice
  }

  const scenario = mappingConfig.modernScenarios.find((item) =>
    item.traditional.some((term) => traditionalTerms.includes(term))
  )

  if (!scenario) {
    return defaultAdvice
  }

  return {
    suitable: scenario.suitable.slice(0, 3),
    avoid: scenario.avoid,
    keyword: scenario.keyword || scenario.trait,
    trait: scenario.trait,
    guide: scenario.summary
  }
}

export function getHourAlmanacs(
  dateKey: DateKey,
  currentHourId = getCurrentTimeBranchId(),
  mappingConfig = getActiveAlmanacMappings()
): HourAlmanac[] {
  const date = parseDateKey(dateKey)
  const lunar = Lunar.fromDate(date)
  const lunarTimes = lunar.getTimes()
  const seed = getDateSeed(dateKey)
  const starMappings = mappingConfig.starMappings.length > 0 ? mappingConfig.starMappings : DEFAULT_STAR_MAPPINGS

  return TIME_BRANCHES.map((branch, index) => {
    const lunarTime = lunarTimes[index]
    const traditionalSuitable = lunarTime.getYi()
    const traditionalAvoid = lunarTime.getJi()
    const mapping = starMappings[(seed + index) % starMappings.length]
    const hourAdvice = mapping.advice

    return {
      branch,
      star: mapping.star,
      level: mapping.level,
      levelText: mapping.levelText,
      suitable: hourAdvice.suitable,
      avoid: hourAdvice.avoid,
      traditional: traditionalSuitable,
      traditionalSuitable,
      traditionalAvoid,
      keyword: hourAdvice.keyword,
      trait: hourAdvice.trait,
      guide: buildGuide(branch, mapping),
      isCurrent: branch.id === currentHourId
    }
  })
}

export function getDateSeed(dateKey: string): number {
  return dateKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function normalizeTermMapping(value: unknown, fallbackTerm: string): ModernScenarioMapping | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.matched === false) {
    return null
  }

  const storedScenario = normalizeScenarioMapping(value)
  if (storedScenario) {
    return storedScenario
  }

  const term = safeString(value.term, fallbackTerm)
  const suitable = safeStringArray(value.suitable, [])
  const avoid = safeStringArray(value.avoid, [])
  const trait = safeString(value.trait, '')
  const summary = safeString(value.guide, '')

  if (!term || suitable.length === 0 || avoid.length === 0 || !trait || !summary) {
    return null
  }

  const keyword = safeString(value.keyword, trait)
  const category = safeString(value.category, '')
  const priority = typeof value.priority === 'number' && Number.isFinite(value.priority) ? value.priority : undefined

  return {
    traditional: [term],
    suitable,
    avoid,
    keyword,
    trait,
    summary,
    ...(category ? { category } : {}),
    ...(priority !== undefined ? { priority } : {})
  }
}

function normalizeAlmanacMappings(value: unknown): AlmanacMappingConfig | null {
  if (!isRecord(value)) {
    return null
  }

  const modernScenarios = normalizeScenarioMappings(value.modernScenarios)
  const starMappings = normalizeStarMappings(value.starMappings)
  const defaultAdvice = normalizeDefaultAdvice(value.defaultAdvice)

  return {
    version: safeString(value.version, DEFAULT_ALMANAC_MAPPINGS.version),
    updatedAt: safeString(value.updatedAt, DEFAULT_ALMANAC_MAPPINGS.updatedAt),
    modernScenarios,
    starMappings,
    defaultAdvice
  }
}

function normalizeScenarioMappings(value: unknown): ModernScenarioMapping[] {
  if (!Array.isArray(value)) {
    return DEFAULT_MODERN_SCENARIOS
  }

  const mappings = value
    .map((item) => normalizeScenarioMapping(item))
    .filter((item): item is ModernScenarioMapping => Boolean(item))

  return mappings.length > 0 ? mappings : DEFAULT_MODERN_SCENARIOS
}

function normalizeScenarioMapping(value: unknown): ModernScenarioMapping | null {
  if (!isRecord(value)) {
    return null
  }

  const traditional = safeStringArray(value.traditional, [])
  const suitable = safeStringArray(value.suitable, [])
  const avoid = safeStringArray(value.avoid, [])
  const trait = safeString(value.trait, '')
  const summary = safeString(value.summary, '')

  if (traditional.length === 0 || suitable.length === 0 || avoid.length === 0 || !trait || !summary) {
    return null
  }

  const keyword = safeString(value.keyword, trait)
  const category = safeString(value.category, '')
  const priority = typeof value.priority === 'number' && Number.isFinite(value.priority) ? value.priority : undefined

  return {
    traditional,
    suitable,
    avoid,
    keyword,
    trait,
    summary,
    ...(category ? { category } : {}),
    ...(priority !== undefined ? { priority } : {})
  }
}

function normalizeStarMappings(value: unknown): StarMapping[] {
  if (!Array.isArray(value)) {
    return DEFAULT_STAR_MAPPINGS
  }

  const mappings = value
    .map((item) => normalizeStarMapping(item))
    .filter((item): item is StarMapping => Boolean(item))

  return mappings.length > 0 ? mappings : DEFAULT_STAR_MAPPINGS
}

function normalizeStarMapping(value: unknown): StarMapping | null {
  if (!isRecord(value)) {
    return null
  }

  const star = safeString(value.star, '')
  const level = isAuspiciousLevel(value.level) ? value.level : null
  const levelText = value.levelText === '吉' || value.levelText === '平' || value.levelText === '凶' ? value.levelText : null
  const advice = normalizeModernAdvice(value.advice)

  if (!star || !level || !levelText || !advice) {
    return null
  }

  return {
    star,
    level,
    levelText,
    advice
  }
}

function normalizeModernAdvice(value: unknown): ModernAdvice | null {
  if (!isRecord(value)) {
    return null
  }

  const suitable = safeStringArray(value.suitable, [])
  const avoid = safeStringArray(value.avoid, [])
  const keyword = safeString(value.keyword, '')
  const trait = safeString(value.trait, '')

  if (suitable.length === 0 || avoid.length === 0 || !keyword || !trait) {
    return null
  }

  return { suitable, avoid, keyword, trait }
}

function normalizeDefaultAdvice(value: unknown): AlmanacDefaultAdvice {
  if (!isRecord(value)) {
    return DEFAULT_ADVICE
  }

  const suitable = safeStringArray(value.suitable, DEFAULT_ADVICE.suitable)
  const avoid = safeStringArray(value.avoid, DEFAULT_ADVICE.avoid)
  const keyword = safeString(value.keyword, DEFAULT_ADVICE.keyword)
  const trait = safeString(value.trait, DEFAULT_ADVICE.trait)
  const guide = safeString(value.guide, DEFAULT_ADVICE.guide)

  return { suitable, avoid, keyword, trait, guide }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAuspiciousLevel(value: unknown): value is StarMapping['level'] {
  return value === 'good' || value === 'neutral' || value === 'bad'
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function safeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback
  }

  const cleaned = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
  return cleaned.length > 0 ? cleaned : fallback
}

function buildGuide(branch: TimeBranch, mapping: StarMapping): string {
  const suitable = mapping.advice.suitable[0] || '稳步推进'
  const avoid = mapping.advice.avoid[0] || '急躁判断'

  switch (branch.id) {
    case 0:
      return `宜收束心神，适合${suitable}；把杂念放轻，避开${avoid}。`
    case 1:
      return `重在蓄力，先处理${suitable}，不急着做${avoid}相关决定。`
    case 2:
      return `气机初动，可以从${suitable}切入，让行动小而确定。`
    case 3:
      return `适合打开沟通和节奏，优先${suitable}，少碰${avoid}。`
    case 4:
      return `适合定框架，把${suitable}排到前面，关键细节再确认一遍。`
    case 5:
      return `思路渐清，推进${suitable}更顺，遇到${avoid}先放缓。`
    case 6:
      return `精力外放，适合${suitable}，但别因节奏太快忽略边界。`
    case 7:
      return `宜整理余绪，把${suitable}做扎实，避免${avoid}拖累判断。`
    case 8:
      return `适合复核和冲刺，围绕${suitable}推进，先避开${avoid}。`
    case 9:
      return `宜收成果，可以安排${suitable}，把未定事项留出缓冲。`
    case 10:
      return `适合守住节奏，做${suitable}即可，不必强行突破。`
    case 11:
      return `宜安静收尾，适合${suitable}，远离${avoid}带来的消耗。`
    default:
      return `此时宜${suitable}，避开${avoid}，让节奏保持清楚。`
  }
}

function getSexagenaryYear(input: Date | number): string {
  const year = typeof input === 'number' ? input : input.getFullYear()
  return `${HEAVENLY_STEMS[(year - 4) % 10]}${EARTHLY_BRANCHES[(year - 4) % 12]}`
}
