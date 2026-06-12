// 节日故事卡片 - 古今禅意融合
export interface FestivalStory {
  name: string
  date: string
  type: 'solar' | 'lunar'
  season: '春' | '夏' | '秋' | '冬'
  emoji: string
  story: string
  customs: string[]
  foods: string[]
  poem: string
  modern: string
  insight: string
  daysUntil?: number
}

export const FESTIVAL_STORIES: FestivalStory[] = [
  {
    name: '春节',
    date: '01-01',
    type: 'lunar',
    season: '春',
    emoji: '🎆',
    story: '相传古时有怪兽"年"，每到岁末便出来伤人，人们发现它害怕红色、火光和响声，于是贴春联、放鞭炮、守岁迎新，逐渐演变成春节习俗。',
    customs: ['贴春联', '放鞭炮', '守岁', '拜年', '发压岁钱', '吃年夜饭'],
    foods: ['饺子', '年糕', '鱼', '汤圆'],
    poem: '爆竹声中一岁除，春风送暖入屠苏',
    modern: '辞旧迎新，是总结过去、规划未来的最佳时机，适合设定新年目标',
    insight: '旧岁已去，新春将至，万象更新，从心开始'
  },
  {
    name: '元宵节',
    date: '01-15',
    type: 'lunar',
    season: '春',
    emoji: '🏮',
    story: '汉文帝时，平定诸吕之乱，恰逢正月十五，此后每年这天民间张灯结彩庆祝。东汉明帝提倡佛教，传令正月十五点灯敬佛，遂成元宵节。',
    customs: ['赏花灯', '猜灯谜', '舞龙舞狮', '踩高跷'],
    foods: ['汤圆', '元宵'],
    poem: '月上柳梢头，人约黄昏后',
    modern: '团圆相聚，是加强团队凝聚力、促进人际关系的好时机',
    insight: '花好月圆人团聚，把握当下惜眼前'
  },
  {
    name: '清明节',
    date: '04-04',
    type: 'solar',
    season: '春',
    emoji: '🌿',
    story: '相传源于春秋晋文公纪念介子推。介子推割股奉君，后隐居山林不愿为官，晋文公放火逼其出山，介子推抱树而亡，遂有寒食清明。',
    customs: ['扫墓祭祖', '踏青', '插柳', '放风筝'],
    foods: ['青团', '艾糍'],
    poem: '清明时节雨纷纷，路上行人欲断魂',
    modern: '缅怀过去，珍惜当下，是反思人生意义、调整生活节奏的时刻',
    insight: '追思先人，感恩当下，生命无常，及时珍惜'
  },
  {
    name: '端午节',
    date: '05-05',
    type: 'lunar',
    season: '夏',
    emoji: '🛶',
    story: '战国时期，楚国诗人屈原忠君爱国却遭流放，于五月初五投汨罗江自尽。百姓闻讯划船竞渡，投粽子入江，希望鱼虾不伤其身。',
    customs: ['赛龙舟', '包粽子', '挂艾草', '饮雄黄酒'],
    foods: ['粽子', '咸蛋', '绿豆糕'],
    poem: '彩线轻缠红玉臂，小符斜挂绿云鬟',
    modern: '团队协作、户外拓展的好时机，龙舟精神激励团队奋进',
    insight: '忠诚如屈子，坚守如磐石，逆境中更显品格'
  },
  {
    name: '七夕节',
    date: '07-07',
    type: 'lunar',
    season: '夏',
    emoji: '💫',
    story: '牛郎织女的爱情传说。织女下凡与牛郎相爱，王母娘娘以银河相隔，每年七月初七，喜鹊搭桥让两人相会，成就千古爱情佳话。',
    customs: ['穿针乞巧', '晒书晒衣', '拜织女', '观星'],
    foods: ['巧果', '巧酥', '瓜果'],
    poem: '纤云弄巧，飞星传恨，银汉迢迢暗度',
    modern: '表达爱意的浪漫时刻，适合增进感情、修复关系',
    insight: '相爱容易相守难，珍惜眼前人，不负有情人'
  },
  {
    name: '中秋节',
    date: '08-15',
    type: 'lunar',
    season: '秋',
    emoji: '🌕',
    story: '唐朝时，嫦娥偷食仙药奔月，后羿思念不已，每年八月十五摆供品遥祭。民间百姓纷纷效仿，祈求团圆美满，遂成中秋佳节。',
    customs: ['赏月', '吃月饼', '猜灯谜', '赏桂花'],
    foods: ['月饼', '石榴', '栗子', '柚子'],
    poem: '但愿人长久，千里共婵娟',
    modern: '阶段性总结，与家人团聚，平衡工作与生活的时刻',
    insight: '月圆人团圆，天涯共此时，距离不减情'
  },
  {
    name: '重阳节',
    date: '09-09',
    type: 'lunar',
    season: '秋',
    emoji: '🏔️',
    story: '东汉时，桓景拜费长房为师学道。费长房预言九月九日有灾，嘱其登高、饮菊花酒、佩茱萸避祸，桓景照做全家得免，遂成重阳登高习俗。',
    customs: ['登高望远', '赏菊花', '插茱萸', '饮菊花酒'],
    foods: ['重阳糕', '菊花酒'],
    poem: '遥知兄弟登高处，遍插茱萸少一人',
    modern: '尊老敬老，登高远望，是拓展视野、提升格局的好时机',
    insight: '登高望远，心胸开阔，站得高才能看得远'
  },
  {
    name: '冬至',
    date: '12-21',
    type: 'solar',
    season: '冬',
    emoji: '☃️',
    story: '古人认为冬至是阴阳转化的关键节点，阴极而阳生，此后白昼渐长。周代起，冬至便是重要节日，有"冬至大如年"之说。',
    customs: ['吃饺子', '吃汤圆', '祭祖祭天', '数九'],
    foods: ['饺子', '汤圆', '羊肉汤', '馄饨'],
    poem: '天时人事日相催，冬至阳生春又来',
    modern: '一年最长的夜，适合深度反思、总结全年得失',
    insight: '阴极阳生，否极泰来，黑暗之后必有光明'
  },
  {
    name: '腊八节',
    date: '12-08',
    type: 'lunar',
    season: '冬',
    emoji: '🥣',
    story: '相传佛祖释迦牟尼在腊月初八悟道成佛，寺院取香谷果实煮粥供佛，民间效仿，遂成腊八节喝腊八粥的习俗。',
    customs: ['喝腊八粥', '腌腊八蒜', '晒腊八豆腐'],
    foods: ['腊八粥', '腊八蒜', '腊八豆腐'],
    poem: '今朝佛粥更相馈，更觉江村节物新',
    modern: '年关将至，准备年货，盘点收获，为新年做准备',
    insight: '一粥一饭，当思来之不易，感恩惜福'
  },
  {
    name: '小年',
    date: '12-23',
    type: 'lunar',
    season: '冬',
    emoji: '🧹',
    story: '传说灶王爷要在小年这天上天向玉帝汇报人间善恶，人们供奉糖瓜，希望灶王爷"上天言好事，回宫降吉祥"。',
    customs: ['祭灶王', '扫尘', '剪窗花', '贴春联'],
    foods: ['糖瓜', '火烧', '饺子'],
    poem: '二十三，糖瓜粘，灶君老爷要上天',
    modern: '年终大扫除，清理冗余，轻装迎接新年',
    insight: '除旧迎新，断舍离，为新生腾出空间'
  }
]

export function getFestivalByDate(monthDay: string, type: 'solar' | 'lunar'): FestivalStory | undefined {
  return FESTIVAL_STORIES.find(f => f.date === monthDay && f.type === type)
}

export function getUpcomingFestivals(currentDate: Date, limit = 3): FestivalStory[] {
  // 简化版：返回接下来的节日
  return FESTIVAL_STORIES.slice(0, limit)
}

export function calculateDaysUntil(currentDate: Date, festivalDate: Date): number {
  const diff = festivalDate.getTime() - currentDate.getTime()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}
