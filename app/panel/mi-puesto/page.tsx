import type { Metadata } from "next";
import Link from "next/link";
import StandView from "@/components/StandView";
import { requireUser } from "@/lib/session";
import type { CatalogItem } from "@/lib/types";

export const metadata: Metadata = { title: "Así se ve tu puesto" };

export default async function MiPuesto() {
  const { supabase, profile, user, state } = await requireUser("/panel/mi-puesto");
  const { data } = await supabase
    .from("products")
    .select("id, title, price, currency, category, condition, images, created_at")
    .eq("seller_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const items: CatalogItem[] = (data ?? []).map((p) => ({ ...p, cover: p.images?.[0] ?? null, city: profile.city })) as CatalogItem[];
  const live = state === "activo";

  return (
    <div style={{ paddingBottom: 64 }}>
      <div className="preview-bar" role="status">
        <div>
          <strong>{live ? "Tu puesto está publicado" : "Vista previa de tu puesto"}</strong>
          <span>
            {live
              ? "Así lo ven los compradores ahora mismo."
              : "Así lo van a ver los compradores. Todavía no es público: se publica cuando pagás la cuota."}
          </span>
        </div>
        <div className="preview-actions">
          <Link href="/panel" className="btn btn-claro btn-sm">Volver a editar</Link>
          {live ? (
            <Link href={`/puesto/${user.id}`} className="btn btn-oro btn-sm">Ver mi puesto público</Link>
          ) : (
            <form action="/api/mp/checkout" method="post">
              <button className="btn btn-oro btn-sm" disabled={!profile.whatsapp || !items.length}>Pagar y publicar</button>
            </form>
          )}
        </div>
      </div>
      <StandView
        preview
        seller={{ name: profile.display_name, city: profile.city, whatsapp: profile.whatsapp, soldCount: profile.sold_count ?? 0 }}
        items={items}
      />
    </div>
  );
}
