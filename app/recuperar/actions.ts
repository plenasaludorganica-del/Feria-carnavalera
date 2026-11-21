"use server";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/config";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type ResetState = { sent?: boolean; error?: string };

export async function requestReset(_: ResetState, form: FormData): Promise<ResetState> {
  if (!supabaseConfigured) return { error: "Falta conectar Supabase." };
  const email = String(form.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Escribí el email con el que te registraste." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getSiteUrl()}/auth/callback?next=/restablecer`,
  });
  if (error) console.error("[recuperar]", error.message);
  // Mismo mensaje exista o no la cuenta (no revelamos qué emails están registrados).
  return { sent: true };
}

export type NewPasswordState = { error?: string };

export async function setNewPassword(_: NewPasswordState, form: FormData): Promise<NewPasswordState> {
  const password = String(form.get("password") ?? "");
  const repeat = String(form.get("repeat") ?? "");
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== repeat) return { error: "Las dos contraseñas no coinciden. Escribilas de nuevo." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace venció. Pedí uno nuevo desde “¿Olvidaste tu contraseña?”." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo cambiar la contraseña. Probá con otra distinta a la anterior." };
  redirect("/panel?clave=1");
}
