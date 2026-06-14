import type { DateKey } from '@/types/calendar'
import { getDayAlmanac } from '@/services/almanac'

export type BlessingType = 'health' | 'career' | 'love' | 'family' | 'wealth' | 'study'

export interface BlessingTypeConfig {
  id: BlessingType
  label: string
  lampEmoji: string
  flameColor: string
  description: string
}

export interface BlessingRecord {
  type: BlessingType
  wish: string
  dateKey: DateKey
  hourName: string
  createdAt: number
  verse: string
  isGoldHour: boolean
}

export const BLESSING_TYPES: BlessingTypeConfig[] = [
  { id: 'health', label: '安康', lampEmoji: '🪷', flameColor: '#55745a', description: '祈福安康，无病无忧' },
  { id: 'career', label: '前程', lampEmoji: '🏯', flameColor: '#c78d2a', description: '祈福前程，步步高升' },
  { id: 'love',   label: '良缘', lampEmoji: '🏮', flameColor: '#b84a3f', description: '祈福良缘，喜结连理' },
  { id: 'family', label: '家宅', lampEmoji: '🏠', flameColor: '#315d76', description: '祈福家宅，和睦平安' },
  { id: 'wealth', label: '财运', lampEmoji: '💰', flameColor: '#c78d2a', description: '祈福财运，财源广进' },
  { id: 'study',  label: '学业', lampEmoji: '📖', flameColor: '#786d60', description: '祈福学业，金榜题名' }
]

export const BLESSING_VERSES: Record<BlessingType, string[]> = {
  health: ['心诚则灵，身健如松', '百病不侵，四季安康', '养身先养心，心宁体自安', '顺天时调作息，健康自然来'],
  career: ['鹏程万里，大展宏图', '贵人相助，事半功倍', '厚积薄发，终有大成', '稳步前行，功成名就'],
  love:   ['有情人终成眷属', '缘来缘至，喜结良缘', '以诚相待，情路自开', '珍惜眼前人，不负有情人'],
  family: ['家和万事兴', '平安是福，知足常乐', '上慈下孝，家和业兴', '同心同德，幸福长存'],
  wealth: ['财源广进，日进斗金', '勤勉持家，财运亨通', '开源节流，积少成多', '聚沙成塔，厚积薄发'],
  study:  ['金榜题名，学业有成', '勤学苦练，终有所成', '书山有路勤为径', '学海无涯，日日精进']
}

const STORAGE_KEY = 'blessing_records'

function readAllRecords(): BlessingRecord[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as BlessingRecord[]
  } catch {
    // ignore
  }
  return []
}

export function saveBlessingRecord(record: BlessingRecord): void {
  try {
    const all = readAllRecords()
    all.push(record)
    if (all.length > 100) all.splice(0, all.length - 100)
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

export function getRecentBlessings(count = 5): BlessingRecord[] {
  const all = readAllRecords()
  return all.slice(-count).reverse()
}

export function getTodayLitTypes(todayKey: DateKey): Set<BlessingType> {
  try {
    const all = readAllRecords()
    const today = all.filter(b => b.dateKey === todayKey)
    return new Set(today.map(b => b.type))
  } catch {
    return new Set()
  }
}

export function getCurrentHourInfo(todayKey: DateKey): { hourName: string; isGoldHour: boolean } {
  const almanac = getDayAlmanac(todayKey)
  return {
    hourName: almanac.highlightHour.branch.name,
    isGoldHour: almanac.highlightHour.level === 'good'
  }
}

export function getRandomVerse(type: BlessingType): string {
  const verses = BLESSING_VERSES[type]
  return verses[Math.floor(Math.random() * verses.length)]
}

export function getBlessingTypeConfig(type: BlessingType): BlessingTypeConfig {
  return BLESSING_TYPES.find(item => item.id === type) || BLESSING_TYPES[0]
}
