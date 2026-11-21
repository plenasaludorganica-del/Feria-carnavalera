import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { syncUserBilling } from "@/lib/billing-sync";
import { getSessionProfile } from "@/lib/session";
import WaitForActivation from "./WaitForActivation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confirmando pago" };

export default async function Resultado({ searchParams }: { searchParams: Promise<{ status?: string; collection_status?: string; preapproval_id?: string; payment_id?: string; collection_id?: string }> }) {
  const sp = await searchParams;
  const status = sp.collection_status ?? sp.status ?? "";
  const { user } = await getSessionProfile();
  if (user) {
    await syncUserBilling(user.id, { preapprovalId: sp.preapproval_id, paymentId: sp.payment_id ?? sp.collection_id });
  }
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap" style={{ paddingBottom: 64 }}>
          <div className="paper pay-card">
            <WaitForActivation pending={status === "pending" || status === "in_process"} />
          </div>
        </div>
      </main>
    </>
  );
}
