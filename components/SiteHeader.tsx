import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import { getSessionProfile } from "@/lib/session";

export default async function SiteHeader({ overHero = false }: { overHero?: boolean }) {
  const { user, profile } = await getSessionProfile();
  return (
    <header className="site-header" data-solid={overHero ? "false" : "true"}>
      <div className="wrap">
        <Link href="/" className="wordmark" aria-label="Feria del Comparsero, inicio" style={{ height: 40 }}>
          <BrandWordmark size="sm" />
        </Link>
        <nav aria-label="Principal">
          <Link href="/catalogo">Catálogo</Link>
          {profile?.role === "admin" && <Link href="/admin">Admin</Link>}
          {user ? (
            <Link href="/panel" className="btn btn-claro btn-sm">Mi panel</Link>
          ) : (
            <Link href="/ingresar" className="btn btn-claro btn-sm">Ingresar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
