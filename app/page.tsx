import type { Metadata } from "next";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "观真 · 古籍数字化 AI 推演平台",
  description: "以传统术数经典为根基，结合 AI 大模型，提供六爻起卦、紫微斗数等传统文化推演服务。",
};

export default function HomePage() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span>观真</span>
          <small>Truthful Hexagram</small>
        </a>
        <nav className="desktop-nav">
          <a href="/liuyao">六爻</a>
          <a href="/ziwei">紫微</a>
        </nav>
        <span className="profile-pill">个人中心</span>
      </header>

      <main className="main-flow">
        <section className="hero">
          <div className="bagua">
            <div className="taiji" />
            <div className="bagua-ring spinning">
              {["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"].map((trigram, index) => (
                <span key={trigram} style={{
                  transform: `rotate(${index * 45}deg) translateY(-160px) rotate(-${index * 45}deg)`,
                }}>{trigram}</span>
              ))}
            </div>
            <div className="hex-lines floating">
              <span className="broken" /><span className="broken" /><span className="broken" /><span /><span /><span />
            </div>
          </div>

          <p className="hero-kicker">古籍为根 · AI 参详</p>
          <h1 style={{ fontSize: 60, fontWeight: 300, letterSpacing: "0.14em", margin: "8px 0 18px" }}>观真</h1>
          <p style={{ maxWidth: 460, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.8 }}>
            以《增删卜易》《卜筮正宗》《紫微斗数全书》等古典文献为根基，
            结合 AI 大模型，引经据典，专业克制。
          </p>
        </section>

        <footer style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 12, marginTop: 60, paddingBottom: 40 }}>
          仅作文化研究与体验，不构成任何决策建议
        </footer>
      </main>
    </div>
  );
}
