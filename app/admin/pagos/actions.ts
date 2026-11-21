"use server";
import { revalidatePath } from "next/cache";
import { getMe, updatePreapprovalAmount } from "@/lib/mercadopago";
import { requireUser } from "@/lib/session";

export type PagosState = { ok?: string; error?: string };

async function requireAdmin() {
  const s = await requireUser("/admin/pagos");
  if (s.profile.role !== "admin") throw new Error("solo administradores");
  return s;
}

export async function saveToken(_: PagosState, form: FormData): Promise<PagosState> {
  const { supabase } = await requireAdmin();
  const token = String(form.get("token") ?? "").trim();
  if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
    return { error: "El token tiene que empezar con APP_USR- (lo copiás de Mercado Pago → Tus integraciones → Credenciales de producción → Access Token)." };
  }
  const { error } = await supabase.rpc("admin_set_secret", { p_name: "mp_access_token", p_value: token });
  if (error) return { error: "No se pudo guardar el token. Volvé a intentar." };
  revalidatePath("/admin/pagos");
  // Probamos enseguida que funcione
  try {
    const me = await getMe();
    return { ok: `Token guardado y funcionando: cuenta de Mercado Pago “${me.nickname}”${me.email ? ` (${me.email})` : ""}.` };
  } catch {
    return { error: "Se guardó, pero Mercado Pago no lo reconoce. Revisá que sea el Access Token de producción completo." };
  }
}

export async function saveWebhookSecret(_: PagosState, form: FormData): Promise<PagosState> {
  const { supabase } = await requireAdmin();
  const value = String(form.get("secret") ?? "").trim();
  if (value.length < 10) return { error: "Pegá la clave secreta completa que te da Mercado Pago en Webhooks." };
  const { error } = await supabase.rpc("admin_set_secret", { p_name: "mp_webhook_secret", p_value: value });
  if (error) return { error: "No se pudo guardar. Volvé a intentar." };
  revalidatePath("/admin/pagos");
  return { ok: "Clave del webhook guardada." };
}

export async function savePrice(_: PagosState, form: FormData): Promise<PagosState> {
  const { supabase } = await requireAdmin();
  const raw = String(form.get("price") ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const price = Number(raw);
  if (!Number.isFinite(price) || price <= 0) return { error: "Escribí el precio solo con números, por ejemplo 5000." };
  const { error } = await supabase.rpc("admin_set_setting", { p_key: "monthly_price", p_value: String(price) });
  if (error) return { error: "No se pudo guardar el precio." };

  // Actualiza el monto a quienes ya tienen débito automático activo
  const { data: subs } = await supabase
    .from("profiles")
    .select("mp_preapproval_id")
    .eq("mp_preapproval_status", "authorized")
    .not("mp_preapproval_id", "is", null);
  let updated = 0;
  for (const s of subs ?? []) {
    try { await updatePreapprovalAmount(s.mp_preapproval_id as string, price); updated++; } catch (e) { console.error("[precio]", e); }
  }
  revalidatePath("/admin/pagos");
  revalidatePath("/suscripcion");
  return { ok: `Precio guardado.${updated ? ` Se actualizó en ${updated} débito${updated === 1 ? "" : "s"} automático${updated === 1 ? "" : "s"}.` : ""}` };
}

export async function testConnection(_: PagosState): Promise<PagosState> {
  await requireAdmin();
  try {
    const me = await getMe();
    return { ok: `Conectado a la cuenta de Mercado Pago “${me.nickname}”${me.email ? ` (${me.email})` : ""}. Los cobros van a entrar ahí.` };
  } catch (e) {
    const msg = String(e);
    return { error: msg.includes("Falta el token") ? "Todavía no cargaste el token." : "Mercado Pago no reconoce el token. Volvé a pegarlo." };
  }
}
