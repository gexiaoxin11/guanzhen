"use client";

import { runMeihua, type MeihuaInput, type MeihuaOutput } from "../../src/lib/taibu";
import { useState } from "react";
import "../../src/styles.css";
import { TIME_OPTIONS } from "../ziwei-time";

export default function MeihuaPage() {
  const [question, setQuestion] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeIndex, setTimeIndex] = useState(0);
  const [method, setMethod] = useState<MeihuaInput["method"]>("time");
  const [num1, setNum1] = useState("");
  const [num2, setNum2] = useState("");
  const [num3, setNum3] = useState("");
  const [hexagramName, setHexagramName] = useState("");
  const [movingLine, setMovingLine] = useState("");
  const [result, setResult] = useState<MeihuaOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiError, setAiError] = useState("");

  const hexagramNames = [
    "乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比",
    "风天小畜", "天泽履", "地天泰", "天地否", "天火同人", "火天大有", "地山谦", "雷地豫",
    "泽雷随", "山风蛊", "地泽临", "风地观", "火雷噬嗑", "山火贲", "山地剥", "地雷复",
    "天雷无妄", "山天大畜", "山雷颐", "泽风大过", "坎为水", "离为火", "泽山咸", "雷风恒",
    "天山遁", "雷天大壮", "火地晋", "地火明夷", "风火家人", "火泽睽", "水山蹇", "雷水解",
    "山泽损", "风雷益", "泽天夬", "天风姤", "泽地萃", "地风升", "泽水困", "水风井",
    "泽火革", "火风鼎", "震为雷", "艮为山", "风山渐", "雷泽归妹", "雷火丰", "火山旅",
    "巽为风", "兑为泽", "风水涣", "水泽节", "风泽中孚", "雷山小过", "水火既济", "火水未济",
  ];

  function buildInput(): MeihuaInput {
    const base: MeihuaInput = { question: question.trim() || "问事", date };
    if (method === "time") return { ...base, method: "time" };
    if (method === "number_pair") return { ...base, method: "number_pair", numbers: [parseInt(num1) || 1, parseInt(num2) || 1] };
    if (method === "number_triplet") return { ...base, method: "number_triplet", numbers: [parseInt(num1) || 1, parseInt(num2) || 1, parseInt(num3) || 1] };
    if (method === "select") return { ...base, method: "select", hexagramName: hexagramName || hexagramNames[0], movingLine: parseInt(movingLine) || 1 };
    return base;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAiText("");
    setAiError("");
    try {
      const input = buildInput();
      const output = runMeihua(input);
      setResult(output);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "起卦失败";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAIInterpret() {
    if (!result) return;
    setAiLoading(true);
    setAiError("");
    setAiText("");
    try {
      const res = await fetch("/api/meihua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() || "问事", data: result, depth: "detailed", persona: "hermit" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "请求失败");
      setAiText(json.text || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "AI 解读失败";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  }

  function judgementColor(outcome: string) {
    if (outcome === "吉") return "var(--green)";
    if (outcome === "凶") return "var(--red)";
    return "var(--blue)";
  }

  function bodyUseColor(relation: string) {
    if (relation === "比和" || relation === "用生体") return "var(--green)";
    if (relation === "体克用" || relation === "体生用") return "var(--blue)";
    return "var(--red)";
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span><small>Truthful Hexagram</small></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a className="active" href="/meihua">梅花易数</a></nav>
        <a className="profile-pill" href="/activate">激活密钥 / 我的权限</a>
      </header>

      <div className="main-flow">
        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{
          background: "var(--surface)",
          border: "1px solid rgba(51,51,51,0.08)",
          borderRadius: 16,
          padding: "28px 24px",
          marginBottom: 28,
          boxShadow: "var(--shadow)",
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, letterSpacing: "0.04em", color: "var(--gold)" }}>梅花易数</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>所问何事</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="心中所疑，尽可在此诉说…"
              rows={3}
              style={{
                width: "100%",
                border: "1px solid rgba(51,51,51,0.14)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 15,
                background: "var(--surface-strong)",
                color: "var(--ink)",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid rgba(51,51,51,0.14)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 15,
                background: "var(--surface-strong)",
                color: "var(--ink)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>起卦方式</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as MeihuaInput["method"])}
              style={{
                width: "100%",
                border: "1px solid rgba(51,51,51,0.14)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 15,
                background: "var(--surface-strong)",
                color: "var(--ink)",
                outline: "none",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="time">时间起卦</option>
              <option value="number_pair">数字起卦（两数）</option>
              <option value="number_triplet">数字起卦（三数）</option>
              <option value="select">选卦</option>
            </select>
          </div>

          {method === "number_pair" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>上卦数</label>
                <input type="number" min={1} value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="1-999" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>下卦数</label>
                <input type="number" min={1} value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="1-999" style={inputStyle} />
              </div>
            </div>
          )}

          {method === "number_triplet" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>上卦数</label>
                <input type="number" min={1} value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="1-999" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>下卦数</label>
                <input type="number" min={1} value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="1-999" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>动爻数</label>
                <input type="number" min={1} value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="1-999" style={inputStyle} />
              </div>
            </div>
          )}

          {method === "select" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>卦名</label>
                <select value={hexagramName} onChange={(e) => setHexagramName(e.target.value)} style={inputStyle as React.CSSProperties}>
                  {hexagramNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--ink-soft)" }}>动爻（1-6）</label>
                <input type="number" min={1} max={6} value={movingLine} onChange={(e) => setMovingLine(e.target.value)} placeholder="1-6" style={inputStyle} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%",
            padding: "14px 0",
            border: "none",
            borderRadius: 12,
            background: loading ? "var(--ink-faint)" : "var(--gold)",
            color: "#fff",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}>
            {loading ? "起卦中…" : "起  卦"}
          </button>
        </form>

        {/* 结果 */}
        {result && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid rgba(51,51,51,0.08)",
            borderRadius: 16,
            padding: "28px 24px",
            marginBottom: 28,
            boxShadow: "var(--shadow)",
          }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>起卦结果</h2>
            {result.question && (
              <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--ink-soft)" }}>问：{result.question}</p>
            )}

            {/* 干支时间 */}
            {result.ganZhiTime && (
              <div style={{ ...badgeRow, marginBottom: 18 }}>
                <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>干支历：</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{result.ganZhiTime}</span>
              </div>
            )}

            {/* 吉凶判断 */}
            {result.judgement && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                marginBottom: 20,
                borderRadius: 12,
                background: `${judgementColor(result.judgement.outcome)}12`,
                border: `1px solid ${judgementColor(result.judgement.outcome)}33`,
              }}>
                <span style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: judgementColor(result.judgement.outcome),
                }}>{result.judgement.outcome}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{result.judgement.summary}</div>
                  {result.judgement.basis && (
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{result.judgement.basis}</div>
                  )}
                </div>
              </div>
            )}

            {/* 三卦卡片 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
              {result.mainHexagram && (
                <HexagramCard title="本卦" hex={result.mainHexagram as { name?: string; code?: string; upperTrigram?: string; lowerTrigram?: string; element?: string; guaCi?: string; xiangCi?: string }} movingLine={result.movingLine as number | undefined} />
              )}
              {result.nuclearHexagram && (
                <HexagramCard title="互卦" hex={result.nuclearHexagram as { name?: string; code?: string; upperTrigram?: string; lowerTrigram?: string; element?: string; guaCi?: string; xiangCi?: string }} />
              )}
              {result.changedHexagram && (
                <HexagramCard title="变卦" hex={result.changedHexagram as { name?: string; code?: string; upperTrigram?: string; lowerTrigram?: string; element?: string; guaCi?: string; xiangCi?: string }} />
              )}
            </div>

            {/* 体用生克 */}
            {(result.bodyTrigram || result.useTrigram) && (
              <div style={{
                padding: "16px 18px",
                marginBottom: 20,
                borderRadius: 12,
                background: "rgba(51,51,51,0.02)",
                border: "1px solid rgba(51,51,51,0.06)",
              }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>体用生克</h3>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {result.bodyTrigram && (
                    <div>
                      <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>体卦 </span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{result.bodyTrigram}</span>
                    </div>
                  )}
                  {result.useTrigram && (
                    <div>
                      <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>用卦 </span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{result.useTrigram}</span>
                    </div>
                  )}
                  {result.bodyUseRelation && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>关系</span>
                      <span style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: bodyUseColor(result.bodyUseRelation.relation),
                      }}>{result.bodyUseRelation.relation}</span>
                      {result.bodyUseRelation.summary && (
                        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>— {result.bodyUseRelation.summary}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 错卦综卦 */}
            {(result.oppositeHexagram || result.reversedHexagram) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {result.oppositeHexagram && (
                  <HexagramCard title="错卦" hex={result.oppositeHexagram as { name?: string; code?: string; upperTrigram?: string; lowerTrigram?: string; element?: string; guaCi?: string; xiangCi?: string }} />
                )}
                {result.reversedHexagram && (
                  <HexagramCard title="综卦" hex={result.reversedHexagram as { name?: string; code?: string; upperTrigram?: string; lowerTrigram?: string; element?: string; guaCi?: string; xiangCi?: string }} />
                )}
              </div>
            )}

            {/* 月令旺衰 */}
            {result.seasonalState && (
              <InfoBlock title="月令旺衰">{result.seasonalState}</InfoBlock>
            )}

            {/* 互卦体用 */}
            {result.interactionReadings && result.interactionReadings.length > 0 && (
              <InfoBlock title="互卦体用">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.interactionReadings.map((r, i) => (
                    <div key={i} style={{ fontSize: 14, color: "var(--ink)" }}>{r}</div>
                  ))}
                </div>
              </InfoBlock>
            )}

            {/* 应期线索 */}
            {result.timingHints && result.timingHints.length > 0 && (
              <InfoBlock title="应期线索">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.timingHints.map((t, i) => (
                    <span key={i} style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: "var(--gold-soft)",
                      color: "var(--gold-dark)",
                      fontSize: 13,
                      fontWeight: 500,
                    }}>{t}</span>
                  ))}
                </div>
              </InfoBlock>
            )}

            {/* 警语 */}
            {result.warnings && result.warnings.length > 0 && (
              <InfoBlock title="警语">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {result.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--red)" }}>⚠ {w}</div>
                  ))}
                </div>
              </InfoBlock>
            )}

            {/* AI 解读 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 16 }}>
              <button
                onClick={handleAIInterpret}
                disabled={aiLoading}
                style={{
                  padding: "12px 40px",
                  border: "none",
                  borderRadius: 12,
                  background: aiLoading ? "var(--ink-faint)" : "var(--gold)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: aiLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 12px rgba(212,65,21,0.25)",
                }}
              >
                {aiLoading ? "解读中…" : "AI 解读"}
              </button>

              {aiError && (
                <div style={{ color: "var(--red)", fontSize: 14, padding: "8px 16px", borderRadius: 8, background: "rgba(212,65,21,0.06)" }}>
                  {aiError}
                </div>
              )}

              {aiText && (
                <div style={{
                  width: "100%",
                  border: "1px solid rgba(51,51,51,0.08)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 18px",
                    background: "var(--gold)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}>AI 解读</div>
                  <div style={{
                    padding: "18px 20px",
                    fontSize: 14,
                    color: "var(--ink)",
                    lineHeight: 1.9,
                    whiteSpace: "pre-wrap",
                  }}>{aiText}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(51,51,51,0.14)",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 15,
  background: "var(--surface-strong)",
  color: "var(--ink)",
  outline: "none",
  fontFamily: "inherit",
};

const badgeRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 10,
  background: "rgba(51,51,51,0.03)",
};

function HexagramCard({ title, hex, movingLine }: { title: string; hex: { name?: string; code?: string; upperTrigram?: string; lowerTrigram?: string; element?: string; guaCi?: string; xiangCi?: string }; movingLine?: number }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: 12,
      border: "1px solid rgba(51,51,51,0.08)",
      background: "var(--surface-strong)",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 8, letterSpacing: "0.04em" }}>{title}</div>
      {hex.name && <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{hex.name}</div>}
      {hex.code && <div style={{ fontSize: 26, fontFamily: "monospace", marginBottom: 8, color: "var(--ink)", letterSpacing: 2 }}>{hex.code}</div>}
      {hex.element && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 2 }}>五行：{hex.element}</div>}
      {hex.upperTrigram && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 2 }}>上卦：{hex.upperTrigram}</div>}
      {hex.lowerTrigram && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>下卦：{hex.lowerTrigram}</div>}
      {typeof movingLine === "number" && (
        <div style={{ fontSize: 12, color: "var(--gold-dark)", marginBottom: 8, fontWeight: 600 }}>动爻：第{movingLine}爻</div>
      )}
      {hex.guaCi && <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.6 }}>卦辞：{hex.guaCi}</div>}
      {hex.xiangCi && <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.6, marginTop: 4 }}>象辞：{hex.xiangCi}</div>}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 18px",
      marginBottom: 16,
      borderRadius: 12,
      background: "rgba(51,51,51,0.02)",
      border: "1px solid rgba(51,51,51,0.06)",
    }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
  );
}
