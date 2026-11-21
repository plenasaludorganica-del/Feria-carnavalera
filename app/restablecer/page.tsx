import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getSessionProfile } from "@/lib/session";
import NewPasswordForm from "./NewPasswordForm";

export const metadata: Metadata = { title: "Contraseña nueva" };
export const dynamic = "force-dynamic";

export default async function Restablecer() {
  const { user } = await getSessionProfile();
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap auth-wrap">
          <div className="paper">
            <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>Elegí tu contraseña nueva</h1>
            {user ? (
              <>
                <p className="sub">Para la cuenta {user.email}.</p>
                <NewPasswordForm />
              </>
            ) : (
              <>
                <p className="sub">El enlace venció o ya se usó. Pedí uno nuevo y abrilo desde este mismo dispositivo.</p>
                <Link href="/recuperar" className="btn btn-fucsia" style={{ width: "100%" }}>Pedir un enlace nuevo</Link>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
