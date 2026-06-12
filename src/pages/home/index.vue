<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import HourAdviceCard from '@/components/HourAdviceCard.vue'
import TimeCompass from '@/components/TimeCompass.vue'
import TimelineView from '@/components/TimelineView.vue'
import type { DayAlmanac, HourAlmanac } from '@/types/almanac'
import type { CalendarDay, DateKey, HolidayItem } from '@/types/calendar'
import { formatDateKey, getMonthCalendar, getTodayKey, isDateKey, parseDateKey, WEEKDAYS } from '@/services/calendar'
import { fetchDayAlmanac, getDayAlmanac } from '@/services/almanac'
import { applyHolidayItems, fetchHolidayMonth } from '@/services/holidays'
import { getZodiacById, getZodiacFortune } from '@/services/zodiac'
import { getStorage, lightHaptic, setStorage, trackEvent } from '@/services/platform'
import { getNextSolarTerm, getSolarTermByDate } from '@/services/solar-terms'
import { getPeriodByDate } from '@/services/seventy-two-periods'
import { getSeasonSpecial } from '@/services/season-special'
import { getMoonPhase } from '@/services/moon-phase'
import { OCCASIONS } from '@/services/lucky-days'

type ViewMode = 'compass' | 'timeline'
type CalendarViewMode = 'year' | 'month' | 'week' | 'day'
type InfoDetail = 'moon' | 'term' | 'period' | 'season'

interface YearMonthItem {
  month: number
  label: string
  subtitle: string
  isCurrent: boolean
  isSelected: boolean
  signalText: string
}

const CALENDAR_VIEW_OPTIONS: Array<{ id: CalendarViewMode; label: string }> = [
  { id: 'year', label: '年' },
  { id: 'month', label: '月' },
  { id: 'week', label: '周' },
  { id: 'day', label: '日' }
]

const todayKey = getTodayKey()
const storedSelected = getStorage('selected_date', todayKey)
const initialSelected = isDateKey(storedSelected) ? storedSelected : todayKey
const initialDate = parseDateKey(initialSelected)
const storedViewMode = getStorage<string>('time_view_preference', 'compass')
const storedCalendarView = getStorage<string>('calendar_view_preference', 'month')

const currentYear = ref(initialDate.getFullYear())
const currentMonth = ref(initialDate.getMonth() + 1)
const selectedDateKey = ref<DateKey>(initialSelected)
const touchStartX = ref(0)
const viewMode = ref<ViewMode>(storedViewMode === 'timeline' ? 'timeline' : 'compass')
const calendarViewMode = ref<CalendarViewMode>(isCalendarViewMode(storedCalendarView) ? storedCalendarView : 'month')
const isMenuOpen = ref(false)
const isTraditionalOpen = ref(false)
const selectedHourId = ref(0)
const zodiacId = ref<string | null>(getStorage('user_zodiac_sign', null))
const remoteHolidayItems = ref<HolidayItem[]>([])
const activeInfoDetail = ref<InfoDetail | null>(null)

let holidayRequestId = 0
let almanacRequestId = 0

const baseMonthCalendar = computed(() => getMonthCalendar(currentYear.value, currentMonth.value, selectedDateKey.value))
const monthCalendar = computed(() => applyHolidayItems(baseMonthCalendar.value, remoteHolidayItems.value))
const selectedDay = computed(() => monthCalendar.value.days.find((day) => day.dateKey === selectedDateKey.value))
const selectedAlmanac = ref(getDayAlmanac(selectedDateKey.value))
const zodiacSign = computed(() => getZodiacById(zodiacId.value))
const zodiacFortunePreview = computed(() => {
  if (!zodiacId.value || !zodiacSign.value) return null
  return getZodiacFortune(zodiacId.value, selectedDateKey.value)
})
const selectedDate = computed(() => parseDateKey(selectedDateKey.value))
const currentMonthDay = computed(() => {
  const d = selectedDate.value
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
const solarTermData = computed(() => getSolarTermByDate(currentMonthDay.value))
const activeSolarTerm = computed(() => solarTermData.value || getNextSolarTerm(selectedDate.value))
const solarTermStatus = computed(() => {
  const term = activeSolarTerm.value
  if (!term) return ''
  if (solarTermData.value) return '今日节气'
  return `下个节气 · ${getDaysUntilMonthDay(selectedDate.value, term.date)}天后`
})
const periodData = computed(() => getPeriodByDate(currentMonthDay.value))
const seasonSpecial = computed(() => getSeasonSpecial(selectedDate.value))
const seasonSpecialTitle = computed(() => {
  const item = seasonSpecial.value
  if (!item) return ''
  if (item.type === 'countNine') return item.data.name
  return `${item.data.period}第${item.data.day}天`
})
const seasonSpecialSubtitle = computed(() => {
  const item = seasonSpecial.value
  if (!item) return '非数九/三伏'
  if (item.type === 'countNine') return `第${item.data.day}/${item.data.total}天`
  return `${item.data.day}/${item.data.totalDays}天`
})
const seasonSpecialSummary = computed(() => {
  const item = seasonSpecial.value
  if (!item) return '当前不在数九或三伏，按日常时令节奏安排即可'
  return item.data.modern
})
const moonPhase = computed(() => getMoonPhase(selectedDate.value))
const visibleCalendarDays = computed(() => {
  if (calendarViewMode.value === 'month') {
    return monthCalendar.value.days
  }

  const selectedIndex = monthCalendar.value.days.findIndex((day) => day.dateKey === selectedDateKey.value)
  const fallbackIndex = Math.max(0, monthCalendar.value.days.findIndex((day) => day.isCurrentMonth))
  const dayIndex = selectedIndex >= 0 ? selectedIndex : fallbackIndex

  if (calendarViewMode.value === 'week') {
    const weekStart = Math.floor(dayIndex / 7) * 7
    return monthCalendar.value.days.slice(weekStart, weekStart + 7)
  }

  if (calendarViewMode.value === 'day') {
    const day = monthCalendar.value.days[dayIndex]
    return day ? [day] : []
  }

  return []
})
const yearMonths = computed<YearMonthItem[]>(() => {
  const today = parseDateKey(todayKey)
  const selectedDate = parseDateKey(selectedDateKey.value)

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const calendar = getMonthCalendar(currentYear.value, month, selectedDateKey.value)
    const monthDays = calendar.days.filter((day) => day.isCurrentMonth)
    const isCurrent = currentYear.value === today.getFullYear() && month === today.getMonth() + 1
    const isSelected = currentYear.value === selectedDate.getFullYear() && month === selectedDate.getMonth() + 1
    const signalText =
      monthDays.find((day) => day.festival)?.festival ||
      monthDays.find((day) => day.solarTerm)?.solarTerm ||
      `${monthDays.length}天`

    return {
      month,
      label: `${month}月`,
      subtitle: isSelected ? '已选' : isCurrent ? '本月' : `${monthDays.length}天`,
      signalText,
      isCurrent,
      isSelected
    }
  })
})
const calendarTitle = computed(() => {
  if (calendarViewMode.value === 'year') {
    return `${currentYear.value}年`
  }

  if (calendarViewMode.value === 'week') {
    const firstDay = visibleCalendarDays.value[0]
    const lastDay = visibleCalendarDays.value[visibleCalendarDays.value.length - 1]
    if (firstDay && lastDay) {
      return `${firstDay.year}年${firstDay.month}月${firstDay.day}日 至 ${lastDay.month}月${lastDay.day}日`
    }
  }

  if (calendarViewMode.value === 'day' && selectedDay.value) {
    return `${selectedDay.value.year}年${selectedDay.value.month}月${selectedDay.value.day}日`
  }

  return `${currentYear.value}年${currentMonth.value}月`
})
const previousActionLabel = computed(() => {
  if (calendarViewMode.value === 'year') return '上一年'
  if (calendarViewMode.value === 'week') return '上一周'
  if (calendarViewMode.value === 'day') return '前一天'
  return '上一月'
})
const nextActionLabel = computed(() => {
  if (calendarViewMode.value === 'year') return '下一年'
  if (calendarViewMode.value === 'week') return '下一周'
  if (calendarViewMode.value === 'day') return '后一天'
  return '下一月'
})

onShow(() => {
  const stored = getStorage('selected_date', selectedDateKey.value)
  if (isDateKey(stored)) {
    selectedDateKey.value = stored
    const storedDate = parseDateKey(stored)
    currentYear.value = storedDate.getFullYear()
    currentMonth.value = storedDate.getMonth() + 1
  }
  zodiacId.value = getStorage('user_zodiac_sign', null)
})

watch(
  selectedDateKey,
  (dateKey) => {
    void loadSelectedAlmanac(dateKey)
  },
  { immediate: true }
)

watch(
  [currentYear, currentMonth],
  () => {
    void loadHolidayData()
  },
  { immediate: true }
)

async function loadHolidayData(): Promise<void> {
  const requestId = ++holidayRequestId
  remoteHolidayItems.value = []

  try {
    const result = await fetchHolidayMonth(currentYear.value, currentMonth.value)
    if (requestId !== holidayRequestId) return
    remoteHolidayItems.value = result.holidays
  } catch (error) {
    if (requestId !== holidayRequestId) return
    remoteHolidayItems.value = []
    if (import.meta.env.DEV) {
      console.warn('[holiday:fetch]', error)
    }
  }
}

async function loadSelectedAlmanac(dateKey: DateKey): Promise<void> {
  const requestId = ++almanacRequestId
  const localAlmanac = getDayAlmanac(dateKey)
  selectedAlmanac.value = localAlmanac
  selectedHourId.value = getDefaultHourId(localAlmanac)

  const loadedAlmanac = await fetchDayAlmanac(dateKey)
  if (requestId !== almanacRequestId || dateKey !== selectedDateKey.value) return

  selectedAlmanac.value = loadedAlmanac
  if (!loadedAlmanac.hours.some((hour) => hour.branch.id === selectedHourId.value)) {
    selectedHourId.value = getDefaultHourId(loadedAlmanac)
  }
}

function getDefaultHourId(almanac: DayAlmanac): number {
  return almanac.highlightHour.branch.id
}

function persistSelected(dateKey: DateKey): void {
  setStorage('selected_date', dateKey)
  setStorage('last_month', `${currentYear.value}-${currentMonth.value}`)
}

function updateSelectedDate(date: Date): DateKey {
  const nextSelectedKey = formatDateKey(date)
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth() + 1
  selectedDateKey.value = nextSelectedKey
  persistSelected(nextSelectedKey)
  return nextSelectedKey
}

function changeCalendar(offset: number): void {
  if (calendarViewMode.value === 'year') {
    changeYear(offset)
    return
  }

  if (calendarViewMode.value === 'week') {
    shiftSelectedDate(offset * 7, 'week')
    return
  }

  if (calendarViewMode.value === 'day') {
    shiftSelectedDate(offset, 'day')
    return
  }

  changeMonth(offset)
}

function changeMonth(offset: number): void {
  const currentSelectedDate = parseDateKey(selectedDateKey.value)
  const next = new Date(currentYear.value, currentMonth.value - 1 + offset, 1)
  const nextYear = next.getFullYear()
  const nextMonth = next.getMonth() + 1
  const nextMonthDays = new Date(nextYear, nextMonth, 0).getDate()
  const nextSelectedDay = Math.min(currentSelectedDate.getDate(), nextMonthDays)
  const nextSelectedKey = updateSelectedDate(new Date(nextYear, nextMonth - 1, nextSelectedDay))

  trackEvent('calendar_month_swipe', {
    direction: offset > 0 ? 'next' : 'prev',
    target_month: `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
  })
}

function changeYear(offset: number): void {
  const currentSelectedDate = parseDateKey(selectedDateKey.value)
  const nextYear = currentYear.value + offset
  const nextMonth = currentMonth.value
  const nextMonthDays = new Date(nextYear, nextMonth, 0).getDate()
  const nextSelectedDay = Math.min(currentSelectedDate.getDate(), nextMonthDays)
  const nextSelectedKey = updateSelectedDate(new Date(nextYear, nextMonth - 1, nextSelectedDay))

  trackEvent('calendar_year_change', {
    direction: offset > 0 ? 'next' : 'prev',
    selected_date: nextSelectedKey
  })
}

function shiftSelectedDate(days: number, view: 'week' | 'day'): void {
  const nextDate = parseDateKey(selectedDateKey.value)
  nextDate.setDate(nextDate.getDate() + days)
  const nextSelectedKey = updateSelectedDate(nextDate)

  trackEvent('calendar_date_shift', {
    direction: days > 0 ? 'next' : 'prev',
    view,
    selected_date: nextSelectedKey
  })
}

function selectDay(day: CalendarDay): void {
  updateSelectedDate(day.date)
  trackEvent('date_select', {
    selected_date: day.dateKey,
    is_today: day.isToday
  })
}

function selectMonth(month: number): void {
  const currentSelectedDate = parseDateKey(selectedDateKey.value)
  const nextMonthDays = new Date(currentYear.value, month, 0).getDate()
  const nextSelectedDay = Math.min(currentSelectedDate.getDate(), nextMonthDays)
  const nextSelectedKey = updateSelectedDate(new Date(currentYear.value, month - 1, nextSelectedDay))

  calendarViewMode.value = 'month'
  setStorage('calendar_view_preference', 'month')
  trackEvent('calendar_year_month_select', {
    selected_month: month,
    selected_date: nextSelectedKey
  })
}

function goToday(): void {
  updateSelectedDate(new Date())
}

function onTouchStart(event: TouchEvent): void {
  touchStartX.value = event.changedTouches?.[0]?.clientX || 0
}

function onTouchEnd(event: TouchEvent): void {
  const endX = event.changedTouches?.[0]?.clientX || 0
  const delta = endX - touchStartX.value
  if (Math.abs(delta) < 48) return
  changeCalendar(delta > 0 ? -1 : 1)
}

function toggleInfoDetail(detail: InfoDetail): void {
  activeInfoDetail.value = activeInfoDetail.value === detail ? null : detail
}

function toggleSeasonDetail(): void {
  if (!seasonSpecial.value) return
  toggleInfoDetail('season')
}

function getDaysUntilMonthDay(fromDate: Date, monthDay: string): number {
  const [month, day] = monthDay.split('-').map(Number)
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  let target = new Date(fromDate.getFullYear(), month - 1, day)

  if (target < start) {
    target = new Date(fromDate.getFullYear() + 1, month - 1, day)
  }

  return Math.round((target.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

function toggleTraditional(): void {
  isTraditionalOpen.value = !isTraditionalOpen.value
}

function isCalendarViewMode(value: string): value is CalendarViewMode {
  return value === 'year' || value === 'month' || value === 'week' || value === 'day'
}

function openMenu(): void {
  isMenuOpen.value = true
  trackEvent('calendar_menu_open', {
    current_view: calendarViewMode.value
  })
}

function closeMenu(): void {
  isMenuOpen.value = false
}

function setCalendarViewMode(mode: CalendarViewMode): void {
  if (calendarViewMode.value !== mode) {
    const from = calendarViewMode.value
    calendarViewMode.value = mode
    setStorage('calendar_view_preference', mode)
    trackEvent('calendar_view_change', {
      from_view: from,
      to_view: mode,
      source: 'side_menu'
    })
  }
  closeMenu()
}

function openSettings(): void {
  trackEvent('calendar_settings_click', {
    source: 'side_menu'
  })
}

function setViewMode(mode: ViewMode): void {
  if (viewMode.value === mode) return
  const from = viewMode.value
  viewMode.value = mode
  setStorage('time_view_preference', mode)
  trackEvent('time_view_toggle', {
    from_view: from,
    to_view: mode,
    source: 'home_inline_detail'
  })
}

function selectHour(hour: HourAlmanac, action: 'tap'): void {
  selectedHourId.value = hour.branch.id
  lightHaptic()
  trackEvent(viewMode.value === 'compass' ? 'compass_interact' : 'timeline_interact', {
    action,
    selected_hour: hour.branch.name,
    source: 'home_inline_detail'
  })
}

function openZodiac(): void {
  trackEvent('zodiac_entry_click', {
    has_set_zodiac: Boolean(zodiacId.value),
    source: 'home_inline_detail'
  })
  uni.navigateTo({
    url: `/pages/zodiac/index?date=${selectedDateKey.value}`
  })
}

function openLuckyDays(): void {
  trackEvent('lucky_days_entry_click', {
    source: 'home_inline_detail'
  })
  uni.navigateTo({
    url: `/pages/lucky-days/index?date=${selectedDateKey.value}`
  })
}

function openBazi(): void {
  trackEvent('bazi_entry_click', {
    source: 'home_inline_detail'
  })
  uni.navigateTo({
    url: '/pages/bazi/index'
  })
}
</script>

<template>
  <view class="safe-page home-page">
    <view class="drawer-layer" :class="{ 'drawer-layer-open': isMenuOpen }" @tap="closeMenu">
      <view class="side-menu" @tap.stop>
        <view class="side-menu-head">
          <view class="side-date">
            <text class="side-date-main">{{ currentYear }}年{{ currentMonth }}月</text>
            <text class="side-date-sub">{{ selectedAlmanac.weekdayText }}</text>
          </view>
          <button class="settings-button" aria-label="设置" @tap.stop="openSettings">⚙</button>
        </view>
        <view class="calendar-view-list">
          <button
            v-for="option in CALENDAR_VIEW_OPTIONS"
            :key="option.id"
            class="calendar-view-button"
            :class="{ 'calendar-view-button-active': calendarViewMode === option.id }"
            @tap="setCalendarViewMode(option.id)"
          >
            {{ option.label }}
          </button>
        </view>
      </view>
    </view>

    <view class="menu-top-row">
      <button class="menu-trigger" aria-label="打开菜单" @tap="openMenu">
        <view class="menu-lines">
          <text class="menu-line"></text>
          <text class="menu-line"></text>
          <text class="menu-line"></text>
        </view>
        <text class="menu-dot"></text>
      </button>
      <view class="nav-actions">
        <button class="icon-button" :aria-label="previousActionLabel" @tap="changeCalendar(-1)">‹</button>
        <button class="icon-button" :aria-label="nextActionLabel" @tap="changeCalendar(1)">›</button>
        <button class="text-button" @tap="goToday">今日</button>
      </view>
    </view>

    <view class="monthbar">
      <text class="topbar-date">{{ calendarTitle }}</text>
    </view>

    <view v-if="selectedDay?.holidayName || selectedDay?.festival || selectedDay?.solarTerm" class="day-signal">
      <text>{{ selectedDay?.holidayName || selectedDay?.festival || selectedDay?.solarTerm }}</text>
    </view>

    <view class="calendar-shell" :class="`calendar-shell-${calendarViewMode}`" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <view v-if="calendarViewMode === 'year'" class="year-grid">
        <view
          v-for="month in yearMonths"
          :key="month.month"
          class="year-month-card"
          :class="{
            'year-month-current': month.isCurrent,
            'year-month-selected': month.isSelected
          }"
          @tap="selectMonth(month.month)"
        >
          <view class="year-month-top">
            <text class="year-month-label">{{ month.label }}</text>
            <text class="year-month-badge">{{ month.subtitle }}</text>
          </view>
          <text class="year-month-signal">{{ month.signalText }}</text>
        </view>
      </view>
      <template v-else>
        <view v-if="calendarViewMode !== 'day'" class="weekday-row">
          <text v-for="weekday in WEEKDAYS" :key="weekday">{{ weekday }}</text>
        </view>
        <view
          class="calendar-grid"
          :class="{
            'calendar-grid-week': calendarViewMode === 'week',
            'calendar-grid-day': calendarViewMode === 'day'
          }"
        >
          <view
            v-for="day in visibleCalendarDays"
            :key="day.dateKey"
            class="date-cell"
            :class="{
              'date-cell-muted': !day.isCurrentMonth,
              'date-cell-today': day.isToday,
              'date-cell-selected': day.isSelected,
              'date-cell-weekend': day.weekday === 0 || day.weekday === 6,
              'date-cell-day': calendarViewMode === 'day'
            }"
            @tap="selectDay(day)"
          >
            <text v-if="day.holidayTag" class="date-tag" :class="{ 'date-tag-work': day.holidayTag === '班' }">{{ day.holidayTag }}</text>
            <view class="date-head">
              <text class="date-number">{{ day.day }}</text>
            </view>
            <text class="date-lunar">{{ day.solarTerm || day.festival || day.lunarLabel }}</text>
          </view>
        </view>
      </template>
    </view>

    <view class="inline-detail">
      <!-- 日期标题 -->
      <view class="date-hero">
        <text class="hero-date">{{ selectedAlmanac.title }} {{ selectedAlmanac.weekdayText }}</text>
        <text class="hero-lunar">{{ selectedAlmanac.lunarText }}</text>
        <text v-if="selectedAlmanac.festivalText" class="hero-festival">{{ selectedAlmanac.festivalText }}</text>
      </view>

      <!-- 时令信息 -->
      <view class="info-grid">
        <view
          v-if="moonPhase"
          class="info-card info-card-action"
          :class="{ 'info-card-active': activeInfoDetail === 'moon' }"
          @tap="toggleInfoDetail('moon')"
        >
          <view class="info-card-head">
            <text class="info-icon">{{ moonPhase.phaseEmoji }}</text>
            <view class="info-copy">
              <text class="info-title">{{ moonPhase.phaseName }}</text>
              <text class="info-subtitle">月光{{ moonPhase.illumination }}%</text>
            </view>
            <text class="info-action">{{ activeInfoDetail === 'moon' ? '收起' : '详情' }}</text>
          </view>
          <text class="info-summary">{{ moonPhase.modern }}</text>
        </view>
        <view
          v-if="activeSolarTerm"
          class="info-card info-card-action"
          :class="{ 'info-card-active': activeInfoDetail === 'term' }"
          @tap="toggleInfoDetail('term')"
        >
          <view class="info-card-head">
            <text class="info-icon">节</text>
            <view class="info-copy">
              <text class="info-title">{{ activeSolarTerm.name }}</text>
              <text class="info-subtitle">{{ solarTermStatus }}</text>
            </view>
            <text class="info-action">{{ activeInfoDetail === 'term' ? '收起' : '详情' }}</text>
          </view>
          <text class="info-summary">{{ activeSolarTerm.climate }}</text>
        </view>
        <view
          v-if="periodData"
          class="info-card info-card-action"
          :class="{ 'info-card-active': activeInfoDetail === 'period' }"
          @tap="toggleInfoDetail('period')"
        >
          <view class="info-card-head">
            <text class="info-icon">候</text>
            <view class="info-copy">
              <text class="info-title">{{ periodData.name }}</text>
              <text class="info-subtitle">{{ periodData.solarTerm }} · 第{{ periodData.order }}候</text>
            </view>
            <text class="info-action">{{ activeInfoDetail === 'period' ? '收起' : '详情' }}</text>
          </view>
          <text class="info-summary">{{ periodData.modern }}</text>
        </view>
        <view
          class="info-card"
          :class="{ 'info-card-action': seasonSpecial, 'info-card-active': activeInfoDetail === 'season' }"
          @tap="toggleSeasonDetail"
        >
          <view class="info-card-head">
            <text class="info-icon">{{ seasonSpecial ? (seasonSpecial.type === 'countNine' ? '九' : '伏') : '常' }}</text>
            <view class="info-copy">
              <text class="info-title">{{ seasonSpecial ? seasonSpecialTitle : '常季' }}</text>
              <text class="info-subtitle">{{ seasonSpecialSubtitle }}</text>
            </view>
            <text v-if="seasonSpecial" class="info-action">{{ activeInfoDetail === 'season' ? '收起' : '详情' }}</text>
          </view>
          <text class="info-summary">{{ seasonSpecialSummary }}</text>
        </view>
      </view>

      <!-- 月相详情 -->
      <view v-if="moonPhase && activeInfoDetail === 'moon'" class="panel detail-panel">
        <text class="detail-ancient">{{ moonPhase.ancient }}</text>
        <text class="detail-modern">{{ moonPhase.modern }}</text>
        <view class="detail-tags">
          <text class="detail-label">宜</text>
          <text class="detail-value">{{ moonPhase.suitable.join(' · ') }}</text>
        </view>
        <view class="detail-tags">
          <text class="detail-label">忌</text>
          <text class="detail-value">{{ moonPhase.avoid.join(' · ') }}</text>
        </view>
      </view>

      <!-- 节气详情 -->
      <view v-if="activeSolarTerm && activeInfoDetail === 'term'" class="panel detail-panel">
        <text class="detail-climate">{{ activeSolarTerm.climate }}</text>
        <view class="detail-tags">
          <text class="detail-label">养生</text>
          <text class="detail-value">{{ activeSolarTerm.health.join(' · ') }}</text>
        </view>
        <view class="detail-tags">
          <text class="detail-label">时令</text>
          <text class="detail-value">{{ activeSolarTerm.foods.join(' · ') }}</text>
        </view>
        <text v-if="activeSolarTerm.poem" class="detail-poem">{{ activeSolarTerm.poem }}</text>
      </view>

      <!-- 七十二候详情 -->
      <view v-if="periodData && activeInfoDetail === 'period'" class="panel detail-panel">
        <text class="detail-ancient">{{ periodData.ancient }}</text>
        <text class="detail-modern">{{ periodData.modern }}</text>
        <view class="detail-tags">
          <text class="detail-label">一悟</text>
          <text class="detail-value">{{ periodData.insight }}</text>
        </view>
      </view>

      <!-- 数九三伏详情 -->
      <view v-if="seasonSpecial && activeInfoDetail === 'season'" class="panel detail-panel">
        <text class="detail-ancient">{{ seasonSpecial.data.ancient }}</text>
        <text class="detail-modern">{{ seasonSpecial.data.modern }}</text>
        <view class="detail-tags">
          <text class="detail-label">一悟</text>
          <text class="detail-value">{{ seasonSpecial.data.insight }}</text>
        </view>
      </view>

      <!-- 今日宜忌 -->
      <view class="panel advice-panel">
        <view class="advice-row">
          <text class="advice-mark advice-good">宜</text>
          <view class="advice-content">
            <text class="advice-traditional">{{ selectedAlmanac.traditionalSuitable.join(' · ') }}</text>
            <text class="advice-modern">{{ selectedAlmanac.suitable.join(' · ') }}</text>
          </view>
        </view>
        <view class="advice-row">
          <text class="advice-mark advice-bad">忌</text>
          <view class="advice-content">
            <text class="advice-traditional">{{ selectedAlmanac.traditionalAvoid.join(' · ') }}</text>
            <text class="advice-text">{{ selectedAlmanac.avoid.join(' · ') }}</text>
          </view>
        </view>
      </view>

      <!-- 今日感悟 -->
      <view v-if="moonPhase || periodData || seasonSpecial" class="panel insight-panel">
        <text class="insight-label">今日一悟</text>
        <text class="insight-text">{{ moonPhase?.insight || periodData?.insight || seasonSpecial?.data.insight }}</text>
      </view>

      <!-- 当前时辰 -->
      <view class="panel hour-panel">
        <view class="hour-header">
          <text class="hour-title">{{ selectedAlmanac.highlightHour.branch.name }}</text>
          <text class="hour-time">{{ selectedAlmanac.highlightHour.branch.range }}</text>
          <text class="hour-level" :class="`hour-level-${selectedAlmanac.highlightHour.level}`">{{ selectedAlmanac.highlightHour.levelText }}</text>
        </view>
        <text class="hour-guide">{{ selectedAlmanac.highlightHour.guide }}</text>
      </view>

      <!-- 十二时辰 -->
      <view class="section-title">
        <text>十二时辰</text>
        <view class="view-switch">
          <button class="view-tab" :class="{ 'view-tab-active': viewMode === 'compass' }" @tap="setViewMode('compass')">⊚</button>
          <button class="view-tab" :class="{ 'view-tab-active': viewMode === 'timeline' }" @tap="setViewMode('timeline')">☰</button>
        </view>
      </view>
      <view class="panel time-panel">
        <TimeCompass v-if="viewMode === 'compass'" :hours="selectedAlmanac.hours" :selected-id="selectedHourId" @select="selectHour" />
        <TimelineView v-else :hours="selectedAlmanac.hours" :selected-id="selectedHourId" @select="selectHour" />
      </view>

      <!-- 底部入口 -->
      <view class="entry-grid">
        <view class="entry-card" @tap="openZodiac">
          <text class="entry-icon">{{ zodiacSign ? zodiacSign.symbol : '♒' }}</text>
          <text class="entry-label">星座运势</text>
        </view>
        <view class="entry-card" @tap="openLuckyDays">
          <text class="entry-icon">📅</text>
          <text class="entry-label">择吉日</text>
        </view>
        <view class="entry-card" @tap="openBazi">
          <text class="entry-icon">🔮</text>
          <text class="entry-label">个人八字</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.home-page {
  padding-bottom: 56rpx;
  padding-left: 18rpx;
  padding-right: 18rpx;
}

.drawer-layer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  background: rgba(36, 31, 24, 0);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease, background-color 180ms ease;
}

.drawer-layer-open {
  background: rgba(36, 31, 24, 0.24);
  opacity: 1;
  pointer-events: auto;
}

.side-menu {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  width: 470rpx;
  padding: 76rpx 28rpx 36rpx;
  border-right: 1rpx solid rgba(223, 210, 191, 0.9);
  background: rgba(255, 250, 240, 0.98);
  box-shadow: 18rpx 0 42rpx rgba(67, 47, 25, 0.16);
  transform: translateX(-100%);
  transition: transform 220ms ease;
}

.drawer-layer-open .side-menu {
  transform: translateX(0);
}

.side-menu-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.side-date {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.side-date-main {
  color: var(--gs-ink);
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.15;
}

.side-date-sub {
  color: var(--gs-muted);
  font-size: 22rpx;
  line-height: 1.2;
}

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 50%;
  color: var(--gs-blue);
  background: rgba(255, 250, 240, 0.72);
  font-size: 28rpx;
  line-height: 1;
}

.calendar-view-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 44rpx;
}

.calendar-view-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 78rpx;
  padding: 0 24rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 14rpx;
  color: var(--gs-ink);
  background: rgba(247, 241, 231, 0.72);
  font-size: 28rpx;
  font-weight: 800;
  text-align: left;
}

.calendar-view-button-active {
  border-color: rgba(49, 93, 118, 0.34);
  color: #ffffff;
  background: var(--gs-blue);
  box-shadow: 0 12rpx 26rpx rgba(49, 93, 118, 0.2);
}

.menu-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 104rpx;
  padding-top: 36rpx;
}

.monthbar {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 66rpx;
  text-align: center;
}

.menu-trigger {
  position: relative;
  display: flex;
  flex: 0 0 72rpx;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  border: 1rpx solid var(--gs-line);
  border-radius: 50%;
  color: var(--gs-ink);
  background: rgba(255, 250, 240, 0.86);
}

.menu-lines {
  display: flex;
  flex-direction: column;
  gap: 7rpx;
  width: 30rpx;
}

.menu-line {
  display: block;
  width: 30rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: var(--gs-ink);
}

.menu-dot {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 13rpx;
  height: 13rpx;
  border: 2rpx solid var(--gs-panel);
  border-radius: 50%;
  background: var(--gs-red);
}

.topbar-date {
  overflow: hidden;
  color: var(--gs-ink);
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12rpx;
  margin-left: auto;
}

.nav-actions .icon-button,
.nav-actions .text-button {
  margin: 0;
}

.day-signal {
  margin-bottom: 18rpx;
  padding: 18rpx 22rpx;
  border-left: 6rpx solid var(--gs-gold);
  background: rgba(199, 141, 42, 0.12);
  color: #754d15;
  font-size: 26rpx;
}

.calendar-shell {
  margin-right: -10rpx;
  margin-left: -10rpx;
  padding: 20rpx 0 12rpx;
}

.calendar-shell-year {
  padding-top: 8rpx;
}

.weekday-row,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekday-row {
  margin-bottom: 8rpx;
  color: var(--gs-muted);
  font-size: 22rpx;
  text-align: center;
}

.calendar-grid {
  gap: 4rpx;
}

.calendar-grid-day {
  grid-template-columns: 1fr;
  padding: 0 10rpx;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  padding: 0 10rpx;
}

.year-month-card {
  min-width: 0;
  min-height: 122rpx;
  padding: 18rpx 16rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 14rpx;
  color: var(--gs-ink);
  background: rgba(255, 250, 240, 0.58);
}

.year-month-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  min-width: 0;
}

.year-month-label {
  min-width: 0;
  overflow: hidden;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.year-month-badge {
  flex: 0 0 auto;
  color: var(--gs-muted);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.1;
}

.year-month-signal {
  display: block;
  margin-top: 18rpx;
  overflow: hidden;
  color: var(--gs-blue);
  font-size: 22rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.year-month-current {
  border-color: rgba(199, 141, 42, 0.52);
  background: rgba(199, 141, 42, 0.12);
}

.year-month-selected {
  border-color: var(--gs-blue);
  color: #ffffff;
  background: var(--gs-blue);
  box-shadow: 0 10rpx 24rpx rgba(49, 93, 118, 0.2);
}

.year-month-selected .year-month-badge,
.year-month-selected .year-month-signal {
  color: rgba(255, 255, 255, 0.82);
}

.date-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
  height: 112rpx;
  padding: 8rpx 8rpx 10rpx;
  border: 1rpx solid transparent;
  border-radius: 14rpx;
  color: var(--gs-ink);
  background: rgba(255, 250, 240, 0.48);
  overflow: hidden;
}

.date-cell-muted {
  color: rgba(36, 31, 24, 0.34);
}

.date-cell-weekend:not(.date-cell-muted) .date-number {
  color: var(--gs-red);
}

.date-cell-today {
  color: #ffffff;
  background: var(--gs-blue);
}

.date-cell-selected {
  border-color: var(--gs-gold);
  background: rgba(199, 141, 42, 0.16);
  color: var(--gs-ink);
}

.date-cell-today.date-cell-selected {
  color: #ffffff;
  background: var(--gs-blue);
  box-shadow: 0 10rpx 24rpx rgba(49, 93, 118, 0.24);
}

.date-head {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 54rpx;
}

.date-number {
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}

.date-lunar {
  width: 100%;
  margin-top: 6rpx;
  overflow: hidden;
  color: inherit;
  font-size: 19rpx;
  line-height: 1.1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-cell-day {
  height: 166rpx;
  padding: 22rpx 24rpx;
}

.date-cell-day .date-head {
  height: 78rpx;
}

.date-cell-day .date-number {
  font-size: 48rpx;
}

.date-cell-day .date-lunar {
  margin-top: 12rpx;
  font-size: 26rpx;
}

.date-tag {
  position: absolute;
  top: 0;
  right: 0;
  width: 34rpx;
  height: 28rpx;
  border-radius: 0 14rpx 0 12rpx;
  color: #ffffff;
  background: var(--gs-red);
  font-size: 16rpx;
  font-weight: 800;
  line-height: 28rpx;
  text-align: center;
  z-index: 1;
}

.date-tag-work {
  background: var(--gs-blue);
}

.inline-detail {
  margin-top: 18rpx;
}

.date-hero {
  padding: 18rpx 0 24rpx;
}

.hero-date,
.hero-lunar,
.hero-festival {
  display: block;
}

.hero-date {
  color: var(--gs-ink);
  font-size: 46rpx;
  font-weight: 900;
}

.hero-lunar {
  margin-top: 12rpx;
  color: var(--gs-muted);
  font-size: 26rpx;
}

.hero-festival {
  margin-top: 12rpx;
  color: var(--gs-blue);
  font-size: 24rpx;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.info-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12rpx;
  min-height: 178rpx;
  padding: 18rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 14rpx;
  background: rgba(255, 250, 240, 0.58);
}

.info-card-action {
  border-color: rgba(49, 93, 118, 0.18);
  background: rgba(255, 250, 240, 0.78);
}

.info-card-active {
  border-color: rgba(49, 93, 118, 0.48);
  background: rgba(49, 93, 118, 0.08);
  box-shadow: 0 10rpx 24rpx rgba(49, 93, 118, 0.12);
}

.info-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  min-width: 0;
}

.info-icon {
  display: flex;
  flex: 0 0 48rpx;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  color: #ffffff;
  background: var(--gs-blue);
  font-size: 24rpx;
  font-weight: 900;
  line-height: 1;
}

.info-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.info-title {
  display: block;
  overflow: hidden;
  color: var(--gs-ink);
  font-size: 27rpx;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-subtitle {
  display: block;
  overflow: hidden;
  color: var(--gs-muted);
  font-size: 21rpx;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-action {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.3;
  white-space: nowrap;
}

.info-summary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--gs-ink);
  font-size: 23rpx;
  line-height: 1.42;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 宜忌面板 */
.advice-panel {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 18rpx;
  padding: 24rpx;
}

.advice-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.advice-mark {
  flex: 0 0 auto;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 22rpx;
  line-height: 44rpx;
  text-align: center;
}

.advice-good {
  background: var(--gs-green);
}

.advice-bad {
  background: var(--gs-red);
}

.advice-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
}

.advice-traditional {
  color: var(--gs-muted);
  font-size: 22rpx;
  line-height: 1.5;
}

.advice-modern {
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1.5;
}

.advice-text {
  flex: 1;
  color: var(--gs-ink);
  font-size: 26rpx;
  line-height: 1.5;
}

/* 今日感悟 */
.insight-panel {
  margin-bottom: 18rpx;
  padding: 24rpx;
}

.insight-label {
  display: block;
  margin-bottom: 12rpx;
  color: var(--gs-blue);
  font-size: 22rpx;
  font-weight: 800;
}

.insight-text {
  display: block;
  padding: 16rpx;
  border-left: 4rpx solid var(--gs-gold);
  color: var(--gs-ink);
  background: rgba(199, 141, 42, 0.08);
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1.6;
}

/* 时辰面板 */
.hour-panel {
  margin-bottom: 18rpx;
  padding: 24rpx;
}

.hour-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.hour-title {
  color: var(--gs-ink);
  font-size: 28rpx;
  font-weight: 800;
}

.hour-time {
  flex: 1;
  color: var(--gs-muted);
  font-size: 22rpx;
}

.hour-level {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 800;
}

.hour-level-good {
  background: var(--gs-green);
}

.hour-level-neutral {
  background: var(--gs-gold);
}

.hour-level-bad {
  background: var(--gs-red);
}

.hour-guide {
  color: var(--gs-ink);
  font-size: 24rpx;
  line-height: 1.6;
}

/* 入口网格 */
.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 18rpx;
}

.entry-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 20rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 14rpx;
  background: rgba(255, 250, 240, 0.72);
}

.entry-icon {
  font-size: 48rpx;
  line-height: 1;
}

.entry-label {
  color: var(--gs-ink);
  font-size: 24rpx;
  font-weight: 800;
}

.time-panel {
  padding: 14rpx;
}


.section-meta {
  color: var(--gs-muted);
  font-size: 24rpx;
  font-weight: 500;
}

.view-switch {
  display: flex;
  gap: 10rpx;
}

.view-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border: 1rpx solid var(--gs-line);
  border-radius: 50%;
  color: var(--gs-muted);
  background: rgba(255, 250, 240, 0.72);
  font-size: 30rpx;
}

.view-tab-active {
  color: #ffffff;
  background: var(--gs-blue);
}

.time-panel {
  padding: 14rpx;
}

/* 详情面板 */
.detail-panel {
  margin-bottom: 18rpx;
  padding: 24rpx;
}

.detail-ancient,
.detail-modern,
.detail-climate {
  display: block;
  margin-bottom: 12rpx;
}

.detail-ancient,
.detail-climate {
  color: var(--gs-muted);
  font-size: 24rpx;
  line-height: 1.6;
}

.detail-modern {
  color: var(--gs-ink);
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1.6;
}

.detail-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}

.detail-label {
  flex: 0 0 auto;
  color: var(--gs-blue);
  font-size: 24rpx;
  font-weight: 800;
}

.detail-value {
  flex: 1;
  color: var(--gs-ink);
  font-size: 24rpx;
  line-height: 1.5;
}

.detail-poem {
  display: block;
  margin-top: 16rpx;
  padding: 16rpx;
  border-left: 4rpx solid var(--gs-gold);
  color: var(--gs-muted);
  background: rgba(199, 141, 42, 0.08);
  font-size: 24rpx;
  font-style: italic;
  line-height: 1.6;
}
</style>
