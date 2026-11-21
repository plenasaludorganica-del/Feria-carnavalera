import Image from "next/image";
import Link from "next/link";
import BrandWordmark from "@/components/BrandWordmark";
import CategoryNav from "@/components/CategoryNav";
import Parallax from "@/components/Parallax";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SparkleRain from "@/components/SparkleRain";
import { searchCatalog } from "@/lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const { items } = await searchCatalog({});
  const latest = items.slice(0, 12);

  return (
    <>
      <SiteHeader overHero />
      <Parallax />

      {/* PORTADA: capas con distinta profundidad + brillos */}
      <section className="hero" aria-label="Bienvenida">
        <div className="hero-stage" data-tilt>
          <div className="hero-layer hero-bg" data-depth="0.35" data-scope="hero">
            <Image src="/brand/fondo-plumas-brillos.webp" alt="" fill priority sizes="100vw" />
          </div>
          <div className="hero-layer hero-figure hero-figure-izq" data-depth="0.18" data-scope="hero">
            <Image src="/brand/comparsera.webp" alt="" width={420} height={753} sizes="(max-width: 760px) 44vw, 30vw" />
          </div>
          <div className="hero-layer hero-figure hero-figure-der" data-depth="0.1" data-scope="hero">
            <Image src="/brand/comparsero.webp" alt="" width={420} height={753} sizes="(max-width: 760px) 44vw, 30vw" />
          </div>
        </div>
        <SparkleRain className="hero-sparkles" />

        <div className="hero-content">
          <h1 className="wordmark" style={{ margin: 0 }}>
            <BrandWordmark />
          </h1>
          <p className="hero-lede">
            Plumas, piedrería y trajes que ya desfilaron, listos para salir otra vez.
          </p>
          <div className="hero-ctas">
            <Link href="/ingresar?modo=registro" className="btn btn-oro hero-cta-main">
              Quiero vender en la feria
            </Link>
            <Link href="#buscar" className="btn btn-claro hero-cta-main">Buscar insumos</Link>
          </div>
        </div>
      </section>

      {/* TELÓN: el catálogo sube por encima de la portada */}
      <main className="sheet" id="buscar">
        <div className="sheet-feathers" data-depth="-0.12" aria-hidden="true" />
        <div className="wrap">
          <div className="search-block">
            <SearchBar />
          </div>
          <CategoryNav />

          <section className="section" aria-labelledby="recien">
            <div className="section-head">
              <h2 id="recien">Recién llegados a la feria</h2>
              <Link href="/catalogo">Ver todo el catálogo</Link>
            </div>
            {latest.length ? (
              <ul className="grid">
                {latest.map((p, i) => (
                  <li key={p.id}><ProductCard item={p} priority={i < 4} /></li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <h2>Todavía no hay publicaciones</h2>
                <p>Sé la primera comparsa en ofrecer lo que le sobró del último carnaval.</p>
                <Link href="/ingresar?modo=registro" className="btn btn-oro">Publicar mis insumos</Link>
              </div>
            )}
          </section>

          <section className="section" aria-labelledby="como">
            <div className="section-head"><h2 id="como">Cómo vender en la feria</h2></div>
            <ol className="steps">
              <li>
                <h3>Creá tu cuenta</h3>
                <p>Con tu email. Te lleva un minuto.</p>
              </li>
              <li>
                <h3>Pagá la cuota del mes</h3>
                <p>Por Mercado Pago. Vence el último día de cada mes.</p>
              </li>
              <li>
                <h3>Publicá y recibí mensajes</h3>
                <p>Subí fotos y precio. Los compradores te escriben directo a tu WhatsApp.</p>
              </li>
            </ol>
          </section>

          <section className="section">
            <div className="cta-band">
              <div>
                <h2>¿Te quedaron plumas del último corso?</h2>
                <p>Hay comparsas armando el próximo carnaval que las están buscando.</p>
              </div>
              <Link href="/ingresar?modo=registro" className="btn btn-oro hero-cta-main">Quiero vender en la feria</Link>
            </div>
          </section>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
