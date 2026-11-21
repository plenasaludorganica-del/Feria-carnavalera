import "server-only";
import { headers } from "next/headers";

/**
 * Dirección pública del sitio. Usa NEXT_PUBLIC_SITE_URL si está cargada
 * (por ejemplo, cuando haya dominio propio); si no, la toma de la visita actual.
 */
export async function getSiteUrl() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
