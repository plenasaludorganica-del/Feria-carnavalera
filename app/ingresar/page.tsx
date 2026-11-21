import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AuthForm from "./AuthForm";

export const metadata: Metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ modo?: string; next?: string }> }) {
  const sp = await searchParams;
  const mode = sp.modo === "registro" ? "registro" : "ingreso";
  const next = sp.next?.startsWith("/") ? sp.next : "/panel";
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap auth-wrap">
          <div className="paper">
            <div className="tabs" role="tablist">
              <Link href={`/ingresar?next=${encodeURIComponent(next)}`} aria-current={mode === "ingreso" ? "page" : undefined}>Ya tengo cuenta</Link>
              <Link href={`/ingresar?modo=registro&next=${encodeURIComponent(next)}`} aria-current={mode === "registro" ? "page" : undefined}>Soy nuevo</Link>
            </div>
            <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>
              {mode === "registro" ? "Vendé en la Feria del Comparsero" : "Ingresá a tu panel"}
            </h1>
            <p className="sub">
              {mode === "registro"
                ? "Creás tu cuenta, armás tu puesto con fotos y precios, mirás cómo queda y recién ahí lo publicás."
                : "Para publicar, editar tus productos o renovar la cuota."}
            </p>
            <AuthForm mode={mode} next={next} />
          </div>
        </div>
      </main>
    </>
  );
}
