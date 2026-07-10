"use client";

import { useState } from "react";
import { calculateXiaoLiuRen, calculateXiaoLiuRenByNumbers, calculateXiaoLiuRenByTimeMinute, getShiChenFromHour, type XiaoLiuRenResult } from "../../src/domain/xiaoliurenAnalysis";
import "../../src/styles.css";
import { TIME_OPTIONS } from "../ziwei-time";

// 时辰映射
const HOUR_MAP: Record<number, string> = {
  0: "子", 1: "丑", 2: "丑", 3: "寅", 4: "寅", 5: "卯", 6: "卯",
  7: "辰", 8: "辰", 9: "巳", 10: "巳", 11: "午", 12: "午",
  13: "未", 14: "未", 15: "申", 16: "申", 17: "酉", 18: "酉",
  19: "戌", 20: "戌", 21: "亥", 22: "亥", 23: "子",
};

const METHOD_OPTIONS = [
  { value: "monthDayHour" as const, label: "月日时法" },
  { value: "hourMinute" as const, label: "时刻分法" },
  { value: "numbers" as const, label: "数字起卦" },
];

const NATURE_COLOR: Record<string, string> = {
  "大吉": "#2d8e47", "吉": "#4e8c3c", "中平": "#888",
  "凶": "#c75638", "大凶": "#d44115",
};

export default function XiaoLiuRenPage() {
  // 日期时间
  const [birthDate, setBirthDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeIndex, setTimeIndex] = useState(0);
  const [method, setMethod] = useState<"monthDayHour" | "numbers">("monthDayHour");
  const [num1, setNum1] = useState("");
  const [num2, setNum2] = useState("");
  const [num3, setNum3] = useState("");

  const [result, setResult] = useState<XiaoLiuRenResult | null>(null);
  const [error, setError] = useState("");

  // 自动计算农历月日时（简化：使用公历+时辰推算）
  function getLunarInfo(): { month: number; day: number; hour: string } {
    const d = new Date(`${birthDate}T12:00:00`);
    const month = d.getMonth() + 1; // 简化用公历月
    const day = d.getDate();
    // 从 TIME_OPTIONS 获取时辰
    const hourRanges = [
      { start: 0, end: 1, zhi: "子" }, { start: 1, end: 3, zhi: "丑" }, { start: 3, end: 5, zhi: "寅" },
      { start: 5, end: 7, zhi: "卯" }, { start: 7, end: 9, zhi: "辰" }, { start: 9, end: 11, zhi: "巳" },
      { start: 11, end: 13, zhi: "午" }, { start: 13, end: 15, zhi: "未" }, { start: 15, end: 17, zhi: "申" },
      { start: 17, end: 19, zhi: "酉" }, { start: 19, end: 21, zhi: "戌" }, { start: 21, end: 23, zhi: "亥" },
      { start: 23, end: 24, zhi: "子" },
    ];
    const h = timeIndex * 2; // TIME_OPTIONS index → approximate hour
    return { month, day, hour: hourRanges[timeIndex]?.zhi || "子" };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { month, day, hour } = getLunarInfo();

      if (method === "numbers") {
        const n1 = parseInt(num1) || 1;
        const n2 = parseInt(num2) || 1;
        const n3 = parseInt(num3) || 1;
        if (n1 < 1 || n1 > 999 || n2 < 1 || n2 > 999 || n3 < 1 || n3 > 999) {
          setError("数字范围 1-999");
          return;
        }
        const res = calculateXiaoLiuRenByNumbers([n1, n2, n3], month, day, hour);
        setResult(res);
      } else {
        const res = calculateXiaoLiuRen(month, day, hour);
        setResult(res);
      }
    } catch (err: any) {
      setError(err?.message || "起卦失败");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span></a>
        <nav className="desktop-nav">
          <a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a>
          <a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a>
          <a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a><a href="/almanac">黄历</a>
          <a className="active" href="/xiaoliuren">小六壬</a>
        </nav>
      </header>

      <main className="main-flow">
        <section className="ziwei-hero">
          <h1>道家小六壬</h1>
          <p>三宫具象法 · 八卦具象法 · 六亲推演 · 天地人三盘联动</p>
        </section>

        <form className="ziwei-form" onSubmit={handleSubmit}>
          <div className="ziwei-form-row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 180px" }}>
              <span>日期（公历）</span>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
            <label style={{ flex: "1 1 140px" }}>
              <span>时辰</span>
              <select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>
                {TIME_OPTIONS.map((t, i) => (
                  <option key={i} value={i}>{t.label}</option>
                ))}
              </select>
            </label>
            <label style={{ flex: "1 1 120px" }}>
              <span>起卦方法</span>
              <select value={method} onChange={(e) => setMethod(e.target.value as any)}>
                {METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            {method === "numbers" && (
              <>
                <label style={{ flex: "0 0 70px" }}>
                  <span>数一</span>
                  <input type="number" min="1" max="999" value={num1} onChange={(e) => setNum1(e.target.value)}
                    style={{ width: "100%", border: "1px solid rgba(51,51,51,0.14)", borderRadius: 10, padding: "10px 12px", fontSize: 15, background: "var(--surface-strong)", color: "var(--ink)" }} />
                </label>
                <label style={{ flex: "0 0 70px" }}>
                  <span>数二</span>
                  <input type="number" min="1" max="999" value={num2} onChange={(e) => setNum2(e.target.value)}
                    style={{ width: "100%", border: "1px solid rgba(51,51,51,0.14)", borderRadius: 10, padding: "10px 12px", fontSize: 15, background: "var(--surface-strong)", color: "var(--ink)" }} />
                </label>
                <label style={{ flex: "0 0 70px" }}>
                  <span>数三</span>
                  <input type="number" min="1" max="999" value={num3} onChange={(e) => setNum3(e.target.value)}
                    style={{ width: "100%", border: "1px solid rgba(51,51,51,0.14)", borderRadius: 10, padding: "10px 12px", fontSize: 15, background: "var(--surface-strong)", color: "var(--ink)" }} />
                </label>
              </>
            )}
            <button type="submit" style={{
              padding: "10px 24px", border: "none", borderRadius: 12, background: "var(--gold)",
              color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
              flex: "0 0 auto", marginTop: method === "numbers" ? 0 : 20,
            }}>起卦</button>
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: 14, marginTop: 12 }}>{error}</div>}
        </form>

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* 三宫总览 */}
            <InfoBlock title="三宫总览">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "天宫", gong: result.tianGong, detail: result.tianDetail },
                  { label: "地宫", gong: result.diGong, detail: result.diDetail },
                  { label: "人宫", gong: result.renGong, detail: result.renDetail },
                ].map((p) => (
                  <div key={p.label} style={{
                    padding: 14, borderRadius: 12,
                    background: p.detail.nature.includes("吉") && !p.detail.nature.includes("凶")
                      ? "rgba(46,142,71,0.06)" : p.detail.nature.includes("凶")
                      ? "rgba(212,65,21,0.06)" : "rgba(51,51,51,0.03)",
                    border: `2px solid ${NATURE_COLOR[p.detail.nature === "吉" ? "吉" : p.detail.nature === "大凶" ? "大凶" : p.detail.nature === "凶" ? "凶" : "中平"]}33`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{p.gong}</div>
                    <div style={{ fontSize: 13, color: NATURE_COLOR[p.detail.nature === "吉" ? "吉" : p.detail.nature === "大凶" ? "大凶" : p.detail.nature === "凶" ? "凶" : "中平"] }}>
                      {p.detail.nature} · {p.detail.wuxing} · {p.detail.yinYang}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.6 }}>{p.detail.brief}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>方位：{p.detail.direction}</div>
                  </div>
                ))}
              </div>
            </InfoBlock>

            {/* 综合判断 */}
            <InfoBlock title="综合判断">
              <div style={{ fontSize: 18, fontWeight: 700, color: NATURE_COLOR[result.overall], marginBottom: 8 }}>
                {result.overall}
              </div>
              {result.overallSummary.map((s, i) => (
                <div key={i} style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.8, marginBottom: 4 }}>
                  {s}
                </div>
              ))}
            </InfoBlock>

            {/* 三盘具象 */}
            <InfoBlock title="三盘具象（天盘 · 地盘 · 人盘联动）">
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px" }}>
                以八卦五行属性转化，推演天/地/人三盘宫位。转化八卦：{result.bagua}卦（{result.baguaWuxing}）— {result.baguaMeaning}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "天盘", pan: result.tianPan, color: "#d44115" },
                  { label: "地盘", pan: result.diPan, color: "#317994" },
                  { label: "人盘", pan: result.renPan, color: "#298747" },
                ].map((p) => (
                  <div key={p.label} style={{ padding: 12, borderRadius: 10, border: `1px solid ${p.color}22`, background: `${p.color}08` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.label}</div>
                    {p.pan.map((g, i) => (
                      <div key={i} style={{
                        padding: "6px 10px", borderRadius: 8, marginBottom: 4,
                        background: "var(--surface-strong)", fontSize: 14, fontWeight: 600,
                        color: PALM_MEANING_QUICK[g]?.nature?.includes("凶") ? "var(--red)" : "var(--green)",
                      }}>
                        {g} {PALM_MEANING_QUICK[g] ? `(${PALM_MEANING_QUICK[g].brief})` : ""}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </InfoBlock>

            {/* 五行生克 */}
            <InfoBlock title="五行生克">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.wuxingRelations.map((r, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    borderRadius: 8, background: "rgba(51,51,51,0.03)",
                    fontSize: 14, color: "var(--ink)",
                  }}>
                    <span style={{ fontWeight: 600, minWidth: 60 }}>{r.a} → {r.b}</span>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: r.rel === "生" || r.rel === "被生" ? "rgba(46,142,71,0.1)" : r.rel === "克" || r.rel === "被克" ? "rgba(212,65,21,0.1)" : "rgba(51,51,51,0.06)",
                      color: r.rel === "生" || r.rel === "被生" ? "#2d8e47" : r.rel === "克" || r.rel === "被克" ? "#c75638" : "#555",
                    }}>{r.rel}</span>
                    <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{r.full}</span>
                  </div>
                ))}
              </div>
            </InfoBlock>

            {/* 时辰关系 */}
            <InfoBlock title="时辰五行关系">
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>
                时辰「{result.lunarHour}」({result.hourWuXing} · {result.lunarHourYinYang}) 与三宫关系：
              </p>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 2 }}>
                <div>· 天宫：{result.hourTianRelation}</div>
                <div>· 地宫：{result.hourDiRelation}</div>
                <div>· 人宫：{result.hourRenRelation}</div>
              </div>
            </InfoBlock>

            {/* 六亲推演 */}
            <InfoBlock title="六亲推演">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                {Object.entries(result.liuQin).map(([name, info]) => (
                  <div key={name} style={{
                    padding: 12, borderRadius: 10, border: "1px solid rgba(51,51,51,0.06)",
                    background: "var(--surface-strong)",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>
                      天：{info.tian} · 地：{info.di} · 人：{info.ren}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6 }}>{info.meaning}</div>
                  </div>
                ))}
              </div>
            </InfoBlock>

            {/* 掌诀详解 */}
            <InfoBlock title="三宫掌诀详解">
              {[result.tianGong, result.diGong, result.renGong].filter((v, i, a) => a.indexOf(v) === i).map((gong) => {
                const detail = PALM_MEANING_QUICK[gong];
                if (!detail) return null;
                return (
                  <div key={gong} style={{
                    padding: 12, borderRadius: 10, marginBottom: 8,
                    border: `1px solid ${detail.nature.includes("凶") ? "rgba(212,65,21,0.12)" : "rgba(46,142,71,0.12)"}`,
                    background: detail.nature.includes("凶") ? "rgba(212,65,21,0.03)" : "rgba(46,142,71,0.03)",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                      {gong} <span style={{ color: NATURE_COLOR[detail.nature === "大凶" ? "大凶" : detail.nature === "凶" ? "凶" : "吉"], fontSize: 13 }}>({detail.nature})</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.8 }}>{detail.detail}</div>
                  </div>
                );
              })}
            </InfoBlock>
          </div>
        )}
      </main>
    </div>
  );
}

// 快速掌诀映射（用于UI渲染）
const PALM_MEANING_QUICK: Record<string, { nature: string; brief: string; detail: string }> = {
  "大安": { nature: "吉", brief: "身未动，平安稳定。", detail: "大安事事昌，求谋在东方。失物不远去，宅舍保安康。行人身未动，病者主无妨。将军回田野，仔细与推详。" },
  "留连": { nature: "凶", brief: "事难成，拖延反复。", detail: "留连事难成，求谋日不明。官事宜迟缓，去者未回程。失物南方见，急讨方称心。更须防口舌，人口且平平。" },
  "速喜": { nature: "吉", brief: "喜事临，迅速有成。", detail: "速喜喜来临，求财向南行。失物申午见，行人路上寻。官事有福德，病者无祸侵。田宅六畜吉，行人有信音。" },
  "赤口": { nature: "凶", brief: "口舌争，官非破财。", detail: "赤口主口舌，官非切要防。失物急去寻，行人有惊慌。鸡犬多作怪，病者出西方。更须防咒诅，恐怕染瘟殃。" },
  "小吉": { nature: "吉", brief: "和合吉，万事顺利。", detail: "小吉最吉昌，路上好商量。阳人来报喜，失物在坤方。行人立便至，交关真是强。凡事皆和合，病者祷上苍。" },
  "空亡": { nature: "大凶", brief: "事不牢，谋事落空。", detail: "空亡事不长，阴人多乖张。求财无利益，行人有灾殃。失物寻不见，官事主刑伤。病人逢暗鬼，禳解保安康。" },
};

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "16px 18px", marginBottom: 16, borderRadius: 12,
      background: "rgba(51,51,51,0.015)", border: "1px solid rgba(51,51,51,0.06)",
    }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
  );
}
