"use client";

import { useEffect, useState } from "react";
import "../../src/styles.css";

interface KeyRecord {
  key_str: string;
  modules: string[];
  type: number;
  expire_days: number;
  remain_times: number;
  status: number;
  first_activate_time: string | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [error, setError] = useState("");
  const [genDays, setGenDays] = useState(30);
  const [genTimes, setGenTimes] = useState(10);
  const [genType, setGenType] = useState<"trial" | "premium">("trial");
  const [loading, setLoading] = useState(false);

  const doAuth = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth", password }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setAuthed(true);
        setKeys(data.keys || []);
      } else {
        setError(data.msg || "密码错误");
      }
    } catch {
      setError("网络错误");
    }
  };

  const refreshKeys = async () => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", password }),
      });
      const data = await res.json();
      if (data.code === 0) setKeys(data.keys || []);
    } catch { /* ignore */ }
  };

  const generateKey = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          password,
          type: genType === "premium" ? 1 : 0,
          expireDays: genDays,
          times: genType === "premium" ? -1 : genTimes,
        }),
      });
      const data = await res.json();
      if (data.code === 0) {
        await refreshKeys();
        alert(`密钥已生成：${data.key}`);
      } else {
        alert(data.msg || "生成失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const toggleKey = async (keyStr: string, newStatus: number) => {
    try {
      await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", password, key: keyStr, status: newStatus }),
      });
      await refreshKeys();
    } catch { /* ignore */ }
  };

  if (!authed) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="/"><span>观真</span></a>
          <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/almanac">黄历</a></nav>
        </header>
        <main className="main-flow" style={{ maxWidth: 400 }}>
          <h1 style={{ fontSize: 20, marginBottom: 16 }}>密钥管理</h1>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doAuth()}
              placeholder="管理员密码"
              style={{
                minHeight: 44, padding: "0 14px", border: "1px solid var(--ink-faint)",
                borderRadius: 10, fontSize: 15, outline: "none",
                background: "var(--surface-strong)", color: "var(--ink)",
              }}
            />
            {error && <p style={{ color: "var(--red)", fontSize: 12, margin: 0 }}>{error}</p>}
            <button
              onClick={doAuth}
              style={{
                minHeight: 44, border: 0, borderRadius: 10,
                background: "var(--gold)", color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              进入管理
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/almanac">黄历</a></nav>
      </header>
      <main className="main-flow" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 20, marginBottom: 20 }}>🔑 密钥管理</h1>

        {/* Generate section */}
        <section className="activate-card">
          <h2 style={{ fontSize: 16, margin: "0 0 14px" }}>生成新密钥</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="radio" checked={genType === "trial"} onChange={() => setGenType("trial")} />
                试用密钥（限次）
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="radio" checked={genType === "premium"} onChange={() => setGenType("premium")} />
                正式密钥（限时）
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, fontSize: 13 }}>
                有效天数
                <input type="number" value={genDays} onChange={(e) => setGenDays(Number(e.target.value))}
                  style={{ width: "100%", minHeight: 36, marginTop: 4, padding: "0 10px", borderRadius: 8, border: "1px solid var(--ink-faint)", background: "var(--surface-strong)" }} />
              </label>
              {genType === "trial" && (
                <label style={{ flex: 1, fontSize: 13 }}>
                  可用次数
                  <input type="number" value={genTimes} onChange={(e) => setGenTimes(Number(e.target.value))}
                    style={{ width: "100%", minHeight: 36, marginTop: 4, padding: "0 10px", borderRadius: 8, border: "1px solid var(--ink-faint)", background: "var(--surface-strong)" }} />
                </label>
              )}
            </div>
            <button onClick={generateKey} disabled={loading}
              style={{ minHeight: 40, border: 0, borderRadius: 8, background: "var(--gold)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "生成中…" : "生成密钥"}
            </button>
          </div>
        </section>

        {/* Keys list */}
        <section className="activate-card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 14px" }}>现有密钥（{keys.length}）</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {keys.map((k) => (
              <div key={k.key_str} style={{
                padding: "12px 14px", borderRadius: 10, fontSize: 13,
                background: k.status === 0 ? "rgba(212,65,21,0.05)" : "rgba(51,51,51,0.03)",
                border: `1px solid ${k.status === 0 ? "rgba(212,65,21,0.2)" : "rgba(51,51,51,0.08)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <code style={{ fontSize: 13, color: "var(--ink)" }}>{k.key_str}</code>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: k.status === 1 ? "rgba(41,135,71,0.1)" : "rgba(212,65,21,0.1)",
                    color: k.status === 1 ? "#298747" : "#D44115",
                  }}>
                    {k.status === 1 ? "启用" : "禁用"}
                  </span>
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 16, fontSize: 12, color: "var(--ink-soft)" }}>
                  <span>{k.type === 1 ? "正式（限时）" : "试用（限次）"}</span>
                  <span>{k.expire_days}天</span>
                  {k.type === 1 ? <span>不限次</span> : <span>{k.remain_times}次</span>}
                  <span>模块：{k.modules.join("、")}</span>
                  {k.first_activate_time && <span>已激活</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                  {k.status === 1 ? (
                    <button onClick={() => toggleKey(k.key_str, 0)}
                      style={{ border: "1px solid var(--red)", borderRadius: 6, padding: "3px 12px", fontSize: 12, color: "var(--red)", background: "transparent", cursor: "pointer" }}>
                      禁用
                    </button>
                  ) : (
                    <button onClick={() => toggleKey(k.key_str, 1)}
                      style={{ border: "1px solid var(--green)", borderRadius: 6, padding: "3px 12px", fontSize: 12, color: "var(--green)", background: "transparent", cursor: "pointer" }}>
                      启用
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
