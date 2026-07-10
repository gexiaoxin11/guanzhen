"use client";

import { runAlmanac, type AlmanacInput, type AlmanacOutput } from "../../src/lib/taibu";
import { useState, useEffect } from "react";
import "../../src/styles.css";

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

export default function AlmanacPage() {
  const today = new Date();
  const [dateStr, setDateStr] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );
  const [result, setResult] = useState<AlmanacOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleQuery() {
    setLoading(true);
    setError("");
    try {
      const input: AlmanacInput = { date: dateStr };
      const output = await runAlmanac(input);
      setResult(output);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "查询失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // 初始加载
  useEffect(() => { handleQuery(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const a = result?.almanac;
  const d = result?.dayInfo;

  // 解析农历日期显示
  const lunarDateDisplay = a?.lunarDate || "";
  const lunarMonthDisplay = a?.lunarMonth || "";
  const lunarDayDisplay = a?.lunarDay || "";
  const zodiac = a?.zodiac || "";
  const nayin = a?.nayin || "";

  // 干支着色
  function ganZhiColor(text: string): React.CSSProperties {
    if (!text) return {};
    const ganColors: Record<string, string> = {
      "甲": "#2d8a4e", "乙": "#3da061", "丙": "#d44115", "丁": "#e05530",
      "戊": "#c48b1d", "己": "#d4a03c", "庚": "#c0c0c0", "辛": "#d4d4d4",
      "壬": "#2383e2", "癸": "#3d9ef5",
    };
    const zhiColors: Record<string, string> = {
      "子": "#2383e2", "丑": "#c48b1d", "寅": "#2d8a4e", "卯": "#3da061",
      "辰": "#c48b1d", "巳": "#d44115", "午": "#d44115", "未": "#c48b1d",
      "申": "#c0c0c0", "酉": "#d4d4d4", "戌": "#c48b1d", "亥": "#2383e2",
    };
    return { color: ganColors[text] || zhiColors[text] || "inherit" };
  }

  // 时辰吉凶标签颜色
  function hourLuckColor(luck: string): string {
    if (luck === "吉") return "var(--green)";
    if (luck === "凶") return "var(--red)";
    return "var(--ink-soft)";
  }

  // 时辰地支对应的现代时间
  function hourRange(index: number): string {
    const ranges = [
      "23:00-01:00", "01:00-03:00", "03:00-05:00", "05:00-07:00",
      "07:00-09:00", "09:00-11:00", "11:00-13:00", "13:00-15:00",
      "15:00-17:00", "17:00-19:00", "19:00-21:00", "21:00-23:00",
    ];
    return ranges[index] || "";
  }

  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 星期${WEEKDAY_NAMES[today.getDay()]}`;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span></a>
        <nav className="desktop-nav">
          <a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a>
          <a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a>
          <a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a>
          <a className="active" href="/almanac">黄历</a>
          <a href="/xiaoliuren">小六壬</a>
        </nav>
      </header>

      <div className="main-flow" style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px 64px" }}>
        {/* 标题区 */}
        <div style={{ textAlign: "center", padding: "32px 0 20px" }}>
          <h1 style={{
            margin: 0,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "var(--gold)",
            textShadow: "0 6px 24px rgba(212,65,21,0.2)",
          }}>黄 历</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>择日而行事，顺天而应时</p>
        </div>

        {/* 日期选择器 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "18px 20px",
          marginBottom: 24,
          borderRadius: 14,
          background: "var(--surface-strong)",
          border: "1px solid rgba(51,51,51,0.08)",
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>选择日期</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            style={{
              border: "1px solid rgba(51,51,51,0.14)",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 15,
              background: "#fff",
              color: "var(--ink)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleQuery}
            disabled={loading}
            style={{
              padding: "9px 24px",
              borderRadius: 10,
              border: "none",
              background: loading ? "var(--gold-soft)" : "var(--gold)",
              color: loading ? "var(--gold-dark)" : "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.03em",
            }}
          >
            {loading ? "查询中…" : "查 询"}
          </button>
        </div>

        {/* 错误 */}
        {error && (
          <div style={{
            padding: "14px 20px",
            marginBottom: 20,
            borderRadius: 12,
            background: "rgba(212,65,21,0.06)",
            color: "var(--red)",
            fontSize: 14,
            textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {/* 结果区域 */}
        {a && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ===== 1. 农历日期卡片 ===== */}
            <Card style={{ textAlign: "center", padding: "28px 24px" }}>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>
                {dateStr} 星期{WEEKDAY_NAMES[new Date(dateStr).getDay()]}
                {a.solarTerm ? ` · ${a.solarTerm}` : ""}
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.06em", margin: "8px 0" }}>
                {lunarDateDisplay}
              </div>
              {d && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  marginTop: 12,
                  fontSize: 18,
                  fontWeight: 600,
                }}>
                  <span style={ganZhiColor(d.ganZhi[0])}>{d.ganZhi[0]}</span>
                  <span style={ganZhiColor(d.ganZhi[1])}>{d.ganZhi[1]}</span>
                  <span style={{ fontSize: 44, color: "var(--ink-soft)", fontWeight: 300 }}>·</span>
                  <span style={{ color: "var(--gold)", fontSize: 24 }}>{zodiac}</span>
                  <span style={{ fontSize: 44, color: "var(--ink-soft)", fontWeight: 300 }}>·</span>
                  <span style={{ fontSize: 15, color: "var(--ink-soft)", fontWeight: 500 }}>
                    纳音 {nayin}
                  </span>
                </div>
              )}
              {a.dayOfficer && (
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-soft)" }}>
                  建除十二神：{a.dayOfficer}
                </div>
              )}
            </Card>

            {/* ===== 2. 宜 · 忌 ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card>
                <h3 style={sectionTitle("var(--green)")}>宜</h3>
                <div style={badgeContainer}>
                  {a.suitable && a.suitable.length > 0 ? a.suitable.map((item: string, i: number) => (
                    <span key={i} style={yiBadge}>{item}</span>
                  )) : (
                    <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>诸事不宜</span>
                  )}
                </div>
              </Card>

              <Card>
                <h3 style={sectionTitle("var(--red)")}>忌</h3>
                <div style={badgeContainer}>
                  {a.avoid && a.avoid.length > 0 ? a.avoid.map((item: string, i: number) => (
                    <span key={i} style={jiBadge}>{item}</span>
                  )) : (
                    <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>百无禁忌</span>
                  )}
                </div>
              </Card>
            </div>

            {/* ===== 3. 吉神 · 凶煞 ===== */}
            <Card>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <h3 style={sectionTitle("var(--green)")}>吉神</h3>
                  <div style={badgeContainer}>
                    {a.jishen && a.jishen.length > 0 ? a.jishen.map((s: string, i: number) => (
                      <span key={i} style={godBadge("var(--green)")}>{s}</span>
                    )) : (
                      <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>无</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 style={sectionTitle("var(--red)")}>凶煞</h3>
                  <div style={badgeContainer}>
                    {a.xiongsha && a.xiongsha.length > 0 ? a.xiongsha.map((s: string, i: number) => (
                      <span key={i} style={godBadge("var(--red)")}>{s}</span>
                    )) : (
                      <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>无</span>
                    )}
                  </div>
                </div>
              </div>
              {a.tianShen && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(51,51,51,0.06)" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    天神：{a.tianShen}（{a.tianShenType}）
                    <span style={{
                      marginLeft: 8,
                      color: a.tianShenLuck === "吉" ? "var(--green)" : a.tianShenLuck === "凶" ? "var(--red)" : "var(--ink-soft)",
                      fontWeight: 600,
                    }}>{a.tianShenLuck}</span>
                  </span>
                </div>
              )}
            </Card>

            {/* ===== 4. 冲煞 · 胎神 · 神位 ===== */}
            <Card>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <InfoRow label="冲煞" value={a.chongSha || "—"} />
                <InfoRow label="胎神" value={a.taiShen || "—"} />
                {a.directions && (
                  <>
                    <InfoRow label="财神" value={a.directions.caiShen || "—"} />
                    <InfoRow label="喜神" value={a.directions.xiShen || "—"} />
                    <InfoRow label="福神" value={a.directions.fuShen || "—"} />
                    <InfoRow label="阳贵" value={a.directions.yangGui || "—"} />
                    <InfoRow label="阴贵" value={a.directions.yinGui || "—"} />
                  </>
                )}
              </div>
            </Card>

            {/* ===== 5. 时辰吉凶表 ===== */}
            {a.hourlyFortune && a.hourlyFortune.length > 0 && (
              <Card>
                <h3 style={sectionTitle("var(--gold)")}>时辰吉凶</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={hourTableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>时辰</th>
                        <th style={thStyle}>时间</th>
                        <th style={thStyle}>干支</th>
                        <th style={thStyle}>天神</th>
                        <th style={thStyle}>吉凶</th>
                        <th style={thStyle}>冲</th>
                        <th style={thStyle}>煞</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.hourlyFortune.map((h: any, i: number) => (
                        <tr key={i}>
                          <td style={tdStyle}>{["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"][i]}时</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{hourRange(i)}</td>
                          <td style={tdStyle}>
                            {h.ganZhi ? (
                              <span>
                                <span style={ganZhiColor(h.ganZhi[0])}>{h.ganZhi[0]}</span>
                                <span style={ganZhiColor(h.ganZhi[1])}>{h.ganZhi[1]}</span>
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{h.tianShen || "—"}</td>
                          <td style={tdStyle}>
                            <span style={{
                              display: "inline-block",
                              padding: "2px 10px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#fff",
                              background: h.tianShenLuck === "吉" ? "var(--green)" : h.tianShenLuck === "凶" ? "var(--red)" : "var(--ink-soft)",
                            }}>
                              {h.tianShenLuck || "—"}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{h.chong || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{h.sha || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ===== 6. 彭祖百忌 ===== */}
            {a.pengZuBaiJi && (
              <Card>
                <h3 style={sectionTitle("var(--gold)")}>彭祖百忌</h3>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  color: "var(--ink)",
                  lineHeight: 1.8,
                  letterSpacing: "0.03em",
                }}>
                  {a.pengZuBaiJi}
                </p>
              </Card>
            )}

            {/* ===== 7. 二十八宿 ===== */}
            {a.lunarMansion && (
              <Card>
                <h3 style={sectionTitle("var(--gold)")}>二十八宿</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{a.lunarMansion}</span>
                  <span style={{
                    padding: "3px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    background: a.lunarMansionLuck === "吉" ? "var(--green)" : "var(--red)",
                  }}>
                    {a.lunarMansionLuck}
                  </span>
                </div>
                {a.lunarMansionSong && (
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.6 }}>
                    {a.lunarMansionSong}
                  </p>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========= Component Styles ========= */

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: "18px 20px",
      borderRadius: 14,
      background: "var(--surface-strong)",
      border: "1px solid rgba(51,51,51,0.08)",
      boxShadow: "0 2px 12px rgba(51,51,51,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 14 }}>
      <span style={{ fontWeight: 600, color: "var(--ink-soft)", minWidth: 50, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

function sectionTitle(color: string): React.CSSProperties {
  return {
    margin: "0 0 12px",
    fontSize: 16,
    fontWeight: 700,
    color,
    letterSpacing: "0.04em",
  };
}

const badgeContainer: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const yiBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  background: "rgba(41,135,71,0.1)",
  color: "var(--green)",
};

const jiBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  background: "rgba(212,65,21,0.08)",
  color: "var(--red)",
};

function godBadge(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    background: color === "var(--green)" ? "rgba(41,135,71,0.1)" : "rgba(212,65,21,0.08)",
    color,
  };
}

const hourTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "center",
  fontWeight: 600,
  color: "var(--ink-soft)",
  fontSize: 13,
  borderBottom: "2px solid rgba(51,51,51,0.1)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "center",
  borderBottom: "1px solid rgba(51,51,51,0.06)",
  color: "var(--ink)",
  whiteSpace: "nowrap",
};
