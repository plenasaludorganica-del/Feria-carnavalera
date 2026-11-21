import type { Metadata } from "next";
import Link from "next/link";
import CategoryNav from "@/components/CategoryNav";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PAGE_SIZE, searchCatalog } from "@/lib/catalog";
import { categoryLabel, isCategory } from "@/lib/config";

type SP = Promise<{ q?: string; cat?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { cat, q } = await searchParams;
  return { title: q ? `“${q}”` : isCategory(cat) ? categoryLabel(cat) : "Catálogo" };
}

export default async function Catalogo({ searchParams }: { searchParams: SP }) {
  const { q = "", cat, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const validCat = isCategory(cat) ? cat : undefined;
  const { items, total } = await searchCatalog({ q, cat: validCat, page });
  const pages = Math.ceil(total / PAGE_SIZE);

  const heading = validCat ? categoryLabel(validCat) : "Todo el catálogo";
  const link = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (validCat) s.set("cat", validCat);
    s.set("page", String(p));
    return `/catalogo?${s}`;
  };

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap">
          <SearchBar defaultValue={q} cat={validCat} />
          <CategoryNav current={validCat ?? ""} q={q} />

          <section className="section" aria-labelledby="res" style={{ paddingTop: 24 }}>
            <div className="section-head">
              <h1 id="res" className="page-title">{q ? `Resultados para “${q}”` : heading}</h1>
            </div>
            <p className="results-note">
              {total === 1 ? "1 publicación" : `${total} publicaciones`}
              {q && validCat ? ` en ${categoryLabel(validCat)}` : ""}
            </p>

            {items.length ? (
              <ul className="grid">
                {items.map((p, i) => <li key={p.id}><ProductCard item={p} priority={i < 4} /></li>)}
              </ul>
            ) : (
              <div className="empty">
                <h2>No encontramos {q ? `“${q}”` : "publicaciones"}{validCat ? ` en ${categoryLabel(validCat)}` : ""}</h2>
                <p>Probá con otra palabra (por ejemplo “faisán” en vez de “plumas de faisán”) o mirá todas las categorías.</p>
                <Link href="/catalogo" className="btn btn-oro">Ver todo el catálogo</Link>
              </div>
            )}

            {pages > 1 && (
              <nav className="pager" aria-label="Páginas">
                {page > 1 && <Link className="btn btn-claro btn-sm" href={link(page - 1)}>Anterior</Link>}
                <span style={{ alignSelf: "center" }}>Página {page} de {pages}</span>
                {page < pages && <Link className="btn btn-claro btn-sm" href={link(page + 1)}>Siguiente</Link>}
              </nav>
            )}
          </section>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
