import { NextResponse, type NextRequest } from "next/server";
import { getPayment, verifySignature } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook de Mercado Pago.
 * Configuralo en: Tus integraciones → tu app → Webhooks → evento "Pagos"
 *   URL: https://TU-DOMINIO/api/mp/webhook
 * 1) Valida la firma (x-signature) con MP_WEBHOOK_SECRET.
 * 2) Lee el pago desde la API (no confiamos en el body).
 * 3) Llama a register_payment(): idempotente, extiende paid_until y
 *    reactiva automáticamente al vendedor y sus productos.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const type = (body.type as string) ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    ((body.data as { id?: string | number } | undefined)?.id?.toString()) ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });

  const ok = verifySignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!ok) return NextResponse.json({ error: "firma inválida" }, { status: 401 });

  try {
    const pay = await getPayment(dataId);
    const userId = pay.external_reference;
    if (!userId) return NextResponse.json({ ignored: "sin external_reference" });

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("register_payment", {
      p_user_id: userId,
      p_mp_payment_id: String(pay.id),
      p_status: pay.status,
      p_amount: pay.transaction_amount,
      p_currency: pay.currency_id,
      p_preference_id: pay.order?.id ?? null,
      p_raw: pay as unknown as Record<string, unknown>,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, paid_until: data });
  } catch (e) {
    console.error("[mp/webhook]", e);
    // 500 → Mercado Pago reintenta más tarde
    return NextResponse.json({ error: "no procesado" }, { status: 500 });
  }
}
