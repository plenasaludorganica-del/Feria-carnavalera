import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap">
          <div className="empty" style={{ maxWidth: 560, margin: "40px auto" }}>
            <h2>Esta publicación ya no está en la feria</h2>
            <p>Puede que se haya vendido o que el vendedor la haya pausado.</p>
            <Link href="/catalogo" className="btn btn-oro">Seguir buscando</Link>
          </div>
        </div>
      </main>
    </>
  );
}
