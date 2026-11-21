import "server-only";
import { supabaseConfigured } from "./config";
import { createClient } from "./supabase/server";

/** WhatsApp de soporte: el que el admin cargó en su panel (o el de la variable, si existe). */
export async function getSupportWhatsapp(): Promise<string | undefined> {
  if (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP) return process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  if (!supabaseConfigured) return undefined;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_support_whatsapp");
  return (data as string | null) ?? undefined;
}
