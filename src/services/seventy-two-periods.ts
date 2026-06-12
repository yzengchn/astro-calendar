// 七十二候 - 古今融合
export interface Period {
  name: string
  order: number
  solarTerm: string
  startDate: string
  ancient: string
  modern: string
  insight: string
}

export const SEVENTY_TWO_PERIODS: Period[] = [
  { order: 1, solarTerm: '立春', name: '东风解冻', startDate: '02-04', ancient: '东风送暖，冻土消融', modern: '新年伊始，是制定全年计划的最佳时机', insight: '顺势而为，趁势启航' },
  { order: 2, solarTerm: '立春', name: '蛰虫始振', startDate: '02-09', ancient: '冬眠虫豸苏醒振动', modern: '职场回暖，主动出击寻找新机会', insight: '万物复苏，人当自强' },
  { order: 3, solarTerm: '立春', name: '鱼陟负冰', startDate: '02-14', ancient: '鱼群游向冰面呼吸', modern: '突破舒适区，勇于面对挑战', insight: '向上而生，不惧寒冷' },

  { order: 4, solarTerm: '雨水', name: '獭祭鱼', startDate: '02-19', ancient: '水獭捕鱼陈列如祭', modern: '准备充分后再行动，成功率更高', insight: '有备无患，谋定后动' },
  { order: 5, solarTerm: '雨水', name: '候雁北', startDate: '02-24', ancient: '大雁开始北归', modern: '回归本心，找到自己的方向', insight: '归去来兮，心有所向' },
  { order: 6, solarTerm: '雨水', name: '草木萌动', startDate: '03-01', ancient: '草木发芽生长', modern: '春招旺季，求职者的机会窗口', insight: '万物生发，顺时而动' },

  { order: 7, solarTerm: '惊蛰', name: '桃始华', startDate: '03-05', ancient: '桃花开始绽放', modern: '桃花运来临，社交魅力提升', insight: '美好如期而至' },
  { order: 8, solarTerm: '惊蛰', name: '仓庚鸣', startDate: '03-10', ancient: '黄鹂鸟开始鸣叫', modern: '是时候主动表达，发出自己的声音', insight: '不鸣则已，一鸣惊人' },
  { order: 9, solarTerm: '惊蛰', name: '鹰化为鸠', startDate: '03-15', ancient: '鹰隐匿，鸠鸟繁盛', modern: '以柔克刚，调整策略更有效', insight: '刚柔并济，顺势转变' },

  { order: 10, solarTerm: '春分', name: '玄鸟至', startDate: '03-20', ancient: '燕子飞回北方', modern: '故人归来，旧识重逢的时节', insight: '有缘千里来相会' },
  { order: 11, solarTerm: '春分', name: '雷乃发声', startDate: '03-25', ancient: '春雷初响震动万物', modern: '大胆发声，勇敢表达观点', insight: '不畏雷霆，声震四方' },
  { order: 12, solarTerm: '春分', name: '始电', startDate: '03-30', ancient: '开始出现闪电', modern: '灵感闪现，抓住创意的瞬间', insight: '电光火石，稍纵即逝' },

  { order: 13, solarTerm: '清明', name: '桐始华', startDate: '04-04', ancient: '梧桐树开花', modern: '高端人才招聘季，梧桐引凤凰', insight: '栽好梧桐树，引得凤凰来' },
  { order: 14, solarTerm: '清明', name: '田鼠化为鴽', startDate: '04-09', ancient: '田鼠藏匿，鹌鹑繁盛', modern: '转型升级，旧模式退场新模式登场', insight: '物极必反，应时而变' },
  { order: 15, solarTerm: '清明', name: '虹始见', startDate: '04-14', ancient: '雨后初现彩虹', modern: '风雨过后见彩虹，坚持就有收获', insight: '守得云开见月明' },

  { order: 16, solarTerm: '谷雨', name: '萍始生', startDate: '04-20', ancient: '浮萍开始生长', modern: '新人入职，基层力量壮大', insight: '根浅随波逐流，需扎根成长' },
  { order: 17, solarTerm: '谷雨', name: '鸣鸠拂其羽', startDate: '04-25', ancient: '布谷鸟鸣叫梳理羽毛', modern: '完善细节，提升个人形象', insight: '内外兼修，方成大器' },
  { order: 18, solarTerm: '谷雨', name: '戴胜降于桑', startDate: '04-30', ancient: '戴胜鸟飞落桑树', modern: '回归本业，深耕核心领域', insight: '专注本业，厚积薄发' },

  { order: 19, solarTerm: '立夏', name: '蝼蝈鸣', startDate: '05-05', ancient: '蝼蛄开始鸣叫', modern: '夜猫子的高效时段来了', insight: '昼伏夜出，各有其时' },
  { order: 20, solarTerm: '立夏', name: '蚯蚓出', startDate: '05-10', ancient: '蚯蚓钻出地面', modern: '基层调研，深入一线了解实情', insight: '深入基层，方知民情' },
  { order: 21, solarTerm: '立夏', name: '王瓜生', startDate: '05-15', ancient: '王瓜藤蔓生长', modern: '人脉网络扩展，关系网初具规模', insight: '广结善缘，根深叶茂' },

  { order: 22, solarTerm: '小满', name: '苦菜秀', startDate: '05-21', ancient: '苦菜繁茂生长', modern: '先苦后甜，熬过瓶颈期就是坦途', insight: '苦尽甘来，否极泰来' },
  { order: 23, solarTerm: '小满', name: '靡草死', startDate: '05-26', ancient: '喜阴靡草枯死', modern: '淘汰落后产能，优胜劣汰', insight: '新陈代谢，适者生存' },
  { order: 24, solarTerm: '小满', name: '麦秋至', startDate: '05-31', ancient: '麦子成熟收割', modern: '阶段性成果验收，收获季节到了', insight: '春种秋收，因果相应' },

  { order: 25, solarTerm: '芒种', name: '螳螂生', startDate: '06-05', ancient: '螳螂破茧而出', modern: '破釜沉舟，全力以赴的时刻', insight: '破茧成蝶，需经磨难' },
  { order: 26, solarTerm: '芒种', name: '鵙始鸣', startDate: '06-10', ancient: '伯劳鸟开始鸣叫', modern: '敢于发表不同意见，勇敢质疑', insight: '独立思考，敢于发声' },
  { order: 27, solarTerm: '芒种', name: '反舌无声', startDate: '06-15', ancient: '反舌鸟停止鸣叫', modern: '适时沉默，倾听比表达更重要', insight: '言多必失，沉默是金' },

  { order: 28, solarTerm: '夏至', name: '鹿角解', startDate: '06-21', ancient: '鹿角开始脱落', modern: '放下包袱，卸下不必要的负担', insight: '断舍离，轻装上阵' },
  { order: 29, solarTerm: '夏至', name: '蜩始鸣', startDate: '06-26', ancient: '蝉开始鸣叫', modern: '是时候为自己代言，展示才华', insight: '蛰伏多年，一鸣惊人' },
  { order: 30, solarTerm: '夏至', name: '半夏生', startDate: '07-01', ancient: '半夏药材开始生长', modern: '调理身心，注意健康管理', insight: '半程休整，养精蓄锐' },

  { order: 31, solarTerm: '小暑', name: '温风至', startDate: '07-07', ancient: '炎热风吹拂大地', modern: '市场升温，竞争加剧需冷静应对', insight: '心静自然凉，不急不躁' },
  { order: 32, solarTerm: '小暑', name: '蟋蟀居壁', startDate: '07-12', ancient: '蟋蟀躲入墙角', modern: '避其锋芒，暂时蛰伏等待时机', insight: '识时务者为俊杰' },
  { order: 33, solarTerm: '小暑', name: '鹰始挚', startDate: '07-17', ancient: '老鹰开始捕猎', modern: '精准出击，抓住关键机会', insight: '不鸣则已，一鸣惊人' },

  { order: 34, solarTerm: '大暑', name: '腐草为萤', startDate: '07-22', ancient: '腐草化生萤火虫', modern: '在黑暗中寻找光明，绝处逢生', insight: '星星之火，可以燎原' },
  { order: 35, solarTerm: '大暑', name: '土润溽暑', startDate: '07-27', ancient: '土地湿热蒸腾', modern: '压力山大时，保持冷静理性', insight: '越是焦躁，越需沉着' },
  { order: 36, solarTerm: '大暑', name: '大雨时行', startDate: '08-01', ancient: '时常有大雨降临', modern: '风险频发，做好应急预案', insight: '未雨绸缪，有备无患' },

  { order: 37, solarTerm: '立秋', name: '凉风至', startDate: '08-07', ancient: '凉爽秋风吹来', modern: '市场降温，理性回归的开始', insight: '盛极而衰，物极必反' },
  { order: 38, solarTerm: '立秋', name: '白露降', startDate: '08-12', ancient: '清晨白露凝结', modern: '脚踏实地，细节决定成败', insight: '千里之行，始于足下' },
  { order: 39, solarTerm: '立秋', name: '寒蝉鸣', startDate: '08-17', ancient: '寒蝉哀鸣', modern: '珍惜时光，抓紧最后的机会', insight: '莫道桑榆晚，为霞尚满天' },

  { order: 40, solarTerm: '处暑', name: '鹰乃祭鸟', startDate: '08-23', ancient: '老鹰捕猎祭天', modern: '感恩回馈，饮水思源', insight: '滴水之恩，涌泉相报' },
  { order: 41, solarTerm: '处暑', name: '天地始肃', startDate: '08-28', ancient: '天地肃杀之气渐起', modern: '纪律严明，制度化管理', insight: '无规矩不成方圆' },
  { order: 42, solarTerm: '处暑', name: '禾乃登', startDate: '09-02', ancient: '谷物成熟丰收', modern: '年中总结，收获阶段性成果', insight: '一分耕耘，一分收获' },

  { order: 43, solarTerm: '白露', name: '鸿雁来', startDate: '09-07', ancient: '大雁南飞', modern: '人才流动，优秀人才回流', insight: '良禽择木而栖' },
  { order: 44, solarTerm: '白露', name: '玄鸟归', startDate: '09-12', ancient: '燕子南归', modern: '回归家庭，重视亲情陪伴', insight: '家是最温暖的港湾' },
  { order: 45, solarTerm: '白露', name: '群鸟养羞', startDate: '09-17', ancient: '群鸟储备过冬食物', modern: '未雨绸缪，提前做好储备', insight: '人无远虑，必有近忧' },

  { order: 46, solarTerm: '秋分', name: '雷始收声', startDate: '09-23', ancient: '雷声渐止', modern: '锋芒收敛，低调行事', insight: '藏锋守拙，韬光养晦' },
  { order: 47, solarTerm: '秋分', name: '蛰虫坯户', startDate: '09-28', ancient: '虫子封闭洞口', modern: '闭关修炼，充电学习的好时机', insight: '磨刀不误砍柴工' },
  { order: 48, solarTerm: '秋分', name: '水始涸', startDate: '10-03', ancient: '水气开始干涸', modern: '资源紧张，节约为先', insight: '开源节流，量入为出' },

  { order: 49, solarTerm: '寒露', name: '鸿雁来宾', startDate: '10-08', ancient: '大雁成群结队', modern: '团队协作，抱团取暖', insight: '众人拾柴火焰高' },
  { order: 50, solarTerm: '寒露', name: '雀入大水为蛤', startDate: '10-13', ancient: '雀鸟藏匿，蛤蜊繁盛', modern: '转型变革，拥抱变化', insight: '穷则变，变则通' },
  { order: 51, solarTerm: '寒露', name: '菊有黄华', startDate: '10-18', ancient: '菊花盛开', modern: '坚守本心，不随波逐流', insight: '宁可枝头抱香死，何曾吹落北风中' },

  { order: 52, solarTerm: '霜降', name: '豺乃祭兽', startDate: '10-23', ancient: '豺狼捕猎祭兽', modern: '竞争激烈，优胜劣汰加速', insight: '适者生存，强者为王' },
  { order: 53, solarTerm: '霜降', name: '草木黄落', startDate: '10-28', ancient: '草木枯黄凋落', modern: '清理冗余，精简优化', insight: '落叶归根，返璞归真' },
  { order: 54, solarTerm: '霜降', name: '蛰虫咸俯', startDate: '11-02', ancient: '虫子蛰伏地下', modern: '低调蛰伏，积蓄力量', insight: '不飞则已，一飞冲天' },

  { order: 55, solarTerm: '立冬', name: '水始冰', startDate: '11-07', ancient: '水面开始结冰', modern: '市场冰封，谨慎投资', insight: '寒冬将至，保存实力' },
  { order: 56, solarTerm: '立冬', name: '地始冻', startDate: '11-12', ancient: '大地开始冻结', modern: '行业寒冬，练好内功', insight: '冬练三九，苦尽甘来' },
  { order: 57, solarTerm: '立冬', name: '雉入大水为蜃', startDate: '11-17', ancient: '野鸡入水化为蜃', modern: '灵活应变，突破固有思维', insight: '变则通，通则久' },

  { order: 58, solarTerm: '小雪', name: '虹藏不见', startDate: '11-22', ancient: '彩虹隐藏不见', modern: '低调做事，不露锋芒', insight: '大音希声，大象无形' },
  { order: 59, solarTerm: '小雪', name: '天气上升地气下降', startDate: '11-27', ancient: '天地闭塞不通', modern: '沟通不畅，需主动打破僵局', insight: '主动沟通，化解隔阂' },
  { order: 60, solarTerm: '小雪', name: '闭塞而成冬', startDate: '12-02', ancient: '天地闭塞成冬', modern: '关门修炼，总结反思', insight: '闭门思过，厚积薄发' },

  { order: 61, solarTerm: '大雪', name: '鹖鴠不鸣', startDate: '12-07', ancient: '寒号鸟不再鸣叫', modern: '保持低调，韬光养晦', insight: '沉默是金，静待花开' },
  { order: 62, solarTerm: '大雪', name: '虎始交', startDate: '12-12', ancient: '老虎开始求偶', modern: '冬日恋情，温暖相伴', insight: '寒冬相拥，温暖如春' },
  { order: 63, solarTerm: '大雪', name: '荔挺出', startDate: '12-17', ancient: '荔草挺出地面', modern: '困境中寻找突破，绝地反击', insight: '山重水复疑无路，柳暗花明又一村' },

  { order: 64, solarTerm: '冬至', name: '蚯蚓结', startDate: '12-21', ancient: '蚯蚓蜷缩结团', modern: '抱团取暖，团结就是力量', insight: '众志成城，共克时艰' },
  { order: 65, solarTerm: '冬至', name: '麋角解', startDate: '12-26', ancient: '麋鹿脱落鹿角', modern: '放下执念，轻装前行', insight: '舍得舍得，有舍才有得' },
  { order: 66, solarTerm: '冬至', name: '水泉动', startDate: '12-31', ancient: '地下泉水开始流动', modern: '暗流涌动，新机遇在酝酿', insight: '黑暗之后必有光明' },

  { order: 67, solarTerm: '小寒', name: '雁北乡', startDate: '01-05', ancient: '大雁开始北迁', modern: '提前规划，为春天做准备', insight: '凡事预则立，不预则废' },
  { order: 68, solarTerm: '小寒', name: '鹊始巢', startDate: '01-10', ancient: '喜鹊开始筑巢', modern: '安居乐业，打好基础', insight: '基础不牢，地动山摇' },
  { order: 69, solarTerm: '小寒', name: '雉始雊', startDate: '01-15', ancient: '野鸡开始鸣叫', modern: '曙光初现，希望在前方', insight: '黎明前的黑暗最难熬' },

  { order: 70, solarTerm: '大寒', name: '鸡乳', startDate: '01-20', ancient: '母鸡开始孵蛋', modern: '孕育新项目，耐心等待成果', insight: '十月怀胎，瓜熟蒂落' },
  { order: 71, solarTerm: '大寒', name: '征鸟厉疾', startDate: '01-25', ancient: '猛禽捕猎凶猛', modern: '年关冲刺，全力以赴', insight: '行百里者半九十' },
  { order: 72, solarTerm: '大寒', name: '水泽腹坚', startDate: '01-30', ancient: '冰冻最厚最结实', modern: '坚守到底，胜利在即', insight: '守得云开见月明' }
]

export function getPeriodByDate(monthDay: string): Period | undefined {
  for (let i = 0; i < SEVENTY_TWO_PERIODS.length; i++) {
    const current = SEVENTY_TWO_PERIODS[i]
    const next = SEVENTY_TWO_PERIODS[i + 1]
    if (!next || monthDay >= current.startDate && monthDay < next.startDate) {
      return current
    }
  }
  return SEVENTY_TWO_PERIODS[0]
}
