import type { Metadata } from "next";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "观真 · 古籍数字化 AI 推演平台",
  description: "以传统术数经典为根基，结合 AI 大模型，提供六爻起卦、紫微斗数等传统文化推演服务。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
