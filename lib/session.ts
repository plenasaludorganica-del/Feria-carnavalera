import "server-only";
import { redirect } from "next/navigation";
import { supabaseConfigured } from "./config";
import { createClient } from "./supabase/server";
import { subscriptionState } from "./subscription";
import type { Profile } from "./types";

export async function getSessionProfile() {
  if (!supabaseConfigured) return { user: null, profile: null, supabase: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, whatsapp, city, role, paid_until, suspended, admin_note, mp_preapproval_id, mp_preapproval_status, sold_count")
    .eq("id", user.id)
    .single<Profile>();
  return { user, profile, supabase };
}

/** Exige sesión. Si no hay, manda a /ingresar y vuelve a `next` después. */
export async function requireUser(next: string) {
  const s = await getSessionProfile();
  if (!s.user || !s.profile || !s.supabase) redirect(`/ingresar?next=${encodeURIComponent(next)}`);
  return { user: s.user, profile: s.profile, supabase: s.supabase, state: subscriptionState(s.profile) };
}
