import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { formatDate } from "@/lib/config";
import { requireUser } from "@/lib/session";
import { STATE_COPY, todayISO } from "@/lib/subscription";
import type { AdminSeller, SubscriptionState } from "@/lib/types";
import { setPaidUntil, toggleSuspend } from "./actions";

export const metadata: Metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

const BADGE: Record<SubscriptionState, string> = {
  activo: "badge-ok", vencido: "badge-bad", sin_pago: "badge-warn", suspendido: "badge-off",
};

export default async function Admin({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const { profile, supabase } = await requireUser("/admin");
  if (profile.role !== "admin") notFound();
  const sp = await searchParams;

  const { data } = await supabase.rpc("admin_list_sellers");
  const all = (data ?? []) as AdminSeller[];
  const q = (sp.q ?? "").toLowerCase();
  const rows = all.filter(
    (s) =>
      (!sp.estado || s.state === sp.estado) &&
      (!q || [s.display_name, s.email, s.whatsapp, s.city].some((v) => v?.toLowerCase().includes(q))),
  );
  const count = (st: SubscriptionState) => all.filter((s) => s.state === st).length;
  const thisMonth = todayISO().slice(0, 7);

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ paddingBottom: 64 }}>
          <h1 className="page-title" style={{ marginBottom: 20 }}>Vendedores</h1>
          <div className="stats">
            <div><b>{count("activo")}</b>Al día</div>
            <div><b>{count("vencido")}</b>Vencidos</div>
            <div><b>{count("sin_pago")}</b>Sin primer pago</div>
            <div><b>{count("suspendido")}</b>Suspendidos</div>
            <div><b>{all.reduce((n, s) => n + (s.sold_count ?? 0), 0)}</b>Ventas concretadas</div>
          </div>

          <form className="search" style={{ marginBottom: 16 }}>
            <label htmlFor="aq" className="sr-only">Buscar vendedor</label>
            <input id="aq" name="q" defaultValue={sp.q} placeholder="Nombre, email, WhatsApp o ciudad" />
            <label htmlFor="estado" className="sr-only">Estado</label>
            <select id="estado" name="estado" defaultValue={sp.estado ?? ""} style={{ border: 0, background: "transparent", color: "var(--tinta)", padding: "0 .5rem" }}>
              <option value="">Todos</option>
              {(Object.keys(STATE_COPY) as SubscriptionState[]).map((k) => <option key={k} value={k}>{STATE_COPY[k].label}</option>)}
            </select>
            <button className="btn btn-fucsia">Filtrar</button>
          </form>

          <div className="table-wrap">
            <table className="admin">
              <thead>
                <tr>
                  <th>Vendedor</th><th>Contacto</th><th>Estado</th><th>Débito</th><th>Vence</th><th>Último pago</th>
                  <th>Publicados</th><th>Vendidos</th><th>Cobro manual</th><th>Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.display_name}</strong>{s.role === "admin" && " (admin)"}<br /><small>{s.city ?? ""}</small></td>
                    <td>{s.email}<br /><small>{s.whatsapp ? `+${s.whatsapp}` : "Sin WhatsApp"}</small></td>
                    <td><span className={`badge ${BADGE[s.state]}`}>{STATE_COPY[s.state].label}</span></td>
                    <td>{s.mp_preapproval_status === "authorized" ? "Activo" : s.mp_preapproval_status ?? "—"}</td>
                    <td>{formatDate(s.paid_until)}</td>
                    <td>{s.last_payment_at ? formatDate(s.last_payment_at) : "—"}</td>
                    <td>{s.products_count}</td>
                    <td>{s.sold_count}</td>
                    <td>
                      <form action={setPaidUntil}>
                        <input type="hidden" name="id" value={s.id} />
                        <label className="sr-only" htmlFor={`m-${s.id}`}>Pago hasta</label>
                        <input id={`m-${s.id}`} type="month" name="month" defaultValue={thisMonth} className="input" style={{ minHeight: 36, padding: "4px 8px", width: 150 }} />
                        <button className="btn btn-ghost btn-sm">Marcar pago</button>
                      </form>
                    </td>
                    <td>
                      <form action={toggleSuspend}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="value" value={String(!s.suspended)} />
                        <button className={`btn btn-sm ${s.suspended ? "btn-ghost" : "btn-peligro"}`}>
                          {s.suspended ? "Reactivar" : "Suspender"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={10} style={{ textAlign: "center", padding: 24 }}>No hay vendedores con ese filtro.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
