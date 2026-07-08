import { Lunar, Solar } from "lunar-javascript";
import { branchElements, hexagrams, naJia, sixSpiritStarts, trigrams, xunKong } from "./liuyaoData";
import type { FiveElement, GanZhi, HexRelation, HexagramRecord, LiuyaoChart, LiuyaoInput, RuleSignal, SixRelation, TrigramName, YaoLine, YaoValue, YinYang } from "./types";

const gan = "甲乙丙丁戊己庚辛壬癸".split("");
const zhi = "子丑寅卯辰巳午未申酉戌亥".split("");
const elements: FiveElement[] = ["木", "火", "土", "金", "水"];
const sixRelations: SixRelation[] = ["兄弟", "子孙", "妻财", "官鬼", "父母"];
const clashPairs: Record<string, string> = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
const branchCombinePairs: Record<string, string> = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
const progressingPairs: Record<string, string> = { 亥: "子", 寅: "卯", 巳: "午", 申: "酉", 丑: "辰", 辰: "未", 未: "戌", 戌: "丑" };
const retreatingPairs: Record<string, string> = { 子: "亥", 卯: "寅", 午: "巳", 酉: "申", 辰: "丑", 未: "辰", 戌: "未", 丑: "戌" };
const threeHarmonyGroups = [
  { branches: ["申", "子", "辰"], element: "水" },
  { branches: ["亥", "卯", "未"], element: "木" },
  { branches: ["寅", "午", "戌"], element: "火" },
  { branches: ["巳", "酉", "丑"], element: "金" },
] as const;
const sixClashHexagrams = new Set(["乾为天", "坤为地", "兑为泽", "离为火", "坎为水", "震为雷", "巽为风", "艮为山", "雷天大壮", "天雷无妄"]);
const sixCombineHexagrams = new Set(["天地否", "泽水困", "火山旅", "雷地豫", "水泽节", "山火贲", "地雷复", "地天泰"]);
const twelveStages = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"] as const;
const twelveStageStarts: Record<FiveElement, string> = {
  木: "亥",
  火: "寅",
  土: "申",
  金: "巳",
  水: "申",
};

function keyFromLines(lines: YinYang[]) {
  const lower = trigramFromBits(lines.slice(0, 3));
  const upper = trigramFromBits(lines.slice(3, 6));
  return `${upper}-${lower}`;
}

function trigramFromBits(bits: YinYang[]): TrigramName {
  const match = Object.entries(trigrams).find(([, item]) => item.bits.join() === bits.join());
  if (!match) throw new Error("卦爻阴阳组合无效");
  return match[0] as TrigramName;
}

function findHexagram(lines: YinYang[]): HexagramRecord {
  const key = keyFromLines(lines);
  const record = hexagrams.find((item) => item.key === key);
  if (!record) throw new Error(`未找到卦象：${key}`);
  return record;
}

function parseGanZhi(text: string): GanZhi {
  return { gan: text.slice(0, 1), zhi: text.slice(1, 2), text };
}

function elementRelation(self: FiveElement, target: FiveElement): SixRelation {
  if (self === target) return "兄弟";
  const selfIndex = elements.indexOf(self);
  const targetIndex = elements.indexOf(target);
  if ((selfIndex + 1) % 5 === targetIndex) return "子孙";
  if ((targetIndex + 1) % 5 === selfIndex) return "父母";
  if ((selfIndex + 2) % 5 === targetIndex) return "妻财";
  return "官鬼";
}

function lineGanZhi(hex: HexagramRecord, position: number): GanZhi {
  const trigram = position <= 3 ? hex.lower : hex.upper;
  const side = position <= 3 ? "inner" : "outer";
  const text = naJia[trigram][side][(position - 1) % 3];
  return parseGanZhi(text);
}

function buildLines(hex: HexagramRecord, values: YaoValue[], lines: YinYang[], moving: boolean[], dayGan: string, monthBranch: string, dayBranch: string, relationElement = hex.palaceElement): YaoLine[] {
  const spirits = sixSpiritStarts[dayGan] ?? sixSpiritStarts.甲;
  return lines.map((yinYang, index) => {
    const position = index + 1;
    const ganZhi = lineGanZhi(hex, position);
    const element = branchElements[ganZhi.zhi];
    const monthState = getMonthState(monthBranch, element);
    const isDayClash = clashPairs[dayBranch] === ganZhi.zhi;
    return {
      position,
      value: values[index],
      yinYang,
      moving: moving[index],
      changedYinYang: moving[index] ? flip(yinYang) : yinYang,
      hidden: false,
      sixSpirit: spirits[index],
      sixRelation: elementRelation(relationElement, element),
      ganZhi,
      element,
      monthState,
      twelveStage: getTwelveStage(element, ganZhi.zhi),
      isMonthBroken: clashPairs[monthBranch] === ganZhi.zhi,
      isDayClash,
      isDarkMoving: !moving[index] && isDayClash && (monthState === "旺" || monthState === "相"),
      transformLabels: [],
      isShi: position === hex.shiLine,
      isYing: position === hex.yingLine,
      shenSha: [],
    };
  });
}

function flip(value: YinYang): YinYang {
  return value === "yang" ? "yin" : "yang";
}

function normalizeDate(input: LiuyaoInput) {
  const [year, month, day] = input.date.split("-").map(Number);
  if (input.calendarType === "lunar") {
    const solar = Lunar.fromYmd(year, month, day).getSolar();
    return Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), input.hour, input.minute, 0);
  }
  return Solar.fromYmdHms(year, month, day, input.hour, input.minute, 0);
}

function linesFromValues(values: YaoValue[]): YinYang[] {
  return values.map((value) => (value % 2 === 1 ? "yang" : "yin"));
}

function movingFromValues(values: YaoValue[]): boolean[] {
  return values.map((value) => value === 6 || value === 9);
}

function getMonthState(monthBranch: string, lineElement: FiveElement): YaoLine["monthState"] {
  const monthElement = branchElements[monthBranch];
  if (monthElement === lineElement) return "旺";
  const monthIndex = elements.indexOf(monthElement);
  const lineIndex = elements.indexOf(lineElement);
  if ((monthIndex + 1) % 5 === lineIndex) return "相";
  if ((lineIndex + 1) % 5 === monthIndex) return "休";
  if ((lineIndex + 2) % 5 === monthIndex) return "囚";
  return "死";
}

function getTwelveStage(element: FiveElement, branch: string): YaoLine["twelveStage"] {
  const startBranch = twelveStageStarts[element];
  const startIndex = zhi.indexOf(startBranch);
  const branchIndex = zhi.indexOf(branch);
  if (startIndex < 0 || branchIndex < 0) return "长生";
  return twelveStages[(branchIndex - startIndex + 12) % 12];
}

function findXunKong(day: string) {
  const dayIndex = ganZhiIndex(day);
  const headIndex = dayIndex - (dayIndex % 10);
  const head = `${gan[headIndex % 10]}${zhi[headIndex % 12]}`;
  return xunKong[head] ?? [];
}

function ganZhiIndex(text: string) {
  for (let index = 0; index < 60; index += 1) {
    if (`${gan[index % 10]}${zhi[index % 12]}` === text) return index;
  }
  return 0;
}

export function calculateLiuyao(input: LiuyaoInput): LiuyaoChart {
  if (input.lineValues.length !== 6) {
    throw new Error("六爻输入必须包含六条爻");
  }
  const solar = normalizeDate(input);
  const lunar = solar.getLunar();
  const rawLines = linesFromValues(input.lineValues);
  const moving = movingFromValues(input.lineValues);
  const original = findHexagram(rawLines);
  const changedRaw = rawLines.map((line, index) => (moving[index] ? flip(line) : line));
  const changed = findHexagram(changedRaw);
  const year = parseGanZhi(lunar.getYearInGanZhi());
  const month = parseGanZhi(lunar.getMonthInGanZhi());
  const day = parseGanZhi(lunar.getDayInGanZhi());
  const time = parseGanZhi(lunar.getTimeInGanZhi());
  const lines = buildLines(original, input.lineValues, rawLines, moving, day.gan, month.zhi, day.zhi);
  const changedLines = buildLines(changed, input.lineValues.map((value, index) => (moving[index] ? changedValue(value) : value)) as YaoValue[], changedRaw, Array(6).fill(false), day.gan, month.zhi, day.zhi, original.palaceElement);
  const emptyBranches = findXunKong(day.text);
  const monthBranch = month.zhi;
  attachTransformLabels(lines, changedLines, emptyBranches, monthBranch);
  attachHiddenSpirits(lines, original, month.zhi);
  attachShenSha(lines, day.gan, day.zhi);
  const hexRelation = getHexRelation(original, changed);
  const ruleSignals = buildRuleSignals(lines, changedLines, hexRelation, emptyBranches, month.zhi, day.zhi);

  return {
    input,
    solarDate: solar.toYmdHms(),
    lunarDate: lunar.toString(),
    year,
    month,
    day,
    time,
    monthBranch: month.zhi,
    emptyBranches,
    original,
    changed,
    lines,
    changedLines,
    hexRelation,
    ruleSignals,
    notes: buildNotes(lines, month.zhi, day.zhi, emptyBranches),
  };
}

function changedValue(value: YaoValue): YaoValue {
  if (value === 6) return 7;
  if (value === 9) return 8;
  return value;
}

function attachTransformLabels(lines: YaoLine[], changedLines: YaoLine[], emptyBranches: string[], monthBranch: string) {
  for (const line of lines) {
    if (!line.moving) continue;
    const changed = changedLines[line.position - 1];
    const labels: string[] = [];
    if (generates(changed.element, line.element)) labels.push("回头生");
    if (controls(changed.element, line.element)) labels.push("回头克");
    if (line.element === changed.element && line.ganZhi.zhi !== changed.ganZhi.zhi) labels.push("同气变");
    if (line.ganZhi.zhi === changed.ganZhi.zhi) labels.push("伏吟变");
    if (isProgressingBranch(line.ganZhi.zhi, changed.ganZhi.zhi)) labels.push("进神");
    if (isRetreatingBranch(line.ganZhi.zhi, changed.ganZhi.zhi)) labels.push("退神");

    // 化绝、化墓、化长生、化帝旺
    const elementStage = getTwelveStage(line.element, changed.ganZhi.zhi);
    if (elementStage === "绝") labels.push("化绝");
    if (elementStage === "墓") labels.push("化墓");
    if (elementStage === "长生") labels.push("化长生");
    if (elementStage === "帝旺") labels.push("化旺");

    // 化空：变爻地支在旬空
    if (emptyBranches.includes(changed.ganZhi.zhi)) labels.push("化空");

    // 化破：变爻地支被月建冲
    if (clashPairs[monthBranch] === changed.ganZhi.zhi) labels.push("化破");

    line.transformLabels = labels.length ? labels : ["发动"];
  }
}

function attachHiddenSpirits(lines: YaoLine[], original: HexagramRecord, monthBranch: string) {
  const present = new Set(lines.map((line) => line.sixRelation));
  const missing = sixRelations.filter((relation) => !present.has(relation));
  if (!missing.length) return;
  const palaceHex = hexagrams.find((hex) => hex.palace === original.palace && hex.stage === "本宫");
  if (!palaceHex) return;
  const palaceLines = Array.from({ length: 6 }, (_, index) => {
    const position = index + 1;
    const ganZhi = lineGanZhi(palaceHex, position);
    const element = branchElements[ganZhi.zhi];
    return {
      position,
      ganZhi,
      element,
      sixRelation: elementRelation(original.palaceElement, element),
      monthState: getMonthState(monthBranch, element),
      twelveStage: getTwelveStage(element, ganZhi.zhi),
    };
  });
  for (const relation of missing) {
    const hidden = palaceLines.find((line) => line.sixRelation === relation);
    if (!hidden) continue;
    const fly = lines[hidden.position - 1];
    fly.hiddenSpirit = {
      sixRelation: hidden.sixRelation,
      ganZhi: hidden.ganZhi,
      element: hidden.element,
      monthState: hidden.monthState,
      twelveStage: hidden.twelveStage,
      flyRelation: getHiddenFlyRelation(hidden.element, fly.element),
    };
  }
}

function getHiddenFlyRelation(hidden: FiveElement, fly: FiveElement): NonNullable<YaoLine["hiddenSpirit"]>["flyRelation"] {
  if (hidden === fly) return "伏飞同气";
  if (generates(hidden, fly)) return "伏生飞";
  if (generates(fly, hidden)) return "飞生伏";
  if (controls(hidden, fly)) return "伏克飞";
  return "飞克伏";
}

// 神煞计算
const tianYiGuiRen: Record<string, string[]> = {
  "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
  "乙": ["子", "申"], "己": ["子", "申"],
  "丙": ["亥", "酉"], "丁": ["亥", "酉"],
  "辛": ["午", "寅"], "壬": ["卯", "巳"], "癸": ["卯", "巳"],
};

const yiMaBranches: Record<string, string> = {
  "申": "寅", "子": "寅", "辰": "寅",
  "寅": "申", "午": "申", "戌": "申",
  "巳": "亥", "酉": "亥", "丑": "亥",
  "亥": "巳", "卯": "巳", "未": "巳",
};

const taoHuaBranches: Record<string, string> = {
  "申": "酉", "子": "酉", "辰": "酉",
  "寅": "卯", "午": "卯", "戌": "卯",
  "巳": "午", "酉": "午", "丑": "午",
  "亥": "子", "卯": "子", "未": "子",
};

const luShenMap: Record<string, string> = {
  "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午",
  "戊": "巳", "己": "午", "庚": "申", "辛": "酉",
  "壬": "亥", "癸": "子",
};

const huaGaiBranches: Record<string, string> = {
  "申": "辰", "子": "辰", "辰": "辰",
  "寅": "戌", "午": "戌", "戌": "戌",
  "巳": "丑", "酉": "丑", "丑": "丑",
  "亥": "未", "卯": "未", "未": "未",
};

const jiangXingBranches: Record<string, string> = {
  "申": "子", "子": "子", "辰": "子",
  "寅": "午", "午": "午", "戌": "午",
  "巳": "酉", "酉": "酉", "丑": "酉",
  "亥": "卯", "卯": "卯", "未": "卯",
};

const yangRenMap: Record<string, string> = {
  "甲": "卯", "丙": "午", "戊": "午",
  "庚": "酉", "壬": "子",
  "乙": "寅", "丁": "巳", "己": "巳",
  "辛": "申", "癸": "亥",
};

const wenChangMap: Record<string, string> = {
  "甲": "巳", "乙": "午", "丙": "申", "丁": "酉",
  "戊": "申", "己": "酉", "庚": "亥", "辛": "子",
  "壬": "寅", "癸": "卯",
};

const xueTangMap: Record<string, string> = {
  "甲": "亥", "乙": "午", "丙": "寅", "丁": "酉",
  "戊": "寅", "己": "酉", "庚": "巳", "辛": "子",
  "壬": "申", "癸": "卯",
};

const jieShaBranches: Record<string, string> = {
  "申": "巳", "子": "巳", "辰": "巳",
  "寅": "亥", "午": "亥", "戌": "亥",
  "巳": "申", "酉": "申", "丑": "申",
  "亥": "寅", "卯": "寅", "未": "寅",
};

const zaiShaBranches: Record<string, string> = {
  "申": "午", "子": "午", "辰": "午",
  "寅": "子", "午": "子", "戌": "子",
  "巳": "卯", "酉": "卯", "丑": "卯",
  "亥": "酉", "卯": "酉", "未": "酉",
};

const tianXiBranches: Record<string, string> = {
  "申": "酉", "子": "酉", "辰": "酉",
  "寅": "戌", "午": "戌", "戌": "戌",
  "巳": "丑", "酉": "丑", "丑": "丑",
  "亥": "未", "卯": "未", "未": "未",
};

function attachShenSha(lines: YaoLine[], dayGan: string, dayZhi: string) {
  const guiRen = tianYiGuiRen[dayGan] || [];
  const yiMa = yiMaBranches[dayZhi];
  const taoHua = taoHuaBranches[dayZhi];
  const luShen = luShenMap[dayGan];
  const huaGai = huaGaiBranches[dayZhi];
  const jiangXing = jiangXingBranches[dayZhi];
  const yangRen = yangRenMap[dayGan];
  const wenChang = wenChangMap[dayGan];
  const xueTang = xueTangMap[dayGan];
  const jieSha = jieShaBranches[dayZhi];
  const zaiSha = zaiShaBranches[dayZhi];
  const tianXi = tianXiBranches[dayZhi];

  for (const line of lines) {
    const zhi = line.ganZhi.zhi;
    const sha: string[] = [];
    if (guiRen.includes(zhi)) sha.push("天乙贵人");
    if (yiMa === zhi) sha.push("驿马");
    if (taoHua === zhi) sha.push("桃花");
    if (luShen === zhi) sha.push("禄神");
    if (huaGai === zhi) sha.push("华盖");
    if (jiangXing === zhi) sha.push("将星");
    if (yangRen === zhi) sha.push("羊刃");
    if (wenChang === zhi) sha.push("文昌");
    if (xueTang === zhi) sha.push("学堂");
    if (jieSha === zhi) sha.push("劫煞");
    if (zaiSha === zhi) sha.push("灾煞");
    if (tianXi === zhi) sha.push("天喜");
    line.shenSha = sha;
  }
}

function isProgressingBranch(source: string, target: string) {
  return progressingPairs[source] === target;
}

function isRetreatingBranch(source: string, target: string) {
  return retreatingPairs[source] === target;
}

function generates(source: FiveElement, target: FiveElement) {
  return (elements.indexOf(source) + 1) % 5 === elements.indexOf(target);
}

function controls(source: FiveElement, target: FiveElement) {
  return (elements.indexOf(source) + 2) % 5 === elements.indexOf(target);
}

function getHexRelation(original: HexagramRecord, changed: HexagramRecord): HexRelation {
  return {
    isSixClash: sixClashHexagrams.has(original.name),
    isSixCombine: sixCombineHexagrams.has(original.name),
    isFanYin: original.upper === changed.lower && original.lower === changed.upper && original.key !== changed.key,
    isFuYin: original.key === changed.key,
  };
}

function buildRuleSignals(lines: YaoLine[], changedLines: YaoLine[], hexRelation: HexRelation, emptyBranches: string[], monthBranch: string, dayBranch: string): RuleSignal[] {
  const signals: RuleSignal[] = [];
  const moving = lines.filter((line) => line.moving);
  const dark = lines.filter((line) => line.isDarkMoving);
  const broken = lines.filter((line) => line.isMonthBroken);
  const empty = lines.filter((line) => emptyBranches.includes(line.ganZhi.zhi));
  if (moving.length) {
    signals.push({ title: "动爻入口", level: "neutral", body: `${moving.map((line) => `${line.position}爻${line.sixRelation}`).join("、")}发动，先看动变对世爻、用神与所问对象的作用。` });
  }
  if (dark.length) {
    signals.push({ title: "暗动", level: "watch", body: `${dark.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}逢日冲且旺相，虽静而有暗中推动。` });
  }
  if (broken.length) {
    signals.push({ title: "月破", level: "watch", body: `${broken.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}被月建冲破，当前力量受损。` });
  }
  if (empty.length) {
    signals.push({ title: "旬空", level: "watch", body: `${empty.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}落空亡，需看冲空、填实、出空。` });
  }
  const hidden = lines.filter((line) => line.hiddenSpirit);
  if (hidden.length) {
    signals.push({
      title: "伏神",
      level: "neutral",
      body: hidden.map((line) => `${line.hiddenSpirit?.sixRelation}${line.hiddenSpirit?.ganZhi.text}伏于${line.position}爻${line.sixRelation}${line.ganZhi.text}下，${line.hiddenSpirit?.flyRelation}`).join("；"),
    });
  }
  const shenLines = lines.filter((line) => line.shenSha.length > 0);
  if (shenLines.length) {
    const parts = shenLines.map((line) => `${line.position}爻${line.sixRelation}${line.ganZhi.text}临${line.shenSha.join("、")}`);
    const guiren = shenLines.filter((line) => line.shenSha.includes("天乙贵人"));
    const yima = shenLines.filter((line) => line.shenSha.includes("驿马"));
    const taohua = shenLines.filter((line) => line.shenSha.includes("桃花"));
    const lushen = shenLines.filter((line) => line.shenSha.includes("禄神"));
    const huagai = shenLines.filter((line) => line.shenSha.includes("华盖"));
    const yangren = shenLines.filter((line) => line.shenSha.includes("羊刃"));
    const wenchang = shenLines.filter((line) => line.shenSha.includes("文昌"));
    const jiesha = shenLines.filter((line) => line.shenSha.includes("劫煞"));
    const zaisha = shenLines.filter((line) => line.shenSha.includes("灾煞"));
    const tianxi = shenLines.filter((line) => line.shenSha.includes("天喜"));
    
    if (guiren.length) signals.push({ title: "贵人", level: "good", body: parts.filter((_, i) => shenLines[i].shenSha.includes("天乙贵人")).join("；") + "，遇贵人助缘或逢化解之机。" });
    if (lushen.length) signals.push({ title: "禄神", level: "good", body: parts.filter((_, i) => shenLines[i].shenSha.includes("禄神")).join("；") + "，临禄则衣食丰足，事有根基。" });
    if (wenchang.length) signals.push({ title: "文昌", level: "good", body: parts.filter((_, i) => shenLines[i].shenSha.includes("文昌")).join("；") + "，文昌主文才学业，利考试文书。" });
    if (tianxi.length) signals.push({ title: "天喜", level: "good", body: parts.filter((_, i) => shenLines[i].shenSha.includes("天喜")).join("；") + "，天喜主喜庆，宜婚嫁添丁。" });
    if (yima.length) signals.push({ title: "驿马", level: "neutral", body: parts.filter((_, i) => shenLines[i].shenSha.includes("驿马")).join("；") + "，主奔波、变动、出行之象。" });
    if (taohua.length) signals.push({ title: "桃花", level: "neutral", body: parts.filter((_, i) => shenLines[i].shenSha.includes("桃花")).join("；") + "，桃花主感情人缘，亦需防烂桃花。" });
    if (huagai.length) signals.push({ title: "华盖", level: "neutral", body: parts.filter((_, i) => shenLines[i].shenSha.includes("华盖")).join("；") + "，华盖主孤独孤高，宜学术修行。" });
    if (yangren.length) signals.push({ title: "羊刃", level: "watch", body: parts.filter((_, i) => shenLines[i].shenSha.includes("羊刃")).join("；") + "，羊刃主刚烈劫夺，慎防冲突伤害。" });
    if (jiesha.length) signals.push({ title: "劫煞", level: "watch", body: parts.filter((_, i) => shenLines[i].shenSha.includes("劫煞")).join("；") + "，劫煞主意外破耗，慎防财物损失。" });
    if (zaisha.length) signals.push({ title: "灾煞", level: "watch", body: parts.filter((_, i) => shenLines[i].shenSha.includes("灾煞")).join("；") + "，灾煞主突发灾祸，凡事需加倍谨慎。" });
    // Other remaining shensha
    const categorized = new Set(["天乙贵人","驿马","桃花","禄神","华盖","将星","羊刃","文昌","学堂","劫煞","灾煞","天喜"]);
    const other = shenLines.filter((line) => line.shenSha.some((s) => !categorized.has(s)));
    if (other.length) {
      signals.push({ title: "其他神煞", level: "neutral", body: other.map((line) => `${line.position}爻${line.sixRelation}${line.ganZhi.text}临${line.shenSha.filter((s) => !categorized.has(s)).join("、")}`).join("；") });
    }
  }
  const dayCombined = lines.filter((line) => branchCombinePairs[dayBranch] === line.ganZhi.zhi);
  if (dayCombined.length) {
    signals.push({ title: "日合", level: "good", body: `${dayCombined.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}与日辰${dayBranch}作合，事情有被当日牵住、撮合或绊住之象。` });
  }
  const monthCombined = lines.filter((line) => branchCombinePairs[monthBranch] === line.ganZhi.zhi);
  if (monthCombined.length) {
    signals.push({ title: "月合", level: "good", body: `${monthCombined.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}与月建${monthBranch}作合，当前阶段有外部条件牵合。` });
  }
  signals.push(...buildBranchRelationSignals(lines));
  if (hexRelation.isSixClash) signals.push({ title: "六冲卦", level: "watch", body: "本卦为六冲结构，主事态易散、易动、难久，需看用神是否得救。" });
  if (hexRelation.isSixCombine) signals.push({ title: "六合卦", level: "good", body: "本卦为六合结构，主牵连、缠合、成局，利久事但也防拖延。" });
  if (hexRelation.isFanYin) signals.push({ title: "反吟", level: "watch", body: "本变反吟，主事有折返、反复、来回拉扯之象。" });
  if (hexRelation.isFuYin) signals.push({ title: "伏吟", level: "watch", body: "本变伏吟，主事迟滞、重复、旧局未开。" });
  for (const line of lines.filter((line) => line.transformLabels.length)) {
    const changed = changedLines[line.position - 1];
    signals.push({ title: `${line.position}爻${line.transformLabels.join("/")}`, level: line.transformLabels.includes("回头克") ? "watch" : "neutral", body: `${line.sixRelation}${line.ganZhi.text}化${changed.sixRelation}${changed.ganZhi.text}，${line.transformLabels.join("、")}。` });
  }
  return signals;
}

function buildBranchRelationSignals(lines: YaoLine[]): RuleSignal[] {
  const signals: RuleSignal[] = [];
  const byBranch = new Map(lines.map((line) => [line.ganZhi.zhi, line]));
  const combines: string[] = [];
  const seenCombines = new Set<string>();
  for (const line of lines) {
    const target = branchCombinePairs[line.ganZhi.zhi];
    if (!target || !byBranch.has(target)) continue;
    const key = [line.ganZhi.zhi, target].sort().join("");
    if (seenCombines.has(key)) continue;
    seenCombines.add(key);
    combines.push(`${line.ganZhi.zhi}${target}`);
  }
  if (combines.length) {
    signals.push({ title: "六合爻", level: "good", body: `${combines.join("、")}成合，主牵连、相系、有人事黏合之象。` });
  }
  for (const group of threeHarmonyGroups) {
    const found = group.branches.filter((branch) => byBranch.has(branch));
    if (found.length === 3) {
      signals.push({ title: `${group.element}三合局`, level: "good", body: `${group.branches.join("、")}三合${group.element}局成，局气聚拢，相关五行力量增强。` });
    } else if (found.length === 2) {
      signals.push({ title: `${group.element}半合`, level: "neutral", body: `${found.join("、")}半合${group.element}局，已有聚气苗头，待另一支或时令引动。` });
    }
  }
  return signals;
}

function buildNotes(lines: YaoLine[], monthBranch: string, dayBranch: string, emptyBranches: string[]) {
  const notes: string[] = [];
  const moving = lines.filter((line) => line.moving);
  notes.push(moving.length ? `动爻：${moving.map((line) => `${line.position}爻`).join("、")}` : "静卦：本次未设置动爻。");
  notes.push(`月建 ${monthBranch}，日辰 ${dayBranch}；旬空 ${emptyBranches.join("、") || "无"}`);
  const empty = lines.filter((line) => emptyBranches.includes(line.ganZhi.zhi));
  if (empty.length) notes.push(`空亡爻：${empty.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}`);
  const shi = lines.find((line) => line.isShi);
  const ying = lines.find((line) => line.isYing);
  if (shi && ying) notes.push(`世爻为${shi.sixRelation}${shi.ganZhi.text}，应爻为${ying.sixRelation}${ying.ganZhi.text}。`);
  const monthBroken = lines.filter((line) => line.isMonthBroken);
  if (monthBroken.length) notes.push(`月破：${monthBroken.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}。`);
  const darkMoving = lines.filter((line) => line.isDarkMoving);
  if (darkMoving.length) notes.push(`暗动：${darkMoving.map((line) => `${line.position}爻${line.ganZhi.text}`).join("、")}。`);
  const hidden = lines.filter((line) => line.hiddenSpirit);
  if (hidden.length) notes.push(`伏神：${hidden.map((line) => `${line.hiddenSpirit?.sixRelation}${line.hiddenSpirit?.ganZhi.text}伏${line.position}爻`).join("、")}。`);
  return notes;
}
