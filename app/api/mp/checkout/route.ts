import { NextResponse, type NextRequest } from "next/server";
import { createPreapproval, createSubscriptionPreference } from "@/lib/mercadopago";
import { getSessionProfile } from "@/lib/session";
import { getSiteUrl } from "@/lib/site-url";

/**
 * POST /api/mp/checkout            → activa el débito automático mensual (por defecto)
 * POST /api/mp/checkout?modo=unico → paga un solo mes (sin débito)
 */
export async function POST(req: NextRequest) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return NextResponse.redirect(new URL("/ingresar?next=/suscripcion", req.url), 303);
  if (profile.suspended) return NextResponse.redirect(new URL("/suscripcion", req.url), 303);
  const sandbox = process.env.MP_ACCESS_TOKEN?.startsWith("TEST-");
  const siteUrl = await getSiteUrl();

  try {
    if (new URL(req.url).searchParams.get("modo") === "unico") {
      const pref = await createSubscriptionPreference({ userId: user.id, email: user.email!, siteUrl });
      return NextResponse.redirect(sandbox ? pref.sandbox_init_point : pref.init_point, 303);
    }
    if (profile.mp_preapproval_status === "authorized") {
      return NextResponse.redirect(new URL("/panel", req.url), 303); // ya tiene débito activo
    }
    const sub = await createPreapproval({ userId: user.id, email: user.email!, siteUrl });
    if (!sub.init_point) throw new Error("Mercado Pago no devolvió init_point");
    return NextResponse.redirect(sub.init_point, 303);
  } catch (e) {
    console.error("[mp/checkout]", e);
    return NextResponse.redirect(new URL("/suscripcion?error=pago", req.url), 303);
  }
}
