// 月相 - 古今禅意融合
export type MoonPhase = 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent'

export interface MoonInfo {
  phase: MoonPhase
  phaseName: string
  phaseEmoji: string
  illumination: number
  ancient: string
  modern: string
  insight: string
  suitable: string[]
  avoid: string[]
}

const MOON_PHASE_WISDOM: Record<MoonPhase, Omit<MoonInfo, 'phase' | 'illumination'>> = {
  'new': {
    phaseName: '新月',
    phaseEmoji: '🌑',
    ancient: '朔月无光，万籁俱寂',
    modern: '归零重启，适合定目标制定计划',
    insight: '月缺是圆的开始，结束即是新生',
    suitable: ['制定计划', '设定目标', '冥想反思'],
    avoid: ['冲动决策', '仓促行动', '展示成果']
  },
  'waxing-crescent': {
    phaseName: '娥眉月',
    phaseEmoji: '🌒',
    ancient: '新月初生，蛾眉渐显',
    modern: '播种阶段，埋下希望的种子',
    insight: '星星之火，可以燎原',
    suitable: ['学习新技能', '开启新项目', '建立新习惯'],
    avoid: ['急于求成', '放弃努力', '自我怀疑']
  },
  'first-quarter': {
    phaseName: '上弦月',
    phaseEmoji: '🌓',
    ancient: '上弦如弓，蓄势待发',
    modern: '蓄力成长，适合学习充电',
    insight: '半途之月，坚持才能圆满',
    suitable: ['努力学习', '深度思考', '积累经验'],
    avoid: ['半途而废', '怀疑自己', '消极懈怠']
  },
  'waxing-gibbous': {
    phaseName: '盈凸月',
    phaseEmoji: '🌔',
    ancient: '月华渐盈，近乎圆满',
    modern: '冲刺阶段，全力以赴',
    insight: '行百里者半九十，再坚持一下',
    suitable: ['推进项目', '冲刺目标', '完善细节'],
    avoid: ['骄傲自满', '松懈大意', '功亏一篑']
  },
  'full': {
    phaseName: '满月',
    phaseEmoji: '🌕',
    ancient: '月满则亏，盛极必衰',
    modern: '圆满高峰，适合展示成果',
    insight: '物极必反，功成身退',
    suitable: ['展示成果', '庆祝成功', '分享经验'],
    avoid: ['得意忘形', '过度膨胀', '忽视危机']
  },
  'waning-gibbous': {
    phaseName: '亏凸月',
    phaseEmoji: '🌖',
    ancient: '盛极而衰，盈满而亏',
    modern: '内省沉淀，适合复盘总结',
    insight: '高处不胜寒，适时回归',
    suitable: ['总结复盘', '反思改进', '感恩回馈'],
    avoid: ['继续扩张', '盲目乐观', '忽视风险']
  },
  'last-quarter': {
    phaseName: '下弦月',
    phaseEmoji: '🌗',
    ancient: '下弦如弓，物极必反',
    modern: '放下执念，断舍离',
    insight: '月缺未必是坏事，留白才有空间',
    suitable: ['清理整顿', '断舍离', '休息调整'],
    avoid: ['强求圆满', '死守执念', '过度消耗']
  },
  'waning-crescent': {
    phaseName: '残月',
    phaseEmoji: '🌘',
    ancient: '月近晦朔，静待新生',
    modern: '沉淀蛰伏，养精蓄锐',
    insight: '黎明前最黑暗，坚持就是胜利',
    suitable: ['休息放松', '内省修炼', '等待时机'],
    avoid: ['强行推进', '过度焦虑', '自我否定']
  }
}

export function getMoonPhase(date: Date): MoonInfo {
  const knownNewMoon = new Date('2000-01-06').getTime()
  const lunarCycle = 29.53058867 * 24 * 60 * 60 * 1000

  const elapsed = date.getTime() - knownNewMoon
  const phase = (elapsed % lunarCycle) / lunarCycle

  let moonPhase: MoonPhase
  let illumination: number

  if (phase < 0.0625) {
    moonPhase = 'new'
    illumination = 0
  } else if (phase < 0.1875) {
    moonPhase = 'waxing-crescent'
    illumination = Math.round(phase * 400)
  } else if (phase < 0.3125) {
    moonPhase = 'first-quarter'
    illumination = 50
  } else if (phase < 0.4375) {
    moonPhase = 'waxing-gibbous'
    illumination = Math.round(50 + (phase - 0.25) * 200)
  } else if (phase < 0.5625) {
    moonPhase = 'full'
    illumination = 100
  } else if (phase < 0.6875) {
    moonPhase = 'waning-gibbous'
    illumination = Math.round(100 - (phase - 0.5) * 200)
  } else if (phase < 0.8125) {
    moonPhase = 'last-quarter'
    illumination = 50
  } else {
    moonPhase = 'waning-crescent'
    illumination = Math.round(100 - phase * 100)
  }

  return {
    phase: moonPhase,
    illumination,
    ...MOON_PHASE_WISDOM[moonPhase]
  }
}

export function getMoonEmoji(phase: MoonPhase): string {
  return MOON_PHASE_WISDOM[phase].phaseEmoji
}
