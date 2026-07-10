import type { BaziOutput } from "../lib/taibu";

// ─── 五行生克 ───
const WUXING_SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const WUXING_KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const WUXING_BEI_KE: Record<string, string> = { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" };

// ─── 天干五行 ───
const GAN_WUXING: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土",
  庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

// ─── 天干阴阳 ───
const GAN_YINYANG: Record<string, "阳" | "阴"> = {
  甲: "阳", 乙: "阴", 丙: "阳", 丁: "阴", 戊: "阳", 己: "阴",
  庚: "阳", 辛: "阴", 壬: "阳", 癸: "阴",
};

// ─── 地支藏干（主气） ───
const ZHI_MAIN_QI: Record<string, string> = {
  寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁",
  未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬", 子: "癸", 丑: "己",
};

// ─── 地支五行 ───
const ZHI_WUXING: Record<string, string> = {
  寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火",
  未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水", 子: "水", 丑: "土",
};

// ─── 月令旺衰（五行在十二月的旺衰状态） ───
const MONTH_WANG_ShUAI: Record<string, Record<string, string>> = {
  寅: { 木: "旺", 火: "相", 土: "死", 金: "囚", 水: "休" },
  卯: { 木: "旺", 火: "相", 土: "死", 金: "囚", 水: "休" },
  辰: { 木: "余", 火: "休", 土: "旺", 金: "相", 水: "囚" },
  巳: { 木: "休", 火: "旺", 土: "相", 金: "死", 水: "囚" },
  午: { 木: "休", 火: "旺", 土: "相", 金: "死", 水: "囚" },
  未: { 木: "囚", 火: "余", 土: "旺", 金: "相", 水: "死" },
  申: { 木: "死", 火: "囚", 土: "休", 金: "旺", 水: "相" },
  酉: { 木: "死", 火: "囚", 土: "休", 金: "旺", 水: "相" },
  戌: { 木: "囚", 火: "休", 土: "旺", 金: "余", 水: "死" },
  亥: { 木: "相", 火: "死", 土: "囚", 金: "休", 水: "旺" },
  子: { 木: "相", 火: "死", 土: "囚", 金: "休", 水: "旺" },
  丑: { 木: "囚", 火: "死", 土: "旺", 金: "相", 水: "余" },
};

// ─── 十神关系 ───
function getTenGod(dayGan: string, targetGan: string): string {
  const dw = GAN_WUXING[dayGan];
  const tw = GAN_WUXING[targetGan];
  const dy = GAN_YINYANG[dayGan];
  const ty = GAN_YINYANG[targetGan];
  const same = dy === ty;

  if (dw === tw) return same ? "比肩" : "劫财";
  if (WUXING_SHENG[dw] === tw) return same ? "食神" : "伤官";
  if (WUXING_SHENG[tw] === dw) return same ? "偏印" : "正印";
  if (WUXING_KE[dw] === tw) return same ? "偏财" : "正财";
  if (WUXING_KE[tw] === dw) return same ? "七杀" : "正官";
  return "未知";
}

// ─── 类型 ───

export interface BaziStrengthResult {
  dayMaster: string;
  dayWuxing: string;
  monthBranch: string;
  monthState: string;  // 月令状态: 旺/相/休/囚/死/余
  score: number;       // 0-10
  level: string;       // 偏强/中和/偏弱/极弱
  details: string[];
  favorableElements: string[];  // 喜用五行
  unfavorableElements: string[]; // 忌五行
}

export interface BaziPattern {
  name: string;        // 格局名
  type: string;        // 普通/特殊
  tenGod: string;      // 主格十神
  description: string;
  level: "上等" | "中等" | "下等" | "特殊";
}

export interface BaziDayunAdvice {
  period: string;      // 大运干支
  age: string;         // 年龄段
  rating: "吉" | "平" | "凶";
  summary: string;
}

export interface BaziAnalysis {
  strength: BaziStrengthResult;
  patterns: BaziPattern[];
  dayunAdvice: BaziDayunAdvice[];
  summary: string;
}

// ─── 日主强弱分析 ───

export function analyzeBaziStrength(output: BaziOutput): BaziStrengthResult {
  const dayGan = output.dayMaster;
  const dayWx = GAN_WUXING[dayGan];
  const monthZhi = output.fourPillars.month.branch;
  const monthWx = ZHI_WUXING[monthZhi];
  const details: string[] = [];

  let score = 5; // 基础分

  // 1. 月令状态（最重要，权重 ±3）
  const monthState = MONTH_WANG_ShUAI[monthZhi]?.[dayWx] ?? "休";
  const monthScore: Record<string, number> = { 旺: 3, 相: 2, 余: 1.5, 休: -1, 囚: -2, 死: -3 };
  score += monthScore[monthState] ?? 0;
  details.push(`月令${monthZhi}（${monthWx}），日主${dayWx}处「${monthState}」地（${monthScore[monthState] > 0 ? '+' : ''}${monthScore[monthState]}）`);

  // 2. 天干生扶（比劫/印星）
  const pillars = ["year", "month", "day", "hour"] as const;
  let ganSupport = 0;
  for (const key of pillars) {
    const gan = output.fourPillars[key].stem;
    if (gan === dayGan) continue;
    const tg = getTenGod(dayGan, gan);
    if (tg === "比肩" || tg === "劫财") ganSupport += 1;
    if (tg === "正印" || tg === "偏印") ganSupport += 0.8;
  }
  score += ganSupport;
  if (ganSupport > 0) details.push(`天干得生扶 +${Math.round(ganSupport * 10) / 10}`);

  // 3. 地支通根（日主五行在地支中出现次数）
  let rootCount = 0;
  for (const key of pillars) {
    const zhi = output.fourPillars[key].branch;
    if (ZHI_WUXING[zhi] === dayWx) rootCount += 1;
    // 藏干中气余气也算通根
    for (const h of output.fourPillars[key].hiddenStems) {
      if (GAN_WUXING[h.stem] === dayWx) rootCount += 0.3;
    }
  }
  score += rootCount * 0.8;
  if (rootCount > 0) details.push(`地支通根 +${Math.round(rootCount * 8) / 10}`);

  // 4. 克泄耗（官杀/食伤/财星）
  let drain = 0;
  for (const key of pillars) {
    const gan = output.fourPillars[key].stem;
    if (gan === dayGan) continue;
    const tg = getTenGod(dayGan, gan);
    if (tg === "正官" || tg === "七杀") drain += 1;
    if (tg === "食神" || tg === "伤官") drain += 0.7;
    if (tg === "正财" || tg === "偏财") drain += 0.8;
  }
  score -= drain;
  if (drain > 0) details.push(`天干克泄耗 -${Math.round(drain * 10) / 10}`);

  // 5. 地支克泄
  let zhiDrain = 0;
  for (const key of pillars) {
    const zhi = output.fourPillars[key].branch;
    const zwx = ZHI_WUXING[zhi];
    if (WUXING_KE[zwx] === dayWx) zhiDrain += 0.5; // 官杀
    if (WUXING_SHENG[dayWx] === zwx) zhiDrain += 0.3; // 食伤
    if (WUXING_KE[dayWx] === zwx) zhiDrain += 0.3; // 财
  }
  score -= zhiDrain;
  if (zhiDrain > 0) details.push(`地支克泄 -${Math.round(zhiDrain * 10) / 10}`);

  // 最终评定
  const roundedScore = Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  let level: string;
  if (roundedScore >= 7) level = "偏强";
  else if (roundedScore >= 5) level = "中和";
  else if (roundedScore >= 3) level = "偏弱";
  else level = "极弱";

  // 喜用神推断
  const favorable: string[] = [];
  const unfavorable: string[] = [];
  if (roundedScore >= 6.5) {
    // 身强 → 喜克泄耗：官杀、食伤、财
    favorable.push(WUXING_KE[dayWx]);      // 官杀
    favorable.push(WUXING_SHENG[dayWx]);   // 食伤
    favorable.push(WUXING_KE[dayWx] === WUXING_KE[WUXING_SHENG[dayWx]] ? WUXING_SHENG[WUXING_SHENG[dayWx]] : WUXING_KE[WUXING_SHENG[dayWx]]);
    // 简化：取克泄耗对应的五行
    const allEls = ["木", "火", "土", "金", "水"];
    favorable.length = 0;
    const keDay = WUXING_KE[dayWx]; // 克日主的 = 官杀
    const shengWo = WUXING_SHENG[dayWx]; // 日主生的 = 食伤
    const woKe = WUXING_KE[dayWx] ? (allEls.find(e => WUXING_KE[e] === WUXING_KE[dayWx])) : "";
    for (const el of allEls) {
      if (el === dayWx) { unfavorable.push(el); continue; }
      if (el === keDay) favorable.push(el);       // 官杀克身 = 喜
      else if (WUXING_SHENG[dayWx] === el) favorable.push(el); // 食伤泄身 = 喜
      else if (WUXING_SHENG[el] === dayWx) unfavorable.push(el); // 印生身 = 忌
      else if (el === WUXING_SHENG[WUXING_SHENG[dayWx]]) favorable.push(el); // 财耗身 = 喜
    }
  } else if (roundedScore <= 3.5) {
    // 身弱 → 喜生扶：印星、比劫
    favorable.push(WUXING_SHENG[dayWx]);  // 印星生身
    favorable.push(dayWx);                // 比劫帮身
    unfavorable.push(WUXING_KE[dayWx]);   // 官杀克身 = 忌
    unfavorable.push(WUXING_SHENG[dayWx] ? WUXING_SHENG[WUXING_SHENG[dayWx]] : "");
  } else {
    // 中和 → 按季节微调
    if (["巳", "午", "未"].includes(monthZhi)) {
      favorable.push("水", "金");
      unfavorable.push("火", "木");
    } else if (["亥", "子", "丑"].includes(monthZhi)) {
      favorable.push("火", "木");
      unfavorable.push("水", "金");
    } else {
      favorable.push(WUXING_SHENG[dayWx], dayWx);
    }
  }

  return {
    dayMaster: dayGan,
    dayWuxing: dayWx,
    monthBranch: monthZhi,
    monthState,
    score: roundedScore,
    level,
    details,
    favorableElements: [...new Set(favorable)].filter(Boolean),
    unfavorableElements: [...new Set(unfavorable)].filter(Boolean),
  };
}

// ─── 格局判定 ───

export function analyzeBaziPattern(output: BaziOutput, strength: BaziStrengthResult): BaziPattern[] {
  const patterns: BaziPattern[] = [];
  const dayGan = output.dayMaster;
  const monthZhi = output.fourPillars.month.branch;
  const monthGan = output.fourPillars.month.stem;

  // 1. 月令主气取格
  const monthMainQi = ZHI_MAIN_QI[monthZhi];
  if (monthMainQi) {
    const tg = getTenGod(dayGan, monthMainQi);
    const pattern = tenGodToPattern(tg, GAN_WUXING[monthMainQi], strength);
    if (pattern) patterns.push(pattern);
  }

  // 2. 月干透出取格
  if (monthGan !== monthMainQi) {
    const tg = getTenGod(dayGan, monthGan);
    const existing = patterns.find(p => p.tenGod === tg);
    if (!existing) {
      const pattern = tenGodToPattern(tg, GAN_WUXING[monthGan], strength);
      if (pattern) patterns.push(pattern);
    }
  }

  // 3. 建禄/月刃格判定
  const dayWx = GAN_WUXING[dayGan];
  const monthWx = ZHI_WUXING[monthZhi];
  if (dayWx === monthWx) {
    const dy = GAN_YINYANG[dayGan];
    patterns.push({
      name: dy === "阳" ? "建禄格" : "月刃格",
      type: "普通",
      tenGod: dy === "阳" ? "建禄" : "月刃",
      description: dy === "阳"
        ? `日主${dayGan}临月令${monthZhi}为建禄，身强者居多，喜财官食伤。`
        : `日主${dayGan}临月令${monthZhi}为月刃（阳刃），性刚烈，需官杀制或食伤泄。`,
      level: dy === "阳" ? "中等" : "下等",
    });
  }

  // 4. 特殊格局检测
  const pillarsK = ["year", "month", "day", "hour"] as const;
  const allStems = pillarsK.map(k => output.fourPillars[k].stem);
  const allBranches = pillarsK.map(k => output.fourPillars[k].branch);

  // 从强/从旺格（比劫极多，无官杀）
  const biJieCount = allStems.filter(g => {
    if (g === dayGan) return false;
    const tg = getTenGod(dayGan, g);
    return tg === "比肩" || tg === "劫财";
  }).length;
  const guanShaCount = allStems.filter(g => {
    const tg = getTenGod(dayGan, g);
    return tg === "正官" || tg === "七杀";
  }).length;
  if (biJieCount >= 2 && guanShaCount === 0 && strength.score >= 7) {
    patterns.push({
      name: "从强格",
      type: "特殊",
      tenGod: "比劫",
      description: "日主极强，比劫成势无官杀制约，为从强格局。喜印比，忌官杀财。",
      level: "特殊",
    });
  }

  return patterns;
}

function tenGodToPattern(tg: string, wx: string, strength: BaziStrengthResult): BaziPattern | null {
  const patternMap: Record<string, [string, string, string]> = {
    "正官": ["正官格", "上等", "以官为用，喜财印相随。官星清透，贵气自显。"],
    "七杀": ["七杀格", "中等", "杀需制化，或食神制杀，或印化杀为权。制化得宜反为贵格。"],
    "正印": ["正印格", "上等", "印绶护身，主文贵、学识。喜官杀生印，忌财破印。"],
    "偏印": ["偏印格", "中等", "枭神夺食需慎，偏印为用则智谋过人，为忌则孤僻多思。"],
    "正财": ["正财格", "上等", "财星为用，喜食伤生财、官星护财。身强能任财则富贵。"],
    "偏财": ["偏财格", "中等", "偏财慷慨，喜身强。财多身弱反为财所困。"],
    "食神": ["食神格", "上等", "食神吐秀，主才智、福气。喜比劫生食，忌偏印夺食。"],
    "伤官": ["伤官格", "下等", "伤官需佩印或生财。伤官见官为祸百端，需制化。"],
  };

  const info = patternMap[tg];
  if (!info) return null;

  return {
    name: info[0],
    type: "普通",
    tenGod: tg,
    description: info[2],
    level: info[1] as BaziPattern["level"],
  };
}

// ─── 大运配合分析 ───

export function analyzeDayunCoordination(
  output: BaziOutput,
  strength: BaziStrengthResult,
  dayunList: Array<{ ganZhi: string; stem: string; branch: string; tenGod: string; startAge: number; startYear: number }>,
): BaziDayunAdvice[] {
  const dayWx = strength.dayWuxing;
  const fav = strength.favorableElements;
  const unfav = strength.unfavorableElements;

  return dayunList.slice(0, 8).map(dy => {
    const ganWx = GAN_WUXING[dy.stem];
    const zhiWx = ZHI_WUXING[dy.branch];
    const tenGod = getTenGod(strength.dayMaster, dy.stem);

    let rating: "吉" | "平" | "凶" = "平";
    let reasons: string[] = [];

    // 天干
    if (fav.includes(ganWx)) {
      rating = "吉";
      reasons.push(`天干${dy.stem}（${ganWx}）为喜用神${tenGod}`);
    } else if (unfav.includes(ganWx)) {
      rating = (rating as string) === "吉" ? "平" : "凶";
      reasons.push(`天干${dy.stem}（${ganWx}）为忌神${tenGod}`);
    }

    // 地支
    if (fav.includes(zhiWx)) {
      if (rating === "凶") rating = "平";
      else rating = "吉";
      reasons.push(`地支${dy.branch}（${zhiWx}）为喜用`);
    } else if (unfav.includes(zhiWx)) {
      if (rating === "吉") rating = "平";
      else rating = "凶";
      reasons.push(`地支${dy.branch}（${zhiWx}）为忌`);
    }

    return {
      period: dy.ganZhi,
      age: `${dy.startAge}-${dy.startAge + 9}岁`,
      rating,
      summary: reasons.length ? reasons.join("；") : "喜忌力量均衡，需结合流年详判。",
    };
  });
}

// ─── 综合总结 ───

export function generateBaziAnalysis(
  output: BaziOutput,
  dayunList: Array<{ ganZhi: string; stem: string; branch: string; tenGod: string; startAge: number; startYear: number }>,
): BaziAnalysis {
  const strength = analyzeBaziStrength(output);
  const patterns = analyzeBaziPattern(output, strength);
  const dayunAdvice = analyzeDayunCoordination(output, strength, dayunList);

  const summaryParts: string[] = [];
  summaryParts.push(`日主${output.dayMaster}（${strength.dayWuxing}），身${strength.level}（${strength.score}/10）。`);
  summaryParts.push(`月令${strength.monthBranch}，日主处「${strength.monthState}」地。`);
  if (patterns.length > 0) {
    summaryParts.push(`格局：${patterns.map(p => p.name).join("、")}。`);
  }
  summaryParts.push(`喜用五行：${strength.favorableElements.join("、") || "无"}；忌五行：${strength.unfavorableElements.join("、") || "无"}。`);

  return {
    strength,
    patterns,
    dayunAdvice,
    summary: summaryParts.join(""),
  };
}

// ═══════════════════════════════════════════════════════════
// 流年分析 (Year-by-Year Forecast)
// ═══════════════════════════════════════════════════════════

const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

// 地支六冲映射
const ZHI_CHONG: Record<string, string> = {
  子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥",
  午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳",
};

// 地支六合映射
const ZHI_HE: Record<string, string> = {
  子: "丑", 丑: "子", 寅: "亥", 亥: "寅",
  卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰",
  巳: "申", 申: "巳", 午: "未", 未: "午",
};

export interface YearAnalysis {
  year: number;
  ganZhi: string;
  stem: string;
  branch: string;
  tenGod: string;
  mainEvent: string;
  interaction: string;
  rating: "吉" | "平" | "凶";
  detail: string;
}

/**
 * 根据公历年份推算该年的天干地支。
 * 使用六十甲子纪年法，以 (year - 4) % 60 为基准。
 */
export function getGanZhiForYear(
  birthYear: number,
  targetYear: number,
): { stem: string; branch: string } {
  const cycle = ((targetYear - 4) % 60 + 60) % 60;
  return {
    stem: TIANGAN[cycle % 10],
    branch: DIZHI[cycle % 12],
  };
}

/**
 * 返回某年龄对应年份的天干地支字符串，如 "甲子年"。
 */
export function ganZhiToYearString(birthYear: number, age: number): string {
  const targetYear = birthYear + age;
  const { stem, branch } = getGanZhiForYear(birthYear, targetYear);
  return `${stem}${branch}年`;
}

/**
 * 流年预测分析：基于八字强弱与大运，给出当前及未来5个关键流年的吉凶判断。
 */
export function analyzeYearForecast(
  strength: BaziStrengthResult,
  dayun: BaziDayunAdvice[],
  birthYear: number,
): YearAnalysis[] {
  const currentYear = new Date().getFullYear();
  const dayGan = strength.dayMaster;
  const fav = strength.favorableElements;
  const unfav = strength.unfavorableElements;

  // 找出当前所处的大运
  const currentAge = currentYear - birthYear;
  let dayunStem = "";
  let dayunBranch = "";

  for (const dy of dayun) {
    const [startAgeStr] = dy.age.split("-");
    const startAge = parseInt(startAgeStr, 10);
    if (currentAge >= startAge && currentAge < startAge + 10) {
      // 从大运干支中提取天干地支
      const period = dy.period;
      if (period.length >= 2) {
        dayunStem = period[0];
        dayunBranch = period[1];
      }
      break;
    }
  }

  // 分析5个流年：前2年 + 当前年 + 后2年
  const yearRange = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const results: YearAnalysis[] = [];

  for (const year of yearRange) {
    const { stem, branch } = getGanZhiForYear(birthYear, year);
    const ganZhi = `${stem}${branch}`;
    const tenGod = getTenGod(dayGan, stem);
    const ganWx = GAN_WUXING[stem];
    const zhiWx = ZHI_WUXING[branch];

    // 评分与详情
    let rating: "吉" | "平" | "凶" = "平";
    const interactions: string[] = [];
    const details: string[] = [];

    // 天干与日主关系
    if (stem === dayGan) {
      interactions.push(`流年天干${stem}与日主${dayGan}比和`);
    } else {
      interactions.push(`流年天干${stem}为日主之${tenGod}`);
    }

    // 天干喜忌判断
    if (fav.includes(ganWx)) {
      details.push(`天干${stem}（${ganWx}）为喜用神，${tenGod}为吉`);
      rating = "吉";
    } else if (unfav.includes(ganWx)) {
      details.push(`天干${stem}（${ganWx}）为忌神，${tenGod}为忌`);
      rating = "凶";
    }

    // 地支喜忌判断
    if (fav.includes(zhiWx)) {
      details.push(`地支${branch}（${zhiWx}）为喜用`);
      if (rating === "凶") rating = "平";
      else rating = "吉";
    } else if (unfav.includes(zhiWx)) {
      details.push(`地支${branch}（${zhiWx}）为忌`);
      if (rating === "吉") rating = "平";
      else rating = "凶";
    }

    // 流年地支与大运地支的冲合关系
    if (dayunBranch && branch) {
      if (ZHI_CHONG[branch] === dayunBranch) {
        interactions.push(`流年地支${branch}冲大运${dayunBranch}支`);
        details.push(`地支${branch}冲大运${dayunBranch}，主变动、奔波，需防意外`);
        if (rating === "吉") rating = "平";
      } else if (ZHI_HE[branch] === dayunBranch) {
        interactions.push(`流年地支${branch}合大运${dayunBranch}支`);
        details.push(`地支${branch}合大运${dayunBranch}，主和谐、合作，事有转机`);
        if (rating === "凶") rating = "平";
      }
    }

    // 流年地支与日柱月令冲合
    if (ZHI_CHONG[branch] === strength.monthBranch) {
      interactions.push(`流年地支${branch}冲月令${strength.monthBranch}`);
      details.push(`流年冲月令提纲，该年多有动荡，需谨慎行事`);
    }

    // 生成主事描述
    const mainEventMap: Record<string, string> = {
      比肩: "同辈助力，合作机会增多",
      劫财: "竞争激烈，注意财务纠纷",
      食神: "才华展现，口福享受之年",
      伤官: "创意迸发，注意口舌是非",
      正财: "正财运佳，稳定收入增长",
      偏财: "意外之财，投资机会显现",
      正官: "事业晋升，责任加重之年",
      七杀: "挑战重重，压力与机遇并存",
      正印: "学业进步，贵人扶持之年",
      偏印: "独特思维，适合钻研深造",
    };

    const mainEvent = mainEventMap[tenGod] || `${tenGod}主事`;

    results.push({
      year,
      ganZhi,
      stem,
      branch,
      tenGod,
      mainEvent,
      interaction: interactions.join("；"),
      rating,
      detail: details.join("；") || "流年气运平稳，宜顺势而为。",
    });
  }

  // 按吉凶排序：吉在前，平居中，凶在后
  const ratingOrder: Record<string, number> = { 吉: 0, 平: 1, 凶: 2 };
  results.sort((a, b) => {
    if (ratingOrder[a.rating] !== ratingOrder[b.rating]) {
      return ratingOrder[a.rating] - ratingOrder[b.rating];
    }
    // 同评级按年份降序（最近的在前）
    return b.year - a.year;
  });

  return results;
}

// ─── 神煞详解 ───

export interface ShenShaReport {
  goodShenSha: Array<{ name: string; pillar: string; meaning: string; effect: string }>;
  badShenSha: Array<{ name: string; pillar: string; meaning: string; effect: string }>;
  neutralShenSha: Array<{ name: string; pillar: string; meaning: string; effect: string }>;
  summary: string;
  keyAdvice: string[];
}

// ─── 神煞数据库（45 条） ───

const SHENSHA_DATABASE: Record<string, { category: "吉" | "凶" | "中性"; meaning: string; effect: string }> = {
  // ═══ 吉神（17个） ═══
  "天乙贵人": { category: "吉", meaning: "最尊贵之吉神，主逢凶化吉、贵人扶持", effect: "一生多得贵人相助，危难时有救星，逢之终身有靠" },
  "天德贵人": { category: "吉", meaning: "天德合月德，福力最大之吉神，主福寿安康", effect: "天性善良仁慈，一生福泽深厚，灾难不侵" },
  "月德贵人": { category: "吉", meaning: "太阴之德，主化凶为吉、消灾解厄", effect: "女性贵人缘佳，灾难可化解，性情温和有德" },
  "文昌": { category: "吉", meaning: "文星，主智慧文采、科甲功名", effect: "聪明好学，有艺术天赋，考试运佳，学业出众" },
  "学堂": { category: "吉", meaning: "学业有成之象，主读书聪慧", effect: "读书易有成就，学历较高，领悟力强" },
  "词馆": { category: "吉", meaning: "语言天赋、文采口才之星", effect: "口才好，适合文职、教育、法律、传媒行业" },
  "将星": { category: "吉", meaning: "领导才能、权威之象，主掌权", effect: "有管理才能，适合担任领导职务，决断力强" },
  "天喜": { category: "吉", meaning: "喜庆之星，主婚嫁添丁、好事临门", effect: "婚恋顺利，常逢喜事，人缘极佳" },
  "红鸾": { category: "吉", meaning: "桃花正星，主姻缘美满", effect: "异性缘佳，婚姻美满，感情顺利" },
  "金舆": { category: "吉", meaning: "富贵之车，主财富地位", effect: "一生富足，有车房之福，物质生活优越" },
  "禄神": { category: "吉", meaning: "福禄之星，主食禄丰盈", effect: "衣食无忧，工作稳定，财运亨通" },
  "太极贵人": { category: "吉", meaning: "太极之气，主智慧超群、好学深思", effect: "聪明绝顶，喜研玄学命理，有特殊天赋" },
  "福星贵人": { category: "吉", meaning: "福星高照，主一生平安顺遂", effect: "天生有福，灾祸远离，晚年安康" },
  "国印贵人": { category: "吉", meaning: "掌印之象，主权力诚信", effect: "诚实可靠，适合从政或在大型机构任职" },
  "三奇贵人": { category: "吉", meaning: "天上三奇，主卓越不凡", effect: "胸怀大志，才华出众，易成大事" },
  "天厨贵人": { category: "吉", meaning: "饮食福德之星，主食禄丰厚", effect: "口福好，饮食讲究，生活品质高" },
  "月将": { category: "吉", meaning: "日月之将，主辅助君王、成就事业", effect: "有辅佐之才，适合做副职或中层管理" },

  // ═══ 中性（8个） ═══
  "华盖": { category: "中性", meaning: "孤独之星，亦主艺术才华与宗教缘分", effect: "性格孤高，有特殊才华，宗教玄学缘分深" },
  "驿马": { category: "中性", meaning: "奔波变动之象，主动中求财", effect: "一生多动，适合流动性工作，频繁迁移或出差" },
  "桃花": { category: "中性", meaning: "咸池桃花，主人缘魅力", effect: "异性缘旺，人缘好，但需防感情纠葛" },
  "魁罡": { category: "中性", meaning: "刚烈果断之星，亦主威严", effect: "性格刚强，做事果断，但易得罪人" },
  "血刃": { category: "中性", meaning: "血光之星，与手术、医疗相关", effect: "可能与医疗行业有缘，但需防意外血光" },
  "金神": { category: "中性", meaning: "破坏与重建之力", effect: "有破旧立新的能力，性格刚毅不屈" },
  "十恶大败": { category: "中性", meaning: "日柱逢之，主挥霍不聚财", effect: "花钱大方，不善理财，但为人豪爽" },
  "阴阳差错": { category: "中性", meaning: "婚姻不顺之象", effect: "婚姻宜迟，需注意夫妻沟通，晚婚为宜" },

  // ═══ 凶煞（20个） ═══
  "羊刃": { category: "凶", meaning: "刚强暴戾之煞，主血光争斗", effect: "性格刚烈，易冲动受伤，需防手术血光之灾" },
  "劫煞": { category: "凶", meaning: "劫夺破败之煞，主意外损失", effect: "易遭意外损失，财产不聚，需防小人劫财" },
  "灾煞": { category: "凶", meaning: "灾祸之煞，主突发灾厄", effect: "需防意外灾害，水火灾伤，出行注意安全" },
  "孤辰": { category: "凶", meaning: "孤独之煞，主性格孤僻", effect: "性格孤僻，婚姻易迟，社交圈子小" },
  "寡宿": { category: "凶", meaning: "孤寡之煞，主配偶缘薄", effect: "孤独感重，配偶缘分薄，宜培养兴趣爱好" },
  "亡神": { category: "凶", meaning: "心神不宁之煞，主精神压力", effect: "精神压力大，易焦虑失眠，需注意心理健康" },
  "元辰": { category: "凶", meaning: "大耗之煞，主破财损耗", effect: "破财损耗，事多不顺，需谨慎理财" },
  "空亡": { category: "凶", meaning: "虚无落空之象，主事与愿违", effect: "计划易落空，付出难有回报，宜务实不空想" },
  "六厄": { category: "凶", meaning: "困厄之煞，主处境艰难", effect: "常处困境，需坚韧不拔才能脱困" },
  "勾绞": { category: "凶", meaning: "纠缠之煞，主官非口舌", effect: "易惹官非纠纷，需谨慎言行，避免诉讼" },
  "丧门": { category: "凶", meaning: "丧事之煞，主孝服哀伤", effect: "需注意家人健康，逢之宜多关怀长辈" },
  "吊客": { category: "凶", meaning: "吊丧之煞，主白事奔丧", effect: "逢之需防亲友故去，注意自身健康" },
  "天罗": { category: "凶", meaning: "罗网之一，主困顿难脱", effect: "运势受阻如入罗网，需耐心等待时机" },
  "地网": { category: "凶", meaning: "罗网之二，主寸步难行", effect: "事业停滞，举步维艰，宜守不宜攻" },
  "白虎": { category: "凶", meaning: "凶暴之煞，主血光横祸", effect: "需防意外伤害及手术，出行交通要小心" },
  "飞廉": { category: "凶", meaning: "飞来横祸之煞", effect: "易遭无妄之灾，防人之心不可无" },
  "卷舌": { category: "凶", meaning: "口舌是非之煞", effect: "易惹口舌争端，需谨言慎行，少论他人是非" },
  "披麻": { category: "凶", meaning: "孝服之煞，主哀伤之事", effect: "多愁善感，需注意家人健康及情感维系" },
  "天哭": { category: "凶", meaning: "悲泣之煞，主忧伤烦恼", effect: "情绪易低落，需学会调节心态" },
  "流星": { category: "凶", meaning: "短暂灾厄之煞", effect: "灾来快去也快，但逢之当年需格外小心" },
};

function classifyShenSha(
  shenShaResult: Record<string, string[]>
): ShenShaReport {
  const good: ShenShaReport["goodShenSha"] = [];
  const bad: ShenShaReport["badShenSha"] = [];
  const neutral: ShenShaReport["neutralShenSha"] = [];
  const pillarNames: Record<string, string> = {
    yearSha: "年柱",
    monthSha: "月柱",
    daySha: "日柱",
    hourSha: "时柱",
    taiYuanSha: "胎元",
    mingGongSha: "命宫",
  };

  for (const [key, shaList] of Object.entries(shenShaResult)) {
    const pillarName = pillarNames[key] || key;
    for (const shaName of shaList) {
      const entry = SHENSHA_DATABASE[shaName];
      if (!entry) continue;
      const item = { name: shaName, pillar: pillarName, meaning: entry.meaning, effect: entry.effect };
      if (entry.category === "吉") good.push(item);
      else if (entry.category === "凶") bad.push(item);
      else neutral.push(item);
    }
  }

  // 生成总结
  const goodCount = good.length;
  const badCount = bad.length;
  const neutralCount = neutral.length;
  let summary = "";
  const keyAdvice: string[] = [];

  if (goodCount > badCount) {
    summary = `命带${goodCount}个吉神，${badCount}个凶煞，${neutralCount}个中性星。整体神煞格局偏吉，命主福泽较厚，一生多得贵人相助。`;
    keyAdvice.push("善用吉神优势，在贵人运旺盛的领域深耕发展");
  } else if (badCount > goodCount) {
    summary = `命带${goodCount}个吉神，${badCount}个凶煞，${neutralCount}个中性星。凶煞较多，命途多舛，需以德化煞、行善积福。`;
    keyAdvice.push("多做善事积累福德，可有效化解凶煞之气");
    keyAdvice.push("遇事保持冷静，以柔克刚，避免正面冲突");
  } else {
    summary = `命带${goodCount}个吉神，${badCount}个凶煞，${neutralCount}个中性星。吉凶参半，需善于把握机遇、规避风险。`;
    keyAdvice.push("顺势而为，吉运时积极进取，凶运时保守谨慎");
  }

  // 针对不同神煞给出建议
  if (good.some(s => s.name === "文昌" || s.name === "学堂" || s.name === "词馆")) {
    keyAdvice.push("学业运佳，适合深造进修，走学术或专业路线");
  }
  if (good.some(s => s.name === "将星")) {
    keyAdvice.push("命带将星，适合担任管理职务或自主创业");
  }
  if (good.some(s => s.name === "天乙贵人" || s.name === "天德贵人" || s.name === "月德贵人")) {
    keyAdvice.push("贵人星入命，遇到困难时应主动寻求他人帮助");
  }
  if (good.some(s => s.name === "禄神")) {
    keyAdvice.push("禄神照命，稳定工作比冒险创业更适合");
  }
  if (bad.some(s => s.name === "羊刃")) {
    keyAdvice.push("羊刃在命，需克制冲动，避免高风险活动，注意身体安全");
  }
  if (bad.some(s => s.name === "劫煞" || s.name === "元辰")) {
    keyAdvice.push("劫煞/元辰入命，理财需保守，不宜担保借贷");
  }
  if (bad.some(s => s.name === "孤辰" || s.name === "寡宿")) {
    keyAdvice.push("孤寡星重，建议主动拓宽社交圈，培养团队协作习惯");
  }
  if (bad.some(s => s.name === "空亡")) {
    keyAdvice.push("空亡入命，计划宜务实，忌好高骛远，从小事做起");
  }
  if (neutral.some(s => s.name === "华盖")) {
    keyAdvice.push("华盖星显，宜发挥艺术天赋或在玄学、哲学领域深耕");
  }
  if (neutral.some(s => s.name === "驿马")) {
    keyAdvice.push("驿马星动，适合作流动性强的工作，不宜长期困守一地");
  }
  if (neutral.some(s => s.name === "桃花")) {
    keyAdvice.push("桃花入命，人缘佳，但需注意感情专一，防烂桃花");
  }

  // 去重建议
  const unique = [...new Set(keyAdvice)];
  return { goodShenSha: good, badShenSha: bad, neutralShenSha: neutral, summary, keyAdvice: unique };
}

export function analyzeShenSha(shenShaResult: any): ShenShaReport {
  // 标准化输入：聚合所有柱的神煞
  const merged: Record<string, string[]> = {};

  const pillars = ["yearSha", "monthSha", "daySha", "hourSha", "taiYuanSha", "mingGongSha"];
  for (const key of pillars) {
    const raw = shenShaResult?.[key];
    if (Array.isArray(raw) && raw.length > 0) {
      merged[key] = raw.filter((s: any) => typeof s === "string");
    } else {
      merged[key] = [];
    }
  }

  return classifyShenSha(merged);
}


// ─── 长生十二宫 ───

const CHANGSHENG_BASE: Record<string, string> = {
  "甲": "亥", "丙": "寅", "戊": "寅", "庚": "巳", "壬": "申",
  "乙": "午", "丁": "酉", "己": "酉", "辛": "子", "癸": "卯",
};

const DIZHI_ORDER = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CHANGSHENG_STAGES = ["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];

export interface ChangSheng12Result {
  stage: string;
  index: number; // 0-11
  stageName: string;
  meaning: string;
  isGood: boolean;
}

const CHANGSHENG_MEANING: Record<string, string> = {
  "长生": "如人之初生，充满活力与希望。万物萌发，生机勃勃。",
  "沐浴": "如婴儿洗浴，脆弱易伤。桃花之事，情感波动。",
  "冠带": "如少年加冠，逐渐成熟。开始承担社会责任。",
  "临官": "如人出仕为官，事业有成。禄位高升，权柄在握。",
  "帝旺": "如帝王临朝，力量巅峰。兴旺至极，但盛极将衰。",
  "衰": "如中年之后，力量渐退。需收敛保守，不可冒进。",
  "病": "如人身患疾病，力不从心。诸事不顺，需修养调理。",
  "死": "如生命终结，气运低迷。静止不动，宜守不宜攻。",
  "墓": "如入坟墓，收藏入库。韬光养晦，积蓄力量。",
  "绝": "如气息断绝，至弱之时。破而后立，死地后生。",
  "胎": "如胎儿孕育，新的开始。暗中酝酿，等待时机。",
  "养": "如婴儿被养，缓慢成长。需要呵护，渐入佳境。",
};

export function getChangSheng12(stem: string, branch: string): ChangSheng12Result {
  const baseZhi = CHANGSHENG_BASE[stem];
  if (!baseZhi) return { stage: "—", index: -1, stageName: "—", meaning: "", isGood: false };
  
  const baseIdx = DIZHI_ORDER.indexOf(baseZhi);
  const branchIdx = DIZHI_ORDER.indexOf(branch);
  if (baseIdx < 0 || branchIdx < 0) return { stage: "—", index: -1, stageName: "—", meaning: "", isGood: false };
  
  // 阳干顺行，阴干逆行
  const yangStems = ["甲","丙","戊","庚","壬"];
  const isYang = yangStems.includes(stem);
  
  let stageIdx: number;
  if (isYang) {
    stageIdx = (branchIdx - baseIdx + 12) % 12;
  } else {
    stageIdx = (baseIdx - branchIdx + 12) % 12;
  }
  
  const stageName = CHANGSHENG_STAGES[stageIdx];
  const isGood = ["长生","冠带","临官","帝旺","胎","养"].includes(stageName);
  
  return {
    stage: stageName,
    index: stageIdx,
    stageName,
    meaning: CHANGSHENG_MEANING[stageName] || "",
    isGood,
  };
}

export interface PillarChangShengReport {
  pillars: Array<{
    type: "年柱" | "月柱" | "日柱" | "时柱";
    stem: string;
    branch: string;
    naYin?: string;
    changSheng: ChangSheng12Result;
  }>;
  dayStemSummary: string;
}

export function analyzePillarChangSheng(fourPillars: Record<string, any>): PillarChangShengReport {
  const order = ["year","month","day","hour"];
  const labels: Record<string, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };
  
  const pillars = order.map(pos => {
    const p = fourPillars[pos];
    const stem = p?.stem || p?.heavenlyStem || "—";
    const branch = p?.branch || p?.earthlyBranch || "—";
    return {
      type: labels[pos] as PillarChangShengReport["pillars"][0]["type"],
      stem,
      branch,
      naYin: p?.naYin,
      changSheng: getChangSheng12(stem, branch),
    };
  });
  
  const dayPillar = pillars.find(p => p.type === "日柱");
  const dayStage = dayPillar?.changSheng?.stageName || "—";
  const daySummary = dayPillar 
    ? `日主${dayPillar.stem}在${dayPillar.branch}处于「${dayStage}」地。${CHANGSHENG_MEANING[dayStage] || ""}`
    : "";
  
  return { pillars, dayStemSummary: daySummary };
}

// ─── 调候分析（Climate Adjustment Analysis） ───
// 调候是八字核心理论：根据日主天干和月令地支，判断命局需要什么五行来"调和气候"

const TIAOHOU_DATABASE: Record<string, Record<string, string[]>> = {
  "甲": { "寅": ["丙","癸"], "卯": ["庚","丙","丁","戊","己"], "辰": ["庚","丁","壬"], "巳": ["癸","丁","庚"], "午": ["癸","丁","庚"], "未": ["癸","丁","庚"], "申": ["庚","丁","壬"], "酉": ["庚","丁","壬"], "戌": ["庚","甲","丁","壬","癸"], "亥": ["庚","丁","丙","戊"], "子": ["丁","庚","丙"], "丑": ["丁","庚","丙"] },
  "乙": { "寅": ["丙","癸"], "卯": ["丙","癸"], "辰": ["癸","丙","戊"], "巳": ["癸"], "午": ["癸","丙"], "未": ["癸","丙"], "申": ["丙","癸","己"], "酉": ["丙","癸"], "戌": ["癸","辛"], "亥": ["丙","戊"], "子": ["丙"], "丑": ["丙"] },
  "丙": { "寅": ["壬","庚"], "卯": ["壬","己"], "辰": ["壬","甲"], "巳": ["壬","庚","癸"], "午": ["壬","庚"], "未": ["壬","庚"], "申": ["壬","戊"], "酉": ["壬","癸"], "戌": ["甲","壬"], "亥": ["壬","戊","庚"], "子": ["壬","戊","己"], "丑": ["壬","甲"] },
  "丁": { "寅": ["甲","庚"], "卯": ["庚","甲"], "辰": ["甲","庚"], "巳": ["甲","庚"], "午": ["壬","庚","癸"], "未": ["甲","庚","壬"], "申": ["甲","庚","丙","戊"], "酉": ["甲","庚","丙","戊"], "戌": ["甲","庚","戊"], "亥": ["甲","庚"], "子": ["甲","庚"], "丑": ["甲","庚"] },
  "戊": { "寅": ["丙","甲","癸"], "卯": ["丙","甲","癸"], "辰": ["甲","癸","丙"], "巳": ["甲","丙","癸"], "午": ["壬","甲","丙"], "未": ["壬","甲","丙"], "申": ["丙","癸","甲"], "酉": ["丙","癸"], "戌": ["甲","丙","癸"], "亥": ["甲","丙"], "子": ["丙","甲"], "丑": ["丙","甲"] },
  "己": { "寅": ["丙","庚","甲"], "卯": ["甲","癸","丙"], "辰": ["丙","甲","癸"], "巳": ["癸","丙"], "午": ["癸","丙"], "未": ["癸","丙"], "申": ["丙","癸"], "酉": ["丙","癸"], "戌": ["甲","丙","癸"], "亥": ["丙","甲","戊"], "子": ["丙","甲","戊"], "丑": ["丙","甲","戊"] },
  "庚": { "寅": ["戊","甲","壬","丙","丁"], "卯": ["丁","甲","庚","丙"], "辰": ["甲","丁","壬","癸"], "巳": ["壬","戊","丙","丁"], "午": ["壬","癸"], "未": ["丁","甲"], "申": ["丁","甲"], "酉": ["丁","甲","丙"], "戌": ["甲","壬"], "亥": ["丁","丙"], "子": ["丁","甲","丙"], "丑": ["丙","丁","甲"] },
  "辛": { "寅": ["己","壬","庚"], "卯": ["壬","甲"], "辰": ["壬","甲"], "巳": ["壬","甲","癸"], "午": ["壬","己","癸"], "未": ["壬","庚","甲"], "申": ["壬","甲","戊"], "酉": ["壬","甲"], "戌": ["壬","甲"], "亥": ["壬"], "子": ["丙","戊","壬","甲"], "丑": ["丙","壬","戊","己"] },
  "壬": { "寅": ["庚","丙","戊"], "卯": ["戊","辛","庚"], "辰": ["甲","庚"], "巳": ["壬","辛","庚","癸"], "午": ["癸","庚","辛"], "未": ["辛","甲"], "申": ["戊","丁"], "酉": ["甲","庚"], "戌": ["甲","丙"], "亥": ["戊","丙","庚"], "子": ["戊","丙"], "丑": ["丙","丁","甲"] },
  "癸": { "寅": ["辛","丙"], "卯": ["庚","辛"], "辰": ["丙","辛","甲"], "巳": ["辛"], "午": ["庚","辛","壬","癸"], "未": ["庚","辛","壬","癸"], "申": ["丁"], "酉": ["辛","丙"], "戌": ["辛","甲","丙","癸"], "亥": ["庚","辛","戊","丁"], "子": ["丙","辛"], "丑": ["丙","丁"] },
};

const TIAOHOU_ELEMENT_MEANING: Record<string, string> = {
  "甲": "甲木参天，疏土破郁，生机勃发",
  "乙": "乙木柔韧，藤萝系甲，攀附而上",
  "丙": "丙火太阳，温暖照煦，驱寒解冻",
  "丁": "丁火灯烛，文明之象，冶炼成器",
  "戊": "戊土厚重，堤防水流，稳固根基",
  "己": "己土卑湿，润泽滋养，培木育金",
  "庚": "庚金刚健，劈甲引丁，雕琢成材",
  "辛": "辛金珠玉，清润秀丽，晶莹剔透",
  "壬": "壬水江河，淘洗冲刷，润泽万物",
  "癸": "癸水雨露，滋润萌发，细水长流",
};

export interface ClimateReport {
  dayMaster: string;
  monthBranch: string;
  requiredElements: string[];           // 调候所需天干
  presentElements: string[];            // 四柱天干中已具备的调候用神
  missingElements: string[];            // 四柱天干中缺失的调候用神
  presentMeanings: Array<{ element: string; meaning: string }>;
  missingMeanings: Array<{ element: string; meaning: string }>;
  rating: "调候得力" | "调候不足" | "调候缺失";  // 调候评级
  summary: string;                      // 综合解读
}

export function analyzeTiaoHou(
  dayMaster: string,
  monthBranch: string,
  fourPillars: Record<string, any>,
): ClimateReport {
  const dayStemMap = TIAOHOU_DATABASE[dayMaster];
  const requiredElements = dayStemMap?.[monthBranch] ?? [];

  // 收集四柱所有天干
  const allStems: string[] = [];
  const pillars = ["year", "month", "day", "hour"];
  for (const key of pillars) {
    const stem = fourPillars[key]?.stem || fourPillars[key]?.heavenlyStem;
    if (stem) allStems.push(stem);
  }

  // 区分已具备和缺失的调候用神
  const presentElements: string[] = [];
  const missingElements: string[] = [];

  for (const el of requiredElements) {
    if (allStems.includes(el)) {
      presentElements.push(el);
    } else {
      missingElements.push(el);
    }
  }

  // 生成含义列表
  const presentMeanings = presentElements.map(el => ({
    element: el,
    meaning: TIAOHOU_ELEMENT_MEANING[el] || "",
  }));

  const missingMeanings = missingElements.map(el => ({
    element: el,
    meaning: TIAOHOU_ELEMENT_MEANING[el] || "",
  }));

  // 评级
  let rating: ClimateReport["rating"];
  let summary: string;

  if (requiredElements.length === 0) {
    rating = "调候得力";
    summary = `${dayMaster}日主生于${monthBranch}月，无特殊调候需求，命局自洽。`;
  } else if (presentElements.length === requiredElements.length) {
    rating = "调候得力";
    const names = presentElements.join("、");
    summary = `${dayMaster}日主生于${monthBranch}月，需${requiredElements.join("、")}调候。命局天干已见${names}，调候得力，气候调和，万物得育。`;
  } else if (presentElements.length === 0) {
    rating = "调候缺失";
    summary = `${dayMaster}日主生于${monthBranch}月，需${requiredElements.join("、")}调候，然四柱天干无一得见。调候缺失，寒暖燥湿失衡，格局层次受制，宜待大运流年补足。`;
  } else {
    rating = "调候不足";
    const pNames = presentElements.join("、");
    const mNames = missingElements.join("、");
    summary = `${dayMaster}日主生于${monthBranch}月，需${requiredElements.join("、")}调候。已见${pNames}为喜，尚缺${mNames}，调候不足，需大运流年补足方能发用。`;
  }

  return {
    dayMaster,
    monthBranch,
    requiredElements,
    presentElements,
    missingElements,
    presentMeanings,
    missingMeanings,
    rating,
    summary,
  };
}
