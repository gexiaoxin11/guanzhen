import { NextRequest, NextResponse } from "next/server";
import { generateReading } from "../../../src/lib/deepseek";
import { getServiceSupabase, getUserFromBearer } from "../../../src/lib/serverSupabase";

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "数据库未配置" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 24, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const { data, error } = await supabase
    .from("divinations")
    .select("id, created_at, question, topic, original_name, changed_name, input_json")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((item: Record<string, unknown>) => ({
    id: item.id,
    createdAt: item.created_at,
    question: item.question,
    topic: item.topic,
    original: item.original_name,
    changed: item.changed_name,
    input: item.input_json,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.chart) return NextResponse.json({ error: "缺少卦象数据" }, { status: 400 });
  const user = await getUserFromBearer(request.headers.get("authorization"));
  const text = await generateReading({
    question: String(body.question ?? ""),
    persona: String(body.persona ?? "hermit"),
    depth: String(body.depth ?? "standard"),
    chart: body.chart,
    retrievedContext: body.retrievedContext,
  });

  const supabase = getServiceSupabase();
  if (supabase && user && body.divinationId) {
    await supabase.from("ai_readings").insert({
      user_id: user.id,
      divination_id: body.divinationId,
      provider: "deepseek",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      persona: body.persona ?? "hermit",
      depth: body.depth ?? "standard",
      content: text,
    });
  }

  return NextResponse.json({ text, provider: process.env.DEEPSEEK_API_KEY ? "deepseek" : "fallback" });
}
