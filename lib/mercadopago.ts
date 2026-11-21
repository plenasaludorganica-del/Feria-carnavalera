import "server-only";
import crypto from "node:crypto";

const API = "https://api.mercadopago.com";

function token() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error("Falta MP_ACCESS_TOKEN");
  return t;
}

export const monthlyPrice = () => Number(process.env.MP_MONTHLY_PRICE ?? 5000);
export const currency = () => process.env.MP_CURRENCY ?? "ARS";

/** Crea una preferencia de Checkout Pro para pagar la cuota del mes. */
export async function createSubscriptionPreference(args: {
  userId: string;
  email: string;
  siteUrl: string;
}) {
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      items: [
        {
          id: "cuota-mensual",
          title: "Feria del Comparsero — cuota mensual de vendedor",
          quantity: 1,
          unit_price: monthlyPrice(),
          currency_id: currency(),
        },
      ],
      payer: { email: args.email },
      external_reference: args.userId, // así el webhook sabe a quién acreditar
      metadata: { user_id: args.userId, kind: "monthly_fee" },
      back_urls: {
        success: `${args.siteUrl}/suscripcion/resultado`,
        pending: `${args.siteUrl}/suscripcion/resultado`,
        failure: `${args.siteUrl}/suscripcion?error=pago`,
      },
      auto_return: "approved",
      notification_url: `${args.siteUrl}/api/mp/webhook`,
      statement_descriptor: "FERIA COMPARSERO",
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string; init_point: string; sandbox_init_point: string };
}

export interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  order?: { id?: string };
  metadata?: Record<string, unknown>;
}

/** Nunca confiamos en el cuerpo del webhook: consultamos el pago a la API. */
export async function getPayment(id: string): Promise<MPPayment> {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`No se pudo leer el pago ${id}: ${res.status}`);
  return res.json();
}

/**
 * Valida el header x-signature de Mercado Pago.
 * Manifest: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 */
export function verifySignature(opts: { signature: string | null; requestId: string | null; dataId: string }) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!opts.signature) return false;
  const parts = Object.fromEntries(
    opts.signature.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  let manifest = `id:${opts.dataId.toLowerCase()};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}
