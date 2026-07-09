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
          
        </a>
        <nav className="desktop-nav"><a href="/" className="active">首页</a><a href="/liuyao">六爻</a><a href="/ziwei">紫微</a><a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a><a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a></nav>
      </header>

      <main className="main-flow">
        <section className="hero">
          <p className="hero-kicker">古籍为根 · AI 参详</p>
          <h1 style={{ fontSize: 60, fontWeight: 300, letterSpacing: "0.14em", margin: "8px 0 18px" }}>观真</h1>
          <p style={{ maxWidth: 460, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.8 }}>
            以《增删卜易》《卜筮正宗》《紫微斗数全书》等古典文献为根基，
            结合 AI 大模型，引经据典，专业克制。
          </p>
          <a
            href="/activate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 320,
              height: 48,
              marginTop: 28,
              borderRadius: 13,
              background: "var(--red)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            激活密钥 / 我的权限
          </a>
        </section>

        <footer style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 12, marginTop: 60, paddingBottom: 40 }}>
          仅作为化研究与体验，不构成任何决策建议
        </footer>
      </main>
    </div>
  );
}
