import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con SERVICE ROLE: saltea RLS. Usar SOLO en el servidor y solo
 * para el webhook de Mercado Pago (registrar pagos).
 */
/** true si la clave cargada es realmente una clave secreta (y no la pública). */
export function hasServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return key.startsWith("sb_secret_") || key.startsWith("eyJ");
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  if (!hasServiceKey()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no es una clave secreta (debe empezar con sb_secret_). Revisá Cloudflare → Variables y secretos.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
