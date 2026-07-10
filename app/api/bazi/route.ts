import { NextRequest, NextResponse } from "next/server";
import { generateReading } from "../../../src/lib/deepseek";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.data) return NextResponse.json({ error: "缺少排盘数据" }, { status: 400 });

  // 构建带分析上下文的提示
  let contextExtra = "";
  if (body.analysis) {
    const a = body.analysis;
    contextExtra = [
      `【命局分析】`,
      `日主${a.strength?.dayMaster ?? ""}（${a.strength?.dayWuxing ?? ""}），身${a.strength?.level ?? ""}（评分 ${a.strength?.score ?? "?"}/10）`,
      `月令状态：${a.strength?.monthState ?? ""}`,
      a.patterns?.length ? `格局：${a.patterns.map((p: any) => p.name).join("、")}` : "",
      `喜用五行：${a.strength?.favorableElements?.join("、") ?? "无"}；忌五行：${a.strength?.unfavorableElements?.join("、") ?? "无"}`,
      a.dayunAdvice?.length ? `大运吉凶参考：${a.dayunAdvice.slice(0, 3).map((d: any) => `${d.period}(${d.age})${d.rating}`).join(", ")}` : "",
    ].filter(Boolean).join("\n");
  }

  const question = String(body.question ?? "");
  
  const text = await generateReading({
    question: question || "请解读此八字命盘",
    persona: String(body.persona ?? "hermit"),
    depth: String(body.depth ?? "standard"),
    chart: { type: "bazi", data: body.data, analysis: contextExtra },
    retrievedContext: body.retrievedContext,
  });
  return NextResponse.json({ text, provider: "deepseek" });
}
