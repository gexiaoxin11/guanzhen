import type { astro } from "iztro";

type AstrolabeData = ReturnType<typeof astro.bySolar>;
type PalaceData = AstrolabeData["palaces"][number];


// ─── 星曜组合分析 ───
export interface StarComboReport {
  palace: string;
  palaceName: string;
  comboName: string;
  stars: string[];
  category: "吉格" | "凶格" | "杂格";
  interpretation: string;
  ancientText: string;
}

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

// ─── 四化星曜详解 ───
const STAR_MUTAGEN_NOTES: Record<string, Record<string, string>> = {
  廉贞: {
    禄: "廉贞化禄：桃花转正，人际缘增，才华得酬。宜以专业能力谋财，忌以色谋利。",
    权: "廉贞化权：魄力大增，执法如山，权威树立。利监察、司法、管理职位。",
    科: "廉贞化科：名声鹊起，人缘提升，桃花带贵气。宜以才艺博名。",
    忌: "廉贞化忌：感情困扰，官非口舌，执念过深。需放下执著，修身养性。",
  },
  破军: {
    禄: "破军化禄：变革之财，创新之利，破旧立新带来收益。宜创业、转型。",
    权: "破军化权：破旧立新之力大增，开创事业有魄力。但需防冒进。",
    科: "破军化科：变革创新获认可，名声随创新而来。利科技、设计领域。",
    忌: "破军化忌：变革受阻，反复无常，计划难落实。需稳扎稳打，忌三心二意。",
  },
  武曲: {
    禄: "武曲化禄：正财运旺，努力必有回报，劳动所得丰厚。宜踏实耕耘。",
    权: "武曲化权：执行力强劲，理财能力卓越，掌控财务大权。",
    科: "武曲化科：以专业能力获得名声，实干精神被认可。利技术、金融。",
    忌: "武曲化忌：财务压力，资金周转困难，硬碰硬易受伤。需柔性理财。",
  },
  太阳: {
    禄: "太阳化禄：光明之财，名声带来利益，以公心谋公利。利公益、教育。",
    权: "太阳化权：领导力凸显，光明正大得权，众望所归。宜担当重任。",
    科: "太阳化科：名声广播，以正直光明获得认可。利公开事业、演讲。",
    忌: "太阳化忌：光明受损，男性长辈缘薄，眼目需护。宜低调行事。",
  },
  天机: {
    禄: "天机化禄：智慧生财，策划谋略带来收益，脑子灵活机会多。",
    权: "天机化权：谋略得用，计划落实，思维缜密执行力强。",
    科: "天机化科：聪明才智被认可，以智谋博名声。利学术、咨询。",
    忌: "天机化忌：思虑过度，犹豫不决，计划多变难落实。需减少思虑。",
  },
  天梁: {
    禄: "天梁化禄：福报之财，祖荫护佑，以德获福。宜慈善、医疗。",
    权: "天梁化权：长者权威，以德服人，长辈提携得力。",
    科: "天梁化科：德高望重，善名远播，以德行赢得声誉。",
    忌: "天梁化忌：庇护不足，孤高清傲，长辈缘薄。需放下身段。",
  },
  紫微: {
    禄: "紫微化禄：帝星生财，大格局收益，贵人带来财源。",
    权: "紫微化权：至尊之权，统御之力达到顶峰，领导力无出其右。",
    科: "紫微化科：帝星扬名，尊贵之名远播，地位提升。",
    忌: "紫微化忌：孤君之困，高处不胜寒，人际关系需维护。",
  },
  太阴: {
    禄: "太阴化禄：阴柔之财，储蓄增值，不动产运佳。宜长期理财。",
    权: "太阴化权：以柔克刚，暗中掌权，女性助力大。",
    科: "太阴化科：温柔名声，以柔美获认可。利艺术、美容。",
    忌: "太阴化忌：情绪困扰，女性缘薄，财物暗损。需管理情绪。",
  },
  天同: {
    禄: "天同化禄：福气之财，轻松得利，以和为贵带来收益。",
    权: "天同化权：以柔韧获权力，看似温和实则有力。",
    科: "天同化科：和善之名，以亲和力获认可。利服务、人文。",
    忌: "天同化忌：懒散无进取，福气受损，需主动积极。",
  },
  巨门: {
    禄: "巨门化禄：口才生财，沟通带来利益。利法律、咨询、销售。",
    权: "巨门化权：善辩得权，以口才掌控局面，辩论无敌。",
    科: "巨门化科：辩才获认可，以智慧博得名声。利学术、法律。",
    忌: "巨门化忌：口舌是非，暗中有阻，沟通不畅。需修口德、谨言慎行。",
  },
  贪狼: {
    禄: "贪狼化禄：交际生财，桃花带财，多才多艺获利。宜社交型事业。",
    权: "贪狼化权：交际手腕高超，掌控局面能力强，桃花旺。",
    科: "贪狼化科：才艺获认可，以多才博名。利演艺、设计。",
    忌: "贪狼化忌：贪念过重，桃花劫难，沉溺享乐。需节制欲望。",
  },
  文昌: {
    禄: "文昌化禄：文采生财，考试运佳，以文立业获利。",
    权: "文昌化权：以文取权，学术权威，文笔掌控力强。",
    科: "文昌化科：科甲之喜，考试成功，文名广播。",
    忌: "文昌化忌：文书错误，考试不顺，文采受阻。需仔细核对。",
  },
  文曲: {
    禄: "文曲化禄：才艺生财，技艺带来利益，口才获利。",
    权: "文曲化权：技艺精湛，以专长掌控局面。",
    科: "文曲化科：才艺获认可，以技艺博名。",
    忌: "文曲化忌：技艺受阻，口舌之灾，文书问题。需精进技能。",
  },
  左辅: {
    禄: "左辅化禄：贵人助力带来财源，辅佐得利。",
    权: "左辅化权：辅佐得力，团队管理能力强。",
    科: "左辅化科：辅佐之功被认可，得赏识提拔。",
    忌: "左辅化忌：贵人失力，团队不和，辅佐无功。",
  },
  右弼: {
    禄: "右弼化禄：暗中助力带来利益，幕后贵人得力。",
    权: "右弼化权：幕后掌控，暗中策划得力。",
    科: "右弼化科：幕后之功被认可，德不孤必有邻。",
    忌: "右弼化忌：暗助消失，孤立无援，需主动争取。",
  },
};

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
function detectStarCombinationsLocal(palaces: PalaceData[]): Array<{ title: string; body: string; level: "good" | "neutral" | "watch" }> {
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
  const jmtlMatch = jiYueTongLiang.filter((s) => (majorNames as string[]).includes(s));
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

  // 日月反背格
  const sunInBack = majorNames.includes("太阳") && ["戌", "亥", "子"].includes(mingPalace.earthlyBranch);
  const moonInBack = majorNames.includes("太阴") && ["辰", "巳", "午"].includes(mingPalace.earthlyBranch);
  if (sunInBack) {
    combos.push({ title: "日月反背格", body: "太阳陷于戌亥子，虽有光明之心却难得志，宜在逆境中磨砺，终有出头之日。", level: "watch" });
  }
  if (moonInBack) {
    combos.push({ title: "月落亥海格", body: "太阴陷于辰巳午，阴柔失位，情感多波折，宜修心养性，以退为进。", level: "watch" });
  }

  // 马头带箭格
  if (mingPalace.earthlyBranch === "午" && majorNames.includes("天同") && minorNames.includes("擎羊")) {
    combos.push({ title: "马头带箭格", body: "午宫天同遇擎羊，福星带煞，先苦后甜，历经磨难方成大器。此格以煞为用，反为激励。", level: "neutral" });
  }

  // 火铃夹命格
  const mingIndex = palaces.findIndex(p => p.name === "命宫");
  const prevPalace = mingIndex > 0 ? palaces[mingIndex - 1] : palaces[palaces.length - 1];
  const nextPalace = mingIndex < palaces.length - 1 ? palaces[mingIndex + 1] : palaces[0];
  const prevStars = [...prevPalace.majorStars.map(s => s.name), ...prevPalace.minorStars.map(s => s.name)];
  const nextStars = [...nextPalace.majorStars.map(s => s.name), ...nextPalace.minorStars.map(s => s.name)];
  const fireJia = (prevStars.includes("火星") && nextStars.includes("铃星")) || (prevStars.includes("铃星") && nextStars.includes("火星"));
  if (fireJia) {
    combos.push({ title: "火铃夹命格", body: "火星铃星夹命，人生多突发变故，行动力极强但易冲动，宜以静制动、谋定后动。", level: "watch" });
  }

  // 刑囚夹印格
  const hasLianZhen = majorNames.includes("廉贞");
  const hasTianXiang = majorNames.includes("天相");
  const tianXingJia = prevStars.includes("天刑") || nextStars.includes("天刑");
  if (hasLianZhen && hasTianXiang && tianXingJia) {
    combos.push({ title: "刑囚夹印格", body: "廉贞天相被天刑夹，主刑讼官非之象，需谨言慎行，遵纪守法，以正克邪。", level: "watch" });
  }

  // 明珠出海格（完整版：日在卯+巨门在亥）
  if (mingPalace.earthlyBranch === "卯" && majorNames.includes("太阳") && majorNames.includes("天梁")) {
    combos.push({ title: "明珠出海格", body: "太阳天梁在卯，如旭日东升照沧海，光明正大，宜公职教育，晚年荣显。", level: "good" });
  }

  // 刑姚夹命
  const tianYaoJia = prevStars.includes("天姚") || nextStars.includes("天姚");
  if (tianXingJia && tianYaoJia) {
    combos.push({ title: "刑姚夹命格", body: "天刑天姚夹命，主桃花纠纷与法律问题交织，需洁身自好、远离是非。", level: "watch" });
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
  const stars = MUTAGEN_MAP[heavenlyStem] as [string, string, string, string] | undefined;
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

    // 优先使用星曜定制解析，否则使用通用注释
    const starNote = STAR_MUTAGEN_NOTES[starName]?.[label];
    if (starNote) {
      note = starNote;
    } else {
      switch (label) {
        case "禄": note = `${starName}化禄：缘分、财源、人缘，此处得天时之利。`; break;
        case "权": note = `${starName}化权：掌控、权势、执行力，此领域可施展才能。`; break;
        case "科": note = `${starName}化科：名声、才华、贵人相助，以和为贵。`; break;
        case "忌": note = `${starName}化忌：执着、阻碍、业力所在，需修身化解。`; break;
      }
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
  const starCombinations = detectStarCombinationsLocal(astroData.palaces);
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

// ─── 三方四正联动分析 ───

export interface SanFangSiZhengResult {
  palace: number;
  palaceName: string;
  本宫主星: string;
  对宫主星: string;
  三合宫星: string;
  四化影响: string;
  strength: number;
  verdict: string;
}

const TWELVE_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// ─── 三合局名称映射（以 index % 4 为键） ───
const TRIAD_NAMES: Record<number, string> = {
  0: "申子辰(水局)",
  1: "巳酉丑(金局)",
  2: "寅午戌(火局)",
  3: "亥卯未(木局)",
};

// ─── 吉星列表 ───
const AUSPICIOUS_STARS = new Set([
  "紫微", "天府", "天相", "天梁", "天同",
]);

// ─── 辅星（吉化辅助星）列表 ───
const SUPPORTING_STARS = new Set([
  "左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存", "天马",
]);

// ─── 煞星列表 ───
const CHALLENGING_STARS = new Set([
  "七杀", "破军", "贪狼", "巨门", "火星", "铃星", "擎羊", "陀罗", "地空", "地劫",
]);
// ─── 星曜亮度分析 ───

/** 亮度含义说明 */
const BRIGHTNESS_MEANING: Record<string, string> = {
  "庙": "星耀最亮，吉星极吉，凶星减凶，力量最大",
  "旺": "星耀次亮，力量充沛，发挥充分",
  "得": "星耀得地，力量正常发挥",
  "利": "星耀有利，部分力量可发挥",
  "平": "星耀平平，力量中庸",
  "不": "星耀不亮，力量受阻",
  "陷": "星耀最暗，吉星减吉，凶星更凶，力量甚微",
};

/** 亮度 → 数值映射 */
const BRIGHTNESS_SCORE: Record<string, number> = {
  "庙": 3,
  "旺": 2.5,
  "得": 2,
  "利": 1.5,
  "平": 1,
  "不": 0.5,
  "陷": 0,
};

export interface BrightnessReport {
  overallLevel: "强" | "中" | "弱";
  overallScore: number;
  palaceReports: Array<{
    palace: string;
    palaceName: string;
    totalScore: number;
    maxLevel: number;
    bestStars: string[];
    worstStars: string[];
    verdict: "极强" | "强" | "中" | "弱" | "极弱";
  }>;
  topStars: Array<{ star: string; palace: string; level: string; meaning: string }>;
  weakStars: Array<{ star: string; palace: string; level: string; meaning: string }>;
}


/**
 * 获取宫位所在三合局的名称
 * 申子辰(水局)、亥卯未(木局)、寅午戌(火局)、巳酉丑(金局)
 */
export function getPalaceTriadName(index: number): string {
  const group = index % 4;
  return TRIAD_NAMES[group] || "未知";
}

/**
 * 计算某个宫位自身宫干引发的四化（宫干四化落在本宫星曜上）
 */
function getPalaceMutagen(
  palace: PalaceData,
): Array<{ label: string; star: string }> {
  const stem = palace.heavenlyStem as string;
  const stars = MUTAGEN_MAP[stem];
  if (!stars) return [];

  const results: Array<{ label: string; star: string }> = [];
  const palaceStars = [
    ...palace.majorStars.map((s) => s.name),
    ...palace.minorStars.map((s) => s.name),
  ];

  for (let i = 0; i < 4; i++) {
    const targetStar = stars[i];
    if (palaceStars.includes(targetStar)) {
      results.push({ label: MUTAGEN_LABELS[i], star: targetStar });
    }
  }

  return results;
}

/**
 * 计算其他宫的宫干四化是否飞入当前宫
 */
function getMutagenFlyingIn(
  targetIndex: number,
  allPalaces: PalaceData[],
): Array<{ label: string; star: string; fromPalace: string }> {
  const results: Array<{ label: string; star: string; fromPalace: string }> = [];
  const targetStars = [
    ...allPalaces[targetIndex].majorStars.map((s) => s.name),
    ...allPalaces[targetIndex].minorStars.map((s) => s.name),
  ];

  for (const fromPalace of allPalaces) {
    const stem = fromPalace.heavenlyStem as string;
    const stars = MUTAGEN_MAP[stem];
    if (!stars) continue;

    for (let i = 0; i < 4; i++) {
      if (targetStars.includes(stars[i])) {
        results.push({
          label: MUTAGEN_LABELS[i],
          star: stars[i],
          fromPalace: fromPalace.name,
        });
      }
    }
  }

  return results;
}

/**
 * 三方四正联动分析
 * 对每个宫位，收集本宫、对宫、两个三合宫的星曜与四化信息，
 * 综合计算强弱评分（0-10）。
 */
export function analyzeSanFangSiZheng(chart: { palaces: PalaceData[] }): SanFangSiZhengResult[] {
  const palaces = chart.palaces;
  const results: SanFangSiZhengResult[] = [];

  for (let i = 0; i < 12; i++) {
    const self = i;
    const opposing = (i + 6) % 12;
    const triad1 = (i + 4) % 12;
    const triad2 = (i + 8) % 12;

    const relatedIndices = [self, opposing, triad1, triad2];

    // ── 收集所有星曜 ──
    const allMajorStars: string[] = [];
    const allMinorStars: string[] = [];

    for (const idx of relatedIndices) {
      for (const s of palaces[idx].majorStars) allMajorStars.push(s.name);
      for (const s of palaces[idx].minorStars) allMinorStars.push(s.name);
    }

    // 本宫主星
    const selfMajor = palaces[self].majorStars.map((s) => s.name).join("、") || "无";
    // 对宫主星
    const oppMajor = palaces[opposing].majorStars.map((s) => s.name).join("、") || "无";
    // 三合宫星
    const triad1Stars = palaces[triad1].majorStars.map((s) => s.name).join("、") || "无";
    const triad2Stars = palaces[triad2].majorStars.map((s) => s.name).join("、") || "无";
    const triadInfo = `${TWELVE_BRANCHES[triad1]}宫：${triad1Stars}；${TWELVE_BRANCHES[triad2]}宫：${triad2Stars}`;

    // ── 四化影响 ──
    const selfMutagens = getPalaceMutagen(palaces[self]);
    const flyInMutagens = getMutagenFlyingIn(self, palaces);
    const mutagenParts: string[] = [];

    if (selfMutagens.length > 0) {
      const desc = selfMutagens.map((m) => `${m.star}化${m.label}`).join("、");
      mutagenParts.push(`本宫宫干自化：${desc}`);
    }
    if (flyInMutagens.length > 0) {
      const desc = flyInMutagens
        .map((m) => `${m.fromPalace}干${m.star}化${m.label}飞入`)
        .join("；");
      mutagenParts.push(`他宫四化飞入：${desc}`);
    }
    const mutagenDesc = mutagenParts.length > 0 ? mutagenParts.join("；") : "无特殊四化影响";

    // ── 计算强度评分 (0-10) ──
    let strength = 5; // 基础分

    const allRelatedStars = [...allMajorStars, ...allMinorStars];

    for (const star of allRelatedStars) {
      if (AUSPICIOUS_STARS.has(star)) strength += 0.5;
      if (SUPPORTING_STARS.has(star)) strength += 0.3;
      if (CHALLENGING_STARS.has(star)) strength -= 0.4;
    }

    // 四化调整（本宫星曜的化禄/化权/化科/化忌）
    for (const m of selfMutagens) {
      if (m.label === "禄") strength += 1;
      else if (m.label === "权") strength += 0.8;
      else if (m.label === "科") strength += 0.5;
      else if (m.label === "忌") strength -= 1.2;
    }

    // 飞入的四化
    for (const m of flyInMutagens) {
      if (m.label === "禄") strength += 0.6;
      else if (m.label === "权") strength += 0.5;
      else if (m.label === "科") strength += 0.3;
      else if (m.label === "忌") strength -= 0.8;
    }

    // 限制在 0-10 范围
    strength = Math.max(0, Math.min(10, Math.round(strength * 10) / 10));

    // ── 判语 ──
    let verdict: string;
    if (strength >= 7) verdict = "强";
    else if (strength >= 4) verdict = "中";
    else verdict = "弱";

    results.push({
      palace: i,
      palaceName: palaces[self].name,
      本宫主星: selfMajor,
      对宫主星: oppMajor,
      三合宫星: triadInfo,
      四化影响: mutagenDesc,
      strength,
      verdict,
    });
  }

  return results;
}

// ══════════════════════════════════════
// 运限分析（大限/流年 Horoscope）
// ══════════════════════════════════════

export interface HoroscopeReport {
  decadal: {
    range: string; // e.g. "32-41岁"
    ganZhi: string; // heavenlyStem + earthlyBranch
    palace: string; // which palace
    palaceName: string;
    focusArea: string; // what this decade focuses on (based on palace)
  };
  yearly: {
    year: number;
    ganZhi: string;
    palace: string;
    palaceName: string;
    jiangQianStars: string[]; // 将前12神
    suiQianStars: string[]; // 岁前12神
    keyThemes: string[];
  };
  monthly?: MonthlyReport;
  summary: string;
}

// ─── 流月分析 ───
export interface MonthlyReport {
  month: string; // e.g. "2026年7月"
  lunarMonth: string; // e.g. "六月"
  ganZhi: string;
  palace: string; // which palace the month lord lands
  palaceName: string;
  focusArea: string; // from PALACE_FOCUS
  keyStars: string[]; // important stars active this month
  theme: string; // one-line summary
}

const PALACE_FOCUS: Record<string, string> = {
  "命宫": "自我发展、性格塑造、人生方向",
  "兄弟": "兄弟姐妹关系、合作伙伴、社交圈",
  "夫妻": "婚姻感情、配偶状况、合作关系",
  "子女": "子女缘分、创造力、娱乐投资",
  "财帛": "财运收入、物质资源、消费观念",
  "疾厄": "健康状况、疾病预防、心理状态",
  "迁移": "外出远行、环境变化、社会形象",
  "交友": "朋友下属、团队协作、人脉资源",
  "官禄": "事业发展、工作成就、社会地位",
  "田宅": "房产家庭、居住环境、祖业根基",
  "福德": "精神享受、福报运气、内心世界",
  "父母": "父母长辈、师长关系、文书学业",
};

const JIANG_QIAN_12 = [
  "将星", "攀鞍", "岁驿", "息神", "华盖", "劫煞",
  "灾煞", "天煞", "指背", "咸池", "月煞", "亡神",
];

const SUI_QIAN_12 = [
  "岁建", "晦气", "丧门", "贯索", "官符", "小耗",
  "大耗", "龙德", "白虎", "天德", "吊客", "病符",
];

const THEME_KEYWORDS: Record<string, string[]> = {
  "命宫": ["自我成长", "人生转折", "重塑定位"],
  "兄弟": ["合作机遇", "人际拓展", "团队建设"],
  "夫妻": ["感情深化", "合作关系", "婚姻经营"],
  "子女": ["创意涌现", "投资布局", "子女教育"],
  "财帛": ["财务规划", "收入突破", "理财策略"],
  "疾厄": ["健康管理", "身心调养", "压力疏导"],
  "迁移": ["出行变动", "环境转型", "外部机遇"],
  "交友": ["人脉经营", "团队管理", "贵人助力"],
  "官禄": ["事业突破", "职位晋升", "职业转型"],
  "田宅": ["房产变动", "家庭建设", "安居置业"],
  "福德": ["精神修养", "内心平衡", "福报积累"],
  "父母": ["长辈关系", "学业进修", "权威支持"],
};

const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function chineseZodiacYear(year: number): string {
  const ganIndex = (year - 4) % 10;
  const zhiIndex = (year - 4) % 12;
  return GAN[ganIndex] + ZHI[zhiIndex];
}

// ─── 星曜组合数据库 ───
interface ComboEntry {
  name: string;
  category: "吉格" | "凶格" | "杂格";
  requiredStars: string[];
  optionalStars?: string[];
  forbiddenStars?: string[];
  branches?: string[];
  interpretation: string;
  ancientText: string;
}

const STAR_COMBO_DATABASE: ComboEntry[] = [
  // ═══════════════ 吉格（Auspicious Formations）═══════════════
  {
    name: "紫府同宫",
    category: "吉格",
    requiredStars: ["紫微", "天府"],
    interpretation: "紫微为北斗帝星，天府为南斗主星，二星同度，君臣庆会，主富贵双全、品德高尚。一生少灾厄，多得贵人相助，福泽深厚。",
    ancientText: "紫微天府同宫，谓之君臣庆会，主富贵双全、一世无忧。《紫微斗数全书》云：'紫府同宫，终身福厚。'",
  },
  {
    name: "日月并明",
    category: "吉格",
    requiredStars: ["太阳", "太阴"],
    interpretation: "太阳太阴二曜同宫，阴阳调和，日月并明，主光明磊落、胸怀坦荡。一生行事正直无私，声名远播，受人敬仰。",
    ancientText: "日月同宫无煞破，谓之丹墀桂墀，主光明磊落。《全书》云：'日月并明，佐九重于尧殿。'",
  },
  {
    name: "明珠出海",
    category: "吉格",
    requiredStars: ["太阳", "太阴"],
    forbiddenStars: ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"],
    interpretation: "太阳在亥宫、太阴在卯宫即成此格，或太阳在巳、太阴在酉亦同。日精月华得水润泽，如明珠出海，主早年成名、文章盖世。",
    ancientText: "太阳亥宫，太阴卯宫，水澄桂萼，明珠出海，主文章显达。《全书》云：'明珠出海，早步蟾宫。'",
  },
  {
    name: "石中隐玉",
    category: "吉格",
    requiredStars: ["巨门"],
    branches: ["子", "午"],
    forbiddenStars: ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"],
    interpretation: "巨门暗曜在子、午二宫坐守，无煞冲破，如美玉藏于石中。主聪明内敛、才华深藏不露，一旦时机成熟则光芒四射，名扬天下。",
    ancientText: "巨门子午，无煞冲破，谓之石中隐玉格，主福厚。《全书》云：'巨门子午科权禄，石中隐玉福兴隆。'",
  },
  {
    name: "禄马交驰",
    category: "吉格",
    requiredStars: ["禄存", "天马"],
    interpretation: "禄存为财星，天马为动星，二星同度主财源广进、动中得财。一生多外出发展机遇，财随人走，奔波而有成。适合经商贸易、跨国事业。",
    ancientText: "禄存天马同宫，谓之禄马交驰，主财源丰足、动中发达。《全书》云：'禄马交驰，发财远郡。'",
  },
  {
    name: "科权禄拱",
    category: "吉格",
    requiredStars: [], // 需要检查化曜，由匹配函数特殊处理
    interpretation: "命宫或三方四正见化禄、化权、化科三吉曜汇聚，主名利双收、福禄寿全。事业有成且得众人拥戴，一生顺遂少有大灾。",
    ancientText: "化禄、化权、化科三吉化齐会，谓之科权禄拱，主富贵双全。《全书》云：'科权禄拱，名誉昭彰。'",
  },
  {
    name: "紫微朝斗",
    category: "吉格",
    requiredStars: ["紫微"],
    branches: ["午"],
    interpretation: "紫微在午宫坐命，午为离卦正位，火旺之地。紫微属土，火土相生，帝星得位极尊。主极贵之命，领袖气质，位高权重。",
    ancientText: "紫微在午宫，谓之紫微朝斗格，主贵不可言。午宫为离明之所，紫微居之如日中天。",
  },
  {
    name: "雄宿乾元",
    category: "吉格",
    requiredStars: ["贪狼"],
    branches: ["寅"],
    interpretation: "贪狼在寅宫独坐，寅为木旺生火，贪狼之木气得木生而醇厚，脱去桃花浮华之气。主英雄气质、胆识过人，具有开创大业之魄力。",
    ancientText: "贪狼在寅宫，谓之雄宿乾元格，主英豪之气。《全书》云：'贪居寅宫号雄宿，乾元得位志四方。'",
  },
  {
    name: "月朗天门",
    category: "吉格",
    requiredStars: ["太阴"],
    branches: ["亥"],
    interpretation: "太阴在亥宫为入庙之地，亥为天门，水之正位。月朗天门主清贵之格，品性高洁，学问渊深，多得女性贵人提携。",
    ancientText: "太阴在亥宫，谓之月朗天门格，主清贵。《全书》云：'月朗天门，进蟾宫而步玉堂。'",
  },
  {
    name: "日照雷门",
    category: "吉格",
    requiredStars: ["太阳"],
    branches: ["卯"],
    interpretation: "太阳在卯宫，卯为震卦雷门，日出扶桑，光芒万丈。主声名显赫、事业亨通。为人光明磊落，热心公益，早年即可成名立业。",
    ancientText: "太阳在卯宫，谓之日照雷门格，主声名显达。《全书》云：'日照雷门，声名显于四方。'",
  },
  {
    name: "武贪同行",
    category: "吉格",
    requiredStars: ["武曲", "贪狼"],
    branches: ["丑", "未"],
    interpretation: "武曲金、贪狼木，金木相克却在丑未二宫调和，因丑未为墓库可收纳金木之气。主武职显贵，刚柔并济，以刚克建功，以柔略谋事。",
    ancientText: "武曲贪狼在丑未同宫，谓之武贪同行格，主武职峥嵘。《全书》云：'武贪墓中居，三十方发福。'",
  },
  {
    name: "廉贞清白",
    category: "吉格",
    requiredStars: ["廉贞"],
    branches: ["寅", "申"],
    forbiddenStars: ["擎羊", "陀罗", "火星", "铃星"],
    interpretation: "廉贞在寅申二宫，火得木生而性转平和，无煞冲破则为清白之格。主清正廉明，品行高洁，尤利司法、监察、审计等清要之职。",
    ancientText: "廉贞寅申无煞，谓之廉贞清白格，主清正。《全书》云：'廉贞寅申宫，无煞号清白。'",
  },
  {
    name: "府相朝垣",
    category: "吉格",
    requiredStars: ["天府", "天相"],
    interpretation: "天府为财库、天相为印绶，二星同宫或三合拱照，如府库有印、财权双美。主富贵可期，理财得力，善守成业，一生衣食丰足。",
    ancientText: "天府天相在三方朝垣，谓之府相朝垣格，主富贵。《全书》云：'府相同会，食禄千钟。'",
  },

  // ═══════════════ 凶格（Inauspicious Formations）═══════════════
  {
    name: "巨火擎羊",
    category: "凶格",
    requiredStars: ["巨门", "擎羊"],
    optionalStars: ["火星", "铃星"],
    interpretation: "巨门化暗，擎羊带刑，再遇火星/铃星则成'巨火擎羊'大凶之格。主终身体弱多病，易遭横祸、刑伤，口舌官非不断。需注意交通安全与血光之灾。",
    ancientText: "巨门擎羊加火铃，谓之巨火擎羊格，主终身刑伤。《全书》云：'巨火擎羊，终身缢死。'",
  },
  {
    name: "廉贞七杀",
    category: "凶格",
    requiredStars: ["廉贞", "七杀"],
    interpretation: "廉贞为次桃花、七杀为将星，二煞同宫刚暴之极。主意外灾厄、血光之灾、道路凶险。性情刚烈易冲动招祸，宜修心养性、避免争强斗狠。",
    ancientText: "廉贞七杀同宫，谓之路上埋尸，主道途凶险。《全书》云：'廉贞七杀，路上埋尸。'",
  },
  {
    name: "铃昌陀武",
    category: "凶格",
    requiredStars: ["铃星", "文昌", "陀罗", "武曲"],
    interpretation: "铃星火性、陀罗金性、武曲金性、文昌金性，金多火旺相战。主意外灾厄、投河溺水、交通惨祸。行运逢之尤需警惕，宜多行善事消灾。",
    ancientText: "铃星文昌陀罗武曲会合，谓之铃昌陀武格，主限至投河。《全书》云：'铃昌陀武，限至投河。'",
  },
  {
    name: "刑囚夹印",
    category: "凶格",
    requiredStars: ["廉贞", "天相"],
    interpretation: "廉贞为囚宿，天相为印星，二星同度或被天刑夹制，主官非牢狱之灾。为人易因意气用事触犯法律，或受他人牵连卷入诉讼。宜守法自律。",
    ancientText: "廉贞天相被刑囚夹制，谓之刑囚夹印格，主官非。《全书》云：'刑囚夹印，刑杖惟司。'",
  },
  {
    name: "火铃夹命",
    category: "凶格",
    requiredStars: ["火星", "铃星"],
    interpretation: "火星、铃星分居命宫左右相邻二宫，形成夹制之势。主性格暴烈急躁，一生多灾多难。少年运程多舛，中年后若修身养性可渐入佳境。",
    ancientText: "火星铃星夹命宫，谓之火铃夹命格，主暴烈多灾。《全书》云：'火铃夹命，为祸不轻。'",
  },
  {
    name: "羊陀夹忌",
    category: "凶格",
    requiredStars: ["擎羊", "陀罗"],
    interpretation: "擎羊、陀罗二煞夹化忌所在的宫位，使忌星之力倍增。主困窘不前、进退维谷。事业受阻、财路不通，精神压力极大。需待运限转移方可缓解。",
    ancientText: "擎羊陀罗夹忌星，谓之羊陀夹忌格，主困窘不前。《全书》云：'羊陀夹忌，进退两难。'",
  },
  {
    name: "马头带箭",
    category: "凶格",
    requiredStars: ["天马", "擎羊"],
    interpretation: "天马为奔波之星，擎羊为刑伤之星，二星同度主奔波劳苦且多意外。一生辛劳而收获有限，动中易招灾伤。宜安守一方，不宜频繁迁徙。",
    ancientText: "天马擎羊同宫，谓之马头带箭格，主奔波劳苦。《全书》云：'马头带箭，道路多厄。'",
  },
  {
    name: "路上埋尸",
    category: "凶格",
    requiredStars: ["廉贞", "七杀"],
    optionalStars: ["擎羊", "陀罗", "火星", "铃星"],
    interpretation: "廉贞七杀在命迁线遇忌煞，凶性加剧最为可畏。主重大交通事故、坠落溺水等意外灾害。行运至此需格外谨慎出行，避免夜间远行及危险活动。",
    ancientText: "廉贞七杀会忌煞，谓之真正的路上埋尸，主重灾。《全书》云：'廉贞杀破忌煞会，道路横尸不可当。'",
  },

  // ═══════════════ 杂格（Neutral / Mixed Formations）═══════════════
  {
    name: "紫微辅弼",
    category: "杂格",
    requiredStars: ["紫微"],
    optionalStars: ["左辅", "右弼"],
    interpretation: "紫微帝星得左辅右弼拱卫，犹君王得贤臣辅佐。主领导得力、下属忠诚，善御人术，能得团队拥护。事业因众人之力而成功。",
    ancientText: "紫微遇左辅右弼，谓之辅弼拱主，主得人助力。《全书》云：'紫微辅弼，君臣庆会。'",
  },
  {
    name: "天机天梁",
    category: "杂格",
    requiredStars: ["天机", "天梁"],
    interpretation: "天机善谋、天梁善断，二星同度主善谋善断之才。思维缜密而能决断，宜从事策划、咨询、法律等需分析决断的职业。",
    ancientText: "天机天梁同宫，谓之善谋善断格，主智谋。《全书》云：'机梁会合，善谈兵机。'",
  },
  {
    name: "廉贞天府",
    category: "杂格",
    requiredStars: ["廉贞", "天府"],
    interpretation: "廉贞威权、天府守成，二星同度刚柔并济。主威权守成之才，既有开创的魄力又有守成的智慧，宜担任中高层管理职务。",
    ancientText: "廉贞天府同宫，谓之威权守成格。《全书》云：'廉贞天府，权禄兼得。'",
  },
  {
    name: "太阳天梁",
    category: "杂格",
    requiredStars: ["太阳", "天梁"],
    branches: ["卯"],
    interpretation: "太阳天梁在卯宫同度，日出扶桑照天梁，主学问渊博、德高望重。学术研究有成，教育领域尤佳，一生桃李满天下。",
    ancientText: "太阳天梁在卯，谓之阳梁昌禄格，主学问。《全书》云：'阳梁昌禄，传胪第一。'",
  },
  {
    name: "武曲天相",
    category: "杂格",
    requiredStars: ["武曲", "天相"],
    interpretation: "武曲为财帛主、天相为印绶星，二星同度主理财能手。精于财务管理、投资规划，为人正直守规矩，宜从事金融、会计、审计等行业。",
    ancientText: "武曲天相同宫，谓之理财能手格。《全书》云：'武曲天相，财印俱全。'",
  },
  {
    name: "七杀朝斗",
    category: "杂格",
    requiredStars: ["七杀"],
    branches: ["寅", "申"],
    interpretation: "七杀在寅或申宫坐命，对宫为紫微天府。七杀之刚得紫府之尊来调和，主权威在握，将星得主，一生事业有成，以威服人而不失正直之心。",
    ancientText: "七杀寅申，对宫紫府，谓之七杀朝斗格。《全书》云：'七杀朝斗，爵禄荣昌。'",
  },
  {
    name: "贪狼入庙",
    category: "杂格",
    requiredStars: ["贪狼"],
    branches: ["辰", "戌"],
    interpretation: "贪狼在辰戌二宫为入庙之地，桃花之气转为风雅之才。主风流才子，多才多艺，交际手腕高明。善社交应酬，宜文化、艺术、公关等领域。",
    ancientText: "贪狼辰戌入庙，谓之风流才子格。《全书》云：'贪狼辰戌，风流倜傥。'",
  },
  {
    name: "天同太阴",
    category: "杂格",
    requiredStars: ["天同", "太阴"],
    branches: ["子"],
    interpretation: "天同福星、太阴月华，二星在子宫水旺之地相会，福气与清贵交融。主安逸享福，性情温和，生活品质高。宜从事文化艺术、休闲服务等行业。",
    ancientText: "天同太阴在子，谓之福寿双全格，主安逸。《全书》云：'同阴在子，福寿绵长。'",
  },
  {
    name: "禄文拱命",
    category: "杂格",
    requiredStars: ["文昌"],
    optionalStars: ["禄存"],
    interpretation: "禄存、文昌分居命宫左右夹之，或禄存在命、文昌在三方。主才财兼备，既有学问才华又能转化为实际财富，学以致用、名利双收。",
    ancientText: "禄存文昌夹命或拱照，谓之禄文拱命格。《全书》云：'禄文拱命，才财兼备。'",
  },
];


/**
 * 运限分析 — 通过 astrolabe.horoscope() 获取大限/流年信息并生成报告
 */
export function analyzeZiweiHoroscope(
  astrolabe: any,
  birthDate: string,
  timeIndex: number,
): HoroscopeReport | null {
  try {
    if (typeof astrolabe?.horoscope !== "function") {
      return null;
    }

    const now = new Date();
    const hData = astrolabe.horoscope(now, timeIndex);
    if (!hData) return null;

    const palaces: PalaceData[] = astrolabe.palaces || [];

    // ── 大限 ──
    const decadal = hData.decadal;
    const decadalRange = decadal?.range
      ? `${decadal.range[0]}-${decadal.range[1]}岁`
      : "未知";
    const decadalGanZhi = decadal
      ? `${decadal.heavenlyStem ?? ""}${decadal.earthlyBranch ?? ""}`
      : "";
    const decadalPalaceIndex = decadal?.palaceIndex ?? decadal?.index;
    let decadalPalaceName = "";
    let decadalFocus = "";
    if (typeof decadalPalaceIndex === "number" && palaces[decadalPalaceIndex]) {
      decadalPalaceName = palaces[decadalPalaceIndex].name;
      decadalFocus = PALACE_FOCUS[decadalPalaceName] || "综合运势";
    }

    // ── 流年 ──
    const yearly = hData.yearly;
    const currentYear = now.getFullYear();
    const yearlyGanZhi = chineseZodiacYear(currentYear);
    const yearlyPalaceIndex = yearly?.palaceIndex ?? yearly?.index;
    let yearlyPalaceName = "";
    if (typeof yearlyPalaceIndex === "number" && palaces[yearlyPalaceIndex]) {
      yearlyPalaceName = palaces[yearlyPalaceIndex].name;
    }

    // 将前12神 & 岁前12神
    let jiangQianStars: string[] = [];
    let suiQianStars: string[] = [];
    if (yearly?.yearlyDecStar) {
      const jq = yearly.yearlyDecStar.jiangqian12;
      const sq = yearly.yearlyDecStar.suiqian12;
      if (Array.isArray(jq)) {
        jiangQianStars = jq.map((_: any, idx: number) => JIANG_QIAN_12[idx] ?? `将前${idx + 1}`);
      }
      if (Array.isArray(sq)) {
        suiQianStars = sq.map((_: any, idx: number) => SUI_QIAN_12[idx] ?? `岁前${idx + 1}`);
      }
    }

    // 流年主题
    const keyThemes = yearlyPalaceName
      ? (THEME_KEYWORDS[yearlyPalaceName] || ["运势主题"])
      : ["运势主题"];

    // ── 综合判语 ──
    const decadalDesc = decadalPalaceName
      ? `当前大限行至「${decadalPalaceName}」宫(${decadalGanZhi})，${decadalRange}，重点在${PALACE_FOCUS[decadalPalaceName] || "整体运势"}。`
      : "大限信息暂缺。";
    const yearlyDesc = yearlyPalaceName
      ? `流年${currentYear}年(${yearlyGanZhi})落在「${yearlyPalaceName}」宫，将前12神与岁前12神交织，是${keyThemes.join("、")}的关键年份。`
      : `流年${currentYear}年(${yearlyGanZhi})。`;
    const summary = `${decadalDesc}${yearlyDesc}把握大限趋势，顺应流年节奏，则可趋吉避凶。`;

    const result: HoroscopeReport = {
      decadal: {
        range: decadalRange,
        ganZhi: decadalGanZhi,
        palace: decadalPalaceName,
        palaceName: decadalPalaceName,
        focusArea: decadalFocus,
      },
      yearly: {
        year: currentYear,
        ganZhi: yearlyGanZhi,
        palace: yearlyPalaceName,
        palaceName: yearlyPalaceName,
        jiangQianStars,
        suiQianStars,
        keyThemes,
      },
      summary,
    };
    const monthly = analyzeZiweiMonthly(astrolabe, timeIndex);
    if (monthly) {
      return { decadal: result.decadal, yearly: result.yearly, monthly, summary };
    }
    return result;
  } catch {
    return null;
  }
}

// ─── 紫微斗数流月分析 ───
const LUNAR_MONTH_NAMES = [
  "正月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

/**
 * 紫微斗数流月分析
 *
 * @param monthOffset 月份偏移量，用于查询未来或过去的月份（0=当前月，默认）
 */
export function analyzeZiweiMonthly(
  astrolabe: any,
  timeIndex: number,
  monthOffset: number = 0,
): MonthlyReport | null {
  try {
    if (typeof astrolabe?.horoscope !== "function") {
      return null;
    }

    const now = new Date();
    if (monthOffset !== 0) {
      now.setMonth(now.getMonth() + monthOffset);
    }

    const hData = astrolabe.horoscope(now, timeIndex);
    if (!hData) return null;

    const monthly = hData.monthly;
    if (!monthly) return null;

    const palaces: PalaceData[] = astrolabe.palaces || [];

    const ganZhi = monthly
      ? `${monthly.heavenlyStem ?? ""}${monthly.earthlyBranch ?? ""}`
      : "";

    const monthlyPalaceIndex = monthly?.palaceIndex ?? monthly?.index;
    let monthlyPalaceName = "";
    let monthlyFocus = "";
    if (typeof monthlyPalaceIndex === "number" && palaces[monthlyPalaceIndex]) {
      monthlyPalaceName = palaces[monthlyPalaceIndex].name;
      monthlyFocus = PALACE_FOCUS[monthlyPalaceName] || "综合运势";
    }

    // 月份显示
    const year = now.getFullYear();
    const gregorianMonth = now.getMonth() + 1;
    const monthStr = `${year}年${gregorianMonth}月`;
    const lunarMonth = LUNAR_MONTH_NAMES[gregorianMonth - 1] || `${gregorianMonth}月`;

    // 流月重要星曜
    const keyStars: string[] = [];
    if (monthly?.monthlyDecStar) {
      const mds = monthly.monthlyDecStar;
      if (Array.isArray(mds?.flowMonth)) {
        keyStars.push(
          ...mds.flowMonth
            .filter((s: any) => s && typeof s === "string")
            .slice(0, 5),
        );
      }
    }

    // 流月主题
    const themeKeywords = monthlyPalaceName
      ? THEME_KEYWORDS[monthlyPalaceName] || ["运势主题"]
      : ["综合运势"];
    const theme = `${lunarMonth}流月行至「${monthlyPalaceName || "未知"}」宫，${themeKeywords[0]}是关键。`;

    return {
      month: monthStr,
      lunarMonth,
      ganZhi,
      palace: monthlyPalaceName,
      palaceName: monthlyPalaceName,
      focusArea: monthlyFocus,
      keyStars,
      theme,
    };
  } catch {
    return null;
  }
}

/**
 * 星曜亮度分析（Star Brightness Analysis）
 * 
 * 遍历12宫所有主星（majorStars），收集亮度级别（庙旺得利平不陷），
 * 计算各宫亮度总分（0-10制），输出整体报告。
 * 
 * 庙 = 3, 旺 = 2.5, 得 = 2, 利 = 1.5, 平 = 1, 不 = 0.5, 陷 = 0
 */
export function analyzeStarBrightness(chart: { palaces: PalaceData[] }): BrightnessReport {
  const palaces = chart.palaces;
  const palaceReports: BrightnessReport["palaceReports"] = [];
  const topStars: BrightnessReport["topStars"] = [];
  const weakStars: BrightnessReport["weakStars"] = [];

  let chartTotalScore = 0;
  let chartStarCount = 0;

  for (let i = 0; i < 12; i++) {
    const palace = palaces[i];
    const majorStars = palace.majorStars;

    let totalScore = 0;
    let starCount = 0;
    const bestStars: string[] = [];
    const worstStars: string[] = [];

    for (const star of majorStars) {
      const level = star.brightness as string;
      const score = BRIGHTNESS_SCORE[level] ?? 1;

      totalScore += score;
      starCount++;

      if (level === "庙") {
        bestStars.push(star.name);
        topStars.push({
          star: star.name,
          palace: palace.name,
          level: "庙",
          meaning: BRIGHTNESS_MEANING["庙"],
        });
      } else if (level === "旺") {
        bestStars.push(star.name);
      }

      if (level === "陷") {
        worstStars.push(star.name);
        weakStars.push({
          star: star.name,
          palace: palace.name,
          level: "陷",
          meaning: BRIGHTNESS_MEANING["陷"],
        });
      } else if (level === "不") {
        worstStars.push(star.name);
      }
    }

    const maxPossible = starCount * 3;
    const maxLevel = starCount > 0 ? Math.round((totalScore / maxPossible) * 100) / 10 : 0;

    let verdict: BrightnessReport["palaceReports"][number]["verdict"];
    if (maxLevel >= 8) verdict = "极强";
    else if (maxLevel >= 6.5) verdict = "强";
    else if (maxLevel >= 4) verdict = "中";
    else if (maxLevel >= 2) verdict = "弱";
    else verdict = "极弱";

    palaceReports.push({
      palace: TWELVE_BRANCHES[i] || String(i),
      palaceName: palace.name,
      totalScore: Math.round(totalScore * 10) / 10,
      maxLevel,
      bestStars,
      worstStars,
      verdict,
    });

    chartTotalScore += totalScore;
    chartStarCount += starCount;
  }

  const overallScore = chartStarCount > 0
    ? Math.round((chartTotalScore / (chartStarCount * 3)) * 100) / 10
    : 0;

  let overallLevel: "强" | "中" | "弱";
  if (overallScore >= 6) overallLevel = "强";
  else if (overallScore >= 3.5) overallLevel = "中";
  else overallLevel = "弱";

  return {
    overallLevel,
    overallScore,
    palaceReports,
    topStars,
    weakStars,
  };
}

// ─── 辅助函数 ───

/** 获取某个宫位的所有星曜名称列表 */
function getPalaceStarNames(palace: any): string[] {
  const names: string[] = [];
  if (Array.isArray(palace.majorStars)) {
    for (const s of palace.majorStars) {
      if (s?.name) names.push(s.name);
    }
  }
  if (Array.isArray(palace.minorStars)) {
    for (const s of palace.minorStars) {
      if (s?.name) names.push(s.name);
    }
  }
  return names;
}

/** 获取宫位的天干 */
function getPalaceHeavenlyStem(palace: any): string {
  return palace?.heavenlyStem ?? "";
}

/** 获取宫位的地支 */
function getPalaceEarthlyBranch(palace: any): string {
  return palace?.earthlyBranch ?? "";
}

/** 获取三方四正的星曜名称（本宫+对宫+两邻宫各偏一位） */
function getTriPartyStarNames(chart: any, palaceIndex: number): string[] {
  const palaces = chart?.palaces || [];
  if (palaces.length !== 12) return [];
  
  // 三方：本宫 + (i+4)%12 + (i+8)%12
  const indices = [palaceIndex, (palaceIndex + 4) % 12, (palaceIndex + 8) % 12];
  const names: string[] = [];
  for (const i of indices) {
    names.push(...getPalaceStarNames(palaces[i]));
  }
  return names;
}

/** 检查给定的星曜列表是否包含某组必须的星曜 */
function hasRequiredStars(
  availableStars: string[],
  combo: ComboEntry,
): boolean {
  for (const req of combo.requiredStars) {
    if (!availableStars.includes(req)) return false;
  }
  return true;
}

/** 检查是否有禁用的煞星 */
function hasForbiddenStars(
  availableStars: string[],
  combo: ComboEntry,
): boolean {
  if (!combo.forbiddenStars || combo.forbiddenStars.length === 0) return false;
  for (const fb of combo.forbiddenStars) {
    if (availableStars.includes(fb)) return true;
  }
  return false;
}

/** 检查可选星曜（至少有一个存在） */
function hasOptionalStar(
  availableStars: string[],
  combo: ComboEntry,
): boolean {
  if (!combo.optionalStars || combo.optionalStars.length === 0) return true;
  for (const opt of combo.optionalStars) {
    if (availableStars.includes(opt)) return true;
  }
  return false;
}

/** 检查化曜中是否有化禄/化权/化科三吉 */
function getMutagenTriple(
  palace: any,
  triPartyStars: string[],
): { hasLu: boolean; hasQuan: boolean; hasKe: boolean } {
  const hasLu = hasMutagenInStars(palace, "禄") || hasMutagenInStars(palace, "禄", true);
  const hasQuan = hasMutagenInStars(palace, "权") || hasMutagenInStars(palace, "权", true);
  const hasKe = hasMutagenInStars(palace, "科") || hasMutagenInStars(palace, "科", true);
  return { hasLu, hasQuan, hasKe };
}

function hasMutagenInStars(
  palace: any,
  mutagenType: string,
  checkTriParty?: boolean,
): boolean {
  function checkMajors(stars: any[]): boolean {
    for (const s of stars || []) {
      if (s?.mutagen === mutagenType) return true;
    }
    return false;
  }
  if (checkMajors(palace?.majorStars)) return true;
  return false;
}

/** 检查夹宫（相邻两宫是否包含指定星曜） */
function getAdjacentStarNames(chart: any, palaceIndex: number): string[] {
  const palaces = chart?.palaces || [];
  if (palaces.length !== 12) return [];
  const prev = (palaceIndex - 1 + 12) % 12;
  const next = (palaceIndex + 1) % 12;
  return [
    ...getPalaceStarNames(palaces[prev]),
    ...getPalaceStarNames(palaces[next]),
  ];
}

/**
 * 星曜组合分析 — 检测命盘中12宫是否有著名的星曜组合
 */
export function analyzeStarCombinations(chart: any): StarComboReport[] {
  const results: StarComboReport[] = [];
  if (!chart?.palaces || !Array.isArray(chart.palaces)) return results;

  const palaces = chart.palaces;

  for (let i = 0; i < palaces.length && i < 12; i++) {
    const palace = palaces[i];
    const palaceName = palace?.name || "未知";
    const branch = getPalaceEarthlyBranch(palace);
    const starNames = getPalaceStarNames(palace);
    const triPartyNames = getTriPartyStarNames(chart, i);
    const adjacentNames = getAdjacentStarNames(chart, i);

    for (const combo of STAR_COMBO_DATABASE) {
      // 检查地支条件
      if (combo.branches && combo.branches.length > 0) {
        if (!combo.branches.includes(branch)) continue;
      }

      // 检查禁用煞星
      if (hasForbiddenStars(starNames, combo)) continue;

      // 检查可选星曜
      if (!hasOptionalStar(starNames, combo)) continue;

      // 特殊处理：科权禄拱
      if (combo.name === "科权禄拱") {
        const { hasLu, hasQuan, hasKe } = getMutagenTriple(palace, triPartyNames);
        if (hasLu && hasQuan && hasKe) {
          results.push({
            palace: branch,
            palaceName,
            comboName: combo.name,
            stars: ["化禄", "化权", "化科"],
            category: combo.category,
            interpretation: combo.interpretation,
            ancientText: combo.ancientText,
          });
        }
        continue;
      }

      // 特殊处理：紫微辅弼 (紫微 + at least one of 左辅/右弼)
      if (combo.name === "紫微辅弼") {
        if (!starNames.includes("紫微")) continue;
        const hasFuBi = starNames.includes("左辅") || starNames.includes("右弼")
          || adjacentNames.includes("左辅") || adjacentNames.includes("右弼");
        if (!hasFuBi) continue;
        const matchedStars = starNames.filter(
          (s: string) => s === "紫微" || s === "左辅" || s === "右弼"
        );
        results.push({
          palace: branch,
          palaceName,
          comboName: combo.name,
          stars: matchedStars,
          category: combo.category,
          interpretation: combo.interpretation,
          ancientText: combo.ancientText,
        });
        continue;
      }

      // 特殊处理：火铃夹命 (只在命宫检查)
      if (combo.name === "火铃夹命") {
        if (palaceName !== "命宫" && palaceName !== "命") continue;
        const adj = getAdjacentStarNames(chart, i);
        if (adj.includes("火星") && adj.includes("铃星")) {
          results.push({
            palace: branch,
            palaceName,
            comboName: combo.name,
            stars: ["火星", "铃星"],
            category: combo.category,
            interpretation: combo.interpretation,
            ancientText: combo.ancientText,
          });
        }
        continue;
      }

      // 特殊处理：羊陀夹忌
      if (combo.name === "羊陀夹忌") {
        const adj = getAdjacentStarNames(chart, i);
        if (adj.includes("擎羊") && adj.includes("陀罗")) {
          // 检查本宫是否有化忌星曜
          let hasJi = false;
          for (const s of palace?.majorStars || []) {
            if (s?.mutagen === "忌") { hasJi = true; break; }
          }
          if (hasJi) {
            results.push({
              palace: branch,
              palaceName,
              comboName: combo.name,
              stars: ["擎羊", "陀罗", "化忌"],
              category: combo.category,
              interpretation: combo.interpretation,
              ancientText: combo.ancientText,
            });
          }
        }
        continue;
      }

      // 通用匹配：检查本宫是否满足 requiredStars
      if (hasRequiredStars(starNames, combo)) {
        const matchedStars = combo.requiredStars.filter(
          (s: string) => starNames.includes(s)
        );
        results.push({
          palace: branch,
          palaceName,
          comboName: combo.name,
          stars: matchedStars,
          category: combo.category,
          interpretation: combo.interpretation,
          ancientText: combo.ancientText,
        });
        continue;
      }

      // 对"府相朝垣"：用三方星曜匹配
      if (combo.name === "府相朝垣") {
        if (
          triPartyNames.includes("天府") &&
          triPartyNames.includes("天相")
        ) {
          results.push({
            palace: branch,
            palaceName,
            comboName: combo.name,
            stars: ["天府", "天相"],
            category: combo.category,
            interpretation: combo.interpretation,
            ancientText: combo.ancientText,
          });
        }
        continue;
      }

      // 对"禄文拱命"：用三方或夹宫匹配
      if (combo.name === "禄文拱命") {
        const hasWenchang = starNames.includes("文昌") || triPartyNames.includes("文昌");
        const hasLucun =
          starNames.includes("禄存") ||
          adjacentNames.includes("禄存") ||
          triPartyNames.includes("禄存");
        if (hasWenchang && hasLucun) {
          results.push({
            palace: branch,
            palaceName,
            comboName: combo.name,
            stars: ["文昌", "禄存"],
            category: combo.category,
            interpretation: combo.interpretation,
            ancientText: combo.ancientText,
          });
        }
        continue;
      }
    }
  }

  return results;
}

