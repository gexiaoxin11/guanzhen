import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
      <h1 style={{ fontSize: 48, fontWeight: 300, color: "var(--ink)" }}>404</h1>
      <p style={{ color: "var(--ink-soft)" }}>页面未找到</p>
      <Link href="/" style={{ color: "var(--red)", textDecoration: "none", fontWeight: 600 }}>返回首页</Link>
    </div>
  );
}
