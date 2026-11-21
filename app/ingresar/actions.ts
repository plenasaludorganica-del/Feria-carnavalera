"use server";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

function safeNext(v: FormDataEntryValue | null, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: "Falta conectar Supabase (ver .env.example)." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "El email o la contraseña no coinciden. Revisalos e intentá de nuevo." };
  redirect(safeNext(form.get("next"), "/panel"));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: "Falta conectar Supabase (ver .env.example)." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${await getSiteUrl()}/auth/callback?next=/suscripcion`,
    },
  });
  if (error) return { error: error.message.includes("registered") ? "Ese email ya tiene cuenta. Ingresá con tu contraseña." : error.message };
  // Si la confirmación por email está desactivada ya hay sesión: directo al pago.
  if (data.session) redirect("/suscripcion");
  return { info: `Te mandamos un email a ${email}. Abrí el enlace para confirmar tu cuenta y seguir con el pago.` };
}
