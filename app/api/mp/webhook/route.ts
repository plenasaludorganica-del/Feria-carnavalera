import { NextResponse, type NextRequest } from "next/server";
import { getAuthorizedPayment, getPayment, getPreapproval, verifySignature } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook de Mercado Pago.  URL: https://TU-DOMINIO/api/mp/webhook
 * Eventos a activar en el panel de Mercado Pago:
 *   - Pagos                         (type = "payment")
 *   - Planes y suscripciones        (type = "subscription_preapproval")
 *   - Pagos recurrentes             (type = "subscription_authorized_payment")
 *
 * Siempre: valida la firma, consulta el recurso a la API (no confiamos en el
 * body) y registra en Supabase de forma idempotente.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const type = (body.type as string) ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    (body.data as { id?: string | number } | undefined)?.id?.toString() ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");
  if (!type || !dataId) return NextResponse.json({ ignored: true });

  const ok = verifySignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!ok) return NextResponse.json({ error: "firma inválida" }, { status: 401 });

  const db = createAdminClient();
  const register = async (userId: string, paymentId: string, status: string, amount: number, cur: string, ref: string | null, raw: unknown) => {
    const { error } = await db.rpc("register_payment", {
      p_user_id: userId, p_mp_payment_id: paymentId, p_status: status,
      p_amount: amount, p_currency: cur, p_preference_id: ref, p_raw: raw as Record<string, unknown>,
    });
    if (error) throw error;
  };

  try {
    switch (type) {
      // Alta, pausa o baja del débito automático
      case "subscription_preapproval": {
        const sub = await getPreapproval(dataId);
        if (!sub.external_reference) break;
        const { error } = await db.rpc("set_preapproval", {
          p_user_id: sub.external_reference, p_preapproval_id: sub.id, p_status: sub.status,
        });
        if (error) throw error;
        break;
      }
      // Cada cobro mensual del débito automático
      case "subscription_authorized_payment": {
        const ap = await getAuthorizedPayment(dataId);
        if (!ap.payment?.id) break; // todavía programado, sin pago real
        let userId = ap.external_reference ?? null;
        if (!userId) userId = (await getPreapproval(ap.preapproval_id)).external_reference;
        if (!userId) break;
        await register(userId, String(ap.payment.id), ap.payment.status, ap.transaction_amount, ap.currency_id, ap.preapproval_id, ap);
        break;
      }
      // Pago suelto (o el pago que genera la suscripción, si trae external_reference)
      case "payment": {
        const pay = await getPayment(dataId);
        if (!pay.external_reference) break;
        await register(pay.external_reference, String(pay.id), pay.status, pay.transaction_amount, pay.currency_id, pay.order?.id ?? null, pay);
        break;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[mp/webhook]", type, dataId, e);
    return NextResponse.json({ error: "no procesado" }, { status: 500 }); // Mercado Pago reintenta
  }
}
