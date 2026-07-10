"use client";

import { useState, useMemo } from "react";
import { runBazi, runBaziFiveElementsStats, runBaziShenSha, runBaziDayun, type BaziInput, type BaziOutput, type DayunOutput } from "../../src/lib/taibu";
import { generateBaziAnalysis, analyzeYearForecast, analyzeShenSha, analyzePillarChangSheng, analyzeTiaoHou, type BaziAnalysis, type YearAnalysis, type ShenShaReport, type PillarChangShengReport, type ClimateReport } from "../../src/domain/baziAnalysis";

import "../../src/styles.css";
import { TIME_OPTIONS, HOUR_STARTS } from "../ziwei-time";

type CalendarType = "solar" | "lunar";
type Gender = "male" | "female";

export default function BaziPage() {
  const [birthDate, setBirthDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeIndex, setTimeIndex] = useState(0);
  const [gender, setGender] = useState<Gender>("male");
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [useTrueSolar, setUseTrueSolar] = useState(false);

  const [baziResult, setBaziResult] = useState<BaziOutput | null>(null);
  const [shenShaResult, setShenShaResult] = useState<any>(null);
  const [dayunResult, setDayunResult] = useState<DayunOutput | null>(null);
  const [baziAnalysis, setBaziAnalysis] = useState<BaziAnalysis | null>(null);
  const [yearAnalysis, setYearAnalysis] = useState<YearAnalysis[] | null>(null);  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
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
        longitude: useTrueSolar ? 116.4074 : undefined, // 默认北京时间，勾选后使用北京经度
        birthYear: y,
        birthMonth: m,
        birthDay: d,
        birthHour: h,
        birthMinute: 0,
        gender,
        calendarType,
        isLeapMonth: calendarType === "lunar" ? isLeapMonth : undefined,
      };

      const result = await runBazi(input);
      const shenSha = await runBaziShenSha(input);
      setBaziResult(result);
      setShenShaResult(shenSha);
      try { setShenShaReport(analyzeShenSha(shenSha)); } catch { setShenShaReport(null); }
      try { setChangShengReport(analyzePillarChangSheng(result.fourPillars)); } catch { setChangShengReport(null); }
      try { setTiaoHouReport(analyzeTiaoHou(result.dayMaster, result.fourPillars.month.branch || result.fourPillars.month.earthlyBranch, result.fourPillars)); } catch { setTiaoHouReport(null); }
      
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

  // 检测 @mention
  const baziMentions = useMemo(() => {
    const triggers: Record<string, string> = {"@八字":"八字命理","@紫微":"紫微斗数","@六爻":"六爻纳甲","@奇门":"奇门遁甲","@六壬":"大六壬","@梅花":"梅花易数"};
    return Object.entries(triggers).filter(([t]) => aiQuestion.includes(t)).map(([t, l]) => ({ trigger: t, label: l }));
  }, [aiQuestion]);

  const handleAIReading = async () => {
    if (!baziResult) return;
    setAiLoading(true);
    setAiError("");
    setAiResult("");

    try {
      const res = await fetch("/api/bazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: baziResult, analysis: baziAnalysisMemo, question: aiQuestion }),
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

  const ELEMENT_COLORS: Record<string, string> = { 金: "#D4A017", 木: "#298747", 水: "#317994", 火: "#D44115", 土: "#B8860B" };
const ELEMENT_ORDER = ["金", "木", "水", "火", "土"];

const fiveElements = baziResult ? runBaziFiveElementsStats(baziResult.fourPillars) : null;

const baziAnalysisMemo = useMemo(() => {
  if (!baziResult || !dayunResult) return null;
  const dayunList = dayunResult.list.map((dy: any) => ({
    ganZhi: dy.ganZhi,
    stem: dy.ganZhi[0],
    branch: dy.ganZhi[1],
    tenGod: dy.tenGod,
    startAge: dy.startAge,
    startYear: dy.startYear,
  }));
  return generateBaziAnalysis(baziResult, dayunList);
  const yearForecast = useMemo(() => {
    if (!baziResult || !dayunResult) return null;
    const dyList = dayunResult.list.slice(0, 8).map(d => ({ ganZhi: d.ganZhi, stem: d.ganZhi[0], branch: d.ganZhi[1], tenGod: d.tenGod, startAge: d.startAge, startYear: d.startYear }));
    const strength = baziAnalysisMemo.strength;
    return analyzeYearForecast(strength, dyList, parseInt(birthDate.slice(0, 4)));
  }, [baziAnalysisMemo, baziResult, dayunResult, birthDate]);
}, [baziResult, dayunResult]);
  const pillarLabels: Record<string, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a className="active" href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a><a href="/almanac">黄历</a><a href="/xiaoliuren">小六壬</a></nav>
        
      </header>

      <main className="main-flow">
        <section className="ziwei-hero">
          <h1>八字排盘</h1>
          <p>四柱推命 · 十神 · 藏干 · 纳音 · 神煞 · 大运流年</p>
        </section>

        <form className="ziwei-form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}>
          <div className="ziwei-form-row">
            <label><span>出生日期（公历）</span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></label>
            <label style={{ flex: "0 0 auto", marginTop: 20 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setUseTrueSolar(!useTrueSolar)}>
                  <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 4, border: "2px solid " + (useTrueSolar ? "var(--gold)" : "rgba(0,0,0,0.2)"), background: useTrueSolar ? "var(--gold)" : "transparent", position: "relative" }}>
                    {useTrueSolar && <span style={{ position: "absolute", top: 1, left: 4, color: "#fff", fontSize: 11 }}>✓</span>}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>真太阳时</span>
                </span>
              </label>
            </div>
            <div className="ziwei-form-row">
              <label><span>出生时辰</span><select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>{TIME_OPTIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></label>
            <label style={{ flex: "0 0 80px" }}><span>性别</span><select value={gender} onChange={(e) => setGender(e.target.value as Gender)}><option value="male">男</option><option value="female">女</option></select></label>
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
                        {shenShaResult.jiShen.map((s: string, i: number) => (
                          <span key={i} className="bazi-tag bazi-tag-ji">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {shenShaResult.xiongSha.length > 0 && (
                    <div className="bazi-shensha-group">
                      <div className="bazi-shensha-label bad">凶煞</div>
                      <div className="bazi-tag-list">
                        {shenShaResult.xiongSha.map((s: string, i: number) => (
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
                          {shenShaResult.dayYi.map((s: string, i: number) => (
                            <span key={i} className="bazi-tag bazi-tag-ji">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {shenShaResult.dayJi.length > 0 && (
                      <div className="bazi-shensha-group">
                        <div className="bazi-shensha-label bad">日忌</div>
                        <div className="bazi-tag-list">
                          {shenShaResult.dayJi.map((s: string, i: number) => (
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
                    const count = (fiveElements as unknown as Record<string, number>)[el] ?? 0;
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

            {baziAnalysisMemo && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">命局分析</div>
                
                <div className="bazi-analysis-summary">
                  {baziAnalysisMemo.summary}
                </div>

                <div className="bazi-analysis-section">
                  <div className="bazi-analysis-label">日主强弱</div>
                  <div className="bazi-strength-bar">
                    <div className="bazi-strength-track">
                      <div
                        className="bazi-strength-fill"
                        style={{
                          width: `${(baziAnalysisMemo.strength.score / 10) * 100}%`,
                          background: baziAnalysisMemo.strength.score >= 6.5 ? '#D44115'
                            : baziAnalysisMemo.strength.score <= 3.5 ? '#298747'
                            : '#D4A017'
                        }}
                      />
                    </div>
                    <div className="bazi-strength-value">
                      {baziAnalysisMemo.strength.score}/10
                      <small>（{baziAnalysisMemo.strength.level}）</small>
                    </div>
                  </div>
                  <div className="bazi-analysis-details">
                    {baziAnalysisMemo.strength.details.map((d, i) => (
                      <div key={i} className="bazi-analysis-detail">{d}</div>
                    ))}
                  </div>
                </div>

                {baziAnalysisMemo.patterns.length > 0 && (
                  <div className="bazi-analysis-section">
                    <div className="bazi-analysis-label">格局判定</div>
                    <div className="bazi-pattern-list">
                      {baziAnalysisMemo.patterns.map((p, i) => (
                        <div key={i} className={"bazi-pattern-item bazi-pattern-" + p.level}>
                          <div className="bazi-pattern-header">
                            <span className="bazi-pattern-name">{p.name}</span>
                            <span className="bazi-pattern-badge">{p.level}</span>
                            {p.type === "特殊" && <span className="bazi-pattern-special">特殊格局</span>}
                          </div>
                          <div className="bazi-pattern-desc">{p.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bazi-analysis-section">
                  <div className="bazi-analysis-label">喜用神 & 忌神</div>
                  <div className="bazi-analysis-row">
                    <div className="bazi-fav-group">
                      <span className="bazi-fav-label good">喜用</span>
                      {baziAnalysisMemo.strength.favorableElements.map((el, i) => (
                        <span key={i} className="bazi-fav-tag good">{el}</span>
                      ))}
                    </div>
                    <div className="bazi-fav-group">
                      <span className="bazi-fav-label bad">忌神</span>
                      {baziAnalysisMemo.strength.unfavorableElements.map((el, i) => (
                        <span key={i} className="bazi-fav-tag bad">{el}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {baziAnalysisMemo.dayunAdvice.length > 0 && (
                  <div className="bazi-analysis-section">
                    <div className="bazi-analysis-label">大运吉凶</div>
                {yearForecast && yearForecast.length > 0 && (
                  <div className="bazi-analysis-section">
                    <div className="bazi-analysis-label">流年分析（近五年）</div>
                    <div className="bazi-dayun-advice-list">
                      {yearForecast.map((yf: any, i: number) => (
                        <div key={i} className={"bazi-dayun-advice-item rating-" + yf.rating}>
                          <span className="bazi-dayun-advice-period">{yf.year}年 {yf.ganZhi}</span>
                          <span className={"bazi-dayun-advice-rating " + yf.rating}>{yf.rating}</span>
                          <span className="bazi-dayun-advice-summary">{yf.mainEvent} · {yf.interaction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                    <div className="bazi-dayun-advice-list">
                      {baziAnalysisMemo.dayunAdvice.map((da, i) => (
                        <div key={i} className={"bazi-dayun-advice-item rating-" + da.rating}>
                          <span className="bazi-dayun-advice-period">{da.period}</span>
                          <span className="bazi-dayun-advice-age">{da.age}</span>
                          <span className={"bazi-dayun-advice-rating " + da.rating}>{da.rating}</span>
                          <span className="bazi-dayun-advice-summary">{da.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {dayunResult && (
              <section className="bazi-result-card">
                <div className="bazi-card-title">大运流年</div>
                <div className="bazi-dayun-header">
                  <span className="bazi-dayun-age">起运：{dayunResult.startAge}岁</span>
                  <span className="bazi-dayun-detail">{dayunResult.startAgeDetail}</span>
                </div>
                <div className="bazi-dayun-list">
                  {dayunResult.list.slice(0, 8).map((dy, i) => (
                    <details key={i} className="bazi-dayun-item" open={i === 0}>
                      <summary className="bazi-dayun-summary">
                        <span className="bazi-dayun-period">
                          <strong>{dy.ganZhi}</strong>
                          <small>{dy.tenGod}</small>
                        </span>
                        <span className="bazi-dayun-range">{dy.startAge}岁 · {dy.startYear}年起</span>
                        <span className="bazi-dayun-branch">
                          {dy.branchTenGod && <small>支：{dy.branchTenGod}</small>}
                        </span>
                      </summary>
                      <div className="bazi-dayun-detail-body">
                        <div className="bazi-dayun-info">
                          {dy.naYin && <span className="bazi-tag bazi-tag-he">纳音：{dy.naYin}</span>}
                          {dy.diShi && <span className="bazi-tag bazi-tag-he">地势：{dy.diShi}</span>}
                          {dy.shenSha.length > 0 && dy.shenSha.map((s) => (
                            <span key={s} className="bazi-tag bazi-tag-ji">{s}</span>
                          ))}
                        </div>
                        {dy.branchRelations.length > 0 && (
                          <div className="bazi-dayun-relations">
                            {dy.branchRelations.map((r, j) => (
                              <span key={j} className="bazi-tag bazi-tag-chong">
                                {r.type}：{r.branches.join('·')}（{r.description}）
                              </span>
                            ))}
                          </div>
                        )}
                        {dy.liunianList && dy.liunianList.length > 0 && (
                          <div className="bazi-liunian-section">
                            <div className="bazi-liunian-title">流年</div>
                            <div className="bazi-liunian-grid">
                              {dy.liunianList.map((ln, j) => (
                                <div key={j} className={ln.taiSui ? 'bazi-liunian-item taisui' : 'bazi-liunian-item'}>
                                  <span className="bazi-liunian-year">{ln.year}</span>
                                  <span className="bazi-liunian-gz">{ln.ganZhi}</span>
                                  {ln.tenGod && <span className="bazi-liunian-tg">{ln.tenGod}</span>}
                                  {ln.taiSui && <span className="bazi-liunian-taisui">太岁</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <section className="bazi-ai-section">
              <div className="bazi-ai-question-row">
                <textarea
                  className="bazi-ai-question-input"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="可选：输入你想问的具体问题… 输入 @八字 引用知识库"
                  rows={2}
                />
                {baziMentions.length > 0 && (
                  <div className="mention-bar">
                    <span className="mention-hint">📚 已引用知识库：</span>
                    {baziMentions.map((m, i) => (
                      <span key={i} className="mention-tag" style={{ borderColor: '#298747', color: '#298747' }}>
                        {m.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button className="bazi-ai-btn" onClick={handleAIReading} disabled={aiLoading}>
                {aiLoading ? "解读中…" : "深度解读"}
              </button>

              {aiError && <p className="bazi-error">{aiError}</p>}

              {aiResult && (
                <div className="bazi-ai-result">
                  <div className="bazi-ai-result-header">深度解读</div>
                  <div className="bazi-ai-result-body">{aiResult}</div>
                </div>
              )}
            </section>
          </>
        )}

        <footer style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 12, marginTop: 60, paddingBottom: 40 }}>
          仅作为化研究与体验，不构成任何决策建议
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
          padding: 0 14px;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%; min-height: 46px; padding: 10px 28px;
          border: none;
          border-radius: 12px;
          background: var(--red);
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(212, 65, 21, 0.22);
        }
        .bazi-ai-btn:hover:not(:disabled) {
          filter: brightness(0.9);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(212, 65, 21, 0.3);
        }
        .bazi-ai-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
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

        /* 大运流年 */
        .bazi-dayun-header {
          display: flex;
          gap: 16px;
          align-items: baseline;
          padding: 10px 0 16px;
          border-bottom: 1px solid rgba(51, 51, 51, 0.06);
          margin-bottom: 12px;
        }
        .bazi-dayun-age {
          font-size: 18px;
          font-weight: 700;
          color: var(--gold);
        }
        .bazi-dayun-detail {
          font-size: 12px;
          color: var(--ink-soft);
        }
        .bazi-dayun-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bazi-dayun-item {
          border: 1px solid rgba(51, 51, 51, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }
        .bazi-dayun-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          background: var(--surface-strong);
          font-size: 14px;
          transition: background 0.15s;
          list-style: none;
        }
        .bazi-dayun-summary::-webkit-details-marker {
          display: none;
        }
        .bazi-dayun-summary:hover {
          background: rgba(242, 237, 229, 0.8);
        }
        .bazi-dayun-period {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 80px;
        }
        .bazi-dayun-period strong {
          font-size: 16px;
          letter-spacing: 0.06em;
        }
        .bazi-dayun-period small {
          font-size: 11px;
          color: var(--ink-soft);
        }
        .bazi-dayun-range {
          font-size: 13px;
          color: var(--ink-soft);
        }
        .bazi-dayun-branch {
          margin-left: auto;
        }
        .bazi-dayun-branch small {
          font-size: 11px;
          color: var(--blue);
        }
        .bazi-dayun-detail-body {
          padding: 12px 16px 16px;
          background: rgba(242, 237, 229, 0.3);
          border-top: 1px solid rgba(51, 51, 51, 0.04);
        }
        .bazi-dayun-info {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .bazi-dayun-relations {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .bazi-liunian-section {
          margin-top: 4px;
        }
        .bazi-liunian-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-soft);
          margin-bottom: 6px;
        }
        .bazi-liunian-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 4px;
        }
        .bazi-liunian-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 4px;
          border-radius: 6px;
          background: rgba(51, 51, 51, 0.03);
          font-size: 12px;
          gap: 2px;
        }
        .bazi-liunian-item.taisui {
          background: rgba(212, 65, 21, 0.06);
          border: 1px solid rgba(212, 65, 21, 0.15);
        }
        .bazi-liunian-year {
          font-weight: 600;
          color: var(--ink);
        }
        .bazi-liunian-gz {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .bazi-liunian-tg {
          font-size: 10px;
          color: var(--ink-soft);
        }
        .bazi-liunian-taisui {
          font-size: 10px;
          color: var(--red);
          font-weight: 600;
        }

      `}</style>
    </div>
  );
}
