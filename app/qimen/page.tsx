"use client";

import { useState } from "react";
import { runQimen, type QimenInput, type QimenOutput } from "../../src/lib/taibu";
import "../../src/styles.css";
import { TIME_OPTIONS, HOUR_STARTS } from "../ziwei-time";

const PALACE_LAYOUT = [4, 9, 2, 3, 5, 7, 8, 1, 6];

export default function QimenPage() {
  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [timeIndex, setTimeIndex] = useState(0);
  const [gender, setGender] = useState("男");
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  const [question, setQuestion] = useState("");
  const [panType, setPanType] = useState<"zhuan">("zhuan");
  const [juMethod, setJuMethod] = useState<"chaibu" | "maoshan">("chaibu");
  const [result, setResult] = useState<QimenOutput | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [y, m, d] = birthDate.split("-").map(Number);
    const h = HOUR_STARTS[timeIndex] || 0;
    const input: QimenInput = {
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: 0,
      timezone,
      question: question || undefined,
      panType,
      juMethod,
    };
    const output = runQimen(input);
    setResult(output);
    setAiResult(null);
  }

  async function handleAiAnalyze() {
    if (!result) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/qimen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { year, month, day, hour, minute, timezone, question, panType, juMethod },
          output: result,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiResult(data.result ?? data.analysis ?? JSON.stringify(data));
    } catch (err) {
      setAiResult(`AI 解读请求失败：${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setAiLoading(false);
    }
  }

  function getPalaceByIndex(index: number) {
    return result?.palaces.find((p) => p.palaceIndex === index);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span><small>Truthful Hexagram</small></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a className="active" href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a></nav>
        <a className="profile-pill" href="/activate">激活密钥 / 我的权限</a>
      </header>

      <main className="main-flow">
        <div className="qimen-hero">
          <h1 className="qimen-title">奇门遁甲</h1>
          <p className="qimen-subtitle">九天玄女所授，轩辕黄帝伐蚩尤，命风后演绎成文。古称帝王之学，运筹帷幄，决胜千里。</p>
        </div>

        <form className="ziwei-form" onSubmit={handleSubmit}>
          <div className="ziwei-form-row">
            <label><span>出生日期（公历）</span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></label>
            <label><span>出生时辰</span><select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>{TIME_OPTIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></label>
            <label><span>性别</span><select value={gender} onChange={(e) => setGender(e.target.value)}><option value="男">男</option><option value="女">女</option></select></label>
            <label><span>时区</span><input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Shanghai" /></label>
            <label><span>排盘方式</span><select value={panType} onChange={(e) => setPanType(e.target.value as "zhuan")}><option value="zhuan">转盘</option></select></label>
            <label><span>局法</span><select value={juMethod} onChange={(e) => setJuMethod(e.target.value as "chaibu" | "maoshan")}><option value="chaibu">拆补</option><option value="maoshan">茅山</option></select></label>
            <button type="submit" className="ziwei-submit">开始排盘</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="field-label">所问何事</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="可选..." rows={2}
              style={{ width: "100%", border: "1px solid var(--ink-faint)", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "var(--surface-strong)", color: "var(--ink)", resize: "vertical", marginTop: 4 }} />
          </div>
        </form>

        {result && (
          <div className="qimen-result">
            <div className="qimen-info-bar">
              <div className="qimen-info-item">
                <span className="qimen-info-label">公历</span>
                <span>{result.dateInfo.solarDate}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">农历</span>
                <span>{result.dateInfo.lunarDate}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">节气</span>
                <span>{result.dateInfo.solarTerm}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">局数</span>
                <span>{result.dunType === "yang" ? "阳" : "阴"}遁{result.juNumber}局 · {result.yuan}元</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">旬首</span>
                <span>{result.xunShou}</span>
              </div>
            </div>

            <div className="qimen-info-bar">
              <div className="qimen-info-item">
                <span className="qimen-info-label">年柱</span>
                <span>{result.siZhu.year}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">月柱</span>
                <span>{result.siZhu.month}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">日柱</span>
                <span>{result.siZhu.day}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">时柱</span>
                <span>{result.siZhu.hour}</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">值符</span>
                <span>{result.zhiFu.star}（{result.palaces.find((p) => p.palaceIndex === result.zhiFu.palace)?.palaceName ?? result.zhiFu.palace}宫）</span>
              </div>
              <div className="qimen-info-item">
                <span className="qimen-info-label">值使</span>
                <span>{result.zhiShi.gate}（{result.palaces.find((p) => p.palaceIndex === result.zhiShi.palace)?.palaceName ?? result.zhiShi.palace}宫）</span>
              </div>
            </div>

            <div className="qimen-grid">
              {PALACE_LAYOUT.map((idx) => {
                const palace = getPalaceByIndex(idx);
                if (!palace) return null;
                const isCenter = idx === 5;
                const flags: string[] = [];
                if (palace.isKongWang) flags.push("空亡");
                if (palace.isYiMa) flags.push("驿马");
                if (palace.isRuMu) flags.push("入墓");
                return (
                  <div key={idx} className={`qimen-palace${isCenter ? " qimen-palace-center" : ""}`}>
                    <div className="qimen-palace-header">
                      <span className="qimen-palace-name">{palace.palaceName}</span>
                      <span className="qimen-palace-direction">{palace.direction} · {palace.element}</span>
                    </div>
                    <div className="qimen-palace-body">
                      <div className="qimen-palace-stems">
                        <span className="qimen-stem-heaven" title="天盘干">{palace.heavenStem}</span>
                        <span className="qimen-stem-earth" title="地盘干">{palace.earthStem}</span>
                      </div>
                      <div className="qimen-palace-row">
                        <span className="qimen-palace-tag qimen-tag-star">{palace.star}</span>
                        <span className="qimen-palace-tag qimen-tag-gate">{palace.gate}</span>
                      </div>
                      <div className="qimen-palace-row">
                        <span className="qimen-palace-deity">{palace.deity}</span>
                      </div>
                      {palace.formations.length > 0 && (
                        <div className="qimen-palace-formations">
                          {palace.formations.map((f) => (
                            <span key={f} className="qimen-formation-tag">{f}</span>
                          ))}
                        </div>
                      )}
                      {flags.length > 0 && (
                        <div className="qimen-palace-flags">
                          {flags.map((f) => (
                            <span key={f} className="qimen-flag">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="qimen-ai-section">
              <button className="qimen-ai-btn" onClick={handleAiAnalyze} disabled={aiLoading}>
                {aiLoading ? "解读中..." : "AI 解读"}
              </button>
              {aiResult && (
                <div className="qimen-ai-result">
                  <div className="qimen-ai-result-header">AI 解读</div>
                  <div className="qimen-ai-result-body">{aiResult}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <footer style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 12, marginTop: 60, paddingBottom: 40 }}>
          仅作文化研究与体验，不构成任何决策建议
        </footer>
      </main>

      <style jsx>{`
        .qimen-hero {
          text-align: center;
          padding: 18px 0 12px;
        }

        .qimen-title {
          font-size: 42px;
          font-weight: 300;
          letter-spacing: 0.16em;
          margin: 0;
          color: var(--ink);
        }

        .qimen-subtitle {
          max-width: 520px;
          margin: 12px auto 0;
          font-size: 13px;
          color: var(--ink-soft);
          line-height: 1.9;
        }

        .qimen-form {
          margin: 20px 0 28px;
          padding: 24px;
          border: 1px solid rgba(51, 51, 51, 0.1);
          border-radius: 14px;
          background: var(--surface);
          box-shadow: var(--shadow);
        }

        .qimen-form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .qimen-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .qimen-field span {
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 500;
        }

        .qimen-field input,
        .qimen-field select,
        .qimen-field textarea {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid rgba(51, 51, 51, 0.16);
          border-radius: 10px;
          background: var(--surface-strong);
          color: var(--ink);
          outline: none;
          font-size: 14px;
          transition: border-color 0.15s;
        }

        .qimen-field textarea {
          padding: 10px 12px;
          resize: vertical;
          min-height: 60px;
        }

        .qimen-field input:focus,
        .qimen-field select:focus,
        .qimen-field textarea:focus {
          border-color: rgba(212, 65, 21, 0.5);
          box-shadow: 0 0 0 3px rgba(212, 65, 21, 0.08);
        }

        .qimen-field-wide {
          grid-column: 1 / -1;
          margin-top: 2px;
        }

        .qimen-submit {
          display: block;
          margin: 20px auto 0;
          padding: 12px 52px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--ink), #555);
          color: var(--surface-strong);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 14px rgba(51, 51, 51, 0.15);
        }

        .qimen-submit:hover {
          background: linear-gradient(135deg, #222, var(--ink));
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(51, 51, 51, 0.22);
        }

        .qimen-result {
          margin-top: 28px;
        }

        .qimen-info-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 18px;
          padding: 14px 18px;
          border: 1px solid rgba(51, 51, 51, 0.08);
          border-radius: 12px;
          background: rgba(242, 237, 229, 0.6);
          margin-bottom: 12px;
        }

        .qimen-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--ink);
        }

        .qimen-info-label {
          color: var(--ink-soft);
          font-size: 12px;
          white-space: nowrap;
        }

        .qimen-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 20px 0;
        }

        .qimen-palace {
          border: 1px solid rgba(51, 51, 51, 0.12);
          border-radius: 12px;
          background: var(--surface);
          padding: 14px;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: box-shadow 0.2s;
        }

        .qimen-palace:hover {
          box-shadow: 0 4px 20px rgba(51, 51, 51, 0.08);
        }

        .qimen-palace-center {
          background: rgba(212, 65, 21, 0.04);
          border-color: rgba(212, 65, 21, 0.2);
        }

        .qimen-palace-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .qimen-palace-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: 0.04em;
        }

        .qimen-palace-direction {
          font-size: 11px;
          color: var(--ink-soft);
        }

        .qimen-palace-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .qimen-palace-stems {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .qimen-stem-heaven {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(212, 65, 21, 0.1);
          color: var(--gold);
          font-size: 15px;
          font-weight: 700;
        }

        .qimen-stem-earth {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: rgba(51, 51, 51, 0.06);
          color: var(--ink-soft);
          font-size: 13px;
          font-weight: 600;
        }

        .qimen-palace-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .qimen-palace-tag {
          font-size: 14px;
          font-weight: 600;
        }

        .qimen-tag-star {
          color: var(--gold);
        }

        .qimen-tag-gate {
          color: #317994;
        }

        .qimen-palace-deity {
          font-size: 13px;
          color: #555;
          font-weight: 500;
        }

        .qimen-palace-formations {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .qimen-formation-tag {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 20px;
          background: rgba(41, 135, 71, 0.1);
          color: #298747;
          font-size: 11px;
          font-weight: 600;
        }

        .qimen-palace-flags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }

        .qimen-flag {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 20px;
          background: rgba(212, 65, 21, 0.1);
          color: var(--gold);
          font-size: 11px;
          font-weight: 600;
        }

        .qimen-ai-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px 0 10px;
        }

        .qimen-ai-btn {
          padding: 12px 40px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #D44115, #e85d3a);
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(212, 65, 21, 0.25);
        }

        .qimen-ai-btn:hover {
          background: linear-gradient(135deg, #c23a12, #D44115);
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(212, 65, 21, 0.35);
        }

        .qimen-ai-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .qimen-ai-result {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          overflow: hidden;
        }

        .qimen-ai-result-header {
          padding: 12px 18px;
          background: linear-gradient(135deg, #317994, #3a8ba8);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .qimen-ai-result-body {
          padding: 18px 20px;
          font-size: 14px;
          color: var(--ink);
          line-height: 1.9;
          white-space: pre-wrap;
          max-height: 600px;
          overflow-y: auto;
          background: var(--surface-strong);
        }

        @media (max-width: 768px) {
          .qimen-form-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .qimen-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }

          .qimen-palace {
            padding: 8px;
            min-height: auto;
          }

          .qimen-palace-name {
            font-size: 13px;
          }

          .qimen-stem-heaven {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }

          .qimen-stem-earth {
            width: 22px;
            height: 22px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
