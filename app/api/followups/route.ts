import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "../../../src/lib/serverSupabase";
import OpenAI from "openai";
import type { LiuyaoChart } from "../../../src/domain/types";

function createDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
}

function slimChartLines(chart: LiuyaoChart) {
  return chart.lines.map((line) => ({
    position: line.position,
    sixRelation: line.sixRelation,
    ganZhi: line.ganZhi.text,
    element: line.element,
    monthState: line.monthState,
    moving: line.moving,
    isShi: line.isShi,
    isYing: line.isYing,
    transformLabels: line.transformLabels,
    isMonthBroken: line.isMonthBroken,
    isDayClash: line.isDayClash,
    isDarkMoving: line.isDarkMoving,
  }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await getUserFromBearer(request.headers.get("authorization"));
  const { question, chart, history, divinationId } = body;

  if (!question || !chart) {
    return NextResponse.json({ error: "缺少问题或卦象数据" }, { status: 400 });
  }

  const client = createDeepSeekClient();

  // Fallback: local rule-based answer
  if (!client) {
    const answer = buildFallbackFollowup(question, chart);
    return NextResponse.json({ text: answer, provider: "fallback" });
  }

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: `你是观真的六爻解读助手。用户正在追问一个已排好的卦象。根据排盘数据和对话历史作答。解读时尽可能援引《增删卜易》《卜筮正宗》《易隐》《火珠林》等古籍原文佐证，每条关键判断注明出处（如「《增删卜易》云：……」）。不要编造引文。
卦象数据：${JSON.stringify({
  original: chart.original.name,
  changed: chart.changed.name,
  lines: slimChartLines(chart),
  hexRelation: chart.hexRelation,
  emptyBranches: chart.emptyBranches,
  monthBranch: chart.monthBranch,
})}
回答规则：输出中文，结构清晰。紧扣当前追问的具体问题，结合卦象中的世应、动变、用神来回答。不要假装确定现实结果，不给医疗、法律、投资等决策性建议。回答控制在200字以内，直击要点。`,
    },
    ...(Array.isArray(history) ? history.map((msg: { role: "user" | "assistant"; content: string }) => ({
      role: msg.role,
      content: msg.content,
    })) : []),
    { role: "user", content: question },
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.55,
      max_tokens: 600,
      messages,
    });

    const text = response.choices[0]?.message?.content?.trim() || buildFallbackFollowup(question, chart);

    // Save followup to Supabase if user is logged in
    const supabase = (await import("../../../src/lib/serverSupabase")).getServiceSupabase();
    if (supabase && user && divinationId) {
      const historyLength = Array.isArray(history) ? history.length : 0;
      await Promise.all([
        supabase.from("followups").insert({
          user_id: user.id,
          divination_id: divinationId,
          role: "user",
          content: question,
          round: Math.floor(historyLength / 2),
        }),
        supabase.from("followups").insert({
          user_id: user.id,
          divination_id: divinationId,
          role: "assistant",
          content: text,
          round: Math.floor(historyLength / 2),
        }),
      ]).catch(() => {});
    }

    return NextResponse.json({ text, provider: "deepseek" });
  } catch {
    return NextResponse.json({ text: buildFallbackFollowup(question, chart), provider: "fallback" });
  }
}

function buildFallbackFollowup(question: string, chart: LiuyaoChart): string {
  const moving = chart.lines.filter((line) => line.moving);
  const shi = chart.lines.find((line) => line.isShi);
  const watchSignals = chart.ruleSignals.filter((signal) => signal.level === "watch");

  return [
    `就"${question}"来看：`,
    chart.hexRelation.isSixClash
      ? "当前卦为六冲结构，事情有分散、变动之象。追问时宜先看世爻是否稳得住，再看冲中是否有合来救应。"
      : chart.hexRelation.isSixCombine
        ? "当前卦为六合结构，事情有牵连粘合之象。追问时宜看合中是否有冲来解局，防拖而不决。"
        : moving.length
          ? `盘中${moving.map((line) => `${line.position}爻`).join("、")}发动，变化点主要在这些爻位。`
          : "本卦无动爻，追问时重点看世应用神的旺衰和空破。",
    shi ? `世爻为${shi.sixRelation}${shi.ganZhi.text}，月令${shi.monthState}。` : "",
    watchSignals.length
      ? `需留意：${watchSignals.map((signal) => signal.title).join("、")}。`
      : "",
    "要更具体的判断，需要结合用神和动变进一步分析。",
  ]
    .filter(Boolean)
    .join("\n\n");
}
