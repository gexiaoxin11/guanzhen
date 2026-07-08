import OpenAI from "openai";
import { buildLocalReading } from "../domain/readingRules";
import { searchDocuments } from "./documentSearch";
import type { LiuyaoChart } from "../domain/types";

type ChartData = LiuyaoChart | { type: string; data: any };

type ReadingRequest = {
  question: string;
  persona: string;
  depth: string;
  chart: ChartData;
  retrievedContext?: string[];
};

function createDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
}

function isLiuyaoChart(chart: ChartData): chart is LiuyaoChart {
  return chart && "lines" in chart && Array.isArray((chart as LiuyaoChart).lines);
}

const CHART_TYPE_PROMPTS: Record<string, string> = {
  bazi: "你是观真的八字命理分析助手。根据八字排盘 JSON 数据作答。\n\n解读风格：输出中文，古籍风貌，先结论后依据。结构包含：格局总论、日主强弱分析、五行喜忌、十神配置、大运走势、行动建议。\n\n核心要求：援引《渊海子平》《三命通会》《滴天髓》等古籍原文佐证判断。不要杜撰原文。不要假装确定现实结果，不给医疗、法律、投资等决策性建议。",
  qimen: "你是观真的奇门遁甲分析助手。根据奇门排盘 JSON 数据作答。\n\n解读风格：输出中文，古籍风貌，先结论后依据。结构包含：局象总论、八门吉凶、九星旺衰、值符值使分析、方位建议。\n\n核心要求：援引《烟波钓叟歌》《奇门遁甲秘笈大全》等古籍原文佐证判断。不要杜撰原文。不给决策性建议。",
  daliuren: "你是观真的大六壬分析助手。根据大六壬课盘 JSON 数据作答。\n\n解读风格：输出中文，古籍风貌，先结论后依据。结构包含：课体总论、四课分析、三传走势、天将吉凶、行动建议。\n\n核心要求：援引《大六壬指南》《六壬大全》等古籍原文佐证判断。不要杜撰原文。不给决策性建议。",
  meihua: "你是观真的梅花易数分析助手。根据梅花易数起卦 JSON 数据作答。\n\n解读风格：输出中文，古籍风貌，先结论后依据。结构包含：卦象总论、体用生克、互卦变卦分析、爻辞解读、行动建议。\n\n核心要求：援引《梅花易数》《周易》等古籍原文佐证判断。不要杜撰原文。不给决策性建议。",
};

const CHART_TYPE_NAMES: Record<string, string> = {
  bazi: "八字命理",
  qimen: "奇门遁甲",
  daliuren: "大六壬",
  meihua: "梅花易数",
};

export async function generateReading(payload: ReadingRequest) {
  const client = createDeepSeekClient();
  
  // Extract chart type info
  const chartType = isLiuyaoChart(payload.chart) ? "liuyao" : (payload.chart as any).type || "unknown";
  const chartData = isLiuyaoChart(payload.chart) ? payload.chart : (payload.chart as any).data;

  // If chart is non-liuyao and no DeepSeek client, return a friendly message
  if (!client) {
    if (chartType === "liuyao") return buildLocalReading(payload);
    return `【${CHART_TYPE_NAMES[chartType] || "排盘"}结果】\n\nAI 解读服务暂未配置，请确保已设置 DEEPSEEK_API_KEY 环境变量。\n\n排盘数据已生成，您可以根据以下数据进行自行分析：\n${JSON.stringify(chartData, null, 2)}`;
  }

  // Search relevant document context
  const docContext = searchDocuments(payload.question, 5);
  const retrievedContext = payload.retrievedContext ?? [];
  if (docContext.length > 0) {
    retrievedContext.push(
      "【古籍参考】以下为相关古籍原文片段，请据此援引佐证你的判断：\n" +
        docContext.map((doc) => `《${doc.title}》：${doc.content}`).join("\n\n")
    );
  }

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  // Pick the right system prompt
  const systemPrompt = chartType === "liuyao"
    ? "你是观真的六爻解读助手。根据排盘 JSON、传统六爻规则作答。\n\n解读风格：输出中文，古籍风貌，先结论后依据。结构包含：一句话总结、核心分析、用神与世应、动变与空破、行动建议。\n\n核心要求：解读时必须援引以下古籍原文佐证你的判断，每条关键分析需注明出处经典（如「《增删卜易》云：……」「《卜筮正宗》云：……」「《易隐》云：……」「《火珠林》云：……」）。不要杜撰原文，只引用你确信存在的经典论断。如果某条判断没有确切古籍出处，直接陈述六爻规则即可，不要编造引文。\n\n重要约束：不要假装确定现实结果，不给医疗、法律、投资等决策性建议。解读仅供文化研究与自我观察参考。"
    : (CHART_TYPE_PROMPTS[chartType] || "你是观真的命理分析助手。根据排盘数据作答，输出中文，古籍风貌。");

  // Prepare user content
  let userContent: any = {
    question: payload.question,
    persona: payload.persona,
    depth: payload.depth,
    chart: chartType === "liuyao" ? slimChart(payload.chart as LiuyaoChart) : chartData,
    retrievedContext: retrievedContext,
  };
  
  if (chartType === "liuyao") {
    userContent.localRuleDraft = buildLocalReading(payload);
  }

  try {
    const response = await withRetry(() =>
      client.chat.completions.create({
        model,
        temperature: 0.55,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userContent) },
        ],
      })
    );

    return response.choices[0]?.message?.content?.trim() || fallbackMessage(chartType, chartData);
  } catch (error: any) {
    console.error("DeepSeek API error:", error?.message || error);
    if (chartType === "liuyao") return buildLocalReading(payload);
    return fallbackMessage(chartType, chartData);
  }
}

function fallbackMessage(chartType: string, chartData: any): string {
  const name = CHART_TYPE_NAMES[chartType] || "排盘";
  return `【${name}结果】\n\nAI 解读服务暂时不可用，请稍后重试。\n\n排盘数据已生成，您可以根据以下数据进行自行分析：\n${JSON.stringify(chartData, null, 2)}`;
}

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("unreachable");
}

function slimChart(chart: LiuyaoChart) {
  return {
    solarDate: chart.solarDate,
    ganZhi: {
      year: chart.year.text,
      month: chart.month.text,
      day: chart.day.text,
      time: chart.time.text,
      emptyBranches: chart.emptyBranches,
    },
    original: chart.original,
    changed: chart.changed,
    lines: chart.lines.map((line) => ({
      position: line.position,
      value: line.value,
      moving: line.moving,
      sixSpirit: line.sixSpirit,
      sixRelation: line.sixRelation,
      ganZhi: line.ganZhi.text,
      element: line.element,
      monthState: line.monthState,
      twelveStage: line.twelveStage,
      isMonthBroken: line.isMonthBroken,
      isDayClash: line.isDayClash,
      isDarkMoving: line.isDarkMoving,
      isShi: line.isShi,
      isYing: line.isYing,
      transformLabels: line.transformLabels,
      hiddenSpirit: line.hiddenSpirit,
      shenSha: line.shenSha,
    })),
    changedLines: chart.changedLines.map((line) => ({
      position: line.position,
      sixRelation: line.sixRelation,
      ganZhi: line.ganZhi.text,
      element: line.element,
      monthState: line.monthState,
      twelveStage: line.twelveStage,
      isShi: line.isShi,
      isYing: line.isYing,
    })),
    hexRelation: chart.hexRelation,
    ruleSignals: chart.ruleSignals,
    notes: chart.notes,
  };
}
