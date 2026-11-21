import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p style={{ margin: 0 }}>Feria del Comparsero. Insumos de carnaval que vuelven a desfilar.</p>
        <p style={{ margin: 0, display: "flex", gap: 16 }}>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/ingresar?modo=registro">Vender en la feria</Link>
        </p>
      </div>
    </footer>
  );
}
