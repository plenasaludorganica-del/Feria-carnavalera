import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { requireUser } from "@/lib/session";
import { getSiteUrl } from "@/lib/site-url";
import { PriceForm, TestButton, TokenForm, WebhookForm } from "./Forms";

export const metadata: Metadata = { title: "Pagos" };
export const dynamic = "force-dynamic";

export default async function Pagos() {
  const { profile, supabase } = await requireUser("/admin/pagos");
  if (profile.role !== "admin") notFound();

  const [{ data: status }, { data: price }] = await Promise.all([
    supabase.rpc("admin_secret_status"),
    supabase.rpc("get_monthly_price"),
  ]);
  const rows = (status ?? []) as { name: string; configured: boolean; last4: string | null }[];
  const token = rows.find((r) => r.name === "mp_access_token");
  const hook = rows.find((r) => r.name === "mp_webhook_secret");
  const webhookUrl = `${await getSiteUrl()}/api/mp/webhook`;

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="wrap" style={{ paddingBottom: 64, maxWidth: 760 }}>
          <p style={{ margin: "0 0 8px" }}><Link href="/admin">← Vendedores</Link></p>
          <h1 className="page-title" style={{ marginBottom: 20 }}>Pagos</h1>
          <div style={{ display: "grid", gap: 20 }}>
            <TokenForm configured={Boolean(token?.configured)} last4={token?.last4 ?? null} />
            <PriceForm current={price ? Number(price) : null} />
            <TestButton />
            <WebhookForm configured={Boolean(hook?.configured)} url={webhookUrl} />
          </div>
        </div>
      </main>
    </>
  );
}
