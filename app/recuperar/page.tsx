import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getSupportWhatsapp } from "@/lib/support";
import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function Recuperar() {
  const support = await getSupportWhatsapp();
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap auth-wrap">
          <div className="paper">
            <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>Recuperar tu contraseña</h1>
            <p className="sub">Te mandamos un email con un enlace para elegir una nueva.</p>
            <ResetForm supportWhatsapp={support} />
            <p style={{ marginTop: 16 }}><Link href="/ingresar" style={{ color: "var(--tinta)" }}>Volver a ingresar</Link></p>
          </div>
        </div>
      </main>
    </>
  );
}
