"use client";
import { useEffect, useRef, useState } from "react";
import BrandWordmark from "./BrandWordmark";

/**
 * Entrada de la portada: un telón de plumas tapa todo, estalla un destello
 * dorado y las plumas se abren en 3D hacia los costados.
 * - Todo es CSS (transform/opacity): arranca aunque el JS tarde en cargar.
 * - Se ve una vez por visita (sessionStorage); ?intro=1 la repite. "Saltar" la acelera.
 * - Al terminar se desmonta con estado de React (nunca se borra el nodo a mano:
 *   eso rompía la navegación a otras páginas).
 */
const DURATION = 3000;

export default function IntroCurtain() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    // Ya vista (o volviendo a la portada sin recargar): no se repite.
    if (root.classList.contains("intro-off") || root.classList.contains("intro-done")) { setDone(true); return; }
    try { sessionStorage.setItem("feria-intro", "1"); } catch {}
    root.classList.add("intro-running");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.remove("intro-running");
      root.classList.add("intro-done");
      setDone(true);
    };
    const t = window.setTimeout(finish, DURATION);
    let t2 = 0;
    const skip = () => {
      ref.current?.classList.add("intro-fast");
      window.clearTimeout(t);
      t2 = window.setTimeout(finish, 450);
    };
    const btn = ref.current?.querySelector("button");
    btn?.addEventListener("click", skip);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      btn?.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      root.classList.remove("intro-running");
    };
  }, []);

  if (done) return null;

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
