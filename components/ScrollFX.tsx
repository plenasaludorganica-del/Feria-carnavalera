"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Animaciones al hacer scroll + inclinación 3D de tarjetas con el mouse.
 * - [data-fx]       → entra con animación cuando aparece en pantalla (una sola vez).
 * - .tag, .cat      → en computadora se inclinan en 3D siguiendo el puntero.
 * Todo con transform/opacity (GPU). Con "reducir movimiento" no hace nada.
 */
export default function ScrollFX() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("fx-on")) return;

    // Escalonado: cada tarjeta espera según su posición en la fila.
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-fx]:not(.in)"));
    nodes.forEach((el) => {
      const li = el.closest("li");
      const idx = li?.parentElement ? Array.prototype.indexOf.call(li.parentElement.children, li) : 0;
      el.style.setProperty("--i", String(idx % 6));
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));

    // Inclinación 3D solo con mouse (no en celulares).
    let cleanupTilt = () => {};
    if (window.matchMedia("(pointer: fine)").matches) {
      let current: HTMLElement | null = null;
      let raf = 0;
      let rx = 0, ry = 0;
      const apply = () => {
        raf = 0;
        if (current) {
          current.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
          current.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        }
      };
      const onMove = (ev: PointerEvent) => {
        const el = (ev.target as HTMLElement).closest<HTMLElement>(".tag, .cat");
        if (el !== current) {
          if (current) { current.style.removeProperty("--rx"); current.style.removeProperty("--ry"); current.classList.remove("tilting"); }
          current = el;
          current?.classList.add("tilting");
        }
        if (!current) return;
        const r = current.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        rx = -y * 10;
        ry = x * 12;
        if (!raf) raf = requestAnimationFrame(apply);
      };
      const onLeave = () => {
        if (current) { current.style.removeProperty("--rx"); current.style.removeProperty("--ry"); current.classList.remove("tilting"); }
        current = null;
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      cleanupTilt = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
        cancelAnimationFrame(raf);
      };
    }

    return () => { io.disconnect(); cleanupTilt(); };
  }, [pathname]);

  return null;
}
