import "server-only";
import {
  getPayment,
  getPreapproval,
  searchAuthorizedPayments,
  searchPaymentsByUser,
  searchPreapprovalsByUser,
  type MPPreapproval,
} from "./mercadopago";
import { createAdminClient, hasServiceKey } from "./supabase/admin";

/**
 * Le pregunta a Mercado Pago por los pagos y la suscripción de un vendedor
 * y los registra (de forma idempotente: un mismo pago nunca suma dos veces).
 * Se usa al volver del checkout y al entrar al panel; el webhook hace lo mismo
 * en segundo plano cuando está configurado.
 */
export async function syncUserBilling(userId: string, hints: { preapprovalId?: string | null; paymentId?: string | null } = {}) {
  if (!hasServiceKey()) return;
  const db = createAdminClient();
  const register = (paymentId: string, status: string, amount: number, cur: string, ref: string | null, raw: unknown) =>
    db.rpc("register_payment", {
      p_user_id: userId,
      p_mp_payment_id: paymentId,
      p_status: status,
      p_amount: amount,
      p_currency: cur,
      p_preference_id: ref,
      p_raw: raw as Record<string, unknown>,
    });

  try {
    // 1) Suscripción (débito automático)
    let sub: MPPreapproval | undefined;
    if (hints.preapprovalId) {
      const s = await getPreapproval(hints.preapprovalId);
      if (s.external_reference === userId) sub = s;
    } else {
      const list = await searchPreapprovalsByUser(userId);
      sub = list.find((s) => s.status === "authorized") ?? list[0];
    }
    if (sub) {
      await db.rpc("set_preapproval", { p_user_id: userId, p_preapproval_id: sub.id, p_status: sub.status });
      for (const ap of await searchAuthorizedPayments(sub.id)) {
        if (ap.payment?.id) {
          await register(String(ap.payment.id), ap.payment.status, ap.transaction_amount, ap.currency_id, sub.id, ap);
        }
      }
    }

    // 2) Pagos sueltos (y cualquier pago con nuestra referencia)
    if (hints.paymentId) {
      const p = await getPayment(hints.paymentId);
      if (p.external_reference === userId) await register(String(p.id), p.status, p.transaction_amount, p.currency_id, p.order?.id ?? null, p);
    }
    for (const p of await searchPaymentsByUser(userId)) {
      await register(String(p.id), p.status, p.transaction_amount, p.currency_id, p.order?.id ?? null, p);
    }
  } catch (e) {
    console.error("[sync] no se pudo sincronizar con Mercado Pago:", e);
  }
}
