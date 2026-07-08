import type { astro } from "iztro";

type AstrolabeData = ReturnType<typeof astro.bySolar>;
type PalaceData = AstrolabeData["palaces"][number];

// ─── 天干 → 四化星映射 ───
const MUTAGEN_MAP: Record<string, [string, string, string, string]> = {
  甲: ["廉贞", "破军", "武曲", "太阳"],
  乙: ["天机", "天梁", "紫微", "太阴"],
  丙: ["天同", "天机", "文昌", "廉贞"],
  丁: ["太阴", "天同", "天机", "巨门"],
  戊: ["贪狼", "太阴", "右弼", "天机"],
  己: ["武曲", "贪狼", "天梁", "文曲"],
  庚: ["太阳", "武曲", "太阴", "天同"],
  辛: ["巨门", "太阳", "文曲", "文昌"],
  壬: ["天梁", "紫微", "左辅", "武曲"],
  癸: ["破军", "巨门", "太阴", "贪狼"],
};

const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];

// ─── 五行局详解 ───
const fiveElementsNotes: Record<string, string> = {
  "金四局": "金四局命，禀刚锐之气。性刚毅果断，重义轻财，宜武职、金融、法律。刚则易折，需修柔韧。",
  "木三局": "木三局命，禀生发之机。仁慈温和，好学上进，宜文教、医疗、生态。忌优柔寡断，需立定主见。",
  "水二局": "水二局命，禀灵动之质。聪慧善谋，适应力强，宜艺术、策划、外交。忌泛滥无制，贵在沉淀。",
  "火六局": "火六局命，禀炎上之性。热情果敢，行动力强，宜创新、演艺、军警。忌急躁冒进，贵在持重。",
  "土五局": "土五局命，禀敦厚之德。稳重务实，诚信可靠，宜地产、仓储、管理。忌固执保守，贵在变通。",
};

// ─── 命主详解 ───
const soulNotes: Record<string, string> = {
  "紫微": "命主紫微，帝星临命，有统御之才，自尊心强。喜得左辅右弼，忌孤君无辅。",
  "天机": "命主天机，谋略之星，心思缜密善变通。脑力见长，宜策划分析，忌空想不落实。",
  "太阳": "命主太阳，光明磊落，博爱重情。外向开朗，宜公益教育，忌锋芒过露惹是非。",
  "武曲": "命主武曲，刚毅果决，重执行力。理财有方，宜金融实业，忌刚愎自用。",
  "天同": "命主天同，温和圆融，与世无争。福泽深厚，宜人文服务，忌懒散无进取。",
  "廉贞": "命主廉贞，亦正亦邪，有魄力担当。带桃花色彩，宜监察司法，忌偏执走极端。",
  "天府": "命主天府，稳重包容，库藏之象。守成有余，宜管理后勤，忌过于保守失良机。",
  "太阴": "命主太阴，细腻温柔，善解人意。善于理财储蓄，宜文职服务，忌阴柔过度。",
  "贪狼": "命主贪狼，多才多艺，交际手腕高。桃花旺盛，宜演艺外交，忌贪得无厌。",
  "巨门": "命主巨门，深思善辩，口才犀利。宜法律咨询，忌口舌是非，需修口德。",
  "天相": "命主天相，辅佐之才，公正温和。服务精神强，宜行政秘书，忌缺乏主见。",
  "天梁": "命主天梁，长者风范，喜助人为乐。有宗教信仰倾向，宜慈善医疗，忌孤高清傲。",
  "七杀": "命主七杀，勇猛果敢，开创力强。将星气度，宜军警创业，忌冲动冒进。",
  "破军": "命主破军，敢破敢立，变革创新不断。宜开创事业，忌反复无常失根基。",
};

// ─── 身主详解 ───
const bodyMasterNotes: Record<string, string> = {
  "天相": "身主天相，后天修养趋于辅佐协调，宜借力使力，重人际关系。",
  "天梁": "身主天梁，后天趋善，重德性修行，晚年多有福报。",
  "天同": "身主天同，后天趋于圆融安适，重视精神生活品质。",
  "天机": "身主天机，后天心思更活络，易转换跑道，需定心。",
  "文昌": "身主文昌，后天文采才华绽放，宜以文立业。",
  "文曲": "身主文曲，后天才艺精进，口才或技艺见长。",
  "火星": "身主火星，后天行动力爆发，需防急躁冲动。",
  "铃星": "身主铃星，后天暗中谋划力强，需防心思过重。",
  "天马": "身主天马，后天奔波劳碌，宜动中求财。",
};

// ─── 宫位描述 ───
const palaceDescriptions: Record<string, string> = {
  "命宫": "命宫为十二宫之首，论断个性、天赋、一生命运基调。",
  "兄弟宫": "兄弟宫主手足情缘、同辈关系、合作伙伴。",
  "夫妻宫": "夫妻宫主婚姻感情、配偶品性、姻缘深浅。",
  "子女宫": "子女宫主子息缘份、晚辈关系、桃花娱乐。",
  "财帛宫": "财帛宫主财运得失、赚钱能力、消费观。",
  "疾厄宫": "疾厄宫主健康体质、疾病隐患、灾厄意外。",
  "迁移宫": "迁移宫主外出运、社会形象、他乡之缘。",
  "交友宫": "交友宫主人际交往、朋友助力、下属员工。",
  "官禄宫": "官禄宫主事业发展、学业功名、职场成就。",
  "田宅宫": "田宅宫主房产运、家庭环境、祖业福荫。",
  "福德宫": "福德宫主精神世界、享福能力、晚年运势。",
  "父母宫": "父母宫主长辈缘、上司关系、家世背景。",
};

// ─── 星曜组合思象分析 ───
function analyzeStarCombinations(palaces: PalaceData[]): Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }> {
  const combos: Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }> = [];
  const mingPalace = palaces.find((p) => p.name === "命宫");
  if (!mingPalace) return combos;
  const majorNames = mingPalace.majorStars.map((s) => s.name);
  const minorNames = mingPalace.minorStars.map((s) => s.name);
  const allNames = [...majorNames, ...minorNames];

  // 紫微系格局
  if (majorNames.includes("紫微")) {
    const hasFuBi = minorNames.includes("左辅") || minorNames.includes("右弼");
    const hasFuXiang = majorNames.includes("天府") || majorNames.includes("天相");
    if (hasFuBi) {
      combos.push({ title: "紫微辅弼格", body: "紫微得左辅右弼辅佐，君臣相得，领导力倍增，格局大增。", level: "good" });
    } else if (hasFuXiang) {
      combos.push({ title: "府相朝垣格", body: "紫微得府相朝垣相助，权柄稳固，有辅佐之福。", level: "good" });
    } else {
      combos.push({ title: "紫微孤君格", body: "紫微临命而缺辅弼、府相，为孤君在野，贵气减半，宜寻得力助手。", level: "neutral" });
    }

    if (majorNames.includes("七杀")) {
      combos.push({ title: "紫杀格", body: "紫微七杀同守，权杀并济，威而有谋，宜开创型事业。", level: "good" });
    }
    if (majorNames.includes("贪狼")) {
      combos.push({ title: "紫贪格", body: "紫微贪狼同守，贵气兼桃花，多才多艺但需防沉溺享乐。", level: "neutral" });
    }
    if (majorNames.includes("破军")) {
      combos.push({ title: "紫破格", body: "紫微破军同守，变革创新力强，人生大起大落，宜顺势而为。", level: "neutral" });
    }
  }

  // 杀破狼格局
  const shaPoLang = majorNames.filter((n) => ["七杀", "破军", "贪狼"].includes(n));
  if (shaPoLang.length >= 1) {
    combos.push({
      title: "杀破狼格局",
      body: `命带${shaPoLang.join("、")}，主变动开创，人生活力旺盛，起伏较大。不宜守成，宜顺势而动，动中求胜。`,
      level: "neutral",
    });
  }

  // 机月同梁格局
  const jiYueTongLiang = ["天机", "太阴", "天同", "天梁"];
  const jmtlMatch = jiYueTongLiang.filter((s) => majorNames.includes(s));
  if (jmtlMatch.length >= 2) {
    combos.push({
      title: "机月同梁格",
      body: `${jmtlMatch.join("、")}会聚，利于公职、文教、策划类事业，宜稳定发展，不适合经商冒险。`,
      level: "good",
    });
  }

  // 日月并明
  if (majorNames.includes("太阳") && majorNames.includes("太阴")) {
    combos.push({ title: "日月并明格", body: "太阳太阴同守，阴阳协调，光明磊落。易有内心矛盾，需内外调和。", level: "good" });
  } else if (majorNames.includes("太阳") && (majorNames.includes("巨门") || majorNames.includes("天梁"))) {
    combos.push({ title: "阳梁昌禄格", body: "太阳天梁同守，有考运，宜考试竞争、公职进取。", level: "good" });
  }

  // 月朗天门
  if (majorNames.includes("太阴") && minorNames.includes("文昌")) {
    combos.push({ title: "月朗天门格", body: "太阴文昌同守，才华横溢，文采斐然，宜文艺创作。", level: "good" });
  }

  // 巨日同宫
  if (majorNames.includes("巨门") && majorNames.includes("太阳")) {
    combos.push({ title: "巨日同宫格", body: "巨门太阳同守，善于沟通表达，有名声之象，宜传媒公关。", level: "good" });
  }

  // 廉贞相关格局
  if (majorNames.includes("廉贞")) {
    if (majorNames.includes("天相")) {
      combos.push({ title: "廉贞天相格", body: "廉贞天相同守，刚柔并济，有服务精神又有魄力，宜公职。", level: "good" });
    }
    if (majorNames.includes("七杀") || majorNames.includes("破军")) {
      combos.push({ title: "廉贞杀破格", body: "廉贞遇杀破，刚猛过甚，人生多波折挑战，需以柔克刚。", level: "watch" });
    }
  }

  // 空宫检测
  if (majorNames.length === 0) {
    const oppInfo = getOppositePalaceInfo(palaces, mingPalace.earthlyBranch);
    combos.push({
      title: "命宫空虚格",
      body: `命宫无主星，需借对宫${oppInfo || "之力"}来补全。格局借力而为，后天修为极重要。`,
      level: "watch",
    });
  }

  // 三奇嘉会
  const jiStarts = allNames.filter((n) => {
    for (const palace of palaces) {
      const stars = [...palace.majorStars, ...palace.minorStars];
      if (stars.some((s) => s.name === n && s.mutagen === "科")) return true;
    }
    return false;
  });
  const goodMutagens = allNames.filter((n) => {
    for (const palace of palaces) {
      const stars = [...palace.majorStars, ...palace.minorStars];
      if (stars.some((s) => s.name === n && (s.mutagen === "禄" || s.mutagen === "权"))) return true;
    }
    return false;
  });
  if (goodMutagens.length >= 2 && jiStarts.length >= 1 && mingPalace.majorStars.length >= 1) {
    combos.push({ title: "三奇嘉会格", body: "命宫汇聚禄权科三奇，才华横溢，机遇多，为一等吉格。", level: "good" });
  }

  // 禄马交驰格
  if (majorNames.includes("天马") || minorNames.includes("天马")) {
    const hasLu = allNames.some((n) => {
      for (const p of palaces) {
        if ([...p.majorStars, ...p.minorStars].some((s) => s.name === n && s.mutagen === "禄")) return true;
      }
      return false;
    });
    if (hasLu) {
      combos.push({ title: "禄马交驰格", body: "天马遇化禄，财官双美，动中得财，奔波有成。", level: "good" });
    }
  }

  // 双禄交流格
  const luStars = allNames.filter((n) => {
    for (const p of palaces) {
      if ([...p.majorStars, ...p.minorStars].some((s) => s.name === n && s.mutagen === "禄")) return true;
    }
    return false;
  });
  if (luStars.length >= 2) {
    combos.push({ title: "双禄交流格", body: "命宫得双禄汇聚，财源广进，机遇倍增。", level: "good" });
  }

  // 明珠出海格
  if (majorNames.includes("太阳") && majorNames.includes("巨门")) {
    combos.push({ title: "巨日同宫格", body: "巨门太阳同守寅申，如明珠出海，光芒四射，宜公开事业。", level: "good" });
  }

  // 雄宿乾元格
  if (majorNames.includes("廉贞") && majorNames.includes("天府")) {
    combos.push({ title: "雄宿乾元格", body: "廉贞天府同守，廉贞之才遇天府之库，才华得以施展，名利可期。", level: "good" });
  }

  // 科权禄夹格
  const sanfangStars = [...majorNames];
  for (const p of palaces) {
    const st = [...p.majorStars, ...p.minorStars];
    if (st.some((s) => s.mutagen === "禄" || s.mutagen === "权" || s.mutagen === "科")) {
      sanfangStars.push(...st.map((s) => s.name));
    }
  }
  const hasLuQuanKe = ["禄", "权", "科"].every((m) => {
    for (const p of palaces) {
      if ([...p.majorStars, ...p.minorStars].some((s) => s.mutagen === m)) return true;
    }
    return false;
  });
  if (hasLuQuanKe && majorNames.length >= 1) {
    combos.push({ title: "禄权科会格", body: "禄权科三奇汇聚命宫三方，才华、机遇、执行力兼备。", level: "good" });
  }

  return combos;
}

function getOppositePalaceInfo(palaces: PalaceData[], branch: string): string {
  const oppBranch = getOppositeBranch(branch);
  const oppPalace = palaces.find((p) => p.earthlyBranch === oppBranch);
  if (!oppPalace || oppPalace.majorStars.length === 0) return "";
  return `${oppPalace.name}（${oppPalace.majorStars.map((s) => s.name).join("、")}）`;
}

function getOppositeBranch(branch: string): string {
  const order = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const idx = order.indexOf(branch);
  return idx === -1 ? "" : order[(idx + 6) % 12];
}

// ─── 生年四化分析 ───
function analyzeBirthMutagen(
  palaces: PalaceData[],
  heavenlyStem: string,
): { items: Array<{ label: string; star: string; palace: string; note: string }>; stem: string } {
  const stars = MUTAGEN_MAP[heavenlyStem];
  const items: Array<{ label: string; star: string; palace: string; note: string }> = [];

  if (!stars) return { items, stem: heavenlyStem };

  for (let i = 0; i < 4; i++) {
    const starName = stars[i];
    const label = MUTAGEN_LABELS[i];
    let palaceName = "—";
    let note = "";
    for (const palace of palaces) {
      const allStars = [...palace.majorStars, ...palace.minorStars];
      if (allStars.some((s) => s.name === starName)) {
        palaceName = palace.name;
        break;
      }
    }

    switch (label) {
      case "禄": note = "缘分、财源、人缘，此处得天时之利。"; break;
      case "权": note = "掌控、权势、执行力，此领域可施展才能。"; break;
      case "科": note = "名声、才华、贵人相助，以和为贵。"; break;
      case "忌": note = "执着、阻碍、业力所在，需修身化解。"; break;
    }

    items.push({ label, star: starName, palace: palaceName, note });
  }

  return { items, stem: heavenlyStem };
}

// ─── 关键宫位分析 ───
function analyzeKeyPalaces(palaces: PalaceData[]): Array<{
  name: string;
  desc: string;
  stars: string;
  analysis: string;
  level: "good" | "neutral" | "watch";
}> {
  const keyNames = ["命宫", "财帛宫", "官禄宫", "夫妻宫", "迁移宫", "福德宫", "子女宫", "疾厄宫"];
  const results: Array<{ name: string; desc: string; stars: string; analysis: string; level: "good" | "neutral" | "watch" }> = [];

  for (const name of keyNames) {
    const palace = palaces.find((p) => p.name === name);
    if (!palace) continue;

    const desc = palaceDescriptions[name] || "";
    const allStars = [...palace.majorStars, ...palace.minorStars];
    const starNames = allStars.map((s) => {
      const mutagen = s.mutagen ? `化${s.mutagen}` : "";
      return mutagen ? `${s.name}(${mutagen})` : s.name;
    }).join("、") || "空宫";

    const majorCount = palace.majorStars.length;
    const hasMutagen = allStars.some((s) => s.mutagen);
    const majorNames = palace.majorStars.map((s) => s.name);

    let analysis = "";
    let level: "good" | "neutral" | "watch" = "neutral";

    if (majorCount === 0) {
      analysis = "空宫无主星，力量借对宫及三方而来，后天努力为关键。";
      level = "watch";
    } else if (majorCount >= 3) {
      analysis = `星曜汇聚，此领域为人生重点，事务繁重，需专注经营。`;
      level = "neutral";
    } else if (hasMutagen) {
      analysis = "得四化加持，此领域机遇与挑战并存，宜顺势而为。";
      level = "good";
    } else {
      analysis = "星曜平和，此领域需稳扎稳打，不宜操之过急。";
      level = "neutral";
    }

    // Specific analysis for some key palaces
    if (name === "财帛宫") {
      const hasStars = majorNames.some((n) => ["武曲", "太阴", "天府", "禄存", "化禄"].some((w) => n.includes(w)));
      if (hasStars) { analysis += "财星坐守，理财有方，易得正财。"; level = "good"; }
    }
    if (name === "官禄宫") {
      const hasCareer = majorNames.some((n) => ["紫微", "天府", "天相", "太阳", "武曲", "廉贞"].includes(n));
      if (hasCareer) { analysis += "事业星曜得力，职场有发展空间。"; level = "good"; }
    }
    if (name === "夫妻宫") {
      const hasRomance = majorNames.some((n) => ["贪狼", "廉贞", "太阴", "天同", "文昌", "文曲"].includes(n));
      if (hasRomance) { analysis += "桃花星入夫妻，感情丰富，重精神契合。"; }
    }
    if (name === "迁移宫") {
      if (majorCount > 0 && majorNames.some((n) => ["天马", "太阳", "天机"].includes(n))) {
        analysis += "利于外出发展，他乡有机遇。";
      }
    }

    results.push({ name, desc, stars: starNames, analysis, level });
  }

  return results;
}

// ─── 大限分析 ───
function analyzeDecadals(palaces: PalaceData[]): Array<{
  palace: string;
  ageRange: string;
  stars: string;
  note: string;
}> {
  const results: Array<{ palace: string; ageRange: string; stars: string; note: string }> = [];

  const starAnalysis: Record<string, string> = {
    "紫微": "帝星坐守，权柄在握，宜主动出击，建立事业根基",
    "天机": "谋略运筹，脑力见长，宜学习规划、策略布局",
    "太阳": "光明磊落，外向发展，宜公益、教育、展现自我",
    "武曲": "刚毅果断，执行力强，宜金融实业、踏实进取",
    "天同": "福泽深厚，圆融处世，宜享受生活、稳中求和",
    "廉贞": "魄力担当，带桃花色，宜监察、创意、司法",
    "天府": "稳重包容，库藏丰盈，宜管理、房产、守成",
    "太阴": "细腻柔和，善于储蓄，宜文职、理财、服务",
    "贪狼": "多才多艺，交际灵活，宜演艺外交，忌贪得无厌",
    "巨门": "深思善辩，宜法律咨询、学术研究，需防口舌",
    "天相": "辅佐之才，公正温和，宜行政秘书、协调工作",
    "天梁": "长者风范，喜助人，宜慈善医疗、教育传道",
    "七杀": "将星气度，奋勇开拓，宜军警创业，忌冲动冒进",
    "破军": "敢破敢立，变革创新，宜开创事业，忌反复无常",
  };

  for (const palace of palaces) {
    const allStars = [...palace.majorStars, ...palace.minorStars];
    const starNames = allStars.map((s) => s.name).join("、") || "空";
    const [start, end] = palace.decadal.range;
    let note = "";

    const majorNames = palace.majorStars.map((s) => s.name);
    const minorNames = palace.minorStars.map((s) => s.name);
    const hasMutagen = allStars.some((s) => s.mutagen);
    const mutagenInfo = allStars.filter((s) => s.mutagen).map((s) => `${s.name}化${s.mutagen}`).join("、");

    if (majorNames.length === 0) {
      note = "此限借力对宫，后天修为决定吉凶。";
    } else {
      // Build note from specific star analysis
      const parts: string[] = [];
      for (const name of majorNames) {
        if (starAnalysis[name]) parts.push(starAnalysis[name]);
      }
      if (parts.length > 0) {
        note = parts.slice(0, 2).join("；");
      } else if (majorNames.some((n) => ["紫微", "天府", "天相"].includes(n))) {
        note = "此限得吉星加持，运势顺遂，宜把握良机。";
      } else if (majorNames.some((n) => ["七杀", "破军", "贪狼"].includes(n))) {
        note = "此限变动较大，宜顺势而动，不宜守旧。";
      } else {
        note = "此限平稳过渡，宜稳扎稳打。";
      }

      if (hasMutagen) {
        note += ` 四化加持：${mutagenInfo}。`;
      }
      if (minorNames.includes("左辅") || minorNames.includes("右弼")) {
        note += " 得辅弼相助，贵人运佳。";
      }
      if (minorNames.includes("文昌") || minorNames.includes("文曲")) {
        note += " 文星加持，学业考运佳。";
      }
      if (minorNames.includes("火星") || minorNames.includes("铃星")) {
        note += " 火铃激发，行动力爆发，需防急躁。";
      }
    }

    results.push({
      palace: `${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）`,
      ageRange: `${start}–${end}岁`,
      stars: starNames,
      note,
    });
  }

  // Sort by age
  results.sort((a, b) => {
    const aStart = parseInt(a.ageRange.split("–")[0]);
    const bStart = parseInt(b.ageRange.split("–")[0]);
    return aStart - bStart;
  });

  return results;
}

// ─── 命身双主分析 ───
function analyzeSoulBodyRelation(soul: string, body: string): string {
  if (!soul || !body) return "";
  if (soul === body) {
    return `命主与身主同为"${soul}"，先天后天一致，性情稳定，不易受外界影响而改变本质。贵在坚守初心，但需防固执不变通。`;
  }
  const soulNote = soulNotes[soul] || "";
  const bodyNote = bodyMasterNotes[body] || "";
  return `命主"${soul}"为先天禀赋，${soulNote ? soulNote.slice(soulNote.indexOf("，") + 2) : "为先天之性"}；身主"${body}"为后天修为，${bodyNote}。命身不同，主一生需调和内外，后天努力大于先天。`;
}

// ─── 盘面汇总分析 ───
function generateSummary(
  astroData: AstrolabeData,
  patterns: Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }>,
): string {
  const parts: string[] = [];
  const fiveEl = astroData.fiveElementsClass;
  const soul = astroData.soul;
  const body = astroData.body;

  parts.push(`命主${soul}，身主${body}，${fiveEl}。`);

  const mingPalace = astroData.palaces.find((p) => p.name === "命宫");
  if (mingPalace) {
    const majorNames = mingPalace.majorStars.map((s) => s.name);
    if (majorNames.length > 0) {
      parts.push(`命宫主星${majorNames.join("、")}，坐${mingPalace.heavenlyStem}${mingPalace.earthlyBranch}。`);
    } else {
      parts.push(`命宫无主星，借对宫之力。`);
    }
  }

  const goods = patterns.filter((p) => p.level === "good");
  const watches = patterns.filter((p) => p.level === "watch");

  if (goods.length > 0) {
    parts.push(`吉格有：${goods.map((p) => p.title).join("、")}，格局层次较高。`);
  }
  if (watches.length > 0) {
    parts.push(`需留意：${watches.map((p) => p.title).join("、")}，宜修身养性以化解。`);
  }

  if (goods.length === 0 && watches.length === 0) {
    parts.push("格局平和，无特殊格局，以稳为主。");
  }

  return parts.join("");
}

// ─── 宫位分析 ───
function analyzePalace(palace: PalaceData): string {
  const parts: string[] = [];
  const allStars = [...palace.majorStars, ...palace.minorStars];

  if (allStars.length === 0) {
    parts.push(`${palace.name}为空宫，无主星坐守，力量借对宫而来。`);
  } else {
    const majorNames = palace.majorStars.map((s) => {
      const m = s.mutagen ? `化${s.mutagen}` : "";
      return m ? `${s.name}(${m})` : s.name;
    }).join("、");
    if (majorNames) parts.push(`主星：${majorNames}`);
    const minorNames = palace.minorStars.map((s) => s.name).join("、");
    if (minorNames) parts.push(`辅星：${minorNames}`);
  }

  parts.push(`宫干：${palace.heavenlyStem}${palace.earthlyBranch}`);
  parts.push(`大限：${palace.decadal.range[0]}–${palace.decadal.range[1]}岁`);

  return parts.join("；");
}

// ─── 宫干四化飞星分析 ───
function analyzePalaceMutagen(palaces: PalaceData[]): Array<{
  label: string;
  star: string;
  fromPalace: string;
  toPalace: string;
  note: string;
}> {
  const results: Array<{ label: string; star: string; fromPalace: string; toPalace: string; note: string }> = [];

  for (const fromPalace of palaces) {
    const stem = fromPalace.heavenlyStem as string;
    const stars = MUTAGEN_MAP[stem];
    if (!stars) continue;

    for (let i = 0; i < 4; i++) {
      const starName = stars[i];
      const label = MUTAGEN_LABELS[i];

      // Find which palace this star lands in
      for (const toPalace of palaces) {
        const allStars = [...toPalace.majorStars, ...toPalace.minorStars];
        if (allStars.some((s) => s.name === starName)) {
          const noteMap: Record<string, string> = {
            "禄": "财禄增加，机会来临",
            "权": "权力提升，掌控力增强",
            "科": "名声提升，贵人相助",
            "忌": "阻碍压力，需谨慎应对",
          };
          results.push({
            label,
            star: starName,
            fromPalace: `${fromPalace.name}（${stem}干）`,
            toPalace: toPalace.name,
            note: noteMap[label] || "",
          });
        }
      }
    }
  }

  return results;
}

// ─── 主入口 ───
export function generateZiweiAnalysis(astroData: AstrolabeData): {
  fiveElementsClass: string;
  fiveElementsNote: string;
  soul: string;
  soulNote: string;
  body: string;
  bodyNote: string;
  soulBodyAnalysis: string;
  birthMutagen: { items: Array<{ label: string; star: string; palace: string; note: string }>; stem: string };
  patterns: Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }>;
  starCombinations: Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }>;
  keyPalaces: Array<{ name: string; desc: string; stars: string; analysis: string; level: "good" | "neutral" | "watch" }>;
  decadals: Array<{ palace: string; ageRange: string; stars: string; note: string }>;
  summary: string;
  palaceAnalyses: Record<string, string>;
  palaceMutagen: Array<{ label: string; star: string; fromPalace: string; toPalace: string; note: string }>;
} {
  const fiveElementsClass = astroData.fiveElementsClass;
  const soul = astroData.soul;
  const bodys = astroData.body;
  const fiveElementsNote = fiveElementsNotes[fiveElementsClass] || `${fiveElementsClass}，为命盘定数之基。`;
  const soulNote = soulNotes[soul] || `命主${soul}，为先天禀赋。`;
  const bodyNote = bodyMasterNotes[bodys] || `身主${bodys}，为后天修为。`;
  const soulBodyAnalysis = analyzeSoulBodyRelation(soul, bodys);

  // 生年天干: 从 chineseDate 获取
  const chineseDate = (astroData as any).chineseDate;
  const heavenlyStem = Array.isArray(chineseDate) ? (chineseDate[0] as string) : "";

  const birthMutagen = analyzeBirthMutagen(astroData.palaces, heavenlyStem);
  const patterns = analyzeLegacyPatterns(astroData, fiveElementsClass, soul, bodys, heavenlyStem);
  const starCombinations = analyzeStarCombinations(astroData.palaces);
  const keyPalaces = analyzeKeyPalaces(astroData.palaces);
  const decadals = analyzeDecadals(astroData.palaces);
  const summary = generateSummary(astroData, [...patterns, ...starCombinations]);

  const palaceAnalyses: Record<string, string> = {};
  for (const palace of astroData.palaces) {
    palaceAnalyses[palace.name] = analyzePalace(palace);
  }

  // 宫干四化飞星分析
  const palaceMutagen = analyzePalaceMutagen(astroData.palaces);

  return {
    palaceMutagen,
    fiveElementsClass,
    fiveElementsNote,
    soul,
    soulNote,
    body: bodys,
    bodyNote,
    soulBodyAnalysis,
    birthMutagen,
    patterns,
    starCombinations,
    keyPalaces,
    decadals,
    summary,
    palaceAnalyses,
  };
}

// ─── 传统格局分析（保留原逻辑） ───
function analyzeLegacyPatterns(
  astroData: AstrolabeData,
  fiveElements: string,
  soul: string,
  body: string,
  heavenlyStem: string,
): Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }> {
  const patterns: Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }> = [];
  const mingPalace = astroData.palaces.find((p) => p.name === "命宫");

  // 五行局
  patterns.push({ title: `五行局：${fiveElements}`, body: fiveElementsNotes[fiveElements] || "", level: "neutral" });

  // 命主
  patterns.push({ title: `命主：${soul}`, body: soulNotes[soul] || "", level: "neutral" });

  // 身主
  patterns.push({ title: `身主：${body}`, body: bodyMasterNotes[body] || "", level: "neutral" });

  return patterns;
}
