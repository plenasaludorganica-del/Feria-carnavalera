import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import type { OwnProduct } from "@/lib/types";
import ProductForm from "../../ProductForm";

export const metadata: Metadata = { title: "Editar publicación" };

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/panel/editar/${id}`);
  const { data } = await supabase.from("products").select("*").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!data) notFound();
  return <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 64 }}><ProductForm userId={user.id} product={data as OwnProduct} /></div>;
}
