import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { formatDate, formatPrice } from "@/lib/config";
import { requireUser } from "@/lib/session";
import { endOfMonthISO, todayISO } from "@/lib/subscription";

export const metadata: Metadata = { title: "Cuota mensual" };

const price = Number(process.env.MP_MONTHLY_PRICE ?? 5000);
const currency = process.env.MP_CURRENCY ?? "ARS";

export default async function Suscripcion({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { profile, state } = await requireUser("/suscripcion");

  // Hasta qué fecha cubriría este pago (misma regla que register_payment en SQL)
  const today = todayISO();
  const startsNextMonth = state === "activo" && profile.paid_until;
  const covers = startsNextMonth
    ? endOfMonthISO(new Date(Date.parse(profile.paid_until! + "T12:00:00Z") + 86_400_000).toISOString().slice(0, 10))
    : endOfMonthISO(today);

  const title = {
    activo: "Adelantá la cuota del mes que viene",
    vencido: "Tu cuota venció",
    sin_pago: "Un paso más: pagá la cuota del mes",
    suspendido: "Tu cuenta está suspendida",
  }[state];

  const body = {
    activo: `Tu cuota está paga hasta el ${formatDate(profile.paid_until)}. Si pagás ahora, quedás cubierto hasta el ${formatDate(covers)}.`,
    vencido: `Venció el ${formatDate(profile.paid_until)}. Tus publicaciones están guardadas pero no se ven en el catálogo. Cuando pagues, vuelven a aparecer tal como estaban.`,
    sin_pago: `Con el pago activás tu panel de vendedor. Te cubre hasta el ${formatDate(covers)}; después la cuota vence el último día de cada mes.`,
    suspendido: "Un administrador suspendió tu cuenta. Tus publicaciones están guardadas pero ocultas. Escribinos para resolverlo.",
  }[state];

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap" style={{ paddingBottom: 64 }}>
          <div className="paper pay-card">
            <h1 style={{ margin: 0, fontSize: "1.6rem" }}>{title}</h1>
            {error && <p className="form-error" style={{ marginTop: 12 }}>El pago no se completó. Podés intentar de nuevo con otro medio.</p>}
            <p className="sub" style={{ marginTop: 10 }}>{body}</p>

            {state !== "suspendido" && (
              <>
                <p className="pay-amount">{formatPrice(price, currency)} <small>por mes</small></p>
                <ul className="pay-list">
                  <li>Publicaciones ilimitadas con hasta 8 fotos cada una.</li>
                  <li>Los compradores te escriben directo a tu WhatsApp.</li>
                  <li>Vence el último día de cada mes. Si no renovás, tus productos se ocultan, no se borran.</li>
                </ul>
                <form action="/api/mp/checkout" method="post">
                  <button className="btn btn-oro hero-cta-main" style={{ width: "100%" }}>
                    Pagar con Mercado Pago
                  </button>
                </form>
              </>
            )}
            {state === "activo" && (
              <p style={{ marginTop: 16 }}><Link href="/panel" style={{ color: "var(--tinta)" }}>Volver a mi panel</Link></p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
