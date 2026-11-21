import "server-only";
import crypto from "node:crypto";
import { createAdminClient, hasServiceKey } from "./supabase/admin";

const API = "https://api.mercadopago.com";

/* =====================================================================
   CONFIGURACIÓN
   El token y la clave del webhook se cargan desde Admin → Pagos
   (quedan cifrados en Supabase Vault). Si existen como variables de
   entorno en Cloudflare, esas tienen prioridad.
   ===================================================================== */

async function readSecret(name: "mp_access_token" | "mp_webhook_secret") {
  if (!hasServiceKey()) return null;
  const { data } = await createAdminClient().rpc("get_app_secret", { p_name: name });
  return (data as string | null) || null;
}

export async function getAccessToken() {
  const t = process.env.MP_ACCESS_TOKEN || (await readSecret("mp_access_token"));
  if (!t) throw new Error("Falta el token de Mercado Pago (Admin → Pagos)");
  return t;
}

async function getWebhookSecret() {
  return process.env.MP_WEBHOOK_SECRET || (await readSecret("mp_webhook_secret"));
}

/** Precio de la cuota: Admin → Pagos; si no, la variable MP_MONTHLY_PRICE; si no, 5000. */
export async function getMonthlyPrice(): Promise<number> {
  if (hasServiceKey()) {
    const { data } = await createAdminClient().rpc("get_monthly_price");
    if (data) return Number(data);
  }
  return Number(process.env.MP_MONTHLY_PRICE ?? 5000);
}

/** Precio promocional (si está activo). */
export async function getPromoPrice(): Promise<number | null> {
  if (!hasServiceKey()) return null;
  const { data } = await createAdminClient().rpc("get_promo_price");
  return data ? Number(data) : null;
}

/** Lo que se cobra hoy: la promo si está activa, si no el precio normal. */
export async function getChargePrice(): Promise<number> {
  return (await getPromoPrice()) ?? (await getMonthlyPrice());
}

export const currency = () => process.env.MP_CURRENCY ?? "ARS";

async function mp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
      ...(init?.method && init.method !== "GET" ? { "X-Idempotency-Key": crypto.randomUUID() } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${init?.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** Para "Probar conexión" en Admin → Pagos: a qué cuenta pertenece el token. */
export const getMe = () => mp<{ id: number; nickname: string; email?: string; site_id: string }>("/users/me");

/* =====================================================================
   PAGO SUELTO (Checkout Pro): "pagar solo este mes"
   ===================================================================== */
export async function createSubscriptionPreference(args: { userId: string; email: string; siteUrl: string }) {
  return mp<{ id: string; init_point: string; sandbox_init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          id: "cuota-mensual",
          title: "Feria del Comparsero — cuota mensual de vendedor",
          quantity: 1,
          unit_price: await getChargePrice(),
          currency_id: currency(),
        },
      ],
      payer: { email: args.email },
      external_reference: args.userId, // así sabemos a quién acreditar
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
}

export interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  date_created?: string;
  order?: { id?: string };
  metadata?: Record<string, unknown>;
}

/** Nunca confiamos en lo que llega al webhook: consultamos el pago a la API. */
export const getPayment = (id: string) => mp<MPPayment>(`/v1/payments/${encodeURIComponent(id)}`);

export async function searchPaymentsByUser(userId: string) {
  const q = new URLSearchParams({ external_reference: userId, sort: "date_created", criteria: "desc", limit: "20" });
  const r = await mp<{ results: MPPayment[] }>(`/v1/payments/search?${q}`);
  return r.results ?? [];
}

/**
 * Valida la firma x-signature de Mercado Pago, si hay clave cargada.
 * Sin clave, se acepta igual: el webhook siempre re-consulta el pago a la
 * API con nuestro token, así que un aviso falso no puede activar a nadie.
 */
export async function verifySignature(opts: { signature: string | null; requestId: string | null; dataId: string }) {
  const secret = await getWebhookSecret();
  if (!secret) return true;
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
   - El primer cobro es el día que el vendedor se suscribe y después se
     cobra solo, todos los meses, ese mismo día (pagó un 21 → todos los 21).
   ===================================================================== */

export interface MPPreapproval {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  external_reference: string | null;
  init_point?: string;
  payer_email?: string;
  date_created?: string;
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

export async function createPreapproval(args: { userId: string; email: string; siteUrl: string }) {
  const base = {
    reason: "Feria del Comparsero — cuota mensual de vendedor",
    external_reference: args.userId,
    payer_email: args.email,
    back_url: `${args.siteUrl}/suscripcion/resultado`,
    status: "pending", // el vendedor autoriza su tarjeta en Mercado Pago
  };
  const auto = { frequency: 1, frequency_type: "months", transaction_amount: await getChargePrice(), currency_id: currency() };
  return mp<MPPreapproval>("/preapproval", { method: "POST", body: JSON.stringify({ ...base, auto_recurring: auto }) });
}

export const getPreapproval = (id: string) => mp<MPPreapproval>(`/preapproval/${encodeURIComponent(id)}`);

export async function searchPreapprovalsByUser(userId: string) {
  const q = new URLSearchParams({ external_reference: userId, sort: "date_created:desc", limit: "5" });
  const r = await mp<{ results: MPPreapproval[] }>(`/preapproval/search?${q}`);
  return r.results ?? [];
}

export async function searchAuthorizedPayments(preapprovalId: string) {
  const q = new URLSearchParams({ preapproval_id: preapprovalId, limit: "20" });
  const r = await mp<{ results: MPAuthorizedPayment[] }>(`/authorized_payments/search?${q}`);
  return r.results ?? [];
}

export const getAuthorizedPayment = (id: string) =>
  mp<MPAuthorizedPayment>(`/authorized_payments/${encodeURIComponent(id)}`);

export const cancelPreapproval = (id: string) =>
  mp<MPPreapproval>(`/preapproval/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });

/** Para cambiar la cuota a quienes ya están suscriptos. */
export async function updatePreapprovalAmount(id: string, amount: number) {
  return mp<MPPreapproval>(`/preapproval/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ auto_recurring: { transaction_amount: amount, currency_id: currency() } }),
  });
}
