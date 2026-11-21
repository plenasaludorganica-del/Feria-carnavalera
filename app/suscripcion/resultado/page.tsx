import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import WaitForActivation from "./WaitForActivation";

export const metadata: Metadata = { title: "Confirmando pago" };

export default async function Resultado({ searchParams }: { searchParams: Promise<{ status?: string; collection_status?: string }> }) {
  const sp = await searchParams;
  const status = sp.collection_status ?? sp.status ?? "";
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
