"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";

export async function toggleRead(form: FormData) {
  const { supabase } = await requireUser("/admin/opiniones");
  await supabase.rpc("admin_mark_feedback_read", { p_id: Number(form.get("id")), p_read: form.get("read") === "true" });
  revalidatePath("/admin/opiniones");
}
