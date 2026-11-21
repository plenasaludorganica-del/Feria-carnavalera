import type { Metadata } from "next";
import Link from "next/link";
import ConfirmButton from "@/components/ConfirmButton";
import { categoryLabel, formatDate, formatPrice, thumbUrl } from "@/lib/config";
import { requireUser } from "@/lib/session";
import { STATE_COPY, daysLeft } from "@/lib/subscription";
import type { OwnProduct } from "@/lib/types";
import ProfileForm from "./ProfileForm";
import { cancelAutoDebit, deleteProduct, markSold, setProductStatus } from "./actions";

export const metadata: Metadata = { title: "Mi panel" };

export default async function Panel({ searchParams }: { searchParams: Promise<{ bienvenida?: string; guardado?: string; vendido?: string; clave?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile, state, user } = await requireUser("/panel");
  const { data } = await supabase
    .from("products")
    .select("id, title, description, price, currency, category, condition, images, status, created_at, updated_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  const products = (data ?? []) as OwnProduct[];
  const live = state === "activo";
  const copy = STATE_COPY[state];
  const left = daysLeft(profile.paid_until);

  const hasContact = Boolean(profile.whatsapp);
  const hasProducts = products.some((p) => p.status === "active");
  const ready = hasContact && hasProducts;

  return (
    <div style={{ paddingBottom: 64 }}>
      <h1 className="page-title" style={{ marginBottom: 20 }}>
        {sp.bienvenida ? `¡Bienvenido a la feria, ${profile.display_name}!` : `Hola, ${profile.display_name}`}
      </h1>

      {sp.clave && <p className="form-ok paper" role="status" style={{ marginBottom: 16 }}>Listo, tu contraseña nueva quedó guardada.</p>}

      {!live && (
        <section className="paper setup" aria-labelledby="armar" data-fx="rise">
          <div className="setup-head">
            <h2 id="armar">{state === "vencido" ? "Tu puesto está oculto" : "Armá tu puesto"}</h2>
            <p className="sub" style={{ margin: 0 }}>
              {state === "vencido"
                ? `Tu cuota venció el ${formatDate(profile.paid_until)}. Tus publicaciones están guardadas: renovás y vuelven a verse tal cual.`
                : "Cargá todo con calma. Nadie lo ve hasta que lo publiques."}
            </p>
          </div>
          <ol className="setup-steps">
            <li data-done={hasContact}>
              <strong>Tus datos de contacto</strong>
              <span>{hasContact ? `WhatsApp +${profile.whatsapp}` : "Cargá tu WhatsApp acá al costado."}</span>
            </li>
            <li data-done={hasProducts}>
              <strong>Cargá tus insumos</strong>
              <span>{hasProducts ? `${products.length} cargado${products.length === 1 ? "" : "s"}` : "Hasta 5 fotos por publicación."}</span>
              {hasContact && <Link href="/panel/publicar" className="btn btn-ghost btn-sm">Cargar un insumo</Link>}
            </li>
            <li data-done={false}>
              <strong>Mirá cómo queda</strong>
              <span>Tu puesto, tal como lo van a ver los compradores.</span>
              <Link href="/panel/mi-puesto" className="btn btn-ghost btn-sm">Ver vista previa</Link>
            </li>
            <li data-done={false}>
              <strong>{state === "vencido" ? "Renová y publicá" : "Publicá tu puesto"}</strong>
              <span>Pagás la cuota con Mercado Pago y tu puesto aparece en la feria.</span>
              <form action="/api/mp/checkout" method="post">
                <button className="btn btn-oro btn-sm" disabled={!ready}>
                  {state === "vencido" ? "Renovar y publicar" : "Pagar y publicar"}
                </button>
              </form>
              {!ready && <small>Primero completá los pasos 1 y 2.</small>}
            </li>
          </ol>
        </section>
      )}

      <div className="panel-grid">
        <aside style={{ display: "grid", gap: 20 }}>
          {live && (
            <div className="paper">
              <div className="status" data-tone={copy.tone}>
                <strong>{copy.label}</strong>
                <span>Vence el {formatDate(profile.paid_until)}{left >= 0 ? ` (${left === 0 ? "hoy" : `en ${left} días`})` : ""}</span>
              </div>
              {profile.mp_preapproval_status === "authorized" ? (
                <>
                  <p className="sub" style={{ margin: "0 0 12px" }}>
                    Débito automático activo: Mercado Pago renueva tu cuota sola el día 1 de cada mes.
                  </p>
                  <form action={cancelAutoDebit}>
                    <button className="btn btn-ghost btn-sm" style={{ width: "100%" }}>Dar de baja el débito automático</button>
                  </form>
                </>
              ) : (
                <>
                  <p className="sub" style={{ margin: "0 0 12px" }}>
                    Sin débito automático: la cuota vence el último día del mes. Si no la renovás, tus publicaciones se ocultan, pero no se borran.
                  </p>
                  <Link href="/suscripcion" className="btn btn-oro" style={{ width: "100%" }}>Activar débito automático</Link>
                </>
              )}
              <Link href={`/puesto/${user.id}`} className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 10 }}>Ver mi puesto público</Link>
            </div>
          )}
          <div className="paper"><ProfileForm profile={profile} /></div>
          <form action="/auth/salir" method="post">
            <button className="btn btn-claro" style={{ width: "100%" }}>Cerrar sesión</button>
          </form>
        </aside>

        <section className="paper" aria-labelledby="mis">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2 id="mis" style={{ margin: 0 }}>Mis publicaciones ({products.length})</h2>
            {hasContact && <Link href="/panel/publicar" className="btn btn-oro">Cargar un insumo</Link>}
          </div>
          {sp.guardado && <p className="form-ok" role="status">Publicación guardada.</p>}
          {sp.vendido && <p className="form-ok" role="status">¡Felicitaciones por la venta! La publicación y sus fotos se borraron.</p>}
          {(profile.sold_count ?? 0) > 0 && (
            <p className="sub" style={{ margin: "0 0 12px" }}>
              Ya vendiste {profile.sold_count === 1 ? "1 insumo" : `${profile.sold_count} insumos`} en la feria.
            </p>
          )}
          {!hasContact && (
            <div className="notice">Cargá tu WhatsApp en “Tus datos de contacto” para poder cargar insumos. Es la forma en que te contactan los compradores.</div>
          )}

          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 12px" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: "0 0 6px" }}>Todavía no cargaste nada</p>
              <p className="sub">Empezá por lo que más se busca antes del carnaval: plumas y piedrería.</p>
              {hasContact && <Link href="/panel/publicar" className="btn btn-oro">Cargar mi primer insumo</Link>}
            </div>
          ) : (
            <ul className="mylist">
              {products.map((p) => {
                const paused = p.status === "paused";
                const badge = paused
                  ? { cls: "badge-off", txt: "Pausada" }
                  : live
                    ? { cls: "badge-ok", txt: "Visible" }
                    : { cls: "badge-warn", txt: "Lista, sin publicar" };
                return (
                  <li key={p.id} className="myitem" data-paused={paused}>
                    {p.images[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumbUrl(p.images[0])} alt="" loading="lazy" />
                      : <div className="ph" />}
                    <div>
                      <h3>{p.title}</h3>
                      <div className="meta">
                        <strong style={{ color: "var(--tinta)" }}>{formatPrice(Number(p.price), p.currency)}</strong>
                        <span>{categoryLabel(p.category)}</span>
                        <span>{p.images.length}/5 fotos</span>
                        <span className={`badge ${badge.cls}`}>{badge.txt}</span>
                      </div>
                    </div>
                    <div className="actions">
                      {live && (
                        <form action={markSold}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmButton
                            className="btn btn-vendido btn-sm"
                            message={`¿Vendiste “${p.title}”? Se quita de la feria y se borran sus fotos. No se puede deshacer.`}
                            pendingLabel="Quitando…"
                          >
                            Ya lo vendí
                          </ConfirmButton>
                        </form>
                      )}
                      {live && !paused && <Link className="btn btn-ghost btn-sm" href={`/producto/${p.id}`}>Ver</Link>}
                      <Link className="btn btn-ghost btn-sm" href={`/panel/editar/${p.id}`}>Editar</Link>
                      <form action={setProductStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value={paused ? "active" : "paused"} />
                        <button className="btn btn-ghost btn-sm">{paused ? "Reactivar" : "Pausar"}</button>
                      </form>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton
                          className="btn btn-peligro btn-sm"
                          ariaLabel={`Eliminar ${p.title}`}
                          message={`¿Eliminar “${p.title}”? Se borran la publicación y sus fotos.`}
                          pendingLabel="Eliminando…"
                        >
                          Eliminar
                        </ConfirmButton>
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
