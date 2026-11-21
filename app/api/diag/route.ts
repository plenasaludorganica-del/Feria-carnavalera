import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasServiceKey } from "@/lib/supabase/admin";

// Recibe un pequeño reporte del navegador (diagnóstico de efectos en celulares).
export async function POST(req: NextRequest) {
  try {
    const text = (await req.text()).slice(0, 4000);
    const data = JSON.parse(text);
    data.ua = req.headers.get("user-agent")?.slice(0, 300);
    if (hasServiceKey()) await createAdminClient().from("client_diag").insert({ data });
  } catch {}
  return NextResponse.json({ ok: true });
}
