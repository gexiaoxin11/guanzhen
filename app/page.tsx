import type { Metadata } from "next";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "观真 · 古籍数字化 AI 推演平台",
  description: "以传统术数经典为根基，结合 AI 大模型，提供六爻起卦、紫微斗数等传统文化推演服务。",
};

const SYSTEMS = [
  { name: "六爻纳甲", desc: "三枚铜钱，六次摇卦。世应用神，动变生克。", href: "/liuyao", icon: "☰", color: "#d44115" },
  { name: "紫微斗数", desc: "十二宫位，满天星曜。三方四正，四化飞星。", href: "/ziwei", icon: "🌟", color: "#8e44ad" },
  { name: "八字排盘", desc: "四柱八字，十神格局。大运流年，调候用神。", href: "/bazi", icon: "📅", color: "#2c3e50" },
  { name: "奇门遁甲", desc: "九宫八卦，八门九星。帝王之术，运筹帷幄。", href: "/qimen", icon: "🏰", color: "#c0392b" },
  { name: "大六壬", desc: "月将加时，四课三传。天将类象，课经断事。", href: "/daliuren", icon: "🔮", color: "#2471a3" },
  { name: "梅花易数", desc: "物象起卦，体用生克。触类旁通，简易神妙。", href: "/meihua", icon: "🌸", color: "#b8860b" },
  { name: "道家小六壬", desc: "三宫具象，六掌推演。八卦转化，五行生克。", href: "/xiaoliuren", icon: "☯", color: "#8b4513" },
  { name: "黄历通书", desc: "每日宜忌，吉神凶煞。冲煞胎神，时辰吉凶。", href: "/almanac", icon: "📖", color: "#1a7a3a" },
];

export default function HomePage() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span>观真</span></a>
        <nav className="desktop-nav">
          <a href="/" className="active">首页</a>
          <a href="/liuyao">六爻</a><a href="/ziwei">紫微</a>
          <a href="/bazi">八字排盘</a><a href="/qimen">奇门遁甲</a>
          <a href="/daliuren">大六壬</a><a href="/meihua">梅花易数</a><a href="/almanac">黄历</a>
          <a href="/xiaoliuren">小六壬</a>
        </nav>
      </header>

      <main className="main-flow">
        <section className="hero">
          <p className="hero-kicker">古籍为根 · AI 参详</p>
          <h1 style={{ fontSize: 60, fontWeight: 300, letterSpacing: "0.14em", margin: "8px 0 18px" }}>观真</h1>
          <p style={{ maxWidth: 460, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.8, margin: "0 auto" }}>
            以《增删卜易》《卜筮正宗》《紫微斗数全书》等古典文献为根基，
            结合 AI 大模型，引经据典，专业克制。
          </p>
        </section>

        {/* 术数系统导航卡片 */}
        <section className="home-systems">
          <div className="home-systems-grid">
            {SYSTEMS.map((sys) => (
              <a key={sys.name} href={sys.href} className="home-system-card" style={{ borderTopColor: sys.color }}>
                <div className="home-system-icon" style={{ color: sys.color }}>{sys.icon}</div>
                <h3 className="home-system-name">{sys.name}</h3>
                <p className="home-system-desc">{sys.desc}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="home-cta">
          <a href="/activate" className="home-cta-btn">
            激活密钥 · 解锁 AI 深度解读
          </a>
        </section>

        <footer className="home-footer">
          仅作为文化研究与体验，不构成任何决策建议
        </footer>
      </main>
    </div>
  );
}
