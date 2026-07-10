import type { DaliurenOutput } from "taibu-core/daliuren";

const GENERAL_NATURE: Record<string, string> = {
  贵人: "吉将", 青龙: "吉将", 六合: "吉将", 太常: "吉将", 太阴: "吉将", 天后: "吉将",
  螣蛇: "凶将", 朱雀: "凶将", 勾陈: "凶将", 天空: "凶将", 白虎: "凶将", 玄武: "凶将",
};
const GENERAL_MEANING: Record<string, string> = {
  贵人: "众将之首，主贵人相助、权威庇护。", 青龙: "财喜之神，主升迁求财、喜事。",
  六合: "和合之神，主合作婚恋交易。", 太常: "衣食宴乐之神，平稳之象。",
  太阴: "荫蔽之神，主暗中相助、女性贵人。", 天后: "恩泽之神，主女性贵人、婚姻庇护。",
  螣蛇: "虚惊怪异之神，主惊恐疑虑。", 朱雀: "口舌文书之神，主是非官司。",
  勾陈: "争斗拖延之神，主争执田土纠纷。", 天空: "虚诈不实之神，主欺诈落空。",
  白虎: "凶煞之神，主伤病官非。", 玄武: "盗贼暗昧之神，主偷盗阴谋。",
};
const LIUQIN_MEANING: Record<string, string> = {
  父母: "主文书长辈房屋。", 兄弟: "主竞争同伴花费。", 妻财: "主财运妻室物质。",
  官鬼: "主事业官非疾病。", 子孙: "主晚辈娱乐解忧。",
};
const KETI_EXPLAIN: Record<string, string> = {
  // --- 九宗门 (Core 9) ---
  元首: "自上而下，事由尊长发端。",
  重审: "反复斟酌，需反复思考决定。",
  知一: "同类相争，需选择其一。",
  涉害: "经历艰难方有所成。",
  遥克: "远距离影响，受远方因素牵动。",
  昴星: "事情隐晦不明，需多方打听。",
  别责: "另寻他路，原计划受阻需变换。",
  八专: "专注一事，但可能视野狭窄。",
  伏吟: "停滞不前，宜守不宜攻。",
  返吟: "反复变动，宜快刀斩乱麻。",
  // --- 吉课 (Auspicious) ---
  三光: "吉课。天乙·青龙·贵人三光并照，万事亨通。贵人显达，求谋有成。",
  三阳: "吉课。阳气发动，阴霾消散。大利进取，百事可成。",
  三奇: "吉课。三奇贵人临课传，逢凶化吉。考试高中，升迁有望。",
  六仪: "吉课。旬仪发用，诸事皆宜。文书顺利，出行安逸。",
  时泰: "吉课。天时地利，内外和谐。财利双美，婚喜自来。",
  官爵: "吉课。贵人相助，官运亨通。升职加薪，名利双收。",
  富贵: "吉课。干支生合，禄马交驰。财运兴旺，事业发达。",
  龙德: "吉课。青龙得位，德泽深厚。贵人暗助，化险为夷。",
  轩盖: "吉课。车马盈门，出行顺利。远行大吉，声名远播。",
  铸印: "吉课。印绶成器，权柄在握。掌权管事，地位稳固。",
  斫轮: "吉课。成器之象，大器晚成。技能精进，事业成功。",
  引从: "吉课。前后引从，升迁在即。贵人提携，青云直上。",
  // --- 凶课 (Inauspicious) ---
  九丑: "凶课。丑恶汇聚，暗昧难明。防阴谋暗算，女色是非。",
  二烦: "凶课。天地烦乱，心神不宁。病痛缠身，事多波折。",
  天祸: "凶课。天降灾祸，避之不及。破财伤身，宜静不宜动。",
  天狱: "凶课。困顿牢狱，难以脱身。官非缠身，诉讼拖延。",
  天寇: "凶课。寇盗之象，防人之心。破财失盗，小人暗算。",
  死奇: "凶课。死神发用，病痛凶危。求医问药，切莫大意。",
  刑伤: "凶课。刑伤并见，血光之灾。谨慎行事，防意外伤。",
  // --- 变格 (Special) ---
  连珠: "变格。三传相连如珠串，事事连贯。宜顺势而为，一气呵成。",
  间传: "变格。三传隔位相传，事有间断。需耐心等待，不可急切。",
  全局: "变格。三传合全局，力量集中。格局宏大，影响深远。",
  润下: "变格。三传合水局，如江河直下。宜流动之事，不宜守成。",
  炎上: "变格。三传合火局，如火燎原。宜速战速决，气势如虹。",
};
// --- 课传类象 & 毕法赋 类型定义 ---

export interface KeChuanLeiXiang {
  general: string;
  person: string;
  matter: string;
  health: string;
  direction: string;
}

export interface BiFaFuResult {
  ruleName: string;
  ruleText: string;
  matches: boolean;
  explanation: string;
}

interface BiFaFuRule {
  name: string;
  text: string;
  check: (ctx: {
    keName: string;
    sanChuan: { chu: string[]; zhong: string[]; mo: string[] };
    generals: string[];
  }) => boolean;
  explain: string;
}

// --- 天将类象 ---

const TIAN_JIANG_LEI_XIANG: Record<string, KeChuanLeiXiang> = {
  贵人: {
    general: "贵人",
    person: "官贵之人、长者、上级领导、文人雅士",
    matter: "谒贵求官、文书印信、礼仪庆贺、官方事务",
    health: "头疾、脾胃之病",
    direction: "丑未方",
  },
  螣蛇: {
    general: "螣蛇",
    person: "怪异之人、巫师术士、惊恐不安之人、孕妇",
    matter: "虚惊怪异、火灾惊恐、阴谋诡计、梦魇",
    health: "心经之病、惊悸怔忡、精神失常",
    direction: "巳方",
  },
  朱雀: {
    general: "朱雀",
    person: "文书之人、词讼之人、信使邮差、教师文人",
    matter: "口舌是非、文书消息、考试选举、信息传递",
    health: "口舌咽喉之疾、目疾",
    direction: "午方",
  },
  六合: {
    general: "六合",
    person: "媒人、交易之人、朋友同伴、中人介绍人",
    matter: "婚姻和合、商业交易、合作结盟、子孙喜庆",
    health: "肝胆之疾",
    direction: "卯方",
  },
  勾陈: {
    general: "勾陈",
    person: "田土之人、狱吏捕快、争斗之人、固执之人",
    matter: "争讼斗打、田土房产纠纷、拖延阻滞、牢狱之灾",
    health: "脾胃肿胀、跌打损伤",
    direction: "辰方",
  },
  青龙: {
    general: "青龙",
    person: "贵人富豪、官员权贵、喜庆之人、长子",
    matter: "钱财进益、升迁之喜、婚姻喜庆、文官职务",
    health: "肝经之疾",
    direction: "寅方",
  },
  天空: {
    general: "天空",
    person: "欺诈之人、虚妄不实之人、仆从下人",
    matter: "虚诈不实、落空无成、欺骗谎言、文书遗失",
    health: "气虚之病、神思恍惚",
    direction: "戌方",
  },
  白虎: {
    general: "白虎",
    person: "凶恶之人、伤病之人、丧家孝服之人、军警武职",
    matter: "伤病血光、官非牢狱、丧事孝服、道路凶险",
    health: "肺经之疾、筋骨疼痛、血光外伤",
    direction: "申方",
  },
  太常: {
    general: "太常",
    person: "司礼之人、文人学者、宴乐之人、武职官员",
    matter: "宴饮聚会、文书礼仪、衣帛服饰、授职封赏",
    health: "脾胃之疾、饮食不调",
    direction: "未方",
  },
  玄武: {
    general: "玄武",
    person: "盗贼、阴谋之人、水边之人、隐逸之人",
    matter: "盗贼失窃、阴谋暗算、遗失物品、水路之事",
    health: "肾经之疾、泌尿系统",
    direction: "亥方",
  },
  太阴: {
    general: "太阴",
    person: "女性贵人、阴私之人、婢女侍从、老妇",
    matter: "阴私密谋、暗中相助、隐匿之事、婚恋隐私",
    health: "肺疾、妇科之病",
    direction: "酉方",
  },
  天后: {
    general: "天后",
    person: "贵妇、母亲、妻子、恩泽之人",
    matter: "婚姻喜庆、恩泽庇护、妇女之事、生育养育",
    health: "肾疾、妇科之症",
    direction: "子方",
  },
};

// --- 毕法赋规则 ---

const BI_FA_FU_RULES: BiFaFuRule[] = [
  {
    name: "前后引从升迁吉",
    text: "前后引从升迁吉，引从支内格尤奇。初传居干前为引，末传居干后为从，主升迁之喜。",
    check: ctx => {
      const threeGenerals = [ctx.sanChuan.chu[2], ctx.sanChuan.zhong[2], ctx.sanChuan.mo[2]];
      const hasQingLong = threeGenerals.includes("青龙");
      const hasGuiRen = threeGenerals.includes("贵人");
      return hasQingLong || hasGuiRen;
    },
    explain: "三传中有青龙或贵人者，主仕途升迁、前程远大之象。",
  },
  {
    name: "三传递生人举荐",
    text: "三传递生人举荐，初生中、中生末，有人举荐，事必成就。",
    check: ctx => {
      const chuG = ctx.sanChuan.chu[2] || "";
      const zhongG = ctx.sanChuan.zhong[2] || "";
      const moG = ctx.sanChuan.mo[2] || "";
      return chuG !== "天空" && zhongG !== "天空" && moG !== "天空"
        && chuG !== "" && zhongG !== "" && moG !== "";
    },
    explain: "三传天将俱全且不落空亡（天空），主事物层层推进、有贵人举荐相助。",
  },
  {
    name: "魁度天门关隔定",
    text: "魁度天门关隔定，中传见戌（天魁）为魁度天门，主关隔阻滞，事多不成。",
    check: ctx => {
      const zhongBranch = ctx.sanChuan.zhong[0] || "";
      const moBranch = ctx.sanChuan.mo[0] || "";
      return zhongBranch === "戌" || moBranch === "戌";
    },
    explain: "中传或末传见戌者，主中途遭遇关隔阻滞，宜谨慎行事。",
  },
  {
    name: "胎财生气妻怀孕",
    text: "胎财生气妻怀孕，三传见子午卯酉或生气方发用，主妻妾有孕之喜。",
    check: ctx => {
      const branches = [
        ctx.sanChuan.chu[0] || "",
        ctx.sanChuan.zhong[0] || "",
        ctx.sanChuan.mo[0] || "",
      ];
      const isChildOf = (b: string, parent: string) => {
        const map: Record<string, string[]> = {
          "子午卯酉": ["子", "午", "卯", "酉"],
          "寅申巳亥": ["寅", "申", "巳", "亥"],
        };
        return (map[parent] || []).includes(b);
      };
      const chuIsTaicai = isChildOf(branches[0], "子午卯酉");
      const hasTianHou = ctx.generals.includes("天后");
      const hasLiuHe = ctx.generals.includes("六合");
      return chuIsTaicai && (hasTianHou || hasLiuHe);
    },
    explain: "初传为子午卯酉且天将见天后或六合，主妻妾有孕或婚姻之喜。",
  },
  {
    name: "将逢内战所谋危",
    text: "将逢内战所谋危，天将克其所乘之神为内战，主内部矛盾、事多阻扰。",
    check: ctx => {
      const chuanList = [ctx.sanChuan.chu, ctx.sanChuan.zhong, ctx.sanChuan.mo];
      const badGenerals = ["螣蛇", "白虎", "玄武", "勾陈", "朱雀", "天空"];
      return chuanList.some(chuan => badGenerals.includes(chuan[2] || ""));
    },
    explain: "三传中含凶将者，主内部矛盾滋生、谋划之事多有危机。",
  },
  {
    name: "虎临干上凶祸深",
    text: "虎临干上凶祸深，白虎加临干上或发用者，主伤病官非乃至丧亡之祸。",
    check: ctx => {
      const chuGen = ctx.sanChuan.chu[2] || "";
      return chuGen === "白虎" || ctx.generals.some(g => g === "白虎");
    },
    explain: "白虎在三传或课传中出现，主凶祸加临，宜慎之又慎。",
  },
  {
    name: "交车生合同共济",
    text: "交车生合同共济，干上神与支上神相生，主双方合作和谐、事可共成。",
    check: ctx => {
      const hasLiuHe = ctx.generals.includes("六合");
      const hasQingLong = ctx.generals.includes("青龙");
      return hasLiuHe && hasQingLong;
    },
    explain: "六合与青龙并现课传之中，主各方合作和谐、共济成功。",
  },
  {
    name: "三传皆空事不真",
    text: "三传皆空事不真，若三传皆落空亡，主万事虚花、求谋无成。",
    check: ctx => {
      const chuanList = [ctx.sanChuan.chu, ctx.sanChuan.zhong, ctx.sanChuan.mo];
      return chuanList.every(chuan => chuan[2] === "天空" || chuan[2] === "");
    },
    explain: "三传天将皆为空亡或天空者，主事物虚而不实、难有结果。",
  },
  {
    name: "初遭夹克不由己",
    text: "初遭夹克不由己，初传被上下夹克，主身不由己、受人牵制。",
    check: ctx => {
      const chuGen = ctx.sanChuan.chu[2] || "";
      return ["勾陈", "玄武", "天空"].includes(chuGen);
    },
    explain: "初传为勾陈、玄武或天空者，主初始即受牵制，身不由己。",
  },
  {
    name: "干支皆败势倾颓",
    text: "干支皆败势倾颓，干上神与支上神皆临败地，主万事衰败、难以为继。",
    check: ctx => {
      const allGood = ctx.generals.filter(g =>
        ["贵人", "青龙", "六合", "太常", "太阴", "天后"].includes(g),
      );
      const allBad = ctx.generals.filter(g =>
        ["螣蛇", "朱雀", "勾陈", "天空", "白虎", "玄武"].includes(g),
      );
      return allBad.length > allGood.length;
    },
    explain: "凶将多于吉将，主整体运势倾颓衰败，宜守不宜攻。",
  },
  {
    name: "初末相生始终利",
    text: "初末相生始终利，初传与末传相生，主事情始终顺利、有始有终。",
    check: ctx => {
      const chuGen = ctx.sanChuan.chu[2] || "";
      const moGen = ctx.sanChuan.mo[2] || "";
      const goodList = ["贵人", "青龙", "六合", "太常", "太阴", "天后"];
      const badList = ["螣蛇", "朱雀", "勾陈", "天空", "白虎", "玄武"];
      const chuGood = goodList.includes(chuGen);
      const moGood = goodList.includes(moGen);
      const chuBad = badList.includes(chuGen);
      const moBad = badList.includes(moGen);
      return (chuGood && moGood) || (!chuBad && !moBad);
    },
    explain: "初传与末传皆为吉将或皆不为凶将，主事情自始至终顺利。",
  },
  {
    name: "传财化鬼财休觅",
    text: "传财化鬼财休觅，三传皆财爻而末传化鬼者，求财反招祸患。",
    check: ctx => {
      const moGen = ctx.sanChuan.mo[2] || "";
      return ["白虎", "螣蛇", "玄武"].includes(moGen);
    },
    explain: "末传见白虎、螣蛇或玄武者，主求财之路终有风险，宜谨慎。",
  },
  {
    name: "传鬼化财钱险得",
    text: "传鬼化财钱险得，三传初为鬼爻末为财爻，主历经危险而得财。",
    check: ctx => {
      const chuGen = ctx.sanChuan.chu[2] || "";
      const moGen = ctx.sanChuan.mo[2] || "";
      const chuBad = ["白虎", "螣蛇", "勾陈"].includes(chuGen);
      const moGood = ["青龙", "六合", "太常"].includes(moGen);
      return chuBad && moGood;
    },
    explain: "初传凶将末传吉将，主先难后易、历经险阻后有所得。",
  },
  {
    name: "龙加生气财帛聚",
    text: "龙加生气财帛聚，青龙临生气方发用者，主财运亨通、财富聚集。",
    check: ctx => ctx.sanChuan.chu[2] === "青龙" || ctx.sanChuan.zhong[2] === "青龙",
    explain: "青龙在初传或中传，主财运通达、钱财聚集之象。",
  },
  {
    name: "干乘墓虎无占病",
    text: "干乘墓虎无占病，干上临墓神又见白虎，主病重难医，不宜占病。",
    check: ctx => {
      const hasBaiHu = ctx.generals.includes("白虎");
      const chuanList = [ctx.sanChuan.chu, ctx.sanChuan.zhong, ctx.sanChuan.mo];
      const hasMu = chuanList.some(chuan =>
        ["辰", "戌", "丑", "未"].includes(chuan[0] || ""),
      );
      return hasBaiHu && hasMu;
    },
    explain: "白虎与墓神（辰戌丑未）并见课传之中，主病情深重、不宜占病。",
  },
  {
    name: "贵登天门万事昌",
    text: "贵登天门万事昌，贵人加临亥位为贵登天门，主万事顺遂、贵人得力。",
    check: ctx => {
      const hasGuiRen = ctx.generals.includes("贵人");
      const hasQingLong = ctx.generals.includes("青龙");
      return hasGuiRen && hasQingLong;
    },
    explain: "贵人青龙并现课传，主贵人得力、万事昌盛之象。",
  },
  {
    name: "蛇入传中多怪异",
    text: "蛇入传中多怪异，螣蛇入于三传者，主怪异频生、心神不安。",
    check: ctx => ctx.generals.includes("螣蛇"),
    explain: "螣蛇在三传或四课中出现，主惊恐怪异之事频发。",
  },
  {
    name: "玄在课传防盗窃",
    text: "玄在课传防盗窃，玄武见于课传者，主有盗贼之患、须防失窃。",
    check: ctx => ctx.generals.includes("玄武"),
    explain: "玄武在三传或四课中出现，主须防盗窃遗失之事。",
  },
];

// --- 课传类象分析 ---

/**
 * 分析四课三传中出现的每个天将的类象。
 * 从四课和三传中提取所有天将，对每个天将返回其人物、事物、疾病、方位类象。
 */
export function analyzeKeChuanLeiXiang(
  result: DaliurenOutput,
): KeChuanLeiXiang[] {
  const { siKe, sanChuan } = result;
  const generalSet = new Set<string>();

  // 从四课收集天将
  const keKeys = [siKe.yiKe, siKe.erKe, siKe.sanKe, siKe.siKe];
  for (const ke of keKeys) {
    const g = ke?.[2] || "";
    if (g) generalSet.add(g);
  }

  // 从三传收集天将
  const chuanKeys = [sanChuan.chu, sanChuan.zhong, sanChuan.mo];
  for (const chuan of chuanKeys) {
    const g = chuan?.[1] || "";
    if (g) generalSet.add(g);
  }

  // 映射到类象
  const results: KeChuanLeiXiang[] = [];
  for (const general of generalSet) {
    const leixiang = TIAN_JIANG_LEI_XIANG[general];
    if (leixiang) {
      results.push({ ...leixiang });
    }
  }

  return results;
}

// --- 毕法赋搜索 ---

/**
 * 根据课名、三传和天将匹配毕法赋规则。
 * 遍历毕法赋规则表，检查每条规则是否与当前课传相匹配。
 */
export function searchBiFaFu(
  keName: string,
  sanChuan: { chu: string[]; zhong: string[]; mo: string[] },
  generals: string[],
): BiFaFuResult[] {
  const ctx = { keName, sanChuan, generals };

  return BI_FA_FU_RULES.map(rule => {
    const matches = rule.check(ctx);
    return {
      ruleName: rule.name,
      ruleText: rule.text,
      matches,
      explanation: matches ? rule.explain : `当前课传不符合"${rule.name}"的条件。`,
    };
  });
}


export function analyzeDaliuren(result: DaliurenOutput) {
  const info = result.dateInfo;
  const siKe = result.siKe;
  const sanChuan = result.sanChuan;
  const keTi = result.keTi;
  const keName = result.keName;
  const gongInfos = result.gongInfos;

  // 课体
  // 课体匹配：优先 subTypes，其次 method；支持二次模糊匹配
  const subTypes = keTi.subTypes.length > 0 ? keTi.subTypes : [keTi.method];
  const keySet = new Set(Object.keys(KETI_EXPLAIN));
  const tryMatch = (term: string): string | null => {
    if (keySet.has(term)) return term;
    for (const k of keySet) {
      if (k.includes(term) || term.includes(k)) return k;
    }
    return null;
  };
  const ketiAnalysis = subTypes.map(s => {
    const matchedKey = tryMatch(s);
    if (matchedKey) {
      const category = KETI_EXPLAIN[matchedKey].startsWith("吉课") ? "吉"
        : KETI_EXPLAIN[matchedKey].startsWith("凶课") ? "凶"
        : KETI_EXPLAIN[matchedKey].startsWith("变格") ? "变"
        : "—";
      return { name: s, explain: KETI_EXPLAIN[matchedKey], category };
    }
    // 方法名兜底
    if (KETI_EXPLAIN[keTi.method]) {
      const cat = KETI_EXPLAIN[keTi.method].startsWith("吉课") ? "吉"
        : KETI_EXPLAIN[keTi.method].startsWith("凶课") ? "凶"
        : KETI_EXPLAIN[keTi.method].startsWith("变格") ? "变"
        : "—";
      return { name: s, explain: KETI_EXPLAIN[keTi.method], category: cat };
    }
    return { name: s, explain: `课体${s}，需结合四课三传分析。`, category: "—" };
  });

  // 四课
  const sikeAnalysis = [
    { order: "一课", data: siKe.yiKe },
    { order: "二课", data: siKe.erKe },
    { order: "三课", data: siKe.sanKe },
    { order: "四课", data: siKe.siKe },
  ].map(ke => {
    const general = ke.data?.[2] || "";
    return {
      order: ke.order,
      upper: ke.data?.[0] || "—",
      lower: ke.data?.[1] || "—",
      general,
      generalNature: GENERAL_NATURE[general] || "—",
      generalMeaning: GENERAL_MEANING[general] || "",
    };
  });

  // 三传
  const sanchuanAnalysis = [
    { order: "初传", data: sanChuan.chu },
    { order: "中传", data: sanChuan.zhong },
    { order: "末传", data: sanChuan.mo },
  ].map(chuan => {
    const general = chuan.data?.[1] || "";
    return {
      order: chuan.order,
      branch: chuan.data?.[0] || "—",
      general,
      generalNature: GENERAL_NATURE[general] || "—",
      generalMeaning: GENERAL_MEANING[general] || "",
      liuqin: chuan.data?.[2] || "—",
      liuqinMeaning: LIUQIN_MEANING[chuan.data?.[2] || ""] || "",
    };
  });

  // 吉凶统计
  const allGenerals = [...sikeAnalysis.map(k => k.general), ...sanchuanAnalysis.map(s => s.general)];
  const goodCount = allGenerals.filter(g => GENERAL_NATURE[g] === "吉将").length;
  const badCount = allGenerals.filter(g => GENERAL_NATURE[g] === "凶将").length;

  // 末传定吉凶
  const lastChuan = sanchuanAnalysis[sanchuanAnalysis.length - 1];
  const lastIsGood = GENERAL_NATURE[lastChuan?.general || ""] === "吉将";

  return {
    keName,
    ketiMethod: keTi.method,
    ketiAnalysis,
    sikeAnalysis,
    sanchuanAnalysis,
    goodGeneralCount: goodCount,
    badGeneralCount: badCount,
    lastIsGood,
    verdict: goodCount > badCount + 2 && lastIsGood ? "吉" : badCount > goodCount + 2 ? "凶" : "中平",
    yueJiang: info.yueJiangName || info.yueJiang,
    kongWang: info.kongWang,
    yiMa: info.yiMa,
    siZhu: info.ganZhi,
  };
}
