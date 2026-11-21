import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import { IconLupa, IconPersona } from "./icons";
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
          <Link href="/catalogo" className="nav-item">
            <IconLupa width={20} height={20} className="nav-ico" />
            <span className="nav-label">Catálogo</span>
          </Link>
          {profile?.role === "admin" && <Link href="/admin" className="nav-item"><span>Admin</span></Link>}
          <Link
            href={user ? "/panel" : "/ingresar"}
            className="btn btn-claro btn-sm nav-account"
            aria-label={user ? "Mi panel" : "Ingresar"}
          >
            <IconPersona />
            <span className="nav-label">{user ? "Mi panel" : "Ingresar"}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
