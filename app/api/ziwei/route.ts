import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateZiweiAnalysis } from "../../../src/domain/ziweiAnalysis";

function createDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
}

function slimAstroData(data: any) {
  return {
    solarDate: data.solarDate,
    lunarDate: data.lunarDate,
    fiveElementsClass: data.fiveElementsClass,
    soul: data.soul,
    body: data.body,
    zodiac: data.zodiac,
    palaces: data.palaces?.map((p: any) => ({
      name: p.name,
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: p.earthlyBranch,
      majorStars: p.majorStars,
      minorStars: p.minorStars,
      decadal: p.decadal,
    })),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { astroData } = body;

  if (!astroData || typeof astroData !== "object") {
    return NextResponse.json({ error: "缺少命盘数据" }, { status: 400 });
  }

  const analysis = generateZiweiAnalysis(astroData);
  const client = createDeepSeekClient();

  if (!client) {
    return NextResponse.json({
      text: formatAnalysisText(analysis),
      provider: "fallback",
    });
  }

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: "你是观真的紫微斗数解读助手。根据命盘数据、格局分析和宫位星曜进行专业解读。\n\n解读结构：\n1. 命局总览\n2. 格局分析\n3. 十二宫精要\n4. 四化点睛\n5. 大限提要\n6. 修心建议\n\n风格：文言白话结合，专业但不晦涩，控制在600字以内。\n重要约束：仅供文化研究参考。",
        },
        {
          role: "user",
          content: JSON.stringify({
            astroData: slimAstroData(astroData),
            ruleAnalysis: analysis,
          }),
        },
      ],
      max_tokens: 1200,
    });

    const text = response.choices[0]?.message?.content?.trim() || formatAnalysisText(analysis);
    return NextResponse.json({ text, provider: "deepseek" });
  } catch {
    return NextResponse.json({ text: formatAnalysisText(analysis), provider: "fallback" });
  }
}

function formatAnalysisText(analysis: ReturnType<typeof generateZiweiAnalysis>): string {
  const lines: string[] = [];
  lines.push("## 命盘总览");
  lines.push(analysis.summary);
  lines.push("");
  lines.push("## 五行局 · 命主 · 身主");
  lines.push(`- 五行局：${analysis.fiveElementsClass} — ${analysis.fiveElementsNote}`);
  lines.push(`- 命主：${analysis.soul} — ${analysis.soulNote}`);
  lines.push(`- 身主：${analysis.body} — ${analysis.bodyNote}`);
  if (analysis.soulBodyAnalysis) {
    lines.push(`- 命身双主：${analysis.soulBodyAnalysis}`);
  }
  lines.push("");
  if (analysis.birthMutagen.items.length > 0) {
    lines.push("## 生年四化分析");
    lines.push(`${analysis.birthMutagen.stem}干四化：`);
    for (const item of analysis.birthMutagen.items) {
      lines.push(`- 化${item.label}：${item.star} → ${item.palace} — ${item.note}`);
    }
    lines.push("");
  }
  if (analysis.starCombinations.length > 0) {
    lines.push("## 思象格局分析");
    for (const p of analysis.starCombinations) {
      lines.push(`- **${p.title}**：${p.body}`);
    }
    lines.push("");
  }
  lines.push("## 关键宫位分析");
  for (const p of analysis.keyPalaces) {
    lines.push(`- **${p.name}**：${p.stars} — ${p.analysis}`);
  }
  lines.push("");
  lines.push("## 大限走势");
  for (const d of analysis.decadals) {
    lines.push(`- ${d.ageRange} ${d.palace}：${d.stars} — ${d.note}`);
  }
  lines.push("");
  lines.push("## 十二宫精要");
  for (const [name, detail] of Object.entries(analysis.palaceAnalyses)) {
    lines.push(`- **${name}**：${detail}`);
  }
  lines.push("");
  lines.push("> 以上分析基于传统紫微斗数规则，仅供文化研究参考。");
  return lines.join("\n");
}
