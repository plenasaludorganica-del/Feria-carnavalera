import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { formatDate, formatPrice } from "@/lib/config";
import ShareCard from "@/components/ShareCard";
import { getMonthlyPrice, getPromoPrice } from "@/lib/mercadopago";
import { requireUser } from "@/lib/session";
import { addMonthISO, daysLeft, todayISO } from "@/lib/subscription";

export const metadata: Metadata = { title: "Cuota mensual" };

export default async function Suscripcion({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { profile, state, user } = await requireUser("/suscripcion");
  // Se leen en cada request (en Cloudflare las variables llegan con la petición).
  const regular = await getMonthlyPrice();
  const promo = await getPromoPrice();
  const price = promo ?? regular;
  const off = promo ? Math.round((1 - promo / regular) * 100) : 0;
  const currency = process.env.MP_CURRENCY ?? "ARS";

  // Hasta qué fecha cubriría este pago (misma regla que register_payment en SQL)
  const today = todayISO();
  const startsNextMonth = state === "activo" && profile.paid_until;
  const covers = startsNextMonth
    ? addMonthISO(profile.paid_until!)
    : addMonthISO(today);

  const title = {
    activo: profile.is_free ? "Tu cuenta está activa" : profile.mp_preapproval_status === "authorized" ? "Tu cuota está al día" : "Activá el débito automático",
    vencido: "Tu cuota venció",
    sin_pago: "Un paso más: pagá la cuota del mes",
    suspendido: "Tu cuenta está suspendida",
  }[state];

  const body = {
    activo: profile.is_free ? "Tu puesto está publicado y no tenés que pagar por ahora." : `Tu cuota vence el ${formatDate(profile.paid_until)}${daysLeft(profile.paid_until) <= 7 ? ` (en ${daysLeft(profile.paid_until)} días)` : ""}. Si renovás ahora no perdés días: quedás cubierto hasta el ${formatDate(covers)}.`,
    vencido: `Venció el ${formatDate(profile.paid_until)}. No se borró nada: tus publicaciones están guardadas, pero no se ven en la feria y tu panel queda cerrado hasta que renueves. Cuando pagues, vuelve todo tal como estaba.`,
    sin_pago: `Con el pago se publica tu puesto. Te cubre hasta el ${formatDate(covers)} y después se renueva todos los meses ese mismo día.`,
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

            {state === "activo" && profile.is_free && (
              <div className="status" data-tone="ok" style={{ textAlign: "left", marginTop: 16 }}>
                <strong>Tenés la cuenta gratis</strong>
                <span>No tenés que pagar nada hasta el {formatDate(profile.paid_until)}.</span>
              </div>
            )}

            {state !== "suspendido" && !(state === "activo" && profile.is_free) && profile.mp_preapproval_status === "authorized" && (
              <div className="status" data-tone="ok" style={{ textAlign: "left", marginTop: 16 }}>
                <strong>Débito automático activo</strong>
                <span>Mercado Pago cobra {formatPrice(price, currency)} todos los meses el día {Number((profile.paid_until ?? today).slice(8, 10))}. Próximo cobro: {formatDate(profile.paid_until)}. No tenés que hacer nada.</span>
              </div>
            )}

            {state !== "suspendido" && !(state === "activo" && profile.is_free) && profile.mp_preapproval_status !== "authorized" && (
              <>
                {promo ? (
                  <div className="promo">
                    <span className="promo-flag">Aprovechá hoy el precio promocional</span>
                    <div className="promo-prices">
                      <s className="promo-old">{formatPrice(regular, currency)}</s>
                      <span className="promo-off">{off}% OFF</span>
                    </div>
                    <p className="pay-amount">{formatPrice(price, currency)} <small>por mes</small></p>
                    <small className="promo-note">Precio de lanzamiento por tiempo limitado.</small>
                  </div>
                ) : (
                  <p className="pay-amount">{formatPrice(price, currency)} <small>por mes</small></p>
                )}
                <ul className="pay-list">
                  <li>Se cobra hoy y después solo, todos los meses el día {Number(today.slice(8, 10))}, con tu tarjeta por Mercado Pago.</li>
                  <li>Publicaciones ilimitadas con hasta 8 fotos cada una. Te escriben directo a tu WhatsApp.</li>
                  <li>Podés darlo de baja cuando quieras desde tu panel. Tus productos se ocultan, no se borran.</li>
                </ul>
                <form action="/api/mp/checkout" method="post" style={{ textAlign: "left" }}>
                  <div className="field">
                    <label htmlFor="mp_email">Email de tu cuenta de Mercado Pago</label>
                    <input className="input" id="mp_email" name="mp_email" type="email" required defaultValue={user.email ?? ""} autoComplete="email" />
                    <span className="help">Tiene que ser el mismo con el que entrás a Mercado Pago. Si usás otro, cambialo acá.</span>
                  </div>
                  <button className="btn btn-oro hero-cta-main" style={{ width: "100%" }}>
                    Activar débito automático
                  </button>
                </form>
                <form action="/api/mp/checkout?modo=unico" method="post" style={{ marginTop: 10 }}>
                  <button className="btn btn-ghost" style={{ width: "100%", color: "var(--tinta)" }}>
                    Prefiero pagar solo este mes
                  </button>
                </form>
              </>
            )}
            <aside className="fee-note" aria-label="Para qué es la cuota">
              <strong>¿Para qué es la cuota?</strong>
              <p>
                Mantiene la Feria funcionando: el servidor donde vive la página, el espacio para las fotos de todos los
                puestos y las mejoras que vamos sumando. No cobramos comisión por tus ventas: lo que vendés es todo tuyo.
              </p>
            </aside>

            {state === "activo" && (
              <p style={{ marginTop: 16 }}><Link href="/panel" style={{ color: "var(--tinta)" }}>Volver a mi panel</Link></p>
            )}
          </div>
          <div className="pay-card" style={{ marginTop: 20 }}>
            <ShareCard />
          </div>
        </div>
      </main>
    </>
  );
}
