import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { requireUser } from "@/lib/session";
import { toggleRead } from "./actions";

export const metadata: Metadata = { title: "Opiniones" };
export const dynamic = "force-dynamic";

interface Feedback { id: number; created_at: string; rating: number | null; message: string | null; page: string | null; read: boolean }

export default async function Opiniones() {
  const { profile, supabase } = await requireUser("/admin/opiniones");
  if (profile.role !== "admin") notFound();
  const { data } = await supabase.rpc("admin_list_feedback");
  const rows = (data ?? []) as Feedback[];
  const rated = rows.filter((r) => r.rating);
  const avg = rated.length ? rated.reduce((n, r) => n + (r.rating ?? 0), 0) / rated.length : 0;
  const unread = rows.filter((r) => !r.read).length;
  const fmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ paddingBottom: 64, maxWidth: 820 }}>
          <p style={{ margin: "0 0 8px" }}><Link href="/admin">← Vendedores</Link></p>
          <h1 className="page-title" style={{ marginBottom: 16 }}>Opiniones</h1>
          <div className="stats" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
            <div><b>{rows.length}</b>Recibidas</div>
            <div><b>{unread}</b>Sin leer</div>
            <div><b>{avg ? avg.toFixed(1) : "—"}</b>Puntaje promedio</div>
          </div>
          {rows.length === 0 ? (
            <div className="empty"><h2>Todavía no hay opiniones</h2><p>Cuando alguien use el botón “¿Qué le falta a la feria?”, aparece acá.</p></div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {rows.map((r) => (
                <li key={r.id} className="paper fb-item" data-read={r.read}>
                  <div className="fb-item-head">
                    <span className="fb-item-stars" aria-label={r.rating ? `${r.rating} de 5` : "Sin puntaje"}>
                      {r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "Sin puntaje"}
                    </span>
                    <small>{fmt.format(new Date(r.created_at))}{r.page ? ` · desde ${r.page}` : ""}</small>
                  </div>
                  {r.message && <p style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>{r.message}</p>}
                  <form action={toggleRead} style={{ marginTop: 10 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="read" value={String(!r.read)} />
                    <button className="btn btn-ghost btn-sm">{r.read ? "Marcar sin leer" : "Marcar como leída"}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
