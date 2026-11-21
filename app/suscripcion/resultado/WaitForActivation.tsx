"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Mercado Pago avisa al webhook unos segundos después del pago.
 * Esta pantalla consulta el estado y abre el panel apenas se acredita.
 */
export default function WaitForActivation({ pending }: { pending: boolean }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active || tries > 40) return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/me/estado", { cache: "no-store" });
        const j = await r.json();
        if (j.state === "activo") {
          setActive(true);
          router.replace("/panel?bienvenida=1");
          return;
        }
      } catch {}
      setTries((n) => n + 1);
    }, tries === 0 ? 500 : 3000);
    return () => clearTimeout(t);
  }, [tries, active, router]);

  if (active) return <h1 style={{ margin: 0 }}>¡Pago acreditado! Abriendo tu panel…</h1>;
  if (tries > 40 || pending)
    return (
      <>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Tu pago está en proceso</h1>
        <p className="sub" style={{ marginTop: 10 }}>
          Mercado Pago todavía no lo confirmó. Apenas se acredite, tu panel se activa solo. Podés cerrar esta página y volver más tarde.
        </p>
        <Link className="btn btn-fucsia" href="/panel">Ir a mi panel</Link>
      </>
    );
  return (
    <>
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Confirmando tu pago…</h1>
      <p className="sub" style={{ marginTop: 10 }}>Esperamos la confirmación de Mercado Pago. Suele tardar unos segundos.</p>
    </>
  );
}
