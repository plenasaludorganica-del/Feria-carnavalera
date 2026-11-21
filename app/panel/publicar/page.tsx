import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "Publicar" };

export default async function Publicar() {
  const { user, profile } = await requireUser("/panel/publicar");
  if (!profile.whatsapp) redirect("/panel");
  return <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 64 }}><ProductForm userId={user.id} /></div>;
}
