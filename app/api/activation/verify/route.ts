import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function loadKeys() {
  const filePath = path.resolve(process.cwd(), "data/keys.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveKeys(keys: any[]) {
  const filePath = path.resolve(process.cwd(), "data/keys.json");
  fs.writeFileSync(filePath, JSON.stringify(keys, null, 2));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ code: 429, msg: "请求过于频繁，请1分钟后再试" }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ code: 400, msg: "请求格式错误" });
  }

  const keyStr = String(body.key || "").trim();
  if (!keyStr || keyStr.length < 6) {
    return NextResponse.json({ code: 400, msg: "密钥格式不正确" });
  }

  const keys: any[] = loadKeys();
  const record = keys.find((k: any) => k.key_str === keyStr);

  if (!record) return NextResponse.json({ code: 1, msg: "密钥不存在，请核对后重试" });
  if (record.status === 0) return NextResponse.json({ code: 3, msg: "密钥已被禁用" });

  if (!record.first_activate_time) {
    record.first_activate_time = new Date().toISOString();
    saveKeys(keys);
  }

  const expireDate = new Date(record.first_activate_time);
  expireDate.setDate(expireDate.getDate() + record.expire_days);
  expireDate.setHours(23, 59, 59, 0);

  if (new Date() > expireDate) {
    return NextResponse.json({ code: 2, msg: "密钥已过期，请联系续期" });
  }

  return NextResponse.json({
    code: 0, msg: "激活成功",
    data: {
      key: keyStr,
      modules: record.modules,
      expire_time: expireDate.toISOString(),
      remain_times: record.type === 1 ? -1 : record.remain_times,
      type: record.type,
    },
  });
}
