import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { supabaseConfigured } from "@/lib/config";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Puerta del panel: sin cuota al día → pantalla de pago/renovación. */
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
  const { state } = await requireUser("/panel");
  if (state !== "activo") redirect("/suscripcion");
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
