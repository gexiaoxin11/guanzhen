"use client";

import { useEffect, useRef } from "react";

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
}

export default function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = false,
  gradientFrom = "#A855F7",
  gradientTo = "#B497CF",
  glowColor = "#120F17",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const cx = w / 2;
      const cy = h / 2;

      // Use the actual rendered dimensions
      const actualW = canvas.clientWidth || w;
      const actualH = canvas.clientHeight || h;
      const actualCx = actualW / 2;
      const actualCy = actualH / 2;

      ctx.clearRect(0, 0, actualW, actualH);

      // Background
      ctx.fillStyle = glowColor;
      ctx.fillRect(0, 0, actualW, actualH);

      // Draw dots
      const cols = Math.ceil(actualW / dotSpacing) + 1;
      const rows = Math.ceil(actualH / dotSpacing) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const baseX = col * dotSpacing;
          const baseY = row * dotSpacing;

          let dx = 0;
          let dy = 0;

          // Bulge effect (center-based)
          const distX = baseX - actualCx;
          const distY = baseY - actualCy;
          const dist = Math.sqrt(distX * distX + distY * distY);

          const bulgeFactor = Math.max(0, 1 - dist / glowRadius);
          const bulge = bulgeStrength * Math.sin(bulgeFactor * Math.PI) * bulgeFactor;
          dx += (distX / (dist || 1)) * bulge;
          dy += (distY / (dist || 1)) * bulge;

          // Wave amplitude
          if (waveAmplitude > 0) {
            const wave = Math.sin(dist * 0.02 + time * 0.03) * waveAmplitude;
            dy += wave;
          }

          // Cursor interaction
          if (!bulgeOnly) {
            const { x: mx, y: my } = mouseRef.current;
            const cDistX = baseX - mx;
            const cDistY = baseY - my;
            const cDist = Math.sqrt(cDistX * cDistX + cDistY * cDistY);
            if (cDist < cursorRadius) {
              const force = (1 - cDist / cursorRadius) * cursorForce * cursorRadius;
              dx += (cDistX / (cDist || 1)) * force;
              dy += (cDistY / (cDist || 1)) * force;
            }
          }

          const x = baseX + dx;
          const y = baseY + dy;

          // Determine dot opacity based on distance from center
          const centerDist = Math.sqrt(
            (x - actualCx) * (x - actualCx) + (y - actualCy) * (y - actualCy)
          );
          const glowFactor = Math.max(0, 1 - centerDist / glowRadius);

          // Sparkle
          let sparkleAlpha = 0;
          if (sparkle) {
            sparkleAlpha = Math.max(0, Math.sin(time * 0.05 + row * 0.5 + col * 0.7)) * 0.3 * glowFactor;
          }

          const alpha = Math.max(0.15, glowFactor * 0.8 + sparkleAlpha);

          // Color interpolation
          const r1 = parseInt(gradientFrom.slice(1, 3), 16);
          const g1 = parseInt(gradientFrom.slice(3, 5), 16);
          const b1 = parseInt(gradientFrom.slice(5, 7), 16);
          const r2 = parseInt(gradientTo.slice(1, 3), 16);
          const g2 = parseInt(gradientTo.slice(3, 5), 16);
          const b2 = parseInt(gradientTo.slice(5, 7), 16);

          const t = bulgeOnly ? glowFactor : Math.max(0.1, glowFactor);
          const r = Math.round(r1 + (r2 - r1) * t);
          const g = Math.round(g1 + (g2 - g1) * t);
          const b = Math.round(b1 + (b2 - b1) * t);

          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Radial gradient overlay for smooth fade
      if (glowRadius > 0) {
        const gradient = ctx.createRadialGradient(actualCx, actualCy, glowRadius * 0.5, actualCx, actualCy, actualW);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.6, "rgba(0,0,0,0.3)");
        gradient.addColorStop(1, glowColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, actualW, actualH);
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleLeave);
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, [dotRadius, dotSpacing, bulgeStrength, glowRadius, sparkle, waveAmplitude, cursorRadius, cursorForce, bulgeOnly, gradientFrom, gradientTo, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
