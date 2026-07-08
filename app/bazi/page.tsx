"use client";

import { useState } from "react";
import { runBazi, runBaziShenSha, runBaziDayun, type BaziInput, type BaziOutput, type BaziShenShaOutput, type DayunOutput } from "../../src/lib/taibu";

import "../../src/styles.css";
import { TIME_OPTIONS, HOUR_STARTS } from "../ziwei-time";

type CalendarType = "solar" | "lunar";
type Gender = "male" | "female";

const FIVE_ELEMENTS: Record<string, string> = {
  "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土",
  "庚": "金", "辛": "金", "壬": "水", "癸": "水",
  "寅": "木", "卯": "木", "巳": "火", "午": "火",
  "申": "金", "酉": "金", "亥": "水", "子": "水",
  "辰": "土", "戌": "土", "丑": "土", "未": "土",
};

const ELEMENT_COLORS: Record<string, string> = { 金: "#D4A017", 木: "#298747", 水: "#317994", 火: "#D44115", 土: "#B8860B" };
const ELEMENT_ORDER = ["金", "木", "水", "火", "土"];


function computeFiveElements(output: BaziOutput): Record<string, number> {
  const stats: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  const pillars = output.fourPillars;
  for (const key of ["year", "month", "day", "hour"] as const) {
    const p = pillars[key];
    const sEl = FIVE_ELEMENTS[p.stem];
    const bEl = FIVE_ELEMENTS[p.branch];
    if (sEl) stats[sEl]++;
    if (bEl) stats[bEl]++;
    for (const h of p.hiddenStems) {
      const hEl = FIVE_ELEMENTS[h.stem];
      if (hEl) stats[hEl]++;
    }
  }
  return stats;
}

export default function BaziPage() {
  const [birthDate, setBirthDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeIndex, setTimeIndex] = useState(0);
  const [gender, setGender] = useState<Gender>("male");
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  const [baziResult, setBaziResult] = useState<BaziOutput | null>(null);
  const [shenShaResult, setShenShaResult] = useState<BaziShenShaOutput | null>(null);
  const [dayunResult, setDayunResult] = useState<DayunOutput | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setAiResult("");
    setAiError("");
    setLoading(true);

    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      const h = HOUR_STARTS[timeIndex] ?? 12;
      const input: BaziInput = {
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthHour: h,
        birthMinute: 0,
        gender,
        calendarType,
        isLeapMonth: calendarType === "lunar" ? isLeapMonth : undefined,
      };

      const result = runBazi(input);
      const shenSha = runBaziShenSha(input);
      setBaziResult(result);
      setShenShaResult(shenSha);
      
      // 计算大运（使用 taibu-core 精确算法）
      try {
        const dayun = await runBaziDayun({
          birthYear: y, birthMonth: m, birthDay: d, birthHour: h, birthMinute: 0,
          gender, calendarType, isLeapMonth: calendarType === "lunar" ? isLeapMonth : undefined,
        });
        setDayunResult(dayun);
      } catch { /* dayun calc failed, ignore */ }
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? "排盘失败");
      setBaziResult(null);
      setShenShaResult(null);
      setLoading(false);
    }
  };

  const handleAIReading = async () => {
    if (!baziResult) return;
    setAiLoading(true);
    setAiError("");
    setAiResult("");

    try {
      const res = await fetch("/api/bazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: baziResult }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "AI解读请求失败");
      }

      const json = await res.json();
      setAiResult(json.text ?? "");
    } catch (e: any) {
      setAiError(e?.message ?? "AI解读失败");
    } finally {
      setAiLoading(false);
    }
  };

  const fiveElements = baziResult ? computeFiveElements(baziResult) : null;
  const pillarLabels: Record<string, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span><small>Truthful Hexagram</small></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a className="active" href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a></nav>
        <a className="profile-pill" href="/activate">激活密钥 / 我的权限</a>
      </header>

      <main className="main-flow">
        <section className="ziwei-hero">
          <h1>八字排盘</h1>
          <p>四柱推命 · 十神 · 藏干 · 纳音 · 神煞</p>
        </section>

        <form className="ziwei-form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}>
          <div className="ziwei-form-row">
            <label><span>出生日期（公历）</span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></label>
            <label><span>出生时辰</span><select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>{TIME_OPTIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></label>
            <label><span>性别</span><select value={gender} onChange={(e) => setGender(e.target.value as Gender)}><option value="male">男</option><option value="female">女</option></select></label>
            <label><span>历法</span><select value={calendarType} onChange={(e) => setCalendarType(e.target.value as CalendarType)}><option value="solar">公历</option><option value="lunar">农历</option></select></label>
            {calendarType === "lunar" && <label><span>闰月</span><select value={isLeapMonth ? "1" : "0"} onChange={(e) => setIsLeapMonth(e.target.value === "1")}><option value="0">否</option><option value="1">是</option></select></label>}
            <button type="submit" className="ziwei-submit" disabled={loading}>{loading ? "排盘中…" : "开始排盘"}</button>
          </div>
          {error && <p className="ziwei-error">{error}</p>}
        </form>


        {baziResult && (
          <>
            <section className="bazi-result-card">
              <div className="bazi-card-title">盘面总览</div>
              <div className="bazi-overview">
                <div className="bazi-overview-item">
                  <span className="bazi-label">日主</span>
                  <span className="bazi-value gold">{baziResult.dayMaster}</span>
                </div>
                <div className="bazi-overview-item">
                  <span className="bazi-label">空亡</span>
                  <span className="bazi-value">{baziResult.kongWang.xun}（{baziResult.kongWang.kongZhi.join("、")}）</span>
                </div>
                {baziResult.taiYuan && (
                  <div className="bazi-overview-item">
                    <span className="bazi-label">胎元</span>
                    <span className="bazi-value">{baziResult.taiYuan}</span>
                  </div>
                )}
                {baziResult.mingGong && (
                  <div className="bazi-overview-item">
                    <span className="bazi-label">命宫</span>
                    <span className="bazi-value">{baziResult.mingGong}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="bazi-result-card">
              <div className="bazi-card-title">四柱详情</div>
              <div className="bazi-pillars-grid">
                {(["year", "month", "day", "hour"] as const).map((pos) => {
                  const p = baziResult.fourPillars[pos];
                  return (
                    <div key={pos} className="bazi-pillar">
                      <div className="bazi-pillar-header">{pillarLabels[pos]}</div>
                      <div className="bazi-pillar-body">
                        <div className="bazi-stem-branch">
                          <span className="bazi-stem">{p.stem}</span>
                          <span className="bazi-branch">{p.branch}</span>
                        </div>
                        <table className="bazi-pillar-table">
                          <tbody>
                            {p.tenGod && (
                              <tr>
                                <td className="bazi-td-label">十神</td>
                                <td className="bazi-td-value">{p.tenGod}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="bazi-td-label">藏干</td>
                              <td className="bazi-td-value">
                                {p.hiddenStems.map((h, i) => (
                                  <span key={i} className="bazi-hidden-stem">
                                    {h.stem}
                                    <small>（{h.qiType}·{h.tenGod}）</small>
                                    {i < p.hiddenStems.length - 1 && " "}
                                  </span>
                                ))}
                              </td>
                            </tr>
                            {p.naYin && (
                              <tr>
                                <td className="bazi-td-label">纳音</td>
                                <td className="bazi-td-value">{p.naYin}</td>
                              </tr>
                            )}
                            {p.diShi && (
                              <tr>
                                <td className="bazi-td-label">地势</td>
                                <td className="bazi-td-value">{p.diShi}</td>
                              </tr>
                            )}
                            {p.shenSha.length > 0 && (
                              <tr>
                                <td className="bazi-td-label">神煞</td>
                                <td className="bazi-td-value">{p.shenSha.join("、")}</td>
                              </tr>
                            )}
                            {p.kongWang.isKong && (
                              <tr>
                                <td className="bazi-td-label">空亡</td>
                                <td className="bazi-td-value mark-kong">空</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {baziResult.tianGanWuHe.length > 0 && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">天干五合</div>
                <div className="bazi-tag-list">
                  {baziResult.tianGanWuHe.map((item, i) => (
                    <span key={i} className="bazi-tag bazi-tag-he">
                      {item.stemA}{item.stemB}合化{item.resultElement}
                      <small>（{item.positions.join("·")}）</small>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {baziResult.tianGanChongKe.length > 0 && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">天干冲克</div>
                <div className="bazi-tag-list">
                  {baziResult.tianGanChongKe.map((item, i) => (
                    <span key={i} className="bazi-tag bazi-tag-chong">
                      {item.stemA}{item.stemB}相冲
                      <small>（{item.positions.join("·")}）</small>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {baziResult.diZhiBanHe.length > 0 && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">地支半合</div>
                <div className="bazi-tag-list">
                  {baziResult.diZhiBanHe.map((item, i) => (
                    <span key={i} className="bazi-tag bazi-tag-he">
                      {item.branches.join("·")}半合{item.resultElement}（缺{item.missingBranch}）
                      <small>（{item.positions.join("·")}）</small>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {baziResult.diZhiSanHui.length > 0 && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">地支三会</div>
                <div className="bazi-tag-list">
                  {baziResult.diZhiSanHui.map((item, i) => (
                    <span key={i} className="bazi-tag bazi-tag-hui">
                      {item.branches.join("·")}三会{item.resultElement}
                      <small>（{item.positions.join("·")}）</small>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {baziResult.relations.length > 0 && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">刑冲合害</div>
                <div className="bazi-tag-list">
                  {baziResult.relations.map((rel, i) => (
                    <span key={i} className={`bazi-tag bazi-tag-${rel.type}`}>
                      {rel.pillars.join("·")}{rel.type}
                      <small>（{rel.description}）</small>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {shenShaResult && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">神煞总览</div>
                <div className="bazi-shensha-section">
                  {shenShaResult.jiShen.length > 0 && (
                    <div className="bazi-shensha-group">
                      <div className="bazi-shensha-label good">吉神</div>
                      <div className="bazi-tag-list">
                        {shenShaResult.jiShen.map((s, i) => (
                          <span key={i} className="bazi-tag bazi-tag-ji">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {shenShaResult.xiongSha.length > 0 && (
                    <div className="bazi-shensha-group">
                      <div className="bazi-shensha-label bad">凶煞</div>
                      <div className="bazi-tag-list">
                        {shenShaResult.xiongSha.map((s, i) => (
                          <span key={i} className="bazi-tag bazi-tag-xiong">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(shenShaResult.dayYi.length > 0 || shenShaResult.dayJi.length > 0) && (
                  <div className="bazi-shensha-section" style={{ marginTop: 16 }}>
                    {shenShaResult.dayYi.length > 0 && (
                      <div className="bazi-shensha-group">
                        <div className="bazi-shensha-label good">日宜</div>
                        <div className="bazi-tag-list">
                          {shenShaResult.dayYi.map((s, i) => (
                            <span key={i} className="bazi-tag bazi-tag-ji">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {shenShaResult.dayJi.length > 0 && (
                      <div className="bazi-shensha-group">
                        <div className="bazi-shensha-label bad">日忌</div>
                        <div className="bazi-tag-list">
                          {shenShaResult.dayJi.map((s, i) => (
                            <span key={i} className="bazi-tag bazi-tag-xiong">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {fiveElements && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">五行统计</div>
                <div className="bazi-wuxing-bar">
                  {ELEMENT_ORDER.map((el) => {
                    const count = fiveElements[el] ?? 0;
                    const pct = Math.max(count / 20, 0.02);
                    return (
                      <div key={el} className="bazi-wuxing-item">
                        <div className="bazi-wuxing-label">{el}</div>
                        <div className="bazi-wuxing-track">
                          <div
                            className="bazi-wuxing-fill"
                            style={{ width: `${pct * 100}%`, background: ELEMENT_COLORS[el] }}
                          />
                        </div>
                        <div className="bazi-wuxing-count">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="bazi-ai-section">
              <button className="bazi-ai-btn" onClick={handleAIReading} disabled={aiLoading}>
                {aiLoading ? "AI 解读中…" : "AI 解读"}
              </button>

              {aiError && <p className="bazi-error">{aiError}</p>}

              {aiResult && (
                <div className="bazi-ai-result">
                  <div className="bazi-ai-result-header">AI 解读</div>
                  <div className="bazi-ai-result-body">{aiResult}</div>
                </div>
              )}
            </section>
          </>
        )}

        <footer style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 12, marginTop: 60, paddingBottom: 40 }}>
          仅作文化研究与体验，不构成任何决策建议
        </footer>
      </main>

      <style jsx>{`
        .bazi-header {
          text-align: center;
          padding: 40px 0 20px;
        }
        .bazi-title {
          margin: 0;
          font-size: 36px;
          font-weight: 300;
          letter-spacing: 0.14em;
          color: var(--ink);
        }
        .bazi-subtitle {
          margin: 8px 0 0;
          font-size: 13px;
          color: var(--ink-soft);
          letter-spacing: 0.08em;
        }
        .bazi-form-card {
          padding: 24px 28px;
          border: 1px solid rgba(51, 51, 51, 0.08);
          border-radius: 14px;
          background: #F2EDE5;
          box-shadow: var(--shadow);
        }
        .bazi-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 14px 16px;
        }
        .bazi-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: var(--ink-soft);
        }
        .bazi-field input,
        .bazi-field select {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid rgba(51, 51, 51, 0.14);
          border-radius: 10px;
          background: #F2EDE5;
          color: var(--ink);
          font-size: 15px;
          outline: none;
          font-family: inherit;
        }
        .bazi-field input:focus,
        .bazi-field select:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px var(--gold-soft);
        }
        .bazi-submit-btn {
          margin-top: 16px;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          color: #fff;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 14px rgba(212, 65, 21, 0.25);
        }
        .bazi-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(212, 65, 21, 0.35);
        }
        .bazi-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .bazi-error {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(212, 65, 21, 0.08);
          color: var(--gold-dark);
          font-size: 13px;
          text-align: center;
        }
        .bazi-result-card {
          margin-top: 16px;
          padding: 22px 26px;
          border: 1px solid rgba(51, 51, 51, 0.08);
          border-radius: 14px;
          background: #F2EDE5;
          box-shadow: var(--shadow);
        }
        .bazi-card-title {
          margin-bottom: 16px;
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: 0.06em;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(51, 51, 51, 0.06);
        }
        .bazi-overview {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 24px;
        }
        .bazi-overview-item {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .bazi-label {
          font-size: 12px;
          color: var(--ink-soft);
        }
        .bazi-value {
          font-size: 16px;
          color: var(--ink);
          font-weight: 600;
        }
        .bazi-value.gold {
          color: var(--gold);
          font-size: 20px;
        }
        .bazi-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .bazi-pillar {
          border: 1px solid rgba(51, 51, 51, 0.06);
          border-radius: 12px;
          overflow: hidden;
          background: #F2EDE5;
        }
        .bazi-pillar-header {
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          text-align: center;
          letter-spacing: 0.06em;
        }
        .bazi-pillar-body {
          padding: 14px;
        }
        .bazi-stem-branch {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .bazi-stem,
        .bazi-branch {
          font-size: 28px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
        }
        .bazi-stem {
          color: var(--gold);
        }
        .bazi-pillar-table {
          width: 100%;
          border-collapse: collapse;
        }
        .bazi-pillar-table td {
          padding: 4px 0;
          font-size: 12px;
          vertical-align: top;
        }
        .bazi-td-label {
          width: 36px;
          color: var(--ink-soft);
          font-size: 11px !important;
          white-space: nowrap;
        }
        .bazi-td-value {
          color: var(--ink);
          line-height: 1.6;
        }
        .bazi-hidden-stem {
          display: inline;
        }
        .bazi-hidden-stem small {
          color: var(--ink-soft);
          font-size: 10px;
        }
        .mark-kong {
          color: var(--gold-dark);
          font-weight: 600;
        }
        .bazi-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .bazi-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: var(--ink);
          background: #F2EDE5;
          border: 1px solid rgba(51, 51, 51, 0.06);
        }
        .bazi-tag small {
          font-size: 11px;
          color: var(--ink-soft);
        }
        .bazi-tag-he {
          border-color: rgba(41, 135, 71, 0.15);
          background: rgba(41, 135, 71, 0.04);
        }
        .bazi-tag-chong {
          border-color: rgba(212, 65, 21, 0.15);
          background: rgba(212, 65, 21, 0.04);
        }
        .bazi-tag-hui {
          border-color: rgba(49, 121, 148, 0.15);
          background: rgba(49, 121, 148, 0.04);
        }
        .bazi-tag-合 {
          border-color: rgba(41, 135, 71, 0.15);
          background: rgba(41, 135, 71, 0.04);
        }
        .bazi-tag-冲 {
          border-color: rgba(212, 65, 21, 0.15);
          background: rgba(212, 65, 21, 0.04);
        }
        .bazi-tag-刑 {
          border-color: rgba(184, 134, 11, 0.2);
          background: rgba(184, 134, 11, 0.05);
        }
        .bazi-tag-害 {
          border-color: rgba(49, 121, 148, 0.15);
          background: rgba(49, 121, 148, 0.04);
        }
        .bazi-tag-ji {
          border-color: rgba(41, 135, 71, 0.15);
          background: rgba(41, 135, 71, 0.04);
          color: #298747;
        }
        .bazi-tag-xiong {
          border-color: rgba(212, 65, 21, 0.15);
          background: rgba(212, 65, 21, 0.04);
          color: #D44115;
        }
        .bazi-shensha-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .bazi-shensha-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bazi-shensha-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .bazi-shensha-label.good {
          color: #298747;
        }
        .bazi-shensha-label.bad {
          color: #D44115;
        }
        .bazi-wuxing-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bazi-wuxing-item {
          display: grid;
          grid-template-columns: 24px 1fr 32px;
          align-items: center;
          gap: 12px;
        }
        .bazi-wuxing-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
        }
        .bazi-wuxing-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(51, 51, 51, 0.06);
          overflow: hidden;
        }
        .bazi-wuxing-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.5s ease;
        }
        .bazi-wuxing-count {
          font-size: 13px;
          color: var(--ink-soft);
          text-align: right;
        }
        .bazi-ai-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px 0 10px;
        }
        .bazi-ai-btn {
          padding: 12px 40px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(212, 65, 21, 0.25);
        }
        .bazi-ai-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(212, 65, 21, 0.35);
        }
        .bazi-ai-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .bazi-ai-result {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          overflow: hidden;
        }
        .bazi-ai-result-header {
          padding: 12px 18px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dark));
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .bazi-ai-result-body {
          max-height: 480px;
          overflow-y: auto;
          padding: 18px 20px;
          font-size: 14px;
          color: var(--ink);
          line-height: 1.9;
          white-space: pre-wrap;
          background: #F2EDE5;
        }
        @media (max-width: 768px) {
          .bazi-pillars-grid {
            grid-template-columns: 1fr;
          }
          .bazi-form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
