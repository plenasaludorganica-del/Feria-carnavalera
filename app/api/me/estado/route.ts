import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";
import { subscriptionState } from "@/lib/subscription";
import { syncUserBilling } from "@/lib/billing-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  let { profile } = await getSessionProfile();
  if (!profile) return NextResponse.json({ state: null }, { status: 401 });
  if (subscriptionState(profile) !== "activo") {
    await syncUserBilling(profile.id);
    profile = (await getSessionProfile()).profile ?? profile;
  }
  return NextResponse.json({ state: subscriptionState(profile), paid_until: profile.paid_until });
}
