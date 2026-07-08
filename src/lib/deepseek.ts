import OpenAI from "openai";
import { buildLocalReading } from "../domain/readingRules";
import { searchDocuments } from "./documentSearch";
import type { LiuyaoChart } from "../domain/types";

type ReadingRequest = {
  question: string;
  persona: string;
  depth: string;
  chart: LiuyaoChart;
  retrievedContext?: string[];
};

function createDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
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

export async function generateReading(payload: ReadingRequest) {
  const client = createDeepSeekClient();
  if (!client) return buildLocalReading(payload);

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

  try {
    const response = await withRetry(() =>
      client.chat.completions.create({
        model,
        temperature: 0.55,
        messages: [
          {
            role: "system",
            content:
              "你是观真的六爻解读助手。根据排盘 JSON、传统六爻规则作答。\n\n解读风格：输出中文，古籍风貌，先结论后依据。结构包含：一句话总结、核心分析、用神与世应、动变与空破、行动建议。\n\n核心要求：解读时必须援引以下古籍原文佐证你的判断，每条关键分析需注明出处经典（如「《增删卜易》云：……」「《卜筮正宗》云：……」「《易隐》云：……」「《火珠林》云：……」）。不要杜撰原文，只引用你确信存在的经典论断。如果某条判断没有确切古籍出处，直接陈述六爻规则即可，不要编造引文。\n\n重要约束：不要假装确定现实结果，不给医疗、法律、投资等决策性建议。解读仅供文化研究与自我观察参考。",
          },
          {
            role: "user",
            content: JSON.stringify({
              question: payload.question,
              persona: payload.persona,
              depth: payload.depth,
              chart: slimChart(payload.chart),
              localRuleDraft: buildLocalReading(payload),
              retrievedContext: retrievedContext,
            }),
          },
        ],
      })
    );

    return response.choices[0]?.message?.content?.trim() || buildLocalReading(payload);
  } catch {
    return buildLocalReading(payload);
  }
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
