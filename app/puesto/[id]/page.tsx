import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import StandView from "@/components/StandView";
import { getStand } from "@/lib/catalog";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const stand = await getStand((await params).id);
  return { title: stand ? `Puesto de ${stand.seller.name}` : "Puesto no disponible" };
}

export default async function Puesto({ params }: { params: Params }) {
  const stand = await getStand((await params).id);
  if (!stand) notFound();
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-bg" aria-hidden="true" />
        <div className="wrap" style={{ paddingBottom: 48 }}>
          <StandView seller={stand.seller} items={stand.items} />
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
