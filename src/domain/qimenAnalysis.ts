import type { QimenOutput } from "taibu-core/qimen";

const DOOR_GOOD: Record<string, boolean> = {
  休门: true, 生门: true, 开门: true,
  伤门: false, 杜门: false, 景门: true, 死门: false, 惊门: false,
};
const DOOR_MEANING: Record<string, string> = {
  休门: "休养生息，宜休息、谈判、求和、婚嫁。主贵人相助。",
  生门: "生机勃勃，宜求财、经商、远行。大吉之门。",
  伤门: "损伤之象，宜捕猎、讨债。不利合作婚嫁。",
  杜门: "闭塞不通，宜躲藏、保密、修炼。不利公开事务。",
  景门: "光明之象，宜文书考试宣传。但防虚浮不实。",
  死门: "终结之象，宜送葬行刑。大凶之门，不利吉事。",
  惊门: "惊恐之象，宜诉讼捕盗。不利决策，防口舌。",
  开门: "开创新局，宜开业远行婚嫁求官。大吉之门。",
};
const STAR_MEANING: Record<string, string> = {
  天蓬: "大凶。主盗贼风险，旺则敢作敢为，衰则投机失败。",
  天任: "吉。主稳重担当，旺则事业稳固，衰则保守不前。",
  天冲: "次吉。主行动变革，旺则快速推进，衰则鲁莽坏事。",
  天辅: "大吉。主文教辅佐，旺则学业有成，衰则优柔寡断。",
  天禽: "大吉。主中正统御，旺则四方归心，衰则无人信服。",
  天心: "大吉。主策划领导，旺则运筹帷幄，衰则空想无果。",
  天柱: "凶。主破坏口舌，旺则可言善辩，衰则惹祸招灾。",
  天芮: "大凶。主疾病问题，旺则学有所成，衰则疾病缠身。",
  天英: "次凶。主光明急躁，旺则名声显赫，衰则焦躁误事。",
};
const SPIRIT_MEANING: Record<string, string> = {
  值符: "众神之首，百恶消散。诸事皆宜。",
  螣蛇: "虚诈之神，主惊恐怪异。宜守不宜攻。",
  太阴: "荫护之神，主密谋暗助。宜暗中行事。",
  六合: "和合之神，主婚姻交易。宜合作婚嫁。",
  白虎: "凶煞之神，主伤病官非。宜静不宜动。",
  玄武: "盗贼之神，主偷盗遗失。防小人。",
  九地: "稳固之神，主迟缓守成。宜长久之计。",
  九天: "威武之神，主动作扬名。宜进攻远行。",
};
const FORMATION_MEANING: Record<string, string> = {
  青龙返首: "大吉。万事顺利，贵人相助。", 飞鸟跌穴: "大吉。事情顺遂，安稳有靠。",
  三奇得使: "大吉。天时地利，百事可为。", 玉女守门: "吉。婚恋和美，女贵相助。",
  天遁: "吉。升迁远行求学顺利。", 地遁: "吉。求财营谋扎根有利。",
  人遁: "吉。人合合作团队顺利。", 神遁: "吉。谋划策略暗中得利。",
  天网四张: "大凶。困顿难脱，不宜妄动。", 太白入荧: "凶。外来侵犯，宜防守。",
  荧入太白: "凶。内部生变，宜整顿。", 朱雀投江: "凶。文书不利，口舌是非。",
  蛇夭矫: "凶。虚惊怪异，百事不利。", 青龙逃走: "凶。失去良机，贵人离去。",
  白虎猖狂: "凶。横祸突来，防备不及。",
};

export function analyzeQimen(result: QimenOutput) {
  const palaces = result.palaces;
  const zhiFu = result.zhiFu;
  const zhiShi = result.zhiShi;

  // 找值符值使宫
  const zhiFuPalace = palaces.find(p => p.palaceIndex === zhiFu.palace);
  const zhiShiPalace = palaces.find(p => p.palaceIndex === zhiShi.palace);

  // 八门九星分析
  const palaceAnalysis = palaces.map((p) => ({
    palace: p.palaceName,
    door: p.gate,
    doorGood: DOOR_GOOD[p.gate] ?? false,
    doorMeaning: DOOR_MEANING[p.gate] || "",
    star: p.star,
    starMeaning: STAR_MEANING[p.star] || "",
    deity: p.deity,
    deityMeaning: SPIRIT_MEANING[p.deity] || "",
    formations: p.formations.map(f => ({
      name: f, meaning: FORMATION_MEANING[f] || "需结合具体宫位分析。",
      isGood: (FORMATION_MEANING[f] || "").startsWith("大吉") || (FORMATION_MEANING[f] || "").startsWith("吉"),
      isBad: (FORMATION_MEANING[f] || "").startsWith("大凶") || (FORMATION_MEANING[f] || "").startsWith("凶"),
    })),
    isKongWang: p.isKongWang,
    isYiMa: p.isYiMa,
  }));

  const globalFormations = (result.globalFormations || []).map((f: string) => ({
    name: f, meaning: FORMATION_MEANING[f] || "需结合具体宫位分析。",
    isGood: (FORMATION_MEANING[f] || "").startsWith("大吉") || (FORMATION_MEANING[f] || "").startsWith("吉"),
    isBad: (FORMATION_MEANING[f] || "").startsWith("大凶") || (FORMATION_MEANING[f] || "").startsWith("凶"),
  }));

  const goodDoors = palaceAnalysis.filter(p => p.doorGood).map(p => p.palace);
  const badDoors = palaceAnalysis.filter(p => !p.doorGood).map(p => p.palace);
  const goodCount = globalFormations.filter(f => f.isGood).length;
  const badCount = globalFormations.filter(f => f.isBad).length;

  return {
    info: { dunType: result.dunType, juNumber: result.juNumber, yuan: result.yuan, siZhu: result.siZhu },
    zhiFu: { star: zhiFu.star, palace: zhiFuPalace?.palaceName || `宫${zhiFu.palace}`, meaning: STAR_MEANING[zhiFu.star] || "" },
    zhiShi: { gate: zhiShi.gate, palace: zhiShiPalace?.palaceName || `宫${zhiShi.palace}`, meaning: DOOR_MEANING[zhiShi.gate] || "" },
    palaceAnalysis,
    globalFormations,
    goodDoors,
    badDoors,
    goodFormationCount: goodCount,
    badFormationCount: badCount,
    overall: goodCount - badCount + goodDoors.length - badDoors.length >= 2 ? "吉" : goodCount - badCount >= 0 ? "中平" : "凶",
  };
}


// ===== 用神映射表 =====
export const YONG_SHEN_MAP: Record<string, { type: "gate" | "star" | "deity"; name: string; description: string }[]> = {
  事业: [
    { type: "gate", name: "开门", description: "开创新局，宜求官求职" },
    { type: "star", name: "天心", description: "策划领导，利事业运筹" },
    { type: "deity", name: "值符", description: "众神之首，得贵人提携" },
  ],
  财运: [
    { type: "gate", name: "生门", description: "生机勃勃，大吉求财" },
    { type: "star", name: "天任", description: "稳重担当，利长久经营" },
  ],
  感情: [
    { type: "deity", name: "六合", description: "和合之神，主婚姻恋爱" },
    { type: "gate", name: "休门", description: "休养生息，宜婚嫁和合" },
  ],
  健康: [
    { type: "star", name: "天芮", description: "主疾病，宜求医问药" },
    { type: "gate", name: "死门", description: "终结之象，重大疾病参考" },
  ],
  官非: [
    { type: "gate", name: "惊门", description: "惊恐之象，宜诉讼捕盗" },
    { type: "star", name: "天柱", description: "主口舌是非，官非诉讼" },
  ],
  学业: [
    { type: "star", name: "天辅", description: "文教辅佐，利学业考试" },
    { type: "gate", name: "景门", description: "光明之象，宜文书考试" },
  ],
  出行: [
    { type: "gate", name: "开门", description: "开创新局，宜远行" },
    { type: "deity", name: "九天", description: "威武之神，宜进攻远行" },
  ],
  合作: [
    { type: "deity", name: "六合", description: "和合之神，宜合作交易" },
    { type: "gate", name: "休门", description: "宜谈判求和" },
  ],
};

const TOPIC_KEYWORD_MAP: Record<string, string> = {
  事业: "事业", 工作: "事业", 求职: "事业", 升迁: "事业",
  财运: "财运", 钱财: "财运", 投资: "财运", 生意: "财运",
  感情: "感情", 婚姻: "感情", 恋爱: "感情",
  健康: "健康", 疾病: "健康", 身体: "健康",
  官非: "官非", 诉讼: "官非", 官司: "官非",
  学业: "学业", 考试: "学业", 学习: "学业",
  出行: "出行", 旅游: "出行", 远行: "出行",
  合作: "合作", 合伙: "合作", 交易: "合作",
};

// ===== 用神方位推荐 =====
export interface YongShenDirection {
  topic: string;
  yongShen: string;
  yongShenType: "gate" | "star" | "deity";
  palace: string;
  direction: string;
  isKongWang: boolean;
  isYiMa: boolean;
  recommendation: string;
}

export function recommendYongShenDirection(
  output: QimenOutput,
  questionTopic: string,
): YongShenDirection[] {
  const results: YongShenDirection[] = [];

  let matchedKey: string | undefined;
  for (const key of Object.keys(YONG_SHEN_MAP)) {
    if (questionTopic.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    for (const word of Object.keys(TOPIC_KEYWORD_MAP)) {
      if (questionTopic.includes(word)) {
        matchedKey = TOPIC_KEYWORD_MAP[word];
        break;
      }
    }
  }

  if (!matchedKey) return results;

  const yongShenList = YONG_SHEN_MAP[matchedKey];

  for (const yongShen of yongShenList) {
    for (const palace of output.palaces) {
      let found = false;
      if (yongShen.type === "gate" && palace.gate === yongShen.name) found = true;
      if (yongShen.type === "star" && palace.star === yongShen.name) found = true;
      if (yongShen.type === "deity" && palace.deity === yongShen.name) found = true;

      if (found) {
        const kw = palace.isKongWang ?? false;
        const ym = palace.isYiMa ?? false;
        let recommendation: string;
        if (kw && ym) {
          recommendation = `用神"${yongShen.name}"落${palace.palaceName}(${palace.direction})，临空亡又临驿马，动向不明，建议等待填空或驿马动后再行动。`;
        } else if (kw) {
          recommendation = `用神"${yongShen.name}"落${palace.palaceName}(${palace.direction})，但逢空亡，宜等待填实后再向此方行动。`;
        } else if (ym) {
          recommendation = `用神"${yongShen.name}"落${palace.palaceName}(${palace.direction})，临驿马主动，宜向此方迅速行动。`;
        } else {
          recommendation = `用神"${yongShen.name}"落${palace.palaceName}(${palace.direction})，宜向此方位行动以求${matchedKey}。`;
        }
        results.push({
          topic: matchedKey,
          yongShen: yongShen.name,
          yongShenType: yongShen.type,
          palace: palace.palaceName,
          direction: palace.direction,
          isKongWang: kw,
          isYiMa: ym,
          recommendation,
        });
      }
    }
  }

  return results;
}

// ===== 时干克应 =====
const STEM_WU_XING: Record<string, string> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

const WU_XING_KE: Record<string, string> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

const WU_XING_SHENG: Record<string, string> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

export interface ShiGanKeYing {
  stem: string;
  stemPalace: string;
  targetPalace: string;
  relation: string;
  meaning: string;
}

export interface StarStrengthReport {
  star: string;
  wuxing: string;
  currentStrength: "旺" | "相" | "休" | "囚" | "死";
  effect: string;
}

export interface DoorRelation {
  palace: string;
  door: string;
  doorWuxing: string;
  star: string;
  starWuxing: string;
  relation: "生" | "克" | "被生" | "被克" | "比和";
  meaning: string;
}
export function analyzeShiGanKeYing(output: QimenOutput): ShiGanKeYing[] {
  const results: ShiGanKeYing[] = [];

  const hourPillar = output.siZhu.hour;
  if (!hourPillar || hourPillar.length < 1) return results;
  const shiGan = hourPillar[0];

  const shiGanWuXing = STEM_WU_XING[shiGan];
  if (!shiGanWuXing) return results;

  // 找时干落宫：天盘或地盘天干为时干的宫位
  const stemPalaces = output.palaces.filter(
    (p) => p.heavenStem === shiGan || p.earthStem === shiGan,
  );
  const stemPalace =
    stemPalaces.find((p) => p.heavenStem === shiGan) ?? stemPalaces[0];

  if (!stemPalace) {
    // 时干无直接落宫，分析各宫天盘与时的生克
    for (const palace of output.palaces) {
      const hw = STEM_WU_XING[palace.heavenStem] || "";
      if (!hw) continue;

      let relation = "";
      let meaning = "";
      if (WU_XING_KE[shiGanWuXing] === hw) {
        relation = `时干${shiGan}(${shiGanWuXing})克${palace.palaceName}天盘${palace.heavenStem}(${hw})`;
        meaning = `时干克天盘，当前时辰对该宫事宜有压制，${palace.palaceName}方宜暂缓。`;
      } else if (WU_XING_KE[hw] === shiGanWuXing) {
        relation = `${palace.palaceName}天盘${palace.heavenStem}(${hw})克时干${shiGan}(${shiGanWuXing})`;
        meaning = "天盘克时干，该宫力量反克时辰，主此事有阻力需更多准备。";
      } else if (shiGanWuXing === hw) {
        relation = `时干${shiGan}(${shiGanWuXing})与${palace.palaceName}天盘${palace.heavenStem}(${hw})比和`;
        meaning = "时干与天盘比和，此时此宫之事得天时相助，宜顺势而为。";
      } else if (WU_XING_SHENG[shiGanWuXing] === hw) {
        relation = `时干${shiGan}(${shiGanWuXing})生${palace.palaceName}天盘${palace.heavenStem}(${hw})`;
        meaning = `时干生天盘，时辰有利该宫，${palace.palaceName}方事宜积极推进。`;
      } else if (WU_XING_SHENG[hw] === shiGanWuXing) {
        relation = `${palace.palaceName}天盘${palace.heavenStem}(${hw})生时干${shiGan}(${shiGanWuXing})`;
        meaning = "天盘生时干，该宫泄气于时辰，主此事消耗较大。";
      } else {
        continue;
      }
      results.push({
        stem: shiGan,
        stemPalace: "无直接落宫",
        targetPalace: palace.palaceName,
        relation,
        meaning,
      });
    }
    return results;
  }

  // 有时干落宫，分析该宫与其余各宫的关系
  for (const palace of output.palaces) {
    if (palace.palaceIndex === stemPalace.palaceIndex) continue;

    const shiHeaven = stemPalace.heavenStem;
    const targetHeaven = palace.heavenStem;
    const shiHw = STEM_WU_XING[shiHeaven] || "";
    const targetHw = STEM_WU_XING[targetHeaven] || "";
    if (!shiHw || !targetHw) continue;

    let relation = "";
    let meaning = "";

    if (WU_XING_KE[shiHw] === targetHw) {
      relation = `${stemPalace.palaceName}天盘${shiHeaven}(${shiHw})克${palace.palaceName}天盘${targetHeaven}(${targetHw})`;
      meaning = `时干落${stemPalace.palaceName}克${palace.palaceName}，时辰对该宫有压制，${palace.palaceName}方事宜暂缓。`;
    } else if (WU_XING_KE[targetHw] === shiHw) {
      relation = `${palace.palaceName}天盘${targetHeaven}(${targetHw})克${stemPalace.palaceName}天盘${shiHeaven}(${shiHw})`;
      meaning = `${palace.palaceName}克时干落宫，该宫力量反制时辰，有变数需留意。`;
    } else if (WU_XING_SHENG[shiHw] === targetHw) {
      relation = `${stemPalace.palaceName}天盘${shiHeaven}(${shiHw})生${palace.palaceName}天盘${targetHeaven}(${targetHw})`;
      meaning = `时干落宫生${palace.palaceName}，时辰有利该宫，${palace.palaceName}方事宜积极推进。`;
    } else if (WU_XING_SHENG[targetHw] === shiHw) {
      relation = `${palace.palaceName}天盘${targetHeaven}(${targetHw})生${stemPalace.palaceName}天盘${shiHeaven}(${shiHw})`;
      meaning = `${palace.palaceName}生时干落宫，该宫泄气于时辰，主此事消耗较大。`;
    } else if (shiHw === targetHw) {
      relation = `${stemPalace.palaceName}天盘${shiHeaven}(${shiHw})与${palace.palaceName}天盘${targetHeaven}(${targetHw})比和`;
      meaning = "时干落宫与目标宫比和，二宫协调，此事可顺势推进。";
    } else {
      relation = `${stemPalace.palaceName}天盘${shiHeaven}(${shiHw})与${palace.palaceName}天盘${targetHeaven}(${targetHw})无直接生克`;
      meaning = "时干落宫与目标宫无直接生克关系，宜综合其他因素判断。";
    }

    results.push({
      stem: shiGan,
      stemPalace: stemPalace.palaceName,
      targetPalace: palace.palaceName,
      relation,
      meaning,
    });
  }

  return results;
}

const STAR_WU_XING: Record<string, string> = {
  天蓬: "水", 天芮: "土", 天冲: "木", 天辅: "木", 天禽: "土",
  天心: "金", 天柱: "金", 天任: "土", 天英: "火",
};

const DOOR_WU_XING: Record<string, string> = {
  开门: "金", 休门: "水", 生门: "土", 伤门: "木",
  杜门: "木", 景门: "火", 死门: "土", 惊门: "金",
};

type SeasonStrength = "旺" | "相" | "休" | "囚" | "死";

function getSeasonWuxingMap(month: number): Record<string, SeasonStrength> {
  if (month >= 2 && month <= 4) {
    return { 木: "旺", 火: "相", 水: "休", 金: "囚", 土: "死" };
  } else if (month >= 5 && month <= 7) {
    return { 火: "旺", 土: "相", 木: "休", 水: "囚", 金: "死" };
  } else if (month >= 8 && month <= 10) {
    return { 金: "旺", 水: "相", 土: "休", 火: "囚", 木: "死" };
  } else {
    return { 水: "旺", 木: "相", 金: "休", 土: "囚", 火: "死" };
  }
}

const STRENGTH_EFFECTS: Record<SeasonStrength, string> = {
  旺: "当令而旺，星力最强，其属性特质充分发挥。",
  相: "得气而相，星力次强，受季节之助可顺势而为。",
  休: "退气而休，星力减弱，宜守不宜攻。",
  囚: "被泄而囚，星力受制，功能受限难以施展。",
  死: "被克而死，星力最低，其属性被压制。",
};

export function analyzeStarSeasonalStrength(
  result: QimenOutput,
  month: number,
): StarStrengthReport[] {
  const seasonMap = getSeasonWuxingMap(month);
  const seen = new Set<string>();
  const reports: StarStrengthReport[] = [];

  for (const p of result.palaces) {
    if (seen.has(p.star)) continue;
    seen.add(p.star);

    const wuxing = STAR_WU_XING[p.star];
    if (!wuxing) continue;

    const strength = seasonMap[wuxing] ?? "休";
    const effect = STRENGTH_EFFECTS[strength];

    reports.push({
      star: p.star,
      wuxing,
      currentStrength: strength,
      effect,
    });
  }

  return reports;
}

function getWuXingRelation(starWx: string, doorWx: string): {
  relation: DoorRelation["relation"];
  meaning: string;
} {
  if (starWx === doorWx) {
    return { relation: "比和", meaning: "星门五行相同，力量均衡，宜稳中求进。" };
  }
  if (WU_XING_SHENG[starWx] === doorWx) {
    return { relation: "生", meaning: "星生门，星力输出于门，主观能动性强，宜主动出击。" };
  }
  if (WU_XING_KE[starWx] === doorWx) {
    return { relation: "克", meaning: "星克门，星力制约门，有掌控力但需防用力过猛。" };
  }
  if (WU_XING_SHENG[doorWx] === starWx) {
    return { relation: "被生", meaning: "门生星，外部环境滋养星力，得时得助，顺遂。" };
  }
  if (WU_XING_KE[doorWx] === starWx) {
    return { relation: "被克", meaning: "门克星，外部环境压制星力，阻力较大需谨慎应对。" };
  }
  return { relation: "比和", meaning: "星门关系不明，综合判断。" };
}

export function analyzeDoorRelations(result: QimenOutput): DoorRelation[] {
  return result.palaces.map((p) => {
    const doorWx = DOOR_WU_XING[p.gate] || "";
    const starWx = STAR_WU_XING[p.star] || "";

    if (!doorWx || !starWx) {
      return {
        palace: p.palaceName,
        door: p.gate,
        doorWuxing: doorWx || "未知",
        star: p.star,
        starWuxing: starWx || "未知",
        relation: "比和" as DoorRelation["relation"],
        meaning: "五行信息不足，无法判定。",
      };
    }

    const { relation, meaning } = getWuXingRelation(starWx, doorWx);

    return {
      palace: p.palaceName,
      door: p.gate,
      doorWuxing: doorWx,
      star: p.star,
      starWuxing: starWx,
      relation,
      meaning,
    };
  });
}
