import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const KEYS_FILE = path.resolve(process.cwd(), "data/keys.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "guanzhen2026";

function loadKeys(): any[] {
  if (!fs.existsSync(KEYS_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"));
}

function saveKeys(keys: any[]) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

function checkAdmin(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ code: 400, msg: "请求格式错误" });
  }

  const action = body.action;
  const password = String(body.password || "");

  if (!checkAdmin(password)) {
    return NextResponse.json({ code: 403, msg: "密码错误" });
  }

  switch (action) {
    case "auth":
    case "list": {
      const keys = loadKeys();
      return NextResponse.json({ code: 0, keys });
    }

    case "generate": {
      const type = body.type === 1 ? 1 : 0; // 1=premium, 0=trial
      const expireDays = Math.max(1, Math.min(3650, Number(body.expireDays) || 30));
      const times = type === 1 ? -1 : Math.max(1, Math.min(1000, Number(body.times) || 10));
      
      // Generate random key: GZ-XXXX-XXXX
      const randomPart = () => crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
      const keyStr = `GZ-${randomPart()}-${randomPart()}`;
      
      const keys = loadKeys();
      keys.push({
        key_str: keyStr,
        modules: body.modules || ["liuyao", "ziwei"],
        type,
        expire_days: expireDays,
        remain_times: times,
        status: 1,
        first_activate_time: null,
      });
      saveKeys(keys);
      
      return NextResponse.json({ code: 0, key: keyStr });
    }

    case "toggle": {
      const keyStr = String(body.key || "");
      const status = Number(body.status);
      if (![0, 1].includes(status)) {
        return NextResponse.json({ code: 400, msg: "状态值无效" });
      }
      
      const keys = loadKeys();
      const record = keys.find((k: any) => k.key_str === keyStr);
      if (!record) return NextResponse.json({ code: 404, msg: "密钥不存在" });
      
      record.status = status;
      saveKeys(keys);
      
      return NextResponse.json({ code: 0 });
    }

    default:
      return NextResponse.json({ code: 400, msg: "未知操作" });
  }
}
