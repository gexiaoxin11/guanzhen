 "use client";

import {
  Clock,
  Coins,
  Compass,
  History,
  Moon,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateLiuyao } from "../domain/liuyaoEngine";
import { buildLocalReading, describeLineStrength, inferScenario, scenarioRules } from "../domain/readingRules";
import type { LiuyaoChart, LiuyaoInput, Topic, YaoLine, YaoValue } from "../domain/types";
import { getBrowserSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { Solar } from "lunar-javascript";

type CastMode = "auto" | "manual";
type Persona = "plain" | "hermit" | "classic";
type Depth = "standard" | "deep";

type ArchiveItem = {
  id: string;
  createdAt: string;
  question: string;
  topic: Topic;
  original: string;
  changed: string;
  input: LiuyaoInput;
};

type CoinCast = {
  value: YaoValue;
  coins: Array<"字" | "背">;
};

const topicLabels: Record<Topic, string> = {
  general: "综合",
  career: "事业",
  wealth: "财运",
  love: "感情",
  health: "健康",
  lost: "失物",
  study: "学业",
  lawsuit: "官非",
};

const modeCopy: Record<CastMode, { title: string; desc: string }> = {
  auto: { title: "在线摇卦", desc: "逐次摇出六爻" },
  manual: { title: "手动选择", desc: "填写铜钱结果" },
};

const lineNames = ["初", "二", "三", "四", "五", "上"];
const valueLabels: Record<YaoValue, string> = { 6: "老阴", 7: "少阳", 8: "少阴", 9: "老阳" };
const coinPatternLabels: Record<YaoValue, string> = {
  6: "花花花",
  7: "字字花",
  8: "花花字",
  9: "字字字",
};
const starterLines: YaoValue[] = [7, 8, 7, 8, 7, 8];
const relationShort = {
  兄弟: "兄",
  子孙: "孙",
  妻财: "财",
  官鬼: "官",
  父母: "父",
} satisfies Record<YaoLine["sixRelation"], string>;

function nowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
    minute: Number(part("minute")),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function createDefaultInput(): LiuyaoInput {
  const current = nowParts();
  return {
    name: "己身",
    question: "",
    topic: "general",
    gender: "unknown",
    calendarType: "solar",
    method: "coins",
    date: current.date,
    hour: current.hour,
    minute: current.minute,
    lineValues: [],
  };
}


function saveFullRecord(id: string, chart: LiuyaoChart, readingText: string) {
  try {
    const stored = JSON.parse(localStorage.getItem("mirror-liuyao-records") || "{}");
    stored[id] = {
      chart,
      reading: readingText,
      savedAt: new Date().toISOString(),
    };
    // Limit to 50 records
    const keys = Object.keys(stored);
    if (keys.length > 50) {
      const oldest = keys.sort((a, b) => (stored[a].savedAt || "").localeCompare(stored[b].savedAt || ""))[0];
      delete stored[oldest];
    }
    localStorage.setItem("mirror-liuyao-records", JSON.stringify(stored));
  } catch { /* localStorage may be full */ }
}

function loadFullRecord(id: string): { chart: LiuyaoChart; reading: string } | null {
  try {
    const stored = JSON.parse(localStorage.getItem("mirror-liuyao-records") || "{}");
    return stored[id] || null;
  } catch {
    return null;
  }
}

export function App() {
  const [input, setInput] = useState<LiuyaoInput>(() => createDefaultInput());
  const [mode, setMode] = useState<CastMode>("auto");
  const [persona] = useState<Persona>("hermit");
  const [depth] = useState<Depth>("standard");
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);
  const [coinCasts, setCoinCasts] = useState<CoinCast[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [loadingReading, setLoadingReading] = useState(false);
  const [reading, setReading] = useState("");
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const supabaseReady = isSupabaseConfigured();
  const supabase = useMemo(() => getBrowserSupabase(), []);

  const canCalculate = input.lineValues.length === 6 && input.lineValues.every((v) => v !== undefined);
  const chart = useMemo<LiuyaoChart | null>(() => {
    if (!canCalculate) return null;
    return calculateLiuyao(input);
  }, [canCalculate, input]);

  useEffect(() => {
    const raw = localStorage.getItem("mirror-liuyao-archives");
    if (raw) setArchives(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
      if (data.session?.user) void fetchCloudArchives();
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (session?.user) void fetchCloudArchives();
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function fetchCloudArchives() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("divinations")
      .select("id, created_at, question, topic, original_name, changed_name, input_json")
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) {
      setAuthMessage(`历史读取失败：${error.message}`);
      return;
    }
    setArchives(
      (data ?? []).map((item) => ({
        id: item.id,
        createdAt: item.created_at,
        question: item.question ?? "",
        topic: item.topic ?? "general",
        original: item.original_name ?? "未排盘",
        changed: item.changed_name ?? "未排盘",
        input: item.input_json as LiuyaoInput,
      })),
    );
  }

  async function sendMagicLink() {
    if (!supabase || !authEmail.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setAuthMessage(error ? `发送失败：${error.message}` : "验证码链接已发送，请到邮箱完成登录。");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setArchives([]);
    setAuthMessage("已退出登录。");
  }

  function setQuestion(question: string) {
    setInput((current) => ({ ...current, question }));
  }

  function setTopic(topic: Topic) {
    setInput((current) => ({ ...current, topic }));
  }

  function setCastMode(nextMode: CastMode) {
    setMode(nextMode);
    setSubmitted(false);
    setReading("");
    setCoinCasts([]);
    setInput((current) => ({
      ...current,
      method: "coins",
      lineValues: nextMode === "auto" ? [] : current.lineValues.length === 6 ? current.lineValues : [],
    }));
  }

  function setCurrentBeijingTime() {
    const current = nowParts();
    setInput((value) => ({
      ...value,
      date: current.date,
      hour: current.hour,
      minute: current.minute,
    }));
  }

  function updateLine(index: number, value: YaoValue) {
    setCoinCasts([]);
    setInput((current) => {
      const values = current.lineValues.length === 6 ? current.lineValues : Array(6).fill(undefined);
      const next = [...values];
      next[index] = value;
      return { ...current, lineValues: next as YaoValue[] };
    });
  }

  function shakeHexagram() {
    if (casting) return;
    setCasting(true);
    setSubmitted(false);
    setReading("");
    const nextCast = castSingleLine();
    window.setTimeout(() => {
      setCoinCasts((current) => {
        const base = current.length >= 6 ? [] : current;
        return [...base, nextCast];
      });
      setInput((current) => {
        const base = current.lineValues.length >= 6 ? [] : current.lineValues;
        return { ...current, lineValues: [...base, nextCast.value] };
      });
      setCasting(false);
    }, 620);
  }

  async function submitReading(event: React.FormEvent) {
    event.preventDefault();
    if (!canCalculate || !chart) return;
    setSubmitted(true);
    setLoadingReading(true);
    setReading("");
    const divinationId = await saveArchive(chart);
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ question: input.question, persona, depth, chart, divinationId }),
      });
      if (!response.ok) throw new Error("AI 解读接口暂不可用");
      const data = await response.json();
      const finalText = String(data.text ?? "");
      setReading(finalText);
      saveFullRecord(divinationId, chart, finalText);
    } catch {
      const localText = buildLocalReading({ chart, question: input.question, persona, depth });
      setReading(localText);
      saveFullRecord(divinationId, chart, localText);
    } finally {
      setLoadingReading(false);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  async function saveArchive(nextChart: LiuyaoChart) {
    const item: ArchiveItem = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      question: input.question,
      topic: input.topic,
      original: nextChart.original.name,
      changed: nextChart.changed.name,
      input,
    };
    if (supabase && userEmail) {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return item.id;
      const { data, error } = await supabase
        .from("divinations")
        .insert({
          user_id: session.user.id,
          question: input.question,
          topic: input.topic,
          method: input.method,
          cast_at: nextChart.solarDate,
          line_values: input.lineValues,
          original_name: nextChart.original.name,
          changed_name: nextChart.changed.name,
          input_json: input,
          chart_json: nextChart,
        })
        .select("id")
        .single();
      if (!error) {
        await fetchCloudArchives();
        return data.id as string;
      }
      setAuthMessage(`云端保存失败：${error.message}`);
    }
    const next = [item, ...archives.filter((archive) => archive.question !== item.question)].slice(0, 24);
    setArchives(next);
    localStorage.setItem("mirror-liuyao-archives", JSON.stringify(next));
    // Also save full record with chart and reading
    return item.id;
  }

  async function deleteArchive(id: string) {
    if (supabase && userEmail) {
      const { error } = await supabase.from("divinations").delete().eq("id", id);
      if (error) {
        setAuthMessage(`删除失败：${error.message}`);
        return;
      }
      const next = archives.filter((archive) => archive.id !== id);
      setArchives(next);
      localStorage.setItem("mirror-liuyao-archives", JSON.stringify(next));
      return;
    }
    const next = archives.filter((archive) => archive.id !== id);
    setArchives(next);
    localStorage.setItem("mirror-liuyao-archives", JSON.stringify(next));
  }

  function resetAll() {
    setInput(createDefaultInput());
    setMode("auto");
    setSubmitted(false);
    setReading("");
    setLoadingReading(false);
    setCoinCasts([]);
  }

  const quickRead = chart ? buildQuickRead(chart, input.question) : null;

  return (
    <div className="app-shell">
      <TopNav
        userEmail={userEmail}
        supabaseReady={supabaseReady}
        onOpenAuth={() => setAuthOpen((open) => !open)}
      />
      <main className="main-flow">
        {authOpen && (
          <AuthPanel
            ready={supabaseReady}
            email={authEmail}
            userEmail={userEmail}
            message={authMessage}
            onEmailChange={setAuthEmail}
            onSend={sendMagicLink}
            onSignOut={signOut}
          />
        )}

        <form className={submitted ? "casting-form compact" : "casting-form"} onSubmit={submitReading}>
          <section className="form-card question-card">
            <div className="question-head">
              <label className="field-label" htmlFor="question">求测问题</label>
              <div className="topic-row">
                {(Object.entries(topicLabels) as Array<[Topic, string]>).map(([value, label]) => (
                  <button type="button" className={input.topic === value ? "topic selected" : "topic"} key={value} onClick={() => setTopic(value)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id="question"
              value={input.question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="请输入你想问的具体问题..."
              rows={2}
            />
          </section>

          <section className="form-card">
            <div className="control-row">
              <h2>起卦方式</h2>
              <div className="time-editor">
                <Clock size={14} className="time-icon" />
                <input
                    type="datetime-local"
                    value={`${input.date}T${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}`}
                    onChange={(event) => {
                      const [date, time] = event.target.value.split("T");
                      const [h, m] = (time || "00:00").split(":");
                      setInput({ ...input, date: date || input.date, hour: Number(h), minute: Number(m) });
                    }}
                  />
                <button type="button" className="time-now-btn" onClick={setCurrentBeijingTime}>当前时间</button>
              </div>
              <div className="mode-group">
                {(Object.keys(modeCopy) as CastMode[]).map((key) => (
                  <button type="button" className={mode === key ? "mode-tab selected" : "mode-tab"} key={key} onClick={() => setCastMode(key)}>
                    {modeCopy[key].title}
                  </button>
                ))}
              </div>
            </div>

            {mode === "auto" ? (
              <div className="shake-zone">
<CoinOrbit active={casting} values={input.lineValues} />
                <CastProgress casts={coinCasts} values={input.lineValues} />
                <button
                  type="button"
                  className="dark-action"
                  onClick={() => {
                    if (input.lineValues.length === 6) {
                      setConfirmReset(true);
                    } else {
                      shakeHexagram();
                    }
                  }}
                  disabled={casting}
                >
                  <Coins size={17} />
                  {casting ? `正在摇${lineNames[Math.min(input.lineValues.length, 5)]}爻` : input.lineValues.length === 6 ? "重新摇卦" : `摇${lineNames[input.lineValues.length]}爻`}
                </button>
              </div>
            ) : (
              <LinePicker mode={mode} values={input.lineValues} onChange={updateLine} />
            )}
          </section>

          {canCalculate && !submitted && (
            <section className="preview-stack">
              <HexagramPreview chart={chart} />
              {quickRead && <QuickRead quickRead={quickRead} />}
            </section>
          )}

          {canCalculate && (
            <button className="submit-action" type="submit" disabled={loadingReading}>
              开始解卦
            </button>
          )}
        </form>

        {(submitted || loadingReading) && chart && (
          <section ref={resultRef} className="result-stage">
            <div className="result-question">
              <span>问</span>
              <p>{input.question.trim() || "未填写具体问题，按当前卦象作通盘参考。"}</p>
              <button type="button" onClick={resetAll}><RotateCcw size={15} /> 再起一卦</button>
            </div>
            <HexagramPreview chart={chart} expanded />
            {quickRead && <QuickRead quickRead={quickRead} />}
            <article className="reading-card">
              <h2>解卦分析</h2>
              <div className="divider" />
              {loadingReading ? <ReadingSkeleton /> : <MarkdownLike text={reading} />}
            </article>
          </section>
        )}

        <ArchiveDock archives={archives} onDelete={deleteArchive} onLoad={(archive) => {
          window.open("/history/" + archive.id, "_blank");
        }} />
      </main>
      <MobileNav />

      {confirmReset && (
        <div className="confirm-overlay" onClick={() => setConfirmReset(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>确定重新摇卦吗？重新摇卦后当前卦被清空。</p>
            <div className="confirm-actions">
              <button type="button" onClick={() => setConfirmReset(false)}>不重新摇</button>
              <button type="button" className="danger" onClick={() => { setConfirmReset(false); setInput((c) => ({ ...c, lineValues: [] })); setCoinCasts([]); setSubmitted(false); setReading(""); }}>确定重摇</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopNav({ userEmail, supabaseReady, onOpenAuth }: { userEmail: string | null; supabaseReady: boolean; onOpenAuth: () => void }) {
  const nav = ["六爻", "紫微"];
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <span>观真</span>
        <small>Truthful Hexagram</small>
      </a>
      <nav className="desktop-nav">
        {nav.map((item) => (
          <a
            className={item === "六爻" ? "active" : ""}
            href={item === "六爻" ? "/liuyao" : item === "紫微" ? "/ziwei" : "#"}
            key={item}
          >{item}</a>
        ))}
      </nav>
      <button className="profile-pill" type="button" onClick={onOpenAuth}>个人中心</button>
    </header>
  );
}

function AuthPanel({
  ready,
  email,
  userEmail,
  message,
  onEmailChange,
  onSend,
  onSignOut,
}: {
  ready: boolean;
  email: string;
  userEmail: string | null;
  message: string;
  onEmailChange: (value: string) => void;
  onSend: () => void;
  onSignOut: () => void;
}) {
  return (
    <section className="auth-panel">
      <div>
        <h2>账户</h2>
        <p>{ready ? "邮箱验证码登录后，卦例会保存到你的云端历史。" : "尚未配置 Supabase，当前历史仅保存在本机浏览器。"}</p>
      </div>
      {ready && userEmail ? (
        <div className="auth-actions">
          <span>{userEmail}</span>
          <button type="button" onClick={onSignOut}>退出</button>
        </div>
      ) : ready ? (
        <div className="auth-actions">
          <input value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="you@example.com" type="email" />
          <button type="button" onClick={onSend}>发送验证码</button>
        </div>
      ) : null}
      {message && <p className="auth-message">{message}</p>}
    </section>
  );
}

function CoinOrbit({ active, values }: { active: boolean; values: YaoValue[] }) {
  return (
    <div className={active ? "coin-orbit active" : "coin-orbit"}>
      <span />
      <span />
      <span />
      <div>{values.length === 6 ? "已成卦" : `待摇${lineNames[values.length]}爻`}</div>
    </div>
  );
}

function CastProgress({ casts, values }: { casts: CoinCast[]; values: YaoValue[] }) {
  const rows = Array.from({ length: 6 }, (_, index) => {
    const cast = casts[index];
    const value = values[index];
    return { cast, value, index };
  });
  return (
    <div className="cast-progress" aria-label="摇卦进度">
      {rows.map(({ cast, value, index }) => (
        <div className={value ? "cast-row done" : "cast-row"} key={lineNames[index]}>
          <span>{lineNames[index]}爻</span>
          <strong>{value ? valueLabels[value] : "待摇"}</strong>
          <em>{cast ? cast.coins.join(" ") : "三枚铜钱"}</em>
        </div>
      ))}
    </div>
  );
}

function LinePicker({ mode, values, onChange }: { mode: CastMode; values: YaoValue[]; onChange: (index: number, value: YaoValue) => void }) {
  const filled = values.length === 6;
  const displayLine = (index: number) => values[index] ?? undefined;
  return (
    <div className="line-picker">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div className="line-control" key={index}>
          <span>{lineNames[index]}爻</span>
          {([6, 7, 8, 9] as YaoValue[]).map((candidate) => (
            <button className={values[index] === candidate ? "selected" : ""} key={candidate} type="button" onClick={() => onChange(index, candidate)}>
              {valueLabels[candidate]}（{coinPatternLabels[candidate]}）
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function HexagramPreview({ chart, expanded = false }: { chart: LiuyaoChart; expanded?: boolean }) {
  return (
    <section className={expanded ? "hex-preview expanded" : "hex-preview"}>
      <div className="hex-head">
        <div>
          <span>本卦</span>
          <strong>{chart.original.name}</strong>
          <small>{chart.original.palace}宫 · {chart.original.stage} · 五行{chart.original.palaceElement}</small>
        </div>
        <Compass size={22} />
        <div>
          <span>变卦</span>
          <strong>{chart.changed.name}</strong>
          <small>{chart.changed.palace}宫 · {chart.changed.stage} · 五行{chart.changed.palaceElement}</small>
        </div>
      </div>
      <div className="meta-chips">
        <span>{chart.year.text}年</span>
        <span>{chart.month.text}月</span>
        <span>{chart.day.text}日</span>
        <span>{chart.time.text}时</span>
        <span>旬空 {chart.emptyBranches.join("、")}</span>
      </div>
      <div className="yao-board">
        {[...chart.lines].reverse().map((line) => (
          <YaoRow
            key={line.position}
            line={line}
            changed={chart.changedLines[line.position - 1]}
            empty={chart.emptyBranches.includes(line.ganZhi.zhi)}
            changedEmpty={chart.emptyBranches.includes(chart.changedLines[line.position - 1].ganZhi.zhi)}
          />
        ))}
      </div>
    </section>
  );
}

function YaoRow({ line, changed, empty, changedEmpty }: { line: YaoLine; changed: YaoLine; empty: boolean; changedEmpty: boolean }) {
  const tags = [
    line.isShi ? "世" : "",
    line.isYing ? "应" : "",
    line.moving ? "动" : "",
    line.isMonthBroken ? "破" : "",
    line.isDayClash ? "日冲" : "",
    empty ? "空" : "",
    ...line.transformLabels,
  ].filter(Boolean);
  const changedTags = [changedEmpty ? "空" : ""].filter(Boolean);
  return (
    <div className={`yao-row ${line.moving ? "moving" : ""} ${line.position === 3 ? "lower-start" : ""}`}>
      <span className={`spirit spirit-${line.sixSpirit}`}><i />{line.sixSpirit}</span>
      <span className="relative">{relationShort[line.sixRelation]}</span>
      <span className="branch">{line.ganZhi.text}</span>
      <span className={`element element-${line.element}`}>{line.element}</span>
      <span className={`state state-${line.monthState}`}>{line.monthState}</span>
      <span className="stage">{line.twelveStage}</span>
      <span className="symbol"><YaoSymbol yinYang={line.yinYang} /></span>
      <span className="tags">
        {tags.map((tag) => <em className={tag === "世" || tag === "应" ? "focus-tag" : undefined} key={tag}>{tag}</em>)}
        {line.hiddenSpirit && <em className="hidden-tag">伏 {relationShort[line.hiddenSpirit.sixRelation]}{line.hiddenSpirit.ganZhi.text}</em>}
        {line.shenSha?.map((sha) => <em className="shensha-tag" key={sha}>{sha}</em>)}
      </span>
      <span className="changed-sep">{line.moving ? "×" : ""}</span>
      <span className="changed-relative">{relationShort[changed.sixRelation]}</span>
      <span className="changed-branch">{changed.ganZhi.text}</span>
      <span className={`changed-element element-${changed.element}`}>{changed.element}</span>
      <span className="changed-stage">{changed.twelveStage}</span>
      <span className="symbol changed"><YaoSymbol yinYang={changed.yinYang} /></span>
      <span className="tags changed-tags">{changedTags.map((tag) => <em key={tag}>{tag}</em>)}</span>
    </div>
  );
}

function YaoSymbol({ yinYang }: { yinYang: YaoLine["yinYang"] }) {
  return (
    <span className={`yao-symbol ${yinYang}`}>
      <b />
      {yinYang === "yin" && <b />}
    </span>
  );
}

function QuickRead({ quickRead }: { quickRead: ReturnType<typeof buildQuickRead> }) {
  return (
    <section className="quick-read">
      <h2>{quickRead.headline}</h2>
      <div>
        {quickRead.sections.map((section) => (
          <article className={section.tone} key={section.title}>
            <strong>{section.title}</strong>
            {section.body.split("\n").filter(Boolean).map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function ReadingSkeleton() {
  return (
    <div className="reading-skeleton">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function MarkdownLike({ text }: { text: string }) {
  return (
    <div className="markdown-like">
      {text.split("\n\n").map((paragraph) => {
        const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
        const className = firstLine === "解卦分析"
          ? "reading-heading"
          : ["一句话总结", "核心分析", "行动建议"].includes(firstLine)
            ? "reading-section"
            : /^\d+\./.test(firstLine)
              ? "reading-numbered"
              : "";
        return <p className={className} key={paragraph}>{paragraph}</p>;
      })}
    </div>
  );
}


function ArchiveDock({ archives, onLoad, onDelete }: { archives: ArchiveItem[]; onLoad: (archive: ArchiveItem) => void; onDelete: (id: string) => void }) {
  if (archives.length === 0) return null;
  return (
    <aside className="archive-dock">
      <h2><History size={16} /> 历史记录</h2>
      {archives.slice(0, 4).map((archive) => (
        <div className="archive-item" key={archive.id}>
          <button type="button" onClick={() => onLoad(archive)}>
            <span>{topicLabels[archive.topic]} · {new Date(archive.createdAt).toLocaleDateString()}</span>
            <strong>{archive.original} → {archive.changed}</strong>
            <small>{archive.question || "未命名卦例"}</small>
          </button>
          <button className="archive-delete" type="button" onClick={() => onDelete(archive.id)}>删除</button>
        </div>
      ))}
    </aside>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav">
      <a className="active" href="/liuyao"><Compass size={20} />六爻</a>
      <a href="/ziwei"><Moon size={20} />紫微</a>
    </nav>
  );
}

function castSingleLine(): CoinCast {
  const coins: CoinCast["coins"] = Array.from({ length: 3 }, () => (Math.random() < 0.5 ? "字" : "背"));
  const backs = coins.filter((coin) => coin === "背").length;
  const value = (backs === 0 ? 6 : backs === 1 ? 7 : backs === 2 ? 8 : 9) as YaoValue;
  return { value, coins };
}


function calculateTimingWindows(chart: LiuyaoChart, limitDays = 30): string[] {
  try {
    // Use the current date as anchor - we need lunar-javascript for daily branches
    
    const startDate = new Date(chart.input.date + "T00:00:00");
    const hints: string[] = [];
    
    const emptyBranches = chart.emptyBranches;
    const clashPairs: Record<string, string> = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
    const combinePairs: Record<string, string> = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };

    const targetBranches = new Set<string>();
    const branchReasons: Record<string, string[]> = {};

    // Empty branches → fill or clash
    for (const branch of emptyBranches) {
      targetBranches.add(branch);
      branchReasons[branch] = branchReasons[branch] || [];
      branchReasons[branch].push("旬空填实");
      const clash = clashPairs[branch];
      if (clash) {
        targetBranches.add(clash);
        branchReasons[clash] = branchReasons[clash] || [];
        branchReasons[clash].push("旬空冲起");
      }
    }

    // Month-broken lines → fill or combine
    for (const line of chart.lines) {
      if (line.isMonthBroken) {
        const branch = line.ganZhi.zhi;
        targetBranches.add(branch);
        branchReasons[branch] = branchReasons[branch] || [];
        branchReasons[branch].push(line.sixRelation + "月破补实");
        const combine = combinePairs[branch];
        if (combine) {
          targetBranches.add(combine);
          branchReasons[combine] = branchReasons[combine] || [];
          branchReasons[combine].push(line.sixRelation + "月破合补");
        }
      }
      if (line.moving) {
        const branch = line.ganZhi.zhi;
        targetBranches.add(branch);
        branchReasons[branch] = branchReasons[branch] || [];
        branchReasons[branch].push(line.sixRelation + "动爻临值");
        const changed = chart.changedLines[line.position - 1];
        const changedBranch = changed.ganZhi.zhi;
        targetBranches.add(changedBranch);
        branchReasons[changedBranch] = branchReasons[changedBranch] || [];
        branchReasons[changedBranch].push(line.sixRelation + "变爻临值");
      }
    }

    // Scan next N days for matching branches
    const matches: Array<{ date: string; branch: string; reasons: string[] }> = [];
    for (let i = 0; i < limitDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 0, 0, 0);
      const dayBranch = solar.getLunar().getDayInGanZhi().substring(1);
      if (targetBranches.has(dayBranch)) {
        matches.push({
          date: d.toISOString().slice(0, 10),
          branch: dayBranch,
          reasons: branchReasons[dayBranch] || [],
        });
      }
    }

    if (matches.length === 0) return [];

    // Group by branch for cleaner output
    const grouped: Record<string, string[]> = {};
    for (const m of matches) {
      const key = m.branch + "日";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m.date + " (" + m.reasons.join("、") + ")");
    }

    for (const [branch, dates] of Object.entries(grouped)) {
      if (dates.length <= 3) {
        hints.push(branch + "：" + dates.join("；"));
      } else {
        hints.push(branch + "：" + dates.slice(0, 3).join("；") + "等" + dates.length + "天");
      }
    }

    return hints.slice(0, 6);
  } catch {
    return [];
  }
}
function buildQuickRead(chart: LiuyaoChart, question: string) {
  const shi = chart.lines.find((line) => line.isShi);
  const ying = chart.lines.find((line) => line.isYing);
  const moving = chart.lines.filter((line) => line.moving);
  const scenario = question.trim() ? inferScenario(chart.input.topic, question) : undefined;

  const headline = chart.hexRelation.isSixClash
    ? "六冲之卦 · 事态有动荡分散之象"
    : chart.hexRelation.isSixCombine
      ? "六合之卦 · 牵连聚合但易拖延"
      : moving.length
        ? "动爻成势 · 先看发动与变爻"
        : "静卦成象 · 以日月世应定主线";

  // 用神强度速评
  const strengthLines: Array<{ relation: string; desc: string }> = [];
  const scenarioTopic = scenarioRules.filter((rule) => rule.topic === chart.input.topic);
  if (scenarioTopic.length > 0) {
    const firstRule = scenarioTopic[0];
    // Extract use god relations from the focus text
    const relations = ["官鬼", "父母", "妻财", "子孙", "兄弟"] as const;
    for (const rel of relations) {
      if (firstRule.focus.includes(rel)) {
        const godLines = chart.lines.filter((line) => line.sixRelation === rel);
        const primary = godLines.length > 0 ? godLines.reduce((a, b) => {
          const aScore = a.moving ? 3 : 0;
          const bScore = b.moving ? 3 : 0;
          return bScore > aScore ? b : a;
        }) : null;
        if (primary) {
          strengthLines.push({
            relation: rel,
            desc: describeLineStrength(primary, chart),
          });
        }
      }
    }
  }

  // 应期窗口提示
  const emptyLines = chart.lines.filter((line) => chart.emptyBranches.includes(line.ganZhi.zhi));
  const monthBrokenLines = chart.lines.filter((line) => line.isMonthBroken);
  const timingHints: string[] = [];
  if (emptyLines.length) {
    timingHints.push(`旬空：${emptyLines.map((line) => line.sixRelation + line.ganZhi.text).join("、")}落空，待填实或冲起`);
  }
  if (monthBrokenLines.length) {
    timingHints.push(`月破：${monthBrokenLines.map((line) => line.sixRelation + line.ganZhi.text).join("、")}，待值临或合补`);
  }
  if (moving.length) {
    const movingBranches = moving.map((line) => line.ganZhi.zhi);
    timingHints.push(`动爻临${movingBranches.join("、")}，应期先看这些地支值日/值时`);
  }

  const sections: Array<{ title: string; tone: string; body: string }> = [
    {
      title: "卦象总览",
      tone: "neutral",
      body: `本卦【${chart.original.name}】，变为【${chart.changed.name}】。${moving.length ? moving.map((line) => lineNames[line.position - 1] + "爻").join("、") + "发动。" : "本卦无动爻。"}${question ? " 所问为“" + question + "”。" : ""}`,
    },
    {
      title: "焦点态势",
      tone: "positive",
      body: shi ? `世爻落${lineNames[shi.position - 1]}爻，为${shi.sixRelation}${shi.ganZhi.text}，月令${shi.monthState}${shi.isMonthBroken ? "，但逢月破" : ""}。${ying ? "应爻为" + ying.sixRelation + ying.ganZhi.text + "。" : ""}` : "先定位世爻与应爻，再分辨主客关系。",
    },
  ];

  // 用神强度
  if (strengthLines.length > 0) {
    sections.push({
      title: "用神强度",
      tone: "neutral",
      body: strengthLines.map((item) => `· ${item.relation}爻${item.desc}`).join("\n"),
    });
  }

  // 场景规则驱动的重点分析
  if (scenario) {
    sections.push({
      title: "场景聚焦：" + scenario.label,
      tone: "neutral",
      body: scenario.focus + "\n\n" + scenario.priority,
    });

    const watchSignals = chart.ruleSignals.filter((signal) => signal.level === "watch");
    const goodSignals = chart.ruleSignals.filter((signal) => signal.level === "good");

    if (watchSignals.length) {
      sections.push({
        title: "需留意的信号",
        tone: "negative",
        body: watchSignals.map((signal) => "· " + signal.title + "：" + signal.body).join("\n"),
      });
    }

    if (goodSignals.length) {
      sections.push({
        title: "有利信号",
        tone: "positive",
        body: goodSignals.map((signal) => "· " + signal.title + "：" + signal.body).join("\n"),
      });
    }
  }

  // 应期窗口
  const preciseTiming = calculateTimingWindows(chart);
  if (preciseTiming.length > 0) {
    sections.push({
      title: "应期参考",
      tone: "neutral",
      body: preciseTiming.map((hint, index) => (index + 1) + ". " + hint).join("\n"),
    });
  } else if (timingHints.length > 0) {
    sections.push({
      title: "应期参考",
      tone: "neutral",
      body: timingHints.map((hint, index) => (index + 1) + ". " + hint).join("\n"),
    });
  }

  // 初步建议
  if (scenario && scenario.advice.length) {
    sections.push({
      title: "初步建议",
      tone: "neutral",
      body: scenario.advice.map((item, index) => (index + 1) + ". " + item).join("\n"),
    });
  } else if (!scenario) {
    sections.push({
      title: "策略纵深",
      tone: "neutral",
      body: "速断只给盘面主线，开始解卦后会完整拆解世应、用神、动变、应期与可执行策略。",
    });
  }

  return { headline, sections };
}
