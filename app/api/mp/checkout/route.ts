import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/config";
import { createSubscriptionPreference } from "@/lib/mercadopago";
import { getSessionProfile } from "@/lib/session";

// Crea la preferencia de pago y redirige al checkout de Mercado Pago.
export async function POST(req: NextRequest) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return NextResponse.redirect(new URL("/ingresar?next=/suscripcion", req.url), 303);
  if (profile.suspended) return NextResponse.redirect(new URL("/suscripcion", req.url), 303);

  try {
    const pref = await createSubscriptionPreference({ userId: user.id, email: user.email!, siteUrl });
    const useSandbox = process.env.MP_ACCESS_TOKEN?.startsWith("TEST-");
    return NextResponse.redirect(useSandbox ? pref.sandbox_init_point : pref.init_point, 303);
  } catch (e) {
    console.error("[mp/checkout]", e);
    return NextResponse.redirect(new URL("/suscripcion?error=pago", req.url), 303);
  }
}
