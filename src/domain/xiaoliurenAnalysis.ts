// ─── 道家小六壬 · 三宫具象法 ───
// 参考 DaoJiaXiaoLiuRen 项目，完整实现：
//  - 三宫具象法（天盘/地盘/人盘三盘联动）
//  - 八卦具象法（爻→卦转化）
//  - 六亲推演（每个关系映射三宫）
//  - 三种起卦方式：月日时 / 时刻分 / 三数法

// 六掌诀详解
const PALM_MEANING: Record<string, { nature: string; wuxing: string; yinYang: string; yao: string; brief: string; detail: string; direction: string }> = {
  "大安": {
    nature: "吉", wuxing: "木", yinYang: "阳", yao: "阳爻",
    brief: "身未动，平安稳定。",
    detail: "大安事事昌，求谋在东方。失物不远去，宅舍保安康。行人身未动，病者主无妨。将军回田野，仔细与推详。",
    direction: "东方",
  },
  "留连": {
    nature: "凶", wuxing: "土", yinYang: "阴", yao: "阴爻",
    brief: "事难成，拖延反复。",
    detail: "留连事难成，求谋日不明。官事宜迟缓，去者未回程。失物南方见，急讨方称心。更须防口舌，人口且平平。",
    direction: "南方",
  },
  "速喜": {
    nature: "吉", wuxing: "火", yinYang: "阳", yao: "阳爻",
    brief: "喜事临，迅速有成。",
    detail: "速喜喜来临，求财向南行。失物申午见，行人路上寻。官事有福德，病者无祸侵。田宅六畜吉，行人有信音。",
    direction: "南方",
  },
  "赤口": {
    nature: "凶", wuxing: "金", yinYang: "阳", yao: "阴爻",
    brief: "口舌争，官非破财。",
    detail: "赤口主口舌，官非切要防。失物急去寻，行人有惊慌。鸡犬多作怪，病者出西方。更须防咒诅，恐怕染瘟殃。",
    direction: "西方",
  },
  "小吉": {
    nature: "吉", wuxing: "水", yinYang: "阳", yao: "阳爻",
    brief: "和合吉，万事顺利。",
    detail: "小吉最吉昌，路上好商量。阳人来报喜，失物在坤方。行人立便至，交关真是强。凡事皆和合，病者祷上苍。",
    direction: "西南",
  },
  "空亡": {
    nature: "大凶", wuxing: "土", yinYang: "阳", yao: "阴爻",
    brief: "事不牢，谋事落空。",
    detail: "空亡事不长，阴人多乖张。求财无利益，行人有灾殃。失物寻不见，官事主刑伤。病人逢暗鬼，禳解保安康。",
    direction: "无定向",
  },
};

// 时辰五行与阴阳
const HOUR_WUXING: Record<string, string> = {
  "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
  "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水",
};
const HOUR_YINYANG: Record<string, string> = {
  "子": "阳", "丑": "阴", "寅": "阳", "卯": "阴", "辰": "阳", "巳": "阴",
  "午": "阳", "未": "阴", "申": "阳", "酉": "阴", "戌": "阳", "亥": "阴",
};

// 八卦
const BAGUA_YAO: Record<string, string[]> = {
  "乾": ["阳爻", "阳爻", "阳爻"], "兑": ["阴爻", "阳爻", "阳爻"],
  "离": ["阳爻", "阴爻", "阳爻"], "震": ["阴爻", "阴爻", "阳爻"],
  "巽": ["阳爻", "阳爻", "阴爻"], "坎": ["阴爻", "阳爻", "阴爻"],
  "艮": ["阳爻", "阴爻", "阴爻"], "坤": ["阴爻", "阴爻", "阴爻"],
};
const BAGUA_WUXING: Record<string, string> = {
  "乾": "金", "兑": "金", "离": "火", "震": "木", "巽": "木", "坎": "水", "艮": "土", "坤": "土",
};
const BAGUA_MEANING: Record<string, string> = {
  "乾": "为天，刚健中正。主创造、领导、父性。自强不息，元亨利贞。",
  "兑": "为泽，悦而丽。主言说、喜悦、少女。朋友讲习，以和为贵。",
  "离": "为火，光明赫赫。主文明、美丽、依附。明照四方，虚中能容。",
  "震": "为雷，震惊百里。主行动、惊变、长子。恐惧修省，临变不惊。",
  "巽": "为风，无孔不入。主传播、柔顺、长女。申命行事，顺势而为。",
  "坎": "为水，流而不盈。主智慧、危险、中男。常德行，习教事。",
  "艮": "为山，止其所止。主停止、稳重、少男。思不出位，知止不殆。",
  "坤": "为地，厚德载物。主包容、母性、承载。柔顺利贞，品物咸亨。",
};

// 六亲含义（含三宫解义）
const LIUQIN_MEANING_FULL: Record<string, { relation: string; creator: string; tianMeaning: string; diMeaning: string; renMeaning: string }> = {
  "父母": { relation: "生我者", creator: "官鬼生父母", tianMeaning: "天宫父母主长辈、文书、学业运势", diMeaning: "地宫父母主房产、根基、家庭环境", renMeaning: "人宫父母主靠山、师长、贵人助力" },
  "妻财": { relation: "我克者", creator: "兄弟生妻财", tianMeaning: "天宫妻财主天时财运、投资机遇", diMeaning: "地宫妻财主实体资产、积蓄底蕴", renMeaning: "人宫妻财主合作收益、人际财运" },
  "官鬼": { relation: "克我者", creator: "妻财生官鬼", tianMeaning: "天宫官鬼主事业机遇、官职变动", diMeaning: "地宫官鬼主官司刑伤、暗病隐忧", renMeaning: "人宫官鬼主是非纷争、上司压力" },
  "兄弟": { relation: "同我者", creator: "子孙生兄弟", tianMeaning: "天宫兄弟主竞争格局、市场动向", diMeaning: "地宫兄弟主兄弟姐妹、合伙人状态", renMeaning: "人宫兄弟主社交圈、朋友助力/阻力" },
  "子孙": { relation: "我生者", creator: "父母生子孙", tianMeaning: "天宫子孙主创新灵感、机遇萌发", diMeaning: "地宫子孙主资产增值源、投资项目", renMeaning: "人宫子孙主下属、晚辈、团队活力" },
};

// 五行生克
const WUXING_SHENG: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
const WUXING_KE: Record<string, string> = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

const PALMS = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"];
const HOUR_INDEX: Record<string, number> = {
  "子": 1, "丑": 2, "寅": 3, "卯": 4, "辰": 5, "巳": 6,
  "午": 7, "未": 8, "申": 9, "酉": 10, "戌": 11, "亥": 12,
};

function getYao(palm: string): string { return PALM_MEANING[palm]?.yao || "阳爻"; }

function getBagua(yaoList: string[]): string {
  for (const [name, yao] of Object.entries(BAGUA_YAO)) {
    if (yao[0] === yaoList[0] && yao[1] === yaoList[1] && yao[2] === yaoList[2]) return name;
  }
  return "—";
}

function getRelation(a: string, b: string): number {
  if (a === b) return 0;
  if (WUXING_SHENG[a] === b) return 1;
  if (WUXING_SHENG[b] === a) return -1;
  if (WUXING_KE[a] === b) return 2;
  if (WUXING_KE[b] === a) return -2;
  return 0;
}

function relationLabel(rel: number): string {
  if (rel === 0) return "比和";
  if (rel === 1) return "生";
  if (rel === -1) return "被生";
  if (rel === 2) return "克";
  if (rel === -2) return "被克";
  return "—";
}

function relationFullLabel(rel: number, a: string, b: string): string {
  if (rel === 0) return `${a}与${b}比和，同类相助`;
  if (rel === 1) return `${a}生${b}，能量输出`;
  if (rel === -1) return `${b}生${a}，得外力滋养`;
  if (rel === 2) return `${a}克${b}，制约控制`;
  if (rel === -2) return `${b}克${a}，受制受压`;
  return "—";
}

// 由五行找出对应掌诀
function findPalmByWuxing(wx: string, exclude: string[] = []): string {
  for (const palm of PALMS) {
    if (PALM_MEANING[palm].wuxing === wx && !exclude.includes(palm)) return palm;
  }
  return "留连";
}

export interface XiaoLiuRenResult {
  method: "monthDayHour" | "hourMinute" | "numbers";
  methodLabel: string;
  lunarMonth: number;
  lunarDay: number;
  lunarHour: string;
  lunarHourYinYang: string;
  numbers?: number[];

  // 三宫
  tianGong: string; diGong: string; renGong: string;
  tianDetail: typeof PALM_MEANING[string];
  diDetail: typeof PALM_MEANING[string];
  renDetail: typeof PALM_MEANING[string];

  // 八卦转化
  bagua: string;
  baguaName: string;
  baguaMeaning: string;
  baguaWuxing: string;

  // 三盘具象（核心深度）
  tianPan: string[]; // 天盘三宫
  diPan: string[];   // 地盘三宫
  renPan: string[];  // 人盘三宫

  // 五行生克
  wuxingRelations: Array<{ a: string; b: string; rel: string; full: string }>;

  // 六亲推演（每个六亲映射三宫）
  liuQin: Record<string, { tian: string; di: string; ren: string; meaning: string }>;

  // 时辰关系
  hourWuXing: string;
  hourTianRelation: string;
  hourDiRelation: string;
  hourRenRelation: string;

  // 综合判断
  overall: "大吉" | "吉" | "中平" | "凶" | "大凶";
  overallSummary: string[];
}

/**
 * 三宫具象法 — 核心算法（来自 DaoJiaXiaoLiuRen）
 * 根据天/地/人三宫推算天盘、地盘、人盘
 */
function threeGongConcretization(tianGong: string, diGong: string, renGong: string): {
  tianPan: string[]; diPan: string[]; renPan: string[];
} {
  // 获取八卦
  const tg = getYao(renGong), dg = getYao(tianGong), rg = getYao(diGong);
  const tianPanYao = getBagua([tg, dg, rg]);
  const diPanYao = getBagua([getYao(tianGong), getYao(diGong), getYao(renGong)]);
  const renPanYao = getBagua([getYao(tianGong), getYao(renGong), getYao(diGong)]);

  const twx = PALM_MEANING[tianGong].wuxing;
  const dwx = PALM_MEANING[diGong].wuxing;
  const rwx = PALM_MEANING[renGong].wuxing;
  const tpwx = BAGUA_WUXING[tianPanYao] || "土";
  const dpwx = BAGUA_WUXING[diPanYao] || "土";
  const rpwx = BAGUA_WUXING[renPanYao] || "土";

  function getResult(wx: string, relation: number): string {
    for (const [palm, detail] of Object.entries(PALM_MEANING)) {
      if (getRelation(wx, detail.wuxing) === relation) return palm;
    }
    return "留连";
  }

  const tr = getRelation(twx, tpwx), dr = getRelation(dwx, dpwx), rr = getRelation(rwx, rpwx);
  let tianPan = tr === 0 ? [tianGong, diGong, renGong] : [getResult(twx, tr), getResult(dwx, tr), getResult(rwx, tr)];
  let diPan = dr === 0 ? [tianGong, diGong, renGong] : [getResult(twx, dr), getResult(dwx, dr), getResult(rwx, dr)];
  let renPan = rr === 0 ? [tianGong, diGong, renGong] : [getResult(twx, rr), getResult(dwx, rr), getResult(rwx, rr)];
  
  // 土 → 留连
  tianPan = tianPan.map(p => PALM_MEANING[p]?.wuxing === "土" ? "留连" : p);
  diPan = diPan.map(p => PALM_MEANING[p]?.wuxing === "土" ? "留连" : p);
  renPan = renPan.map(p => PALM_MEANING[p]?.wuxing === "土" ? "留连" : p);

  return { tianPan, diPan, renPan };
}

/**
 * 核心起卦算法
 */
function computePalaces(month: number, day: number, hourIdx: number): [string, string, string] {
  const tianIdx = ((month - 1) % 6 + day - 1) % 6;
  const diIdx = (tianIdx + hourIdx - 1) % 6;
  const renIdx = (diIdx + hourIdx - 1) % 6;
  return [PALMS[tianIdx], PALMS[diIdx], PALMS[renIdx]];
}

/**
 * 数字起卦法
 */
function computeByNumbers(nums: number[]): [string, string, string] {
  const tianIdx = (nums[0] - 1) % 6;
  const diIdx = ((nums[0] - 1) % 6 + nums[1] - 1) % 6;
  const renIdx = ((nums[0] - 1) % 6 + nums[1] - 1 + nums[2] - 1) % 6;
  return [PALMS[tianIdx], PALMS[diIdx], PALMS[renIdx]];
}

// ========== 公开 API ==========

/**
 * 月日时起卦（传统方法）
 */
export function calculateXiaoLiuRen(
  lunarMonth: number, lunarDay: number, lunarHour: string,
): XiaoLiuRenResult {
  const hIdx = HOUR_INDEX[lunarHour] || 1;
  const [tianGong, diGong, renGong] = computePalaces(lunarMonth, lunarDay, hIdx);

  const tianDetail = PALM_MEANING[tianGong];
  const diDetail = PALM_MEANING[diGong];
  const renDetail = PALM_MEANING[renGong];

  // 八卦
  const bagua = getBagua([getYao(tianGong), getYao(diGong), getYao(renGong)]);

  // 三盘具象
  const { tianPan, diPan, renPan } = threeGongConcretization(tianGong, diGong, renGong);

  // 五行关系
  const twx = tianDetail.wuxing, dwx = diDetail.wuxing, rwx = renDetail.wuxing;
  const wuxingRelations = [
    { a: "天宫", b: "地宫", rel: relationLabel(getRelation(twx, dwx)), full: relationFullLabel(getRelation(twx, dwx), tianGong, diGong) },
    { a: "天宫", b: "人宫", rel: relationLabel(getRelation(twx, rwx)), full: relationFullLabel(getRelation(twx, rwx), tianGong, renGong) },
    { a: "地宫", b: "人宫", rel: relationLabel(getRelation(dwx, rwx)), full: relationFullLabel(getRelation(dwx, rwx), diGong, renGong) },
  ];

  // 六亲推演（每个六亲映射到三宫）—— 基于五行生克
  const liuQin: Record<string, { tian: string; di: string; ren: string; meaning: string }> = {};
  const liuQinNames = ["父母", "妻财", "官鬼", "兄弟", "子孙"];
  const qiFrom = (wx: string, lq: string): string => {
    if (lq === "兄弟") return findPalmByWuxing(wx);
    if (lq === "子孙") return findPalmByWuxing(WUXING_SHENG[wx] || "火");
    if (lq === "妻财") return findPalmByWuxing(WUXING_KE[wx] || "水");
    if (lq === "官鬼") for (const [k, v] of Object.entries(WUXING_KE)) { if (v === wx) return findPalmByWuxing(k); }
    if (lq === "父母") for (const [k, v] of Object.entries(WUXING_SHENG)) { if (v === wx) return findPalmByWuxing(k); }
    return "留连";
  };
  for (const lq of liuQinNames) {
    const info = LIUQIN_MEANING_FULL[lq];
    liuQin[lq] = {
      tian: qiFrom(twx, lq), di: qiFrom(dwx, lq), ren: qiFrom(rwx, lq),
      meaning: info.tianMeaning,
    };
  }

  // 时辰关系
  const hwx = HOUR_WUXING[lunarHour] || "水";
  const hourTianRelation = relationFullLabel(getRelation(hwx, twx), `时辰${lunarHour}`, tianGong);
  const hourDiRelation = relationFullLabel(getRelation(hwx, dwx), `时辰${lunarHour}`, diGong);
  const hourRenRelation = relationFullLabel(getRelation(hwx, rwx), `时辰${lunarHour}`, renGong);

  // 综合判断
  const natures = [tianDetail.nature, diDetail.nature, renDetail.nature];
  const goodCount = natures.filter(n => n === "吉").length;
  const badCount = natures.filter(n => n === "凶" || n === "大凶").length;
  let overall: XiaoLiuRenResult["overall"] = "中平";
  if (goodCount >= 3) overall = "大吉";
  else if (goodCount >= 2) overall = "吉";
  else if (badCount >= 3) overall = "大凶";
  else if (badCount >= 2) overall = "凶";

  const overallSummary = [
    `天宫「${tianGong}」${tianDetail.brief}`,
    `地宫「${diGong}」${diDetail.brief}`,
    `人宫「${renGong}」${renDetail.brief}`,
    `三爻化卦「${bagua}」— ${BAGUA_MEANING[bagua] || ""}`,
    `${tianGong}生克：天地${relationLabel(getRelation(twx, dwx))} · 天人${relationLabel(getRelation(twx, rwx))} · 地人${relationLabel(getRelation(dwx, rwx))}`,
  ];

  return {
    method: "monthDayHour", methodLabel: "月日时法",
    lunarMonth, lunarDay, lunarHour,
    lunarHourYinYang: HOUR_YINYANG[lunarHour] || "阳",
    tianGong, diGong, renGong,
    tianDetail, diDetail, renDetail,
    bagua, baguaName: bagua, baguaMeaning: BAGUA_MEANING[bagua] || "",
    baguaWuxing: BAGUA_WUXING[bagua] || "土",
    tianPan, diPan, renPan,
    wuxingRelations,
    liuQin,
    hourWuXing: hwx, hourTianRelation, hourDiRelation, hourRenRelation,
    overall, overallSummary,
  };
}

/**
 * 数字起卦法
 */
export function calculateXiaoLiuRenByNumbers(nums: number[], lunarMonth: number, lunarDay: number, lunarHour: string): XiaoLiuRenResult {
  const hIdx = HOUR_INDEX[lunarHour] || 1;
  const [tianGong, diGong, renGong] = computeByNumbers(nums);

  const tianDetail = PALM_MEANING[tianGong];
  const diDetail = PALM_MEANING[diGong];
  const renDetail = PALM_MEANING[renGong];

  const bagua = getBagua([getYao(tianGong), getYao(diGong), getYao(renGong)]);
  const { tianPan, diPan, renPan } = threeGongConcretization(tianGong, diGong, renGong);

  const twx = tianDetail.wuxing, dwx = diDetail.wuxing, rwx = renDetail.wuxing;
  const wuxingRelations = [
    { a: "天宫", b: "地宫", rel: relationLabel(getRelation(twx, dwx)), full: relationFullLabel(getRelation(twx, dwx), tianGong, diGong) },
    { a: "天宫", b: "人宫", rel: relationLabel(getRelation(twx, rwx)), full: relationFullLabel(getRelation(twx, rwx), tianGong, renGong) },
    { a: "地宫", b: "人宫", rel: relationLabel(getRelation(dwx, rwx)), full: relationFullLabel(getRelation(dwx, rwx), diGong, renGong) },
  ];

  const liuQin: Record<string, { tian: string; di: string; ren: string; meaning: string }> = {};
  const qiFrom = (wx: string, lq: string): string => {
    if (lq === "兄弟") return findPalmByWuxing(wx);
    if (lq === "子孙") return findPalmByWuxing(WUXING_SHENG[wx] || "火");
    if (lq === "妻财") return findPalmByWuxing(WUXING_KE[wx] || "水");
    if (lq === "官鬼") for (const [k, v] of Object.entries(WUXING_KE)) { if (v === wx) return findPalmByWuxing(k); }
    if (lq === "父母") for (const [k, v] of Object.entries(WUXING_SHENG)) { if (v === wx) return findPalmByWuxing(k); }
    return "留连";
  };
  for (const lq of ["父母", "妻财", "官鬼", "兄弟", "子孙"]) {
    liuQin[lq] = { tian: qiFrom(twx, lq), di: qiFrom(dwx, lq), ren: qiFrom(rwx, lq), meaning: LIUQIN_MEANING_FULL[lq].tianMeaning };
  }

  const hwx = HOUR_WUXING[lunarHour] || "水";
  const natures = [tianDetail.nature, diDetail.nature, renDetail.nature];
  const goodCount = natures.filter(n => n === "吉").length;
  const badCount = natures.filter(n => n === "凶" || n === "大凶").length;
  let overall: XiaoLiuRenResult["overall"] = "中平";
  if (goodCount >= 3) overall = "大吉";
  else if (goodCount >= 2) overall = "吉";
  else if (badCount >= 3) overall = "大凶";
  else if (badCount >= 2) overall = "凶";

  return {
    method: "numbers", methodLabel: "数字法",
    lunarMonth, lunarDay, lunarHour,
    lunarHourYinYang: HOUR_YINYANG[lunarHour] || "阳",
    numbers: nums,
    tianGong, diGong, renGong,
    tianDetail, diDetail, renDetail,
    bagua, baguaName: bagua, baguaMeaning: BAGUA_MEANING[bagua] || "",
    baguaWuxing: BAGUA_WUXING[bagua] || "土",
    tianPan, diPan, renPan,
    wuxingRelations,
    liuQin,
    hourWuXing: hwx,
    hourTianRelation: relationFullLabel(getRelation(hwx, twx), `时辰${lunarHour}`, tianGong),
    hourDiRelation: relationFullLabel(getRelation(hwx, dwx), `时辰${lunarHour}`, diGong),
    hourRenRelation: relationFullLabel(getRelation(hwx, rwx), `时辰${lunarHour}`, renGong),
    overall,
    overallSummary: [
      `天宫「${tianGong}」${tianDetail.brief}`,
      `地宫「${diGong}」${diDetail.brief}`,
      `人宫「${renGong}」${renDetail.brief}`,
      `三爻化卦「${bagua}」— ${BAGUA_MEANING[bagua] || ""}`,
      `数字 ${nums[0]}-${nums[1]}-${nums[2]} 起卦`,
    ],
  };
}

/**
 * 根据小时获取时辰名称
 * @param hour 北京时间 0-23
 * @returns 时辰名称（子丑寅卯辰巳午未申酉戌亥）
 */
export function getShiChenFromHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 23 || h === 0) return "子";
  if (h === 1 || h === 2) return "丑";
  if (h === 3 || h === 4) return "寅";
  if (h === 5 || h === 6) return "卯";
  if (h === 7 || h === 8) return "辰";
  if (h === 9 || h === 10) return "巳";
  if (h === 11 || h === 12) return "午";
  if (h === 13 || h === 14) return "未";
  if (h === 15 || h === 16) return "申";
  if (h === 17 || h === 18) return "酉";
  if (h === 19 || h === 20) return "戌";
  return "亥";
}

/**
 * 时刻分法起卦
 * 将时辰分为"刻"（每刻15分钟，一个时辰8刻）和"分"（每刻内15分），
 * 以时辰、刻、分三数推算天/地/人三宫。
 *
 * 算法：
 * - 天宫 = (时辰序号 + 刻序号 - 1) % 6
 * - 地宫 = (天宫序号 + 刻序号 - 1) % 6
 * - 人宫 = (地宫序号 + 分序号 - 1) % 6
 *
 * @param hour 北京时间 0-23
 * @param minute 分钟 0-59
 */
export function calculateXiaoLiuRenByTimeMinute(hour: number, minute: number): XiaoLiuRenResult {
  const shiChen = getShiChenFromHour(hour);
  const shiChenIdx = HOUR_INDEX[shiChen] || 1;
  const keIdx = Math.floor(minute / 15) + 1;
  const fenIdx = (minute % 15) + 1;

  const tianIdx = (shiChenIdx + keIdx - 1) % 6;
  const diIdx = (tianIdx + keIdx - 1) % 6;
  const renIdx = (diIdx + fenIdx - 1) % 6;

  const tianGong = PALMS[tianIdx];
  const diGong = PALMS[diIdx];
  const renGong = PALMS[renIdx];

  const tianDetail = PALM_MEANING[tianGong];
  const diDetail = PALM_MEANING[diGong];
  const renDetail = PALM_MEANING[renGong];

  const bagua = getBagua([getYao(tianGong), getYao(diGong), getYao(renGong)]);
  const { tianPan, diPan, renPan } = threeGongConcretization(tianGong, diGong, renGong);

  const twx = tianDetail.wuxing, dwx = diDetail.wuxing, rwx = renDetail.wuxing;
  const wuxingRelations = [
    { a: "天宫", b: "地宫", rel: relationLabel(getRelation(twx, dwx)), full: relationFullLabel(getRelation(twx, dwx), tianGong, diGong) },
    { a: "天宫", b: "人宫", rel: relationLabel(getRelation(twx, rwx)), full: relationFullLabel(getRelation(twx, rwx), tianGong, renGong) },
    { a: "地宫", b: "人宫", rel: relationLabel(getRelation(dwx, rwx)), full: relationFullLabel(getRelation(dwx, rwx), diGong, renGong) },
  ];

  const liuQin: Record<string, { tian: string; di: string; ren: string; meaning: string }> = {};
  const qiFrom = (wx: string, lq: string): string => {
    if (lq === "兄弟") return findPalmByWuxing(wx);
    if (lq === "子孙") return findPalmByWuxing(WUXING_SHENG[wx] || "火");
    if (lq === "妻财") return findPalmByWuxing(WUXING_KE[wx] || "水");
    if (lq === "官鬼") for (const [k, v] of Object.entries(WUXING_KE)) { if (v === wx) return findPalmByWuxing(k); }
    if (lq === "父母") for (const [k, v] of Object.entries(WUXING_SHENG)) { if (v === wx) return findPalmByWuxing(k); }
    return "留连";
  };
  for (const lq of ["父母", "妻财", "官鬼", "兄弟", "子孙"]) {
    liuQin[lq] = { tian: qiFrom(twx, lq), di: qiFrom(dwx, lq), ren: qiFrom(rwx, lq), meaning: LIUQIN_MEANING_FULL[lq].tianMeaning };
  }

  const hwx = HOUR_WUXING[shiChen] || "水";
  const hourTianRelation = relationFullLabel(getRelation(hwx, twx), `时辰${shiChen}`, tianGong);
  const hourDiRelation = relationFullLabel(getRelation(hwx, dwx), `时辰${shiChen}`, diGong);
  const hourRenRelation = relationFullLabel(getRelation(hwx, rwx), `时辰${shiChen}`, renGong);

  const natures = [tianDetail.nature, diDetail.nature, renDetail.nature];
  const goodCount = natures.filter(n => n === "吉").length;
  const badCount = natures.filter(n => n === "凶" || n === "大凶").length;
  let overall: XiaoLiuRenResult["overall"] = "中平";
  if (goodCount >= 3) overall = "大吉";
  else if (goodCount >= 2) overall = "吉";
  else if (badCount >= 3) overall = "大凶";
  else if (badCount >= 2) overall = "凶";

  return {
    method: "hourMinute", methodLabel: "时刻分法",
    lunarMonth: 1, lunarDay: 1,
    lunarHour: shiChen,
    lunarHourYinYang: HOUR_YINYANG[shiChen] || "阳",
    tianGong, diGong, renGong,
    tianDetail, diDetail, renDetail,
    bagua, baguaName: bagua, baguaMeaning: BAGUA_MEANING[bagua] || "",
    baguaWuxing: BAGUA_WUXING[bagua] || "土",
    tianPan, diPan, renPan,
    wuxingRelations,
    liuQin,
    hourWuXing: hwx, hourTianRelation, hourDiRelation, hourRenRelation,
    overall,
    overallSummary: [
      `天宫「${tianGong}」${tianDetail.brief}`,
      `地宫「${diGong}」${diDetail.brief}`,
      `人宫「${renGong}」${renDetail.brief}`,
      `三爻化卦「${bagua}」— ${BAGUA_MEANING[bagua] || ""}`,
      `${shiChen}时第${keIdx}刻第${fenIdx}分 起卦`,
    ],
  };
}
