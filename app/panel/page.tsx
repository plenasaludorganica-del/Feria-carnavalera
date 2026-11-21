import type { Metadata } from "next";
import Link from "next/link";
import { categoryLabel, formatDate, formatPrice } from "@/lib/config";
import { requireUser } from "@/lib/session";
import { STATE_COPY, daysLeft } from "@/lib/subscription";
import type { OwnProduct } from "@/lib/types";
import ProfileForm from "./ProfileForm";
import { deleteProduct, setProductStatus } from "./actions";

export const metadata: Metadata = { title: "Mi panel" };

export default async function Panel({ searchParams }: { searchParams: Promise<{ bienvenida?: string; guardado?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile, state, user } = await requireUser("/panel");
  const { data } = await supabase
    .from("products")
    .select("id, title, description, price, currency, category, condition, images, status, created_at, updated_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  const products = (data ?? []) as OwnProduct[];
  const copy = STATE_COPY[state];
  const left = daysLeft(profile.paid_until);

  return (
    <div style={{ paddingBottom: 64 }}>
      <h1 className="page-title" style={{ marginBottom: 20 }}>
        {sp.bienvenida ? `¡Bienvenido a la feria, ${profile.display_name}!` : `Hola, ${profile.display_name}`}
      </h1>

      <div className="panel-grid">
        <aside style={{ display: "grid", gap: 20 }}>
          <div className="paper">
            <div className="status" data-tone={copy.tone}>
              <strong>{copy.label}</strong>
              <span>Vence el {formatDate(profile.paid_until)}{left >= 0 ? ` (${left === 0 ? "hoy" : `en ${left} días`})` : ""}</span>
            </div>
            <p className="sub" style={{ margin: "0 0 12px" }}>
              La cuota vence el último día de cada mes. Si no la renovás, tus publicaciones se ocultan, pero no se borran.
            </p>
            <Link href="/suscripcion" className="btn btn-ghost" style={{ width: "100%" }}>Adelantar el próximo mes</Link>
          </div>
          <div className="paper"><ProfileForm profile={profile} /></div>
          <form action="/auth/salir" method="post">
            <button className="btn btn-claro" style={{ width: "100%" }}>Cerrar sesión</button>
          </form>
        </aside>

        <section className="paper" aria-labelledby="mis">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2 id="mis" style={{ margin: 0 }}>Mis publicaciones ({products.length})</h2>
            {profile.whatsapp && <Link href="/panel/publicar" className="btn btn-oro">Publicar un insumo</Link>}
          </div>
          {sp.guardado && <p className="form-ok" role="status">Publicación guardada.</p>}
          {!profile.whatsapp && (
            <div className="notice">Cargá tu WhatsApp en “Tus datos de contacto” para poder publicar. Es la forma en que te contactan los compradores.</div>
          )}

          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 12px" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: "0 0 6px" }}>Todavía no publicaste nada</p>
              <p className="sub">Empezá por lo que más se busca antes del carnaval: plumas y piedrería.</p>
              {profile.whatsapp && <Link href="/panel/publicar" className="btn btn-oro">Publicar mi primer insumo</Link>}
            </div>
          ) : (
            <ul className="mylist">
              {products.map((p) => {
                const paused = p.status === "paused";
                return (
                  <li key={p.id} className="myitem" data-paused={paused}>
                    {p.images[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.images[0]} alt="" loading="lazy" />
                      : <div className="ph" />}
                    <div>
                      <h3>{p.title}</h3>
                      <div className="meta">
                        <strong style={{ color: "var(--tinta)" }}>{formatPrice(Number(p.price), p.currency)}</strong>
                        <span>{categoryLabel(p.category)}</span>
                        <span className={`badge ${paused ? "badge-off" : "badge-ok"}`}>{paused ? "Pausada" : "Visible"}</span>
                      </div>
                    </div>
                    <div className="actions">
                      {!paused && <Link className="btn btn-ghost btn-sm" href={`/producto/${p.id}`}>Ver</Link>}
                      <Link className="btn btn-ghost btn-sm" href={`/panel/editar/${p.id}`}>Editar</Link>
                      <form action={setProductStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value={paused ? "active" : "paused"} />
                        <button className="btn btn-ghost btn-sm">{paused ? "Reactivar" : "Pausar"}</button>
                      </form>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="btn btn-peligro btn-sm" aria-label={`Eliminar ${p.title}`}>Eliminar</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
