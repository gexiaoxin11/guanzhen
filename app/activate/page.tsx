"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../../src/styles.css";

interface AuthInfo {
  key: string;
  modules: string[];
  expire_time: string;
  remain_times: number;
  type: number;
}

function loadAuth(): AuthInfo | null {
  try {
    const raw = localStorage.getItem("auth_info");
    if (!raw) return null;
    const info: AuthInfo = JSON.parse(raw);
    if (new Date(info.expire_time) <= new Date()) {
      localStorage.removeItem("auth_info");
      return null;
    }
    return info;
  } catch { return null; }
}

function saveAuth(info: AuthInfo) {
  localStorage.setItem("auth_info", JSON.stringify(info));
}

export default function ActivatePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthInfo | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const info = loadAuth();
    setAuth(info);
    // Load history
    try {
      const raw1 = localStorage.getItem("mirror-liuyao-archives") || "[]";
      const raw2 = localStorage.getItem("mirror-ziwei-archives") || "[]";
      const parsed1 = JSON.parse(raw1);
      const parsed2 = JSON.parse(raw2);
      const all = [...(Array.isArray(parsed1) ? parsed1 : []), ...(Array.isArray(parsed2) ? parsed2 : [])];
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(all.slice(0, 20));
    } catch { /* ignore */ }
  }, []);

  const handleActivate = async () => {
    setError("");
    const trimmed = keyInput.trim();
    if (!trimmed) { setError("请输入密钥"); return; }
    if (trimmed.length < 6) { setError("密钥格式不正确"); return; }

    setLoading(true);
    try {
      const resp = await fetch("/api/activation/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
      });
      const data = await resp.json();
      if (data.code === 0) {
        saveAuth(data.data);
        setAuth(data.data);
        setKeyInput("");
        setSuccessMsg("激活成功！全站功能已解锁");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.msg || "激活失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    await handleActivate();
  };

  const formatExpire = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const moduleNames: Record<string, string> = {
    liuyao: "六爻解卦",
    ziwei: "紫微批注",
  };

  if (!mounted) return <div className="app-shell"><main className="main-flow" /></div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a><a href="/almanac">黄历</a><a href="/xiaoliuren">小六壬</a></nav>
      </header>

      <main className="main-flow" style={{ maxWidth: 520 }}>
        {!auth ? (
          /* ===== 未激活状态 ===== */
          <section className="activate-card">
            <h1 style={{ fontSize: 22, margin: "0 0 8px", color: "var(--ink)" }}>激活密钥，解锁完整排盘功能</h1>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 20px" }}>
              输入您获取的激活密钥，即可解锁对应六爻解卦、紫微批注模块
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                placeholder="请输入激活密钥"
                style={{
                  width: "100%", minHeight: 46, border: "1px solid var(--ink-faint)",
                  borderRadius: 10, padding: "0 14px", fontSize: 15, outline: "none",
                  background: "var(--surface-strong)", color: "var(--ink)",
                }}
              />
              {error && <p style={{ color: "var(--red)", fontSize: 12, margin: 0 }}>{error}</p>}
              <button
                onClick={handleActivate}
                disabled={loading}
                style={{
                  width: "100%", border: 0, borderRadius: 10, padding: 13,
                  background: "var(--gold)", color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "验证中..." : "立即激活"}
              </button>
            </div>

            <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "var(--ink-soft)" }}>
              未获取密钥？可添加客服咨询获取
            </p>
          </section>
        ) : (
          /* ===== 已激活状态 ===== */
          <section>
            {successMsg && (
              <div className="activate-card" style={{ marginBottom: 14, borderColor: "var(--green)", background: "rgba(41,135,71,0.06)" }}>
                <p style={{ margin: 0, color: "var(--green)", fontWeight: 600 }}>✅ {successMsg}</p>
              </div>
            )}

            <h1 style={{ fontSize: 22, margin: "0 0 16px", color: "var(--ink)" }}>我的使用权限</h1>

            <div className="activate-card">
              <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "var(--ink)" }}>已解锁功能</h2>
              <div style={{ display: "grid", gap: 6 }}>
                {(auth.modules || []).map((m) => (
                  <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <span style={{ color: "var(--green)" }}>✅</span>
                    <span style={{ color: "var(--ink)" }}>{moduleNames[m] || m}</span>
                    {m === "liuyao" && <a href="/liuyao" style={{ marginLeft: "auto", fontSize: 12, color: "var(--gold)" }}>去排盘 →</a>}
                    {m === "ziwei" && <a href="/ziwei" style={{ marginLeft: "auto", fontSize: 12, color: "var(--gold)" }}>去排盘 →</a>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ink-faint)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--ink-soft)" }}>有效期至</span>
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>{formatExpire(auth.expire_time)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                  <span style={{ color: "var(--ink-soft)" }}>剩余次数</span>
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                    {auth.remain_times === -1 ? "不限次数" : `${auth.remain_times}次`}
                  </span>
                </div>
              </div>
            </div>

            {/* 续期 */}
            <div className="activate-card" style={{ marginTop: 14 }}>
              <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "var(--ink)" }}>续期 / 升级</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setError(""); }}
                  placeholder="输入新密钥"
                  style={{
                    flex: 1, minHeight: 42, border: "1px solid var(--ink-faint)",
                    borderRadius: 8, padding: "0 12px", fontSize: 14, outline: "none",
                    background: "var(--surface-strong)", color: "var(--ink)",
                  }}
                />
                <button
                  onClick={handleRenew}
                  disabled={loading}
                  style={{
                    border: 0, borderRadius: 8, padding: "0 18px",
                    background: "var(--gold)", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "..." : "续期"}
                </button>
              </div>
              {error && <p style={{ color: "var(--red)", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
            </div>

            {/* 本地历史 */}
            {history.length > 0 && (
              <div className="activate-card" style={{ marginTop: 14 }}>
                <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "var(--ink)" }}>本地排盘历史</h2>
                <div style={{ display: "grid", gap: 6 }}>
                  {history.map((item: any, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (item.type === "ziwei") {
                          window.open("/ziwei", "_blank");
                        } else if (item.id) {
                          window.open("/history/" + item.id, "_blank");
                        }
                      }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                        background: "rgba(51,51,51,0.03)", fontSize: 13,
                      }}
                    >
                      <span style={{ color: "var(--ink)" }}>{item.question || "无标题"}</span>
                      <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("zh-CN") : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 10, color: "var(--ink-soft)" }}>
                  本地记录保存在当前浏览器，清除缓存会丢失
                </p>
              </div>
            )}

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--ink-soft)" }}>
              <button
                onClick={() => { localStorage.removeItem("auth_info"); setAuth(null); }}
                style={{ border: 0, background: "transparent", color: "var(--ink-soft)", cursor: "pointer", fontSize: 11 }}
              >
                切换密钥
              </button>
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
