"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";

export async function toggleSuspend(form: FormData) {
  const { supabase } = await requireUser("/admin");
  await supabase.rpc("admin_set_suspended", {
    uid: String(form.get("id")),
    value: form.get("value") === "true",
    note: String(form.get("note") ?? "") || null,
  });
  revalidatePath("/admin");
}

/** Cobro manual (efectivo o transferencia): deja paga la cuota hasta la fecha elegida. */
export async function setPaidUntil(form: FormData) {
  const { supabase } = await requireUser("/admin");
  const until = String(form.get("until") ?? ""); // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return;
  await supabase.rpc("admin_set_paid_until", { uid: String(form.get("id")), until, note: "cobro manual" });
  revalidatePath("/admin");
}

export type TempPasswordState = { password?: string; error?: string };

/** Genera una contraseña temporal fácil de dictar (sin letras confusas como l/1, O/0). */
function tempPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const body = Array.from(bytes, (b) => abc[b % abc.length]).join("");
  return `feria-${body}`;
}

export async function makeTempPassword(_: TempPasswordState, form: FormData): Promise<TempPasswordState> {
  const { supabase } = await requireUser("/admin");
  const password = tempPassword();
  const { error } = await supabase.rpc("admin_set_password", { uid: String(form.get("id")), new_password: password });
  if (error) return { error: "No se pudo cambiar. Volvé a intentar." };
  return { password };
}
