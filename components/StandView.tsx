import { whatsappStandLink } from "@/lib/config";
import type { CatalogItem } from "@/lib/types";
import ProductCard from "./ProductCard";
import { IconWhatsapp } from "./icons";

export interface StandSeller {
  name: string;
  city: string | null;
  whatsapp: string | null;
  soldCount: number;
}

/** El "puesto" de un vendedor: cabecera con sus datos y todas sus publicaciones. */
export default function StandView({
  seller,
  items,
  preview = false,
}: {
  seller: StandSeller;
  items: CatalogItem[];
  preview?: boolean;
}) {
  const initial = seller.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="stand">
      <header className="stand-head paper" data-fx="rise">
        <div className="stand-avatar" aria-hidden="true">{initial}</div>
        <div className="stand-id">
          <h1>{seller.name || "Tu nombre o el de tu comparsa"}</h1>
          <p>
            {seller.city ?? "Ciudad sin especificar"}
            {" · "}
            {items.length === 1 ? "1 publicación" : `${items.length} publicaciones`}
            {seller.soldCount > 0 && ` · ${seller.soldCount} ${seller.soldCount === 1 ? "venta" : "ventas"} en la feria`}
          </p>
        </div>
        {seller.whatsapp ? (
          preview ? (
            <span className="btn btn-whatsapp stand-wa" aria-disabled="true"><IconWhatsapp /> Escribir por WhatsApp</span>
          ) : (
            <a className="btn btn-whatsapp stand-wa" href={whatsappStandLink(seller.whatsapp, seller.name)} target="_blank" rel="noopener noreferrer">
              <IconWhatsapp /> Escribir por WhatsApp
            </a>
          )
        ) : (
          <span className="stand-missing">Falta tu WhatsApp</span>
        )}
      </header>

      {items.length ? (
        <ul className="grid" style={{ marginTop: 20 }}>
          {items.map((it, i) => (
            <li key={it.id}>
              <ProductCard item={it} priority={i < 4} href={preview ? null : undefined} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty" style={{ marginTop: 20 }}>
          <h2>{preview ? "Tu puesto está vacío" : "Este puesto no tiene publicaciones ahora"}</h2>
          <p>{preview ? "Cargá tu primer insumo y aparece acá, tal como lo van a ver los compradores." : "Volvé a pasar en unos días."}</p>
        </div>
      )}
    </div>
  );
}
