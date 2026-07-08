"use client";

import { astro } from "iztro";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateZiweiAnalysis } from "../domain/ziweiAnalysis";
import { taibuCalculateZiwei, type ZiweiOutput } from "../lib/ziweiTaibu";import "../styles.css";

// ─── 四化映射表: 天干 → [禄星, 权星, 科星, 忌星] ───
const MUTAGEN_MAP: Record<string, [string, string, string, string]> = {
  甲: ["廉贞", "破军", "武曲", "太阳"],
  乙: ["天机", "天梁", "紫微", "太阴"],
  丙: ["天同", "天机", "文昌", "廉贞"],
  丁: ["太阴", "天同", "天机", "巨门"],
  戊: ["贪狼", "太阴", "右弼", "天机"],
  己: ["武曲", "贪狼", "天梁", "文曲"],
  庚: ["太阳", "武曲", "太阴", "天同"],
  辛: ["巨门", "太阳", "文曲", "文昌"],
  壬: ["天梁", "紫微", "左辅", "武曲"],
  癸: ["破军", "巨门", "太阴", "贪狼"],
};

const MUTAGEN_LABELS = ["禄", "权", "科", "忌"];

// 查找星曜所在的宫位
function findTargetPalace(starName: string, palaces: any[]) {
  for (const p of palaces) {
    const allStars = [...(p.majorStars || []), ...(p.minorStars || [])];
    if (allStars.some((s: any) => s.name === starName)) return p;
  }
  return null;
}

// 飞星含义描述
function getFlyDesc(mutagen: string, from: string, to: string): string {
  const pairs: Record<string, Record<string, string>> = {
    "命宫": {
      "禄": `命主主动性向${to}投放资源与情感，${to}方面易得助力。`,
      "权": `命主有掌控${to}的欲望和能力，${to}事务上态度强势。`,
      "科": `命主在${to}方面有名声或学识表现，以柔克刚。`,
      "忌": `命主对${to}执着挂碍，此处为人生课题所在。`,
    },
    "财帛宫": {
      "禄": `财力流向${to}，为${to}花钱大方，亦可通过${to}得财。`,
      "权": `用钱掌控${to}局面，财务上有话语权。`,
      "科": `在${to}方面有理财名声或靠此得名。`,
      "忌": `为${to}破财，钱财在此处易受损。`,
    },
    "夫妻宫": {
      "禄": `配偶对${to}大方投入，感情在${to}领域有甜蜜互动。`,
      "权": `配偶掌控${to}事务，感情中需给对方空间。`,
      "科": `配偶在${to}有名声或才华，感情因${to}连结。`,
      "忌": `配偶对${to}执着或忧虑，感情因此处压力。`,
    },
    "官禄宫": {
      "禄": `事业能量流向${to}，在${to}领域有工作机遇。`,
      "权": `事业掌控力体现在${to}，职场上有权威。`,
      "科": `事业名声在${to}方面，专业形象佳。`,
      "忌": `事业压力集中于${to}，此为职业短板。`,
    },
    "迁移宫": {
      "禄": `外出时在${to}方面好运，远行可得${to}之利。`,
      "权": `在外对${to}有影响力，跨地域发展有力。`,
      "科": `在外时${to}方面有口碑，出行遇贵人。`,
      "忌": `外出时${to}不顺，远行需谨慎此处。`,
    },
    "福德宫": {
      "禄": `内心喜欢投入${to}，精神享受源于${to}。`,
      "权": `思想主导${to}方向，精神层面强势。`,
      "科": `精神修养在${to}，以文雅方式应对。`,
      "忌": `内心挂碍${to}，精神压力源于此。`,
    },
  };
  
  const fromDefaults: Record<string, string> = {
    "禄": `${from}化禄入${to}，主缘分、利益、资源流向${to}。`,
    "权": `${from}化权入${to}，主掌控、权威、执行力在${to}体现。`,
    "科": `${from}化科入${to}，主名声、才华、贵人缘在${to}显现。`,
    "忌": `${from}化忌入${to}，主执着、阻碍、业力集中于${to}。`,
  };
  
  const fromTable = pairs[from];
  if (fromTable && fromTable[mutagen]) return fromTable[mutagen];
  return fromDefaults[mutagen] || `${from}化${mutagen}入${to}`;
}

// ─── Types ───

type AstrolabeData = ReturnType<typeof astro.bySolar>;
type PalaceData = AstrolabeData["palaces"][number];
type HoroscopeData = ReturnType<AstrolabeData["horoscope"]>;
type HoroscopeKey = "decadal" | "yearly" | "monthly" | "daily" | "hourly";
type ScopeType = "decadal" | "yearly" | "monthly" | "daily" | "hourly";

const HOROSCOPE_LABELS: Record<HoroscopeKey | "natal", string> = {
  natal: "本命",
  decadal: "大限",
  yearly: "流年",
  monthly: "流月",
  daily: "流日",
  hourly: "流时",
};

// ─── 运限星曜: 从 horoscopeData 获取指定宫位的流耀 ───
function getHoroscopeStarsForPalace(
  horoscopeData: HoroscopeData | null,
  level: HoroscopeKey | "natal",
  palaceIndex: number,
) {
  if (!horoscopeData || level === "natal") return [];
  const item = horoscopeData[level];
  if (!item || !item.stars) return [];
  return item.stars[palaceIndex] ?? [];
}

// ─── 三合四正索引 ───
function getTrineIndices(astroData: AstrolabeData, palaceIndex: number): number[] {
  try {
    const sp = astroData.surroundedPalaces(palaceIndex);
    return [sp.target.index, sp.opposite.index, sp.wealth.index, sp.career.index];
  } catch {
    return [palaceIndex];
  }
}

const TIME_OPTIONS = [
  { label: "子时 (23-01)", value: 0 }, { label: "丑时 (01-03)", value: 1 },
  { label: "寅时 (03-05)", value: 2 }, { label: "卯时 (05-07)", value: 3 },
  { label: "辰时 (07-09)", value: 4 }, { label: "巳时 (09-11)", value: 5 },
  { label: "午时 (11-13)", value: 6 }, { label: "未时 (13-15)", value: 7 },
  { label: "申时 (15-17)", value: 8 }, { label: "酉时 (17-19)", value: 9 },
  { label: "戌时 (19-21)", value: 10 }, { label: "亥时 (21-23)", value: 11 },
];

const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ROWS = [3, 3, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3];
const COLS = [2, 1, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3];

function gridPos(branch: string): [number, number] {
  const i = BRANCH_ORDER.indexOf(branch);
  return i === -1 ? [0, 0] : [ROWS[i], COLS[i]];
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Component ───

export function ZiweiApp() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [birthDate, setBirthDate] = useState("1990-01-01");
  const [timeIndex, setTimeIndex] = useState(0);
  const [gender, setGender] = useState("男");
  const [astroData, setAstroData] = useState<AstrolabeData | null>(null);
  const [error, setError] = useState("");
  const [horoscopeLevel, setHoroscopeLevel] = useState<HoroscopeKey | "natal">("natal");
  const [horoscopeData, setHoroscopeData] = useState<HoroscopeData | null>(null);
  const [horoscopeDate, setHoroscopeDate] = useState(todayStr());
  const [selectedPalaceIdx, setSelectedPalaceIdx] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<"stars" | "trine" | "fly">("stars");
  const [aiReading, setAiReading] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const analysis = useMemo(() => {
    if (!astroData) return null;
    return generateZiweiAnalysis(astroData);
  }, [astroData]);

  const taibuZiwei = useMemo(() => {
    if (!astroData || !birthDate) return null;
    try {
      const [y, m, d] = birthDate.split("-").map(Number);
      return taibuCalculateZiwei(y, m, d, timeIndex, gender as "男" | "女");
    } catch { return null; }
  }, [astroData, birthDate, timeIndex, gender]);

  function saveLocalHistory() {
    try {
      const raw = localStorage.getItem("mirror-ziwei-archives") || "[]";
      const list = JSON.parse(raw);
      const item = {
        id: "zw-" + Date.now(),
        type: "ziwei",
        question: birthDate + " " + ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"][timeIndex] + "时 " + gender + "命",
        createdAt: new Date().toISOString(),
      };
      list.unshift(item);
      if (list.length > 20) list.pop();
      localStorage.setItem("mirror-ziwei-archives", JSON.stringify(list));
    } catch { /* quota exceeded */ }
  }

  function checkAuth(module: string): boolean {
    try {
      const raw = localStorage.getItem("auth_info");
      if (!raw) return false;
      const info = JSON.parse(raw);
      if (new Date(info.expire_time) <= new Date()) { localStorage.removeItem("auth_info"); return false; }
      if (!info.modules || !info.modules.includes(module)) return false;
      return true;
    } catch { return false; }
  }

  const handleAIAnalysis = async () => {
    if (!astroData) return;
    if (!checkAuth("ziwei")) { router.replace("/activate"); return; }
    setAiLoading(true);
    setAiReading("");
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 60000);
      const resp = await fetch("/api/ziwei", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ astroData }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const data = await resp.json();
      setAiReading(data.text || "分析失败，请重试");
      saveLocalHistory();
    } catch {
      setAiReading("网络错误，请重试");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = astro.bySolar(birthDate, timeIndex, gender as "男" | "女");
      setAstroData(result);
      setSelectedPalaceIdx(null);
      setHoroscopeLevel("natal");
      setHoroscopeData(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "排盘出错，请检查输入");
    }
  };

  const handleHoroscope = (level: HoroscopeKey) => {
    if (!astroData) return;
    try {
      const hs = astroData.horoscope(horoscopeDate, timeIndex);
      setHoroscopeData(hs);
      setHoroscopeLevel(level);
    } catch {
      setHoroscopeData(null);
      setHoroscopeLevel(level);
    }
  };

  const selectedPalace = useMemo(() => {
    if (selectedPalaceIdx == null || !astroData) return null;
    return astroData.palaces.find((p) => p.index === selectedPalaceIdx) ?? null;
  }, [selectedPalaceIdx, astroData]);

  // Currently active palace index for the horoscope
  const activeHoroscopeIdx = useMemo(() => {
    if (!horoscopeData || horoscopeLevel === "natal") return -1;
    const item = horoscopeData[horoscopeLevel];
    return item?.index ?? -1;
  }, [horoscopeData, horoscopeLevel]);

  // 三合四正索引 (当前选中宫位)
  const trineIndices = useMemo(() => {
    if (selectedPalaceIdx == null || !astroData) return new Set<number>();
    return new Set(getTrineIndices(astroData, selectedPalaceIdx));
  }, [selectedPalaceIdx, astroData]);

  // 四化总览数据
  const mutagenSummary = useMemo(() => {
    // 运限四化
    if (horoscopeData && horoscopeLevel !== "natal") {
      const item = horoscopeData[horoscopeLevel];
      if (item?.mutagen && item.mutagen.length >= 4) {
        return {
          heavenlyStem: item.heavenlyStem,
          stars: item.mutagen.slice(0, 4) as string[],
          label: HOROSCOPE_LABELS[horoscopeLevel],
        };
      }
    }
    // 本命四化 (从出生年天干推算)
    if (astroData && horoscopeLevel === "natal") {
      const yearStem = (astroData as any).chineseDate?.[0] ?? "";
      const stars = MUTAGEN_MAP[yearStem];
      if (stars) {
        return {
          heavenlyStem: yearStem,
          stars: stars as unknown as string[],
          label: "本命",
        };
      }
    }
    return null;
  }, [horoscopeData, horoscopeLevel, astroData]);

  if (!mounted) {
    return <div className="app-shell"><header className="topbar">
      <a className="brand" href="/"><span>观真</span><small>Truthful Hexagram</small></a>
      <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a className="active" href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a></nav>
      <a className="profile-pill" href="/activate">激活密钥 / 我的权限</a>
    </header><main className="main-flow" /></div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span><small>Truthful Hexagram</small></a>
        <nav className="desktop-nav"><a href="/">首页</a><a href="/liuyao">六爻</a><a className="active" href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a></nav>
        <a className="profile-pill" href="/activate">激活密钥 / 我的权限</a>
      </header>
      <main className="main-flow">
        {/* Hero + Form */}
        <section className="ziwei-hero">
          <h1>紫微斗数</h1>
          <p>命盘排盘 · 十二宫 · 四化飞星 · 大限流年</p>
        </section>
        <form className="ziwei-form" onSubmit={handleSubmit}>
          <div className="ziwei-form-row">
            <label><span>出生日期（公历）</span><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></label>
            <label><span>出生时辰</span><select value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}>{TIME_OPTIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></label>
            <label><span>性别</span><select value={gender} onChange={(e) => setGender(e.target.value)}><option value="男">男</option><option value="女">女</option></select></label>
            <button type="submit" className="ziwei-submit">开始排盘</button>
          </div>
          {error && <p className="ziwei-error">{error}</p>}
        </form>

        {astroData && (
          <section className="ziwei-chart-wrap">
            {/* Summary Bar */}
            <div className="ziwei-summary">
              <span>公历 {astroData.solarDate}</span>
              <span>农历 {astroData.lunarDate}</span>
              <span>时辰 {astroData.time}</span>
              <span>五行局 {astroData.fiveElementsClass}</span>
              <span>命主 {astroData.soul}</span>
              <span>身主 {astroData.body}</span>
            </div>

            {/* Horoscope Tabs */}
            <div className="ziwei-tabs">
              {(["natal", "decadal", "yearly", "monthly", "daily", "hourly"] as const).map((level) => (
                <button
                  key={level}
                  className={`ziwei-tab${horoscopeLevel === level ? " active" : ""}`}
                  onClick={() => {
                    if (level === "natal") {
                      setHoroscopeLevel("natal");
                      setHoroscopeData(null);
                    } else {
                      handleHoroscope(level);
                    }
                  }}
                >
                  {HOROSCOPE_LABELS[level]}
                </button>
              ))}
            </div>

            {/* 四化飞星总览 (非本命时显示) */}
            {mutagenSummary && (
              <div className="ziwei-mutagen-bar">
                <span className="ziwei-mutagen-stem">{mutagenSummary.label} · {mutagenSummary.heavenlyStem}干四化</span>
                {MUTAGEN_LABELS.map((label, i) => (
                  <span key={label} className={`ziwei-mutagen-item mutagen-${label}`}>
                    <em>{label}</em>{mutagenSummary.stars[i] ?? "—"}
                  </span>
                ))}
              </div>
            )}

            {/* Horoscope Date Picker */}
            {horoscopeLevel !== "natal" && (
              <div className="ziwei-horoscope-date">
                <label>
                  <span>运限日期</span>
                  <input type="date" value={horoscopeDate} onChange={(e) => setHoroscopeDate(e.target.value)} />
                </label>
                <button className="ziwei-submit" onClick={() => handleHoroscope(horoscopeLevel as HoroscopeKey)}>
                  更新运限
                </button>
              </div>
            )}

            {/* Chart + Detail Layout */}
            <div className="ziwei-chart-area">
              {/* 12 Palace Grid */}
              <div className="ziwei-grid">
                {astroData.palaces.map((palace) => {
                  const [row, col] = gridPos(palace.earthlyBranch);
                  const isActive = horoscopeData && activeHoroscopeIdx === palace.index;
                  const isSelected = selectedPalaceIdx === palace.index;
                  const isTrine = selectedPalaceIdx != null && trineIndices.has(palace.index);
                  const isSoul = astroData.earthlyBranchOfSoulPalace === palace.earthlyBranch;
                  const isBody = astroData.earthlyBranchOfBodyPalace === palace.earthlyBranch;

                  // Get horoscope stars for this palace
                  const hsStars = getHoroscopeStarsForPalace(horoscopeData, horoscopeLevel, palace.index);

                  return (
                    <div
                      key={palace.index}
                      className={`ziwei-palace${isActive ? " is-active" : ""}${isSelected ? " is-selected" : ""}${isTrine && !isSelected ? " is-trine" : ""}${isSoul ? " is-soul" : ""}${isBody ? " is-body" : ""}`}
                      style={{ gridRow: row + 1, gridColumn: col + 1 }}
                      onClick={() => setSelectedPalaceIdx(isSelected ? null : palace.index)}
                    >
                      <div className="ziwei-palace-header">
                        <span className="ziwei-palace-name">
                          {palace.name}
                          {isBody && <sup>身</sup>}
                          {isSoul && !isBody && <sup>命</sup>}
                        </span>
                        <span className="ziwei-palace-stem-branch">{palace.heavenlyStem}{palace.earthlyBranch}</span>
                      </div>
                      <div className="ziwei-palace-decadal">
                        {palace.decadal.range[0]}–{palace.decadal.range[1]}岁
                      </div>
                      <div className="ziwei-palace-stars">
                        {/* 本命主星 (始终显示) */}
                        {palace.majorStars.map((s, i) => (
                          <span key={i} className={`ziwei-star major${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                            {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                          </span>
                        ))}
                        {palace.minorStars.map((s, i) => (
                          <span key={`mi-${i}`} className={`ziwei-star minor${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                            {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                          </span>
                        ))}
                        {/* 运限流耀 (非本命时额外显示) */}
                        {horoscopeLevel !== "natal" && hsStars.length > 0 && (
                          <>
                            <div className="ziwei-star-separator" />
                            {hsStars.map((s: any, i: number) => (
                              <span key={`hs-${i}`} className={`ziwei-star horoscope${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                                {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                      <div className="ziwei-palace-misc">
                        {palace.changsheng12 && <span>{palace.changsheng12}</span>}
                      </div>
                    </div>
                  );
                })}
                {/* Center */}
                <div className="ziwei-center">
                  <span className="ziwei-center-title">
                    {horoscopeLevel !== "natal" ? HOROSCOPE_LABELS[horoscopeLevel] : "紫微斗数"}
                  </span>
                  <span className="ziwei-center-info">{astroData.zodiac} · {astroData.sign}</span>
                </div>
              </div>

              {/* Detail Sidebar */}
              {selectedPalace && (
                <div className="ziwei-detail">
                  <div className="ziwei-detail-tabs">
                    {(["stars", "trine", "fly"] as const).map((t) => (
                      <button key={t} className={`ziwei-dtab${detailTab === t ? " active" : ""}`} onClick={() => setDetailTab(t)}>
                        {t === "stars" ? "宫位星曜" : t === "trine" ? "三方四正" : "四化飞星"}
                      </button>
                    ))}
                  </div>

                  {detailTab === "stars" && (
                    <div className="ziwei-detail-content">
                      <h3>{selectedPalace.name} <small>{selectedPalace.heavenlyStem}{selectedPalace.earthlyBranch}</small></h3>
                      {selectedPalace.majorStars.length > 0 && (
                        <div className="ziwei-detail-group">
                          <h4>主星</h4>
                          {selectedPalace.majorStars.map((s, i) => (
                            <div key={i} className="ziwei-detail-star">
                              <span className={`ziwei-star major${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                                {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                              </span>
                              {s.brightness && <span className="ziwei-brightness">{s.brightness}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedPalace.minorStars.length > 0 && (
                        <div className="ziwei-detail-group">
                          <h4>辅星</h4>
                          {selectedPalace.minorStars.map((s, i) => (
                            <div key={i} className="ziwei-detail-star">
                              <span className={`ziwei-star minor${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                                {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedPalace.changsheng12 && (
                        <div className="ziwei-detail-group"><h4>长生十二神</h4><span>{selectedPalace.changsheng12}</span></div>
                      )}
                    </div>
                  )}

                  {detailTab === "trine" && (
                    <div className="ziwei-detail-content">
                      <h3>三方四正</h3>
                      {(() => {
                        try {
                          const sp = astroData.surroundedPalaces(selectedPalaceIdx!);
                          const entries = [
                            { label: "本宫", p: sp.target },
                            { label: "对宫", p: sp.opposite },
                            { label: "财帛位", p: sp.wealth },
                            { label: "官禄位", p: sp.career },
                          ];
                          return entries.map(({ label, p }) => (
                            <div key={label} className="ziwei-detail-group">
                              <h4>{label} — {p.name} ({p.heavenlyStem}{p.earthlyBranch})</h4>
                              <div className="ziwei-star-group">
                                {p.majorStars.map((s, i) => (
                                  <span key={i} className={`ziwei-star major${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                                    {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                                  </span>
                                ))}
                                {p.minorStars.map((s, i) => (
                                  <span key={`mi-${i}`} className={`ziwei-star minor${s.mutagen ? ` mutagen-${s.mutagen}` : ""}`}>
                                    {s.name}{s.mutagen && <em>{s.mutagen}</em>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ));
                        } catch { return <p>无法获取三方四正数据</p>; }
                      })()}

                      {/* 宫干四化飞星 */}
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(51,51,51,0.08)" }}>
                        <h3 style={{ marginBottom: 12 }}>宫干四化飞星</h3>
                        <p className="ziwei-hint">此宫天干飞出四化所落的宫位与含义</p>
                        {(() => {
                          const stem = selectedPalace.heavenlyStem as string;
                          const starNames = MUTAGEN_MAP[stem];
                          if (!starNames) return <p>无法获取四化数据</p>;
                          const fromName = selectedPalace.name;
                          return MUTAGEN_LABELS.map((label, i) => {
                            const starName = starNames[i];
                            const target = findTargetPalace(starName, astroData.palaces);
                            const desc = getFlyDesc(label, fromName, target?.name || "—");
                            return (
                              <div key={label} style={{
                                padding: "10px 14px",
                                marginBottom: 8,
                                borderRadius: 10,
                                background: "rgba(51,51,51,0.03)",
                                border: "1px solid rgba(51,51,51,0.06)",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{
                                    display: "inline-block",
                                    width: 24, height: 24,
                                    borderRadius: 12,
                                    background: label === "禄" ? "#298747" : label === "权" ? "#D44115" : label === "科" ? "#317994" : "#333",
                                    color: "#fff",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    lineHeight: "24px",
                                  }}>{label}</span>
                                  <span style={{ fontSize: 14, fontWeight: 600 }}>{fromName}→{starName}→{target ? target.name : "—"}</span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6 }}>{desc}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {detailTab === "fly" && (
                    <div className="ziwei-detail-content">
                      <h3>四化飞星</h3>
                      <p className="ziwei-hint">点击宫位查看该宫天干飞出的四化星落于何处</p>
                      {(() => {
                        try {
                          const stem = selectedPalace.heavenlyStem as string;
                          const starNames = MUTAGEN_MAP[stem];
                          if (!starNames) return <p>无法获取四化数据</p>;
                          const findPalaceForStar = (starName: string) => {
                            for (const palace of astroData.palaces) {
                              const allStars = [...palace.majorStars, ...palace.minorStars];
                              if (allStars.some(s => s.name === starName)) return palace;
                            }
                            return null;
                          };
                          return MUTAGEN_LABELS.map((label, i) => {
                            const starName = starNames[i];
                            const palace = findPalaceForStar(starName);
                            const palaceInfo = palace ? `${palace.name} (${palace.heavenlyStem}${palace.earthlyBranch})` : null;
                            return (
                              <div key={label} className="ziwei-detail-group">
                                <h4>{stem}干化{label}</h4>
                                {palaceInfo ? (
                                  <span>{palaceInfo}</span>
                                ) : (
                                  <span>{starName}</span>
                                )}
                              </div>
                            );
                          });
                        } catch { return <p>无法获取四化数据</p>; }
                      })()}

                      {/* 宫干四化飞星 */}
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(51,51,51,0.08)" }}>
                        <h3 style={{ marginBottom: 12 }}>宫干四化飞星</h3>
                        <p className="ziwei-hint">此宫天干飞出四化所落的宫位与含义</p>
                        {(() => {
                          const stem = selectedPalace.heavenlyStem as string;
                          const starNames = MUTAGEN_MAP[stem];
                          if (!starNames) return <p>无法获取四化数据</p>;
                          const fromName = selectedPalace.name;
                          return MUTAGEN_LABELS.map((label, i) => {
                            const starName = starNames[i];
                            const target = findTargetPalace(starName, astroData.palaces);
                            const desc = getFlyDesc(label, fromName, target?.name || "—");
                            return (
                              <div key={label} style={{
                                padding: "10px 14px",
                                marginBottom: 8,
                                borderRadius: 10,
                                background: "rgba(51,51,51,0.03)",
                                border: "1px solid rgba(51,51,51,0.06)",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{
                                    display: "inline-block",
                                    width: 24, height: 24,
                                    borderRadius: 12,
                                    background: label === "禄" ? "#298747" : label === "权" ? "#D44115" : label === "科" ? "#317994" : "#333",
                                    color: "#fff",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    lineHeight: "24px",
                                  }}>{label}</span>
                                  <span style={{ fontSize: 14, fontWeight: 600 }}>{fromName}→{starName}→{target ? target.name : "—"}</span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6 }}>{desc}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ─── 命盘分析面板 ─── */}
            {analysis && (
              <div className="ziwei-analysis-panel">
                {/* 命盘概要 */}
                <div className="ziwei-analysis-section">
                  <h3>命盘概要</h3>
                  <div className="ziwei-info-grid">
                    <div className="ziwei-info-card">
                      <span className="ziwei-info-label">五行局</span>
                      <span className="ziwei-info-value">{analysis.fiveElementsClass}</span>
                      <p className="ziwei-info-desc">{analysis.fiveElementsNote}</p>
                    </div>
                    <div className="ziwei-info-card">
                      <span className="ziwei-info-label">命主</span>
                      <span className="ziwei-info-value">{analysis.soul}</span>
                      <p className="ziwei-info-desc">{analysis.soulNote}</p>
                    </div>
                    <div className="ziwei-info-card">
                      <span className="ziwei-info-label">身主</span>
                      <span className="ziwei-info-value">{analysis.body}</span>
                      <p className="ziwei-info-desc">{analysis.bodyNote}</p>
                    </div>
                  </div>
                  {analysis.soulBodyAnalysis && (
                    <div className="ziwei-analysis-block">
                      <h4>命身双主</h4>
                      <p>{analysis.soulBodyAnalysis}</p>
                    </div>
                  )}
                  {taibuZiwei && (
                    <div className="ziwei-analysis-block">
                      <h4>命主星 · 身主星（iztro补充）</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                        <div>
                          <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>命主星</span>
                          <div style={{ color: "var(--ink)", fontWeight: 600 }}>{taibuZiwei.lifeMasterStar || "-"}</div>
                        </div>
                        <div>
                          <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>身主星</span>
                          <div style={{ color: "var(--ink)", fontWeight: 600 }}>{taibuZiwei.bodyMasterStar || "-"}</div>
                        </div>
                      </div>
                      {taibuZiwei.smallLimit && taibuZiwei.smallLimit.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>小限</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", fontSize: 11, marginTop: 4 }}>
                            {taibuZiwei.smallLimit.map((sl, i) => (
                              <span key={i} style={{ color: "var(--ink)" }}>{sl.palaceName}: {sl.ages.join(",")}岁</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {taibuZiwei.scholarStars && taibuZiwei.scholarStars.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>博士十二星</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", fontSize: 11, marginTop: 4 }}>
                            {taibuZiwei.scholarStars.map((ss, i) => (
                              <span key={i} style={{ color: "var(--ink)" }}>{ss.starName}({ss.palaceName})</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 生年四化分析 */}
                {analysis.birthMutagen.items.length > 0 && (
                  <div className="ziwei-analysis-section">
                    <h3>生年四化分析</h3>
                    <p className="ziwei-analysis-subtitle">{analysis.birthMutagen.stem}干四化 · 禄权科忌</p>
                    <div className="ziwei-mutagen-grid">
                      {analysis.birthMutagen.items.map((item, i) => (
                        <div key={i} className={`ziwei-mutagen-card mutagen-${item.label}`}>
                          <div className="ziwei-mutagen-head">
                            <span className="ziwei-mutagen-type">化{item.label}</span>
                            <span className="ziwei-mutagen-star">{item.star}</span>
                          </div>
                          <span className="ziwei-mutagen-palace">落{analysis.palaceAnalyses ? "" : ""}{item.palace}</span>
                          <p className="ziwei-mutagen-note">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 思象格局分析 */}
                {analysis.starCombinations.length > 0 && (
                  <div className="ziwei-analysis-section">
                    <h3>思象格局分析</h3>
                    <div className="ziwei-pattern-list">
                      {analysis.starCombinations.map((p, i) => (
                        <div key={i} className={`ziwei-pattern-item level-${p.level}`}>
                          <span className="ziwei-pattern-badge">{p.level === "good" ? "吉" : p.level === "watch" ? "警" : "平"}</span>
                          <div>
                            <strong>{p.title}</strong>
                            <p>{p.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 关键宫位分析 */}
                {analysis.keyPalaces.length > 0 && (
                  <div className="ziwei-analysis-section">
                    <h3>关键宫位分析</h3>
                    <div className="ziwei-palace-list">
                      {analysis.keyPalaces.map((p, i) => (
                        <div key={i} className={`ziwei-palace-item level-${p.level}`}>
                          <div className="ziwei-palace-item-head">
                            <span className="ziwei-palace-item-name">{p.name}</span>
                            <span className="ziwei-palace-item-stars">{p.stars}</span>
                          </div>
                          <p className="ziwei-palace-item-desc">{p.desc}</p>
                          <p className="ziwei-palace-item-analysis">{p.analysis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 大限分析 */}
                {analysis.decadals.length > 0 && (
                  <div className="ziwei-analysis-section">
                    <h3>大限走势</h3>
                    <div className="ziwei-decadal-list">
                      {analysis.decadals.map((d, i) => (
                        <div key={i} className="ziwei-decadal-item">
                          <span className="ziwei-decadal-range">{d.ageRange}</span>
                          <span className="ziwei-decadal-palace">{d.palace}</span>
                          <span className="ziwei-decadal-stars">{d.stars}</span>
                          <span className="ziwei-decadal-note">{d.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 宫干四化飞星 */}
                {analysis.palaceMutagen && analysis.palaceMutagen.length > 0 && (
                  <div className="ziwei-analysis-section">
                    <h3>宫干四化飞星</h3>
                    <p className="ziwei-analysis-subtitle">各宫天干飞出四化星落于何宫</p>
                    <div className="ziwei-mutagen-grid">
                      {analysis.palaceMutagen.slice(0, 16).map((item, i) => (
                        <div key={i} className={`ziwei-mutagen-card mutagen-${item.label}`}>
                          <div className="ziwei-mutagen-head">
                            <span className="ziwei-mutagen-type">{item.fromPalace} → 化{item.label}</span>
                            <span className="ziwei-mutagen-star">{item.star}</span>
                          </div>
                          <span className="ziwei-mutagen-palace">落 {item.toPalace}</span>
                          <p className="ziwei-mutagen-note">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 盘面分析汇总 */}
                <div className="ziwei-analysis-section">
                  <h3>盘面分析汇总</h3>
                  <div className="ziwei-summary-box">
                    <p>{analysis.summary}</p>
                  </div>
                </div>

                {/* 传统格局 */}
                {analysis.patterns.filter(p => p.title.includes("五行局") || p.title.includes("命主") || p.title.includes("身主")).length === 0 && analysis.patterns.length > 0 && (
                  <div className="ziwei-analysis-section">
                    <h3>格局分析</h3>
                    <div className="ziwei-pattern-list">
                      {analysis.patterns.map((p, i) => (
                        <div key={i} className={`ziwei-pattern-item level-${p.level}`}>
                          <span className="ziwei-pattern-badge">{p.level === "good" ? "吉" : p.level === "watch" ? "警" : "平"}</span>
                          <div>
                            <strong>{p.title}</strong>
                            <p>{p.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 批注按钮 */}
                <div className="ziwei-ai-section">
                  <button
                    className="ziwei-ai-btn"
                    onClick={handleAIAnalysis}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "分析中..." : "🧠 开始批注"}
                  </button>
                  {aiReading && (
                    <div className="ziwei-ai-result">
                      <div className="ziwei-ai-result-header">AI 全面解析</div>
                      <div className="ziwei-ai-result-body">{aiReading}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </section>
        )}
      </main>
    </div>
  );
}
