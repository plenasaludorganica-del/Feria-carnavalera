"use client";
import { useEffect } from "react";

/**
 * Un único listener para toda la página: mueve las capas con [data-depth]
 * escribiendo una variable CSS (--y) que se usa en translate3d (GPU).
 * Además, inclina la portada en 3D siguiendo el mouse (solo puntero fino).
 */
export default function Parallax() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    const stage = document.querySelector<HTMLElement>("[data-tilt]");
    const header = document.querySelector<HTMLElement>(".site-header");
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    let raf = 0, scheduled = false;

    const apply = () => {
      scheduled = false;
      const sy = window.scrollY;
      const vh = window.innerHeight;
      for (const el of layers) {
        const depth = Number(el.dataset.depth);
        // capas de la portada: solo mientras se ve; capa del telón: relativa a su posición
        if (el.dataset.scope === "hero" && sy > vh * 1.2) continue;
        el.style.setProperty("--y", (sy * depth).toFixed(1));
      }
      if (header) header.dataset.solid = String(sy > vh * 0.6);
    };
    const onScroll = () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(apply); }
    };

    const tilt = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      if (stage) stage.style.transform = `rotateX(${(-cur.y * 3).toFixed(2)}deg) rotateY(${(cur.x * 4).toFixed(2)}deg) scale(1.03)`;
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) raf = requestAnimationFrame(tilt);
      else raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (window.scrollY > window.innerHeight) return;
      target = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
      if (!raf) raf = requestAnimationFrame(tilt);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (finePointer && stage) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
