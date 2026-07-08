"use client";

import { Compass } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase, isSupabaseConfigured } from "../../../src/lib/supabaseClient";
import type { LiuyaoChart, Topic, YaoLine } from "../../../src/domain/types";

type RecordData = {
  chart: LiuyaoChart;
  reading: string;
  followUps?: Array<{ role: "user" | "assistant"; content: string }>;
  createdAt?: string;
  question?: string;
  topic?: string;
};

const lineNames = ["初", "二", "三", "四", "五", "上"];
const relationShort: Record<string, string> = {
  兄弟: "兄", 子孙: "孙", 妻财: "财", 官鬼: "官", 父母: "父",
};

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params.id;

  useEffect(() => {
    async function load() {
      try {
        // Try localStorage first
        const stored = JSON.parse(localStorage.getItem("mirror-liuyao-records") || "{}");
        if (stored[id]) {
          setRecord(stored[id]);
          setLoading(false);
          return;
        }

        // Try Supabase
        const supabase = getBrowserSupabase();
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            const { data, error: dbError } = await supabase
              .from("divinations")
              .select("id, created_at, question, topic, input_json, chart_json")
              .eq("id", id)
              .single();

            if (!dbError && data) {
              const { data: readings } = await supabase
                .from("ai_readings")
                .select("content")
                .eq("divination_id", id)
                .order("created_at", { ascending: false })
                .limit(1);

              setRecord({
                chart: data.chart_json as LiuyaoChart,
                reading: readings?.[0]?.content || "",
                createdAt: data.created_at,
                question: data.question,
                topic: data.topic,
              });
              setLoading(false);
              return;
            }
          }
        }

        setError("未找到该卦例记录");
      } catch (e) {
        setError("加载失败：" + String(e));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="app-shell">
        <main className="main-flow" style={{ textAlign: "center", paddingTop: 120 }}>
          <div className="reading-skeleton"><span /><span /><span /><span /></div>
        </main>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="app-shell">
        <main className="main-flow" style={{ textAlign: "center", paddingTop: 120 }}>
          <p style={{ color: "var(--ink-soft)" }}>{error || "记录不存在"}</p>
          <button onClick={() => router.push("/")} style={{ marginTop: 16 }}>返回首页</button>
        </main>
      </div>
    );
  }

  const chart = record.chart;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span>观真</span>
          
        </a>
        <nav className="desktop-nav">
          <a className="active" href="/liuyao">六爻</a>
          <a href="/ziwei">紫微</a>
        </nav>
        <span className="profile-pill" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          {record.createdAt ? new Date(record.createdAt).toLocaleString("zh-CN") : ""}
        </span>
      </header>

      <main className="main-flow">
        {/* Chart Preview */}
        <section className="hex-preview expanded">
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
              <div className={`yao-row ${line.moving ? "moving" : ""} ${line.position === 3 ? "lower-start" : ""}`} key={line.position}>
                <span className={`spirit spirit-${line.sixSpirit}`}><i />{line.sixSpirit}</span>
                <span className="relative">{relationShort[line.sixRelation]}</span>
                <span className="branch">{line.ganZhi.text}</span>
                <span className={`element element-${line.element}`}>{line.element}</span>
                <span className={`state state-${line.monthState}`}>{line.monthState}</span>
                <span className="stage">{line.twelveStage}</span>
                <span className="symbol">{line.yinYang === "yang" ? "⚊" : "⚋"}</span>
                <span className="tags">
                  {[line.isShi && "世", line.isYing && "应", line.moving && "动", line.isMonthBroken && "破", chart.emptyBranches.includes(line.ganZhi.zhi) && "空"].filter((tag): tag is string => !!tag).map((tag) => <em className={tag === "世" || tag === "应" ? "focus-tag" : ""} key={tag}>{tag}</em>)}
                </span>
                <span className="changed-sep">{line.moving ? "×" : ""}</span>
                <span className="changed-relative">{relationShort[chart.changedLines[line.position - 1].sixRelation]}</span>
                <span className="changed-branch">{chart.changedLines[line.position - 1].ganZhi.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Reading */}
        {record.reading && (
          <article className="reading-card">
            <h2>解卦分析</h2>
            <div className="divider" />
            <div className="markdown-like">
              {record.reading.split("\n\n").map((paragraph, index) => {
                const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
                const className = firstLine === "解卦分析"
                  ? "reading-heading"
                  : ["一句话总结", "核心分析", "行动建议"].includes(firstLine)
                    ? "reading-section"
                    : /^\d+\./.test(firstLine)
                      ? "reading-numbered"
                      : "";
                return <p className={className} key={index}>{paragraph}</p>;
              })}
            </div>
          </article>
        )}

        {/* Follow-ups */}
        {record.followUps && record.followUps.length > 0 && (
          <section className="followup">
            <h2>追问记录</h2>
            <div className="followup-messages">
              {record.followUps.map((msg, index) => (
                <p className={msg.role} key={index}>{msg.content}</p>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
