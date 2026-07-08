"use client";

import { runDaliuren, type DaliurenInput, type DaliurenOutput } from "../../src/lib/taibu";
import { useState } from "react";
import "../../src/styles.css";
import { TIME_OPTIONS, HOUR_STARTS } from "../ziwei-time";

// ─── 辅助函数 ───

const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");

// ─── 组件 ───

export default function DaliurenPage() {
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [timeIndex, setTimeIndex] = useState(0);
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<DaliurenOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tianDiPan" | "siKe" | "sanChuan" | "shenSha" | "keTi" | "dunGan">("tianDiPan");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAiResult("");
    setLoading(true);
    try {
      const h = HOUR_STARTS[timeIndex] || 0;
      const input: DaliurenInput = { date: birthDate, hour: h, minute: 0, timezone, question: question || undefined };
      const output = await runDaliuren(input);
      setResult(output);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "排盘失败，请检查输入");
    } finally {
      setLoading(false);
    }
  };

  const handleAiReading = async () => {
    if (!result) return;
    setAiLoading(true);
    setAiResult("");
    try {
      const res = await fetch("/api/daliuren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiResult(data.result || data.text || data.message || "解读完成");
    } catch (err: unknown) {
      setAiResult(err instanceof Error ? `解读失败: ${err.message}` : "解读失败，请稍后重试");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span><small>Truthful Hexagram</small></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a className="active" href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a></nav>
        <a className="profile-pill" href="/activate">激活密钥 / 我的权限</a>
      </header>

      <main className="main-flow">
        {/* ── 标题区 ── */}
        <section className="ziwei-hero">
          <h1>大六壬</h1>
          <p>天地盘 · 四课三传 · 十二天将 · 神机妙算</p>
        </section>

        {/* ── 排盘表单 ── */}
        <form className="ziwei-form" onSubmit={handleSubmit}>
          <div className="ziwei-form-row">
            <label><span>出生日期（公历）</span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></label>
            <label><span>出生时辰</span><select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>{TIME_OPTIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></label>
            <label><span>时区</span><input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Shanghai" /></label>
            <button type="submit" className="ziwei-submit" disabled={loading}>{loading ? "排盘中…" : "开始排盘"}</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="field-label">占事（可选）</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="心中所疑…" rows={2}
              style={{ width: "100%", border: "1px solid var(--ink-faint)", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "var(--surface-strong)", color: "var(--ink)", resize: "vertical", marginTop: 4 }} />
          </div>
          {error && <p className="ziwei-error">{error}</p>}
        </form>

        {/* ── 结果区 ── */}
        {result && (
          <section style={{ marginTop: 28 }}>
            {/* 快速信息横幅 */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "12px 24px",
              padding: "14px 20px", border: "1px solid var(--ink-faint)",
              borderRadius: 12, background: "var(--surface-strong)",
              fontSize: 14, color: "var(--ink)", marginBottom: 18,
            }}>
              {result.dateInfo && (
                <>
                  <span>📅 {result.dateInfo.solarDate}</span>
                  {result.dateInfo.lunarDate && <span>🌙 {result.dateInfo.lunarDate}</span>}
                  {result.dateInfo.yueJiang && (
                    <span>🌕 月将：{result.dateInfo.yueJiangName || result.dateInfo.yueJiang}</span>
                  )}
                  {result.dateInfo.diurnal !== undefined && (
                    <span>{result.dateInfo.diurnal ? "☀️ 昼占" : "🌙 夜占"}</span>
                  )}
                  {result.keName && <span style={{ fontWeight: 600 }}>课名：{result.keName}</span>}
                </>
              )}
            </div>

            {/* 四柱 */}
            {result.dateInfo?.ganZhi && (
              <ResultSection title="四柱">
                <div style={pillRowStyle}>
                  {[
                    ["年", result.dateInfo.ganZhi.year],
                    ["月", result.dateInfo.ganZhi.month],
                    ["日", result.dateInfo.ganZhi.day],
                    ["时", result.dateInfo.ganZhi.hour],
                  ].map(([label, gz]) => (
                    <span key={label as string} style={ganZhiPillStyle}>
                      <small style={{ color: "var(--ink-soft)", fontSize: 11 }}>{label as string}</small>
                      <strong style={{ fontSize: 20, letterSpacing: "0.06em" }}>{gz as string}</strong>
                    </span>
                  ))}
                </div>
                {result.dateInfo.kongWang && (
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-soft)" }}>
                    旬空：{result.dateInfo.kongWang[0]} {result.dateInfo.kongWang[1]}
                    {result.dateInfo.yiMa && <>　驿马：{result.dateInfo.yiMa}</>}
                    {result.dateInfo.dingMa && <>　丁马：{result.dateInfo.dingMa}</>}
                    {result.dateInfo.tianMa && <>　天马：{result.dateInfo.tianMa}</>}
                  </p>
                )}
              </ResultSection>
            )}

            {/* 本命 / 行年 */}
            {(result.benMing || result.xingNian) && (
              <ResultSection title="命年">
                <div style={pillRowStyle}>
                  {result.benMing && (
                    <span style={ganZhiPillStyle}>
                      <small style={{ color: "var(--ink-soft)", fontSize: 11 }}>本命</small>
                      <strong style={{ fontSize: 18 }}>{result.benMing}</strong>
                    </span>
                  )}
                  {result.xingNian && (
                    <span style={ganZhiPillStyle}>
                      <small style={{ color: "var(--ink-soft)", fontSize: 11 }}>行年</small>
                      <strong style={{ fontSize: 18 }}>{result.xingNian}</strong>
                    </span>
                  )}
                </div>
              </ResultSection>
            )}

            {/* 标签页切换 */}
            <div className="daliuren-tab-bar" style={{ marginTop: 20 }}>
              {([
                ["tianDiPan", "天地盘"],
                ["siKe", "四课"],
                ["sanChuan", "三传"],
                ["shenSha", "神煞"],
                ["keTi", "课体"],
                ["dunGan", "遁干"],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`daliuren-tab${activeTab === key ? " active" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* 天地盘 */}
            {activeTab === "tianDiPan" && result.tianDiPan && (
              <TianDiPanView tianDiPan={result.tianDiPan} gongInfos={result.gongInfos} />
            )}

            {/* 四课 */}
            {activeTab === "siKe" && result.siKe && (
              <SiKeView siKe={result.siKe} />
            )}

            {/* 三传 */}
            {activeTab === "sanChuan" && result.sanChuan && (
              <SanChuanView sanChuan={result.sanChuan} />
            )}

            {/* 神煞 */}
            {activeTab === "shenSha" && result.shenSha && (
              <ShenShaView shenSha={result.shenSha} />
            )}

            {/* 课体 */}
            {activeTab === "keTi" && result.keTi && (
              <KeTiView keTi={result.keTi} keName={result.keName} />
            )}

            {/* 遁干 */}
            {activeTab === "dunGan" && result.dunGan && (
              <DunGanView dunGan={result.dunGan} />
            )}

            {/* AI 解读 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0 10px" }}>
              <button onClick={handleAiReading} disabled={aiLoading} style={{
                padding: "12px 40px", border: "none", borderRadius: 12,
                background: "var(--gold)",
                color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: "0.04em",
                cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1,
                boxShadow: "0 2px 12px rgba(212,65,21,0.25)", transition: "all 0.2s",
              }}>
                {aiLoading ? "解读中…" : "🤖 AI 解读"}
              </button>
              {aiResult && (
                <div style={{
                  width: "100%", border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 14, overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 18px", background: "var(--gold)",
                    color: "#fff", fontSize: 15, fontWeight: 600, letterSpacing: "0.04em",
                  }}>
                    AI 解读
                  </div>
                  <div style={{
                    padding: "18px 20px", fontSize: 14, color: "var(--ink)",
                    lineHeight: 1.9, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto",
                  }}>
                    {aiResult}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer style={{
        textAlign: "center", padding: "32px 24px", color: "var(--ink-soft)",
        fontSize: 12, borderTop: "1px solid var(--ink-faint)", marginTop: 40,
      }}>
        观真 · 大六壬
      </footer>
    </div>
  );
}

// ─── 子组件 ───

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{
        margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "var(--ink)",
        borderLeft: "3px solid var(--gold)", paddingLeft: 10,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── 天地盘 ───

function TianDiPanView({
  tianDiPan,
  gongInfos,
}: {
  tianDiPan: NonNullable<DaliurenOutput["tianDiPan"]>;
  gongInfos?: DaliurenOutput["gongInfos"];
}) {
  const diZhiOrder = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const rows = [3, 3, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3];
  const cols = [2, 1, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3];

  const gridSize = 4;
  const cellW = 84;
  const cellH = 78;
  const gap = 6;

  const gongMap = new Map<string, NonNullable<DaliurenOutput["gongInfos"]>[number]>();
  if (gongInfos) {
    for (const g of gongInfos) gongMap.set(g.diZhi, g);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${cellW}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${cellH}px)`,
        gap, justifyContent: "center",
      }}>
        {diZhiOrder.map((diZhi, i) => {
          const row = rows[i];
          const col = cols[i];
          const tianZhi = tianDiPan.tianPan[diZhi] || diZhi;
          const tianJiang = tianDiPan.tianJiang[diZhi] || "";
          const gong = gongMap.get(diZhi);
          return (
            <div key={diZhi} style={{
              gridRow: row + 1, gridColumn: col + 1,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 2,
              border: "1px solid rgba(51,51,51,0.12)", borderRadius: 10,
              background: "var(--surface-strong)", padding: 4,
            }}>
              {gong?.dunGan && (
                <span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 500 }}>
                  {gong.dunGan}
                </span>
              )}
              <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>
                {tianZhi}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em" }}>
                {diZhi}
              </span>
              {tianJiang && (
                <span style={{ fontSize: 9, color: "var(--gold)", fontWeight: 500 }}>
                  {tianJiang}
                </span>
              )}
              {gong?.wuXing && (
                <span style={{ fontSize: 9, color: "var(--ink-soft)" }}>
                  {gong.wuXing}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 四课 ───

function SiKeView({ siKe }: { siKe: NonNullable<DaliurenOutput["siKe"]> }) {
  const courses = [
    { label: "一课", data: siKe.yiKe },
    { label: "二课", data: siKe.erKe },
    { label: "三课", data: siKe.sanKe },
    { label: "四课", data: siKe.siKe },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, margin: "0 auto" }}>
      {courses.map(({ label, data }) => (
        <div key={label} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "10px 16px",
          border: "1px solid rgba(51,51,51,0.08)", borderRadius: 10,
          background: "var(--surface-strong)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", minWidth: 36 }}>
            {label}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink)" }}>
            {data?.[0] || "—"}
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {data?.[1] || ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 三传 ───

function SanChuanView({ sanChuan }: { sanChuan: NonNullable<DaliurenOutput["sanChuan"]> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, margin: "0 auto" }}>
      {sanChuan.method && (
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>
          取传方法：{sanChuan.method}
        </p>
      )}
      {[
        { label: "初传", data: sanChuan.chu },
        { label: "中传", data: sanChuan.zhong },
        { label: "末传", data: sanChuan.mo },
      ].map(({ label, data }) => (
        <div key={label} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          border: "1px solid rgba(51,51,51,0.08)", borderRadius: 10,
          background: "var(--surface-strong)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", minWidth: 42 }}>
            {label}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink)" }}>
            {data?.[0] || "—"}
          </span>
          {data?.[1] && (
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{data[1]}</span>
          )}
          {data?.[2] && (
            <span style={{ fontSize: 12, color: "var(--blue)" }}>{data[2]}</span>
          )}
          {data?.[3] && (
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{data[3]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 神煞 ───

function ShenShaView({ shenSha }: { shenSha: NonNullable<DaliurenOutput["shenSha"]> }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8,
    }}>
      {shenSha.map((ss, i) => (
        <div key={i} style={{
          padding: "8px 12px", border: "1px solid rgba(51,51,51,0.07)",
          borderRadius: 8, background: "var(--surface-strong)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            {ss.name}
          </span>
          <span style={{ fontSize: 13, color: "var(--gold)" }}>
            {ss.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 课体 ───

function KeTiView({ keTi, keName }: { keTi: NonNullable<DaliurenOutput["keTi"]>; keName?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {keName && (
        <div style={{
          textAlign: "center", padding: "16px",
          border: "1px solid rgba(212,65,21,0.15)", borderRadius: 10,
          background: "var(--gold-soft)",
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" }}>
            {keName}
          </span>
        </div>
      )}
      {keTi.method && <InfoRow label="取传法" value={keTi.method} />}
      {keTi.subTypes && keTi.subTypes.length > 0 && (
        <InfoRow label="细分课体" value={keTi.subTypes.join(" · ")} />
      )}
      {keTi.extraTypes && keTi.extraTypes.length > 0 && (
        <InfoRow label="附课" value={keTi.extraTypes.join(" · ")} />
      )}
    </div>
  );
}

// ─── 遁干 ───

function DunGanView({ dunGan }: { dunGan: NonNullable<DaliurenOutput["dunGan"]> }) {
  const diZhiOrder = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6,
    }}>
      {diZhiOrder.map(dz => (
        <div key={dz} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 14px", border: "1px solid rgba(51,51,51,0.07)",
          borderRadius: 8, background: "var(--surface-strong)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{dz}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--blue)" }}>
            {dunGan[dz] || "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", gap: 14, padding: "10px 14px",
      border: "1px solid rgba(51,51,51,0.06)", borderRadius: 8,
      background: "var(--surface-strong)",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", minWidth: 72 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

// ─── 内联样式对象 ───

const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  fontSize: 12, color: "var(--ink-soft)",
};

const inputStyle: React.CSSProperties = {
  minHeight: 42, border: "1px solid rgba(51,51,51,0.16)",
  borderRadius: 10, background: "var(--surface-strong)", color: "var(--ink)",
  padding: "0 12px", fontSize: 16, outline: "none", textAlign: "center" as const,
};

const pillRowStyle: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: 12,
};

const ganZhiPillStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  padding: "10px 20px", border: "1px solid rgba(51,51,51,0.1)",
  borderRadius: 10, background: "var(--surface-strong)", minWidth: 72,
};
