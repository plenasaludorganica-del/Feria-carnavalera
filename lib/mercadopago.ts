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

/* =====================================================================
   DÉBITO AUTOMÁTICO (Suscripciones sin plan / "preapproval")
   - Se cobra el día 1 de cada mes (billing_day = 1): la cuota vence el
     último día del mes y se renueva sola al empezar el siguiente.
   - El primer cobro es proporcional a los días que quedan del mes actual.
   ===================================================================== */

export interface MPPreapproval {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  external_reference: string | null;
  init_point?: string;
  payer_email?: string;
}

export interface MPAuthorizedPayment {
  id: number;
  preapproval_id: string;
  status: string; // scheduled | processed | recycling | cancelled
  transaction_amount: number;
  currency_id: string;
  external_reference?: string | null;
  payment?: { id: number; status: string; status_detail?: string } | null;
}

async function mp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init?.method && init.method !== "GET" ? { "X-Idempotency-Key": crypto.randomUUID() } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${init?.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function createPreapproval(args: { userId: string; email: string; siteUrl: string }) {
  const base = {
    reason: "Feria del Comparsero — cuota mensual de vendedor",
    external_reference: args.userId,
    payer_email: args.email,
    back_url: `${args.siteUrl}/suscripcion/resultado`,
    status: "pending", // el vendedor autoriza la tarjeta en el checkout de Mercado Pago
  };
  const auto = { frequency: 1, frequency_type: "months", transaction_amount: monthlyPrice(), currency_id: currency() };
  try {
    return await mp<MPPreapproval>("/preapproval", {
      method: "POST",
      body: JSON.stringify({ ...base, auto_recurring: { ...auto, billing_day: 1, billing_day_proportional: true } }),
    });
  } catch (e) {
    // Si la cuenta no admite día fijo de cobro, se crea con cobro mensual desde hoy.
    console.warn("[mp] preapproval con billing_day rechazado, reintento sin él:", e);
    return mp<MPPreapproval>("/preapproval", { method: "POST", body: JSON.stringify({ ...base, auto_recurring: auto }) });
  }
}

export const getPreapproval = (id: string) => mp<MPPreapproval>(`/preapproval/${encodeURIComponent(id)}`);
export const getAuthorizedPayment = (id: string) =>
  mp<MPAuthorizedPayment>(`/authorized_payments/${encodeURIComponent(id)}`);
export const cancelPreapproval = (id: string) =>
  mp<MPPreapproval>(`/preapproval/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
/** Para cambiar la cuota a quienes ya están suscriptos. */
export const updatePreapprovalAmount = (id: string, amount: number) =>
  mp<MPPreapproval>(`/preapproval/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ auto_recurring: { transaction_amount: amount, currency_id: currency() } }),
  });
