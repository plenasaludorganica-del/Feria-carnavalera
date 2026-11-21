import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";
import { subscriptionState } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  const { profile } = await getSessionProfile();
  if (!profile) return NextResponse.json({ state: null }, { status: 401 });
  return NextResponse.json({ state: subscriptionState(profile), paid_until: profile.paid_until });
}
