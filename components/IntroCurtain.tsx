"use client";
import { useEffect, useRef } from "react";
import BrandWordmark from "./BrandWordmark";

/**
 * Entrada de la portada: un telón de plumas tapa todo, estalla un destello
 * dorado y las plumas se abren en 3D hacia los costados.
 * - Todo es CSS (transform/opacity): arranca aunque el JS tarde en cargar.
 * - Se ve una vez por visita (sessionStorage). "Saltar" la acelera.
 * - Con "reducir movimiento" no se muestra (lo decide el script del <head>).
 */
const DURATION = 3000;

export default function IntroCurtain() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    if (root.classList.contains("intro-off")) { el.remove(); return; }
    try { sessionStorage.setItem("feria-intro", "1"); } catch {}
    root.classList.add("intro-running");
    const done = () => { root.classList.remove("intro-running"); root.classList.add("intro-done"); el.remove(); };
    const t = window.setTimeout(done, DURATION);
    const skip = () => { el.classList.add("intro-fast"); window.clearTimeout(t); window.setTimeout(done, 450); };
    el.querySelector("button")?.addEventListener("click", skip);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div className="intro" ref={ref} aria-hidden="true">
      <div className="intro-stage">
        <div className="intro-panel intro-left"><div className="intro-img" /></div>
        <div className="intro-panel intro-right"><div className="intro-img" /></div>
      </div>
      <div className="intro-mark"><BrandWordmark /></div>
      <div className="intro-glow" />
      <button type="button" className="intro-skip" tabIndex={-1}>Saltar</button>
    </div>
  );
}
