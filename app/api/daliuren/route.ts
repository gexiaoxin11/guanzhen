import { NextRequest, NextResponse } from "next/server";
import { generateReading } from "../../../src/lib/deepseek";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.data) return NextResponse.json({ error: "缺少排盘数据" }, { status: 400 });
  const text = await generateReading({
    question: String(body.question ?? ""),
    persona: String(body.persona ?? "hermit"),
    depth: String(body.depth ?? "standard"),
    chart: { type: "daliuren", data: body.data },
    retrievedContext: body.retrievedContext,
  });
  return NextResponse.json({ text, provider: "deepseek" });
}
