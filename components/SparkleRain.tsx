"use client";
import { useEffect, useRef } from "react";

/**
 * Lluvia de brillos en un único <canvas>.
 * Optimizaciones:
 *  - Sprites pre-dibujados (no se recalculan gradientes por frame).
 *  - Cantidad según el área de pantalla, con tope (menos en celular).
 *  - DPR limitado a 1.5.
 *  - Se pausa si la portada no está visible o la pestaña está oculta.
 *  - Con "reducir movimiento" dibuja un solo cuadro estático.
 */
const COLORS = ["#fff6d8", "#f5b83d", "#ff7ac1", "#7fe6ee", "#ffffff"];

function makeSprite(color: string, size: number, star: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const glow = g.createRadialGradient(r, r, 0, r, r, r);
  glow.addColorStop(0, color);
  glow.addColorStop(0.25, color + "aa");
  glow.addColorStop(1, color + "00");
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);
  if (star) {
    g.fillStyle = "#ffffff";
    g.beginPath();
    const w = size * 0.06;
    g.moveTo(r, 0); g.lineTo(r + w, r - w); g.lineTo(size, r); g.lineTo(r + w, r + w);
    g.lineTo(r, size); g.lineTo(r - w, r + w); g.lineTo(0, r); g.lineTo(r - w, r - w);
    g.closePath();
    g.fill();
  }
  return c;
}

interface P { x: number; y: number; vy: number; vx: number; s: number; tw: number; ph: number; sp: number; }

export default function SparkleRain({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = COLORS.flatMap((c) => [makeSprite(c, 32, false), makeSprite(c, 48, true)]);
    let w = 0, h = 0, dpr = 1;
    let parts: P[] = [];
    let raf = 0, last = 0, visible = true;

    const spawn = (anywhere: boolean): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -20,
      vy: 18 + Math.random() * 46,
      vx: (Math.random() - 0.5) * 10,
      s: 4 + Math.random() * (Math.random() < 0.12 ? 22 : 9),
      tw: 1.5 + Math.random() * 3,
      ph: Math.random() * Math.PI * 2,
      sp: Math.floor(Math.random() * sprites.length),
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = w < 760;
      const target = Math.min(Math.round((w * h) / (mobile ? 9000 : 7000)), mobile ? 70 : 160);
      while (parts.length < target) parts.push(spawn(true));
      parts.length = target;
    };

    const draw = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.y += p.vy * dt;
        p.x += p.vx * dt + Math.sin(t / 900 + p.ph) * 0.15;
        if (p.y > h + 20) Object.assign(p, spawn(false));
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * p.tw + p.ph));
        ctx.globalAlpha = a;
        const s = p.s * (0.7 + a * 0.5);
        ctx.drawImage(sprites[p.sp], p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    if (reduce) draw(performance.now());
    start();

    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    return () => { stop(); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
