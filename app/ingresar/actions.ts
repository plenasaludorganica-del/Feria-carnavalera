"use server";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient, hasServiceKey } from "@/lib/supabase/admin";
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

  // Con la clave de servidor creamos la cuenta ya confirmada: no depende de
  // que Supabase pueda mandar el email de confirmación.
  if (hasServiceKey()) {
    const { error: createError } = await createAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    });
    if (createError) {
      console.error("[registro] createUser:", createError.message);
      const taken = /already|registered|exists/i.test(createError.message);
      return { error: taken ? "Ese email ya tiene cuenta. Ingresá con tu contraseña." : "No se pudo crear la cuenta. Revisá el email e intentá de nuevo." };
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) return { error: "La cuenta se creó, pero no pudimos iniciar sesión. Probá ingresar." };
    redirect("/panel?bienvenida=1");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${await getSiteUrl()}/auth/callback?next=/panel`,
    },
  });
  if (error) return { error: error.message.includes("registered") ? "Ese email ya tiene cuenta. Ingresá con tu contraseña." : error.message };
  // Si la confirmación por email está desactivada ya hay sesión: directo al pago.
  if (data.session) redirect("/panel?bienvenida=1");
  return { info: `Te mandamos un email a ${email}. Abrí el enlace para confirmar tu cuenta y armar tu puesto.` };
}
