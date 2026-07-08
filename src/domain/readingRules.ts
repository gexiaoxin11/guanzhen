import { branchElements } from "./liuyaoData";
import type { FiveElement, LiuyaoChart, SixRelation, Topic, YaoLine } from "./types";

type ReadingOptions = {
  chart: LiuyaoChart;
  question: string;
  persona?: string;
  depth?: string;
};

const lineNames = ["初", "二", "三", "四", "五", "上"];
const elementCycle: FiveElement[] = ["木", "火", "土", "金", "水"];
const clashPairs: Record<string, string> = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
const combinePairs: Record<string, string> = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
export type UseGodRule = {
  relation: SixRelation;
  label: string;
  strong: string;
  weak: string;
  empty: string;
  moving: string;
};

export type TopicRule = {
  name: string;
  summary: string;
  useGodIntro: string;
  useGods: UseGodRule[];
  advice: string[];
};

export type ScenarioRule = {
  topic: Topic;
  label: string;
  patterns: RegExp[];
  focus: string;
  priority: string;
  advice: string[];
};

export const scenarioRules: ScenarioRule[] = [
  {
    topic: "career",
    label: "项目推进",
    patterns: [/项目|推进|落地|上线|方案|业务|合作/],
    focus: "项目类先看官鬼代表规则、阻力和责任边界，再看父母代表流程、合同、文档和平台承载。",
    priority: "官鬼若旺而克世，多是规则或负责人压力；父母弱则多卡在材料、流程、权限。",
    advice: ["把项目拆成责任人、流程、交付物三块排查，先补父母爻所象的材料和制度缺口。"],
  },
  {
    topic: "career",
    label: "求职面试",
    patterns: [/求职|面试|offer|入职|跳槽|录用|简历/],
    focus: "求职类以官鬼为岗位和录用规则，以父母为简历、证书、流程通知。",
    priority: "官鬼得力才有岗位承接，父母得力才有通知、文书和手续落地。",
    advice: ["先优化简历、作品和证明材料，再看面试官或流程节点反馈。"],
  },
  {
    topic: "career",
    label: "升职考核",
    patterns: [/升职|晋升|考核|评级|加薪|领导|上级/],
    focus: "升职类重点看官鬼名位、父母制度凭证，以及世爻能否承受官鬼压力。",
    priority: "官鬼旺相是名位信号，若官鬼过旺克世，则压力大于收益。",
    advice: ["把绩效证据和上级评价落到书面，别只靠口头认可。"],
  },
  {
    topic: "wealth",
    label: "回款到账",
    patterns: [/回款|到账|收款|尾款|欠款|催款|付款|结算/],
    focus: "回款类先盯妻财是否真实落袋，再看应爻或父母是否代表对方流程、凭证、合同卡点。",
    priority: "妻财空破多是钱未实到，父母弱则多是票据、合同、审批或结算材料未闭环。",
    advice: ["先确认付款节点、合同条款、发票和对账单，催款要抓凭证而不是只催口头承诺。"],
  },
  {
    topic: "wealth",
    label: "投资理财",
    patterns: [/投资|股票|基金|币|理财|涨|跌|买入|卖出|收益率/],
    focus: "投资类以妻财为标的收益，以子孙为财源和兑现，以兄弟为竞争、分流和亏损压力。",
    priority: "财旺不等于可追高，兄弟旺或财爻受克时，要防回撤和资金被分走。",
    advice: ["先定止损和仓位，不用卦象替代真实市场风险控制。"],
  },
  {
    topic: "wealth",
    label: "生意订单",
    patterns: [/生意|订单|客户|成交|销售|合同额|营收|利润/],
    focus: "生意类看子孙财源、客户转化与产品交付，再看妻财是否能转成利润。",
    priority: "子孙动而有力主开源，妻财弱则订单热闹但利润未必好。",
    advice: ["先看客户质量和回款周期，再决定是否扩大投入。"],
  },
  {
    topic: "love",
    label: "复合挽回",
    patterns: [/复合|前任|挽回|和好|回头|重新联系/],
    focus: "复合类重点看世应能否重新接上，合多主牵连，冲多主断续反复。",
    priority: "应爻弱或空，多是对方态度未实；世爻过旺克应，则自己推进太急反生压力。",
    advice: ["先恢复低压沟通，等应爻或合冲信号转实，再谈关系确认。"],
  },
  {
    topic: "love",
    label: "脱单桃花",
    patterns: [/脱单|桃花|对象|恋爱|喜欢|暧昧|表白/],
    focus: "脱单类看应爻和对象爻是否出现，再看子孙是否带来轻松互动。",
    priority: "对象爻空弱时，缘分还停在想象或浅互动；合住但不动则容易暧昧拖延。",
    advice: ["先增加真实接触频率，不要只靠线上试探。"],
  },
  {
    topic: "love",
    label: "婚姻承诺",
    patterns: [/结婚|婚姻|订婚|领证|伴侣|夫妻|长期/],
    focus: "婚姻类看世应稳定度、官鬼承诺压力和父母文书礼法。",
    priority: "父母有力利流程和家人认可，官鬼过旺则承诺伴随压力。",
    advice: ["把现实条件、家庭意见、时间表说清楚，少靠情绪推动。"],
  },
  {
    topic: "health",
    label: "检查恢复",
    patterns: [/检查|复查|恢复|治疗|手术|吃药|症状|医院/],
    focus: "健康类以官鬼看症状压力，以子孙看药力调养，父母可作检查报告和医嘱。",
    priority: "官鬼旺动需现实就医确认，子孙弱则恢复节奏偏慢。",
    advice: ["身体问题以医生诊断为准，卦只作为自我观察和提醒。"],
  },
  {
    topic: "lost",
    label: "寻找失物",
    patterns: [/在哪|哪里|找回|丢|遗失|失物|钥匙|手机|证件/],
    focus: "失物类先看财爻状态，再看父母所象的袋、盒、柜、票据、文档位置。",
    priority: "财爻空破多主暂不在眼前；父母动时，优先翻包袋、柜屉、文件夹。",
    advice: ["从最后一次确认位置往外扩散，优先查容器、夹层、票据相关处。"],
  },
  {
    topic: "study",
    label: "考试升学",
    patterns: [/考试|成绩|升学|录取|考研|考公|证书|通过/],
    focus: "考试类以父母为成绩证书和资料，以官鬼为考试压力、规则和名次。",
    priority: "父母旺利成绩凭证，官鬼旺说明压力真实，也能倒逼纪律。",
    advice: ["先补错题、资料和证明链，按考试规则倒排复习。"],
  },
  {
    topic: "lawsuit",
    label: "纠纷证据",
    patterns: [/起诉|官司|纠纷|仲裁|投诉|处罚|合同|证据|律师/],
    focus: "官非纠纷先看官鬼压力，再看父母证据、合同、书面材料能否护世。",
    priority: "官鬼旺不可轻敌，父母弱则证据链不足，口头解释难以托底。",
    advice: ["尽快整理书面证据和时间线，现实问题咨询专业律师。"],
  },
];

const topicRules: Record<Topic, TopicRule> = {
  general: {
    name: "综合",
    summary: "综合占先看世应主客、动爻变化和空破冲合，不急着单取一类用神。",
    useGodIntro: "此类问题没有单一固定用神，先以世应定主客，再看动爻把事情带向哪里。",
    useGods: [],
    advice: ["先把问题收窄到一件事，下一次占问会更容易定位用神。"],
  },
  career: {
    name: "事业",
    summary: "事业占以官鬼为职位、规则、压力与上级，以父母为平台、合同、资质与文书。",
    useGodIntro: "事业先看官鬼是否得力，再看父母能不能承载资源和制度。",
    useGods: [
      { relation: "官鬼", label: "职位/规则/上级压力", strong: "官鬼得力，说明岗位、规则或上级条件能形成推动。", weak: "官鬼偏弱，事业名位和规则支撑不足，容易有名无实。", empty: "官鬼落空，职位、审批或上级承诺暂时不实。", moving: "官鬼发动，工作压力、岗位变化或规则调整会先动。" },
      { relation: "父母", label: "平台/合同/资质文书", strong: "父母得力，平台、文书、资质、流程能帮上忙。", weak: "父母偏弱，手续、材料或平台资源不足。", empty: "父母落空，文书流程或平台承诺容易迟滞。", moving: "父母发动，合同、资料、流程会成为关键动作。" },
    ],
    advice: ["先补资质、材料、流程，再谈推进。", "若官鬼旺而克世，别硬扛规则，先顺制度借力。"],
  },
  wealth: {
    name: "财运",
    summary: "财运占以妻财为钱财收益，以子孙为财源、客户、产品和兑现能力。",
    useGodIntro: "财先看妻财是否真实有力，再看子孙能否生财、开源、兑现。",
    useGods: [
      { relation: "妻财", label: "钱财/收益/标的", strong: "妻财得力，钱财信号有根，收益或标的较实。", weak: "妻财偏弱，收益空间不足，不宜高估。", empty: "妻财落空，账面看得到，落袋还要等。", moving: "妻财发动，钱财会有变化，注意进出与价格波动。" },
      { relation: "子孙", label: "财源/客户/兑现能力", strong: "子孙得力，财源、客户或产品兑现能力较好。", weak: "子孙偏弱，开源能力不足，财来得费力。", empty: "子孙落空，渠道或客户暂时不实。", moving: "子孙发动，开源动作、客户变化或产品交付是关键。" },
    ],
    advice: ["先看现金流，不只看预期收益。", "财爻弱或空时，先保守预算，避免提前透支。"],
  },
  love: {
    name: "感情",
    summary: "感情占以世应看双方，以妻财/官鬼看对象与关系压力，再看合冲判断亲疏。",
    useGodIntro: "感情不只看对象爻，还要看世应是否相通、是否被冲散或被合住。",
    useGods: [
      { relation: "妻财", label: "现实吸引/伴侣信号", strong: "妻财得力，现实吸引、互动意愿或关系资源较实。", weak: "妻财偏弱，热度不足，现实条件不够撑。", empty: "妻财落空，对方或关系承诺容易虚悬。", moving: "妻财发动，关系中的现实条件、吸引或对方态度会有变化。" },
      { relation: "官鬼", label: "承诺/压力/关系约束", strong: "官鬼得力，关系有约束力，也代表压力真实存在。", weak: "官鬼偏弱，承诺感不足，关系不易定型。", empty: "官鬼落空，承诺或压力暂时落不到实处。", moving: "官鬼发动，关系压力、身份定位或承诺议题会被触发。" },
    ],
    advice: ["先看世应能不能通，不要只看单方热度。", "遇冲多时先降期待，遇合多时防拖而不决。"],
  },
  health: {
    name: "健康",
    summary: "健康占以官鬼为病症压力，以子孙为药力、调养和恢复能力。",
    useGodIntro: "健康类只做传统术数参考；现实身体问题必须以医生诊断为准。",
    useGods: [
      { relation: "官鬼", label: "病症/压力源", strong: "官鬼旺相，症状或压力信号较明显，不能轻忽。", weak: "官鬼偏弱，病象不算强，但仍需结合现实感受。", empty: "官鬼落空，症状可能时有时无，仍需现实检查确认。", moving: "官鬼发动，症状变化、压力触发点或检查结果会先动。" },
      { relation: "子孙", label: "调养/药力/恢复", strong: "子孙得力，恢复力、调养和缓解条件较好。", weak: "子孙偏弱，恢复慢，调养措施不够。", empty: "子孙落空，药力或调养方案暂时未落实。", moving: "子孙发动，治疗、调养、休息方式会出现变化。" },
    ],
    advice: ["有不适先就医，不用卦替代诊断。", "子孙弱时先补睡眠、饮食、检查和基础调养。"],
  },
  lost: {
    name: "失物",
    summary: "失物占以妻财为物，以父母为包装、票据、藏放位置线索。",
    useGodIntro: "失物先看财爻是否空破，再看父母和世应给出的方位、容器、文书线索。",
    useGods: [
      { relation: "妻财", label: "所失之物", strong: "妻财得力，物仍有找回信号。", weak: "妻财偏弱，物的状态不稳，找回要费力。", empty: "妻财落空，物暂时不在眼前，需等填实或换位置找。", moving: "妻财发动，物的位置或持有人可能已有变化。" },
      { relation: "父母", label: "票据/包装/藏处", strong: "父母得力，包装、文件、柜屉、袋盒等线索有用。", weak: "父母偏弱，凭票据或记忆线索不够清楚。", empty: "父母落空，记录、包装或位置记忆可能有误。", moving: "父母发动，翻文件、包袋、柜屉会触发线索。" },
    ],
    advice: ["先找财爻所象的物品属性，再查父母所象的袋、盒、柜、票据。", "财爻空破时，别只在原位置找，考虑移动或被人拿起。"],
  },
  study: {
    name: "学业",
    summary: "学业占以父母为成绩、证书、资料与老师，以官鬼为考试压力和规则。",
    useGodIntro: "学业先看父母是否得力，再看官鬼压力是否能转成约束和名次。",
    useGods: [
      { relation: "父母", label: "学业/成绩/证书资料", strong: "父母得力，学习资料、成绩、证书信号较实。", weak: "父母偏弱，基础资料或知识掌握不够稳。", empty: "父母落空，成绩、证书、资料暂时未落实。", moving: "父母发动，课程、资料、成绩或证书会有变化。" },
      { relation: "官鬼", label: "考试压力/规则名次", strong: "官鬼得力，压力真实，但也能形成纪律和名次约束。", weak: "官鬼偏弱，规则压力不足，容易松散。", empty: "官鬼落空，考试压力或结果暂不明朗。", moving: "官鬼发动，考试、排名、考核规则会成为焦点。" },
    ],
    advice: ["先补父母爻对应的资料、笔记、证明和基础题。", "官鬼旺时用规则倒逼节奏，别靠临时感觉。"],
  },
  lawsuit: {
    name: "官非",
    summary: "官非占以官鬼为压力、对抗、规则与处罚，以父母为证据、文书、合同。",
    useGodIntro: "官非先看官鬼压力大小，再看父母证据能否护世。",
    useGods: [
      { relation: "官鬼", label: "官非压力/规则对抗", strong: "官鬼得力，规则压力或对抗方力量不轻。", weak: "官鬼偏弱，压力可控，但不能轻敌。", empty: "官鬼落空，压力暂未落地，仍需防后续填实。", moving: "官鬼发动，程序、处罚、对抗方动作会先起。" },
      { relation: "父母", label: "证据/文书/合同", strong: "父母得力，证据、合同、文书能形成保护。", weak: "父母偏弱，材料证据不足，需要补齐。", empty: "父母落空，证据链或文书承诺暂不可靠。", moving: "父母发动，提交材料、调取证据、文书流程是关键。" },
    ],
    advice: ["现实官非务必咨询专业律师。", "先补证据链和书面材料，不要只靠口头解释。"],
  },
};

export function buildLocalReading({ chart, question, depth = "standard" }: ReadingOptions) {
  if (isWeatherQuestion(question)) return buildWeatherReading(chart);
  return buildGeneralReading(chart, question, depth);
}

function buildGeneralReading(chart: LiuyaoChart, question: string, depth: string) {
  const shi = chart.lines.find((line) => line.isShi);
  const ying = chart.lines.find((line) => line.isYing);
  const moving = chart.lines.filter((line) => line.moving);
  const topicRule = topicRules[chart.input.topic] ?? topicRules.general;
  const scenario = inferScenario(chart.input.topic, question);
  const useLines = pickUseLines(chart, topicRule);
  const summary = summarizeChart(chart, moving, topicRule, scenario);

  return [
    "一句话总结",
    summary,
    "核心分析",
    `1. 卦象总断：${hexTrendTitle(chart)}\n本卦为【${chart.original.name}】，变卦为【${chart.changed.name}】。${describeHexRelation(chart)}${moving.length ? `盘中有${moving.length}处动爻，事情不是一潭死水，关键变化点在${moving.map(linePosition).join("、")}。` : "本卦为静卦，重点不在突发变化，而在世应、用神与日月旺衰。"}${depth === "deep" ? " 深看时，要把空破冲合与动变回头生克一起合参。" : ""}`,
    `2. 世应分析：先定你与外部条件\n${shi ? `世爻为${describeLine(shi, chart)}。${shi.isMonthBroken || shi.isDayClash ? "世爻带破冲，说明当下主位不算稳，容易被外界节奏牵着走。" : shi.monthState === "旺" || shi.monthState === "相" ? "世爻得月令帮扶，主观能量和可操作空间还在。" : "世爻月令不强，宜先稳住基本盘。"} ` : "此盘未定位世爻，需要先补世应。"}${ying ? `应爻为${describeLine(ying, chart)}。应爻看对方、环境、外部条件，${compareShiYing(shi, ying)}。` : ""}`,
    `3. 用神分析：${topicRule.name}取象\n${describeUseGods(chart, topicRule, useLines)}${scenario ? `\n${describeScenario(scenario)}` : ""}`,
    `4. 动变与空破：看事情怎么变\n${describeMovement(chart, moving)}`,
    `5. 应期判断：什么时候更容易动\n${describeTiming(chart, topicRule, useLines, moving)}`,
    `6. 可执行建议\n${buildAdvice(chart, topicRule, useLines, moving, scenario)}`,
    "以上分析基于传统六爻规则与当前排盘数据，仅供研究、娱乐与自我观察参考，不构成医疗、法律、投资等现实决策建议。",
  ].join("\n\n");
}

function buildWeatherReading(chart: LiuyaoChart) {
  const parents = chart.lines.filter((line) => line.sixRelation === "父母");
  const children = chart.lines.filter((line) => line.sixRelation === "子孙");
  const officials = chart.lines.filter((line) => line.sixRelation === "官鬼");
  const brothers = chart.lines.filter((line) => line.sixRelation === "兄弟");
  const moving = chart.lines.filter((line) => line.moving);
  const rain = bestLine(parents, chart);
  const sun = bestLine(children, chart);
  const cloud = bestLine(officials, chart);
  const wind = bestLine(brothers, chart);

  return [
    "一句话总结",
    weatherSummary(chart, rain, sun, cloud, wind),
    "核心分析",
    `1. 卦象总断：先看天气大势\n本卦为【${chart.original.name}】，变卦为【${chart.changed.name}】。${describeHexRelation(chart)}${moving.length ? `卦中${moving.map(linePosition).join("、")}发动，说明天气有变化，不是从早到晚一个样。` : "本卦无明动，天气主线相对稳定，变化幅度不会太夸张。"}`,
    `2. 用神分析：雨、晴、云、风分开看\n父母爻看雨雪：${rain ? describeWeatherSignal(rain, chart, "雨雪") : "盘中父母爻不显，雨雪信号不足。"}\n子孙爻看晴明：${sun ? describeWeatherSignal(sun, chart, "晴明") : "盘中子孙爻不显，晴明信号不足。"}\n官鬼爻看阴霾雷电：${cloud ? describeWeatherSignal(cloud, chart, "阴云") : "盘中官鬼爻不显，阴霾雷电信号不重。"}\n兄弟爻看风：${wind ? describeWeatherSignal(wind, chart, "风势") : "盘中兄弟爻不显，大风信号不重。"}`,
    `3. 动变走向：变化发生在哪里\n${describeMovement(chart, moving)}`,
    `4. 应期判断：看天气转折点\n${describeTiming(chart, topicRules.general, [], moving)}`,
    `5. 行动建议\n${weatherAdvice(rain, sun, cloud, wind, chart)}`,
    "以上分析基于传统六爻取象，仅供参考与娱乐；真实天气仍以当地气象预报为准。",
  ].join("\n\n");
}

function isWeatherQuestion(question: string) {
  return /天气|下雨|雨|雪|晴|阴|多云|刮风|风|冷|热|气温|出太阳|太阳/.test(question);
}

function summarizeChart(chart: LiuyaoChart, moving: YaoLine[], topicRule: TopicRule, scenario?: ScenarioRule) {
  const base = chart.hexRelation.isSixClash
    ? "卦势偏“动散”，事情容易变化、反复或分开处理。"
    : chart.hexRelation.isSixCombine
      ? "卦势偏“牵合”，事情有黏性、有牵连，成与不成都不会太干脆。"
      : moving.length
        ? "卦中有明确变化点，成败多在动爻与变爻。"
        : "卦象偏静，先看世应和用神是否得日月扶助。";
  return `${base}${scenario ? `${topicRule.name}中的“${scenario.label}”要单独取象，不能只按大类泛断。` : topicRule.summary}`;
}

function hexTrendTitle(chart: LiuyaoChart) {
  if (chart.hexRelation.isSixClash) return "六冲主动散，先防反复";
  if (chart.hexRelation.isSixCombine) return "六合主牵合，利久也防拖";
  if (chart.hexRelation.isFanYin) return "反吟主折返，事情容易来回";
  if (chart.hexRelation.isFuYin) return "伏吟主迟滞，旧局未开";
  return "不走极端，重在世应用神";
}

function describeHexRelation(chart: LiuyaoChart) {
  const parts: string[] = [];
  if (chart.hexRelation.isSixClash) parts.push("六冲之象明显，主快、散、动、反复。");
  if (chart.hexRelation.isSixCombine) parts.push("六合之象明显，主牵连、聚合、拖延。");
  if (chart.hexRelation.isFanYin) parts.push("反吟见折返，事情容易先走出去又折回来。");
  if (chart.hexRelation.isFuYin) parts.push("伏吟见停滞，旧问题还没完全松动。");
  return parts.length ? parts.join("") : "卦象不走极端，主要看世应、用神与动爻。";
}

function pickUseLines(chart: LiuyaoChart, topicRule: TopicRule) {
  return topicRule.useGods
    .map((rule) => ({
      rule,
      lines: chart.lines.filter((line) => line.sixRelation === rule.relation),
    }))
    .filter((item) => item.lines.length);
}

function describeUseGods(chart: LiuyaoChart, topicRule: TopicRule, useLines: Array<{ rule: UseGodRule; lines: YaoLine[] }>) {
  if (!useLines.length) {
    const shi = chart.lines.find((line) => line.isShi);
    const ying = chart.lines.find((line) => line.isYing);
    return `${topicRule.useGodIntro}\n${shi ? `世爻：${describeLine(shi, chart)}。` : ""}${ying ? `应爻：${describeLine(ying, chart)}。` : ""}`;
  }
  return useLines
    .map((item) => {
      const primary = bestLine(item.lines, chart);
      return `${item.rule.label}取${item.rule.relation}爻：${primary ? describeLine(primary, chart) : "未见明显用神"}。${primary ? `${describeLineStrength(primary, chart)}${useGodJudgement(primary, chart, item.rule)}${describeUseGodToShi(primary, chart)}` : ""}`;
    })
    .join("\n");
}

export function inferScenario(topic: Topic, question: string) {
  const normalized = question.trim();
  if (!normalized) return undefined;
  return scenarioRules.find((rule) => rule.topic === topic && rule.patterns.some((pattern) => pattern.test(normalized)));
}

function describeScenario(scenario: ScenarioRule) {
  return `场景细分：${scenario.label}\n${scenario.focus}${scenario.priority}`;
}

function describeMovement(chart: LiuyaoChart, moving: YaoLine[]) {
  const signalText = describeRuleSignalSummary(chart);
  if (!moving.length) {
    const signals = chart.ruleSignals.filter((signal) => signal.level === "watch");
    return `本卦无动爻，属于“静中看势”。${signals.length ? `但仍要留意：${signals.map((signal) => signal.title).join("、")}。` : "盘面没有特别强烈的空破冲克，先以世应用神旺衰为主。"}${signalText}`;
  }
  const movingText = moving
    .map((line) => {
      const changed = chart.changedLines[line.position - 1];
      return `${linePosition(line)}${line.sixRelation}${line.ganZhi.text}${line.element}发动，化${changed.sixRelation}${changed.ganZhi.text}${changed.element}，${line.transformLabels.length ? line.transformLabels.join("、") : "发动"}。${transformJudgement(line, changed)}`;
    })
    .join("\n");
  return `${movingText}${signalText}`;
}

function describeRuleSignalSummary(chart: LiuyaoChart) {
  const titles = chart.ruleSignals
    .map((signal) => signal.title)
    .filter((title) => !title.includes("爻") && title !== "动爻入口");
  const hiddenText = describeHiddenSpirits(chart);
  const shenText = describeShenSha(chart);
  return `${titles.length ? `\n辅助信号：${Array.from(new Set(titles)).join("、")}。` : ""}${hiddenText}${shenText}`;
}

function describeShenSha(chart: LiuyaoChart) {
  const shenLines = chart.lines.filter((line) => line.shenSha.length > 0);
  if (!shenLines.length) return "";
  return `\n神煞临爻：${shenLines.map((line) => `${linePosition(line)}${line.sixRelation}${line.ganZhi.text}临${line.shenSha.join("、")}`).join("；")}。`;
}

function describeHiddenSpirits(chart: LiuyaoChart) {
  const hidden = chart.lines.filter((line) => line.hiddenSpirit);
  if (!hidden.length) return "";
  return `\n伏神飞神：${hidden.map((line) => {
    const spirit = line.hiddenSpirit;
    if (!spirit) return "";
    return `${spirit.sixRelation}${spirit.ganZhi.text}${spirit.element}伏于${linePosition(line)}${line.sixRelation}${line.ganZhi.text}${line.element}下，${spirit.flyRelation}`;
  }).filter(Boolean).join("；")}。`;
}

function buildAdvice(chart: LiuyaoChart, topicRule: TopicRule, useLines: Array<{ rule: UseGodRule; lines: YaoLine[] }>, moving: YaoLine[], scenario?: ScenarioRule) {
  const advice = [
    moving.length ? "先处理动爻对应的人事变化，不要只盯着本卦静态结论。" : "静卦宜稳，先补条件、等时机，不宜硬推。",
    ...topicRule.advice,
    ...(scenario?.advice ?? []),
  ];
  if (chart.ruleSignals.some((signal) => signal.title === "旬空")) advice.push("遇空亡，先看是否能冲空、填实、出空；眼下不宜按已经落实来判断。");
  if (chart.ruleSignals.some((signal) => signal.title === "月破")) advice.push("遇月破，当前阶段力量受损，适合修补基础，而不是强攻。");
  if (useLines.some((item) => item.lines.some((line) => line.monthState === "旺" || line.monthState === "相"))) advice.push("用神有旺相者，可以小步推进，用结果验证下一步。");
  return advice.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function describeTiming(chart: LiuyaoChart, topicRule: TopicRule, useLines: Array<{ rule: UseGodRule; lines: YaoLine[] }>, moving: YaoLine[]) {
  const candidates: string[] = [];
  const watchedLines = [
    ...useLines.map((item) => bestLine(item.lines, chart)).filter(Boolean),
    ...moving,
  ];
  const uniqueLines = Array.from(new Map(watchedLines.map((line) => [`${line.position}-${line.ganZhi.text}`, line])).values());

  for (const line of uniqueLines) {
    candidates.push(...timingForLine(line, chart, line.moving ? "动爻" : "用神"));
  }

  if (!candidates.length) {
    const shi = chart.lines.find((line) => line.isShi);
    const ying = chart.lines.find((line) => line.isYing);
    if (shi) candidates.push(...timingForLine(shi, chart, "世爻"));
    if (ying) candidates.push(...timingForLine(ying, chart, "应爻"));
  }

  const hidden = chart.lines.filter((line) => line.hiddenSpirit);
  for (const line of hidden) {
    const spirit = line.hiddenSpirit;
    if (!spirit) continue;
    const clash = clashPairs[spirit.ganZhi.zhi];
    const combine = combinePairs[spirit.ganZhi.zhi];
    candidates.push(`伏神${spirit.sixRelation}${spirit.ganZhi.text}不在明面，宜看${branchWindow(spirit.ganZhi.zhi)}值临、${clash ? branchWindow(clash) : "冲起之时"}冲起，或${combine ? branchWindow(combine) : "合起之时"}合动。`);
  }

  const deduped = Array.from(new Set(candidates)).slice(0, 5);
  const cadence = moving.length ? "盘中有动爻，应期可先看动爻、变爻所临地支。" : "静卦应期不宜说死，先取用神、世应、空破冲合给候选窗口。";
  return `${cadence}\n${deduped.length ? deduped.map((item, index) => `${index + 1}. ${item}`).join("\n") : `${topicRule.name}类问题暂以现实条件成熟时为准，卦上没有特别突出的应期入口。`}`;
}

function timingForLine(line: YaoLine, chart: LiuyaoChart, label: string) {
  const items: string[] = [];
  const branch = line.ganZhi.zhi;
  const clash = clashPairs[branch];
  const combine = combinePairs[branch];
  if (chart.emptyBranches.includes(branch)) {
    items.push(`${label}${line.sixRelation}${line.ganZhi.text}落空，先看${branchWindow(branch)}填实、${clash ? branchWindow(clash) : "冲空之时"}冲空。`);
  } else if (line.isMonthBroken) {
    items.push(`${label}${line.sixRelation}${line.ganZhi.text}月破，先等${branchWindow(branch)}值临，或${combine ? branchWindow(combine) : "合破之时"}来合补。`);
  } else if (line.isDayClash) {
    items.push(`${label}${line.sixRelation}${line.ganZhi.text}逢日冲，短期已有扰动，后续可看${branchWindow(branch)}再次值临定形。`);
  } else if (line.moving) {
    const changedBranch = chart.changedLines[line.position - 1]?.ganZhi.zhi ?? line.ganZhi.zhi;
    const changedCombine = combinePairs[changedBranch];
    items.push(`${label}${line.sixRelation}${line.ganZhi.text}发动，先看变爻${branchWindow(changedBranch)}，或其所合${changedCombine ? branchWindow(changedCombine) : "合日/合时"}。`);
  } else if (line.monthState === "旺" || line.monthState === "相") {
    items.push(`${label}${line.sixRelation}${line.ganZhi.text}旺相，遇${branchWindow(branch)}值临或生扶${supportWindows(line.element)}时更容易落实。`);
  }
  return items;
}

function branchWindow(branch: string) {
  return `${branch}日/${branch}时`;
}

function supportWindows(element: FiveElement) {
  const supporter = elementCycle[(elementCycle.indexOf(element) + elementCycle.length - 1) % elementCycle.length];
  const branches = Object.entries(branchElements)
    .filter(([, branchElement]) => branchElement === supporter)
    .map(([branch]) => branch);
  return branches.length ? `${branches.join("、")}日/时` : "生扶之日/时";
}

function weatherSummary(chart: LiuyaoChart, rain?: YaoLine, sun?: YaoLine, cloud?: YaoLine, wind?: YaoLine) {
  const rainWeak = !rain || isWeak(rain, chart);
  const sunActive = !!sun && (sun.moving || sun.monthState === "旺" || sun.monthState === "相");
  const cloudActive = !!cloud && (cloud.moving || cloud.monthState === "旺" || cloud.monthState === "相");
  const windWeak = !wind || isWeak(wind, chart);
  if (rainWeak && sunActive && cloudActive) return "大势偏“先阴后开”，雨水不重，阴云会有，但后段见晴的机会更大。";
  if (!rainWeak) return "雨雪信号不算空，天气有湿意或降水机会，但还要看动爻是否引发。";
  if (sunActive && windWeak) return "雨不重，风也不大，整体偏晴或转晴，只是中间可能有云气遮挡。";
  return "天气变化幅度不算极端，主要看阴晴切换，降水和大风都不是最强主线。";
}

function weatherAdvice(rain?: YaoLine, sun?: YaoLine, cloud?: YaoLine, wind?: YaoLine, chart?: LiuyaoChart) {
  const items: string[] = [];
  if (!rain || (chart && isWeak(rain, chart))) items.push("雨具可备轻便款，不必按大雨准备。");
  else items.push("有降水信号，出门带伞更稳。");
  if (sun && (sun.moving || sun.monthState === "旺" || sun.monthState === "相")) items.push("若要晾晒或户外活动，宜等云气散开后再安排。");
  if (cloud && (cloud.moving || cloud.monthState === "旺" || cloud.monthState === "相")) items.push("上午或前半段可能有阴沉、闷滞感，别被一时天色吓住。");
  if (!wind || (chart && isWeak(wind, chart))) items.push("风势不强，通风散闷主要靠时段，不靠大风吹开。");
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function describeWeatherSignal(line: YaoLine, chart: LiuyaoChart, label: string) {
  return `${describeLine(line, chart)}，${label}信号${isWeak(line, chart) ? "偏弱" : line.moving ? "被发动" : "有根"}。${describeLineStrength(line, chart)}${lineJudgement(line, chart)}`;
}

function bestLine(lines: YaoLine[], chart: LiuyaoChart) {
  return [...lines].sort((a, b) => lineScore(b, chart) - lineScore(a, chart))[0];
}

function lineScore(line: YaoLine, chart: LiuyaoChart) {
  let score = 0;
  if (line.monthState === "旺") score += 4;
  if (line.monthState === "相") score += 3;
  if (line.monthState === "休") score += 1;
  if (line.moving) score += 3;
  if (line.isShi || line.isYing) score += 1;
  if (line.isMonthBroken) score -= 3;
  if (line.isDayClash) score -= 2;
  if (chart.emptyBranches.includes(line.ganZhi.zhi)) score -= 3;
  return score;
}

function lineStrengthDetails(line: YaoLine, chart: LiuyaoChart) {
  const details: string[] = [];
  let raw = 0;
  if (line.monthState === "旺") {
    raw += 4;
    details.push("月令旺");
  }
  if (line.monthState === "相") {
    raw += 3;
    details.push("月令相");
  }
  if (line.monthState === "休") {
    raw += 1;
    details.push("月令休");
  }
  if (line.moving) {
    raw += 3;
    details.push("发动");
  }
  if (line.isShi || line.isYing) {
    raw += 1;
    details.push(line.isShi ? "临世" : "临应");
  }
  if (line.isMonthBroken) {
    raw -= 3;
    details.push("月破");
  }
  if (line.isDayClash) {
    raw -= 2;
    details.push("日冲");
  }
  if (chart.emptyBranches.includes(line.ganZhi.zhi)) {
    raw -= 3;
    details.push("旬空");
  }
  const score = Math.max(0, Math.min(10, 5 + raw));
  return { score, details };
}

export function describeLineStrength(line: YaoLine, chart: LiuyaoChart) {
  const { score, details } = lineStrengthDetails(line, chart);
  const level = score >= 8 ? "偏强" : score >= 5 ? "中平" : "偏弱";
  return `用神强弱约${score}/10，${level}${details.length ? `（${details.join("、")}）` : ""}。`;
}

function isWeak(line: YaoLine, chart: LiuyaoChart) {
  return lineScore(line, chart) <= 0 || line.monthState === "囚" || line.monthState === "死";
}

function describeLine(line: YaoLine, chart: LiuyaoChart) {
  const flags = [
    line.isShi ? "世" : "",
    line.isYing ? "应" : "",
    line.moving ? "动" : "",
    line.isMonthBroken ? "月破" : "",
    line.isDayClash ? "日冲" : "",
    chart.emptyBranches.includes(line.ganZhi.zhi) ? "旬空" : "",
  ].filter(Boolean);
  return `${linePosition(line)}${line.sixSpirit}${line.sixRelation}${line.ganZhi.text}${line.element}，月令${line.monthState}，十二长生${line.twelveStage}${flags.length ? `，带${flags.join("、")}` : ""}`;
}

function lineJudgement(line: YaoLine, chart: LiuyaoChart) {
  if (chart.emptyBranches.includes(line.ganZhi.zhi)) return "它落空亡，像有名无实，需待填实或冲空才更有力。";
  if (line.isMonthBroken) return "它逢月破，当前阶段力量受损，事情容易卡在基础条件上。";
  if (line.isDayClash) return "它受日冲，短期有扰动，容易突然变动或不稳定。";
  if (line.monthState === "旺" || line.monthState === "相") return "它得月令，力量不弱，是盘中可依靠的信号。";
  if (line.monthState === "囚" || line.monthState === "死") return "它在月令上偏弱，眼下不宜高估。";
  return "它力量中平，要结合动爻和世应再定。";
}

function useGodJudgement(line: YaoLine, chart: LiuyaoChart, rule: UseGodRule) {
  if (chart.emptyBranches.includes(line.ganZhi.zhi)) return rule.empty;
  if (line.moving) return rule.moving;
  if (line.isMonthBroken || line.isDayClash || isWeak(line, chart)) return rule.weak;
  if (line.monthState === "旺" || line.monthState === "相") return rule.strong;
  return lineJudgement(line, chart);
}

function describeUseGodToShi(useLine: YaoLine, chart: LiuyaoChart) {
  const shi = chart.lines.find((line) => line.isShi);
  if (!shi || useLine.position === shi.position) return "";
  const relation = elementEffect(useLine.element, shi.element);
  if (relation === "source-generates-target") return " 用神生世，事情对自己有助力。";
  if (relation === "target-generates-source") return " 世生用神，自己要先投入精力或资源。";
  if (relation === "source-controls-target") return " 用神克世，事情本身会给自己形成压力。";
  if (relation === "target-controls-source") return " 世克用神，自己能管住此事，但也容易消耗它。";
  return " 用神与世爻同气，主自己与事情绑得较紧。";
}

function elementEffect(source: FiveElement, target: FiveElement) {
  if (source === target) return "same";
  const sourceIndex = elementCycle.indexOf(source);
  const targetIndex = elementCycle.indexOf(target);
  if ((sourceIndex + 1) % 5 === targetIndex) return "source-generates-target";
  if ((targetIndex + 1) % 5 === sourceIndex) return "target-generates-source";
  if ((sourceIndex + 2) % 5 === targetIndex) return "source-controls-target";
  return "target-controls-source";
}

function transformJudgement(line: YaoLine, changed: YaoLine) {
  if (line.transformLabels.includes("回头生")) return "这是变爻回头生本爻，事情后续有补力。";
  if (line.transformLabels.includes("回头克")) return "这是变爻回头克本爻，变化之后反而有压力。";
  if (changed.monthState === "旺" || changed.monthState === "相") return "变爻旺相，后续力量会更显。";
  if (changed.monthState === "囚" || changed.monthState === "死") return "变爻偏弱，变化有形但未必马上成气候。";
  return "此处是事情转折点，需结合用神判断吉凶。";
}

function compareShiYing(shi?: YaoLine, ying?: YaoLine) {
  if (!shi || !ying) return "主客关系暂不完整";
  if (shi.element === ying.element) return "世应同气，彼此有相似处，但也可能互相牵制";
  return "世应不同气，主客之间需要靠动爻或用神来打通";
}

function linePosition(line: YaoLine) {
  return `${lineNames[line.position - 1]}爻`;
}
