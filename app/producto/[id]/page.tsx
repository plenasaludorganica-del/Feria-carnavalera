import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { IconWhatsapp } from "@/components/icons";
import { getProduct } from "@/lib/catalog";
import { CONDITIONS, categoryLabel, formatPrice, whatsappLink } from "@/lib/config";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).id);
  if (!p) return { title: "Publicación no disponible" };
  return {
    title: p.title,
    description: p.description.slice(0, 150),
    openGraph: { images: p.images.slice(0, 1) },
  };
}

export default async function Producto({ params }: { params: Params }) {
  const p = await getProduct((await params).id);
  if (!p) notFound();

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap" style={{ paddingBottom: 48 }}>
          <nav className="crumbs" aria-label="Ruta">
            <Link href="/catalogo">Catálogo</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/catalogo?cat=${p.category}`}>{categoryLabel(p.category)}</Link>
          </nav>

          <article className="product">
            <ProductGallery images={p.images} title={p.title} />
            <div className="product-info">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="chip" data-cat={p.category}>{categoryLabel(p.category)}</span>
                <span className="chip">{CONDITIONS[p.condition as keyof typeof CONDITIONS] ?? "Usado"}</span>
              </div>
              <h1>{p.title}</h1>
              <div className="product-price">{formatPrice(Number(p.price), p.currency)}</div>

              <a className="btn btn-whatsapp" href={whatsappLink(p.whatsapp, p.title)} target="_blank" rel="noopener noreferrer">
                <IconWhatsapp /> Escribir al vendedor por WhatsApp
              </a>
              <p className="contact-note">Coordiná el pago y la entrega directamente con quien vende.</p>

              <div className="seller-box">
                <strong>{p.seller_name}</strong>
                {p.seller_city ?? "Ciudad sin especificar"}
                <Link href={`/puesto/${p.seller_id}`} className="seller-link">Ver todo lo que vende</Link>
              </div>

              {p.description && (
                <div>
                  <h2 style={{ fontSize: "1.05rem", margin: "4px 0 6px" }}>Descripción</h2>
                  <p className="product-desc" style={{ margin: 0 }}>{p.description}</p>
                </div>
              )}
            </div>
          </article>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
