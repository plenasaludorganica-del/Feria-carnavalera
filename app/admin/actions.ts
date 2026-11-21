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

/** Cobro manual (efectivo o transferencia): deja paga la cuota hasta fin del mes elegido. */
export async function setPaidUntil(form: FormData) {
  const { supabase } = await requireUser("/admin");
  const month = String(form.get("month") ?? ""); // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) return;
  await supabase.rpc("admin_set_paid_until", { uid: String(form.get("id")), until: `${month}-01`, note: "cobro manual" });
  revalidatePath("/admin");
}
