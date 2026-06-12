import type { DateKey } from '@/types/calendar'

export interface SolarTerm {
  name: string
  date: string
  season: '春' | '夏' | '秋' | '冬'
  order: number
  climate: string
  health: string[]
  foods: string[]
  activities: string[]
  poem?: string
}

const SOLAR_TERMS_DATA: SolarTerm[] = [
  {
    name: '立春',
    date: '02-04',
    season: '春',
    order: 1,
    climate: '东风解冻，万物复苏，春回大地',
    health: ['早睡早起，舒展筋骨', '多食辛甘发散之品', '保持心情舒畅，勿动怒'],
    foods: ['韭菜', '春笋', '香椿', '豆芽', '蜂蜜'],
    activities: ['咬春（吃春饼、萝卜）', '踏青郊游', '放风筝'],
    poem: '律回岁晚冰霜少，春到人间草木知'
  },
  {
    name: '雨水',
    date: '02-19',
    season: '春',
    order: 2,
    climate: '春雨绵绵，气温回升，冰雪消融',
    health: ['春捂防寒，勿急减衣', '健脾祛湿为主', '保持心态平和'],
    foods: ['红枣', '山药', '薏米', '扁豆', '鲫鱼'],
    activities: ['拉保保（接寿）', '撞拜寄', '占稻色'],
    poem: '天街小雨润如酥，草色遥看近却无'
  },
  {
    name: '惊蛰',
    date: '03-05',
    season: '春',
    order: 3,
    climate: '春雷乍动，蛰虫惊醒，万物萌发',
    health: ['清淡饮食，多吃清润食物', '适度运动，舒展身体', '防范春困，保证睡眠'],
    foods: ['梨', '枇杷', '菠菜', '荠菜', '银耳'],
    activities: ['祭白虎', '打小人', '吃梨'],
    poem: '微雨众卉新，一雷惊蛰始'
  },
  {
    name: '春分',
    date: '03-20',
    season: '春',
    order: 4,
    climate: '昼夜平分，气候温和，阴阳平衡',
    health: ['调理阴阳平衡', '忌大热大寒之物', '注意防范春季流感'],
    foods: ['春菜', '太阳糕', '驴打滚', '萝卜', '鸡蛋'],
    activities: ['竖蛋', '放风筝', '春祭'],
    poem: '春分雨脚落声微，柳岸斜风带客归'
  },
  {
    name: '清明',
    date: '04-04',
    season: '春',
    order: 5,
    climate: '清爽明净，草木繁茂，桃李盛开',
    health: ['养肝为主，少食酸辣', '适度运动，勿大汗淋漓', '调畅情志，保持乐观'],
    foods: ['青团', '艾糍', '荠菜', '螺蛳', '香椿'],
    activities: ['扫墓祭祖', '踏青游春', '插柳', '放风筝'],
    poem: '清明时节雨纷纷，路上行人欲断魂'
  },
  {
    name: '谷雨',
    date: '04-20',
    season: '春',
    order: 6,
    climate: '春雨贵如油，百谷滋润，雨生百谷',
    health: ['健脾祛湿，养肝柔肝', '多食蔬菜水果', '防过敏，少接触过敏原'],
    foods: ['香椿', '谷雨茶', '春笋', '豌豆', '蚕豆'],
    activities: ['喝谷雨茶', '赏牡丹', '祭海'],
    poem: '谷雨春光晓，山川黛色青'
  },
  {
    name: '立夏',
    date: '05-05',
    season: '夏',
    order: 7,
    climate: '夏季开始，气温升高，雷雨增多',
    health: ['养心为主，清热降火', '晚睡早起，午间小憩', '保持心情愉悦'],
    foods: ['苦瓜', '冬瓜', '绿豆', '西瓜', '莲子'],
    activities: ['称体重', '吃立夏蛋', '尝三鲜'],
    poem: '绿树浓阴夏日长，楼台倒影入池塘'
  },
  {
    name: '小满',
    date: '05-21',
    season: '夏',
    order: 8,
    climate: '麦粒饱满，雨水充沛，湿热加重',
    health: ['清热利湿，健脾和胃', '避免过食生冷油腻', '保持心态平和，防烦躁'],
    foods: ['苦菜', '枸杞苗', '冬瓜', '薏米', '赤小豆'],
    activities: ['祭车神', '动三车（水车、油车、丝车）'],
    poem: '小满天逐热，温风沐麦圆'
  },
  {
    name: '芒种',
    date: '06-05',
    season: '夏',
    order: 9,
    climate: '麦熟蝉鸣，梅雨季至，湿热难耐',
    health: ['清热解暑，健脾祛湿', '适度运动，防中暑', '保证睡眠，午间休息'],
    foods: ['青梅', '梅子酒', '桑葚', '黄瓜', '西红柿'],
    activities: ['煮梅', '送花神', '安苗'],
    poem: '时雨及芒种，四野皆插秧'
  },
  {
    name: '夏至',
    date: '06-21',
    season: '夏',
    order: 10,
    climate: '日照最长，盛夏来临，暑热炎炎',
    health: ['清补为主，少食温热', '防暑降温，多饮水', '心静自然凉'],
    foods: ['面条', '馄饨', '苦瓜', '绿豆汤', '凉茶'],
    activities: ['吃夏至面', '祭神祀祖'],
    poem: '昼晷已云极，宵漏自此长'
  },
  {
    name: '小暑',
    date: '07-07',
    season: '夏',
    order: 11,
    climate: '天气炎热，雷雨频繁，入伏前夕',
    health: ['清热解暑，益气养阴', '少食辛辣油腻', '保持情绪稳定'],
    foods: ['绿豆', '莲藕', '黄鳝', '芒果', '西瓜'],
    activities: ['晒伏姜', '吃饺子', '贴三伏贴'],
    poem: '倏忽温风至，因循小暑来'
  },
  {
    name: '大暑',
    date: '07-22',
    season: '夏',
    order: 12,
    climate: '一年最热，酷暑难耐，多雷雨',
    health: ['防暑降温，补充水分', '清淡饮食，多吃瓜果', '避免长时间户外活动'],
    foods: ['荔枝', '羊肉', '凉茶', '仙草', '绿豆汤'],
    activities: ['送大暑船', '吃仙草', '喝暑羊'],
    poem: '赫赫炎炎如火烧，野田禾稻半枯焦'
  },
  {
    name: '立秋',
    date: '08-07',
    season: '秋',
    order: 13,
    climate: '秋季开始，暑去凉来，早晚温差大',
    health: ['润肺养阴，防秋燥', '早睡早起，调节作息', '多食酸味，少食辛辣'],
    foods: ['西瓜', '桃子', '葡萄', '梨', '蜂蜜'],
    activities: ['贴秋膘', '啃秋', '晒秋'],
    poem: '乳鸦啼散玉屏空，一枕新凉一扇风'
  },
  {
    name: '处暑',
    date: '08-23',
    season: '秋',
    order: 14,
    climate: '暑气消退，秋高气爽，气候宜人',
    health: ['滋阴润燥，养肺为主', '适量运动，增强体质', '保证睡眠，调养精神'],
    foods: ['鸭肉', '百合', '银耳', '莲藕', '蜂蜜'],
    activities: ['放河灯', '开渔节', '出游迎秋'],
    poem: '一度暑出处暑时，秋风送爽已觉迟'
  },
  {
    name: '白露',
    date: '09-07',
    season: '秋',
    order: 15,
    climate: '露凝而白，秋意渐浓，昼夜温差大',
    health: ['添衣防寒，秋冻适度', '饮食润燥，滋阴养肺', '早睡早起，保养精气'],
    foods: ['龙眼', '红薯', '乌骨鸡', '莲子', '芋头'],
    activities: ['喝白露茶', '祭禹王', '吃龙眼'],
    poem: '蒹葭苍苍，白露为霜'
  },
  {
    name: '秋分',
    date: '09-23',
    season: '秋',
    order: 16,
    climate: '昼夜等长，秋意正浓，天高气爽',
    health: ['平衡阴阳，调和气血', '防秋燥，多饮水', '情绪平和，精神内守'],
    foods: ['大闸蟹', '南瓜', '柚子', '石榴', '桂花'],
    activities: ['竖蛋', '吃秋菜', '祭月'],
    poem: '金气秋分，风清露冷秋期半'
  },
  {
    name: '寒露',
    date: '10-08',
    season: '秋',
    order: 17,
    climate: '露寒而冷，深秋将至，气温骤降',
    health: ['养阴防燥，润肺益胃', '足部保暖，寒从足生', '精神调养，保持安定'],
    foods: ['柿子', '山楂', '栗子', '花生', '莲藕'],
    activities: ['赏红叶', '吃花糕', '喝菊花酒'],
    poem: '袅袅凉风动，凄凄寒露零'
  },
  {
    name: '霜降',
    date: '10-23',
    season: '秋',
    order: 18,
    climate: '初霜降临，秋冬过渡，寒意渐深',
    health: ['平补润燥，健脾养胃', '防寒保暖，预防感冒', '调畅情志，顺应天时'],
    foods: ['柿子', '牛肉', '白萝卜', '栗子', '山药'],
    activities: ['赏菊花', '吃柿子', '登高远望'],
    poem: '霜降水痕收，浅碧鳞鳞露远洲'
  },
  {
    name: '立冬',
    date: '11-07',
    season: '冬',
    order: 19,
    climate: '冬季开始，万物收藏，阳气潜藏',
    health: ['补肾藏精，早睡晚起', '温补为主，适当进补', '防寒保暖，避风御寒'],
    foods: ['羊肉', '狗肉', '饺子', '萝卜', '白菜'],
    activities: ['补冬', '吃饺子', '酿黄酒'],
    poem: '北风潜入悄无声，未品浓秋已立冬'
  },
  {
    name: '小雪',
    date: '11-22',
    season: '冬',
    order: 20,
    climate: '初雪飘落，天寒地冻，气温下降',
    health: ['温补肾阳，固本培元', '多晒太阳，补充维D', '保持乐观，防季节性抑郁'],
    foods: ['羊肉', '栗子', '红枣', '核桃', '黑芝麻'],
    activities: ['腌腊肉', '晒鱼干', '吃糍粑'],
    poem: '久雨重阳后，清寒小雪前'
  },
  {
    name: '大雪',
    date: '12-07',
    season: '冬',
    order: 21,
    climate: '大雪纷飞，天寒地冻，万物闭藏',
    health: ['温阳补肾，养精蓄锐', '防寒保暖，避免受凉', '适度运动，增强抵抗力'],
    foods: ['红薯粥', '羊肉汤', '八宝粥', '糖葫芦'],
    activities: ['腌肉', '观赏雪景', '进补'],
    poem: '大雪纷纷落，明年好谷收'
  },
  {
    name: '冬至',
    date: '12-21',
    season: '冬',
    order: 22,
    climate: '日照最短，数九寒天，阴极阳生',
    health: ['补阳养肾，固本培元', '早睡晚起，顺应天时', '静养为主，勿过劳'],
    foods: ['饺子', '汤圆', '羊肉汤', '馄饨', '年糕'],
    activities: ['吃饺子', '九九消寒', '祭祖祭天'],
    poem: '天时人事日相催，冬至阳生春又来'
  },
  {
    name: '小寒',
    date: '01-05',
    season: '冬',
    order: 23,
    climate: '开始入寒，冷气积久，三九天至',
    health: ['温阳散寒，固护阳气', '饮食温补，防寒保暖', '精神内守，保持安宁'],
    foods: ['羊肉', '糯米饭', '菜饭', '黄芽菜', '腊八粥'],
    activities: ['吃菜饭', '画图数九', '煮腊八粥'],
    poem: '小寒时处二三九，天寒地冻北风吼'
  },
  {
    name: '大寒',
    date: '01-20',
    season: '冬',
    order: 24,
    climate: '一年最冷，严寒彻骨，岁末将至',
    health: ['温补固本，藏精御寒', '防风保暖，预防疾病', '保持心情舒畅'],
    foods: ['年糕', '八宝饭', '鸡汤', '糯米饭'],
    activities: ['尾牙祭', '除尘扫房', '准备年货'],
    poem: '蜡树银山炫皎光，朔风独啸静三江'
  }
]

export function getSolarTermByDate(monthDay: string): SolarTerm | undefined {
  return SOLAR_TERMS_DATA.find(term => term.date === monthDay)
}

export function getAllSolarTerms(): SolarTerm[] {
  return SOLAR_TERMS_DATA
}

export function getNextSolarTerm(currentDate: Date): SolarTerm | undefined {
  const month = currentDate.getMonth() + 1
  const day = currentDate.getDate()
  const currentMD = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  for (const term of SOLAR_TERMS_DATA) {
    if (term.date > currentMD) {
      return term
    }
  }

  return SOLAR_TERMS_DATA[0]
}
