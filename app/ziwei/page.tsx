import type { Metadata } from "next";
import { ZiweiApp } from "../../src/ui/ZiweiApp";

export const metadata: Metadata = {
  title: "紫微斗数 · 观真",
  description: "紫微斗数命盘排盘，十二宫、四化飞星、大限流年。",
};

export default function ZiweiPage() {
  return <ZiweiApp />;
}
