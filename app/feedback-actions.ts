"use server";
import { supabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type FeedbackState = { ok?: boolean; error?: string };

/** Opinión anónima: no se guarda quién la mandó. */
export async function sendFeedback(_: FeedbackState, form: FormData): Promise<FeedbackState> {
  if (String(form.get("website") ?? "")) return { ok: true }; // trampa para robots
  const rating = Number(form.get("rating") || 0) || null;
  const message = String(form.get("message") ?? "").trim().slice(0, 1500);
  const kind = form.get("kind") === "problema" ? "problema" : "opinion";
  const contact = String(form.get("contact") ?? "").trim().slice(0, 120);
  if (kind === "problema" && !message) return { error: "Contanos qué problema tuviste." };
  if (!rating && !message) return { error: "Elegí las estrellas o escribí algo." };
  if (!supabaseConfigured) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_feedback", {
    p_rating: rating,
    p_message: message || null,
    p_page: String(form.get("page") ?? "").slice(0, 200) || null,
    p_kind: kind,
    p_contact: kind === "problema" ? contact || null : null,
  });
  if (error) return { error: "No se pudo enviar. Probá de nuevo en un rato." };
  return { ok: true };
}
