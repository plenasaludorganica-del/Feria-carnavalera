import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { supabaseConfigured } from "@/lib/config";
import { syncUserBilling } from "@/lib/billing-sync";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Puerta del panel. El vendedor entra aunque no haya pagado: arma su puesto,
 * lo ve en vista previa y recién ahí paga. Solo una cuenta suspendida va al aviso.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured) {
    return (
      <>
        <SiteHeader />
        <main className="page"><div className="wrap"><div className="paper">
          <h1 style={{ marginTop: 0 }}>Falta conectar Supabase</h1>
          <p>Completá <code>.env.local</code> con las claves de tu proyecto (ver <code>.env.example</code>) para usar el panel.</p>
        </div></div></main>
      </>
    );
  }
  const { state, profile } = await requireUser("/panel");
  // Si no está al día pero tiene débito automático, consulta a Mercado Pago por si ya pagó.
  if (state !== "activo" && profile.mp_preapproval_id) await syncUserBilling(profile.id);
  // Vencido o suspendido: no entra al panel; ve el aviso para renovar.
  // (Quien todavía no pagó nunca sí entra, para armar su puesto antes de pagar.)
  if (state !== "activo") {
    const fresh = await requireUser("/panel");
    if (fresh.state === "vencido" || fresh.state === "suspendido") redirect("/suscripcion");
  }
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}
