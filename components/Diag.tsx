"use client";
import { useEffect } from "react";

/** Reporte de diagnóstico: qué soporta el navegador y si las animaciones corren. */
export default function Diag() {
  useEffect(() => {
    const errors: string[] = [];
    const onErr = (e: ErrorEvent) => errors.push(String(e.message).slice(0, 200));
    window.addEventListener("error", onErr);
    const t0 = performance.now();
    const snap = () => {
      const intro = document.querySelector(".intro");
      const left = document.querySelector(".intro-left");
      const bg = document.querySelector(".hero-bg img");
      return {
        t: Math.round(performance.now() - t0),
        cls: document.documentElement.className.replace(/__variable_\w+ ?/g, ""),
        intro: !!intro,
        introDisplay: intro ? getComputedStyle(intro).display : null,
        leftAnims: left ? left.getAnimations().map((a) => `${(a as CSSAnimation).animationName}:${a.playState}:${Math.round(Number(a.currentTime ?? 0))}`) : null,
        bgAnims: bg ? bg.getAnimations().map((a) => `${(a as CSSAnimation).animationName}:${a.playState}`) : null,
        bgTransform: bg ? getComputedStyle(bg).transform : null,
      };
    };
    const first = snap();
    const timer = window.setTimeout(() => {
      const mm = (q: string) => window.matchMedia(q).matches;
      const report = {
        url: location.href,
        w: innerWidth, h: innerHeight, dpr: devicePixelRatio,
        reduce: mm("(prefers-reduced-motion: reduce)"),
        coarse: mm("(pointer: coarse)"),
        saveData: (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData ?? null,
        supports: {
          rotateProp: CSS.supports("rotate", "y 10deg"),
          scaleProp: CSS.supports("scale", "1.1"),
          translateProp: CSS.supports("translate", "10px 10px"),
          mask: CSS.supports("mask-image", "linear-gradient(#000,transparent)") || CSS.supports("-webkit-mask-image", "linear-gradient(#000,transparent)"),
        },
        first,
        after: snap(),
        errors,
      };
      navigator.sendBeacon?.("/api/diag", JSON.stringify(report)) ||
        fetch("/api/diag", { method: "POST", body: JSON.stringify(report), keepalive: true });
    }, 1500);
    return () => { window.clearTimeout(timer); window.removeEventListener("error", onErr); };
  }, []);
  return null;
}
