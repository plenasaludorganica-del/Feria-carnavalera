"use client";
import { useEffect } from "react";

/**
 * Scroll suave con inercia (Lenis) solo en computadoras con mouse/trackpad.
 * En celulares se mantiene el scroll nativo, que ya es suave y es el que la
 * gente espera. Con "reducir movimiento" no se activa.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let destroyed = false;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, anchors: true });
      const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    });
    return () => { destroyed = true; cancelAnimationFrame(raf); lenis?.destroy(); };
  }, []);
  return null;
}
